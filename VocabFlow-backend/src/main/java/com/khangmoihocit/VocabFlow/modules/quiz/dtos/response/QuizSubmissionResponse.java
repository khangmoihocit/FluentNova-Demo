package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class QuizSubmissionResponse {
    private Long attemptId;
    private BigDecimal score;
    private Integer totalCorrect;
    private Integer totalQuestions;
    private LocalDateTime completedAt;
}
