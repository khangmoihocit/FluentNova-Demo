package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class VideoQuizAdminResponse {
    private Long id;
    private Long videoId;
    private String questionText;
    private String explanation;
    private String questionType;
    private String difficultyLevel;
    private Integer orderIndex;
    private Boolean isPublished;
    private List<QuizOptionAdminResponse> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
