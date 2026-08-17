package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyGroupResponse {
    Long id;
    UUID userId;
    String name;
    boolean isDefault;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
