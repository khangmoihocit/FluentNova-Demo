package com.khangmoihocit.VocabFlow.modules.vocabulary.mappers;

import com.khangmoihocit.VocabFlow.core.enums.AnkiStatus;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.UserSavedWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.WordSavedFindResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.UserSavedWord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring", uses = {DictionaryWordMapper.class})
public interface UserSavedWordMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "dictionaryWord", target = "lookupWordResponse")
    @Mapping(source = "ankiStatus", target = "ankiStatus", qualifiedByName = "enumToString")
    WordSavedFindResponse toWordSavedFindResponse(UserSavedWord entity);

    List<WordSavedFindResponse> toListWordSavedFindResponse(List<UserSavedWord> entities);

    @Named("enumToString")
    default String enumToString(AnkiStatus ankiStatus) {
        return ankiStatus != null ? ankiStatus.name() : null;
    }
}
