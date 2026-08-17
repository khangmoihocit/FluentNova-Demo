package com.khangmoihocit.VocabFlow.modules.vocabulary.mappers;

import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.DictionaryWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.LookupResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.LookupWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.DictionaryWord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DictionaryWordMapper {

    @Mapping(source = "id", target = "dictionaryWordId") //map khác trường
    @Mapping(source = "pronunciation", target = "phonetic")
    LookupResponse toLookupResponse(DictionaryWord word);

    List<DictionaryWordResponse> toListDictionWordResponse(List<DictionaryWord> entities);

    @Mapping(source = "id", target = "dictionaryWordId")
    LookupWordResponse toLookupWordResponse(DictionaryWord word);
}
