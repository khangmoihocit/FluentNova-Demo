import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Input, Spin, Tag, Tooltip, message } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClearOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    ReloadOutlined,
    SendOutlined,
    TranslationOutlined,
    VideoCameraOutlined,
    LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { fillBlankService } from '../api/fillBlankService';
import novaExcited from '@/assets/images/nova_exited_no_bg.png';
import novaHappy from '@/assets/images/nova_happy_no_bg.png';
import novaThinking from '@/assets/images/nova_thinking_no_bg.png';
import novaReading from '@/assets/images/nova_reading_no_bg.png';
import styles from '../styles/FillBlankPanel.module.scss';

const getDurationSeconds = (startedAt) => Math.max(0, Math.round((Date.now() - startedAt) / 1000));
const getDraftKey = (videoId) => `fluentnova_fill_blank_draft_${videoId}`;

const loadDraftAnswers = (videoId) => {
    if (!videoId || typeof window === 'undefined') return null;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(getDraftKey(videoId)) || 'null');
        if (!parsed || typeof parsed !== 'object') return null;
        const answers = parsed.answersByBlankId || {};
        return Object.values(answers).some((value) => String(value || '').trim()) ? answers : null;
    } catch {
        return null;
    }
};

const saveDraftAnswers = (videoId, answersByBlankId) => {
    if (!videoId || typeof window === 'undefined') return;
    const hasValue = Object.values(answersByBlankId || {}).some((value) => String(value || '').trim());
    if (!hasValue) {
        window.localStorage.removeItem(getDraftKey(videoId));
        return;
    }
    window.localStorage.setItem(getDraftKey(videoId), JSON.stringify({
        answersByBlankId,
        updatedAt: Date.now(),
    }));
};

const clearDraftAnswers = (videoId) => {
    if (!videoId || typeof window === 'undefined') return;
    window.localStorage.removeItem(getDraftKey(videoId));
};

const isValidRange = (text, blank) => {
    const start = Number(blank.startCharIndex);
    const end = Number(blank.endCharIndex);
    return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= (text || '').length;
};

const normalizeForMatch = (value) => String(value || '').trim().toLowerCase();

const getTokenRange = (text, tokenIndex) => {
    const index = Number(tokenIndex);
    if (!Number.isInteger(index) || index < 0) return null;
    const matches = [...String(text || '').matchAll(/\S+/g)];
    const token = matches[index];
    if (!token) return null;
    return { start: token.index, end: token.index + token[0].length };
};

const findUsableRange = (text, blank) => {
    if (isValidRange(text, blank)) {
        return {
            start: Number(blank.startCharIndex),
            end: Number(blank.endCharIndex),
        };
    }

    const tokenRange = getTokenRange(text, blank.tokenIndex);
    if (tokenRange) return tokenRange;

    const answer = normalizeForMatch(blank.correctAnswer || blank.answerText);
    if (!answer) return null;

    const lowerText = String(text || '').toLowerCase();
    let cursor = 0;
    while (cursor < lowerText.length) {
        const start = lowerText.indexOf(answer, cursor);
        if (start < 0) break;
        const before = lowerText[start - 1];
        const after = lowerText[start + answer.length];
        const startsClean = !before || /[\s"'([{,.;:!?-]/.test(before);
        const endsClean = !after || /[\s"')\]},.;:!?-]/.test(after);
        if (startsClean && endsClean) {
            return { start, end: start + answer.length };
        }
        cursor = start + answer.length;
    }

    return null;
};

const getResultByBlankId = (submitResult) => {
    const map = new Map();
    (submitResult?.answers || []).forEach((answer) => {
        map.set(answer.blankItemId, answer);
    });
    return map;
};

const sortBlanks = (blanks = []) => {
    return [...blanks].sort((a, b) => {
        const aStart = Number.isInteger(Number(a.startCharIndex)) ? Number(a.startCharIndex) : Number.MAX_SAFE_INTEGER;
        const bStart = Number.isInteger(Number(b.startCharIndex)) ? Number(b.startCharIndex) : Number.MAX_SAFE_INTEGER;
        if (aStart !== bStart) return aStart - bStart;
        return (a.blankOrder || 0) - (b.blankOrder || 0);
    });
};

const groupSegmentsByLineBreak = (segments = []) => {
    return segments.reduce((groups, segment) => {
        const shouldBreak = segment?.lineBreakBefore === true || segment?.line_break_before === true || segment?.lineBreakBefore === 'true';
        if (shouldBreak && groups.length > 0) {
            groups.push([]);
        }
        if (groups.length === 0) {
            groups.push([]);
        }
        groups[groups.length - 1].push(segment);
        return groups;
    }, []).filter((group) => group.length > 0);
};

const FillBlankPanel = ({
    videoId,
    currentTime = 0,
    initialResult = null,
    onCompleted,
    onSubmitResult,
    assistMode,
    onAssistModeChange,
    showActiveHighlight: propShowActiveHighlight,
    onShowActiveHighlightChange,
    scrollSyncEnabled: propScrollSyncEnabled,
    onScrollSyncEnabledChange,
}) => {
    const { t } = useTranslation();
    const [exercise, setExercise] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [answersByBlankId, setAnswersByBlankId] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [activeBlankId, setActiveBlankId] = useState(null);

    const [localShowActiveHighlight, setLocalShowActiveHighlight] = useState(true);
    const showActiveHighlight = propShowActiveHighlight !== undefined ? propShowActiveHighlight : localShowActiveHighlight;
    const setShowActiveHighlight = onShowActiveHighlightChange || setLocalShowActiveHighlight;

    const [localScrollSyncEnabled, setLocalScrollSyncEnabled] = useState(false);
    const scrollSyncEnabled = propScrollSyncEnabled !== undefined ? propScrollSyncEnabled : localScrollSyncEnabled;
    const setScrollSyncEnabled = onScrollSyncEnabledChange || setLocalScrollSyncEnabled;
    const startedAtRef = useRef(Date.now());
    const inputRefs = useRef({});

    const segments = useMemo(() => exercise?.segments || [], [exercise?.segments]);
    const segmentParagraphs = useMemo(() => groupSegmentsByLineBreak(segments), [segments]);
    const totalBlanks = exercise?.totalBlanks ?? segments.reduce((sum, segment) => sum + (segment.blanks?.length || 0), 0);
    const resultByBlankId = useMemo(() => getResultByBlankId(submitResult), [submitResult]);

    const activeSegmentId = useMemo(() => {
        for (let i = segments.length - 1; i >= 0; i -= 1) {
            if (currentTime >= Number(segments[i].startTime || 0)) return segments[i].id;
        }
        return null;
    }, [segments, currentTime]);

    const allBlankIds = useMemo(() => {
        return segments.flatMap((segment) => (segment.blanks || []).map((blank) => blank.id));
    }, [segments]);

    const fetchExercise = useCallback(async () => {
        if (!videoId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fillBlankService.getByVideo(videoId);
            const draftAnswers = loadDraftAnswers(videoId);
            setExercise(response.data);
            if (draftAnswers) {
                setSubmitResult(null);
                setAnswersByBlankId(draftAnswers);
            } else {
                setSubmitResult(initialResult || null);
                setAnswersByBlankId((initialResult?.answers || []).reduce((acc, answer) => ({
                    ...acc,
                    [answer.blankItemId]: answer.userAnswer || '',
                }), {}));
            }
            startedAtRef.current = Date.now();
        } catch (err) {
            setError(err?.message || t('learning.fillBlank.loadError', 'Could not load Listening exercise.'));
        } finally {
            setLoading(false);
        }
    }, [videoId, initialResult, t]);

    useEffect(() => {
        fetchExercise();
    }, [fetchExercise]);

    const handleAnswerChange = (blankId, value) => {
        setAnswersByBlankId((prev) => {
            const next = { ...prev, [blankId]: value };
            saveDraftAnswers(videoId, next);
            if (submitResult) setSubmitResult(null);
            return next;
        });
    };

    const focusNextBlank = (blankId) => {
        const index = allBlankIds.indexOf(blankId);
        const nextId = allBlankIds[index + 1];
        if (nextId && inputRefs.current[nextId]) {
            inputRefs.current[nextId].focus();
        }
    };

    const handleReset = () => {
        setAnswersByBlankId({});
        setSubmitResult(null);
        clearDraftAnswers(videoId);
        startedAtRef.current = Date.now();
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (!videoId || totalBlanks === 0) return;
        const missingCount = allBlankIds.filter((blankId) => !String(answersByBlankId[blankId] || '').trim()).length;
        if (missingCount > 0) {
            message.warning(t('learning.fillBlank.missingAnswers', 'Please fill in every blank before submitting.'));
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                durationSeconds: getDurationSeconds(startedAtRef.current),
                answers: allBlankIds.map((blankItemId) => ({
                    blankItemId,
                    userAnswer: answersByBlankId[blankItemId] || '',
                })),
            };
            const response = await fillBlankService.submit(videoId, payload);
            setSubmitResult(response.data);
            clearDraftAnswers(videoId);
            startedAtRef.current = Date.now();
            if (onCompleted) onCompleted(response.data);
            if (onSubmitResult) onSubmitResult(response.data);
        } catch (err) {
            message.error(err?.message || t('learning.fillBlank.submitError', 'Could not submit Listening exercise.'));
        } finally {
            setSubmitting(false);
        }
    };

    const getInputWidth = (value, placeholder) => {
        const text = value || placeholder || '';
        const charCount = Math.max(text.length, 5);
        return `${charCount + 3}ch`;
    };

    const renderBlankInput = (blank) => {
        const result = resultByBlankId.get(blank.id);
        const resultClass = result ? (result.isCorrect ? styles.correct : styles.incorrect) : '';
        const currentValue = answersByBlankId[blank.id] || '';
        const dynamicWidth = getInputWidth(currentValue, `#${blank.blankOrder || ''}`);

        return (
            <span key={`blank-${blank.id}`} className={`${styles['blank-wrap']} ${resultClass}`}>
                <Input
                    ref={(node) => { inputRefs.current[blank.id] = node; }}
                    className={styles['blank-input']}
                    size="small"
                    style={{ width: dynamicWidth }}
                    value={currentValue}
                    disabled={submitting}
                    onFocus={() => setActiveBlankId(blank.id)}
                    onChange={(event) => handleAnswerChange(blank.id, event.target.value)}
                    onPressEnter={() => focusNextBlank(blank.id)}
                    placeholder={`#${blank.blankOrder || ''}`}
                    status={result && !result.isCorrect ? 'error' : undefined}
                />
                {result && (
                    <Tooltip title={result.isCorrect ? t('learning.fillBlank.correct', 'Correct') : result.correctAnswer || t('learning.fillBlank.incorrect', 'Incorrect')}>
                        {result.isCorrect ? <CheckCircleOutlined className={styles['result-icon-success']} /> : <CloseCircleOutlined className={styles['result-icon-error']} />}
                    </Tooltip>
                )}
                {result && !result.isCorrect && result.correctAnswer && (
                    <span className={styles['correct-answer']}>{result.correctAnswer}</span>
                )}
            </span>
        );
    };

    const renderSegmentText = (segment, isLastSegment) => {
        const text = segment.englishText || '';
        const blanksWithRange = sortBlanks(segment.blanks || []).map((blank) => ({
            blank,
            range: findUsableRange(text, blank),
        }));
        const validBlanks = blanksWithRange.filter((item) => item.range);
        const invalidBlanks = blanksWithRange.filter((item) => !item.range).map((item) => item.blank);
        const parts = [];
        let cursor = 0;

        validBlanks.forEach(({ blank, range }) => {
            const { start, end } = range;
            if (start < cursor) return;
            if (start > cursor) parts.push(<span key={`text-${segment.id}-${cursor}`}>{text.slice(cursor, start)}</span>);
            parts.push(renderBlankInput(blank));
            cursor = end;
        });

        if (cursor < text.length) {
            parts.push(<span key={`text-${segment.id}-tail`}>{text.slice(cursor)}</span>);
        }

        return (
            <span className={styles['segment-inline']}>
                <span className={styles['segment-line']}>{parts.length > 0 ? parts : text}{isLastSegment ? '' : ' '}</span>
                {invalidBlanks.length > 0 && (
                    <span className={styles['invalid-blanks']}>
                        {invalidBlanks.map((blank) => (
                            <span key={blank.id} className={styles['invalid-blank-item']}>
                                {renderBlankInput(blank)}
                                <span>{t('learning.fillBlank.invalidPosition', 'Blank has no valid position.')}</span>
                            </span>
                        ))}
                    </span>
                )}
            </span>
        );
    };

    if (loading) {
        return (
            <div className={styles['panel-center']}>
                <Spin />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles['panel-state']}>
                <Alert type="error" showIcon message={error} />
                <Button icon={<ReloadOutlined />} onClick={fetchExercise}>
                    {t('learning.retry', 'Retry')}
                </Button>
            </div>
        );
    }

    if (!exercise || totalBlanks === 0) {
        return (
            <div className={styles['panel-center']}>
                <img src={novaReading} alt="Nova đang đọc sách" className={styles['empty-mascot']} />
                <p className={styles['empty-text']}>{t('learning.fillBlank.empty', 'This video does not have a Listening exercise yet.')}</p>
            </div>
        );
    }

    const getResultMascot = () => {
        if (!submitResult) return null;
        const score = Math.round(submitResult.score || 0);
        if (score >= 80) return { src: novaExcited, alt: 'Nova phấn khích' };
        if (score >= 50) return { src: novaHappy, alt: 'Nova vui vẻ' };
        return { src: novaThinking, alt: 'Nova đang suy nghĩ' };
    };

    const resultMascot = getResultMascot();

    return (
        <div className={styles['fillblank-panel']}>
            <div className={styles['panel-header']}>
                <div className={styles['header-left']}>
                    {submitResult && (
                        <div className={styles['header-result']}>
                            {resultMascot && <img src={resultMascot.src} alt={resultMascot.alt} className={styles['header-mascot']} />}
                            <div className={styles['header-score-info']}>
                                <span className={styles['header-score']}>{Math.round(submitResult.score || 0)}%</span>
                                <span className={styles['header-detail']}>{submitResult.totalCorrect}/{submitResult.totalBlanks} {t('learning.fillBlank.score', 'correct')}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles['header-actions']}>
                    {assistMode === 'translation' && (
                        <Tooltip title={scrollSyncEnabled ? t('learning.fillBlank.disableSyncScroll', 'Tắt cuộn đồng bộ') : t('learning.fillBlank.enableSyncScroll', 'Bật cuộn đồng bộ')}>
                            <Button
                                className={`${styles['action-btn']} ${scrollSyncEnabled ? styles['active'] : ''}`}
                                type="text"
                                icon={<LinkOutlined />}
                                onClick={() => setScrollSyncEnabled(!scrollSyncEnabled)}
                            />
                        </Tooltip>
                    )}

                    {assistMode && onAssistModeChange && (
                        <div className={styles['assist-toggle']}>
                            <Button
                                size="small"
                                type={assistMode === 'video' ? 'primary' : 'text'}
                                icon={<VideoCameraOutlined />}
                                onClick={() => onAssistModeChange('video')}
                            >
                                Video
                            </Button>
                            <Button
                                size="small"
                                type={assistMode === 'translation' ? 'primary' : 'text'}
                                icon={<TranslationOutlined />}
                                onClick={() => onAssistModeChange('translation')}
                            >
                                {t('learning.fillBlank.translation', 'Translation')}
                            </Button>
                        </div>
                    )}
                    <Tooltip title={showActiveHighlight ? t('learning.fillBlank.hideHighlight', 'Hide highlight') : t('learning.fillBlank.showHighlight', 'Show highlight')}>
                        <Button
                            className={`${styles['action-btn']} ${showActiveHighlight ? styles['active'] : ''}`}
                            type="text"
                            icon={showActiveHighlight ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            onClick={() => setShowActiveHighlight((value) => !value)}
                        >
                            <span className={styles['btn-text']}>
                                {showActiveHighlight ? t('learning.fillBlank.hideHighlight', 'Hide highlight') : t('learning.fillBlank.showHighlight', 'Show highlight')}
                            </span>
                        </Button>
                    </Tooltip>

                    <Button className={styles['retry-btn']} icon={<ClearOutlined />} onClick={handleReset} disabled={submitting}>
                        {t('learning.fillBlank.retry', 'Retry')}
                    </Button>
                    <Button className={styles['submit-btn']} type="primary" icon={<SendOutlined />} loading={submitting} disabled={submitting} onClick={handleSubmit}>
                        {t('learning.submitAll', 'Submit')}
                    </Button>
                </div>
            </div>



            <div id="listening-english-scroll" className={styles['transcript-scroll']}>
                <div className={styles['transcript-paragraph']}>
                    {segmentParagraphs.map((paragraph, paragraphIndex) => (
                        <p key={`paragraph-${paragraphIndex}`} className={styles['transcript-line']}>
                            {paragraph.map((segment, index) => {
                                const isActive = showActiveHighlight && segment.id === activeSegmentId;
                                return (
                                    <span key={segment.id} className={`${styles.segment} ${isActive ? styles.active : ''}`}>
                                        {renderSegmentText(segment, index === paragraph.length - 1)}
                                    </span>
                                );
                            })}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FillBlankPanel;
