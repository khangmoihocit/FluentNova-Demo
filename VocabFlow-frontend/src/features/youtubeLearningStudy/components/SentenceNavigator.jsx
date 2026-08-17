import React, { useRef, useEffect, useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, CheckOutlined, ArrowRightOutlined } from '@ant-design/icons';
import styles from '../styles/SentenceNavigator.module.scss';

/**
 * SentenceNavigator — scrollable chip bar showing sentence numbers.
 *
 * Props:
 *  - total (number)
 *  - current (number) — active index
 *  - onChange (fn)
 *  - completedSet (Set) — indices completed in current session
 *  - segments (array) — raw segment objects (optional, for history badges)
 *  - mode ('dictation' | 'shadowing') — which score field to check
 *  - showVerticalToggle (bool) — show the ↘ toggle button (only in DictationPanel)
 *  - verticalNav (bool) — whether vertical mode is active
 *  - onToggleVerticalNav (fn) — toggle vertical mode callback
 */
const SentenceNavigator = ({
    total = 0,
    current = 0,
    onChange,
    completedSet = new Set(),
    segments = [],
    mode = 'dictation',
    showVerticalToggle = false,
    verticalNav = false,
    onToggleVerticalNav,
}) => {
    const scrollRef = useRef(null);
    const chipRefs = useRef({});

    // Build a set of indices that have historical scores from the API
    const historySet = useMemo(() => {
        const set = new Set();
        segments.forEach((seg, idx) => {
            const attempt = seg.userAttempt;
            if (!attempt) return;
            if (mode === 'dictation' && attempt.dictationScore > 0) {
                set.add(idx);
            } else if (mode === 'shadowing' && attempt.shadowingScore > 0) {
                set.add(idx);
            }
        });
        return set;
    }, [segments, mode]);

    // Auto-scroll chip into view when current changes
    useEffect(() => {
        const chip = chipRefs.current[current];
        if (chip && scrollRef.current) {
            chip.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [current]);

    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 200; // Scroll roughly 3-4 chips
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className={styles['navigator-container']}>
            <Button
                className={styles['nav-btn']}
                size="small"
                icon={<LeftOutlined />}
                onClick={() => handleScroll('left')}
            />
            <div className={styles['chip-scroll']} ref={scrollRef}>
                {Array.from({ length: total }, (_, i) => {
                    const isActive = i === current;
                    const isSessionCompleted = completedSet.has(i);
                    const isHistoryCompleted = historySet.has(i);
                    const isDone = isSessionCompleted || isHistoryCompleted;

                    const chipClass = [
                        styles.chip,
                        isActive ? styles.active : '',
                        isDone ? styles.completed : '',
                    ].filter(Boolean).join(' ');

                    const score = segments[i]?.userAttempt
                        ? (mode === 'dictation'
                            ? segments[i].userAttempt.dictationScore
                            : segments[i].userAttempt.shadowingScore)
                        : null;

                    const tooltipText = isDone && score != null
                        ? `Câu ${i + 1} — Điểm: ${score}%`
                        : `Câu ${i + 1}`;

                    return (
                        <Tooltip key={i} title={tooltipText} mouseEnterDelay={0.4}>
                            <button
                                ref={(el) => { chipRefs.current[i] = el; }}
                                className={chipClass}
                                onClick={() => onChange && onChange(i)}
                                type="button"
                            >
                                {isDone && !isActive ? (
                                    <span className={styles['chip-check']}>
                                        <CheckOutlined style={{ fontSize: 9 }} />
                                        {' '}{i + 1}
                                    </span>
                                ) : (
                                    i + 1
                                )}
                            </button>
                        </Tooltip>
                    );
                })}
            </div>
            <Button
                className={styles['nav-btn']}
                size="small"
                icon={<RightOutlined />}
                onClick={() => handleScroll('right')}
            />

            {/* Toggle vertical sentence list (only in DictationPanel) */}
            {showVerticalToggle && (
                <Tooltip title={verticalNav ? 'Thu gọn danh sách' : 'Mở rộng danh sách câu'}>
                    <Button
                        className={`${styles['toggle-vertical-btn']} ${verticalNav ? styles['toggle-active'] : ''}`}
                        size="small"
                        icon={
                            <ArrowRightOutlined
                                style={{
                                    transform: verticalNav ? 'rotate(-135deg)' : 'rotate(135deg)',
                                    transition: 'transform 0.3s ease',
                                }}
                            />
                        }
                        onClick={onToggleVerticalNav}
                    />
                </Tooltip>
            )}
        </div>
    );
};

export default SentenceNavigator;
