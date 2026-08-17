package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import com.khangmoihocit.VocabFlow.modules.category.dtos.response.CategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.entities.Category;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoLessonResponse {
    Long id;
    String youtubeVideoId;
    Long youtubeChannelId;
    String title;
    String thumbnailUrl;
    String duration;
    String views;
    String difficultyLevel;
    Boolean isPublished;
    List<CategoryResponse> categories;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}