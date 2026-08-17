package com.khangmoihocit.VocabFlow.modules.progress.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ShadowingAutosaveRequest {
    @NotNull
    private Long videoId;

    @NotEmpty
    @Valid
    private List<ShadowingSegmentScoreDto> segments;

    private Integer studyTimeSeconds = 0;
}
