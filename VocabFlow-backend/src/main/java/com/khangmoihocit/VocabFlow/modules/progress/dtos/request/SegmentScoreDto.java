package com.khangmoihocit.VocabFlow.modules.progress.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SegmentScoreDto {
    @NotNull
    private Long segmentId;
    
    @NotNull
    private Integer dictationScore;

    private String dictationUserText;

    private Integer hintCount;
    private Integer replayCount;
    private Integer wrongSubmitCount;
}
