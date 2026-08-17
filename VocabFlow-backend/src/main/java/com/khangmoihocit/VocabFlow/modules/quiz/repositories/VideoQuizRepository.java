package com.khangmoihocit.VocabFlow.modules.quiz.repositories;

import com.khangmoihocit.VocabFlow.modules.quiz.entities.VideoQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoQuizRepository extends JpaRepository<VideoQuiz, Long> {
    List<VideoQuiz> findByVideoLessonId(Long videoId);
    List<VideoQuiz> findByVideoLessonIdOrderByOrderIndexAscIdAsc(Long videoId);
    List<VideoQuiz> findByVideoLessonIdAndIsPublishedTrueOrderByOrderIndexAscIdAsc(Long videoId);
    java.util.Optional<VideoQuiz> findByIdAndVideoLessonId(Long id, Long videoId);
    int countByVideoLessonId(Long videoId);
    int countByVideoLessonIdAndIsPublishedTrue(Long videoId);
}
