package com.khangmoihocit.VocabFlow.modules.game.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Data
public class GameSegmentResultDto {
    @NotNull
    private Long segmentId;

    private Integer hintCount;
    private Integer replayCount;
    private Integer wrongSubmitCount;
}
