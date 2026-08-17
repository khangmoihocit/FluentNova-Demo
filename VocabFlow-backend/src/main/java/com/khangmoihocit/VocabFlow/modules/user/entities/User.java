package com.khangmoihocit.VocabFlow.modules.user.entities;

import com.khangmoihocit.VocabFlow.core.enums.RoleEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.scheduling.support.SimpleTriggerContext;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, unique = true)
    String email;

    @Column(name = "password_hash", nullable = false)
    String passwordHash;

    @Column(name = "full_name")
    String fullName;

    @Column(nullable = false)
    @Builder.Default
    String role = RoleEnum.USER.toString();

    @Column(name = "anki_deck_name")
    @Builder.Default
    String ankiDeckName = "FluentNova Vocab";

    @Column(name = "anki_video_deck_name")
    @Builder.Default
    String ankiVideoDeckName = "FluentNova Video";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    Boolean isActive = true;

    @Column(name = "avatar_url")
    String avatarUrl;

    @Column(name = "provider")
    @Builder.Default
    String provider = "LOCAL";

    @Column(name = "provider_id")
    String providerId;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    Boolean isDeleted = false;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    Boolean isVerified = false;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    LocalDateTime updatedAt;
}