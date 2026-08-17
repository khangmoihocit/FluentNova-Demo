package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSavedWordResponse {
    Long userSavedWordId;
}
