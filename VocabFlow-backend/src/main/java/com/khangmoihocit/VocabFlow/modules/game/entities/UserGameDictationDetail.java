package com.khangmoihocit.VocabFlow.modules.game.entities;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_game_dictation_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGameDictationDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @ToString.Exclude
    private UserGameSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "segment_id", nullable = false)
    @ToString.Exclude
    private VideoSegment segment;

    @Column(name = "hint_count")
    @Builder.Default
    private Integer hintCount = 0;

    @Column(name = "replay_count")
    @Builder.Default
    private Integer replayCount = 0;

    @Column(name = "wrong_submit_count")
    @Builder.Default
    private Integer wrongSubmitCount = 0;

    @Column(name = "segment_score")
    private Integer segmentScore;
}
