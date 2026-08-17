package com.khangmoihocit.VocabFlow.modules.category.repositories;

import com.khangmoihocit.VocabFlow.modules.category.entities.Category;
import com.khangmoihocit.VocabFlow.modules.category.projections.HomeCategoryVideoProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);

    List<Category> findByIdIn(List<Long> ids);

    @Query(value = "WITH RankedVideos AS (\n" +
            "            SELECT \n" +
            "                c.id AS categoryId,\n" +
            "                c.name AS categoryName,\n" +
            "                v.id AS videoId,\n" +
            "                v.youtube_video_id as youtubeVideoId,\n" +
            "                v.title AS videoTitle,\n" +
            "                v.thumbnail_url as thumbnailUrl,\n" +
            "                v.duration as duration,\n" +
            "                v.difficulty_level as difficultyLevel,\n" +
            "                v.created_at as createdAt,\n" +
            "                \n" +
            "                ROW_NUMBER() OVER(PARTITION BY c.id ORDER BY v.created_at DESC) as rn\n" +
            "            FROM categories c\n" +
            "            INNER JOIN video_category_mapping vcm ON c.id = vcm.category_id\n" +
            "            INNER JOIN video_lessons v ON v.id = vcm.video_id\n" +
            "            where v.is_published = true\n" +
            "        )\n" +
            "        SELECT categoryId, categoryName, videoId, youtubeVideoId, videoTitle, thumbnailUrl, duration, difficultyLevel, createdAt\n" +
            "        FROM RankedVideos \n" +
            "        WHERE rn <= 5", nativeQuery = true)
    List<HomeCategoryVideoProjection> getTop5VideosPerCategory();
}
