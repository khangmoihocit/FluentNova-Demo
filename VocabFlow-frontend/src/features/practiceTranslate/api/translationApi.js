import privateApi from '../../../services/api/privateApi';

export const translationApi = {
  /**
   * List all translation practice topics.
   * @returns {Array<{ id, title, description, exerciseCount }>}
   */
  getTopics: () => privateApi.get('/translation-practice/topics'),

  /**
   * List exercises of a topic (paginated, optional difficulty filter).
   * @param {number} topicId
   * @param {{ difficulty?: 'EASY'|'MEDIUM'|'HARD'|'ALL', pageNo?: number, pageSize?: number }} params
   * @returns {{ content: Array<{ id, topicId, vietnameseText, difficultyLevel }>, totalPages, totalElements, number }}
   */
  getExercises: (topicId, { difficulty, pageNo = 0, pageSize = 20 } = {}) => {
    const query = new URLSearchParams();
    if (difficulty && difficulty !== 'ALL') query.append('difficulty', difficulty);
    query.append('pageNo', pageNo);
    query.append('pageSize', pageSize);
    return privateApi.get(`/translation-practice/topics/${topicId}/exercises?${query.toString()}`);
  },

  /**
   * Create a personal topic with a list of Vietnamese sentences.
   * @param {{ title: string, description?: string, isPublic?: boolean, sentences: string[], difficultyLevel?: string }} payload
   */
  createTopic: (payload) => privateApi.post('/translation-practice/topics', payload),

  /**
   * Add more sentences to an owned topic.
   * @param {number} topicId
   * @param {{ sentences: string[], difficultyLevel?: string }} payload
   */
  addSentences: (topicId, payload) =>
    privateApi.post(`/translation-practice/topics/${topicId}/sentences`, payload),

  /**
   * Update an owned topic's metadata.
   * @param {number} topicId
   * @param {{ title: string, description?: string, isPublic?: boolean }} payload
   */
  updateTopic: (topicId, payload) =>
    privateApi.put(`/translation-practice/topics/${topicId}`, payload),

  /**
   * Edit one sentence (exercise) in an owned topic.
   * @param {number} exerciseId
   * @param {{ vietnameseText: string, difficultyLevel?: string }} payload
   */
  updateExercise: (exerciseId, payload) =>
    privateApi.put(`/translation-practice/exercises/${exerciseId}`, payload),

  /**
   * Current user's full attempt history for one exercise (most recent first).
   * @param {number} exerciseId
   */
  getExerciseAttempts: (exerciseId) =>
    privateApi.get(`/translation-practice/exercises/${exerciseId}/attempts`),

  /** Delete an owned topic. */
  deleteTopic: (topicId) => privateApi.delete(`/translation-practice/topics/${topicId}`),

  /** Delete one exercise from an owned topic. */
  deleteExercise: (exerciseId) => privateApi.delete(`/translation-practice/exercises/${exerciseId}`),

  /**
   * Submit a translation for AI grading.
   * @param {{ exerciseId: number, userInput: string, isVoiceMode?: boolean }} payload
   * @returns {{ attemptId, exerciseId, isCorrect, feedback, betterVersion, standardAnswer }}
   */
  submit: (payload) => privateApi.post('/translation-practice/submit', payload),

  /**
   * Current user's latest attempt per exercise in a topic (to restore progress).
   * @param {number} topicId
   * @returns {Array<{ exerciseId, userInput, isCorrect, aiFeedback, aiBetterVersion, vietnameseText, submittedAt }>}
   */
  getProgress: (topicId) =>
    privateApi.get(`/translation-practice/topics/${topicId}/progress`),

  /**
   * Current user's attempt history (paginated).
   * @param {{ pageNo?: number, pageSize?: number }} params
   */
  getHistory: ({ pageNo = 0, pageSize = 10 } = {}) =>
    privateApi.get(`/translation-practice/history?pageNo=${pageNo}&pageSize=${pageSize}`),

  // ──── Gemini Keys API ────
  getGeminiKeys: () => privateApi.get('/user/gemini-keys'),
  addGeminiKey: (data) => privateApi.post('/user/gemini-keys', data),
  toggleGeminiKey: (id) => privateApi.put(`/user/gemini-keys/${id}/toggle`),
  deleteGeminiKey: (id) => privateApi.delete(`/user/gemini-keys/${id}`),
};
