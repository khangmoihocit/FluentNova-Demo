import privateApi from './privateApi';

export const favoriteApi = {
  toggleFavorite: (videoId) => privateApi.post(`/favorites/toggle/${videoId}`),
  checkFavorite: (videoId) => privateApi.get(`/favorites/check/${videoId}`),
  getFavorites: (params) => privateApi.get('/favorites', { params }),
  syncVideoToAnki: (videoId) => privateApi.post(`/favorites/sync-anki/${videoId}`),
};
