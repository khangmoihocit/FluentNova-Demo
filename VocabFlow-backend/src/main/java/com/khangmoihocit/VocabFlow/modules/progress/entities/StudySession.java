package com.khangmoihocit.VocabFlow.modules.progress.entities;

import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_sessions", indexes = {
        @Index(name = "idx_study_sessions_user_date", columnList = "user_id, session_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoLesson videoLesson;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
