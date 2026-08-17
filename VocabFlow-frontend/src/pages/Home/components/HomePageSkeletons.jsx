import React from 'react';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// Skeleton Loaders — Solar Pulse animate-pulse
// Prevents layout shift while data is fetching
// ═══════════════════════════════════════════

export const HeroSkeleton = () => (
    <div className={styles['skeleton-hero']}>
        <div className={`${styles.skeleton} ${styles['skeleton-greeting']}`} />
        <div className={styles['skeleton-grid']}>
            <div className={`${styles.skeleton} ${styles['skeleton-streak']}`} />
            <div className={`${styles.skeleton} ${styles['skeleton-challenge']} ${styles['mobile-hide']}`} />
        </div>
    </div>
);

export const ContinueLearningSkeleton = () => (
    <div className={styles['home-section']}>
        <div className={styles['skeleton-section-header']}>
            <div className={`${styles.skeleton} ${styles['skeleton-title']}`} />
            <div className={`${styles.skeleton} ${styles['skeleton-link']}`} />
        </div>
        <div className={styles['skeleton-scroll-row']}>
            {[...Array(4)].map((_, i) => (
                <div key={i} className={styles['skeleton-card']}>
                    <div className={`${styles.skeleton} ${styles['skeleton-thumb']}`} />
                    <div className={styles['skeleton-body']}>
                        <div className={`${styles.skeleton} ${styles['skeleton-line']}`} />
                        <div className={`${styles.skeleton} ${styles['skeleton-line']} ${styles.short}`} />
                        <div className={`${styles.skeleton} ${styles['skeleton-line']} ${styles.progress}`} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const CategorySkeleton = () => (
    <div className={styles['home-section']}>
        {[...Array(2)].map((_, i) => (
            <div key={i} style={{ marginBottom: '32px' }}>
                <div className={styles['skeleton-section-header']}>
                    <div className={`${styles.skeleton} ${styles['skeleton-title']}`} />
                    <div className={`${styles.skeleton} ${styles['skeleton-link']}`} />
                </div>
                <div className={styles['skeleton-video-row']}>
                    {[...Array(5)].map((_, j) => (
                        <div key={j} className={styles['skeleton-video-card']}>
                            <div className={`${styles.skeleton} ${styles['skeleton-thumb']}`} />
                            <div className={styles['skeleton-body']}>
                                <div className={`${styles.skeleton} ${styles['skeleton-line']}`} />
                                <div className={`${styles.skeleton} ${styles['skeleton-line']} ${styles.short}`} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const GuestHeroSkeleton = () => (
    <div className={`${styles.skeleton}`} style={{ height: '220px', borderRadius: 'var(--radius-md)' }} />
);
