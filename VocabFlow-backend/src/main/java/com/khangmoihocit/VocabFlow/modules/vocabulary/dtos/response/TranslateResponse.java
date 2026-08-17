package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TranslateResponse {
    private String originalText;
    private String translatedText;
}
