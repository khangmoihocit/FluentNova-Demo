package com.khangmoihocit.VocabFlow.modules.quiz.repositories;

import com.khangmoihocit.VocabFlow.modules.quiz.entities.UserQuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserQuizAnswerRepository extends JpaRepository<UserQuizAnswer, Long> {
    List<UserQuizAnswer> findByAttemptId(Long attemptId);
}
