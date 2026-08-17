package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FillBlankItemAdminResponse {
    private Long id;
    private Long videoId;
    private Long segmentId;
    private Integer segmentOrder;
    private Integer blankOrder;
    private String answerText;
    private List<String> acceptedAnswers;
    private Integer startCharIndex;
    private Integer endCharIndex;
    private Integer tokenIndex;
    private String blankType;
    private String hint;
    private String difficultyLevel;
    private Integer points;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
