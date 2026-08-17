package com.khangmoihocit.VocabFlow.modules.quiz.repositories;

import com.khangmoihocit.VocabFlow.modules.quiz.entities.UserQuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserQuizAttemptRepository extends JpaRepository<UserQuizAttempt, Long> {
    List<UserQuizAttempt> findByUserIdAndVideoLessonIdOrderByCompletedAtDesc(UUID userId, Long videoId);

    @Query("SELECT COALESCE(AVG(a.score), 0) FROM UserQuizAttempt a WHERE a.user.id = :userId AND a.videoLesson.id = :videoId")
    BigDecimal getAverageScore(@Param("userId") UUID userId, @Param("videoId") Long videoId);
}
