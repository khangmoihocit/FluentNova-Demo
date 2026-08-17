package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
public class TranslateRequest {
    @NotBlank(message = "Văn bản không được để trống")
    private String text;
}