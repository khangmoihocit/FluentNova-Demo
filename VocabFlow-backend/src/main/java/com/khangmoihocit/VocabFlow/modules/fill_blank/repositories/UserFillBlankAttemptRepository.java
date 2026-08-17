package com.khangmoihocit.VocabFlow.modules.fill_blank.repositories;

import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.UserFillBlankAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFillBlankAttemptRepository extends JpaRepository<UserFillBlankAttempt, Long> {
    List<UserFillBlankAttempt> findByUserIdAndVideoLessonIdOrderByCompletedAtDesc(UUID userId, Long videoId);

    Optional<UserFillBlankAttempt> findTopByUserIdAndVideoLessonIdOrderByCompletedAtDesc(UUID userId, Long videoId);

    @Query("SELECT COALESCE(AVG(a.score), 0) FROM UserFillBlankAttempt a WHERE a.user.id = :userId AND a.videoLesson.id = :videoId")
    BigDecimal getAverageScore(@Param("userId") UUID userId, @Param("videoId") Long videoId);
}
