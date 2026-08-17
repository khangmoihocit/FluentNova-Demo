import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FireFilled, CheckCircleFilled } from '@ant-design/icons';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// StreakWidget — Daily 7-day calendar
//
// Backend DTO (UserStreakResponse):
//   { currentStreak: number, longestStreak: number, lastActivityDate: "YYYY-MM-DD" }
//
// We derive the weekly activity from currentStreak + lastActivityDate
// ═══════════════════════════════════════════

const StreakWidget = ({ streakData }) => {
    const { t } = useTranslation();
    const { currentStreak = 0, lastActivityDate } = streakData || {};
    
    const dayLabels = [
        t('common.days.mon'), t('common.days.tue'), t('common.days.wed'),
        t('common.days.thu'), t('common.days.fri'), t('common.days.sat'),
        t('common.days.sun')
    ];

    // Build the 7-day map for current week (Mon → Sun)
    // Derive which days were active based on streak count + last activity date
    const weekDays = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // getDay(): 0 = Sun, 1 = Mon ... 6 = Sat → map to Mon-based index
        const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

        // Calculate the Monday of this week
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() - currentDayIndex);

        // Calculate the set of active dates from streak
        const activeDates = new Set();
        if (lastActivityDate && currentStreak > 0) {
            const lastActive = new Date(lastActivityDate);
            lastActive.setHours(0, 0, 0, 0);
            for (let i = 0; i < currentStreak; i++) {
                const d = new Date(lastActive);
                d.setDate(lastActive.getDate() - i);
                activeDates.add(d.toISOString().split('T')[0]);
            }
        }

        return dayLabels.map((label, index) => {
            const dayDate = new Date(mondayDate);
            dayDate.setDate(mondayDate.getDate() + index);
            const dateStr = dayDate.toISOString().split('T')[0];

            const isToday = index === currentDayIndex;
            const isFuture = index > currentDayIndex;
            const isCompleted = activeDates.has(dateStr);

            let statusClass = styles.future;
            if (isCompleted) statusClass = styles.completed;
            if (isToday) statusClass = isCompleted ? `${styles.today} ${styles.completed}` : styles.today;

            return { label, isToday, isFuture, isCompleted, statusClass, date: dayDate.getDate() };
        });
    }, [currentStreak, lastActivityDate]);

    return (
        <div className={styles['streak-widget']}>
            <div className={styles['streak-count-row']}>
                <span className={styles['streak-number']}>{currentStreak}</span>
                <span className={styles['streak-unit']}>
                    <FireFilled style={{ color: '#ff8c42', marginRight: 4 }} />
                    <span className={styles['unit-text']}>{t('home.streak.daysConsecutive')}</span>
                </span>
            </div>
            <p className={`${styles['streak-label']} ${styles['mobile-hide']}`}>
                {t('home.streak.encouragement')}
            </p>

            <div className={styles['week-row']}>
                {weekDays.map((day, i) => (
                    <div key={i} className={styles['day-item']}>
                        <span className={styles['day-label']}>{day.label}</span>
                        <div className={`${styles['day-circle']} ${day.statusClass}`}>
                            {day.isCompleted ? (
                                <CheckCircleFilled style={{ fontSize: 16 }} />
                            ) : (
                                <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.75rem' }}>
                                    {day.date}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StreakWidget;
