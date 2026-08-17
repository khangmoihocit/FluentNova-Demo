import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Switch, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    CaretRightOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import styles from '../styles/TranscriptList.module.scss';

/**
 * Format seconds to MM:SS
 */
const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const TranscriptList = ({
    segments = [],
    currentTime = 0,
    isPlaying = false,
    onSeek,
    onTogglePlay,
    showEn = true,
    onShowEnChange,
    showIpa = false,
    onShowIpaChange,
    showTranslation = false,
    onShowTranslationChange
}) => {
    const { t } = useTranslation();
    const listRef = useRef(null);
    const itemRefs = useRef({});

    // Determine active segment based on current playback time
    const activeIndex = useMemo(() => {
        for (let i = segments.length - 1; i >= 0; i--) {
            if (currentTime >= segments[i].startTime) {
                return i;
            }
        }
        return -1;
    }, [segments, currentTime]);

    // Auto-scroll active segment to the top
    useEffect(() => {
        if (activeIndex >= 0 && itemRefs.current[activeIndex] && listRef.current) {
            const item = itemRefs.current[activeIndex];
            const container = listRef.current;

            // Calculate position of item relative to container
            const itemTop = item.offsetTop - container.offsetTop;

            container.scrollTo({
                top: itemTop,
                behavior: 'smooth',
            });
        }
    }, [activeIndex]);

    const handleClick = (segment) => {
        if (onSeek) {
            onSeek(segment.startTime);
        }
    };

    return (
        <div className={styles['transcript-container']}>
            <div className={styles['transcript-header']}>
                <span className={styles['header-title']}>{t('learning.transcript.title')}</span>
                <div className={styles['header-toggle']} style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        type="text"
                        size="small"
                        icon={showEn ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={() => onShowEnChange && onShowEnChange(!showEn)}
                        style={{ color: showEn ? '#1890ff' : '#8c8c8c', padding: '0 4px' }}
                    >
                        {t('learning.transcript.eng')}
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={showIpa ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={() => onShowIpaChange && onShowIpaChange(!showIpa)}
                        style={{ color: showIpa ? '#1890ff' : '#8c8c8c', padding: '0 4px' }}
                    >
                        {t('learning.transcript.ipa')}
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={showTranslation ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        onClick={() => onShowTranslationChange && onShowTranslationChange(!showTranslation)}
                        style={{ color: showTranslation ? '#1890ff' : '#8c8c8c', padding: '0 4px' }}
                    >
                        {t('learning.transcript.trans')}
                    </Button>
                </div>
            </div>

            <div className={styles['transcript-list']} ref={listRef}>
                {segments.map((segment, index) => (
                    <div
                        key={segment.id || index}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        className={`${styles['transcript-item']} ${index === activeIndex ? styles.active : ''}`}
                        onClick={() => handleClick(segment)}
                    >
                        {index === activeIndex ? (
                            isPlaying ? (
                                <PauseCircleOutlined
                                    className={`${styles['play-icon']} ${styles.clickable}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onTogglePlay) onTogglePlay();
                                    }}
                                />
                            ) : (
                                <PlayCircleOutlined
                                    className={`${styles['play-icon']} ${styles.clickable}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onTogglePlay) onTogglePlay();
                                    }}
                                />
                            )
                        ) : (
                            <PlayCircleOutlined
                                className={styles['play-icon']}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick(segment);
                                }}
                            />
                        )}
                        <div className={styles['segment-content']}>
                            {/* <div className={styles.timestamp}>
                                {formatTime(segment.startTime)} – {formatTime(segment.endTime)}
                            </div> */}
                            {showEn && (
                                <div className={styles['segment-text']} style={{ fontSize: '14px' }}>
                                    {segment.englishText}
                                </div>
                            )}
                            {showIpa && segment.ipa && (
                                <div className={styles['segment-ipa']} style={{ fontSize: '13px', color: '#8c8c8c', fontStyle: 'italic', marginTop: '2px' }}>
                                    {segment.ipa}
                                </div>
                            )}
                            {showTranslation && (segment.vietnameseTranslation || segment.vietnameseText) && (
                                <div className={styles['segment-translation']} style={{ fontSize: '14px', color: '#555', marginTop: '2px' }}>
                                    {segment.vietnameseTranslation || segment.vietnameseText}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TranscriptList;
