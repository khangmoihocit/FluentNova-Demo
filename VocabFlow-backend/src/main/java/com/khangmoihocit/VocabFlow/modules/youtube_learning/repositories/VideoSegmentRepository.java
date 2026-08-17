package com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface VideoSegmentRepository extends JpaRepository<VideoSegment, Long> {

    @Query("select vs from VideoSegment vs where vs.video.id = :videoId order by vs.segmentOrder asc")
    List<VideoSegment> findByVideoLessonId(Long videoId);

    @Query("SELECT COUNT(vs.id) FROM VideoSegment vs WHERE vs.video.id = :videoId")
    int countByVideoId(@org.springframework.data.repository.query.Param("videoId") Long videoId);

    @Transactional
    void deleteByVideoId(Long id);

    @Query(value = "SELECT s.* FROM video_segments s " +
                   "JOIN video_lessons v ON s.video_id = v.id " +
                   "WHERE v.is_published = true AND LENGTH(s.english_text) >= 45 " +
                   "ORDER BY RANDOM() LIMIT :count",
           nativeQuery = true)
    List<VideoSegment> findRandomSegments(@Param("count") int count);
}
