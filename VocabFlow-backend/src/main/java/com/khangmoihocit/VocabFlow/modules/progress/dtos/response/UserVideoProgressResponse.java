package com.khangmoihocit.VocabFlow.modules.progress.dtos.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UserVideoProgressResponse {
    private Long id;
    private Long videoId;
    private BigDecimal avgDictationScore;
    private BigDecimal avgShadowingScore;
    private BigDecimal avgFillBlankScore;
    private BigDecimal avgQuizScore;
    private BigDecimal completionPercentage;
    private Integer totalLearningTime;
    private Integer dictationTimeSeconds;
    private Integer shadowingTimeSeconds;
    private Integer videoWatchTimeSeconds;
    private Integer fillBlankTimeSeconds;
    private Integer quizTimeSeconds;
    private String status;
    private Boolean isMastered;
    private Integer completedDictationSegments;
    private Integer completedShadowingSegments;
    private Boolean isDictationCompleted;
    private Boolean isShadowingCompleted;
    private Boolean isQuizCompleted;
    private Boolean fillBlankCompleted;
    private Boolean quizCompleted;
    private String lastActivityType;
    private LocalDateTime lastActivityAt;
    private LocalDateTime lastStudiedAt;
    private LocalDateTime updatedAt;
}
