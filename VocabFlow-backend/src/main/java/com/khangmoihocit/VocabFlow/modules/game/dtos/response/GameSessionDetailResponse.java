package com.khangmoihocit.VocabFlow.modules.game.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameSessionDetailResponse {
    Long sessionId;
    String gameType;
    Integer totalQuestions;
    BigDecimal finalAverageScore;
    LocalDateTime createdAt;
    List<SegmentDetail> segmentDetails;

    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SegmentDetail {
        Long segmentId;
        Long videoId;
        String englishText;
        Integer segmentScore;
        Integer hintCount;
        Integer replayCount;
        Integer wrongSubmitCount;
    }
}
