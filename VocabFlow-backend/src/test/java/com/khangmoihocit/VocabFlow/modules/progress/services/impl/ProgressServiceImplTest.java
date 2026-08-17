package com.khangmoihocit.VocabFlow.modules.progress.services.impl;

import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.StudySessionRequest;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserStreak;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.StudySessionRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserStreakRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserVideoProgressRepository;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProgressServiceImpl (FluentNova Project).
 * Focusing on Streak Engine logic and Security context integrity.
 */
@ExtendWith(MockitoExtension.class)
class ProgressServiceImplTest {

    @Mock
    UserVideoProgressRepository progressRepository;
    @Mock
    StudySessionRepository studySessionRepository;
    @Mock
    UserStreakRepository streakRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    VideoLessonRepository videoLessonRepository;

    @InjectMocks
    ProgressServiceImpl progressService;

    MockedStatic<UserDetailUtil> mockedUserDetailUtil;

    UUID userId = UUID.randomUUID();
    User user;

    @BeforeEach
    void setUp() {
        mockedUserDetailUtil = mockStatic(UserDetailUtil.class);
        
        user = User.builder().id(userId).email("nova@fluentnova.com").build();
        
        UserDetailsCustom userDetails = UserDetailsCustom.builder()
                .id(userId)
                .email("nova@fluentnova.com")
                .build();
        
        mockedUserDetailUtil.when(UserDetailUtil::get).thenReturn(userDetails);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // Note: Do NOT mock LocalDate.class here as it breaks LocalDate.of() calls in tests
    }

    @AfterEach
    void tearDown() {
        mockedUserDetailUtil.close();
    }

    @Test
    @DisplayName("Streak: Should increment streak when studying on the next consecutive day")
    void givenExistingStreak_whenStudyNextDay_thenIncrementStreak() {
        // Arrange
        LocalDate today = LocalDate.of(2024, 5, 12);
        LocalDate yesterday = today.minusDays(1);

        try (MockedStatic<LocalDate> mockedLocalDate = mockStatic(LocalDate.class)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(today);

            UserStreak existingStreak = UserStreak.builder()
                    .user(user)
                    .currentStreak(5)
                    .longestStreak(5)
                    .lastActivityDate(yesterday)
                    .build();

            when(streakRepository.findById(userId)).thenReturn(Optional.of(existingStreak));

            StudySessionRequest request = StudySessionRequest.builder()
                    .activityType("DICTATION")
                    .durationSeconds(300)
                    .build();

            // Act
            progressService.logStudySession(request);

            // Assert
            assertEquals(6, existingStreak.getCurrentStreak());
            assertEquals(6, existingStreak.getLongestStreak());
            assertEquals(today, existingStreak.getLastActivityDate());
            verify(streakRepository).saveAndFlush(existingStreak);
        }
    }

    @Test
    @DisplayName("Streak: Should maintain streak when studying multiple times on the same day")
    void givenExistingStreak_whenStudySameDay_thenStreakStaysSame() {
        // Arrange
        LocalDate today = LocalDate.of(2024, 5, 12);

        try (MockedStatic<LocalDate> mockedLocalDate = mockStatic(LocalDate.class)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(today);

            UserStreak existingStreak = UserStreak.builder()
                    .user(user)
                    .currentStreak(5)
                    .longestStreak(5)
                    .lastActivityDate(today) // Already studied today
                    .build();

            when(streakRepository.findById(userId)).thenReturn(Optional.of(existingStreak));

            StudySessionRequest request = StudySessionRequest.builder()
                    .activityType("SHADOWING")
                    .durationSeconds(600)
                    .build();

            // Act
            progressService.logStudySession(request);

            // Assert
            assertEquals(5, existingStreak.getCurrentStreak());
            assertEquals(today, existingStreak.getLastActivityDate());
        }
    }

    @Test
    @DisplayName("Streak: Should reset streak to 1 when activity is not consecutive (broken streak)")
    void givenExistingStreak_whenStudyAfterGap_thenResetStreakToOne() {
        // Arrange
        LocalDate today = LocalDate.of(2024, 5, 12);
        LocalDate longAgo = today.minusDays(3); // 2 days gap

        try (MockedStatic<LocalDate> mockedLocalDate = mockStatic(LocalDate.class)) {
            mockedLocalDate.when(LocalDate::now).thenReturn(today);

            UserStreak existingStreak = UserStreak.builder()
                    .user(user)
                    .currentStreak(10)
                    .longestStreak(10)
                    .lastActivityDate(longAgo)
                    .build();

            when(streakRepository.findById(userId)).thenReturn(Optional.of(existingStreak));

            StudySessionRequest request = StudySessionRequest.builder()
                    .activityType("LISTENING")
                    .durationSeconds(120)
                    .build();

            // Act
            progressService.logStudySession(request);

            // Assert
            assertEquals(1, existingStreak.getCurrentStreak());
            assertEquals(10, existingStreak.getLongestStreak()); // Longest streak preserved
            assertEquals(today, existingStreak.getLastActivityDate());
        }
    }
}
