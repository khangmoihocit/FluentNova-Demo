import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { ThunderboltFilled } from '@ant-design/icons';
import DailyChallengeSetup from '../components/DailyChallengeSetup';
import GameActivityCalendar from '../components/GameActivityCalendar';
import GameStatisticsCard from '../components/GameStatisticsCard';
import GameHistoryList from '../components/GameHistoryList';
import { gameApi } from '../api/gameApi';
import { isAuthenticated } from '@/utils/auth';
import styles from '../styles/GameHubDashboard.module.scss';

const GameHubDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [historyList, setHistoryList] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [pageNo, setPageNo] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const PAGE_SIZE = 10;

    useEffect(() => {
        if (!isAuthenticated()) {
            setStatsLoading(false);
            setHistoryLoading(false);
            return;
        }
        fetchStatistics();
        fetchHistory(1);
    }, []);

    const fetchStatistics = async () => {
        try {
            setStatsLoading(true);
            const res = await gameApi.getStatistics();
            setStats(res.data);
        } catch (err) {
            notification.error({
                message: t('gameHub.stats.fetchError'),
                description: err?.message || t('gameHub.stats.fetchErrorDesc'),
            });
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchHistory = async (page) => {
        try {
            setHistoryLoading(true);
            const res = await gameApi.getHistory({ pageNo: page, pageSize: PAGE_SIZE });
            const { content, totalPages } = res.data;

            if (page === 1) {
                setHistoryList(content);
            } else {
                setHistoryList((prev) => [...prev, ...content]);
            }

            setHasMore(page < totalPages);
            setPageNo(page);
        } catch (err) {
            notification.error({
                message: t('gameHub.history.fetchError'),
                description: err?.message || t('gameHub.history.fetchErrorDesc'),
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!historyLoading && hasMore) {
            fetchHistory(pageNo + 1);
        }
    };

    return (
        <div className={styles['dashboard-page']}>
            <div className={styles['page-header']}>
                <h1 className={styles['page-title']}>
                    <ThunderboltFilled style={{ color: 'var(--color-warning)' }} />
                    {t('common.gameHub')}
                </h1>
                <p className={styles['page-subtitle']}>
                    {t('gameHub.setup.heroSubtitle1')}
                </p>
            </div>

            <div className={styles['dashboard-grid']}>
                <div className={styles['left-column']}>
                    {/* Setup Card spans the left column to keep its layout intact */}
                    <DailyChallengeSetup />
                    <GameActivityCalendar />
                </div>

                <div className={styles['right-column']}>
                    <GameStatisticsCard loading={statsLoading} stats={stats} />
                    <GameHistoryList 
                        historyList={historyList} 
                        loading={historyLoading} 
                        onLoadMore={handleLoadMore} 
                        hasMore={hasMore} 
                    />
                </div>
            </div>
        </div>
    );
};

export default GameHubDashboard;
