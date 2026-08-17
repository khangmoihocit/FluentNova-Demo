package com.khangmoihocit.VocabFlow.modules.progress.repositories;

import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningStatisticsResponse;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserVideoProgress;
import com.khangmoihocit.VocabFlow.modules.progress.projections.UserVideoProgressProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVideoProgressRepository extends JpaRepository<UserVideoProgress, Long> {
    Optional<UserVideoProgress> findByUserIdAndVideoLessonId(UUID userId, Long videoId);

    @Query("select p.id as id, p.user.id as userId, p.videoLesson.id as videoId, " +
            "p.avgDictationScore as avgDictationScore, " +
            "p.avgShadowingScore as avgShadowingScore, " +
            "p.isDictationCompleted as isDictationCompleted, " +
            "p.isShadowingCompleted as isShadowingCompleted, " +
            "p.status as status " +
            "from UserVideoProgress p where p.user.id = :userId and p.videoLesson.id in :videoIds")
    List<UserVideoProgressProjection> findByUserIdAndVideoLessonIdIn(UUID userId, List<Long> videoIds);

    @Query("SELECT new com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningStatisticsResponse(" +
            "COALESCE(SUM(p.dictationTimeSeconds), 0L), " +
            "COALESCE(SUM(p.shadowingTimeSeconds), 0L), " +
            "COALESCE(SUM(p.videoWatchTimeSeconds), 0L), " +
            "COALESCE(SUM(p.fillBlankTimeSeconds), 0L), " +
            "COALESCE(SUM(p.quizTimeSeconds), 0L), " +
            "COALESCE(SUM(p.dictationTimeSeconds), 0L) + COALESCE(SUM(p.shadowingTimeSeconds), 0L) + COALESCE(SUM(p.videoWatchTimeSeconds), 0L) + COALESCE(SUM(p.fillBlankTimeSeconds), 0L) + COALESCE(SUM(p.quizTimeSeconds), 0L), " +
            "COALESCE(SUM(CASE WHEN p.isDictationCompleted = true THEN 1L ELSE 0L END), 0L), " +
            "COALESCE(SUM(CASE WHEN p.isShadowingCompleted = true THEN 1L ELSE 0L END), 0L), " +
            "COALESCE(SUM(CASE WHEN p.fillBlankCompleted = true THEN 1L ELSE 0L END), 0L), " +
            "COALESCE(SUM(CASE WHEN p.quizCompleted = true OR p.isQuizCompleted = true THEN 1L ELSE 0L END), 0L), " +
            "COALESCE(COUNT(p.id), 0L), " +
            "COALESCE(AVG(CASE WHEN p.isDictationCompleted = true THEN p.avgDictationScore ELSE null END), 0.0), " +
            "COALESCE(AVG(CASE WHEN p.isShadowingCompleted = true THEN p.avgShadowingScore ELSE null END), 0.0), " +
            "COALESCE(AVG(CASE WHEN p.fillBlankCompleted = true THEN p.avgFillBlankScore ELSE null END), 0.0), " +
            "COALESCE(AVG(CASE WHEN p.quizCompleted = true OR p.isQuizCompleted = true THEN p.avgQuizScore ELSE null END), 0.0)) " +
            "FROM UserVideoProgress p WHERE p.user.id = :userId")
    LearningStatisticsResponse getLearningStatistics(@Param("userId") UUID userId);

    @Query(value = "SELECT p FROM UserVideoProgress p " +
            "JOIN FETCH p.videoLesson v " +
            "JOIN FETCH v.channel c " +
            "WHERE p.user.id = :userId " +
            "AND p.status IN ('IN_PROGRESS', 'COMPLETED') " +
            "ORDER BY p.lastStudiedAt DESC",
            countQuery = "SELECT COUNT(p) FROM UserVideoProgress p " +
            "WHERE p.user.id = :userId " +
            "AND p.status IN ('IN_PROGRESS', 'COMPLETED')")
    Page<UserVideoProgress> findLearningHistory(@Param("userId") UUID userId, Pageable pageable);
}
