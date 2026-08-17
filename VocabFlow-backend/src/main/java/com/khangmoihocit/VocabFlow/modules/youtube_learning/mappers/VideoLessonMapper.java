package com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoLessonRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonFilterResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VideoLessonMapper {
    VideoLesson toEntity(VideoLessonRequest request);

    @Mapping(target = "youtubeChannelId", source = "channel.id")
    @Mapping(target = "categories", ignore = true)
    VideoLessonResponse toResponse(VideoLesson entity);

    List<VideoLessonResponse> toListResponse(List<VideoLesson> entities);

    VideoLessonFilterResponse toFilterResponse(VideoLesson entity);
    List<VideoLessonFilterResponse> toListFilterResponse(List<VideoLesson> entities);
}
