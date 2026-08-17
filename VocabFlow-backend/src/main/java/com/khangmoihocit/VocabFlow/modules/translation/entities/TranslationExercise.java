package com.khangmoihocit.VocabFlow.modules.translation.entities;

import com.khangmoihocit.VocabFlow.modules.translation.enums.DifficultyLevel;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "translation_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TranslationExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    TranslationTopic topic;

    @Column(name = "vietnamese_text", columnDefinition = "TEXT", nullable = false)
    String vietnameseText;

    @Column(name = "standard_english_answer", columnDefinition = "TEXT")
    String standardEnglishAnswer;

    @Column(name = "standard_explanation", columnDefinition = "TEXT")
    String standardExplanation;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level", length = 20, nullable = false)
    DifficultyLevel difficultyLevel = DifficultyLevel.MEDIUM;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}