package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoSegmentToolRequest {
    @NotNull
    Integer id;

    @NotNull
    BigDecimal start;

    @NotNull
    BigDecimal end;

    @NotNull
    String text;

    String vietnameseTranslation;
    String ipa;
    Boolean lineBreakBefore;
}
