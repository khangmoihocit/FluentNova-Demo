package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FillBlankSubmitResultResponse {
    private Long attemptId;
    private BigDecimal score;
    private Integer totalBlanks;
    private Integer totalCorrect;
    private LocalDateTime completedAt;
    private List<FillBlankAnswerResultResponse> answers;
}
