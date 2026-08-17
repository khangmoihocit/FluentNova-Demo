import privateApi from '../../../services/api/privateApi';

export const quizService = {
    getByVideo: (videoId) => {
        return privateApi.get(`/quizzes/video/${videoId}`);
    },

    submit: (videoId, payload) => {
        return privateApi.post(`/quizzes/video/${videoId}/submit`, payload);
    },

    getAttempts: (videoId) => {
        return privateApi.get(`/quizzes/video/${videoId}/attempts`);
    },
};
