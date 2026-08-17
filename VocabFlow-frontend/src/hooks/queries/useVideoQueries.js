import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { youtubeApi } from '../../features/youtubeLearning/api/youtube.api';

const VIDEO_LIST_STALE_TIME = 2 * 60 * 1000;
const VIDEO_LIST_GC_TIME = 5 * 60 * 1000;

export const useChannelsQuery = (params = { pageNo: 1, pageSize: 50 }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.channels, params],
    queryFn: async () => {
      const res = await youtubeApi.getChannels(params);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useVideoLessonsInfiniteQuery = (filters, options = {}) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.videos(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        pageNo: pageParam,
        pageSize: 20,
        sort: filters.sort,
      };

      if (filters.channelId) params.channelId = filters.channelId;
      if (filters.categoryId) params.categoryIds = filters.categoryId;
      if (filters.difficultyLevel) params.difficultyLevel = filters.difficultyLevel;

      const res = await youtubeApi.getVideoLessons(params);
      return res.data || { data: [], pageNo: pageParam, totalPages: 0, totalElements: 0 };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.pageNo || 1;
      const totalPages = lastPage?.totalPages || 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: options.enabled ?? true,
    staleTime: VIDEO_LIST_STALE_TIME,
    gcTime: VIDEO_LIST_GC_TIME,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
