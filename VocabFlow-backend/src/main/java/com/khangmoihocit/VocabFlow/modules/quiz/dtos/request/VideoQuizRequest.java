package com.khangmoihocit.VocabFlow.modules.quiz.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class VideoQuizRequest {
    @NotBlank(message = "Câu hỏi không được để trống")
    private String questionText;
    
    private String explanation;
    private String questionType = "MULTIPLE_CHOICE";
    private String difficultyLevel = "MEDIUM";
    private Integer orderIndex = 0;
    private Boolean isPublished = true;
    
    @NotEmpty(message = "Cần ít nhất một đáp án")
    @Valid
    private List<QuizOptionRequest> options;
}
