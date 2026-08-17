package com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.YoutubeChannelRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.YoutubeChannelResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface YoutubeChannelMapper {

    YoutubeChannel toEntity(YoutubeChannelRequest request);

    YoutubeChannelResponse toResponse(YoutubeChannel entity);

    List<YoutubeChannelResponse> toListResponse(List<YoutubeChannel> entities);
}
