package com.khangmoihocit.VocabFlow.modules.progress.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.DictationAutosaveRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.StudySessionRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.UpdateProgressRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.DictationAutosaveResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.ShadowingAutosaveRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.ShadowingAutosaveResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserStreakResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserVideoProgressResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningStatisticsResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningHistoryResponse;
import com.khangmoihocit.VocabFlow.modules.progress.services.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("${spring.api.prefix}/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PutMapping("/video")
    public ResponseEntity<ApiResponse<UserVideoProgressResponse>> updateVideoProgress(@Valid @RequestBody UpdateProgressRequest request) {
        UserVideoProgressResponse response = progressService.updateVideoProgress(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật tiến độ thành công"));
    }

    @GetMapping("/video/{videoId}")
    public ResponseEntity<ApiResponse<UserVideoProgressResponse>> getVideoProgress(@PathVariable Long videoId) {
        UserVideoProgressResponse response = progressService.getVideoProgress(videoId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy tiến độ thành công"));
    }

    @PostMapping("/study-session")
    public ResponseEntity<ApiResponse<Void>> logStudySession(@Valid @RequestBody StudySessionRequest request) {
        progressService.logStudySession(request);
        return ResponseEntity.ok(ApiResponse.success("Ghi nhận phiên học thành công"));
    }

    @GetMapping("/streak")
    public ResponseEntity<ApiResponse<UserStreakResponse>> getMyStreak() {
        UserStreakResponse response = progressService.getMyStreak();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin streak thành công"));
    }

    @PostMapping("/dictation/autosave")
    public ResponseEntity<ApiResponse<DictationAutosaveResponse>> autosaveDictation(@Valid @RequestBody DictationAutosaveRequest request) {
        DictationAutosaveResponse response = progressService.autosaveDictationProgress(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Autosave dictation progress thành công"));
    }

    @PostMapping("/shadowing/autosave")
    public ResponseEntity<ApiResponse<ShadowingAutosaveResponse>> autosaveShadowing(@Valid @RequestBody ShadowingAutosaveRequest request) {
        ShadowingAutosaveResponse response = progressService.autosaveShadowingProgress(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Autosave shadowing progress thành công"));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<LearningStatisticsResponse>> getLearningStatistics() {
        LearningStatisticsResponse response = progressService.getLearningStatistics();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thống kê học tập thành công"));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PageResponse<LearningHistoryResponse>>> getLearningHistory(
            @RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
            @RequestParam(name = "pageSize", defaultValue = "20") int pageSize) {
        PageResponse<LearningHistoryResponse> response = progressService.getLearningHistory(pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử học tập thành công"));
    }
    @GetMapping("/streak/calendar")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getStreakCalendar(
            @RequestParam(name = "month") int month,
            @RequestParam(name = "year") int year) {
        List<LocalDate> response = progressService.getStreakCalendar(month, year);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy dữ liệu lịch streak thành công"));
    }
}
