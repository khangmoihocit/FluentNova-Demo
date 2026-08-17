package com.khangmoihocit.VocabFlow.modules.quiz.entities;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "video_quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoQuiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoLesson videoLesson;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "question_type", length = 50)
    @Builder.Default
    private String questionType = "MULTIPLE_CHOICE";

    @Column(name = "difficulty_level", length = 20)
    @Builder.Default
    private String difficultyLevel = "MEDIUM";

    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = true;

    @OneToMany(mappedBy = "videoQuiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<QuizOption> options = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.questionType == null) {
            this.questionType = "MULTIPLE_CHOICE";
        }
        if (this.difficultyLevel == null) {
            this.difficultyLevel = "MEDIUM";
        }
        if (this.orderIndex == null) {
            this.orderIndex = 0;
        }
        if (this.isPublished == null) {
            this.isPublished = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
