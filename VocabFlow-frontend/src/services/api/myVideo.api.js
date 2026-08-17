import pythonApi from './pythonApi';
import privateApi from './privateApi';

export const myVideoApi = {
  // ──── Python Video Service ────
  fetchYoutubeInfo: (url) =>
    pythonApi.get('/api/youtube/info', { params: { url } }),

  fetchManualSubtitles: (videoId) =>
    pythonApi.get('/api/youtube/subtitles', { params: { video_id: videoId } }),

  parseCapcutFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return pythonApi.post('/api/capcut/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ──── Java Backend ────
  createMyVideo: (data) =>
    privateApi.post('/my-videos', data),

  importVideoSegments: (videoId, segments) =>
    privateApi.post(`/video-segments/${videoId}/import`, segments),

  autoTranslateIpaChunk: (videoId, chunkIndex, chunkSize) =>
    privateApi.post(`/video-segments/${videoId}/auto-translate-ipa-chunk?chunkIndex=${chunkIndex}&chunkSize=${chunkSize}`),

  updateMyVideo: (videoId, data) =>
    privateApi.put(`/my-videos/${videoId}`, data),

  deleteMyVideo: (videoId) =>
    privateApi.delete(`/my-videos/${videoId}`),

  getMyVideos: (params) =>
    privateApi.get('/my-videos/me', { params }),

  getAllVideoOwn: (params) =>
    privateApi.get('/my-videos', { params }),

  getUserVideoQuota: () =>
    privateApi.get('/my-videos/quota'),

  // ──── Groq BYOK & Transcribe ────
  getGroqKey: () =>
    privateApi.get('/user/groq-key'),

  saveGroqKey: (apiKey) =>
    privateApi.post('/user/groq-key', { apiKey }),

  deleteGroqKey: () =>
    privateApi.delete('/user/groq-key'),

  transcribeYoutubeVideo: (youtubeUrl, model) =>
    privateApi.post('/my-videos/youtube-transcribe', { youtubeUrl, model }),
};
