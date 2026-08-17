package com.khangmoihocit.VocabFlow.modules.vocabulary.entities;

import com.khangmoihocit.VocabFlow.core.enums.AnkiStatus;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_saved_words", uniqueConstraints = {
        @UniqueConstraint(name = "unique_user_word", columnNames = {"user_id", "word_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSavedWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private DictionaryWord dictionaryWord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private VocabularyUnit vocabularyUnit;

    @Column(name = "context_sentence", columnDefinition = "TEXT")
    private String contextSentence;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "anki_status", length = 50)
    @Builder.Default
    private AnkiStatus ankiStatus = AnkiStatus.PENDING;

    @Column(name = "anki_note_id")
    private Long ankiNoteId; // ID thẻ Anki trả về sau khi đồng bộ thành công

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}