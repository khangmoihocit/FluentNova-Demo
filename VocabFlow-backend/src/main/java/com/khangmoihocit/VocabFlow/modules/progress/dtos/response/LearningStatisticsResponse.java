package com.khangmoihocit.VocabFlow.modules.progress.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningStatisticsResponse {
    private Long totalDictationDuration;
    private Long totalShadowingDuration;
    private Long totalListeningDuration;
    private Long totalFillBlankDuration;
    private Long totalQuizDuration;
    private Long grandTotalDuration;
    private Long dictationCompletedVideos;
    private Long shadowingCompletedVideos;
    private Long fillBlankCompletedVideos;
    private Long quizCompletedVideos;
    private Long totalActiveVideos;
    private Double avgDictationScore;
    private Double avgShadowingScore;
    private Double avgFillBlankScore;
    private Double avgQuizScore;
}
