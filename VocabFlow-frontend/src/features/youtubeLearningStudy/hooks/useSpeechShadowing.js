import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { computeScore, compareWords } from '../utils/scoring';
import { useStudyAttempt } from '../context/AttemptSyncContext';

// ─── Browser support check ────────────────────────────────────
const SpeechRecognitionAPI =
    typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

const MAX_DURATION_SENTENCE = 60; // 1 minute in seconds

/**
 * useSpeechShadowing
 * Encapsulates MediaRecorder + SpeechRecognition logic for shadowing exercises.
 *
 * **Bug fix**: Introduces `finalizedText` reactive state that mirrors
 * `accumulatedTranscriptRef.current`, ensuring the UI always displays the
 * full finalized transcript (not just the volatile interim fragment).
 *
 * @param {Object} params
 * @param {string|number} params.segmentId   - ID of the current segment
 * @param {Object}        params.currentSegment - The current segment object
 * @param {Object}        params.videoRef    - React ref to the YouTube player
 * @param {number}        params.currentIndex - Current sentence index
 * @param {Array}         params.segments    - All segments (for history restore)
 */
const useSpeechShadowing = ({ segmentId, currentSegment, videoRef, currentIndex, segments }) => {
    const { t } = useTranslation();
    const { shadAttempts, upsertShadowing, upsertShadowingImmediate, flushAllPendingTimers } = useStudyAttempt();
    // ── Per-segment records: { [segId]: { audioUrl, recognizedText, score, comparison, fromHistory } }
    const [shadowingRecords, setShadowingRecords] = useState({});
    const [completedSet, setCompletedSet] = useState(new Set());

    // ── Recording state ──
    const [isRecording, setIsRecording] = useState(false);
    const [finalizedText, setFinalizedText] = useState('');
    const [interimText, setInterimText] = useState('');
    const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
    const [timeLeft, setTimeLeft] = useState(MAX_DURATION_SENTENCE);

    useEffect(() => {
        return () => {
            flushAllPendingTimers?.();
        };
    }, [flushAllPendingTimers]);

    // ── Refs ──
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recognitionRef = useRef(null);
    const userAudioRef = useRef(null);
    const streamRef = useRef(null);
    const historyLoadedRef = useRef(false);
    const accumulatedTranscriptRef = useRef('');

    // ── Derived ──
    const currentRecord = segmentId ? (
        shadowingRecords[segmentId]
        || (shadAttempts[segmentId]?.shadowingUserText ? {
            recognizedText: shadAttempts[segmentId].shadowingUserText,
            score: shadAttempts[segmentId].shadowingScore ?? 0,
            comparison: compareWords(currentSegment?.englishText || '', shadAttempts[segmentId].shadowingUserText),
            fromHistory: true
        } : null)
    ) : null;

    const hasSessionAudio = currentRecord?.audioUrl && !currentRecord?.fromHistory;

    const answeredCount = segments.filter((seg) =>
        shadowingRecords[seg.id]?.recognizedText ||
        shadAttempts[seg.id]?.shadowingUserText ||
        seg.userAttempt?.shadowingRecognizedText ||
        seg.userAttempt?.shadowingUserText
    ).length;

    // ── isSpeechSupported ──
    const isSpeechSupported = !!SpeechRecognitionAPI;

    // ── Resume progress from userAttempt ──
    useEffect(() => {
        if (segments.length === 0 || historyLoadedRef.current) return;
        historyLoadedRef.current = true;

        const restoredRecords = {};
        const restoredCompleted = new Set();

        segments.forEach((seg, idx) => {
            const attempt = seg.userAttempt;
            const ctxAttempt = shadAttempts[seg.id];
            const historicalShadowingText =
                ctxAttempt?.shadowingUserText || attempt?.shadowingUserText || attempt?.shadowingRecognizedText || '';
            const hasShadowingText = !!historicalShadowingText?.trim();

            // Only restore/mark shadowing progress when user actually has shadowing text.
            // This avoids false positives from default score values or dictation-only attempts.
            if (hasShadowingText) {
                const score = ctxAttempt?.shadowingScore ?? attempt?.shadowingScore ?? 0;
                restoredRecords[seg.id] = {
                    recognizedText: historicalShadowingText || null,
                    score: score,
                    comparison: historicalShadowingText
                        ? compareWords(seg.englishText, historicalShadowingText)
                        : [],
                    fromHistory: true,
                };
                if (score >= 80) {
                    restoredCompleted.add(idx);
                }
            }
        });

        if (Object.keys(restoredRecords).length > 0) {
            setShadowingRecords(restoredRecords);
        }
        if (restoredCompleted.size > 0) {
            setCompletedSet(restoredCompleted);
        }
    }, [segments, shadAttempts]);
    // ── Clean up MediaStream & ObjectURLs on unmount ──
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
            Object.values(shadowingRecords).forEach((rec) => {
                if (rec.audioUrl) URL.revokeObjectURL(rec.audioUrl);
            });
        };
    }, []);

    // ── Stop user audio & active recording on segment change ──
    useEffect(() => {
        if (userAudioRef.current) {
            userAudioRef.current.pause();
            userAudioRef.current = null;
            setIsPlayingUserAudio(false);
        }
        // Reset transcript displays on segment change
        setFinalizedText('');
        setInterimText('');
        accumulatedTranscriptRef.current = '';
        setTimeLeft(MAX_DURATION_SENTENCE);
    }, [currentIndex]);

    // ── Start recording ──
    const startRecording = useCallback(async () => {
        if (!SpeechRecognitionAPI) return;
        if (!segmentId) return;

        // Reset transcript state for new recording session
        accumulatedTranscriptRef.current = '';
        setFinalizedText('');
        setInterimText('');

        // Pause video while recording
        if (videoRef?.current) {
            videoRef.current.pauseVideo();
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // ── MediaRecorder ──
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(blob);
                setShadowingRecords((prev) => ({
                    ...prev,
                    [segmentId]: {
                        ...(prev[segmentId] || {}),
                        audioUrl,
                    },
                }));
                // Stop microphone tracks
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            };
            mediaRecorderRef.current = recorder;
            recorder.start();

            // ── SpeechRecognition ──
            const recognition = new SpeechRecognitionAPI();
            recognition.lang = 'en-US';
            recognition.interimResults = true;
            recognition.continuous = true;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                let currentInterim = '';
                let newlyFinalized = '';

                // Only iterate through new results in this event
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        newlyFinalized += transcript + ' ';
                    } else {
                        currentInterim += transcript;
                    }
                }

                // Accumulate finalized text permanently into the ref
                if (newlyFinalized) {
                    accumulatedTranscriptRef.current += newlyFinalized;
                    // ★ BUG FIX: Mirror ref into reactive state so UI re-renders
                    setFinalizedText(accumulatedTranscriptRef.current);
                }

                // Always update interim for real-time feel
                setInterimText(currentInterim);

                // Build full text for scoring: finalized + current interim
                const fullTextForScoring = (accumulatedTranscriptRef.current + currentInterim).trim();

                if (fullTextForScoring) {
                    const score = computeScore(currentSegment.englishText, fullTextForScoring);
                    const comparison = compareWords(currentSegment.englishText, fullTextForScoring);

                    setShadowingRecords((prev) => ({
                        ...prev,
                        [segmentId]: {
                            ...(prev[segmentId] || {}),
                            recognizedText: fullTextForScoring,
                            score,
                            comparison,
                        },
                    }));

                    // Sink to AttemptSyncContext
                    // Check if completing this segment finishes all segments
                    const willBeComplete = !completedSet.has(currentIndex) && completedSet.size + 1 >= segments.length;

                    if (willBeComplete) {
                        // Bypass debounce — write immediately so flush() can read it
                        upsertShadowingImmediate(segmentId, {
                            shadowingUserText: fullTextForScoring,
                            shadowingScore: score,
                        });
                    } else {
                        upsertShadowing(segmentId, {
                            shadowingUserText: fullTextForScoring,
                            shadowingScore: score,
                        });
                    }

                    if (score >= 80) {
                        setCompletedSet((prev) => new Set([...prev, currentIndex]));
                    }
                }
            };

            recognition.onerror = (event) => {
                if (event.error !== 'no-speech') {
                    console.warn('SpeechRecognition error:', event.error);
                }
            };

            // Auto-restart recognition if it stops while still recording
            recognition.onend = () => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    try {
                        recognition.start();
                    } catch (_) {
                        /* ignore */
                    }
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
            setTimeLeft(MAX_DURATION_SENTENCE);
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone access error:', err);
            message.error(t('common.notifications.micAccessDenied'));
        }
    }, [segmentId, currentSegment, videoRef, currentIndex, segments.length, upsertShadowing, upsertShadowingImmediate, completedSet]);

    // ── Stop recording ──
    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (_) {
                /* ignore */
            }
            recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
        setIsRecording(false);
    }, []);

    // ── Toggle recording ──
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    // ── Play user's recorded audio ──
    const playUserAudio = useCallback(() => {
        if (!currentRecord?.audioUrl) return;

        // If already playing, stop it
        if (isPlayingUserAudio && userAudioRef.current) {
            userAudioRef.current.pause();
            userAudioRef.current = null;
            setIsPlayingUserAudio(false);
            return;
        }

        // Start new playback
        const audio = new Audio(currentRecord.audioUrl);
        userAudioRef.current = audio;
        setIsPlayingUserAudio(true);
        audio.onended = () => {
            setIsPlayingUserAudio(false);
            userAudioRef.current = null;
        };
        audio.play().catch((err) => {
            console.error('Audio playback failed:', err);
            setIsPlayingUserAudio(false);
            userAudioRef.current = null;
        });
    }, [currentRecord, isPlayingUserAudio]);

    // ── Countdown timer — auto-stop at 0 (1 minute) ──
    useEffect(() => {
        if (!isRecording) return;
        const id = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(id);
                    message.info(t('common.notifications.micLimitReached'));
                    stopRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [isRecording, stopRecording]);

    return {
        // State
        isRecording,
        finalizedText,
        interimText,
        isPlayingUserAudio,
        shadowingRecords,
        completedSet,
        currentRecord,
        hasSessionAudio,
        answeredCount,
        isSpeechSupported,
        timeLeft,

        // Actions
        startRecording,
        stopRecording,
        toggleRecording,
        playUserAudio,
    };
};

export default useSpeechShadowing;
