import React from 'react';
import { formatDuration, formatMinutes } from '../utils/formatters';
import './LearningStatisticsCard.scss';

// --- Skeleton Loader ---
const StatisticsSkeleton = () => (
    <div className="stats-card stats-card--skeleton">
        <div className="stats-card__header">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--subtitle" />
        </div>
        <div className="stats-card__grid">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="stats-card__item">
                    <div className="skeleton-line skeleton-line--value" />
                    <div className="skeleton-line skeleton-line--label" />
                </div>
            ))}
        </div>
    </div>
);

// --- Empty State ---
const StatisticsEmpty = () => (
    <div className="stats-card stats-card--empty">
        <div className="stats-card__empty-icon">📊</div>
        <p className="stats-card__empty-title">Chưa có dữ liệu thống kê</p>
        <p className="stats-card__empty-desc">
            Bắt đầu học một bài Dictation hoặc Shadowing để xem thống kê của bạn tại đây!
        </p>
    </div>
);

const LearningStatisticsCard = ({ statistics, streak, loading }) => {
    if (loading) return <StatisticsSkeleton />;

    const isAllZero = statistics &&
        statistics.grandTotalDuration === 0 &&
        statistics.dictationCompletedVideos === 0 &&
        statistics.shadowingCompletedVideos === 0;

    if (!statistics || isAllZero) return <StatisticsEmpty />;

    const statItems = [
        {
            value: formatDuration(statistics.grandTotalDuration),
            label: 'Tổng thời gian học',
            icon: '⏱️',
            accent: 'total',
        },
        {
            value: formatMinutes(statistics.totalDictationDuration),
            suffix: 'phút',
            label: 'Dictation',
            icon: '✍️',
            accent: 'dictation',
        },
        {
            value: formatMinutes(statistics.totalShadowingDuration),
            suffix: 'phút',
            label: 'Shadowing',
            icon: '🗣️',
            accent: 'shadowing',
        },
        {
            value: statistics.dictationCompletedVideos?.toString() || '0',
            suffix: 'video',
            label: 'Dictation hoàn thành',
            icon: '✅',
            accent: 'completed',
        },
        {
            value: statistics.shadowingCompletedVideos?.toString() || '0',
            suffix: 'video',
            label: 'Shadowing hoàn thành',
            icon: '🎯',
            accent: 'completed',
        },
    ];

    return (
        <div className="stats-card">
            {/* Header with Streak */}
            <div className="stats-card__header">
                <div>
                    <h2 className="stats-card__title">Tổng quan học tập</h2>
                    <p className="stats-card__subtitle">Thống kê tiến trình Dictation & Shadowing</p>
                </div>
                {streak && (
                    <div className="stats-card__streak">
                        <span className="stats-card__streak-fire">🔥</span>
                        <div className="stats-card__streak-info">
                            <span className="stats-card__streak-count">{streak.currentStreak || 0}</span>
                            <span className="stats-card__streak-label">ngày liên tiếp</span>
                        </div>
                        {streak.longestStreak > 0 && (
                            <div className="stats-card__streak-best">
                                Kỷ lục: {streak.longestStreak} ngày
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="stats-card__grid">
                {statItems.map((item, index) => (
                    <div key={index} className={`stats-card__item stats-card__item--${item.accent}`}>
                        <span className="stats-card__item-icon">{item.icon}</span>
                        <div className="stats-card__item-content">
                            <span className="stats-card__item-value">
                                {item.value}
                                {item.suffix && <span className="stats-card__item-suffix">{item.suffix}</span>}
                            </span>
                            <span className="stats-card__item-label">{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LearningStatisticsCard;
