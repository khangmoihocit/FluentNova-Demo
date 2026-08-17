import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { progressApi } from '../../../learningHub/api/progress.api';
import LearningStatisticsCard from '../../../learningHub/components/LearningStatisticsCard';
import LearningHistoryList from '../../../learningHub/components/LearningHistoryList';

const LearningJourneyTab = () => {
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

    // --- Fetch Stats & Streak ---
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                const [statsRes, streakRes] = await Promise.all([
                    progressApi.getStatistics(),
                    progressApi.getStreak().catch(() => null),
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

            const res = await progressApi.getHistory({ pageNo: page, pageSize: 10 });
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
            message.error('Không thể tải lịch sử học tập');
        } finally {
            setLoadingHistory(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(pageNo);
    }, [pageNo, fetchHistory]);

    return (
        <div className="tab-pane-content">
            <div className="tab-pane-content__section">
                <LearningStatisticsCard
                    statistics={statistics}
                    streak={streak}
                    loading={loadingStats}
                />
            </div>
            
            <div className="tab-pane-content__section">
                <LearningHistoryList
                    history={history}
                    loading={loadingHistory}
                    hasMore={hasMore}
                    onLoadMore={() => setPageNo(prev => prev + 1)}
                    loadingMore={loadingMore}
                />
            </div>
        </div>
    );
};

export default LearningJourneyTab;
