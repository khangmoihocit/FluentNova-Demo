package com.khangmoihocit.VocabFlow.modules.game.repositories;

import com.khangmoihocit.VocabFlow.modules.game.entities.UserGameSession;
import com.khangmoihocit.VocabFlow.modules.game.repositories.projections.GameStatisticsProjection;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for UserGameSessionRepository (FluentNova Project).
 * Verifying native statistics queries and pagination performance.
 */
@DataJpaTest
@ActiveProfiles("test")
class UserGameSessionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserGameSessionRepository repository;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("gamer@fluentnova.com")
                .passwordHash("password")
                .isActive(true)
                .build();
        entityManager.persist(user);
        entityManager.flush();
    }

    @Test
    @DisplayName("Modifying: Should abandon all IN_PROGRESS sessions for a user")
    void givenActiveSessions_whenAbandonInProgressSessions_thenStatusChangesToAbandoned() {
        // Arrange
        UserGameSession session1 = UserGameSession.builder()
                .user(user)
                .gameType("DICTATION_CHALLENGE")
                .totalQuestions(10)
                .status("IN_PROGRESS")
                .build();
        entityManager.persist(session1);

        UserGameSession session2 = UserGameSession.builder()
                .user(user)
                .gameType("DICTATION_CHALLENGE")
                .totalQuestions(5)
                .status("COMPLETED") // Should not be touched
                .finalAverageScore(BigDecimal.valueOf(90))
                .build();
        entityManager.persist(session2);
        entityManager.flush();

        // Act
        repository.abandonInProgressSessions(user.getId());
        entityManager.clear(); // Refresh from DB

        // Assert
        UserGameSession updated1 = entityManager.find(UserGameSession.class, session1.getId());
        UserGameSession updated2 = entityManager.find(UserGameSession.class, session2.getId());

        assertEquals("ABANDONED", updated1.getStatus());
        assertEquals("COMPLETED", updated2.getStatus());
    }

    @Test
    @DisplayName("Native Query: Should calculate game statistics correctly using native SQL")
    void givenCompletedGames_whenFindGameStatistics_thenReturnCorrectAggregates() {
        // Arrange
        UserGameSession game1 = UserGameSession.builder()
                .user(user)
                .gameType("DICTATION_CHALLENGE")
                .totalQuestions(10)
                .status("COMPLETED")
                .finalAverageScore(BigDecimal.valueOf(80.0))
                .build();
        entityManager.persist(game1);

        UserGameSession game2 = UserGameSession.builder()
                .user(user)
                .gameType("DICTATION_CHALLENGE")
                .totalQuestions(10)
                .status("COMPLETED")
                .finalAverageScore(BigDecimal.valueOf(100.0))
                .build();
        entityManager.persist(game2);
        entityManager.flush();

        // Act
        GameStatisticsProjection stats = repository.findGameStatistics(user.getId());

        // Assert
        assertNotNull(stats);
        assertEquals(2L, stats.getTotalGames());
        assertEquals(90.0, stats.getOverallAverageScore(), 0.01);
        assertEquals(100.0, stats.getBestDictationScore(), 0.01);
    }

    @Test
    @DisplayName("Pagination: Should return game history ordered by most recent first")
    void givenMultipleGames_whenFindGameHistory_thenReturnOrderedPage() {
        // Arrange
        UserGameSession oldGame = UserGameSession.builder()
                .user(user)
                .gameType("DICTATION_CHALLENGE")
                .totalQuestions(10)
                .status("COMPLETED")
                .build();
        entityManager.persist(oldGame);

        UserGameSession newGame = UserGameSession.builder()
                .user(user)
                .gameType("DICTATION_CHALLENGE")
                .totalQuestions(10)
                .status("COMPLETED")
                .build();
        entityManager.persist(newGame);
        entityManager.flush();

        // Act
        Page<UserGameSession> historyPage = repository.findGameHistory(user.getId(), PageRequest.of(0, 10));

        // Assert
        assertEquals(2, historyPage.getContent().size());
        // Newest should be first due to ORDER BY createdAt DESC
        assertEquals(newGame.getId(), historyPage.getContent().get(0).getId());
    }
}
