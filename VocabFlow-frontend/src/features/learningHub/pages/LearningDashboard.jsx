import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { progressApi } from '../api/progress.api';
import LearningStatisticsCard from '../components/LearningStatisticsCard';
import LearningHistoryList from '../components/LearningHistoryList';
import './LearningDashboard.scss';

const PAGE_SIZE = 10;

const LearningDashboard = () => {
    const { t } = useTranslation();
    // --- Statistics State ---
    const [statistics, setStatistics] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // --- Streak State ---
    const [streak, setStreak] = useState(null);

    // --- History State ---
    const [history, setHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [pageNo, setPageNo] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // --- Fetch Statistics + Streak (once on mount) ---
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                const [statsRes, streakRes] = await Promise.all([
                    progressApi.getStatistics(),
                    progressApi.getStreak().catch(() => null), // streak might not exist yet
                ]);
                if (statsRes.success) setStatistics(statsRes.data);
                if (streakRes?.success) setStreak(streakRes.data);
            } catch (err) {
                console.error('Failed to load statistics:', err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    // --- Fetch History ---
    const fetchHistory = useCallback(async (page) => {
        try {
            if (page === 1) {
                setLoadingHistory(true);
            } else {
                setLoadingMore(true);
            }

            const res = await progressApi.getHistory({ pageNo: page, pageSize: PAGE_SIZE });
            if (res.success) {
                const newData = res.data;
                if (page === 1) {
                    setHistory(newData);
                } else {
                    setHistory(prev => ({
                        ...newData,
                        data: [...(prev?.data || []), ...(newData.data || [])],
                    }));
                }
                setHasMore(page < (newData.totalPages || 0));
            }
        } catch (err) {
            console.error('Failed to load history:', err);
            message.error(t('learning.dashboard.fetchError'));
        } finally {
            setLoadingHistory(false);
            setLoadingMore(false);
        }
    }, [t]);

    useEffect(() => {
        fetchHistory(pageNo);
    }, [pageNo, fetchHistory]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            setPageNo(prev => prev + 1);
        }
    };

    return (
        <div className="learning-dashboard">
            <div className="learning-dashboard__greeting">
                <h1 className="learning-dashboard__heading">Learning Hub</h1>
                <p className="learning-dashboard__desc">
                    {t('learning.dashboard.subtitle')}
                </p>
            </div>

            <div className="learning-dashboard__content">
                <LearningStatisticsCard
                    statistics={statistics}
                    streak={streak}
                    loading={loadingStats}
                />
                <LearningHistoryList
                    history={history}
                    loading={loadingHistory}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    loadingMore={loadingMore}
                />
            </div>
        </div>
    );
};

export default LearningDashboard;
