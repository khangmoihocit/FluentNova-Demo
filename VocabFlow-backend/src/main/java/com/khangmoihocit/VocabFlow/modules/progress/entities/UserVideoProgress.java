package com.khangmoihocit.VocabFlow.modules.progress.entities;

import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_video_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_video_progress", columnNames = {"user_id", "video_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVideoProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoLesson videoLesson;

    @Column(name = "avg_dictation_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal avgDictationScore = BigDecimal.ZERO;

    @Column(name = "avg_shadowing_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal avgShadowingScore = BigDecimal.ZERO;

    @Column(name = "avg_fill_blank_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal avgFillBlankScore = BigDecimal.ZERO;

    @Column(name = "avg_quiz_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal avgQuizScore = BigDecimal.ZERO;

    @Column(name = "completion_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal completionPercentage = BigDecimal.ZERO;

    @Column(name = "total_learning_time")
    @Builder.Default
    private Integer totalLearningTime = 0;

    @Column(name = "dictation_time_seconds")
    @Builder.Default
    private Integer dictationTimeSeconds = 0;

    @Column(name = "shadowing_time_seconds")
    @Builder.Default
    private Integer shadowingTimeSeconds = 0;

    @Column(name = "video_watch_time_seconds")
    @Builder.Default
    private Integer videoWatchTimeSeconds = 0;

    @Column(name = "fill_blank_time_seconds")
    @Builder.Default
    private Integer fillBlankTimeSeconds = 0;

    @Column(name = "quiz_time_seconds")
    @Builder.Default
    private Integer quizTimeSeconds = 0;

    @Column(length = 50)
    @Builder.Default
    private String status = "NOT_STARTED";

    @Column(name = "is_mastered")
    @Builder.Default
    private Boolean isMastered = false;

    @Column(name = "completed_dictation_segments")
    @Builder.Default
    private Integer completedDictationSegments = 0;

    @Column(name = "completed_shadowing_segments")
    @Builder.Default
    private Integer completedShadowingSegments = 0;

    @Column(name = "is_dictation_completed")
    @Builder.Default
    private Boolean isDictationCompleted = false;

    @Column(name = "is_shadowing_completed")
    @Builder.Default
    private Boolean isShadowingCompleted = false;

    @Column(name = "is_quiz_completed")
    @Builder.Default
    private Boolean isQuizCompleted = false;

    @Column(name = "fill_blank_completed")
    @Builder.Default
    private Boolean fillBlankCompleted = false;

    @Column(name = "quiz_completed")
    @Builder.Default
    private Boolean quizCompleted = false;

    @Column(name = "last_activity_type", length = 50)
    private String lastActivityType;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
