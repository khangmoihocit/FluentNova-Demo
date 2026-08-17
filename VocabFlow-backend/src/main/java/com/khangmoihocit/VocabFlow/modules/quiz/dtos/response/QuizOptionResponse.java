package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Data;

@Data
public class QuizOptionResponse {
    private Long id;
    private String optionText;
    private Integer optionOrder;
}
