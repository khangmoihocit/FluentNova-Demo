import privateApi from '../../../services/api/privateApi';

export const fillBlankService = {
    getByVideo: (videoId) => {
        return privateApi.get(`/fill-blanks/video/${videoId}`);
    },

    submit: (videoId, payload) => {
        return privateApi.post(`/fill-blanks/video/${videoId}/submit`, payload);
    },

    getAttempts: (videoId) => {
        return privateApi.get(`/fill-blanks/video/${videoId}/attempts`);
    },
};
