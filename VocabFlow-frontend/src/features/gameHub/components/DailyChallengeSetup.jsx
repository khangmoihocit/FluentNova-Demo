import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { ThunderboltOutlined, RocketOutlined, SwapOutlined, TrophyOutlined } from '@ant-design/icons';
import { gameApi } from '../api/gameApi';
import { isAuthenticated } from '@/utils/auth';
import styles from '../styles/DailyChallengeSetup.module.scss';

const COUNT_OPTIONS = [5, 10, 20, 30, 50];

const DailyChallengeSetup = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedCount, setSelectedCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const autoStartTriggered = useRef(false);

    // ── Auto-start from HomePage "Play Now" banner ──
    useEffect(() => {
        const { autoStart, count } = location.state || {};
        if (autoStart && !autoStartTriggered.current) {
            autoStartTriggered.current = true;
            // Clear navigation state so back-navigation won't re-trigger
            navigate(location.pathname, { replace: true, state: {} });
            // Use the count from state, or fall back to the default
            startChallenge(count || 20);
        }
    }, [location.state]);

    const startChallenge = async (count) => {
        if (!isAuthenticated()) {
            notification.info({
                message: t('gameHub.setup.loginRequired'),
                description: t('gameHub.setup.loginRequiredDesc'),
                placement: 'top'
            });
            return;
        }

        setLoading(true);
        try {
            const res = await gameApi.generateDictation(count);
            const { sessionId, segments } = res.data;
            navigate('/game/dictation', {
                state: { sessionId, segments },
            });
        } catch (err) {
            notification.error({
                message: t('gameHub.setup.createError'),
                description: err?.message || t('gameHub.setup.tryAgain'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStartChallenge = () => {
        startChallenge(selectedCount);
    };

    return (
        <div className={styles['setup-container']}>
            <div className={styles['setup-card']}>
                {/* Hero */}
                <div className={styles['hero-section']}>
                    <div className={styles['hero-icon']}>
                        <ThunderboltOutlined />
                    </div>
                    <h1 className={styles['hero-title']}>{t('gameHub.setup.heroTitle')}</h1>
                    <p className={styles['hero-subtitle']}>
                        {t('gameHub.setup.heroSubtitle1')}
                        <br />
                        {t('gameHub.setup.heroSubtitle2')}
                    </p>
                </div>

                {/* Count Selector */}
                <div className={styles['count-section']}>
                    <h3 className={styles['count-label']}>{t('gameHub.setup.selectCount')}</h3>
                    <div className={styles['count-grid']}>
                        {COUNT_OPTIONS.map((count) => (
                            <button
                                key={count}
                                className={`${styles['count-btn']} ${selectedCount === count ? styles['count-btn-active'] : ''}`}
                                onClick={() => setSelectedCount(count)}
                            >
                                <span className={styles['count-number']}>{count}</span>
                                <span className={styles['count-unit']}>{t('gameHub.setup.questionUnit')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <button
                    className={styles['start-btn']}
                    onClick={handleStartChallenge}
                    disabled={loading}
                >
                    {loading ? (
                        <Spin size="small" />
                    ) : (
                        <>
                            <RocketOutlined />
                            <span>{t('gameHub.setup.startBtn')}</span>
                        </>
                    )}
                </button>

                {/* Info Footer */}
                <div className={styles['info-footer']}>
                    <div className={styles['info-item']}>
                        <span className={styles['info-icon']}><SwapOutlined /></span>
                        <span>{t('gameHub.setup.randomInfo')}</span>
                    </div>
                    <div className={styles['info-item']}>
                        <span className={styles['info-icon']}><TrophyOutlined /></span>
                        <span>{t('gameHub.setup.resultInfo')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyChallengeSetup;
