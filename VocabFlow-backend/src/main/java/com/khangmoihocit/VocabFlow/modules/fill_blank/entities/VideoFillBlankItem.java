package com.khangmoihocit.VocabFlow.modules.fill_blank.entities;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "video_fill_blank_items", uniqueConstraints = {
        @UniqueConstraint(name = "uq_video_fill_blank_order", columnNames = {"video_id", "blank_order"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoFillBlankItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoLesson videoLesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VideoSegment segment;

    @Column(name = "blank_order", nullable = false)
    private Integer blankOrder;

    @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
    private String answerText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "accepted_answers", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> acceptedAnswers = new ArrayList<>();

    @Column(name = "start_char_index")
    private Integer startCharIndex;

    @Column(name = "end_char_index")
    private Integer endCharIndex;

    @Column(name = "token_index")
    private Integer tokenIndex;

    @Column(name = "blank_type", length = 50)
    @Builder.Default
    private String blankType = "WORD";

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(name = "difficulty_level", length = 20)
    @Builder.Default
    private String difficultyLevel = "MEDIUM";

    @Column
    @Builder.Default
    private Integer points = 1;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.acceptedAnswers == null) {
            this.acceptedAnswers = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.acceptedAnswers == null) {
            this.acceptedAnswers = new ArrayList<>();
        }
    }
}
