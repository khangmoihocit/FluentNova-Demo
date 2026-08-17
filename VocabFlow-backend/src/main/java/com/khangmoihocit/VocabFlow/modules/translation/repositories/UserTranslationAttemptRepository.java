package com.khangmoihocit.VocabFlow.modules.translation.repositories;

import com.khangmoihocit.VocabFlow.modules.translation.entities.UserTranslationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTranslationAttemptRepository extends JpaRepository<UserTranslationAttempt, Long> {
}
