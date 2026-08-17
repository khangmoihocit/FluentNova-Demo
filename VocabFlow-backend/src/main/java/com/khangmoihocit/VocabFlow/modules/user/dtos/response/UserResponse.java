package com.khangmoihocit.VocabFlow.modules.user.dtos.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    UUID id;
    String email;
    String fullName;
    String role;
    String ankiDeckName;
    String ankiVideoDeckName;
    Boolean isActive;
    String avatarUrl;
    String provider;
    String providerId;
    Boolean isDeleted;
    Boolean isVerified;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
