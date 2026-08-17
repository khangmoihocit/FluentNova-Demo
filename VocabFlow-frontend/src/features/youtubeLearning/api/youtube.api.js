import privateApi from '../../../services/api/privateApi';
import publicApi from '../../../services/api/publicApi';
import { getAccessToken } from '../../../utils/cookie';

export const youtubeApi = {
    /**
     * Fetch paginated list of Youtube Channels
     */
    getChannels: (params) => {
        return publicApi.get('/youtube-channels/find-all', { params });
    },

    /**
     * Fetch all Categories
     */
    getCategories: () => {
        return publicApi.get('/categories');
    },

    /**
     * Fetch paginated list of Video Lessons with advanced filters
     * @param {Object} params - { channelId, pageNo, pageSize, sort, keyword, categoryIds, difficultyLevel }
     */
    getVideoLessons: (params) => {
        const token = getAccessToken();
        const api = token ? privateApi : publicApi;
        return api.get('/video-lessons/find-all', { params });
    },

    /**
     * Fetch Home Categories with 5 videos each
     */
    getCategoryVideo: () => {
        const token = getAccessToken();
        const api = token ? privateApi : publicApi;
        return api.get('/categories/get-category-video');
    }
};
