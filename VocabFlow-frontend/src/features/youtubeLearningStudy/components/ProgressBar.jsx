import React, { useMemo } from 'react';
import styles from '../styles/ProgressBar.module.scss';

/**
 * ProgressBar — Solar Pulse–themed progress indicator strip.
 *
 * Sits below the top bar showing dictation/shadowing completion progress.
 * Uses warm gradient fill with a subtle glow effect.
 */
const ProgressBar = ({ completed = 0, total = 0, mode = 'dictation' }) => {
    const percent = useMemo(() => {
        if (total <= 0) return 0;
        return Math.min(100, Math.round((completed / total) * 100));
    }, [completed, total]);

    if (total <= 0) return null;

    return (
        <div className={styles['progress-container']}>
            <div className={styles['progress-track']}>
                <div
                    className={`${styles['progress-fill']} ${styles[mode]}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <span className={styles['progress-label']}>
                {completed}/{total} câu · {percent}%
            </span>
        </div>
    );
};

export default ProgressBar;
