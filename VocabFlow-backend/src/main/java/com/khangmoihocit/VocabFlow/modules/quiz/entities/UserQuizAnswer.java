package com.khangmoihocit.VocabFlow.modules.quiz.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_quiz_answers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_quiz_answer", columnNames = {"attempt_id", "quiz_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQuizAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserQuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoQuiz quiz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_option_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private QuizOption selectedOption;

    @Column(name = "user_answer_text", columnDefinition = "TEXT")
    private String userAnswerText;

    @Column(name = "is_correct")
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        if (this.answeredAt == null) {
            this.answeredAt = LocalDateTime.now();
        }
    }
}
