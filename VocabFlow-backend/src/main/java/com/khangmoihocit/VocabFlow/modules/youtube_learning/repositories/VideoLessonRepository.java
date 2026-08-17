package com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoLessonRepository extends JpaRepository<VideoLesson, Long>, JpaSpecificationExecutor<VideoLesson> {
}
