import privateApi from '../../../services/api/privateApi';

export const gameApi = {
    /**
     * Generate a new Dictation Challenge game session.
     * @param {number} count - Number of segments (5, 10, 20, 30, 50)
     * @returns {{ sessionId, gameType, totalQuestions, segments: Array<{ id, segmentOrder, startTime, endTime, englishText, vietnameseTranslation, ipa, youtubeVideoId }> }}
     */
    generateDictation: (count = 10) => {
        return privateApi.get(`/games/dictation/generate?count=${count}`);
    },

    /**
     * Submit results for a completed Dictation Challenge.
     * @param {number} sessionId
     * @param {Array<{ segmentId, hintCount, replayCount, wrongSubmitCount }>} results
     * @returns {{ sessionId, finalAverageScore, segmentDetails: Array<{ segmentId, segmentScore, hintCount, replayCount, wrongSubmitCount }> }}
     */
    submitDictation: (sessionId, results) => {
        return privateApi.post(`/games/dictation/submit/${sessionId}`, { results });
    },
    /**
     * Fetch aggregated game statistics for the current user.
     * @returns {{ totalGames, overallAverageScore, bestDictationScore, bestShadowingScore }}
     */
    getStatistics: () => {
        return privateApi.get('/games/statistics');
    },

    /**
     * Fetch paginated game history.
     * @param {Object} params - { pageNo, pageSize }
     * @returns {{ pageNo, pageSize, totalElements, totalPages, data: Array<{ sessionId, gameType, totalQuestions, finalAverageScore, createdAt }> }}
     */
    getHistory: (params = {}) => {
        return privateApi.get('/games/history', { params });
    },

    /**
     * Fetch detailed results of a specific game session.
     * @param {number} sessionId
     * @returns {{ sessionId, gameType, totalQuestions, finalAverageScore, createdAt, segmentDetails: Array<{ segmentId, videoId, englishText, segmentScore, hintCount, replayCount, wrongSubmitCount }> }}
     */
    getSessionDetails: (sessionId) => {
        return privateApi.get(`/games/history/${sessionId}`);
    },
};
