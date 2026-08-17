import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Skeleton, Typography, Result, Button, Tooltip, Grid, notification, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    FileTextOutlined,
    UnorderedListOutlined,
    VideoCameraOutlined,
    MessageOutlined,
    OrderedListOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    SettingOutlined,
    TranslationOutlined,
} from '@ant-design/icons';
import { useLayout } from '../../../context/LayoutContext';
import VideoPlayer from '../components/VideoPlayer';
import ModeTabs from '../components/ModeTabs';
import TranscriptList from '../components/TranscriptList';
import DictationPanel from '../components/DictationPanel';
import ShadowingPanel from '../components/ShadowingPanel';
import FillBlankPanel from '../components/FillBlankPanel';
import QuizPanel from '../components/QuizPanel';
import VerticalSentenceList from '../components/VerticalSentenceList';
import StudyTimer from '../components/StudyTimer';
import ProgressBar from '../components/ProgressBar';
import CompletionModal from '../components/CompletionModal';
import useResizer from '../hooks/useResizer';
import useAttemptSync from '../hooks/useAttemptSync';
import { AttemptSyncProvider } from '../context/AttemptSyncContext';
import { studyApi } from '../api/studyApi';
import { fillBlankService } from '../api/fillBlankService';
import styles from '../styles/LearningPage.module.scss';
import { isAuthenticated } from '../../../utils/auth';
import { isInteractiveStudyMode, normalizeStudyMode, STUDY_MODES } from '../constants/studyModes';

const MODE_LAYOUT_WIDTHS = {
    [STUDY_MODES.WATCH]: 68,
    [STUDY_MODES.FILL_BLANK]: 45,
    [STUDY_MODES.DICTATION]: 70,
    [STUDY_MODES.SHADOWING]: 70,
    [STUDY_MODES.QUIZ]: 60,
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

const ActiveTimer = ({ activeMode, historicalTime, onExtractTimeRef }) => {
    const sessionTime = useRef({ watch: 0, fill_blank: 0, dictation: 0, shadowing: 0, quiz: 0 });
    const pendingTime = useRef({ watch: 0, fill_blank: 0, dictation: 0, shadowing: 0, quiz: 0 });
    const [displayTime, setDisplayTime] = useState(0);

    // Provide the extraction function to parent
    useEffect(() => {
        onExtractTimeRef.current = () => {
            const data = { ...pendingTime.current };
            pendingTime.current = { watch: 0, fill_blank: 0, dictation: 0, shadowing: 0, quiz: 0 };
            return data;
        };
    }, [onExtractTimeRef]);

    useEffect(() => {
        const normalizedMode = normalizeStudyMode(activeMode);
        const timer = setInterval(() => {
            if (!document.hidden) {
                if (sessionTime.current[normalizedMode] !== undefined) {
                    sessionTime.current[normalizedMode] += 1;
                    pendingTime.current[normalizedMode] += 1;
                    setDisplayTime((historicalTime[normalizedMode] || 0) + sessionTime.current[normalizedMode]);
                }
            }
        }, 1000);

        // Initial set when mode changes
        if (sessionTime.current[normalizedMode] !== undefined) {
            setDisplayTime((historicalTime[normalizedMode] || 0) + sessionTime.current[normalizedMode]);
        } else {
            setDisplayTime(0);
        }

        return () => clearInterval(timer);
    }, [activeMode, historicalTime]);

    return <StudyTimer elapsed={displayTime} />;
};

const LearningPageInner = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const videoRef = useRef(null);

    // ── Mobile detection via antd breakpoints ──
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md; // true when < 768px

    const isAuth = isAuthenticated();

    useEffect(() => {
        if (!isAuth) {
            notification.info({
                message: t('learning.page.guestMode'),
                description: t('learning.page.guestDesc'),
                duration: 180, // 3 minutes
                placement: 'topRight',
                btn: (
                    <Button type="primary" size="small" onClick={() => navigate('/login')}>
                        {t('common.login')}
                    </Button>
                ),
                key: 'guest-warning',
            });
        }
    }, [isAuth, navigate, t]);

    // Data state
    const [studyData, setStudyData] = useState(null);
    const videoDetail = studyData?.videoDetail || {};
    const segments = useMemo(() => studyData?.segments || [], [studyData?.segments]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI state
    const initialMode = normalizeStudyMode(location.state?.mode);
    const startSegmentId = location.state?.startSegmentId;

    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeMode, setActiveMode] = useState(initialMode);
    const [videoVisible, setVideoVisible] = useState(true);
    const [transcriptVisible, setTranscriptVisible] = useState(true);
    const [panelVisible, setPanelVisible] = useState(true);
    const [subtitleOverlayVisible, setSubtitleOverlayVisible] = useState(true);
    const [quizAssistMode, setQuizAssistMode] = useState('video');
    const [quizTextSegments, setQuizTextSegments] = useState(null);
    const [fillBlankAssistMode, setFillBlankAssistMode] = useState('video');
    const [fillBlankTextSegments, setFillBlankTextSegments] = useState(null);
    const [showActiveHighlight, setShowActiveHighlight] = useState(true);
    const [scrollSyncEnabled, setScrollSyncEnabled] = useState(false);

    // ── Progress state (Realtime Aggregation) ──
    const [dictProgress, setDictProgress] = useState({ completed: 0, avgScore: 0, isCompleted: false });
    const [shadProgress, setShadProgress] = useState({ completed: 0, avgScore: 0, isCompleted: false });

    // ── Completion Modal state ──
    const [completionModal, setCompletionModal] = useState({ visible: false, type: 'dictation' });

    // ── Historical Study Time ──
    const [historicalTime, setHistoricalTime] = useState({ watch: 0, fill_blank: 0, dictation: 0, shadowing: 0, quiz: 0 });

    // ── Fullscreen state ──
    const { setSidebarCollapsed } = useLayout();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoContainerRef = useRef(null);
    const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

    // Refs to track transcript visibility state for fullscreen transitions
    const latestTranscriptVisibleRef = useRef(transcriptVisible);
    const preFullscreenTranscriptVisibleRef = useRef(true);

    // Keep latestTranscriptVisibleRef in sync
    useEffect(() => {
        latestTranscriptVisibleRef.current = transcriptVisible;
    }, [transcriptVisible]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    // Toggle video-only fullscreen (container with subtitles)
    const toggleVideoFullscreen = useCallback(() => {
        if (!document.fullscreenElement && videoContainerRef.current) {
            videoContainerRef.current.requestFullscreen().catch((err) => {
                console.error(`Error entering video fullscreen: ${err.message}`);
            });
        } else if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }, []);

    // Handle Esc key or browser exit fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            const fsEl = document.fullscreenElement;
            const isFull = !!fsEl;
            setIsFullscreen(isFull);
            setIsVideoFullscreen(fsEl === videoContainerRef.current);
            if (isFull) {
                // Entering fullscreen: store current transcript state and hide transcript/collapse sidebar
                preFullscreenTranscriptVisibleRef.current = latestTranscriptVisibleRef.current;
                setSidebarCollapsed(true);
                setTranscriptVisible(false);
            } else {
                // Exiting fullscreen: restore previous states
                setSidebarCollapsed(false);
                setTranscriptVisible(preFullscreenTranscriptVisibleRef.current);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [setSidebarCollapsed]);

    // Auto-hide transcript on mobile for interactive modes
    useEffect(() => {
        if (isMobile && isInteractiveStudyMode(activeMode)) {
            setTranscriptVisible(false);
        }
    }, [isMobile, activeMode]);

    // Bi-directional Scroll Sync between translation panel (left) and English panel (right)
    useEffect(() => {
        if (!scrollSyncEnabled || activeMode !== STUDY_MODES.FILL_BLANK || fillBlankAssistMode !== 'translation') return;

        let isSyncingLeftScroll = false;
        let isSyncingRightScroll = false;

        const leftEl = document.getElementById('listening-translation-scroll');
        const rightEl = document.getElementById('listening-english-scroll');

        if (!leftEl || !rightEl) return;

        const handleLeftScroll = () => {
            if (isSyncingLeftScroll) {
                isSyncingLeftScroll = false;
                return;
            }
            isSyncingRightScroll = true;
            const leftScrollableHeight = leftEl.scrollHeight - leftEl.clientHeight;
            if (leftScrollableHeight <= 0) return;
            const scrollPercentage = leftEl.scrollTop / leftScrollableHeight;
            
            const rightScrollableHeight = rightEl.scrollHeight - rightEl.clientHeight;
            rightEl.scrollTop = scrollPercentage * rightScrollableHeight;
        };

        const handleRightScroll = () => {
            if (isSyncingRightScroll) {
                isSyncingRightScroll = false;
                return;
            }
            isSyncingLeftScroll = true;
            const rightScrollableHeight = rightEl.scrollHeight - rightEl.clientHeight;
            if (rightScrollableHeight <= 0) return;
            const scrollPercentage = rightEl.scrollTop / rightScrollableHeight;
            
            const leftScrollableHeight = leftEl.scrollHeight - leftEl.clientHeight;
            leftEl.scrollTop = scrollPercentage * leftScrollableHeight;
        };

        leftEl.addEventListener('scroll', handleLeftScroll, { passive: true });
        rightEl.addEventListener('scroll', handleRightScroll, { passive: true });

        return () => {
            leftEl.removeEventListener('scroll', handleLeftScroll);
            rightEl.removeEventListener('scroll', handleRightScroll);
        };
    }, [scrollSyncEnabled, activeMode, fillBlankAssistMode, segments]);

    // Sentence nav state (dictation & shadowing)
    const [dictationIndex, setDictationIndex] = useState(0);
    const [dictationCompletedSet, setDictationCompletedSet] = useState(new Set());
    const [shadowingIndex, setShadowingIndex] = useState(0);
    const [shadowingCompletedSet, setShadowingCompletedSet] = useState(new Set());

    // Global Subtitle toggles (synced with TranscriptList)
    const [showSubtitleEn, setShowSubtitleEn] = useState(true);
    const [showSubtitleIpa, setShowSubtitleIpa] = useState(false);
    const [showSubtitleTrans, setShowSubtitleTrans] = useState(false);

    // ── Resizer: Left panel ↔ Right panel ──
    const leftResizer = useResizer({
        containerId: 'learning-layout-wrapper',
        defaultPercent: 65,
        minPercent: 25,
        maxPercent: 75,
    });
    const didApplyInitialLayoutRef = useRef(false);

    useEffect(() => {
        if (isMobile || didApplyInitialLayoutRef.current) return;
        const initialWidth = MODE_LAYOUT_WIDTHS[activeMode];
        if (initialWidth) {
            leftResizer.setPanelWidth(initialWidth, { animate: false });
            didApplyInitialLayoutRef.current = true;
        }
    }, [activeMode, isMobile, leftResizer]);

    // Fetch study detail from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [studyRes, progressRes] = await Promise.all([
                    studyApi.getStudyDetail(id),
                    isAuth ? studyApi.getVideoProgress(id).catch(err => {
                        console.warn('No historical progress found for this video', err);
                        return { data: null };
                    }) : Promise.resolve({ data: null })
                ]);
                setStudyData(studyRes.data);

                const p = progressRes?.data;
                setHistoricalTime({
                    watch: p?.watchTimeSeconds || p?.listeningTimeSeconds || 0,
                    fill_blank: p?.fillBlankTimeSeconds || 0,
                    dictation: p?.dictationTimeSeconds || 0,
                    shadowing: p?.shadowingTimeSeconds || 0,
                    quiz: p?.quizTimeSeconds || 0
                });

                // Handle deep linking to specific segment
                if (startSegmentId && studyRes.data?.segments) {
                    const segmentIndex = studyRes.data.segments.findIndex(s => s.id === startSegmentId);
                    if (segmentIndex >= 0) {
                        if (initialMode === STUDY_MODES.DICTATION) {
                            setDictationIndex(segmentIndex);
                        } else if (initialMode === STUDY_MODES.SHADOWING) {
                            setShadowingIndex(segmentIndex);
                        }
                    }
                }
            } catch (err) {
                setError(err?.message || t('learning.failedToLoad'));
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, t, isAuth, initialMode, startSegmentId]);

    // Time update callback from VideoPlayer
    const handleTimeUpdate = useCallback((time) => {
        setCurrentTime(time);
    }, []);

    // Seek video to a specific time (used by TranscriptList)
    const handleSeek = useCallback((timeInSeconds) => {
        if (videoRef.current) {
            videoRef.current.seekTo(timeInSeconds);
            videoRef.current.playVideo();
        }
    }, []);

    // Toggle play/pause (used by TranscriptList)
    const handleTogglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pauseVideo();
            } else {
                videoRef.current.playVideo();
            }
        }
    }, [isPlaying]);

    // Mode change handler — preserves video state
    const handleModeChange = useCallback((mode) => {
        const nextMode = normalizeStudyMode(mode);
        const nextWidth = MODE_LAYOUT_WIDTHS[nextMode];
        if (!isMobile && nextWidth) {
            const isSwitchingBetweenInteractive = isInteractiveStudyMode(activeMode) && isInteractiveStudyMode(nextMode);
            // Only skip setting panel width if switching between two interactive modes (DICTATION <-> SHADOWING)
            // since they share the exact same default layout width (70%).
            // For all other mode transitions, we must update the panel width to the appropriate default.
            if (!isSwitchingBetweenInteractive) {
                // If entering an interactive mode while the transcript is hidden, update the resizer width
                // instantly (animate: false) to prevent animation conflict with the 100% full-width state.
                const shouldAnimate = !isInteractiveStudyMode(nextMode) || transcriptVisible;
                leftResizer.setPanelWidth(nextWidth, { animate: shouldAnimate });
            }
        }
        if (nextMode === STUDY_MODES.WATCH) {
            setPanelVisible(true);
            setVideoVisible(true);
            setTranscriptVisible(true);
        }
        if (nextMode === STUDY_MODES.FILL_BLANK) {
            setPanelVisible(true);
            setTranscriptVisible(true);
            setFillBlankAssistMode('video');
            if (videoRef.current) {
                videoRef.current.seekTo(0);
                videoRef.current.playVideo();
                setCurrentTime(0);
            }
        }
        if (nextMode === STUDY_MODES.DICTATION || nextMode === STUDY_MODES.SHADOWING) {
            if (!isInteractiveStudyMode(activeMode)) {
                setTranscriptVisible(true);
            }
            setPanelVisible(true);
        }
        if (nextMode === STUDY_MODES.QUIZ) {
            setPanelVisible(true);
            setVideoVisible(true);
            setTranscriptVisible(true);
            setQuizAssistMode('video');
            if (videoRef.current) {
                videoRef.current.seekTo(0);
                videoRef.current.stopVideo?.();
                setCurrentTime(0);
                setIsPlaying(false);
                requestAnimationFrame(() => videoRef.current?.refreshSize?.());
            }
        }
        setActiveMode(nextMode);
    }, [isMobile, leftResizer, activeMode, transcriptVisible]);

    useEffect(() => {
        if (videoVisible && videoRef.current) {
            requestAnimationFrame(() => videoRef.current?.refreshSize?.());
        }
    }, [videoVisible, activeMode, quizAssistMode, fillBlankAssistMode]);

    // Back to wherever the user came from (or video list as default)
    const handleBack = () => {
        const from = location.state?.from || '/videos';
        navigate(from);
    };

    // Dictation index change handler (shared with VerticalSentenceList)
    const handleDictationIndexChange = useCallback((index) => {
        setDictationIndex(index);
    }, []);

    // Shadowing index change handler (shared with VerticalSentenceList)
    const handleShadowingIndexChange = useCallback((index) => {
        setShadowingIndex(index);
    }, []);

    const youtubeVideoId = videoDetail?.youtubeVideoId || '';
    const videoTitle = videoDetail?.title || 'Video Lesson';
    const channelName = videoDetail?.channelName || '';
    const videoId = videoDetail?.id;
    const latestFillBlankResult = studyData?.latestFillBlankResult || null;
    const latestQuizResult = studyData?.latestQuizResult || null;
    const quizTextSourceSegments = quizTextSegments?.length ? quizTextSegments : segments;
    const quizTextParagraphs = useMemo(() => groupSegmentsByLineBreak(quizTextSourceSegments), [quizTextSourceSegments]);
    const fillBlankTextSourceSegments = fillBlankTextSegments?.length ? fillBlankTextSegments : segments;
    const fillBlankTextParagraphs = useMemo(() => groupSegmentsByLineBreak(fillBlankTextSourceSegments), [fillBlankTextSourceSegments]);

    useEffect(() => {
        if (!videoId || activeMode !== STUDY_MODES.QUIZ || quizAssistMode !== 'text') return;
        let cancelled = false;

        const fetchQuizTextSegments = async () => {
            try {
                const response = await fillBlankService.getByVideo(videoId);
                if (!cancelled && Array.isArray(response?.data?.segments)) {
                    setQuizTextSegments(response.data.segments);
                }
            } catch {
                if (!cancelled) {
                    setQuizTextSegments(null);
                }
            }
        };

        fetchQuizTextSegments();
        return () => {
            cancelled = true;
        };
    }, [activeMode, quizAssistMode, videoId]);

    // Fetch fill-blank text segments for translation view
    useEffect(() => {
        if (!videoId || activeMode !== STUDY_MODES.FILL_BLANK || fillBlankAssistMode !== 'translation') return;
        let cancelled = false;

        const fetchFillBlankTextSegments = async () => {
            try {
                const response = await fillBlankService.getByVideo(videoId);
                if (!cancelled && Array.isArray(response?.data?.segments)) {
                    setFillBlankTextSegments(response.data.segments);
                }
            } catch {
                if (!cancelled) {
                    setFillBlankTextSegments(null);
                }
            }
        };

        fetchFillBlankTextSegments();
        return () => {
            cancelled = true;
        };
    }, [activeMode, fillBlankAssistMode, videoId]);

    // Callback when fill-blank submit result comes back
    const handleFillBlankSubmitResult = useCallback(() => {
        setFillBlankAssistMode('translation');
    }, []);

    // Compute active segment for global subtitles below video
    const currentSubtitleSegment = useMemo(() => {
        for (let i = segments.length - 1; i >= 0; i--) {
            if (currentTime >= segments[i].startTime) {
                return segments[i];
            }
        }
        return null;
    }, [segments, currentTime]);

    // Whether the active mode is interactive (video on top + panel below)
    const isInteractiveMode = isInteractiveStudyMode(activeMode);
    const isWatchMode = activeMode === STUDY_MODES.WATCH;
    const isFillBlankMode = activeMode === STUDY_MODES.FILL_BLANK;
    const isQuizMode = activeMode === STUDY_MODES.QUIZ;

    // Calculate initial seek time for deep linking
    const initialSeekTime = useMemo(() => {
        if (startSegmentId && segments.length > 0) {
            const seg = segments.find(s => s.id === startSegmentId);
            return seg ? seg.startTime : 0;
        }
        return 0;
    }, [startSegmentId, segments]);

    // ── Resync video when internal state changes (active even if hidden) ──
    useEffect(() => {
        if (videoRef.current) {
            let targetSegment = null;
            if (activeMode === STUDY_MODES.DICTATION) {
                targetSegment = segments[dictationIndex];
            } else if (activeMode === STUDY_MODES.SHADOWING) {
                targetSegment = segments[shadowingIndex];
            }

            if (targetSegment) {
                videoRef.current.seekTo(targetSegment.startTime);
            }
        }
    }, [activeMode, dictationIndex, shadowingIndex, segments]);

    // ── Background sync for dictation + shadowing attempts ──
    const handleProgressUpdate = useCallback((data) => {
        if (data.type === 'dictation') {
            setDictProgress({
                completed: data.completedSegments,
                avgScore: data.avgScore,
                isCompleted: data.isDictationCompleted,
            });
        } else if (data.type === 'shadowing') {
            setShadProgress({
                completed: data.completedSegments,
                avgScore: data.avgScore,
                isCompleted: data.isShadowingCompleted,
            });
        }
    }, []);

    const handleDictationCompleted = useCallback(() => {
        setCompletionModal({ visible: true, type: 'dictation' });
    }, []);

    const handleShadowingCompleted = useCallback(() => {
        setCompletionModal({ visible: true, type: 'shadowing' });
    }, []);

    // ── Study Time Tracking (extracted via ActiveTimer) ──
    const extractTimeCallbackRef = useRef(() => ({ dictation: 0, shadowing: 0 }));

    const extractStudyTime = useCallback(() => {
        return extractTimeCallbackRef.current();
    }, []);

    const { flushImmediate } = useAttemptSync({
        videoId,
        onDictationCompleted: handleDictationCompleted,
        onShadowingCompleted: handleShadowingCompleted,
        onProgressUpdate: handleProgressUpdate,
        extractStudyTime,
    });

    // ── Immediate Flush on Completion ──
    useEffect(() => {
        if (segments.length > 0) {
            if (activeMode === STUDY_MODES.DICTATION && dictationCompletedSet.size === segments.length) {
                flushImmediate();
            } else if (activeMode === STUDY_MODES.SHADOWING && shadowingCompletedSet.size === segments.length) {
                flushImmediate();
            }
        }
    }, [dictationCompletedSet.size, shadowingCompletedSet.size, segments.length, activeMode, flushImmediate]);

    // ── Completion Modal handlers ──
    const handleCompletionClose = useCallback(() => {
        setCompletionModal({ visible: false, type: completionModal.type });
    }, [completionModal.type]);

    const handleCompletionContinue = useCallback(() => {
        setCompletionModal({ visible: false, type: completionModal.type });
        if (completionModal.type === 'dictation') {
            setActiveMode(STUDY_MODES.SHADOWING);
        } else {
            navigate('/videos');
        }
    }, [completionModal.type, navigate]);

    // Lock page scroll while learning view is active
    useEffect(() => {
        window.scrollTo(0, 0);
        const prevBodyOverflow = document.body.style.overflow;
        const prevHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevBodyOverflow;
            document.documentElement.style.overflow = prevHtmlOverflow;
        };
    }, []);

    // ── Derive progress values ──
    const activeDictCompleted = Math.max(dictProgress.completed, dictationCompletedSet.size);
    const activeShadCompleted = Math.max(shadProgress.completed, shadowingCompletedSet.size);

    // Loading state
    if (loading) {
        return (
            <div className={styles['learning-container']}>
                <div className={styles['learning-layout']}>
                    <div className={styles['left-panel']}>
                        <Skeleton.Image
                            active
                            style={{ width: '100%', height: 0, paddingTop: '56.25%', borderRadius: 12 }}
                        />
                        <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 16 }} />
                    </div>
                    <div className={styles['right-panel']}>
                        <Skeleton active paragraph={{ rows: 10 }} style={{ padding: 16 }} />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={styles['learning-container']}>
                <div className={styles['error-container']}>
                    <Result
                        status="error"
                        title={t('learning.failedToLoad')}
                        subTitle={error}
                        extra={
                            <Button type="primary" onClick={() => window.location.reload()}>
                                {t('learning.retry')}
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles['learning-container']}>
            {/* INVISIBLE OVERLAY TO CATCH MOUSE EVENTS DURING DRAG */}
            {leftResizer.isDraggingState && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, cursor: 'col-resize' }} />
            )}

            {/* ── Top Bar ── */}
            <div className={styles['top-bar']}>
                <div className={styles['back-btn']} onClick={handleBack}>
                    <ArrowLeftOutlined />
                    {!isMobile && <span>{t('learning.page.back')}</span>}
                </div>

                <div className={styles['timer-area']}>
                    <ActiveTimer
                        activeMode={activeMode}
                        historicalTime={historicalTime}
                        onExtractTimeRef={extractTimeCallbackRef}
                    />

                    {!isMobile && (
                        <Tooltip title={isFullscreen ? t('learning.page.exitFullscreen', 'Thoát toàn màn hình') : t('learning.page.enterFullscreen', 'Toàn màn hình (F11)')}>
                            <Button
                                type="text"
                                className={styles['fullscreen-btn']}
                                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                onClick={toggleFullscreen}
                            />
                        </Tooltip>
                    )}
                </div>

                <div className={styles['top-center']}>
                    <ModeTabs activeMode={activeMode} onModeChange={handleModeChange} isMobile={isMobile} />
                </div>

                <div className={styles['top-actions']}>
                    {!isMobile && (
                        <>
                            {isWatchMode && (
                                <>
                                    <Tooltip title={t('learning.page.subtitleTooltip')}>
                                        <Button
                                            type="text"
                                            className={`${styles['action-btn']} ${subtitleOverlayVisible ? styles['active'] : ''}`}
                                            icon={<MessageOutlined />}
                                            onClick={() => setSubtitleOverlayVisible(!subtitleOverlayVisible)}
                                        >
                                            {subtitleOverlayVisible ? t('learning.page.hideSub') : t('learning.page.showSub')}
                                        </Button>
                                    </Tooltip>

                                    <Tooltip title={t('learning.page.listTooltip')}>
                                        <Button
                                            type="text"
                                            className={`${styles['action-btn']} ${panelVisible ? styles['active'] : ''}`}
                                            icon={<OrderedListOutlined />}
                                            onClick={() => setPanelVisible(!panelVisible)}
                                        >
                                            {panelVisible ? t('learning.page.hidePanel') : t('learning.page.showPanel')}
                                        </Button>
                                    </Tooltip>
                                </>
                            )}

                            {isInteractiveMode && (
                                <Tooltip title={t('learning.page.transcriptTooltip')}>
                                    <Button
                                        type="text"
                                        className={`${styles['action-btn']} ${transcriptVisible ? styles['active'] : ''}`}
                                        icon={transcriptVisible ? <UnorderedListOutlined /> : <FileTextOutlined />}
                                        onClick={() => setTranscriptVisible(!transcriptVisible)}
                                    >
                                        {transcriptVisible ? t('learning.page.hideTranscript') : t('learning.page.showTranscript')}
                                    </Button>
                                </Tooltip>
                            )}

                            {(isInteractiveMode || isFillBlankMode || isQuizMode) && (
                                <Tooltip title={t('learning.page.videoTooltip')}>
                                    <Button
                                        type="text"
                                        className={`${styles['action-btn']} ${!videoVisible ? styles['active'] : ''}`}
                                        icon={videoVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                        onClick={() => setVideoVisible(!videoVisible)}
                                    >
                                        {videoVisible ? t('learning.page.hideVideo') : t('learning.page.showVideo')}
                                    </Button>
                                </Tooltip>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isInteractiveMode && (
                <ProgressBar
                    completed={activeMode === STUDY_MODES.DICTATION ? activeDictCompleted : activeShadCompleted}
                    total={segments.length}
                    mode={activeMode === STUDY_MODES.DICTATION ? 'dictation' : 'shadowing'}
                />
            )}

            <div id="learning-layout-wrapper" className={styles['learning-layout']}>
                <div
                    className={`${styles['left-panel']} ${!videoVisible && isInteractiveMode ? styles['video-hidden-content'] : ''}`}
                    style={
                        isMobile
                            ? undefined
                            : ((transcriptVisible && isInteractiveMode) || (isWatchMode && panelVisible) || isFillBlankMode || isQuizMode)
                                ? { flex: `0 0 ${leftResizer.currentWidthRef.current}%`, maxWidth: `${leftResizer.currentWidthRef.current}%` }
                                : { flex: 1, maxWidth: '100%' }
                    }
                    ref={leftResizer.panelRef}
                >
                    <div className={`${styles['video-wrapper']} ${(!videoVisible || (isQuizMode && quizAssistMode === 'text') || (isFillBlankMode && fillBlankAssistMode === 'translation')) ? styles.hidden : ''} ${isInteractiveMode ? styles['interactive-video'] : ''}`}>
                        <div ref={videoContainerRef} className={`${styles['video-container']} ${isVideoFullscreen ? styles['video-fs'] : ''}`}>
                            <VideoPlayer
                                ref={videoRef}
                                youtubeVideoId={youtubeVideoId}
                                initialStartTime={initialSeekTime}
                                autoPlay={false}
                                onTimeUpdate={handleTimeUpdate}
                                onPlayingChange={setIsPlaying}
                            />
                            {isWatchMode && subtitleOverlayVisible && currentSubtitleSegment && (
                                <div className={styles['subtitle-overlay']}>
                                    {showSubtitleEn && <div className={styles['subtitle-en']}>{currentSubtitleSegment.englishText}</div>}
                                    {showSubtitleIpa && currentSubtitleSegment.ipa && <div className={styles['subtitle-ipa']}>{currentSubtitleSegment.ipa}</div>}
                                    {showSubtitleTrans && (currentSubtitleSegment.vietnameseTranslation || currentSubtitleSegment.vietnameseText) && (
                                        <div className={styles['subtitle-trans']}>{currentSubtitleSegment.vietnameseTranslation || currentSubtitleSegment.vietnameseText}</div>
                                    )}
                                </div>
                            )}
                            <button
                                className={styles['video-fs-btn']}
                                onClick={toggleVideoFullscreen}
                                title={isVideoFullscreen ? t('learning.page.exitFullscreen', 'Thoát toàn màn hình') : t('learning.page.enterFullscreen', 'Toàn màn hình')}
                            >
                                {isVideoFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            </button>
                        </div>
                    </div>
                    {!videoVisible && (isWatchMode || (isFillBlankMode && fillBlankAssistMode === 'video') || (isQuizMode && quizAssistMode === 'video')) && (
                        <div className={styles['video-hidden-placeholder']}>
                            <EyeInvisibleOutlined className={styles['placeholder-icon']} />
                            <div className={styles['placeholder-text']}>{t('learning.page.videoIsHidden', 'Video đang bị ẩn')}</div>
                        </div>
                    )}
                    {!isInteractiveMode && (
                        <div className={styles['video-info']}>
                            <h2 className={styles['video-title']}>{videoTitle}</h2>
                            {channelName && <div className={styles['channel-name']}>{channelName}</div>}
                            {/* Assist toggles moved to respective panels */}
                        </div>
                    )}

                    {isMobile && isWatchMode && panelVisible && (
                        <div className={styles['left-panel-content']}>
                            <TranscriptList
                                segments={segments}
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                onSeek={handleSeek}
                                onTogglePlay={handleTogglePlay}
                                showEn={showSubtitleEn}
                                onShowEnChange={setShowSubtitleEn}
                                showIpa={showSubtitleIpa}
                                onShowIpaChange={setShowSubtitleIpa}
                                showTranslation={showSubtitleTrans}
                                onShowTranslationChange={setShowSubtitleTrans}
                            />
                        </div>
                    )}

                    {isInteractiveMode && panelVisible && (
                        <div className={styles['left-panel-content']}>
                            {isMobile && transcriptVisible ? (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '20px' }}>
                                    <VerticalSentenceList
                                        segments={segments}
                                        currentIndex={activeMode === STUDY_MODES.DICTATION ? dictationIndex : shadowingIndex}
                                        onIndexChange={activeMode === STUDY_MODES.DICTATION ? handleDictationIndexChange : handleShadowingIndexChange}
                                        completedSet={activeMode === STUDY_MODES.DICTATION ? dictationCompletedSet : shadowingCompletedSet}
                                        mode={activeMode === STUDY_MODES.DICTATION ? 'dictation' : 'shadowing'}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: activeMode === STUDY_MODES.DICTATION ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                        <DictationPanel
                                            isActive={activeMode === STUDY_MODES.DICTATION}
                                            segments={segments}
                                            videoRef={videoRef}
                                            currentTime={currentTime}
                                            isPlaying={isPlaying}
                                            onTogglePlay={handleTogglePlay}
                                            currentIndex={dictationIndex}
                                            onIndexChange={handleDictationIndexChange}
                                            completedSet={dictationCompletedSet}
                                            onCompletedChange={setDictationCompletedSet}
                                        />
                                    </div>
                                    <div style={{ display: activeMode === STUDY_MODES.SHADOWING ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                        <ShadowingPanel
                                            isActive={activeMode === STUDY_MODES.SHADOWING}
                                            segments={segments}
                                            videoRef={videoRef}
                                            currentTime={currentTime}
                                            currentIndex={shadowingIndex}
                                            onIndexChange={handleShadowingIndexChange}
                                            completedSet={shadowingCompletedSet}
                                            onCompletedChange={setShadowingCompletedSet}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {isMobile && isFillBlankMode && (
                        <div className={styles['left-panel-content']}>
                            <FillBlankPanel
                                videoId={videoId}
                                currentTime={currentTime}
                                initialResult={latestFillBlankResult}
                                onSeek={handleSeek}
                                onSubmitResult={handleFillBlankSubmitResult}
                                assistMode={fillBlankAssistMode}
                                onAssistModeChange={setFillBlankAssistMode}
                                showActiveHighlight={showActiveHighlight}
                                onShowActiveHighlightChange={setShowActiveHighlight}
                                scrollSyncEnabled={scrollSyncEnabled}
                                onScrollSyncEnabledChange={setScrollSyncEnabled}
                            />
                        </div>
                    )}

                    {isQuizMode && quizAssistMode === 'text' && (
                        <div className={styles['left-panel-content']}>
                            <div className={styles['quiz-reading-panel']}>
                                <div className={styles['quiz-reading-paragraph']}>
                                    {quizTextParagraphs.map((paragraph, paragraphIndex) => (
                                        <p
                                            key={`quiz-paragraph-${paragraphIndex}`}
                                            className={styles['quiz-reading-line']}
                                        >
                                            {paragraph.map((segment, index) => (
                                                <span
                                                    key={segment.id}
                                                    className={styles['quiz-reading-segment']}
                                                >
                                                    {segment.englishText}{index === paragraph.length - 1 ? '' : ' '}
                                                </span>
                                            ))}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {isFillBlankMode && fillBlankAssistMode === 'translation' && (
                        <div className={styles['left-panel-content']}>
                            <div id="listening-translation-scroll" className={styles['fillblank-translation-panel']}>
                                <div className={styles['fillblank-translation-paragraph']}>
                                    {fillBlankTextParagraphs.map((paragraph, paragraphIndex) => (
                                        <p
                                            key={`fb-trans-paragraph-${paragraphIndex}`}
                                            className={styles['fillblank-translation-line']}
                                        >
                                            {paragraph.map((segment, index) => {
                                                const isActive = showActiveHighlight && segment.id === currentSubtitleSegment?.id;
                                                return (
                                                    <span
                                                        key={segment.id}
                                                        className={`${styles['fillblank-translation-segment']} ${isActive ? styles.active : ''}`}
                                                    >
                                                        {segment.vietnameseTranslation || segment.vietnameseText || segment.englishText}{index === paragraph.length - 1 ? '' : ' '}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {isMobile && isQuizMode && (
                        <div className={styles['left-panel-content']}>
                            <QuizPanel
                                videoId={videoId}
                                initialResult={latestQuizResult}
                                assistMode={quizAssistMode}
                                onAssistModeChange={setQuizAssistMode}
                            />
                        </div>
                    )}
                </div>

                {((transcriptVisible && isInteractiveMode) || (isWatchMode && panelVisible) || isFillBlankMode || isQuizMode) && !isMobile && (
                    <div className={styles['resizer']} onMouseDown={leftResizer.handleMouseDown}>
                        <div className={styles['resizer-handle']} />
                    </div>
                )}

                <div className={`${styles['right-panel']} ${(
                    (isWatchMode && !panelVisible) || (isInteractiveMode && !transcriptVisible)
                ) ? styles['right-panel-hidden'] : ''}`}>
                    <div className={styles['right-panel-main']}>
                        <div className={styles['panel-content']} style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
                            {isWatchMode && panelVisible && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <TranscriptList
                                        segments={segments}
                                        currentTime={currentTime}
                                        isPlaying={isPlaying}
                                        onSeek={handleSeek}
                                        onTogglePlay={handleTogglePlay}
                                        showEn={showSubtitleEn}
                                        onShowEnChange={setShowSubtitleEn}
                                        showIpa={showSubtitleIpa}
                                        onShowIpaChange={setShowSubtitleIpa}
                                        showTranslation={showSubtitleTrans}
                                        onShowTranslationChange={setShowSubtitleTrans}
                                    />
                                </div>
                            )}

                            {isInteractiveMode && transcriptVisible && (
                                <VerticalSentenceList
                                    segments={segments}
                                    currentIndex={activeMode === STUDY_MODES.DICTATION ? dictationIndex : shadowingIndex}
                                    onIndexChange={activeMode === STUDY_MODES.DICTATION ? handleDictationIndexChange : handleShadowingIndexChange}
                                    completedSet={activeMode === STUDY_MODES.DICTATION ? dictationCompletedSet : shadowingCompletedSet}
                                    mode={activeMode === STUDY_MODES.DICTATION ? 'dictation' : 'shadowing'}
                                />
                            )}

                            {isFillBlankMode && !isMobile && (
                                <FillBlankPanel
                                    videoId={videoId}
                                    currentTime={currentTime}
                                    initialResult={latestFillBlankResult}
                                    onSeek={handleSeek}
                                    onSubmitResult={handleFillBlankSubmitResult}
                                    assistMode={fillBlankAssistMode}
                                    onAssistModeChange={setFillBlankAssistMode}
                                    showActiveHighlight={showActiveHighlight}
                                    onShowActiveHighlightChange={setShowActiveHighlight}
                                    scrollSyncEnabled={scrollSyncEnabled}
                                    onScrollSyncEnabledChange={setScrollSyncEnabled}
                                />
                            )}

                            {isQuizMode && !isMobile && (
                                <QuizPanel
                                    videoId={videoId}
                                    initialResult={latestQuizResult}
                                    assistMode={quizAssistMode}
                                    onAssistModeChange={setQuizAssistMode}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isMobile && (
                <div className={styles['mobile-settings-fab']}>
                    <Dropdown
                        trigger={['click']}
                        placement="topRight"
                        menu={{
                            items: [
                                ...(isWatchMode ? [
                                    {
                                        key: 'subtitle',
                                        icon: <MessageOutlined />,
                                        label: subtitleOverlayVisible ? t('learning.page.hideSub') : t('learning.page.showSub'),
                                        onClick: () => setSubtitleOverlayVisible(!subtitleOverlayVisible)
                                    },
                                    {
                                        key: 'panel',
                                        icon: <OrderedListOutlined />,
                                        label: panelVisible ? t('learning.page.hidePanel') : t('learning.page.showPanel'),
                                        onClick: () => setPanelVisible(!panelVisible)
                                    }
                                ] : isInteractiveMode ? [
                                    {
                                        key: 'transcript',
                                        icon: transcriptVisible ? <UnorderedListOutlined /> : <FileTextOutlined />,
                                        label: transcriptVisible ? t('learning.page.hideTranscript') : t('learning.page.showTranscript'),
                                        onClick: () => setTranscriptVisible(!transcriptVisible)
                                    }
                                ] : []),
                                ...((isInteractiveMode || isFillBlankMode || isQuizMode) ? [{
                                    key: 'video',
                                    icon: videoVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                                    label: videoVisible ? t('learning.page.hideVideo') : t('learning.page.showVideo'),
                                    onClick: () => setVideoVisible(!videoVisible)
                                }] : [])
                            ]
                        }}
                    >
                        <Button
                            type="primary"
                            shape="circle"
                            size="large"
                            icon={<SettingOutlined />}
                            className={styles['fab-btn']}
                        />
                    </Dropdown>
                </div>
            )}

            <CompletionModal
                visible={completionModal.visible}
                type={completionModal.type}
                completedSegments={completionModal.type === 'dictation' ? activeDictCompleted : activeShadCompleted}
                totalSegments={segments.length}
                avgScore={completionModal.type === 'dictation' ? dictProgress.avgScore : shadProgress.avgScore}
                onClose={handleCompletionClose}
                onContinue={handleCompletionContinue}
            />
        </div>
    );
};

const LearningPage = () => (
    <AttemptSyncProvider>
        <LearningPageInner />
    </AttemptSyncProvider>
);

export default LearningPage;
