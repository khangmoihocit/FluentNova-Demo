import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button, Input, Tooltip, Popover, Tag, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    BulbOutlined,
    KeyOutlined,
    CheckCircleOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    StepForwardOutlined,
    StepBackwardOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';

import useDictation from '../hooks/useDictation';
import useDictationShortcuts from '../hooks/useDictationShortcuts';
import { normalizeText } from '../utils/scoring';
import { parseWords, getCharHints } from '../utils/dictation';
import novaCheer from '@/assets/images/nova_cheer_no_bg.png';
import novaThinking from '@/assets/images/nova_thinking_no_bg.png';
import styles from '../styles/DictationPanel.module.scss';
import TimeListener from './TimeListener';

// ─── Shortcut & Rules Info Popup ────────────────────

const ShortcutContent = ({ gameMode }) => {
    const { t } = useTranslation();
    return (
        <div className={styles['shortcut-list']}>
            <div className={styles['shortcut-item']}>
                <span>{t('learning.dictation.replayTooltip')}</span>
                <span className={styles['shortcut-keys']}>
                    <Tag>Ctrl</Tag>
                </span>
            </div>
            <div className={styles['shortcut-item']}>
                <span>{t('learning.dictation.prevTooltip')}</span>
                <span className={styles['shortcut-keys']}>
                    <Tag>Ctrl</Tag> + <Tag>←</Tag>
                </span>
            </div>
            <div className={styles['shortcut-item']}>
                <span>{t('learning.dictation.nextTooltip')}</span>
                <span className={styles['shortcut-keys']}>
                    <Tag>Ctrl</Tag> + <Tag>→</Tag>
                </span>
            </div>
            <div className={styles['shortcut-item']}>
                <span>{t('learning.dictation.submit')} (Submit)</span>
                <span className={styles['shortcut-keys']}>
                    <Tag>Enter</Tag>
                </span>
            </div>

            {gameMode && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-outline-variant)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-primary)' }}>🏆 {t('learning.dictation.scoringRules')}</div>
                    <div className={styles['shortcut-item']} style={{ color: 'var(--color-muted)' }}>
                        <span>{t('learning.dictation.replayPenalty')}</span>
                        <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>-3đ</span>
                    </div>
                    <div className={styles['shortcut-item']} style={{ color: 'var(--color-muted)' }}>
                        <span>{t('learning.dictation.hintPenalty')}</span>
                        <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>-5đ</span>
                    </div>
                    <div className={styles['shortcut-item']} style={{ color: 'var(--color-muted)' }}>
                        <span>{t('learning.dictation.wrongPenalty')}</span>
                        <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>-5đ</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────

const DictationPanelUI = React.memo(({
    segments = [],
    videoRef,
    currentTime, // Still received but not used for rendering logic
    isPlaying = false,
    onTogglePlay,

    currentIndex: externalIndex,
    onIndexChange: externalSetIndex,
    completedSet: externalCompletedSet,
    onCompletedChange,
    isActive,
    // ── Game Mode props ──
    gameMode = false,
    activeDictation,

    // New props for autoAdvance control
    autoAdvance: propAutoAdvance,
    setAutoAdvance: propSetAutoAdvance,
}) => {
    const { t } = useTranslation();
    // ── Navigation & UI state ──
    const [internalIndex, setInternalIndex] = useState(0);
    const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;
    const setCurrentIndex = externalSetIndex || setInternalIndex;
    const [showHint, setShowHint] = useState(true);
    const [revealedWords, setRevealedWords] = useState({});

    const [localAutoAdvance, setLocalAutoAdvance] = useState(true);
    const autoAdvance = propAutoAdvance !== undefined ? propAutoAdvance : localAutoAdvance;
    const setAutoAdvance = propSetAutoAdvance || setLocalAutoAdvance;

    const [showIpa, setShowIpa] = useState(false);
    const [showTrans, setShowTrans] = useState(true);
    const inputRef = useRef(null);
    const justSeekedRef = useRef(false);

    const currentSegment = segments[currentIndex] || null;

    const {
        userInputs,
        completedSet,
        currentInput,
        currentResult,
        answeredCount,
        handleInputChange,
        handleCheck,
        incrementHint,
        incrementReplay,
        finalScores,
    } = activeDictation;

    // ── Parsed words for hint display ──
    const hintWords = useMemo(() => {
        return currentSegment ? parseWords(currentSegment.englishText) : [];
    }, [currentSegment]);

    // ── Word-level hint data ──
    const wordHintData = useMemo(() => {
        const typedWords = normalizeText(currentInput).split(/\s+/).filter(Boolean);
        let typedIdx = 0;

        return hintWords.map((hw) => {
            let status = 'pending';
            let typedWord = undefined;

            if (hw.clean) {
                typedWord = typedWords[typedIdx];
                if (typedWord !== undefined) {
                    if (normalizeText(typedWord) === hw.clean) {
                        status = 'correct';
                    } else {
                        status = 'incorrect';
                    }
                    typedIdx++;
                }
            } else {
                status = 'correct';
            }

            const chars = getCharHints(hw.original, hw.clean, typedWord || '');

            return {
                original: hw.original,
                clean: hw.clean,
                status: status,
                chars: chars
            };
        });
    }, [hintWords, currentInput]);

    // Reset revealed words when segment changes
    useEffect(() => {
        setRevealedWords({});
    }, [currentIndex]);

    // ── Auto-focus input when segment changes ──
    useEffect(() => {
        if (!isActive) return;
        const timer = setTimeout(() => {
            if (inputRef.current && window.innerWidth > 768) {
                inputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [currentIndex, isActive]);

    // ── Seek video to segment start and play ──
    const seekAndPlay = useCallback(
        (segment) => {
            if (segment && videoRef?.current) {
                justSeekedRef.current = true;
                videoRef.current.seekTo(segment.startTime);
                videoRef.current.playVideo();
                setTimeout(() => {
                    justSeekedRef.current = false;
                }, 600);
            }
        },
        [videoRef],
    );

    const isFirstMountRef = useRef(true);

    // ── Auto-play when segment changes ──
    useEffect(() => {
        if (!isActive) return;
        
        if (isFirstMountRef.current) {
            isFirstMountRef.current = false;
            if (currentSegment && videoRef?.current && !gameMode) {
                videoRef.current.seekTo(currentSegment.startTime);
            }
            return;
        }

        if (currentSegment) {
            seekAndPlay(currentSegment);
        }
    }, [currentIndex, isActive]);

    // ── Auto-pause video logic moved to TimeListener ──

    const lastGoToRef = useRef(0);
    // ── Navigate to a sentence ──
    const goToSentence = useCallback(
        (index) => {
            const now = Date.now();
            if (now - lastGoToRef.current < 300) return; // Prevent spamming
            
            if (index >= 0 && index < segments.length) {
                lastGoToRef.current = now;
                setCurrentIndex(index);
            }
        },
        [segments.length],
    );

    // ── Replay current segment ──
    const replaySegment = useCallback(() => {
        if (currentSegment) {
            incrementReplay(currentSegment.id);
            seekAndPlay(currentSegment);
        }
    }, [currentSegment, seekAndPlay, incrementReplay]);

    // ── Toggle play/pause ──
    const togglePlay = useCallback(() => {
        if (onTogglePlay) {
            onTogglePlay();
        } else if (videoRef?.current && currentSegment) {
            if (isPlaying) {
                videoRef.current.pauseVideo();
            } else {
                seekAndPlay(currentSegment);
            }
        }
    }, [onTogglePlay, isPlaying, videoRef, currentSegment, seekAndPlay]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCheck();
        }
    };

    useDictationShortcuts({
        replaySegment,
        goToSentence,
        currentIndex,
        isActive,
    });

    if (segments.length === 0) return null;

    return (
        <div className={styles['dictation-container']}>
            <div className={styles['dictation-header']}>
                <div className={styles['header-left']}>
                    <span className={styles.counter}>
                        {currentIndex + 1} / {segments.length}
                    </span>
                    <div className={styles['action-bar']}>
                        <Tooltip title={t('learning.dictation.replayTooltip')}>
                            <Button
                                className={styles['play-btn']}
                                icon={<PlayCircleOutlined />}
                                onClick={replaySegment}
                                size="small"
                                type="primary"
                                ghost
                            >
                                {t('learning.dictation.replay')}
                            </Button>
                        </Tooltip>
                        
                        <div className={styles['action-divider']} />

                        <Tooltip title={t('learning.dictation.prevTooltip')}>
                            <Button
                                className={styles['nav-btn']}
                                icon={<StepBackwardOutlined />}
                                disabled={currentIndex === 0}
                                onClick={() => goToSentence(currentIndex - 1)}
                                size="small"
                            />
                        </Tooltip>
                        <Tooltip title={t('learning.dictation.statusTooltip')}>
                            <Button
                                className={styles['play-btn']}
                                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                onClick={togglePlay}
                                size="small"
                            />
                        </Tooltip>
                        <Tooltip title={t('learning.dictation.nextTooltip')}>
                            <Button
                                className={styles['nav-btn']}
                                icon={<StepForwardOutlined />}
                                disabled={currentIndex >= segments.length - 1}
                                onClick={() => goToSentence(currentIndex + 1)}
                                size="small"
                            />
                        </Tooltip>
                    </div>
                </div>

                <div className={styles['header-actions']}>
                    {!gameMode && (
                        <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
                            <Button
                                type="text"
                                size="small"
                                icon={showIpa ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => setShowIpa(!showIpa)}
                                style={{ color: showIpa ? '#1890ff' : '#8c8c8c', padding: '0 4px' }}
                            >
                                {t('learning.transcript.ipa')}
                            </Button>
                            <Button
                                type="text"
                                size="small"
                                icon={showTrans ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => setShowTrans(!showTrans)}
                                style={{ color: showTrans ? '#1890ff' : '#8c8c8c', padding: '0 4px' }}
                            >
                                {t('learning.transcript.trans')}
                            </Button>
                        </div>
                    )}
                    {!gameMode && (
                        <Tooltip title={autoAdvance ? t('learning.dictation.autoAdvanceOn') : t('learning.dictation.autoAdvanceOff')}>
                            <Switch
                                checked={autoAdvance}
                                onChange={(checked) => setAutoAdvance(checked)}
                                size="small"
                            />
                        </Tooltip>
                    )}
                    <Tooltip title={showHint ? t('learning.hideHints') : t('learning.showHints')}>
                        <Button
                            size="small"
                            icon={<BulbOutlined />}
                            onClick={() => setShowHint(!showHint)}
                            type={showHint ? 'primary' : 'default'}
                        />
                    </Tooltip>
                    <Popover
                        content={<ShortcutContent gameMode={gameMode} />}
                        title={gameMode ? t('learning.dictation.shortcutsTooltip') : t('learning.shortcuts')}
                        trigger="click"
                        placement="bottomRight"
                    >
                        <Tooltip title={t('learning.dictation.shortcutsTooltip')}>
                            <Button size="small" icon={<KeyOutlined />} />
                        </Tooltip>
                    </Popover>

                    <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />} 
                        onClick={handleCheck}
                        size="small"
                        style={{ marginLeft: '4px' }}
                    >
                        {t('learning.dictation.submit')}
                    </Button>
                </div>
            </div>

            <div className={styles['dictation-body']}>
                <div className={styles['input-wrapper']}>
                    <div className={styles['input-area']}>
                        <Input.TextArea
                            ref={inputRef}
                            className={`${styles['dictation-input']} ${currentInput.length > 70 ? styles['text-left'] : ''}`}
                            placeholder={t('learning.typeHere')}
                            value={currentInput}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            autoSize={{ minRows: 2, maxRows: 5 }}
                        />
                    </div>
                </div>

                {finalScores[currentSegment.id] !== undefined && (
                    <div className={styles['score-area']}>
                        <div className={styles['score-badge']}>
                            {t('learning.dictation.score')}: {finalScores[currentSegment.id]}/100
                        </div>
                    </div>
                )}

                {showHint && (
                    <div className={styles['hint-box']}>
                        {wordHintData.map((word, wi) => {
                            const isRevealed = revealedWords[wi];
                            const isCorrect = word.status === 'correct';

                            let styleClass = styles['word-pill-pending'];
                            if (word.status === 'correct') styleClass = styles['word-pill-correct'];
                            else if (word.status === 'incorrect') styleClass = styles['word-pill-incorrect'];

                            return (
                                <div key={wi} className={styles['word-wrap']}>
                                    {!isCorrect && (
                                        <div
                                            className={styles['reveal-btn']}
                                            onClick={() => {
                                                if (!revealedWords[wi] && currentSegment) {
                                                    incrementHint(currentSegment.id);
                                                }
                                                setRevealedWords(prev => ({ ...prev, [wi]: !prev[wi] }));
                                            }}
                                        >
                                            <EyeOutlined />
                                        </div>
                                    )}
                                    <span className={`${styles['word-pill']} ${styleClass}`}>
                                        {(isCorrect || isRevealed) ? word.original : (
                                            word.chars.map((ch, ci) => (
                                                <span key={ci} className={ch.status === 'correct' ? styles['char-correct'] : ''}>
                                                    {ch.char}
                                                </span>
                                            ))
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {currentResult && (
                    (!currentResult.allCorrect || 
                     (showIpa && currentSegment?.ipa) || 
                     (showTrans && (currentSegment?.vietnameseTranslation || currentSegment?.vietnameseText)))
                ) && (
                    <div className={styles['check-result']}>
                        {currentResult.allCorrect ? (
                            <div className={styles['success-container']}>
                                {/* <img src={novaCheer} alt="Nova cổ vũ" className={styles['micro-mascot']} /> */}
                                {(showIpa || showTrans) && (
                                    <div className={styles['dictation-context']} style={{ textAlign: 'center', marginBottom: '12px' }}>
                                        {showIpa && currentSegment?.ipa && (
                                            <div className={styles['subtitle-ipa']}>
                                                {currentSegment.ipa}
                                            </div>
                                        )}
                                        {showTrans && (currentSegment?.vietnameseTranslation || currentSegment?.vietnameseText) && (
                                            <div className={styles['subtitle-trans']}>
                                                {currentSegment.vietnameseTranslation || currentSegment.vietnameseText}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles['error-result-row']}>
                                <img src={novaThinking} alt="Nova đang suy nghĩ" className={styles['micro-mascot']} />
                                <span className={styles['result-words']}>
                                    {currentResult.words.map((item, idx) => (
                                        <span key={idx}>
                                            {item.status === 'correct' && (
                                                <span className={styles['word-correct']}>{item.word} </span>
                                            )}
                                            {item.status === 'incorrect' && (
                                                <>
                                                    <span className={styles['word-incorrect']}>{item.userWord}</span>
                                                    {' → '}
                                                    <span className={styles['word-expected']}>{item.word}</span>
                                                </>
                                            )}
                                            {item.status === 'missing' && (
                                                <>
                                                    <span className={styles['word-missing']}>___</span>
                                                    {' → '}
                                                    <span className={styles['word-expected']}>{item.word}</span>
                                                </>
                                            )}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {/* ── Scoring rules reminder ── */}
                <div className={styles['scoring-rules-inline']}>
                    <span className={styles['scoring-rule']}>{t('learning.dictation.replayPenalty', 'Nghe lại từ lần 3')}: <strong>-2đ</strong></span>
                    <span className={styles['scoring-rule-divider']}>•</span>
                    <span className={styles['scoring-rule']}>{t('learning.dictation.wrongPenalty', 'Submit sai')}: <strong>-4đ</strong></span>
                    <span className={styles['scoring-rule-divider']}>•</span>
                    <span className={styles['scoring-rule']}>{t('learning.dictation.hintPenalty', 'Xem hint')}: <strong>-4đ</strong></span>
                </div>

            {/* ── TimeListener: Handles auto-pause without re-rendering this UI ── */}
            <TimeListener
                currentTime={currentTime}
                currentSegment={currentSegment}
                isPlaying={isPlaying}
                videoRef={videoRef}
                isActive={isActive}
            />
            </div>
        </div>
    );
});

const LearningDictationPanel = (props) => {
    const [internalIndex, setInternalIndex] = useState(0);
    const currentIndex = props.currentIndex !== undefined ? props.currentIndex : internalIndex;
    const setCurrentIndex = props.onIndexChange || setInternalIndex;
    const currentSegment = props.segments[currentIndex] || null;

    const [autoAdvance, setAutoAdvance] = useState(true);

    const coreDictation = useDictation({
        segments: props.segments,
        currentSegment,
        currentIndex,
        autoAdvance,
        setCurrentIndex,
        onCompletedChange: props.onCompletedChange,
    });

    return (
        <DictationPanelUI
            {...props}
            activeDictation={coreDictation}
            autoAdvance={autoAdvance}
            setAutoAdvance={setAutoAdvance}
        />
    );
};

const DictationPanel = (props) => {
    if (props.gameMode) {
        return <DictationPanelUI {...props} activeDictation={props.gameDictation} />;
    }
    return <LearningDictationPanel {...props} />;
};

export default DictationPanel;
