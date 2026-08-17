package com.khangmoihocit.VocabFlow.modules.fill_blank.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_fill_blank_answers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_fill_blank_answer", columnNames = {"attempt_id", "blank_item_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFillBlankAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserFillBlankAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blank_item_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoFillBlankItem blankItem;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "normalized_user_answer", columnDefinition = "TEXT")
    private String normalizedUserAnswer;

    @Column(name = "is_correct")
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
