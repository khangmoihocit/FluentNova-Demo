package com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.keys;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFavoriteVideoKey implements Serializable {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "video_id")
    private Long videoId;
}
