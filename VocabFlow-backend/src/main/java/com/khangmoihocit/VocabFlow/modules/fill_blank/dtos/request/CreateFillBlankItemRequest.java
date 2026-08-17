package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class CreateFillBlankItemRequest {
    @NotNull(message = "Segment ID khong duoc de trong")
    private Long segmentId;

    @NotNull(message = "Thu tu blank khong duoc de trong")
    private Integer blankOrder;

    @NotBlank(message = "Dap an khong duoc de trong")
    private String answerText;

    private List<String> acceptedAnswers;
    private Integer startCharIndex;
    private Integer endCharIndex;
    private Integer tokenIndex;
    private String blankType = "WORD";
    private String hint;
    private String difficultyLevel = "MEDIUM";

    @Positive(message = "Diem phai lon hon 0")
    private Integer points = 1;

    private Boolean isActive = true;
}
