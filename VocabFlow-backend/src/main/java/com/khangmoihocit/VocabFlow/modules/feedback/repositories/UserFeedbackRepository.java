package com.khangmoihocit.VocabFlow.modules.feedback.repositories;

import com.khangmoihocit.VocabFlow.modules.feedback.entities.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface UserFeedbackRepository extends JpaRepository<UserFeedback, Long> {
    long countByUserIdAndCreatedAtAfter(UUID userId, LocalDateTime time);
}
