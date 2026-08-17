package com.khangmoihocit.VocabFlow.modules.youtube_learning.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.FavoriteVideoResponse;

public interface UserFavoriteVideoService {

    /**
     * Toggle favorite status for a video.
     * If the video is already favorited, remove it. Otherwise, add it.
     *
     * @param videoId the ID of the video to toggle
     * @return true if the video was added to favorites, false if it was removed
     */
    boolean toggleFavorite(Long videoId);

    /**
     * Check if a specific video is favorited by the current user.
     *
     * @param videoId the ID of the video to check
     * @return true if the video is favorited
     */
    boolean isFavorited(Long videoId);

    /**
     * Get a paginated list of the current user's favorite videos.
     *
     * @param pageNo   page number (1-indexed)
     * @param pageSize number of items per page
     * @return paginated favorite video response
     */
    PageResponse<FavoriteVideoResponse> getFavoriteVideos(int pageNo, int pageSize);

    /**
     * Đồng bộ toàn bộ các segment của một video yêu thích sang Anki.
     * @param videoId ID của video.
     * @return số lượng thẻ (segment) đã được đồng bộ thành công.
     */
    int syncVideoToAnki(Long videoId);
}
