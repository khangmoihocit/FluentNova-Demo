package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoLessonFilterResponse {
    Long id;
    String youtubeVideoId;
    String title;
    String thumbnailUrl;
    String duration;
//    String views;
    String difficultyLevel;
    LocalDateTime createdAt;
    UserProgressResponse userProgressResponse;
    Boolean isFavorited;

}