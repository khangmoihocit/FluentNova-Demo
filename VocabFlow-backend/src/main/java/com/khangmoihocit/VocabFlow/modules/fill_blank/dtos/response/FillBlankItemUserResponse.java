package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FillBlankItemUserResponse {
    private Long id;
    private Long segmentId;
    private Integer blankOrder;
    private Integer startCharIndex;
    private Integer endCharIndex;
    private Integer tokenIndex;
    private String blankType;
    private String hint;
    private String difficultyLevel;
    private Integer points;
}
