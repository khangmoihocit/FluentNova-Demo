package com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories;

import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.UserSegmentAttempt;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Repository tests for UserSegmentAttemptRepository (FluentNova Project).
 * Focusing on custom JPQL validation and N+1 query prevention.
 */
@DataJpaTest
@ActiveProfiles("test")
class UserSegmentAttemptRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserSegmentAttemptRepository repository;

    private User user;
    private VideoLesson video;
    private VideoSegment segment1;
    private VideoSegment segment2;

    @BeforeEach
    void setUp() {
        // Arrange: Create foundation data
        user = User.builder()
                .email("test@fluentnova.com")
                .passwordHash("password")
                .isActive(true)
                .build();
        entityManager.persist(user);

        YoutubeChannel channel = YoutubeChannel.builder()
                .name("FluentNova Official")
                .youtubeChannelId("UC_NOVA")
                .build();
        entityManager.persist(channel);

        video = VideoLesson.builder()
                .title("Learning with Nova")
                .youtubeVideoId("video123")
                .channel(channel)
                .isPublished(true)
                .build();
        entityManager.persist(video);

        segment1 = VideoSegment.builder()
                .video(video)
                .segmentOrder(1)
                .startTime(BigDecimal.valueOf(0.0))
                .endTime(BigDecimal.valueOf(5.0))
                .englishText("Hello everyone")
                .build();
        entityManager.persist(segment1);

        segment2 = VideoSegment.builder()
                .video(video)
                .segmentOrder(2)
                .startTime(BigDecimal.valueOf(5.0))
                .endTime(BigDecimal.valueOf(10.0))
                .englishText("Welcome to FluentNova")
                .build();
        entityManager.persist(segment2);

        entityManager.flush();
    }

    @Test
    @DisplayName("Query: Should fetch attempts by User ID and Video ID correctly")
    void givenAttempts_whenFindByUserIdAndVideoId_thenReturnCorrectAttempts() {
        // Arrange
        UserSegmentAttempt attempt1 = UserSegmentAttempt.builder()
                .user(user)
                .segment(segment1)
                .dictationScore(100)
                .build();
        entityManager.persist(attempt1);

        UserSegmentAttempt attempt2 = UserSegmentAttempt.builder()
                .user(user)
                .segment(segment2)
                .dictationScore(85)
                .build();
        entityManager.persist(attempt2);
        entityManager.flush();
        entityManager.clear(); // Clear to test loading from DB

        // Act
        List<UserSegmentAttempt> result = repository.findByUserIdAndVideoId(user.getId(), video.getId());

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(a -> a.getDictationScore() == 100));
        assertTrue(result.stream().anyMatch(a -> a.getDictationScore() == 85));
    }

    @Test
    @DisplayName("Aggregation: Should count completed dictation segments correctly")
    void givenMixedAttempts_whenCountCompletedDictationSegments_thenReturnCorrectCount() {
        // Arrange
        UserSegmentAttempt attempt1 = UserSegmentAttempt.builder()
                .user(user)
                .segment(segment1)
                .dictationScore(100) // Completed
                .build();
        entityManager.persist(attempt1);

        UserSegmentAttempt attempt2 = UserSegmentAttempt.builder()
                .user(user)
                .segment(segment2)
                .dictationScore(0) // Not completed
                .build();
        entityManager.persist(attempt2);
        entityManager.flush();

        // Act
        int count = repository.countCompletedDictationSegments(user.getId(), video.getId());

        // Assert
        assertEquals(1, count);
    }

    @Test
    @DisplayName("Aggregation: Should calculate average shadowing score accurately")
    void givenShadowingAttempts_whenGetAverageShadowingScore_thenReturnCorrectAverage() {
        // Arrange
        UserSegmentAttempt attempt1 = UserSegmentAttempt.builder()
                .user(user)
                .segment(segment1)
                .shadowingScore(80)
                .build();
        entityManager.persist(attempt1);

        UserSegmentAttempt attempt2 = UserSegmentAttempt.builder()
                .user(user)
                .segment(segment2)
                .shadowingScore(90)
                .build();
        entityManager.persist(attempt2);
        entityManager.flush();

        // Act
        BigDecimal avg = repository.getAverageShadowingScore(user.getId(), video.getId());

        // Assert
        assertNotNull(avg);
        assertEquals(0, BigDecimal.valueOf(85.0).compareTo(avg));
    }
}
