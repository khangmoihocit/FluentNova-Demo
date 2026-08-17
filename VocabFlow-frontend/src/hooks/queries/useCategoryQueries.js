import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { youtubeApi } from '../../features/youtubeLearning/api/youtube.api';

const ONE_DAY = 24 * 60 * 60 * 1000;

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async () => {
      const res = await youtubeApi.getCategories();
      return res.data?.data || [];
    },
    staleTime: ONE_DAY,
    gcTime: 2 * ONE_DAY,
  });
};

export const useDiscoveryVideosQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.discoveryVideos,
    queryFn: async () => {
      const res = await youtubeApi.getCategoryVideo();
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
