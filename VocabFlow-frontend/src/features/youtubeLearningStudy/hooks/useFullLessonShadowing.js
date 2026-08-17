import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { computeScore, compareWords } from '../utils/scoring';

// ─── Browser support ────────────────────────────────────────
const SpeechRecognitionAPI =
    typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

const REDUCED_VOLUME = 20;
const MAX_DURATION_FULL = 20 * 60; // 20 minutes in seconds

/**
 * useFullLessonShadowing
 * Manages recording + background SpeechRecognition for full-lesson shadowing.
 *
 * - Records audio via MediaRecorder
 * - Runs SpeechRecognition in background (no live UI display)
 * - Optionally plays video alongside at reduced volume
 * - On stop: computes overall score + word comparison
 *
 * @param {Object}  params
 * @param {Array}   params.segments  - All transcript segments
 * @param {Object}  params.videoRef  - React ref to YouTube player
 * @param {boolean} params.isActive  - Whether the panel is currently active
 */
const useFullLessonShadowing = ({ segments, videoRef, isActive = true }) => {
    const { t } = useTranslation();
    // ── State ──
    const [isRecording, setIsRecording] = useState(false);
    const [playVideoAlongside, setPlayVideoAlongside] = useState(true);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
    const [result, setResult] = useState(null); // { recognizedText, score, comparison }
    const [timeLeft, setTimeLeft] = useState(MAX_DURATION_FULL);

    // ── Refs ──
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recognitionRef = useRef(null);
    const streamRef = useRef(null);
    const userAudioRef = useRef(null);
    const accumulatedTranscriptRef = useRef('');
    const originalVolumeRef = useRef(100);

    // ── Derived ──
    const fullReferenceText = segments.map((s) => s.englishText).join(' ');
    const isSpeechSupported = !!SpeechRecognitionAPI;

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            // Stop any active stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
            // Stop recognition
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
            }
            // Stop recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try { mediaRecorderRef.current.stop(); } catch (_) { /* ignore */ }
            }
            if (userAudioRef.current) {
                userAudioRef.current.pause();
            }
        };
    }, []);

    // ── Start recording ──
    const startRecording = useCallback(async () => {
        if (!SpeechRecognitionAPI) return;

        // Reset transcript accumulator
        accumulatedTranscriptRef.current = '';
        setResult(null);

        // Revoke old audio URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }

        // 1. Capture and handle volume/video
        try {
            if (videoRef?.current) {
                // Save original volume precisely before changing
                const vol = typeof videoRef.current.getVolume === 'function'
                    ? videoRef.current.getVolume()
                    : 100;
                originalVolumeRef.current = vol;

                // Mute if playVideoAlongside is false, otherwise REDUCED_VOLUME
                const targetVolume = playVideoAlongside ? REDUCED_VOLUME : 0;
                if (typeof videoRef.current.setVolume === 'function') {
                    videoRef.current.setVolume(targetVolume);
                }

                // AI Sync: Always seek to first segment start
                const startTime = segments[0]?.startTime || 0;
                videoRef.current.seekTo(startTime);
                videoRef.current.playVideo();
            }
        } catch (videoErr) {
            console.warn('[FullLessonShadowing] Video control error:', videoErr);
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
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                // Release mic
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            };
            mediaRecorderRef.current = recorder;
            recorder.start();

            // ── SpeechRecognition (background — no UI updates) ──
            const recognition = new SpeechRecognitionAPI();
            recognition.lang = 'en-US';
            recognition.interimResults = false; // only finalized results
            recognition.continuous = true;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        accumulatedTranscriptRef.current += event.results[i][0].transcript + ' ';
                    }
                }
            };

            recognition.onerror = (event) => {
                if (event.error !== 'no-speech') {
                    console.warn('[FullLessonShadowing] SpeechRecognition error:', event.error);
                }
            };

            // Auto-restart if it stops while still recording
            recognition.onend = () => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    try { recognition.start(); } catch (_) { /* ignore */ }
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
            setIsRecording(true);
            setTimeLeft(MAX_DURATION_FULL);
        } catch (err) {
            console.error('[FullLessonShadowing] Microphone access error:', err);
            message.error(t('common.notifications.micAccessDenied'));
            // Restore volume if we changed it
            if (playVideoAlongside && videoRef?.current) {
                videoRef.current.setVolume(originalVolumeRef.current);
            }
        }
    }, [segments, videoRef, playVideoAlongside, audioUrl]);

    // ── Stop recording ──
    const stopRecording = useCallback(() => {
        // Stop SpeechRecognition
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
            recognitionRef.current = null;
        }
        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        // Restore video volume & pause
        try {
            if (videoRef?.current) {
                if (typeof videoRef.current.setVolume === 'function') {
                    videoRef.current.setVolume(originalVolumeRef.current);
                }
                videoRef.current.pauseVideo();
            }
        } catch (videoErr) {
            console.warn('[FullLessonShadowing] Video restore error:', videoErr);
        }

        // Compute results from accumulated transcript
        const recognizedText = accumulatedTranscriptRef.current.trim();
        if (recognizedText) {
            const score = computeScore(fullReferenceText, recognizedText);
            const comparison = compareWords(fullReferenceText, recognizedText);
            setResult({ recognizedText, score, comparison });
        }

        setIsRecording(false);
    }, [videoRef, fullReferenceText]);

    // ── Countdown timer — auto-stop at 0 ──
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

    // ── Stop recording if panel becomes inactive ──
    useEffect(() => {
        if (!isActive && isRecording) {
            stopRecording();
        }
    }, [isActive, isRecording, stopRecording]);

    // ── Toggle ──
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    // ── Play user's recorded audio ──
    const playUserAudio = useCallback(() => {
        if (!audioUrl) return;

        // If already playing, pause
        if (isPlayingUserAudio && userAudioRef.current) {
            userAudioRef.current.pause();
            userAudioRef.current = null;
            setIsPlayingUserAudio(false);
            return;
        }

        const audio = new Audio(audioUrl);
        userAudioRef.current = audio;
        setIsPlayingUserAudio(true);
        audio.onended = () => {
            setIsPlayingUserAudio(false);
            userAudioRef.current = null;
        };
        audio.play().catch(() => {
            setIsPlayingUserAudio(false);
            userAudioRef.current = null;
        });
    }, [audioUrl, isPlayingUserAudio]);

    // ── Clear results (reset to idle) ──
    const clearResult = useCallback(() => {
        setResult(null);
        if (userAudioRef.current) {
            userAudioRef.current.pause();
            userAudioRef.current = null;
            setIsPlayingUserAudio(false);
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
    }, [audioUrl]);

    return {
        // State
        isRecording,
        playVideoAlongside,
        setPlayVideoAlongside,
        audioUrl,
        isPlayingUserAudio,
        result,
        isSpeechSupported,
        timeLeft,

        // Actions
        toggleRecording,
        playUserAudio,
        clearResult,
    };
};

export default useFullLessonShadowing;
