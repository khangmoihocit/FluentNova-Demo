package com.khangmoihocit.VocabFlow.modules.youtube_learning.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.FavoriteVideoResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.UserFavoriteVideoService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/favorites")
public class FavoriteController {

    UserFavoriteVideoService userFavoriteVideoService;

    /**
     * Toggle favorite: thêm nếu chưa yêu thích, xoá nếu đã yêu thích.
     * Response trả về trạng thái mới: { isFavorited: true/false }
     */
    @PostMapping("/toggle/{videoId}")
    ResponseEntity<?> toggleFavorite(@PathVariable Long videoId) {
        boolean isFavorited = userFavoriteVideoService.toggleFavorite(videoId);
        ApiResponse<Map<String, Boolean>> response = ApiResponse.success(
                Map.of("isFavorited", isFavorited),
                isFavorited ? "Đã thêm vào yêu thích" : "Đã bỏ yêu thích"
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Kiểm tra trạng thái yêu thích của một video.
     */
    @GetMapping("/check/{videoId}")
    ResponseEntity<?> checkFavorite(@PathVariable Long videoId) {
        boolean isFavorited = userFavoriteVideoService.isFavorited(videoId);
        ApiResponse<Map<String, Boolean>> response = ApiResponse.success(
                Map.of("isFavorited", isFavorited)
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách video yêu thích (phân trang).
     */
    @GetMapping
    ResponseEntity<?> getFavoriteVideos(
            @RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
            @RequestParam(name = "pageSize", defaultValue = "12") int pageSize) {
        PageResponse<FavoriteVideoResponse> favorites =
                userFavoriteVideoService.getFavoriteVideos(pageNo, pageSize);
        ApiResponse<PageResponse<FavoriteVideoResponse>> response =
                ApiResponse.success(favorites, "Lấy danh sách yêu thích thành công");
        return ResponseEntity.ok(response);
    }

    /**
     * Đồng bộ toàn bộ các segment của một video yêu thích sang Anki.
     */
    @PostMapping("/sync-anki/{videoId}")
    public ResponseEntity<?> syncVideoToAnki(@PathVariable Long videoId) {
        // Kiểm tra kết nối nhanh tới AnkiConnect (Port 8765) để báo lỗi sớm nếu chưa mở Anki
        try (java.net.Socket socket = new java.net.Socket()) {
            socket.connect(new java.net.InetSocketAddress("127.0.0.1", 8765), 2000);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi: Anki chưa được mở hoặc AnkiConnect chưa cấu hình đúng port 8765!")
            );
        }

        try {
            int syncedCount = userFavoriteVideoService.syncVideoToAnki(videoId);
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("syncedSegments", syncedCount),
                    "Đồng bộ thành công " + syncedCount + " đoạn hội thoại sang Anki!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi đồng bộ Anki: " + e.getMessage())
            );
        }
    }
}
