import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notification, Spin, Result, Button, Tooltip } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import VideoPlayer from '../../youtubeLearningStudy/components/VideoPlayer';
import DictationPanel from '../../youtubeLearningStudy/components/DictationPanel';
import ProgressBar from '../../youtubeLearningStudy/components/ProgressBar';
import GameResultsModal from '../components/GameResultsModal';
import useGameDictation from '../hooks/useGameDictation';
import { gameApi } from '../api/gameApi';
import styles from '../styles/GameEngine.module.scss';

const VideoSection = React.memo(({ 
    activeYoutubeVideoId, 
    currentSegment, 
    currentIndex, 
    onTogglePlay, 
    videoRef, 
    isPlaying, 
    setIsPlaying, 
    videoVisible,
    segments,
    onIndexChange,
    completedSet,
    onCompletedChange,
    dictation
}) => {
    const [currentTime, setCurrentTime] = useState(0);

    return (
        <div className={styles['engine-layout']}>
            {/* Video Panel */}
            <div className={`${styles['video-panel']} ${!videoVisible ? styles['hidden'] : ''}`}>
                <div className={styles['video-wrapper']}>
                    <VideoPlayer
                        ref={videoRef}
                        youtubeVideoId={activeYoutubeVideoId}
                        initialStartTime={currentSegment?.startTime || 0}
                        autoPlay={currentIndex > 0}
                        onTimeUpdate={setCurrentTime}
                        onPlayingChange={setIsPlaying}
                    />
                </div>
            </div>

            {/* Dictation Panel (Game Mode) */}
            <div className={styles['dictation-panel']}>
                <DictationPanel
                    gameMode={true}
                    segments={segments}
                    videoRef={videoRef}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTogglePlay={onTogglePlay}
                    currentIndex={currentIndex}
                    onIndexChange={onIndexChange}
                    completedSet={completedSet}
                    onCompletedChange={onCompletedChange}
                    isActive={true}
                    gameDictation={dictation}
                />
            </div>
        </div>
    );
});

const GameEngine = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const videoRef = useRef(null);

    const sessionId = location.state?.sessionId;
    const segments = useMemo(() => location.state?.segments || [], [location.state]);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedSet, setCompletedSet] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [resultsData, setResultsData] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [videoVisible, setVideoVisible] = useState(true);

    const currentSegment = segments[currentIndex] || null;
    const activeYoutubeVideoId = currentSegment?.youtubeVideoId || '';

    const dictation = useGameDictation({
        segments,
        currentSegment,
        currentIndex,
        autoAdvance: true,
        setCurrentIndex,
        onCompletedChange: setCompletedSet,
    });

    useEffect(() => {
        if (!sessionId || segments.length === 0) {
            notification.warning({
                message: t('gameHub.engine.noData'),
                description: t('gameHub.engine.createChallenge'),
            });
            navigate('/game/setup', { replace: true });
        }
    }, [sessionId, segments.length, navigate, t]);

    const handleTogglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pauseVideo();
            else videoRef.current.playVideo();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (segments.length > 0 && completedSet.size >= segments.length && !submitting && !resultsData) {
            const submitGame = async () => {
                setSubmitting(true);
                try {
                    const results = dictation.getGameResults();
                    const res = await gameApi.submitDictation(sessionId, results);
                    setResultsData(res.data);
                    setShowResults(true);
                } catch (err) {
                    notification.error({
                        message: t('gameHub.engine.submitError'),
                        description: err?.message || t('gameHub.engine.tryAgain'),
                    });
                } finally {
                    setSubmitting(false);
                }
            };
            const timer = setTimeout(submitGame, 2500);
            return () => clearTimeout(timer);
        }
    }, [completedSet.size, segments.length, submitting, resultsData, sessionId, dictation, t]);

    const handleResultsClose = useCallback(() => {
        setShowResults(false);
        navigate('/game/setup');
    }, [navigate]);

    const handleRetry = useCallback(() => {
        setShowResults(false);
        navigate('/game/setup');
    }, [navigate]);

    const handleBack = useCallback(() => {
        navigate('/game/setup');
    }, [navigate]);

    if (!sessionId || segments.length === 0) {
        return (
            <div className={styles['engine-container']}>
                <Result
                    status="warning"
                    title={t('gameHub.engine.noChallenge')}
                    extra={<Button type="primary" onClick={() => navigate('/game/setup')}>{t('gameHub.engine.createNew')}</Button>}
                />
            </div>
        );
    }

    return (
        <div className={styles['engine-container']}>
            <div className={styles['top-bar']}>
                <div className={styles['back-btn']} onClick={handleBack}>
                    <ArrowLeftOutlined />
                    <span>{t('common.exit')}</span>
                </div>
                <div className={styles['top-title']}>
                    <span className={styles['title-text']}>{t('home.challenge.dailyTitle')}</span>
                    <span className={styles['title-counter']}>
                        {completedSet.size} / {segments.length}
                    </span>
                </div>
                <div className={styles['top-spacer']}>
                    <Button
                        type="text"
                        icon={videoVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        onClick={() => setVideoVisible(!videoVisible)}
                        className={styles['toggle-video-btn']}
                    >
                        {videoVisible ? t('learning.page.hideVideo') : t('learning.page.showVideo')}
                    </Button>
                </div>
            </div>

            <ProgressBar
                completed={completedSet.size}
                total={segments.length}
                mode="dictation"
            />

            <VideoSection 
                activeYoutubeVideoId={activeYoutubeVideoId}
                currentSegment={currentSegment}
                currentIndex={currentIndex}
                onTogglePlay={handleTogglePlay}
                videoRef={videoRef}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                videoVisible={videoVisible}
                segments={segments}
                onIndexChange={setCurrentIndex}
                completedSet={completedSet}
                onCompletedChange={setCompletedSet}
                dictation={dictation}
            />

            {submitting && (
                <div className={styles['submit-overlay']}>
                    <Spin size="large" />
                    <span className={styles['submit-text']}>{t('gameHub.engine.calculating')}</span>
                </div>
            )}

            <GameResultsModal
                visible={showResults}
                finalAverageScore={resultsData?.finalAverageScore || 0}
                segmentDetails={resultsData?.segmentDetails || []}
                onClose={handleResultsClose}
                onRetry={handleRetry}
            />
        </div>
    );
};
export default GameEngine;
