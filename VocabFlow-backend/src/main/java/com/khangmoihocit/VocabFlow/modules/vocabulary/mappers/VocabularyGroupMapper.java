package com.khangmoihocit.VocabFlow.modules.vocabulary.mappers;

import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyGroupResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VocabularyGroupMapper {
    VocabularyGroupResponse toVocabularyResponse(VocabularyGroup entity);
    List<VocabularyGroupResponse> toVocabularyResponse(List<VocabularyGroup> entities);
}
