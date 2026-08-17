package com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response;


import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TopicResponse {
    Long id;
    String name;
    String description;
    LocalDateTime createdAt;
}
