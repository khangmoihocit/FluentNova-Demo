package com.khangmoihocit.VocabFlow.modules.quiz.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.services.RateLimitService;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.*;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.quiz.services.QuizService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.Duration;

@RestController
@RequestMapping("${spring.api.prefix}/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final RateLimitService rateLimitService;

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> addQuizzesToVideo(@Valid @RequestBody BulkVideoQuizRequest request) {
        quizService.addQuizzesToVideo(request);
        return ResponseEntity.ok(ApiResponse.success("Them cau hoi thanh cong"));
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success("Xoa cau hoi thanh cong"));
    }

    @GetMapping("/video/{videoId}")
    public ResponseEntity<ApiResponse<List<VideoQuizResponse>>> getQuizzesByVideo(@PathVariable Long videoId) {
        List<VideoQuizResponse> quizzes = quizService.getQuizzesByVideoId(videoId);
        return ResponseEntity.ok(ApiResponse.success(quizzes, quizzes.isEmpty() ? "Chua co cau hoi nao" : "Lay danh sach thanh cong"));
    }

    @PostMapping("/video/{videoId}/submit")
    public ResponseEntity<ApiResponse<QuizSubmitResultResponse>> submitQuiz(
            @PathVariable Long videoId,
            @Valid @RequestBody QuizSubmitRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.check("quiz:submit:" + clientKey(httpRequest) + ":" + videoId, 1, Duration.ofSeconds(3));
        return ResponseEntity.ok(ApiResponse.success(quizService.submitQuiz(videoId, request), "Nop bai quiz thanh cong"));
    }

    @GetMapping("/video/{videoId}/attempts")
    public ResponseEntity<ApiResponse<List<UserQuizAttemptResponse>>> getAttempts(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(quizService.getUserAttempts(videoId), "Lay lich su quiz thanh cong"));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<QuizSubmissionResponse>> submitQuizAttempt(@Valid @RequestBody QuizSubmissionRequest request) {
        QuizSubmissionResponse result = quizService.submitQuizAttempt(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Nop bai thanh cong"));
    }

    @GetMapping("/admin/video/{videoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<VideoQuizAdminResponse>>> getAdminQuizzes(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(quizService.getAdminQuizzesByVideoId(videoId), "Lay danh sach quiz admin thanh cong"));
    }

    @PostMapping("/admin/video/{videoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VideoQuizAdminResponse>> createQuiz(
            @PathVariable Long videoId,
            @Valid @RequestBody VideoQuizRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quizService.createQuiz(videoId, request), "Tao cau hoi thanh cong"));
    }

    @PutMapping("/admin/{quizId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VideoQuizAdminResponse>> updateQuiz(
            @PathVariable Long quizId,
            @Valid @RequestBody VideoQuizRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quizService.updateQuiz(quizId, request), "Cap nhat cau hoi thanh cong"));
    }

    @DeleteMapping("/admin/{quizId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAdminQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok(ApiResponse.success("Xoa cau hoi thanh cong"));
    }

    @PostMapping("/admin/{quizId}/options")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizOptionAdminResponse>> createOption(
            @PathVariable Long quizId,
            @Valid @RequestBody QuizOptionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quizService.createOption(quizId, request), "Tao dap an thanh cong"));
    }

    @PutMapping("/admin/options/{optionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuizOptionAdminResponse>> updateOption(
            @PathVariable Long optionId,
            @Valid @RequestBody QuizOptionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(quizService.updateOption(optionId, request), "Cap nhat dap an thanh cong"));
    }

    @DeleteMapping("/admin/options/{optionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteOption(@PathVariable Long optionId) {
        quizService.deleteOption(optionId);
        return ResponseEntity.ok(ApiResponse.success("Xoa dap an thanh cong"));
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
