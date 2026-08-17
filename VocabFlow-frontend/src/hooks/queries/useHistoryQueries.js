import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { progressApi } from '../../features/learningHub/api/progress.api';
import { isAuthenticated } from '../../utils/auth';

const HISTORY_STALE_TIME = 60 * 1000;
const HISTORY_GC_TIME = 5 * 60 * 1000;

export const useRecentLearningHistoryQuery = (limit = 5, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.learningHistoryPage({ pageNo: 1, pageSize: limit }),
    queryFn: async () => {
      const res = await progressApi.getHistory({ pageNo: 1, pageSize: limit });
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: HISTORY_STALE_TIME,
    gcTime: HISTORY_GC_TIME,
    ...options,
  });
};

export const useLearningHistoryInfiniteQuery = (pageSize = 10, options = {}) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.learningHistory(pageSize),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await progressApi.getHistory({ pageNo: pageParam, pageSize });
      return res.success ? res.data : { data: [], pageNo: pageParam, totalPages: 0 };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage?.pageNo || 1;
      const totalPages = lastPage?.totalPages || 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: HISTORY_STALE_TIME,
    gcTime: HISTORY_GC_TIME,
    ...options,
  });
};
