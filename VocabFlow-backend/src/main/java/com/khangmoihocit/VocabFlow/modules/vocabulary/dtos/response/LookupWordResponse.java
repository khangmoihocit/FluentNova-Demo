package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LookupWordResponse {
    Long dictionaryWordId;
    String word;
    String pronunciation;
    String htmlContent;
    String description;
}
