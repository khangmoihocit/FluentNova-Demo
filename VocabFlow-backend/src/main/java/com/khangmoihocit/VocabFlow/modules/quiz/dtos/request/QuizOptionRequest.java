package com.khangmoihocit.VocabFlow.modules.quiz.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuizOptionRequest {
    @NotBlank(message = "Nội dung đáp án không được để trống")
    private String optionText;
    private Boolean isCorrect;
    private Integer optionOrder = 0;
}
