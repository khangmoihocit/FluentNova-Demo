package com.khangmoihocit.VocabFlow.modules.vocabulary.mappers;

import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.VocabularyUnitRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyUnitResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyUnit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VocabularyUnitMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "vocabularyGroup", ignore = true)
    VocabularyUnit toVocabularyUnit(VocabularyUnitRequest request);

    @Mapping(source = "vocabularyGroup.id", target = "vocabularyGroupId")
    VocabularyUnitResponse toVocabularyUnitResponse(VocabularyUnit entity);

    List<VocabularyUnitResponse> toVocabularyUnitListResponse(List<VocabularyUnit> entities);


}
