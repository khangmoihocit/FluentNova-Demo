package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizOptionAdminResponse {
    private Long id;
    private String optionText;
    private Boolean isCorrect;
    private Integer optionOrder;
}
