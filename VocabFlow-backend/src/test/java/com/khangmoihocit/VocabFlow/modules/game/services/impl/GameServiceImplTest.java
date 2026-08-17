package com.khangmoihocit.VocabFlow.modules.game.services.impl;

import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.game.dtos.request.GameSubmitRequest;
import com.khangmoihocit.VocabFlow.modules.game.entities.UserGameSession;
import com.khangmoihocit.VocabFlow.modules.game.repositories.UserGameDictationDetailRepository;
import com.khangmoihocit.VocabFlow.modules.game.repositories.UserGameSessionRepository;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoSegmentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameServiceImpl focusing on IDOR prevention (FluentNova Project).
 */
@ExtendWith(MockitoExtension.class)
class GameServiceImplTest {

    @Mock
    UserGameSessionRepository sessionRepository;
    @Mock
    UserGameDictationDetailRepository detailRepository;
    @Mock
    VideoSegmentRepository videoSegmentRepository;
    @Mock
    UserRepository userRepository;

    @InjectMocks
    GameServiceImpl gameService;

    MockedStatic<UserDetailUtil> mockedUserDetailUtil;

    UUID userAId = UUID.randomUUID();
    UUID userBId = UUID.randomUUID();
    User userA;
    User userB;

    @BeforeEach
    void setUp() {
        mockedUserDetailUtil = mockStatic(UserDetailUtil.class);
        
        userA = User.builder().id(userAId).email("usera@fluentnova.com").build();
        userB = User.builder().id(userBId).email("userb@fluentnova.com").build();
        
        UserDetailsCustom userDetailsA = UserDetailsCustom.builder()
                .id(userAId)
                .email("usera@fluentnova.com")
                .build();
        
        mockedUserDetailUtil.when(UserDetailUtil::get).thenReturn(userDetailsA);
    }

    @AfterEach
    void tearDown() {
        mockedUserDetailUtil.close();
    }

    @Test
    @DisplayName("Should throw Exception when User A attempts to submit User B's game session (IDOR Prevention)")
    void givenUserA_whenSubmitUserBSession_thenThrowException() {
        // Arrange
        Long sessionId = 100L;
        GameSubmitRequest request = new GameSubmitRequest();
        
        UserGameSession sessionOfUserB = UserGameSession.builder()
                .id(sessionId)
                .user(userB) // Owned by User B
                .status("IN_PROGRESS")
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(sessionOfUserB));

        // Act & Assert
        OurException exception = assertThrows(OurException.class, () -> {
            gameService.submitDictationChallenge(sessionId, request);
        });

        assertEquals("Bạn không có quyền truy cập game session này", exception.getMessage());
        verify(detailRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Should throw Exception when User A attempts to view User B's session details (IDOR Prevention)")
    void givenUserA_whenGetSessionDetailsOfUserB_thenThrowException() {
        // Arrange
        Long sessionId = 200L;
        UserGameSession sessionOfUserB = UserGameSession.builder()
                .id(sessionId)
                .user(userB)
                .build();

        when(userRepository.findById(userAId)).thenReturn(Optional.of(userA));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(sessionOfUserB));

        // Act & Assert
        OurException exception = assertThrows(OurException.class, () -> {
            gameService.getGameSessionDetails(sessionId);
        });

        assertEquals("Bạn không có quyền truy cập game session này", exception.getMessage());
    }
}
