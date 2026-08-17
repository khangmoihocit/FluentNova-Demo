package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LookupResponse {
    Long dictionaryWordId;
    String word;
    String partOfSpeech;
    String phonetic;
    String meaningVi;
//    String explanationEn;
    String explanationVi;
    String exampleSentence;
    String audioUrl;
}
