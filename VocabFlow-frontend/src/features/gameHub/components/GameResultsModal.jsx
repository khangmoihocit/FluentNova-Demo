import React from 'react';
import { 
    TrophyOutlined, 
    ArrowLeftOutlined, 
    RedoOutlined,
    RetweetOutlined,
    EyeOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { Modal, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from '../styles/GameResultsModal.module.scss';

const getScoreGrade = (score, t) => {
    if (score >= 90) return { label: t('gameHub.results.excellent'), emoji: '🏆', tier: 'gold' };
    if (score >= 75) return { label: t('gameHub.results.great'), emoji: '🌟', tier: 'silver' };
    if (score >= 50) return { label: t('gameHub.results.good'), emoji: '💪', tier: 'bronze' };
    return { label: t('gameHub.results.tryHarder'), emoji: '📖', tier: 'base' };
};

const GameResultsModal = ({
    visible,
    finalAverageScore = 0,
    segmentDetails = [],
    onClose,
    onRetry,
}) => {
    const { t } = useTranslation();
    const grade = getScoreGrade(finalAverageScore, t);
    const totalSegments = segmentDetails.length;
    const perfectCount = segmentDetails.filter(s => s.segmentScore === 100).length;

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={480}
            className={styles['results-modal']}
            destroyOnHidden
        >
            <div className={styles['results-content']}>
                {/* Hero Score */}
                <div className={styles['score-hero']}>
                    <div className={`${styles['score-ring']} ${styles[`ring-${grade.tier}`]}`}>
                        <span className={styles['score-value']}>{Math.round(finalAverageScore)}</span>
                        <span className={styles['score-max']}>/100</span>
                    </div>
                    <div className={styles['grade-label']}>
                        <span className={styles['grade-emoji']}>{grade.emoji}</span>
                        <span className={styles['grade-text']}>{grade.label}</span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className={styles['stats-row']}>
                    <div className={styles['stat-item']}>
                        <span className={styles['stat-value']}>{totalSegments}</span>
                        <span className={styles['stat-label']}>{t('gameHub.results.totalSentences')}</span>
                    </div>
                    <div className={styles['stat-divider']} />
                    <div className={styles['stat-item']}>
                        <span className={styles['stat-value']}>{perfectCount}</span>
                        <span className={styles['stat-label']}>{t('gameHub.results.perfectCount')}</span>
                    </div>
                    <div className={styles['stat-divider']} />
                    <div className={styles['stat-item']}>
                        <span className={styles['stat-value']}>
                            {totalSegments > 0 ? Math.round((perfectCount / totalSegments) * 100) : 0}%
                        </span>
                        <span className={styles['stat-label']}>{t('gameHub.results.perfectRate')}</span>
                    </div>
                </div>

                {/* Segment Detail List */}
                <div className={styles['detail-list']}>
                    <h4 className={styles['detail-title']}>{t('gameHub.results.detailTitle')}</h4>
                    <div className={styles['detail-scroll']}>
                        {segmentDetails.map((detail, idx) => (
                            <div key={detail.segmentId} className={styles['detail-row']}>
                                <span className={styles['detail-index']}>#{idx + 1}</span>
                                <div className={styles['detail-metrics']}>
                                    {detail.hintCount > 0 && (
                                        <Tooltip title={t('gameHub.results.hint')}>
                                            <span className={styles['metric-tag']}>
                                                <EyeOutlined style={{ color: 'var(--color-warning)' }} />
                                                {detail.hintCount}
                                            </span>
                                        </Tooltip>
                                    )}
                                    {detail.replayCount > 0 && (
                                        <Tooltip title={t('gameHub.results.replay')}>
                                            <span className={styles['metric-tag']}>
                                                <RetweetOutlined style={{ color: 'var(--color-primary)' }} />
                                                {detail.replayCount}
                                            </span>
                                        </Tooltip>
                                    )}
                                    {detail.wrongSubmitCount > 0 && (
                                        <Tooltip title={t('gameHub.results.wrong')}>
                                            <span className={styles['metric-tag']}>
                                                <CloseCircleOutlined style={{ color: 'var(--color-error)' }} />
                                                {detail.wrongSubmitCount}
                                            </span>
                                        </Tooltip>
                                    )}
                                </div>
                                <span className={`${styles['detail-score']} ${
                                    detail.segmentScore === 100 ? styles['score-perfect'] :
                                    detail.segmentScore >= 75 ? styles['score-good'] :
                                    styles['score-low']
                                }`}>
                                    {detail.segmentScore}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles['action-row']}>
                    <button className={styles['action-btn-secondary']} onClick={onClose}>
                        <ArrowLeftOutlined />
                        <span>{t('gameHub.results.exit')}</span>
                    </button>
                    <button className={styles['action-btn-primary']} onClick={onRetry}>
                        <RedoOutlined />
                        <span>{t('gameHub.results.retry')}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GameResultsModal;
