package com.khangmoihocit.VocabFlow.modules.quiz.dtos.response;

import lombok.Data;
import java.util.List;

@Data
public class VideoQuizResponse {
    private Long id;
    private String questionText;
    private String explanation;
    private String questionType;
    private String difficultyLevel;
    private Integer orderIndex;
    private List<QuizOptionResponse> options;
}
