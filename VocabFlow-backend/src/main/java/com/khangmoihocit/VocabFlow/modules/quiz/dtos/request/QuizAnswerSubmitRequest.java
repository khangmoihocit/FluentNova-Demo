package com.khangmoihocit.VocabFlow.modules.quiz.dtos.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuizAnswerSubmitRequest {
    @NotNull(message = "Quiz ID khong duoc de trong")
    private Long quizId;

    private Long selectedOptionId;
    @Size(max = 1000, message = "Cau tra loi qua dai")
    private String userAnswerText;
}
