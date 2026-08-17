package com.khangmoihocit.VocabFlow.modules.category.dtos.response;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonFilterResponse;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HomeCategoryResponse {
    Long categoryId;
    String categoryName;
    List<VideoLessonFilterResponse> videoLessonFilterResponses;
}
