package com.khangmoihocit.VocabFlow.modules.game.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameStatisticsResponse {
    Long   totalGames;
    Double overallAverageScore;
    Double bestDictationScore;
    Double bestShadowingScore;
}
