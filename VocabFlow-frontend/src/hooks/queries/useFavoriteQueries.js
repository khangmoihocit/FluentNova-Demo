import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { favoriteApi } from '../../services/api/favoriteApi';
import { isAuthenticated } from '../../utils/auth';
import { syncVideoFavoriteState } from '../../utils/syncFavoriteCache';

export const useFavoritesQuery = (params = { pageNo: 1, pageSize: 50 }, options = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.favoritesList(params),
    queryFn: async () => {
      const res = await favoriteApi.getFavorites(params);
      return res.success ? res.data : { data: [] };
    },
    enabled: isAuthenticated() && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useToggleFavoriteMutation = (videoId, options = {}) => {
  const queryClient = useQueryClient();
  const {
    onMutate: optionOnMutate,
    onSuccess: optionOnSuccess,
    onError: optionOnError,
    onSettled: optionOnSettled,
    ...mutationOptions
  } = options;

  return useMutation({
    ...mutationOptions,
    mutationFn: () => favoriteApi.toggleFavorite(videoId),
    onMutate: async (nextIsFavorite) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.favorites, exact: false });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.videos(), exact: false });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.learningHistoryRoot, exact: false });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.discoveryVideos });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.videoDetail(videoId) });

      if (typeof nextIsFavorite === 'boolean') {
        syncVideoFavoriteState(queryClient, videoId, nextIsFavorite);
      }

      const optionContext = await optionOnMutate?.(nextIsFavorite);
      return {
        previousIsFavorite: typeof nextIsFavorite === 'boolean' ? !nextIsFavorite : undefined,
        optionContext,
      };
    },
    onSuccess: (res, variables, context) => {
      const nextIsFavorite = res.data?.isFavorited ?? variables;

      if (typeof nextIsFavorite === 'boolean') {
        syncVideoFavoriteState(queryClient, videoId, nextIsFavorite);
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites, exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.videos(), exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learningHistoryRoot, exact: false });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.discoveryVideos });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.videoDetail(videoId) });

      if (optionOnSuccess) {
        optionOnSuccess(res, variables, context?.optionContext ?? context);
      }
    },
    onError: (error, variables, context) => {
      if (typeof context?.previousIsFavorite === 'boolean') {
        syncVideoFavoriteState(queryClient, videoId, context.previousIsFavorite);
      }

      optionOnError?.(error, variables, context?.optionContext ?? context);
    },
    onSettled: (data, error, variables, context) => {
      optionOnSettled?.(data, error, variables, context?.optionContext ?? context);
    },
  });
};
