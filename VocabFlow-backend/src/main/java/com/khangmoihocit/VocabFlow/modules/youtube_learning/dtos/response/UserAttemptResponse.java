package com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAttemptResponse {
    String dictationUserText;
    Integer dictationScore;
    String shadowingUserText;
    Integer shadowingScore;
    Boolean isMastered;
}
