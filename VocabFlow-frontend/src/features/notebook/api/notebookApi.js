import privateApi from '@/services/api/privateApi';

// ── Vocabulary Groups ──
export const vocabularyGroupApi = {
  findAll: (sort = 'createdAt,desc') =>
    privateApi.get('/vocabulary-groups/find-all', { params: { sort } }),

  create: (name) =>
    privateApi.post('/vocabulary-groups', { name }),

  update: (id, name) =>
    privateApi.put(`/vocabulary-groups/${id}`, { name }),

  delete: (id) =>
    privateApi.delete(`/vocabulary-groups/${id}`),
};

// ── Vocabulary Units ──
export const vocabularyUnitApi = {
  create: ({ name, description, vocabularyGroupId }) =>
    privateApi.post('/vocabulary-units', { name, description, vocabularyGroupId }),

  update: (id, { name, description, vocabularyGroupId, orderIndex }) =>
    privateApi.put(`/vocabulary-units/${id}`, { name, description, vocabularyGroupId, orderIndex }),

  delete: (id) =>
    privateApi.delete(`/vocabulary-units/${id}`),
};

// ── User Saved Words ──
export const userSavedWordApi = {
  save: ({ dictionaryWordId, sourceSentence = '', sourceUrl = '', vocabularyUnitId }) =>
    privateApi.post('/user-saved-words', {
      dictionaryWordId,
      sourceSentence,
      sourceUrl,
      vocabularyUnitId,
    }),

  findAll: (vocabularyUnitId, { pageNo = 1, pageSize = 20, sort = 'id,asc', keyword = '' } = {}) =>
    privateApi.get(`/user-saved-words/find-all/${vocabularyUnitId}`, {
      params: { pageNo, pageSize, sort, keyword },
    }),

  delete: (id) =>
    privateApi.delete(`/user-saved-words/${id}`),

  syncAnki: () =>
    privateApi.post('/user-saved-words/sync-anki'),

  resyncAnki: (id) =>
    privateApi.post(`/user-saved-words/resync-anki/${id}`),
};
