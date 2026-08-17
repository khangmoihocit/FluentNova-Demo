import privateApi from '../../../services/api/privateApi';

export const progressApi = {
    /**
     * Fetch aggregated learning statistics for the current user
     * @returns {{ totalDictationDuration, totalShadowingDuration, grandTotalDuration, dictationCompletedVideos, shadowingCompletedVideos }}
     */
    getStatistics: () => {
        return privateApi.get('/progress/statistics');
    },

    /**
     * Fetch paginated learning history (IN_PROGRESS + COMPLETED videos)
     * @param {Object} params - { pageNo, pageSize }
     * @returns {{ pageNo, pageSize, totalElements, totalPages, data: [...] }}
     */
    getHistory: (params = {}) => {
        return privateApi.get('/progress/history', { params });
    },

    /**
     * Fetch current user's streak data
     * @returns {{ currentStreak, longestStreak, lastActivityDate }}
     */
    getStreak: () => {
        return privateApi.get('/progress/streak');
    },

    /**
     * Fetch active dates for a given month and year
     * @param {number} month
     * @param {number} year
     * @returns {string[]} - Array of dates in "YYYY-MM-DD" format
     */
    getStreakCalendar: (month, year) => {
        return privateApi.get('/progress/streak/calendar', { params: { month, year } });
    },
};
