package com.khangmoihocit.VocabFlow.modules.game.repositories;

import com.khangmoihocit.VocabFlow.modules.game.dtos.response.GameStatisticsResponse;
import com.khangmoihocit.VocabFlow.modules.game.entities.UserGameSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserGameSessionRepository extends JpaRepository<UserGameSession, Long> {

    /**
     * Mark all IN_PROGRESS sessions for a user as ABANDONED before starting a new game.
     */
    @Modifying
    @Query("UPDATE UserGameSession s SET s.status = 'ABANDONED' " +
           "WHERE s.user.id = :userId AND s.status = 'IN_PROGRESS'")
    void abandonInProgressSessions(@Param("userId") UUID userId);

    /**
     * Aggregated statistics across all COMPLETED sessions for a user.
     * Uses native query to safely map COALESCE values avoiding JPA constructor type mismatch.
     */
    @Query(value = "SELECT " +
           "  COALESCE(COUNT(s.id), 0) AS totalGames, " +
           "  COALESCE(AVG(s.final_average_score), 0) AS overallAverageScore, " +
           "  COALESCE(MAX(CASE WHEN s.game_type = 'DICTATION_CHALLENGE' THEN s.final_average_score END), 0) AS bestDictationScore, " +
           "  COALESCE(MAX(CASE WHEN s.game_type = 'SHADOWING_CHALLENGE' THEN s.final_average_score END), 0) AS bestShadowingScore " +
           "FROM user_game_sessions s " +
           "WHERE s.user_id = :userId AND s.status = 'COMPLETED'", nativeQuery = true)
    com.khangmoihocit.VocabFlow.modules.game.repositories.projections.GameStatisticsProjection findGameStatistics(@Param("userId") UUID userId);

    /**
     * Paginated game history for a user, most recent first.
     * Only returns COMPLETED sessions.
     */
    @Query("SELECT s FROM UserGameSession s " +
           "WHERE s.user.id = :userId AND s.status = 'COMPLETED' " +
           "ORDER BY s.createdAt DESC")
    Page<UserGameSession> findGameHistory(@Param("userId") UUID userId, Pageable pageable);
}
