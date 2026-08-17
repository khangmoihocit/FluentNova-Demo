import React from 'react';
import HomeOverviewDashboard from './HomeOverviewDashboard';
import GuestWelcomeBanner from './GuestWelcomeBanner';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// HabitHeroSection
// Logged-in: Personalized Overview Dashboard
// Guest: Full-width Welcome Banner
// ═══════════════════════════════════════════

const HabitHeroSection = ({ isGuest, streakData, learningStats, gameStats }) => {
    if (isGuest) {
        return (
            <div className={styles['home-section']}>
                <GuestWelcomeBanner />
            </div>
        );
    }

    return (
        <HomeOverviewDashboard
            streakData={streakData}
            learningStats={learningStats}
            gameStats={gameStats}
        />
    );
};

export default HabitHeroSection;
