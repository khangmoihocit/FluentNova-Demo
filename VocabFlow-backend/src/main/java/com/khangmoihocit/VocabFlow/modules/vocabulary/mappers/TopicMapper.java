package com.khangmoihocit.VocabFlow.modules.vocabulary.mappers;

import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.TopicResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.Topic;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TopicMapper {
    TopicResponse toTopicResponse(Topic entity);
    List<TopicResponse> toTopicResponse(List<Topic> entities);

}
