package com.khangmoihocit.VocabFlow.modules.vocabulary.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "dictionary_words", uniqueConstraints = {
        @UniqueConstraint(name = "unique_word_pos", columnNames = {"word", "part_of_speech"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictionaryWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String word;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @Column(name = "pronunciation", length = 255)
    private String pronunciation;

    @Column(name = "meaning_vi", columnDefinition = "TEXT")
    private String meaningVi;

    @Column(name = "explanation_en", columnDefinition = "TEXT")
    private String explanationEn;

    @Column(name = "explanation_vi", columnDefinition = "TEXT")
    private String explanationVi;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "html_content", columnDefinition = "TEXT")
    private String htmlContent;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Quan hệ N-N với bảng topics thông qua bảng trung gian word_topics
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "word_topics",
            joinColumns = @JoinColumn(name = "word_id"),
            inverseJoinColumns = @JoinColumn(name = "topic_id")
    )
    @Builder.Default
    private Set<Topic> topics = new HashSet<>();
}