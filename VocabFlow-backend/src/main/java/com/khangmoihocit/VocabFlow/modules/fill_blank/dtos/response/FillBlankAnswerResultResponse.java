package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FillBlankAnswerResultResponse {
    private Long blankItemId;
    private Long segmentId;
    private Integer blankOrder;
    private String userAnswer;
    private String normalizedUserAnswer;
    private Boolean isCorrect;
    private String correctAnswer;
    private List<String> acceptedAnswers;
}
