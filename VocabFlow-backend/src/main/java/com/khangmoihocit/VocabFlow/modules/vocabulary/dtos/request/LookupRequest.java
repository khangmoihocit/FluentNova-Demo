package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LookupRequest {
    @NotBlank(message = "từ/cụm từ tìm kiếm không được để trống")
    String word;
    String contextSentence;
}
