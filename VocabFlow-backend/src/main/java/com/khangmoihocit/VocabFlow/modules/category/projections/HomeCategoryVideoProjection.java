package com.khangmoihocit.VocabFlow.modules.category.projections;

import java.time.LocalDateTime;

public interface HomeCategoryVideoProjection {
    Long getCategoryId();
    String getCategoryName();

    Long getVideoId();
    String getYoutubeVideoId();
    String getVideoTitle();
    String getThumbnailUrl();
    String getDuration();
    String getDifficultyLevel();
    LocalDateTime getCreatedAt();
}
