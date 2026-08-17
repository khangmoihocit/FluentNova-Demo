package com.khangmoihocit.VocabFlow.modules.progress.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateProgressRequest {
    @NotNull(message = "Video ID không được để trống")
    private Long videoId;

    private BigDecimal avgDictationScore;
    private BigDecimal avgShadowingScore;
    private BigDecimal avgFillBlankScore;
    private BigDecimal avgQuizScore;
    private BigDecimal completionPercentage;
    private Integer dictationTimeSeconds;
    private Integer shadowingTimeSeconds;
    private Integer videoWatchTimeSeconds;
    private Integer fillBlankTimeSeconds;
    private Integer quizTimeSeconds;
    private String status;
    private Boolean isMastered;
    private Boolean fillBlankCompleted;
    private Boolean quizCompleted;
}
