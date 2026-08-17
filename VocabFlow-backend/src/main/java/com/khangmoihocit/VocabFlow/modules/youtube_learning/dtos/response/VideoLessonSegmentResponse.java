package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoLessonSegmentResponse {
    Long id;
    String youtubeVideoId;
    String title;
    String channelName;
}
