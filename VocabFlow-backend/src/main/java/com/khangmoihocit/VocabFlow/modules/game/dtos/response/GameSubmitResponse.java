package com.khangmoihocit.VocabFlow.modules.game.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameSubmitResponse {
    Long sessionId;
    BigDecimal finalAverageScore;
    List<SegmentScoreDetail> segmentDetails;

    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SegmentScoreDetail {
        Long segmentId;
        Integer segmentScore;
        Integer hintCount;
        Integer replayCount;
        Integer wrongSubmitCount;
    }
}
