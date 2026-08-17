package com.khangmoihocit.VocabFlow.modules.game.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GameGenerateResponse {
    Long sessionId;
    String gameType;
    Integer totalQuestions;
    List<GameSegmentResponse> segments;
}
