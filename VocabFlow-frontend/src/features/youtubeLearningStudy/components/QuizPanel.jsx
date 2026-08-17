import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Radio, Spin, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, SendOutlined, FileTextOutlined, VideoCameraOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { quizService } from '../api/quizService';
import novaExcited from '@/assets/images/nova_exited_no_bg.png';
import novaHappy from '@/assets/images/nova_happy_no_bg.png';
import novaThinking from '@/assets/images/nova_thinking_no_bg.png';
import novaReading from '@/assets/images/nova_reading_no_bg.png';
import styles from '../styles/QuizPanel.module.scss';

const getDurationSeconds = (startedAt) => Math.max(0, Math.round((Date.now() - startedAt) / 1000));
const getDraftKey = (videoId) => `fluentnova_quiz_draft_${videoId}`;

const loadDraftSelections = (videoId) => {
    if (!videoId || typeof window === 'undefined') return null;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(getDraftKey(videoId)) || 'null');
        if (!parsed || typeof parsed !== 'object') return null;
        const selectedByQuizId = parsed.selectedByQuizId || {};
        return Object.keys(selectedByQuizId).length > 0 ? selectedByQuizId : null;
    } catch {
        return null;
    }
};

const saveDraftSelections = (videoId, selectedByQuizId) => {
    if (!videoId || typeof window === 'undefined') return;
    if (!selectedByQuizId || Object.keys(selectedByQuizId).length === 0) {
        window.localStorage.removeItem(getDraftKey(videoId));
        return;
    }
    window.localStorage.setItem(getDraftKey(videoId), JSON.stringify({
        selectedByQuizId,
        updatedAt: Date.now(),
    }));
};

const clearDraftSelections = (videoId) => {
    if (!videoId || typeof window === 'undefined') return;
    window.localStorage.removeItem(getDraftKey(videoId));
};

const normalizeQuestions = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.questions)) return data.questions;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const getResultByQuizId = (submitResult) => {
    const map = new Map();
    (submitResult?.answers || []).forEach((answer) => {
        map.set(answer.quizId, answer);
    });
    return map;
};

const QuizPanel = ({ videoId, initialResult = null, onCompleted, assistMode, onAssistModeChange }) => {
    const { t } = useTranslation();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedByQuizId, setSelectedByQuizId] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const startedAtRef = useRef(Date.now());

    const sortedQuestions = useMemo(() => {
        return [...questions].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }, [questions]);

    const resultByQuizId = useMemo(() => getResultByQuizId(submitResult), [submitResult]);

    const fetchQuiz = useCallback(async () => {
        if (!videoId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await quizService.getByVideo(videoId);
            const draftSelections = loadDraftSelections(videoId);
            setQuestions(normalizeQuestions(response.data));
            if (draftSelections) {
                setSelectedByQuizId(draftSelections);
                setSubmitResult(null);
            } else {
                setSelectedByQuizId((initialResult?.answers || []).reduce((acc, answer) => ({
                    ...acc,
                    [answer.quizId]: answer.selectedOptionId,
                }), {}));
                setSubmitResult(initialResult || null);
            }
            startedAtRef.current = Date.now();
        } catch (err) {
            setError(err?.message || t('learning.quizPanel.loadError', 'Could not load quiz.'));
        } finally {
            setLoading(false);
        }
    }, [videoId, initialResult, t]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleSubmit = async () => {
        if (submitting) return;
        if (sortedQuestions.length === 0) return;
        const unanswered = sortedQuestions.filter((question) => !selectedByQuizId[question.id]);
        if (unanswered.length > 0) {
            message.warning(t('learning.quizPanel.unanswered', 'Please answer every question before submitting.'));
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                durationSeconds: getDurationSeconds(startedAtRef.current),
                answers: sortedQuestions.map((question) => ({
                    quizId: question.id,
                    selectedOptionId: selectedByQuizId[question.id],
                    userAnswerText: null,
                })),
            };
            const response = await quizService.submit(videoId, payload);
            setSubmitResult(response.data);
            clearDraftSelections(videoId);
            startedAtRef.current = Date.now();
            if (onCompleted) onCompleted(response.data);
        } catch (err) {
            message.error(err?.message || t('learning.quizPanel.submitError', 'Could not submit quiz.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        setSelectedByQuizId({});
        setSubmitResult(null);
        clearDraftSelections(videoId);
        startedAtRef.current = Date.now();
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
                <Button icon={<ReloadOutlined />} onClick={fetchQuiz}>
                    {t('learning.retry', 'Retry')}
                </Button>
            </div>
        );
    }

    if (sortedQuestions.length === 0) {
        return (
            <div className={styles['panel-center']}>
                <img src={novaReading} alt="Nova đang đọc sách" className={styles['empty-mascot']} />
                <p className={styles['empty-text']}>{t('learning.quizPanel.empty', 'This video does not have a quiz yet.')}</p>
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
        <div className={styles['quiz-panel']}>
            <div className={styles['panel-header']}>
                <div className={styles['header-left']}>
                    {submitResult ? (
                        <div className={styles['header-result']}>
                            {resultMascot && <img src={resultMascot.src} alt={resultMascot.alt} className={styles['header-mascot']} />}
                            <div className={styles['header-score-info']}>
                                <span className={styles['header-score']}>{Math.round(submitResult.score || 0)}%</span>
                                <span className={styles['header-detail']}>{submitResult.totalCorrect}/{submitResult.totalQuestions} {t('learning.quizPanel.score', 'correct')}</span>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.eyebrow}>{t('learning.quiz', 'Quiz')}</div>
                    )}
                </div>
                <div className={styles['header-actions']}>
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
                                type={assistMode === 'text' ? 'primary' : 'text'}
                                icon={<FileTextOutlined />}
                                onClick={() => onAssistModeChange('text')}
                            >
                                Text
                            </Button>
                        </div>
                    )}
                    <Button className={styles['retry-btn']} icon={<ClearOutlined />} onClick={handleRetry} disabled={submitting}>
                        {t('learning.quizPanel.retry', 'Retry')}
                    </Button>
                    <Button className={styles['submit-btn']} type="primary" icon={<SendOutlined />} loading={submitting} disabled={submitting} onClick={handleSubmit}>
                        {t('learning.submitAll', 'Submit')}
                    </Button>
                </div>
            </div>



            <div className={styles['questions-list']}>
                {sortedQuestions.map((question, index) => {
                    const result = resultByQuizId.get(question.id);
                    const selectedOptionId = selectedByQuizId[question.id];
                    const correctOptionId = result?.correctOptionId;

                    return (
                        <section key={question.id} className={styles.question}>
                            <div className={styles['question-top']}>
                                <span className={styles['question-number']}>{index + 1}</span>
                                <h4>{question.questionText}</h4>
                                {/* {question.difficultyLevel && <Tag>{question.difficultyLevel}</Tag>} */}
                            </div>

                            <Radio.Group
                                className={styles['options-list']}
                                value={selectedOptionId}
                                disabled={submitting || !!submitResult}
                                onChange={(event) => {
                                    setSelectedByQuizId((prev) => {
                                        const next = { ...prev, [question.id]: event.target.value };
                                        saveDraftSelections(videoId, next);
                                        if (submitResult) setSubmitResult(null);
                                        return next;
                                    });
                                }}
                            >
                                {[...(question.options || [])]
                                    .sort((a, b) => (a.optionOrder || 0) - (b.optionOrder || 0))
                                    .map((option) => {
                                        const isSelected = selectedOptionId === option.id;
                                        const isCorrect = correctOptionId === option.id;
                                        const isWrongSelection = result && isSelected && !result.isCorrect;
                                        const optionClass = [
                                            styles.option,
                                            isCorrect ? styles.correct : '',
                                            isWrongSelection ? styles.incorrect : '',
                                        ].filter(Boolean).join(' ');

                                        return (
                                            <Radio key={option.id} value={option.id} className={optionClass}>
                                                <span>{option.optionText}</span>
                                                {submitResult && isCorrect && <CheckCircleOutlined className={styles['success-icon']} />}
                                                {submitResult && isWrongSelection && <CloseCircleOutlined className={styles['error-icon']} />}
                                            </Radio>
                                        );
                                    })}
                            </Radio.Group>

                            {result?.explanation && (
                                <div className={styles.explanation}>Explanation: {result.explanation}</div>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizPanel;
