import React, { useRef, useEffect, useMemo } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useStudyAttempt } from '../context/AttemptSyncContext';
import { runClientCheck } from '../utils/dictation';
import styles from '../styles/VerticalSentenceList.module.scss';

/**
 * maskText — replaces each non-space character with '*'
 * Preserves word spacing so the masked text has the same visual shape.
 */
const maskText = (text) => {
    if (!text) return '';
    return text.replace(/\S/g, '*');
};

/**
 * VerticalSentenceList — right-column panel showing all sentences vertically.
 *
 * Props:
 *  - segments (array)       — raw segment objects
 *  - currentIndex (number)  — active sentence index
 *  - onIndexChange (fn)     — called with index when user clicks a card
 *  - completedSet (Set)     — indices completed in current session
 *  - mode ('dictation')     — which score field to check for history
 */
const VerticalSentenceList = ({
    segments = [],
    currentIndex = 0,
    onIndexChange,
    completedSet = new Set(),
    mode = 'dictation',
}) => {
    const listRef = useRef(null);
    const cardRefs = useRef({});

    const { attempts } = useStudyAttempt();

    // Build a set of indices that have historical scores from the API or Context
    const historySet = useMemo(() => {
        const set = new Set();
        segments.forEach((seg, idx) => {
            const apiAttempt = seg.userAttempt;
            const ctxAttempt = attempts[seg.id];

            if (mode === 'dictation') {
                const textToCheck = ctxAttempt?.dictationUserText || apiAttempt?.dictationUserText;
                const passingLocalCheck = textToCheck
                    ? runClientCheck(seg, textToCheck)?.allCorrect
                    : false;

                if (passingLocalCheck) {
                    set.add(idx);
                }
            } else if (mode === 'shadowing') {
                if ((ctxAttempt && ctxAttempt.shadowingScore >= 80) || (apiAttempt && apiAttempt.shadowingScore >= 80)) {
                    set.add(idx);
                }
            }
        });
        return set;
    }, [segments, mode, attempts]);

    // Calculate completion progress
    const completionCount = useMemo(() => {
        const allCompleted = new Set([...completedSet, ...historySet]);
        return allCompleted.size;
    }, [completedSet, historySet]);

    const progressPercent = segments.length > 0
        ? Math.round((completionCount / segments.length) * 100)
        : 0;

    // Auto-scroll active card to the top
    useEffect(() => {
        const card = cardRefs.current[currentIndex];
        const container = listRef.current;
        if (card && container) {
            // Calculate position of card relative to container
            const cardTop = card.offsetTop - container.offsetTop;

            container.scrollTo({
                top: cardTop,
                behavior: 'smooth',
            });
        }
    }, [currentIndex]);

    return (
        <div className={styles['vertical-container']}>
            {/* Header */}
            <div className={styles['vertical-header']}>
                <span className={styles['header-title']}>Bản chép </span>
                <span className={styles['header-progress']}>
                    <span>{completionCount}/{segments.length}</span>  {progressPercent}%</span>
            </div>

            {/* Scrollable card list */}
            <div className={styles['card-list']} ref={listRef}>
                {segments.map((seg, idx) => {
                    const isActive = idx === currentIndex;
                    const isSessionDone = completedSet.has(idx);
                    const isHistoryDone = historySet.has(idx);
                    const isDone = isSessionDone || isHistoryDone;

                    const displayText = (mode === 'shadowing' || isDone)
                        ? seg.englishText
                        : maskText(seg.englishText);

                    const cardClass = [
                        styles['sentence-card'],
                        isActive ? styles['active'] : '',
                        isDone ? styles['completed'] : '',
                    ].filter(Boolean).join(' ');

                    return (
                        <div
                            key={seg.id || idx}
                            ref={(el) => { cardRefs.current[idx] = el; }}
                            className={cardClass}
                            onClick={() => onIndexChange && onIndexChange(idx)}
                        >
                            <div className={styles['card-top']}>
                                <span className={styles['card-number']}>#{idx + 1}</span>
                                <div className={styles['card-icons']}>
                                    {isDone && (
                                        <CheckCircleOutlined className={styles['icon-done']} />
                                    )}
                                </div>
                            </div>
                            <div className={styles['card-text']}>
                                {displayText}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VerticalSentenceList;
