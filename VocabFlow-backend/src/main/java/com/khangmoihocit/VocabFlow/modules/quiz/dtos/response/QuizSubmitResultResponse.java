package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizSubmitResultResponse {
    private Long attemptId;
    private BigDecimal score;
    private Integer totalCorrect;
    private Integer totalQuestions;
    private LocalDateTime completedAt;
    private List<QuizAnswerResultResponse> answers;
}
