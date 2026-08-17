import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { userApi } from '../../features/profile/api/user.api';
import { progressApi } from '../../features/learningHub/api/progress.api';
import { gameApi } from '../../features/gameHub/api/gameApi';
import { isAuthenticated } from '../../utils/auth';

const USER_STATS_STALE_TIME = 5 * 60 * 1000;
const USER_STATS_GC_TIME = 15 * 60 * 1000;

export const useCurrentUserQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: async () => {
      const res = await userApi.getMe();
      return res.success ? res.data : null;
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: USER_STATS_STALE_TIME,
    gcTime: USER_STATS_GC_TIME,
    ...options,
  });
};

export const useUserStreakQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.userStreak,
    queryFn: async () => {
      const res = await progressApi.getStreak();
      return res.success ? res.data : null;
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: USER_STATS_STALE_TIME,
    gcTime: USER_STATS_GC_TIME,
    ...options,
  });
};

export const useLearningStatsQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.learningStats,
    queryFn: async () => {
      const res = await progressApi.getStatistics();
      return res.success ? res.data : null;
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: USER_STATS_STALE_TIME,
    gcTime: USER_STATS_GC_TIME,
    ...options,
  });
};

export const useGameStatsQuery = (options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.gameStats,
    queryFn: async () => {
      const res = await gameApi.getStatistics();
      return res.success ? res.data : null;
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: USER_STATS_STALE_TIME,
    gcTime: USER_STATS_GC_TIME,
    ...options,
  });
};
