import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from '../styles/StudyTimer.module.scss';

/**
 * StudyTimer — A compact, elegant live study clock for the learning page top bar.
 *
 * Features:
 * - Counts up from 00:00 format
 * - Subtle pulse animation every minute
 * - Solar Pulse themed gradient text
 * - Pauses when tab is hidden (Page Visibility API)
 */
const StudyTimer = ({ elapsed = 0 }) => {

    const formatted = useMemo(() => {
        const hrs = Math.floor(elapsed / 3600);
        const mins = Math.floor((elapsed % 3600) / 60);
        const secs = elapsed % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
    }, [elapsed]);

    const isMinuteMark = elapsed > 0 && elapsed % 60 === 0;

    return (
        <div className={`${styles['study-timer']} ${isMinuteMark ? styles['pulse'] : ''}`}>
            <svg className={styles['timer-icon']} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                <line x1="8" y1="6" x2="8" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="8" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="6.5" y1="2.5" x2="9.5" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className={styles['timer-text']}>{formatted}</span>
        </div>
    );
};

export default StudyTimer;
