package com.khangmoihocit.VocabFlow.modules.youtube_learning.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.khangmoihocit.VocabFlow.modules.category.entities.Category;

@Entity
@Table(name = "video_lessons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoLesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    @ToString.Exclude // Tránh lỗi lặp vô hạn khi log
    private YoutubeChannel channel;

    @Column(name = "youtube_video_id", nullable = false, unique = true)
    private String youtubeVideoId;

    @Column(nullable = false)
    private String title;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "duration")
    private String duration;

    @Column(name = "views")
    private String views;

    @Column(name = "difficulty_level", length = 20)
    @Builder.Default
    private String difficultyLevel = "A1";

    @Column(name = "is_published")
    @Builder.Default
    private Boolean isPublished = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToMany
    @JoinTable(
        name = "video_category_mapping",
        joinColumns = @JoinColumn(name = "video_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}