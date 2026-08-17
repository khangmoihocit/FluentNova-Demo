package com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.UserFavoriteVideo;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.keys.UserFavoriteVideoKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFavoriteVideoRepository extends JpaRepository<UserFavoriteVideo, UserFavoriteVideoKey> {

    boolean existsByIdUserIdAndIdVideoId(UUID userId, Long videoId);

    Optional<UserFavoriteVideo> findByIdUserIdAndIdVideoId(UUID userId, Long videoId);

    @Query("SELECT f.id.videoId FROM UserFavoriteVideo f WHERE f.id.userId = :userId AND f.id.videoId IN :videoIds")
    java.util.List<Long> findFavoriteVideoIds(@Param("userId") UUID userId, @Param("videoIds") java.util.List<Long> videoIds);

    /**
     * Fetch paginated favorite videos for a user with JOIN FETCH to eagerly load
     * VideoLesson and its YoutubeChannel, preventing N+1 queries.
     * Note: Spring Data JPA requires a separate countQuery for paginated JOIN FETCH queries.
     */
    @Query(value = "SELECT f FROM UserFavoriteVideo f " +
            "JOIN FETCH f.videoLesson v " +
            "JOIN FETCH v.channel " +
            "WHERE f.id.userId = :userId " +
            "ORDER BY f.createdAt DESC",
            countQuery = "SELECT COUNT(f) FROM UserFavoriteVideo f WHERE f.id.userId = :userId")
    Page<UserFavoriteVideo> findFavoritesByUserId(@Param("userId") UUID userId, Pageable pageable);
}
