import React, { useEffect } from 'react';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from '../../utils/auth';
import {
    useGameStatsQuery,
    useLearningStatsQuery,
    useUserStreakQuery,
} from '../../hooks/queries/useUserQueries';
import { useLearningHistoryInfiniteQuery } from '../../hooks/queries/useHistoryQueries';
import { useDiscoveryVideosQuery } from '../../hooks/queries/useCategoryQueries';

import HabitHeroSection from './components/HabitHeroSection';
import ContinueLearningSection from './components/ContinueLearningSection';
import CategoryDiscoverySection from './components/CategoryDiscoverySection';

import {
    HeroSkeleton,
    ContinueLearningSkeleton,
    CategorySkeleton,
} from './components/HomePageSkeletons';

import styles from './styles/HomePage.module.scss';

const Home = () => {
    const { t } = useTranslation();
    const isGuest = !isAuthenticated();

    const streakQuery = useUserStreakQuery({ enabled: !isGuest });
    const learningStatsQuery = useLearningStatsQuery({ enabled: !isGuest });
    const gameStatsQuery = useGameStatsQuery({ enabled: !isGuest });
    const historyQuery = useLearningHistoryInfiniteQuery(10, { enabled: !isGuest });
    const discoveryQuery = useDiscoveryVideosQuery();

    useEffect(() => {
        if (discoveryQuery.isError) {
            console.error('Failed to fetch categories:', discoveryQuery.error);
            notification.error({
                message: t('home.fetchCategoryError'),
                description: t('home.fetchCategoryErrorDesc'),
            });
        }
    }, [discoveryQuery.error, discoveryQuery.isError, t]);

    const heroLoading = !isGuest
        && !streakQuery.data
        && !learningStatsQuery.data
        && !gameStatsQuery.data
        && (streakQuery.isLoading || learningStatsQuery.isLoading || gameStatsQuery.isLoading);

    const continueLoading = !isGuest && !historyQuery.data && historyQuery.isLoading;
    const categoryLoading = !discoveryQuery.data && discoveryQuery.isLoading;
    const recentVideos = (historyQuery.data?.pages || [])
        .flatMap((page) => page?.data || [])
        .slice(0, 5);

    return (
        <div className={styles['home-page']}>
            {isGuest ? (
                <HabitHeroSection isGuest />
            ) : heroLoading ? (
                <div className={styles['home-section']}>
                    <HeroSkeleton />
                </div>
            ) : (
                <HabitHeroSection
                    isGuest={false}
                    streakData={streakQuery.data}
                    learningStats={learningStatsQuery.data}
                    gameStats={gameStatsQuery.data}
                />
            )}

            {!isGuest && (
                continueLoading ? (
                    <ContinueLearningSkeleton />
                ) : (
                    <ContinueLearningSection videos={recentVideos} />
                )
            )}

            {categoryLoading ? (
                <CategorySkeleton />
            ) : (
                <CategoryDiscoverySection categories={discoveryQuery.data || []} />
            )}
        </div>
    );
};

export default Home;
