import { youtubeApi } from '../../../features/youtubeLearning/api/youtube.api';
import { progressApi } from '../../../features/learningHub/api/progress.api';
import { gameApi } from '../../../features/gameHub/api/gameApi';

/**
 * Home API Facade
 * Reuses existing project API modules rather than duplicating endpoints.
 *
 * Backend Endpoints & DTOs:
 *
 *   GET /progress/streak → UserStreakResponse
 *       { currentStreak, longestStreak, lastActivityDate }
 *
 *   GET /progress/statistics → LearningStatisticsResponse
 *       { totalDictationDuration, totalShadowingDuration, totalListeningDuration,
 *         grandTotalDuration, dictationCompletedVideos, shadowingCompletedVideos }
 *
 *   GET /progress/history → PageResponse<LearningHistoryResponse>
 *       { pageNo, pageSize, totalElements, totalPages, data: [...] }
 *
 *   GET /games/statistics → GameStatisticsResponse
 *       { totalGames, overallAverageScore, bestDictationScore, bestShadowingScore }
 *
 *   GET /categories/get-category-video → List<HomeCategoryResponse>
 *       [ { categoryId, categoryName, videoLessonFilterResponses: [...] } ]
 */
export const homeApi = {
    /**
     * Fetch recent learning history for "Continue Learning" section
     */
    getHistory: (limit = 5) => {
        return progressApi.getHistory({ pageNo: 1, pageSize: limit });
    },

    /**
     * Fetch user's streak for the Habit Builder widget
     */
    getStreak: () => {
        return progressApi.getStreak();
    },

    /**
     * Fetch aggregated learning statistics (total time, completed videos)
     */
    getLearningStatistics: () => {
        return progressApi.getStatistics();
    },

    /**
     * Fetch aggregated game statistics (total games, best scores)
     */
    getGameStatistics: () => {
        return gameApi.getStatistics();
    },

    /**
     * Fetch featured categories with videos for Discovery section (public)
     */
    getCategoryVideo: () => {
        return youtubeApi.getCategoryVideo();
    },
};
