package com.khangmoihocit.VocabFlow.modules.game.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameHistoryResponse {
    Long            sessionId;
    String          gameType;
    Integer         totalQuestions;
    BigDecimal      finalAverageScore;
    LocalDateTime   createdAt;
}
