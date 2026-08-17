package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabularyGroupRequest {
    @NotBlank(message = "tên bộ từ vựng không được để trống")
    String name;
}
