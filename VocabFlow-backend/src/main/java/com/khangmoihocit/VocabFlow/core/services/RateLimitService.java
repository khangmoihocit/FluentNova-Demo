package com.khangmoihocit.VocabFlow.core.services;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {
    private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public void check(String key, int maxAttempts, Duration window) {
        Instant now = Instant.now();
        Instant threshold = now.minus(window);
        Deque<Instant> queue = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());

        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst().isBefore(threshold)) {
                queue.removeFirst();
            }

            if (queue.size() >= maxAttempts) {
                throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
            }

            queue.addLast(now);
        }
    }
}
