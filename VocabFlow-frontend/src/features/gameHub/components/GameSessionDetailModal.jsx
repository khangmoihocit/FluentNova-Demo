import React, { useState, useEffect } from 'react';
import { Modal, Spin, notification, Button, Tag, Divider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlayCircleOutlined, EyeOutlined, RetweetOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '../api/gameApi';
import dayjs from 'dayjs';
import styles from '../styles/GameSessionDetailModal.module.scss';

const GameSessionDetailModal = ({ sessionId, visible, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        if (visible && sessionId) {
            fetchDetails(sessionId);
        } else {
            setDetails(null);
        }
    }, [visible, sessionId]);

    const fetchDetails = async (id) => {
        setLoading(true);
        try {
            const res = await gameApi.getSessionDetails(id);
            setDetails(res.data);
        } catch (err) {
            notification.error({
                message: t('gameHub.history.fetchError'),
                description: err?.message || t('gameHub.history.fetchErrorDesc'),
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleJumpToVideo = (videoId, segmentId, mode) => {
        navigate(`/videos/${videoId}/study`, {
            state: { startSegmentId: segmentId, mode },
        });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#52c41a';
        if (score >= 75) return '#faad14';
        if (score >= 50) return '#d48806';
        return '#f5222d';
    };

    return (
        <Modal
            title={t('gameHub.history.title')}
            open={visible}
            onCancel={onClose}
            footer={
                <Button type="primary" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
            }
            width={700}
            className={styles['detail-modal']}
            destroyOnHidden
        >
            {loading || !details ? (
                <div className={styles['loading-container']}>
                    <Spin size="large" />
                </div>
            ) : (
                <div className={styles['detail-content']}>
                    {/* Header Stats */}
                    <div className={styles['header-stats']}>
                        <div className={styles['stat-box']}>
                            <span className={styles['stat-label']}>{t('gameHub.stats.avgScore')}</span>
                            <span
                                className={styles['stat-value']}
                                style={{ color: getScoreColor(details.finalAverageScore) }}
                            >
                                {Number(details.finalAverageScore).toFixed(1)}
                            </span>
                        </div>
                        <div className={styles['stat-box']}>
                            <span className={styles['stat-label']}>{t('gameHub.results.totalSentences')}</span>
                            <span className={styles['stat-value']}>{details.totalQuestions}</span>
                        </div>
                        <div className={styles['stat-box']}>
                            <span className={styles['stat-label']}>{t('notebook.tableCreatedAt')}</span>
                            <span className={styles['stat-value']}>
                                {dayjs(details.createdAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                        </div>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Segment List */}
                    <div className={styles['segment-list']}>
                        {details.segmentDetails.map((seg, index) => (
                            <div key={seg.segmentId} className={styles['segment-item']}>
                                <div className={styles['segment-main']}>
                                    <div className={styles['segment-header']}>
                                        <span className={styles['segment-index']}>{t('gameHub.results.totalSentences')} {index + 1}</span>
                                        <span
                                            className={styles['segment-score']}
                                            style={{ color: getScoreColor(seg.segmentScore) }}
                                        >
                                            {seg.segmentScore}
                                        </span>
                                    </div>
                                    <p className={styles['segment-text']}>{seg.englishText}</p>
                                    
                                    <div className={styles['segment-penalties']}>
                                        {seg.replayCount > 0 && (
                                            <Tooltip title={`${t('gameHub.results.replay')}: ${seg.replayCount}`}>
                                                <Tag icon={<RetweetOutlined />} color="default">
                                                    {seg.replayCount}
                                                </Tag>
                                            </Tooltip>
                                        )}
                                        {seg.hintCount > 0 && (
                                            <Tooltip title={`${t('gameHub.results.hint')}: ${seg.hintCount}`}>
                                                <Tag icon={<EyeOutlined />} color="warning">
                                                    {seg.hintCount}
                                                </Tag>
                                            </Tooltip>
                                        )}
                                        {seg.wrongSubmitCount > 0 && (
                                            <Tooltip title={`${t('gameHub.results.wrong')}: ${seg.wrongSubmitCount}`}>
                                                <Tag icon={<CloseCircleOutlined />} color="error">
                                                    {seg.wrongSubmitCount}
                                                </Tag>
                                            </Tooltip>
                                        )}
                                        {seg.replayCount === 0 && seg.hintCount === 0 && seg.wrongSubmitCount === 0 && (
                                            <Tag color="success">Perfect</Tag>
                                        )}
                                    </div>
                                </div>
                                <div className={styles['segment-action']}>
                                    <Tooltip title="Luyện tập lại câu này">
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            icon={<PlayCircleOutlined />}
                                            onClick={() => handleJumpToVideo(seg.videoId, seg.segmentId, details.gameType === 'DICTATION_CHALLENGE' ? 'dictation' : 'Shadowing')}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default GameSessionDetailModal;
