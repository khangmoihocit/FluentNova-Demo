package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class UserQuizAttemptResponse {
    private Long id;
    private Long videoId;
    private BigDecimal score;
    private Integer totalCorrect;
    private Integer totalQuestions;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
