package com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoSegmentResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VideoSegmentMapper {
    @Mapping(target = "userAttempt", ignore = true)
    VideoSegmentResponse toResponse(VideoSegment videoSegment);

    List<VideoSegmentResponse> toListResponse(List<VideoSegment> entities);
}
