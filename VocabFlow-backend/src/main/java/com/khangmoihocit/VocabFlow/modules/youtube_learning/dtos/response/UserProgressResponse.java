package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProgressResponse{
    Long id;
    UUID userId;
    Long videoId;
    Boolean isDictationCompleted;
    Boolean isShadowingCompleted;
    BigDecimal avgDictationScore;
    BigDecimal avgShadowingScore;
    String status;
}