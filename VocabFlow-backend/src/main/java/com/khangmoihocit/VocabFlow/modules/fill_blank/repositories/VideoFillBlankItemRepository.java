package com.khangmoihocit.VocabFlow.modules.fill_blank.repositories;

import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.VideoFillBlankItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoFillBlankItemRepository extends JpaRepository<VideoFillBlankItem, Long> {
    List<VideoFillBlankItem> findByVideoLessonIdAndIsActiveTrueOrderByBlankOrderAsc(Long videoId);

    List<VideoFillBlankItem> findByVideoLessonIdOrderByBlankOrderAsc(Long videoId);

    Optional<VideoFillBlankItem> findByIdAndVideoLessonId(Long id, Long videoId);

    boolean existsByVideoLessonIdAndBlankOrder(Long videoId, Integer blankOrder);

    boolean existsByVideoLessonIdAndBlankOrderAndIdNot(Long videoId, Integer blankOrder, Long id);
}
