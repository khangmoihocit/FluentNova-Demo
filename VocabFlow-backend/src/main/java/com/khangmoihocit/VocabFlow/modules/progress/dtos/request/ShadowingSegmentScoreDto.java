package com.khangmoihocit.VocabFlow.modules.progress.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ShadowingSegmentScoreDto {
    @NotNull
    private Long segmentId;
    
    @NotNull
    private Integer shadowingScore;

    private String shadowingUserText;
}
