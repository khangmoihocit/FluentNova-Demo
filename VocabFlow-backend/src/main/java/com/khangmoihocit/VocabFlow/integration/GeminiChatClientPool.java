package com.khangmoihocit.VocabFlow.integration;

import com.khangmoihocit.VocabFlow.core.exception.OurException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

/**
 * Pool quản lý nhiều Gemini API key với cơ chế tự động chuyển key khi bị lỗi.
 *
 * Thuật toán:
 * 1. Round-robin: mỗi request sẽ luân phiên qua các key để phân tải đều.
 * 2. Failover:    nếu key hiện tại trả về lỗi rate-limit / quota / 503,
 *                 key đó bị "đóng băng" (cooldown) và request được thử ngay
 *                 với key kế tiếp.
 * 3. Cooldown:    sau khoảng thời gian cấu hình (mặc định 60s), key tự động
 *                 được "giải đóng băng" và có thể dùng lại.
 */
@Slf4j(topic = "GEMINI KEY POOL")
public class GeminiChatClientPool {

    // -------------------------------------------------------------------------
    // Inner class đại diện cho một API key
    // -------------------------------------------------------------------------
    private static class KeyEntry {
        final ChatClient client;
        final String maskedKey;          // key đã che một phần, để log an toàn
        volatile long cooldownUntil = 0; // epoch-millis — 0 nghĩa là sẵn sàng
        volatile boolean permanentlyDisabled = false;

        KeyEntry(ChatClient client, String apiKey) {
            this.client = client;
            this.maskedKey = maskKey(apiKey);
        }

        boolean isAvailable() {
            return !permanentlyDisabled && System.currentTimeMillis() > cooldownUntil;
        }

        void markFailed(long cooldownMs) {
            this.cooldownUntil = System.currentTimeMillis() + cooldownMs;
        }

        void markPermanentlyDisabled() {
            this.permanentlyDisabled = true;
            this.cooldownUntil = Long.MAX_VALUE;
        }

        /** Che giấu key: chỉ hiện 4 ký tự đầu + 4 ký tự cuối */
        private static String maskKey(String key) {
            if (key == null || key.length() < 8) return "****";
            return key.substring(0, 4) + "****" + key.substring(key.length() - 4);
        }
    }

    // -------------------------------------------------------------------------
    // Fields
    // -------------------------------------------------------------------------
    private final List<KeyEntry> entries;
    private final long cooldownMs;

    /**
     * Con trỏ round-robin — tự tăng sau mỗi lần gọi thành công để
     * phân tải đều giữa các key.
     */
    private final AtomicInteger roundRobinIndex = new AtomicInteger(0);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    public GeminiChatClientPool(List<ChatClient> clients, List<String> apiKeys, long cooldownSeconds) {
        this.cooldownMs = cooldownSeconds * 1000L;
        this.entries = new ArrayList<>(clients.size());
        for (int i = 0; i < clients.size(); i++) {
            entries.add(new KeyEntry(clients.get(i), apiKeys.get(i)));
        }
        log.info("Khởi tạo pool với {} Gemini API key, cooldown mỗi key = {}s", clients.size(), cooldownSeconds);
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Thực thi {@code operation} trên một ChatClient khả dụng.
    * Nếu key bị lỗi tạm thời, tự động thử key kế tiếp.
    * Nếu key bị expired/invalid, vô hiệu hóa key đó vĩnh viễn rồi thử key khác.
     *
     * @param operation hàm nhận ChatClient và trả về kết quả T
     * @throws OurException nếu tất cả key đều đang bị đóng băng
     */
    public <T> T callWithFallback(Function<ChatClient, T> operation) {
        int total = entries.size();
        // Lấy vị trí bắt đầu theo vòng xoay (round-robin)
        int startIndex = Math.abs(roundRobinIndex.getAndIncrement() % total);

        for (int attempt = 0; attempt < total; attempt++) {
            int idx = (startIndex + attempt) % total;
            KeyEntry entry = entries.get(idx);

            if (!entry.isAvailable()) {
                log.debug("Key [{}] đang cooldown, bỏ qua.", entry.maskedKey);
                continue;
            }

            try {
                T result = operation.apply(entry.client);
                // Thành công → cập nhật con trỏ để key tiếp theo được dùng lần sau
                roundRobinIndex.set((idx + 1) % total);
                log.debug("Gọi thành công với key [{}].", entry.maskedKey);
                return result;

            } catch (Exception e) {
                if (isPermanentKeyError(e)) {
                    log.error("Key [{}] đã hết hạn hoặc không hợp lệ ({}), vô hiệu hóa vĩnh viễn và chuyển key khác.",
                            entry.maskedKey, extractShortReason(e));
                    entry.markPermanentlyDisabled();
                    roundRobinIndex.set((idx + 1) % total);
                } else if (isRetryableError(e)) {
                    log.warn("Key [{}] bị rate-limit/overload tạm thời ({}), đang chuyển sang key tiếp theo...",
                            entry.maskedKey, extractShortReason(e));
                    entry.markFailed(cooldownMs);
                    // Cập nhật con trỏ để bỏ qua key vừa fail
                    roundRobinIndex.set((idx + 1) % total);
                } else {
                    // Lỗi không liên quan đến quota/rate-limit → ném ra ngay
                    throw e;
                }
            }
        }

        // Tất cả key đều đang cooldown — tính thời gian chờ gần nhất
        long earliestAvailable = entries.stream()
            .filter(e -> !e.permanentlyDisabled)
                .mapToLong(e -> e.cooldownUntil)
                .min()
                .orElse(System.currentTimeMillis());
        long waitSeconds = Math.max(1, (earliestAvailable - System.currentTimeMillis()) / 1000);

        long permanentlyDisabledCount = entries.stream().filter(e -> e.permanentlyDisabled).count();

        if (permanentlyDisabledCount == total) {
            log.error("Tất cả {} Gemini API key đều không hợp lệ hoặc đã hết hạn.", total);
            throw new OurException("Tất cả Gemini API key đều đã hết hạn hoặc không hợp lệ. Hãy thay key mới.");
        }

        log.error("Tất cả {} Gemini API key đều đang bị giới hạn. Key sớm nhất khả dụng sau ~{}s.",
                total, waitSeconds);
        throw new OurException(
                "Hệ thống đang quá tải. Vui lòng thử lại sau khoảng " + waitSeconds + " giây."
        );
    }

    /** Số key đang hoạt động (không trong cooldown) */
    public int getActiveKeyCount() {
        long now = System.currentTimeMillis();
        return (int) entries.stream().filter(e -> now > e.cooldownUntil).count();
    }

    /** Tổng số key được đăng ký */
    public int getTotalKeyCount() {
        return entries.size();
    }

    /** Số key bị vô hiệu hóa vĩnh viễn */
    public int getPermanentlyDisabledKeyCount() {
        return (int) entries.stream().filter(e -> e.permanentlyDisabled).count();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Nhận diện lỗi có thể retry bằng cách chuyển key:
     * - HTTP 429 Too Many Requests  (rate-limit)
     * - HTTP 503 Service Unavailable (overloaded)
     * - RESOURCE_EXHAUSTED / quota exceeded
     */
    private boolean isRetryableError(Exception e) {
        String fullMessage = buildFullCauseMessage(e).toLowerCase();
        return fullMessage.contains("429")
                || fullMessage.contains("resource_exhausted")
                || fullMessage.contains("ratelimitexceeded")
                || fullMessage.contains("rate limit")
                || fullMessage.contains("quota")
                || fullMessage.contains("too many requests")
                || fullMessage.contains("503")
                || fullMessage.contains("overloaded")
                || fullMessage.contains("service_unavailable");
    }

    /**
     * Nhận diện lỗi key hỏng vĩnh viễn:
     * - API key expired
     * - invalid API key
     * - revoked / unauthorized
     */
    private boolean isPermanentKeyError(Exception e) {
        String fullMessage = buildFullCauseMessage(e).toLowerCase();
        return fullMessage.contains("api key expired")
                || fullMessage.contains("expired api key")
                || fullMessage.contains("invalid api key")
                || fullMessage.contains("api key not valid")
                || fullMessage.contains("invalid_argument")
                || fullMessage.contains("permission denied")
                || fullMessage.contains("unauthorized")
                || fullMessage.contains("forbidden")
                || fullMessage.contains("revoked");
    }

    /** Gộp message của toàn bộ cause chain */
    private String buildFullCauseMessage(Throwable t) {
        StringBuilder sb = new StringBuilder();
        while (t != null) {
            if (t.getMessage() != null) {
                sb.append(t.getMessage()).append(' ');
            }
            t = t.getCause();
        }
        return sb.toString();
    }

    /** Trích lý do ngắn gọn để log */
    private String extractShortReason(Exception e) {
        if (e.getMessage() != null && e.getMessage().length() > 120) {
            return e.getMessage().substring(0, 120) + "...";
        }
        return e.getMessage();
    }
}
