package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WordSavedFindResponse {
    Long id;
    UUID userId;
    LookupWordResponse lookupWordResponse;
    String sourceUrl;
    String ankiStatus;
    Long ankiNoteId;
}
