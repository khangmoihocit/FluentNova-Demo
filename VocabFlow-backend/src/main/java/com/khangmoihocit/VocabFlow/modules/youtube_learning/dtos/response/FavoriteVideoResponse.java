package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FavoriteVideoResponse {
    Long videoId;
    String youtubeVideoId;
    String title;
    String thumbnailUrl;
    String duration;
    String difficultyLevel;
    String channelName;
    String channelAvatarUrl;
    LocalDateTime favoritedAt;
}
