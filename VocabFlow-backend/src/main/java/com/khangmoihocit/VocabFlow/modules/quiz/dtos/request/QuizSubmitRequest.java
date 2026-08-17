package com.khangmoihocit.VocabFlow.modules.quiz.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class QuizSubmitRequest {
    private Integer durationSeconds = 0;

    @NotEmpty(message = "Danh sach cau tra loi khong duoc de trong")
    @Size(max = 300, message = "Danh sach cau tra loi qua lon")
    @Valid
    private List<QuizAnswerSubmitRequest> answers;
}
