package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class UserFillBlankAttemptResponse {
    private Long id;
    private Long videoId;
    private BigDecimal score;
    private Integer totalBlanks;
    private Integer totalCorrect;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
