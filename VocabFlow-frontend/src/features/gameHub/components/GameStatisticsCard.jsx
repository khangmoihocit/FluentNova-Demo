import React from 'react';
import { Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from '../styles/GameStatisticsCard.module.scss';

const getScoreTierClass = (score) => {
    if (score >= 90) return styles['gold-tier'];
    if (score >= 75) return styles['silver-tier'];
    if (score >= 50) return styles['bronze-tier'];
    return '';
};

const GameStatisticsCard = ({ loading, stats }) => {
    const { t } = useTranslation();
    if (loading) {
        return (
            <div className={styles['stats-container']}>
                <div className={styles['stats-header']}>
                    <Skeleton.Input active size="small" style={{ width: 150 }} />
                </div>
                <div className={styles['stats-grid']}>
                    <Skeleton.Button active style={{ height: 100, width: '100%' }} />
                    <Skeleton.Button active style={{ height: 100, width: '100%' }} />
                    <Skeleton.Button active style={{ height: 100, width: '100%' }} />
                </div>
            </div>
        );
    }

    const totalGames = stats?.totalGames ?? '--';
    const overallAverageScore = stats?.overallAverageScore ?? null;
    const bestDictationScore = stats?.bestDictationScore ?? null;

    return (
        <div className={styles['stats-container']}>
            <div className={styles['stats-header']}>
                <h2>{t('gameHub.stats.title')}</h2>
                <p>{t('gameHub.stats.subtitle')}</p>
            </div>

            <div className={styles['stats-grid']}>
                <div className={styles['stat-card']}>
                    <span className={styles['stat-label']}>{t('gameHub.stats.participationCount')}</span>
                    <span className={styles['stat-value']}>{totalGames}</span>
                </div>

                <div className={`${styles['stat-card']} ${getScoreTierClass(overallAverageScore)}`}>
                    <span className={styles['stat-label']}>{t('gameHub.stats.avgScore')}</span>
                    <span className={styles['stat-value']}>
                        {overallAverageScore !== null ? Number(overallAverageScore).toFixed(1) : '--'}
                        {overallAverageScore !== null && <span className={styles['stat-suffix']}>/100</span>}
                    </span>
                </div>

                <div className={`${styles['stat-card']} ${getScoreTierClass(bestDictationScore)}`}>
                    <span className={styles['stat-label']}>{t('gameHub.stats.bestScore')}</span>
                    <span className={styles['stat-value']}>
                        {bestDictationScore !== null ? Number(bestDictationScore).toFixed(0) : '--'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GameStatisticsCard;
