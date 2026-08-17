package com.khangmoihocit.VocabFlow.modules.progress.projections;

import java.math.BigDecimal;
import java.util.UUID;

public interface UserVideoProgressProjection {
    Long getId();
    UUID getUserId();
    Long getVideoId();
    Boolean getIsDictationCompleted();
    Boolean getIsShadowingCompleted();
    BigDecimal getAvgDictationScore();
    BigDecimal getAvgShadowingScore();
    String getStatus();
}
