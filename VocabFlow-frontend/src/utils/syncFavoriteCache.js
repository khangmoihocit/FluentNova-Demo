import { QUERY_KEYS } from '../constants/queryKeys';

const FAVORITE_FIELDS = [
  'isFavorited',
  'isFavorite',
  'favorited',
  'favorite',
  'liked',
  'isLiked',
];

const getVideoIdentity = (item) => item?.id ?? item?.videoId ?? item?.videoLessonId;

const isMatchingVideo = (item, videoId) => {
  if (!item || typeof item !== 'object') return false;
  return String(getVideoIdentity(item)) === String(videoId);
};

const updateFavoriteFields = (item, isFavorite) => {
  const next = { ...item, isFavorited: isFavorite };

  FAVORITE_FIELDS.forEach((field) => {
    if (field in item) {
      next[field] = isFavorite;
    }
  });

  return next;
};

const updateNestedVideoFavoriteState = (value, videoId, isFavorite) => {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const updated = updateNestedVideoFavoriteState(item, videoId, isFavorite);
      if (updated !== item) changed = true;
      return updated;
    });
    return changed ? next : value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  let next = value;

  if (isMatchingVideo(value, videoId)) {
    next = updateFavoriteFields(value, isFavorite);
  }

  Object.keys(next).forEach((key) => {
    const current = next[key];
    if (!current || typeof current !== 'object') return;

    const updated = updateNestedVideoFavoriteState(current, videoId, isFavorite);
    if (updated !== current) {
      next = next === value ? { ...value } : { ...next };
      next[key] = updated;
    }
  });

  return next;
};

const removeFromFavoriteList = (value, videoId) => {
  if (Array.isArray(value)) {
    const next = value.filter((item) => !isMatchingVideo(item, videoId));
    return next.length === value.length ? value : next;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  let next = value;

  Object.keys(value).forEach((key) => {
    const current = value[key];
    if (!Array.isArray(current)) return;

    const updated = removeFromFavoriteList(current, videoId);
    if (updated !== current) {
      next = next === value ? { ...value } : { ...next };
      next[key] = updated;
    }
  });

  return next;
};

export const syncVideoFavoriteState = (queryClient, videoId, isFavorite) => {
  if (!queryClient || videoId == null || typeof isFavorite !== 'boolean') return;

  queryClient.setQueriesData(
    { queryKey: QUERY_KEYS.favorites, exact: false },
    (oldData) => (isFavorite ? oldData : removeFromFavoriteList(oldData, videoId))
  );

  queryClient.setQueriesData(
    { queryKey: QUERY_KEYS.videos(), exact: false },
    (oldData) => updateNestedVideoFavoriteState(oldData, videoId, isFavorite)
  );

  queryClient.setQueriesData(
    { queryKey: QUERY_KEYS.learningHistoryRoot, exact: false },
    (oldData) => updateNestedVideoFavoriteState(oldData, videoId, isFavorite)
  );

  queryClient.setQueryData(
    QUERY_KEYS.discoveryVideos,
    (oldData) => updateNestedVideoFavoriteState(oldData, videoId, isFavorite)
  );

  queryClient.setQueryData(
    QUERY_KEYS.videoDetail(videoId),
    (oldData) => updateNestedVideoFavoriteState(oldData, videoId, isFavorite)
  );
};
