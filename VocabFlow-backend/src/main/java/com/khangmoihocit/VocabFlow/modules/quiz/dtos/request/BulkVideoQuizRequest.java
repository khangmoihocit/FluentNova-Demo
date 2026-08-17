package com.khangmoihocit.VocabFlow.modules.quiz.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class BulkVideoQuizRequest {
    @NotNull(message = "Video ID không được để trống")
    private Long videoId;

    @NotEmpty(message = "Danh sách câu hỏi không được trống")
    @Valid
    private List<VideoQuizRequest> quizzes;
}
