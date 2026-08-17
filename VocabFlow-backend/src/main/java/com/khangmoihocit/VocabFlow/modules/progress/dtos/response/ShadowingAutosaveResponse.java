package com.khangmoihocit.VocabFlow.modules.progress.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ShadowingAutosaveResponse {
    private boolean isShadowingCompleted;
    private int completedSegments;
    private BigDecimal avgScore;
}
