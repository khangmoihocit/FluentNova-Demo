package com.khangmoihocit.VocabFlow.modules.fill_blank.repositories;

import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.UserFillBlankAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFillBlankAnswerRepository extends JpaRepository<UserFillBlankAnswer, Long> {
    List<UserFillBlankAnswer> findByAttemptId(Long attemptId);
}
