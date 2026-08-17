import privateApi from '../../../services/api/privateApi';

export const myVideoSegmentApi = {
  // ──── Segments API ────
  getByVideoId: (videoId) =>
    privateApi.get(`/video-segments/${videoId}/study-detail-admin`),

  updateSegments: (videoId, segments) =>
    privateApi.put(`/video-segments/${videoId}/update`, segments),

  autoGenerateSubIpa: (videoId) =>
    privateApi.post(`/video-segments/${videoId}/auto-generate-sub-ipa`),

  autoParagraphBreak: (videoId, chunkIndex, chunkSize) =>
    privateApi.post(`/video-segments/${videoId}/auto-paragraph-break?chunkIndex=${chunkIndex}&chunkSize=${chunkSize}`),

  autoTranslateIpaChunk: (videoId, chunkIndex, chunkSize) =>
    privateApi.post(`/video-segments/${videoId}/auto-translate-ipa-chunk?chunkIndex=${chunkIndex}&chunkSize=${chunkSize}`),

  autoMergeSegments: (videoId, chunkIndex, chunkSize) =>
    privateApi.post(`/video-segments/${videoId}/auto-merge-segments?chunkIndex=${chunkIndex}&chunkSize=${chunkSize}`),

  // ──── Fill Blanks API ────
  getBlanks: (videoId) =>
    privateApi.get(`/fill-blanks/admin/video/${videoId}/items`),

  createBlank: (videoId, data) =>
    privateApi.post(`/fill-blanks/admin/video/${videoId}/items`, data),

  updateBlank: (itemId, data) =>
    privateApi.put(`/fill-blanks/admin/items/${itemId}`, data),

  deleteBlank: (itemId) =>
    privateApi.delete(`/fill-blanks/admin/items/${itemId}`),

  bulkDeleteBlanks: (videoId, ids) =>
    privateApi.delete(`/fill-blanks/admin/video/${videoId}/items/bulk`, { data: { ids } }),

  deleteAllBlanks: (videoId) =>
    privateApi.delete(`/fill-blanks/admin/video/${videoId}/items`),

  autoGenerateBlanks: (videoId, chunkIndex, chunkSize) =>
    privateApi.post(`/fill-blanks/video/${videoId}/auto-generate?chunkIndex=${chunkIndex}&chunkSize=${chunkSize}`),

  // ──── Quizzes API ────
  getQuizzes: (videoId) =>
    privateApi.get(`/quizzes/admin/video/${videoId}`),

  createQuiz: (videoId, data) =>
    privateApi.post(`/quizzes/admin/video/${videoId}`, data),

  updateQuiz: (quizId, data) =>
    privateApi.put(`/quizzes/admin/${quizId}`, data),

  deleteQuiz: (quizId) =>
    privateApi.delete(`/quizzes/admin/${quizId}`),

  bulkDeleteQuizzes: (videoId, ids) =>
    privateApi.delete(`/quizzes/admin/video/${videoId}/bulk`, { data: { ids } }),

  deleteAllQuizzes: (videoId) =>
    privateApi.delete(`/quizzes/admin/video/${videoId}`),

  autoGenerateQuizzes: (videoId, chunkIndex, chunkSize) =>
    privateApi.post(`/quizzes/video/${videoId}/auto-generate?chunkIndex=${chunkIndex}&chunkSize=${chunkSize}`),

  // ──── Gemini Keys API ────
  getGeminiKeys: () =>
    privateApi.get('/user/gemini-keys'),

  addGeminiKey: (data) =>
    privateApi.post('/user/gemini-keys', data),

  toggleGeminiKey: (id) =>
    privateApi.put(`/user/gemini-keys/${id}/toggle`),

  deleteGeminiKey: (id) =>
    privateApi.delete(`/user/gemini-keys/${id}`),
};
