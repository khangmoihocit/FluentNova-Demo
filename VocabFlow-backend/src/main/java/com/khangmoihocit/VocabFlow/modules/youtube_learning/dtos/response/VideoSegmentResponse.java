package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VideoSegmentResponse {
    Long id;
    Integer segmentOrder;
    BigDecimal startTime;
    BigDecimal endTime;
    String englishText;
    String vietnameseTranslation;
    String ipa;
    Boolean lineBreakBefore;
    UserAttemptResponse userAttempt;
}
