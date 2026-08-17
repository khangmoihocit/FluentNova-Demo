export const QUERY_KEYS = {
  categories: ['categories'],

  discoveryVideos: ['discovery', 'home-videos'],

  user: ['user'],
  currentUser: ['user', 'me'],
  userStreak: ['user', 'streak'],

  learningStats: ['user', 'statistics', 'learning'],

  gameStats: ['user', 'statistics', 'games'],

  learningHistoryRoot: ['learning-history'],

  learningHistory: (limit) => [
    'learning-history',
    { limit },
  ],

  learningHistoryPage: (params) => [
    'learning-history',
    params,
  ],

  channels: ['channels'],

  videos: (params) => (
    params ? ['videos', params] : ['videos']
  ),

  videoDetail: (videoId) => [
    'video-detail',
    videoId,
  ],

  videoProgress: (videoId) => [
    'video-progress',
    videoId,
  ],

  favorites: ['favorites'],
  favoritesList: (params) => [
    'favorites',
    params,
  ],
};
