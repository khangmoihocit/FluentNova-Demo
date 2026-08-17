package com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.UserSegmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserSegmentAttemptRepository extends JpaRepository<UserSegmentAttempt, Long> {
    List<UserSegmentAttempt> findByUserIdAndSegmentIdIn(UUID userId, List<Long> segmentIds);

    @Query("SELECT usa FROM UserSegmentAttempt usa WHERE usa.user.id = :userId AND usa.segment.video.id = :videoId")
    List<UserSegmentAttempt> findByUserIdAndVideoId(@Param("userId") UUID userId, @org.springframework.data.repository.query.Param("videoId") Long videoId);

    @Query("SELECT COUNT(DISTINCT usa.segment.id) FROM UserSegmentAttempt usa WHERE usa.user.id = :userId AND usa.segment.video.id = :videoId AND usa.dictationScore IS NOT NULL AND usa.dictationScore > 0")
    int countCompletedDictationSegments(@Param("userId") UUID userId, @org.springframework.data.repository.query.Param("videoId") Long videoId);

    @Query("SELECT AVG(usa.dictationScore) FROM UserSegmentAttempt usa WHERE usa.user.id = :userId AND usa.segment.video.id = :videoId AND usa.dictationScore IS NOT NULL AND usa.dictationScore > 0")
    java.math.BigDecimal getAverageDictationScore(@Param("userId") UUID userId, @org.springframework.data.repository.query.Param("videoId") Long videoId);

    @Query("SELECT COUNT(DISTINCT usa.segment.id) FROM UserSegmentAttempt usa WHERE usa.user.id = :userId AND usa.segment.video.id = :videoId AND usa.shadowingScore IS NOT NULL AND usa.shadowingScore > 0")
    int countCompletedShadowingSegments(@Param("userId") UUID userId, @org.springframework.data.repository.query.Param("videoId") Long videoId);

    @Query("SELECT AVG(usa.shadowingScore) FROM UserSegmentAttempt usa WHERE usa.user.id = :userId AND usa.segment.video.id = :videoId AND usa.shadowingScore IS NOT NULL AND usa.shadowingScore > 0")
    java.math.BigDecimal getAverageShadowingScore(@Param("userId") UUID userId, @org.springframework.data.repository.query.Param("videoId") Long videoId);
}
