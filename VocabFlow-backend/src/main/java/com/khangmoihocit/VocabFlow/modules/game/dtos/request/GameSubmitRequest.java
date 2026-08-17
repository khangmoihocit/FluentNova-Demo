package com.khangmoihocit.VocabFlow.modules.game.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class GameSubmitRequest {
    @NotEmpty
    @Valid
    private List<GameSegmentResultDto> results;
}
