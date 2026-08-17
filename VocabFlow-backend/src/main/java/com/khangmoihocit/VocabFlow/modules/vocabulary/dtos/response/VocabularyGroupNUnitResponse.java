package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyGroupNUnitResponse {
    VocabularyGroupResponse vocabularyGroupResponse;
    List<VocabularyUnitResponse> vocabularyUnitResponseList;
}
