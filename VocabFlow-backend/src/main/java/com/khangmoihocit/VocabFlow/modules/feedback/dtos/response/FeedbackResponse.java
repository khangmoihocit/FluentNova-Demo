package com.khangmoihocit.VocabFlow.modules.feedback.dtos.response;

import com.khangmoihocit.VocabFlow.modules.feedback.enums.FeedbackType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeedbackResponse {
    Long id;
    FeedbackType type;
    LocalDateTime createdAt;
}
