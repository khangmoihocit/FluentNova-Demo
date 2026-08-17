package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSaveWordRequest {
    @NotNull(message = "từ/cụm từ không được để trống")
    Long dictionaryWordId;
    Long vocabularyUnitId;
    String sourceSentence;
    String sourceUrl;
}
