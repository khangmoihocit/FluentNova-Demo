import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FireFilled,
    ThunderboltFilled,
    TrophyFilled,
    ClockCircleFilled,
    PlayCircleFilled,
    BookFilled,
} from '@ant-design/icons';
import StreakWidget from './StreakWidget';
import { getUser } from '../../../utils/cookie';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// HomeOverviewDashboard
// Personalized hero dashboard for logged-in users
//
// Left Card:  Streak Widget + Learning Statistics
// Right Card: Challenge CTA + Game Statistics (clickable → one-click play)
//
// Backend DTOs:
//   LearningStatisticsResponse: { grandTotalDuration (seconds), dictationCompletedVideos, shadowingCompletedVideos, ... }
//   GameStatisticsResponse: { totalGames, overallAverageScore, bestDictationScore, bestShadowingScore }
//   UserStreakResponse: { currentStreak, longestStreak, lastActivityDate }
// ═══════════════════════════════════════════

/**
 * Format seconds into a readable "Xh Ym" string
 */
const formatDuration = (totalSeconds, t) => {
    if (!totalSeconds || totalSeconds <= 0) return `0 ${t('profile.quickStats.minutes')}`;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours} ${t('common.hour', 'giờ')}`;
    return `${minutes} ${t('profile.quickStats.minutes')}`;
};

const HomeOverviewDashboard = ({ streakData, learningStats, gameStats }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = getUser();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home.greeting.morning', 'Chào buổi sáng');
        if (hour < 18) return t('home.greeting.afternoon', 'Chào buổi chiều');
        return t('home.greeting.evening', 'Chào buổi tối');
    };

    const grandTotal = learningStats?.grandTotalDuration || 0;
    const completedVideos = (Number(learningStats?.dictationCompletedVideos) || 0)
        + (Number(learningStats?.shadowingCompletedVideos) || 0);

    const totalGames = gameStats?.totalGames || 0;
    const bestScore = gameStats?.bestDictationScore || 0;
    const avgScore = gameStats?.overallAverageScore || 0;

    const handlePlayChallenge = () => {
        navigate('/game/setup');
    };

    return (
        <div className={styles['home-section']}>
            {/* Greeting Header */}
            <div className={styles['dashboard-greeting']}>
                <span className={styles['greeting-text']}>{getGreeting()},</span>
                <h1 className={styles['user-name']}>{user?.fullName || t('common.navigation.profile')}!</h1>
            </div>

            <div className={styles['overview-grid']}>
            {/* ── LEFT CARD: Learning Progress & Streak ── */}
            <div className={styles['overview-card-left']}>
                <StreakWidget streakData={streakData} />

                <div className={styles['learning-stats']}>
                    <div className={styles['stat-row']}>
                        <div className={styles['stat-item']}>
                            <span className={styles['stat-icon']}>
                                <ClockCircleFilled />
                            </span>
                            <div className={styles['stat-content']}>
                                <span className={styles['stat-value']}>
                                    {formatDuration(grandTotal, t)}
                                </span>
                                <span className={styles['stat-label']}>{t('home.stats.totalTime')}</span>
                            </div>
                        </div>
                        <div className={styles['stat-item']}>
                            <span className={styles['stat-icon']}>
                                <BookFilled />
                            </span>
                            <div className={styles['stat-content']}>
                                <span className={styles['stat-value']}>
                                    {completedVideos}
                                </span>
                                <span className={styles['stat-label']}>{t('home.stats.completedVideos')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT CARD: Challenge CTA + Game Stats ── */}
            <div
                className={`${styles['overview-card-right']} ${styles['mobile-hide']}`}
                onClick={handlePlayChallenge}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayChallenge()}
            >
                {/* Decorative background elements */}
                <div className={styles['challenge-glow']} />
                <div className={styles['challenge-glow-2']} />

                <div className={styles['challenge-header']}>
                    <span className={styles['challenge-icon']}>🎧</span>
                    <h2 className={styles['challenge-title']}>
                        {t('home.challenge.dailyTitle')}
                    </h2>
                    <p className={`${styles['challenge-subtitle']} ${styles['mobile-hide']}`}>
                        {t('home.challenge.subtitle')}
                    </p>
                </div>

                <div className={`${styles['game-stats']} ${styles['mobile-hide']}`}>
                    {totalGames > 0 ? (
                        <>
                            <div className={styles['game-stat-item']}>
                                <TrophyFilled className={styles['trophy-icon']} />
                                <div className={styles['stat-value-group']}>
                                    <span className={styles['game-stat-value']}>{Math.round(bestScore)}</span>
                                    <span className={styles['game-stat-label']}>{t('home.challenge.bestRecord')}</span>
                                </div>
                            </div>
                            <div className={styles['game-stat-divider']} />
                            <div className={styles['game-stat-item']}>
                                <ThunderboltFilled className={styles['bolt-icon']} />
                                <div className={styles['stat-value-group']}>
                                    <span className={styles['game-stat-value']}>{totalGames}</span>
                                    <span className={styles['game-stat-label']}>{t('home.challenge.participationCount')}</span>
                                </div>
                            </div>
                            <div className={styles['game-stat-divider']} />
                            <div className={styles['game-stat-item']}>
                                <FireFilled className={styles['fire-icon']} />
                                <div className={styles['stat-value-group']}>
                                    <span className={styles['game-stat-value']}>{Math.round(avgScore)}</span>
                                    <span className={styles['game-stat-label']}>{t('home.challenge.average')}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className={styles['no-games-text']}>
                            {t('home.challenge.empty')}
                        </p>
                    )}
                </div>

                <div className={styles['play-cta']}>
                    <PlayCircleFilled />
                    <span>{t('home.challenge.playNow')}</span>
                </div>
            </div>
          </div>
        </div>
    );
};

export default HomeOverviewDashboard;
