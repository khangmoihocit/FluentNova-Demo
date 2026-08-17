import React, { useRef, useEffect, useMemo } from 'react';
import { Button, Tooltip, Switch, Progress } from 'antd';
import {
    AudioOutlined,
    PlayCircleOutlined,
    PauseOutlined,
    RedoOutlined,
} from '@ant-design/icons';
import useFullLessonShadowing from '../hooks/useFullLessonShadowing';
import useShortcuts from '../hooks/useShortcuts';
import { scoreColor } from '../utils/scoring';
import styles from '../styles/ShadowingPanel.module.scss';

// ─── Helper ───────────────────────────────────────────────────
const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── Component ────────────────────────────────────────────────

const FullLessonShadowing = ({ isActive, segments, videoRef, currentTime, showIpa, showTrans }) => {
    const {
        isRecording,
        playVideoAlongside,
        setPlayVideoAlongside,
        audioUrl,
        isPlayingUserAudio,
        result,
        toggleRecording,
        playUserAudio,
        clearResult,
        timeLeft,
    } = useFullLessonShadowing({ segments, videoRef, isActive });

    const scrollContainerRef = useRef(null);
    const segmentRefs = useRef([]);

    // ── Keyboard shortcuts (Shift+` → record, Space → play audio) ──
    useShortcuts({
        toggleRecording,
        playSample: () => { },       // no sample play in full lesson mode
        playUserAudio,
        goToSentence: () => { },     // no sentence navigation in full lesson mode
        currentIndex: 0,
        isActive,
    });

    // ── Find active segment based on currentTime ──
    const activeIndex = useMemo(() => {
        if (!isRecording) return -1;
        // Find the first segment that hasn't finished yet
        return segments.findIndex((seg) => currentTime < seg.endTime);
    }, [segments, currentTime, isRecording]);

    // ── Auto-scroll to active segment ──
    useEffect(() => {
        if (activeIndex >= 0 && segmentRefs.current[activeIndex]) {
            segmentRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex]);

    // ── Results view (after recording stops with results) ──
    if (result) {
        return (
            <>
                <div className={styles['full-lesson-body']}>
                    {/* Score header AND recognized text in new layout */}
                    <div className={styles['result-container']} style={{ margin: '16px' }}>
                        <div className={styles['result-left']}>
                            <div className={styles['comparison-words']}>
                                {(result.comparison || []).map((item, idx) => {
                                    if (item.status === 'missing') return null;
                                    const text = item.userWord || item.word;
                                    const isCorrect = item.status === 'correct';
                                    return (
                                        <span key={idx} className={styles[`word-${isCorrect ? 'correct' : 'incorrect'}`]}>
                                            {text}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className={`${styles['feedback-alert']} ${result.score >= 80 ? styles['feedback-success'] : styles['feedback-error']}`}>
                                {result.score >= 80 ? (
                                    <>✓ Tuyệt vời! Bạn làm rất tốt.</>
                                ) : (
                                    <>✕ Chưa chính xác. Vui lòng thử lại.</>
                                )}
                            </div>
                        </div>
                        <div className={styles['result-right']}>
                            <Progress
                                type="circle"
                                percent={result.score}
                                size={56}
                                format={(p) => <span style={{ fontSize: 18, fontWeight: 700, color: result.score >= 80 ? '#52c41a' : '#d48806' }}>{Math.round(p)}</span>}
                                strokeColor={result.score >= 80 ? '#52c41a' : '#fadb14'}
                                strokeWidth={8}
                            />
                        </div>
                    </div>
                </div>

                {/* Action bar — results mode */}
                <div className={styles['action-bar']}>
                    <Tooltip title="Xem lại transcript">
                        <Button
                            className={styles['action-btn']}
                            icon={<RedoOutlined />}
                            onClick={clearResult}
                            size="small"
                        >
                            Thử lại
                        </Button>
                    </Tooltip>

                    <div className={styles['mic-wrapper']}>
                        <Tooltip title="Ghi âm lại">
                            <Button
                                className={styles['mic-btn']}
                                shape="circle"
                                icon={<AudioOutlined />}
                                onClick={() => {
                                    clearResult();
                                    // Small delay to let state clear before starting
                                    setTimeout(() => toggleRecording(), 100);
                                }}
                            />
                        </Tooltip>
                    </div>

                    {audioUrl ? (
                        <Tooltip title={isPlayingUserAudio ? 'Dừng phát' : 'Nghe lại'}>
                            <Button
                                className={styles['action-btn']}
                                icon={isPlayingUserAudio ? <PauseOutlined /> : <PlayCircleOutlined />}
                                onClick={playUserAudio}
                                size="small"
                            >
                                {isPlayingUserAudio ? 'Dừng' : 'Nghe lại'}
                            </Button>
                        </Tooltip>
                    ) : (
                        <div className={styles['action-placeholder']} />
                    )}
                </div>
            </>
        );
    }

    // ── Transcript view (idle or recording) ──
    return (
        <>
            <div className={styles['full-lesson-body']} ref={scrollContainerRef}>
                {segments.map((seg, idx) => (
                    <div
                        key={seg.id}
                        ref={(el) => (segmentRefs.current[idx] = el)}
                        className={`${styles['segment-item']} ${idx === activeIndex ? styles['segment-active'] : ''
                            }`}
                    >
                        <p className={styles['segment-english']}>{seg.englishText}</p>
                        {showIpa && seg.ipa && (
                            <p className={styles['segment-ipa']} style={{ margin: '2px 0 0', fontSize: '14px' }}>{seg.ipa}</p>
                        )}
                        {showTrans && (seg.vietnameseTranslation || seg.vietnameseText) && (
                            <p className={styles['segment-translation']} style={{ fontSize: '14px', color: '#555', margin: '2px 0 0', textAlign: 'center' }}>
                                {seg.vietnameseTranslation || seg.vietnameseText}
                            </p>
                        )}
                    </div>
                ))}

                {/* Prompt when idle */}
                {!isRecording && (
                    <div className={styles['empty-hint']} style={{ marginTop: 8 }}>
                        Nhấn nút micro để bắt đầu Shadowing cả bài
                    </div>
                )}
            </div>

            {/* Action bar — transcript mode */}
            <div className={styles['action-bar']}>
                {/* Left — Video alongside toggle */}
                <div className={styles['video-along-toggle']}>
                    <Switch
                        size="small"
                        checked={playVideoAlongside}
                        onChange={setPlayVideoAlongside}
                        disabled={isRecording}
                    />
                    <span className={styles['toggle-text']}>Phát âm thanh</span>
                </div>

                {/* Center — Mic */}
                <div className={styles['mic-wrapper']}>
                    <Tooltip title={isRecording ? 'Dừng ghi' : 'Bắt đầu ghi âm'}>
                        <Button
                            className={`${styles['mic-btn']} ${isRecording ? styles['mic-recording'] : ''
                                }`}
                            shape="circle"
                            icon={<AudioOutlined />}
                            onClick={toggleRecording}
                        />
                    </Tooltip>
                    {isRecording && (
                        <span className={styles['recording-label']}>Đang ghi... ({formatTime(timeLeft)})</span>
                    )}
                </div>

                {/* Right — Playback (only when audio exists and not recording) */}
                {audioUrl && !isRecording ? (
                    <Tooltip title={isPlayingUserAudio ? 'Dừng phát' : 'Nghe lại'}>
                        <Button
                            className={styles['action-btn']}
                            icon={isPlayingUserAudio ? <PauseOutlined /> : <PlayCircleOutlined />}
                            onClick={playUserAudio}
                            size="small"
                        >
                            {isPlayingUserAudio ? 'Dừng' : 'Nghe lại'}
                        </Button>
                    </Tooltip>
                ) : (
                    <div className={styles['action-placeholder']} />
                )}
            </div>
        </>
    );
};

export default FullLessonShadowing;
