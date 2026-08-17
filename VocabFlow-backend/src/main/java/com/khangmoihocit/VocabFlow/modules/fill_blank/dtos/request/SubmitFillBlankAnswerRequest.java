package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubmitFillBlankAnswerRequest {
    @NotNull(message = "Blank item ID khong duoc de trong")
    private Long blankItemId;

    @Size(max = 500, message = "Cau tra loi qua dai")
    private String userAnswer;
}
