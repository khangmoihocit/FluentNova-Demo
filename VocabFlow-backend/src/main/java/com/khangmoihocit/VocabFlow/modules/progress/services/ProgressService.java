package com.khangmoihocit.VocabFlow.modules.progress.services;

import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.StudySessionRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.UpdateProgressRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserStreakResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserVideoProgressResponse;

import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.DictationAutosaveRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.DictationAutosaveResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.ShadowingAutosaveRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.ShadowingAutosaveResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningStatisticsResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningHistoryResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;

import java.time.LocalDate;
import java.util.List;

public interface ProgressService {
    DictationAutosaveResponse autosaveDictationProgress(DictationAutosaveRequest request);
    ShadowingAutosaveResponse autosaveShadowingProgress(ShadowingAutosaveRequest request);
    UserVideoProgressResponse updateVideoProgress(UpdateProgressRequest request);
    UserVideoProgressResponse getVideoProgress(Long videoId);
    void logStudySession(StudySessionRequest request);
    UserStreakResponse getMyStreak();
    LearningStatisticsResponse getLearningStatistics();
    PageResponse<LearningHistoryResponse> getLearningHistory(int pageNo, int pageSize);
    List<LocalDate> getStreakCalendar(int month, int year);
}
