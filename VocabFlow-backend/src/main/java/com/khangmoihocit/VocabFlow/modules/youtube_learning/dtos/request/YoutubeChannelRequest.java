package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class YoutubeChannelRequest {
    String name;
    String youtubeChannelId;
    String avatarUrl;
    String description;
}
