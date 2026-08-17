package com.khangmoihocit.VocabFlow.modules.feedback.services.impl;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.feedback.dtos.request.FeedbackRequest;
import com.khangmoihocit.VocabFlow.modules.feedback.dtos.response.FeedbackResponse;
import com.khangmoihocit.VocabFlow.modules.feedback.entities.UserFeedback;
import com.khangmoihocit.VocabFlow.modules.feedback.repositories.UserFeedbackRepository;
import com.khangmoihocit.VocabFlow.modules.feedback.services.FeedbackService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FeedbackServiceImpl implements FeedbackService {

    static final int MAX_FEEDBACKS_PER_HOUR = 20;

    UserFeedbackRepository userFeedbackRepository;

    @Override
    @Transactional
    public FeedbackResponse submit(FeedbackRequest request) {
        UUID userId = UserDetailUtil.get().getId();
        LocalDateTime windowStart = LocalDateTime.now().minusHours(1);

        long recentFeedbackCount = userFeedbackRepository.countByUserIdAndCreatedAtAfter(userId, windowStart);
        if (recentFeedbackCount >= MAX_FEEDBACKS_PER_HOUR) {
            throw new AppException(ErrorCode.FEEDBACK_RATE_LIMIT_EXCEEDED);
        }

        UserFeedback feedback = UserFeedback.builder()
                .userId(userId)
                .feedbackType(request.getType())
                .videoReference(normalizeOptional(request.getVideoReference()))
                .content(request.getContent().trim())
                .build();

        UserFeedback saved = userFeedbackRepository.save(feedback);

        return FeedbackResponse.builder()
                .id(saved.getId())
                .type(saved.getFeedbackType())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
