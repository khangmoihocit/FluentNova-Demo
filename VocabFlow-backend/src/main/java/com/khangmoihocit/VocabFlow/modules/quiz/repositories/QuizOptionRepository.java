package com.khangmoihocit.VocabFlow.modules.quiz.repositories;

import com.khangmoihocit.VocabFlow.modules.quiz.entities.QuizOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {
    List<QuizOption> findAllByIdIn(List<Long> ids);
    List<QuizOption> findByVideoQuizIdOrderByOptionOrderAscIdAsc(Long quizId);
    List<QuizOption> findByVideoQuizIdInOrderByOptionOrderAscIdAsc(List<Long> quizIds);
}
