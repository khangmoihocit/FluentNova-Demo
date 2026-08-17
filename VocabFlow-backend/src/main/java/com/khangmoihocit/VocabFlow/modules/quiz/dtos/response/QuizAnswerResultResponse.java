package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizAnswerResultResponse {
    private Long quizId;
    private Long selectedOptionId;
    private String userAnswerText;
    private Boolean isCorrect;
    private Long correctOptionId;
    private String explanation;
}
