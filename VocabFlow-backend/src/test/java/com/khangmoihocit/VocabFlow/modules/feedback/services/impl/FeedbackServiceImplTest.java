package com.khangmoihocit.VocabFlow.modules.feedback.services.impl;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.feedback.dtos.request.FeedbackRequest;
import com.khangmoihocit.VocabFlow.modules.feedback.dtos.response.FeedbackResponse;
import com.khangmoihocit.VocabFlow.modules.feedback.entities.UserFeedback;
import com.khangmoihocit.VocabFlow.modules.feedback.enums.FeedbackType;
import com.khangmoihocit.VocabFlow.modules.feedback.repositories.UserFeedbackRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceImplTest {

    @Mock
    UserFeedbackRepository userFeedbackRepository;

    FeedbackServiceImpl feedbackService;
    MockedStatic<UserDetailUtil> mockedUserDetailUtil;

    UUID userId;

    @BeforeEach
    void setUp() {
        feedbackService = new FeedbackServiceImpl(userFeedbackRepository);
        userId = UUID.randomUUID();

        UserDetailsCustom userDetails = UserDetailsCustom.builder()
                .id(userId)
                .email("learner@fluentnova.com")
                .build();

        mockedUserDetailUtil = mockStatic(UserDetailUtil.class);
        mockedUserDetailUtil.when(UserDetailUtil::get).thenReturn(userDetails);
    }

    @AfterEach
    void tearDown() {
        mockedUserDetailUtil.close();
    }

    @Test
    @DisplayName("Should save feedback with authenticated user id and normalized fields")
    void givenValidFeedback_whenSubmit_thenSaveWithCurrentUserId() {
        FeedbackRequest request = new FeedbackRequest();
        request.setType(FeedbackType.SUBTITLE_ERROR);
        request.setVideoReference("  https://youtube.com/watch?v=abc123  ");
        request.setContent("  Subtitle is out of sync.  ");

        when(userFeedbackRepository.countByUserIdAndCreatedAtAfter(eq(userId), any(LocalDateTime.class)))
                .thenReturn(2L);
        when(userFeedbackRepository.save(any(UserFeedback.class))).thenAnswer(invocation -> {
            UserFeedback feedback = invocation.getArgument(0);
            feedback.setId(10L);
            feedback.setCreatedAt(LocalDateTime.of(2026, 5, 12, 10, 0));
            return feedback;
        });

        FeedbackResponse response = feedbackService.submit(request);

        ArgumentCaptor<UserFeedback> captor = ArgumentCaptor.forClass(UserFeedback.class);
        verify(userFeedbackRepository).save(captor.capture());
        UserFeedback saved = captor.getValue();

        assertEquals(10L, response.getId());
        assertEquals(FeedbackType.SUBTITLE_ERROR, response.getType());
        assertEquals(userId, saved.getUserId());
        assertEquals(FeedbackType.SUBTITLE_ERROR, saved.getFeedbackType());
        assertEquals("https://youtube.com/watch?v=abc123", saved.getVideoReference());
        assertEquals("Subtitle is out of sync.", saved.getContent());
    }

    @Test
    @DisplayName("Should reject feedback when user exceeds hourly rate limit")
    void givenRateLimitReached_whenSubmit_thenThrowAppException() {
        FeedbackRequest request = new FeedbackRequest();
        request.setType(FeedbackType.OTHER);
        request.setContent("Please add more beginner content.");

        when(userFeedbackRepository.countByUserIdAndCreatedAtAfter(eq(userId), any(LocalDateTime.class)))
                .thenReturn(3L);

        AppException exception = assertThrows(AppException.class, () -> feedbackService.submit(request));

        assertEquals(ErrorCode.FEEDBACK_RATE_LIMIT_EXCEEDED, exception.getErrorCode());
        verify(userFeedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should store blank video reference as null")
    void givenBlankVideoReference_whenSubmit_thenStoreNull() {
        FeedbackRequest request = new FeedbackRequest();
        request.setType(FeedbackType.UI_UX_BUG);
        request.setVideoReference("   ");
        request.setContent("Button alignment feels off.");

        when(userFeedbackRepository.countByUserIdAndCreatedAtAfter(eq(userId), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(userFeedbackRepository.save(any(UserFeedback.class))).thenAnswer(invocation -> invocation.getArgument(0));

        feedbackService.submit(request);

        ArgumentCaptor<UserFeedback> captor = ArgumentCaptor.forClass(UserFeedback.class);
        verify(userFeedbackRepository).save(captor.capture());
        assertNull(captor.getValue().getVideoReference());
    }
}
