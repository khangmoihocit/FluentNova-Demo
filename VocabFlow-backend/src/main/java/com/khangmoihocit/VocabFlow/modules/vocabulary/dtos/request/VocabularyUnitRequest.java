package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyUnitRequest {
    @NotBlank(message = "tên bộ từ vựng không được để trống.")
    String name;
    String description;
    Integer orderIndex;

    @NotNull(message = "Lỗi, group id là trống")
    Long vocabularyGroupId;
}
