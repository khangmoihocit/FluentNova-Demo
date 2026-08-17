package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoLessonRequest {
    @NotNull(message = "channel id is require")
    Long youtubeChannelId;

    @NotNull(message = "category is must be to 1")
    List<Long> categoryIds;

    @NotBlank(message = "youtube video id là bắt buộc")
    String youtubeVideoId;

    @NotBlank(message = "tiêu đề video không được để trống")
    String title;

    String thumbnailUrl;
    String duration;
    String views;

    String difficultyLevel;
    Boolean isPublished;
}
