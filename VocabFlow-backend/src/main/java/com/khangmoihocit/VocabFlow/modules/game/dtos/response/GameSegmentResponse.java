package com.khangmoihocit.VocabFlow.modules.game.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameSegmentResponse {
    Long id;
    Integer segmentOrder;
    BigDecimal startTime;
    BigDecimal endTime;
    String englishText;
    String vietnameseTranslation;
    String ipa;
    String youtubeVideoId;
}
