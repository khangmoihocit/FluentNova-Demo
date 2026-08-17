package com.khangmoihocit.VocabFlow.modules.quiz.dtos.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class QuizSubmissionRequest {
    @NotNull(message = "Video ID không được để trống")
    private Long videoId;

    @NotEmpty(message = "Bạn chưa chọn đáp án nào")
    private List<Long> selectedOptionIds;
}
