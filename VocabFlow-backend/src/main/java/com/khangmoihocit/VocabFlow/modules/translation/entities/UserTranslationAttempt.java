package com.khangmoihocit.VocabFlow.modules.translation.entities;

import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_translation_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserTranslationAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    TranslationExercise exercise;

    @Column(name = "user_input", columnDefinition = "TEXT", nullable = false)
    String userInput;

    @Column(name = "is_ai_used")
    Boolean isAiUsed;

    @Column(name = "is_correct")
    Boolean isCorrect;

    @Column(name = "ai_score")
    Integer aiScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    String aiFeedback;

    @Column(name = "ai_better_version", columnDefinition = "TEXT")
    String aiBetterVersion;

    @Column(name = "submitted_at", updatable = false)
    LocalDateTime submittedAt;

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}