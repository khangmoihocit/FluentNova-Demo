package com.khangmoihocit.VocabFlow.modules.progress.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningHistoryResponse {
    private Long id;
    private Long videoId;
    private String videoTitle;
    private String videoThumbnailUrl;
    private String channelName;
    private String difficultyLevel;
    private String status;
    private Boolean isDictationCompleted;
    private Boolean isShadowingCompleted;
    private Integer completedDictationSegments;
    private Integer completedShadowingSegments;
    private BigDecimal avgDictationScore;
    private BigDecimal avgShadowingScore;
    private BigDecimal avgFillBlankScore;
    private BigDecimal avgQuizScore;
    private Integer dictationTimeSeconds;
    private Integer shadowingTimeSeconds;
    private Integer fillBlankTimeSeconds;
    private Integer quizTimeSeconds;
    private Integer videoWatchTimeSeconds;
    private Integer totalLearningTime;
    private Boolean fillBlankCompleted;
    private Boolean quizCompleted;
    private String lastActivityType;
    private LocalDateTime lastActivityAt;
    private LocalDateTime lastStudiedAt;
    private Boolean isFavorited;
}
