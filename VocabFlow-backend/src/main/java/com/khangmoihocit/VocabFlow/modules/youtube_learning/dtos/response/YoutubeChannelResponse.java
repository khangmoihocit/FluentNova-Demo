package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class YoutubeChannelResponse {
    Long id;
    String name;
    String youtubeChannelId;
    String avatarUrl;
    String description;
}
