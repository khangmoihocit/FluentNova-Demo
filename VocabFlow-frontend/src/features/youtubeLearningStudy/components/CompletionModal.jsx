import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import novaCheer from '@/assets/images/nova_cheer_no_bg.png';
import novaExcited from '@/assets/images/nova_exited_no_bg.png';
import styles from '../styles/CompletionModal.module.scss';

/**
 * CompletionModal — Premium "Congratulations" overlay displayed when 
 * dictation or shadowing for a video is fully completed.
 */
const CompletionModal = ({
    visible = false,
    type = 'dictation', // 'dictation' | 'shadowing'
    completedSegments = 0,
    totalSegments = 0,
    avgScore = 0,
    onClose,
    onContinue,
}) => {
    const { t } = useTranslation();
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (visible) {
            setAnimating(true);
        }
    }, [visible]);

    const title = type === 'dictation' 
        ? t('learning.completion.dictationTitle') 
        : t('learning.completion.shadowingTitle');
        
    const subtitle = type === 'dictation'
        ? t('learning.completion.dictationSubtitle')
        : t('learning.completion.shadowingSubtitle');
        
    const nextAction = type === 'dictation' 
        ? t('learning.completion.nextActionShadowing') 
        : t('learning.completion.nextActionBack');

    const scorePercent = useMemo(() => {
        const n = Number(avgScore);
        return isNaN(n) ? 0 : Math.round(n);
    }, [avgScore]);

    // SVG ring calculations
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (scorePercent / 100) * circumference;

    if (!visible) return null;

    return createPortal(
        <div className={`${styles['modal-backdrop']} ${animating ? styles['visible'] : ''}`} onClick={onClose}>
            <div className={styles['modal-card']} onClick={(e) => e.stopPropagation()}>
                {/* Decorative particles omitted for brevity in instruction but kept in logic */}
                <div className={styles['particles']}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={styles['particle']} style={{
                            '--delay': `${i * 0.15}s`,
                            '--angle': `${i * 30}deg`,
                            '--distance': `${60 + Math.random() * 40}px`,
                        }} />
                    ))}
                </div>

                <div className={styles['celebration-icon']}>
                    <img
                        src={scorePercent >= 80 ? novaExcited : novaCheer}
                        alt={scorePercent >= 80 ? 'Nova phấn khích' : 'Nova cổ vũ'}
                        className={styles['nova-mascot']}
                    />
                </div>

                <h2 className={styles['modal-title']}>{title}</h2>
                <p className={styles['modal-subtitle']}>{subtitle}</p>

                <div className={styles['stats-row']}>
                    <div className={styles['score-ring']}>
                        <svg viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r={radius} className={styles['ring-bg']} />
                            <circle
                                cx="60" cy="60" r={radius}
                                className={styles['ring-fill']}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                style={{ transition: 'stroke-dashoffset 1.5s ease-out 0.5s' }}
                            />
                        </svg>
                        <div className={styles['score-value']}>
                            <span className={styles['score-num']}>{scorePercent}</span>
                            <span className={styles['score-unit']}>%</span>
                        </div>
                        <div className={styles['score-label']}>{t('learning.completion.avgScore')}</div>
                    </div>

                    <div className={styles['stat-block']}>
                        <div className={styles['stat-value']}>{completedSegments}</div>
                        <div className={styles['stat-label']}>{t('learning.completion.sentencesLearned')}</div>
                    </div>
                </div>

                <div className={styles['modal-actions']}>
                    <button className={styles['btn-primary']} onClick={onContinue}>
                        {nextAction}
                    </button>
                    <button className={styles['btn-secondary']} onClick={onClose}>
                        {t('learning.completion.stayToReview')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CompletionModal;
