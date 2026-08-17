import React, { useState } from 'react';
import { Skeleton, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import GameSessionDetailModal from './GameSessionDetailModal';
import { isAuthenticated } from '@/utils/auth';
import styles from '../styles/GameHistoryList.module.scss';

const getScoreTierClass = (score) => {
    if (score >= 90) return styles.gold;
    if (score >= 75) return styles.silver;
    if (score >= 50) return styles.bronze;
    return styles.base;
};

const formatGameType = (type) => {
    if (type === 'DICTATION_CHALLENGE') return 'Dictation Challenge';
    if (type === 'SHADOWING_CHALLENGE') return 'Shadowing Challenge';
    return type;
};

const getGameTypeClass = (type) => {
    if (type === 'DICTATION_CHALLENGE') return styles.dictation;
    if (type === 'SHADOWING_CHALLENGE') return styles.shadowing;
    return '';
};

const GameHistoryList = ({ historyList, loading, onLoadMore, hasMore }) => {
    const { t } = useTranslation();
    const [selectedSessionId, setSelectedSessionId] = useState(null);

    const handleOpenDetail = (sessionId) => {
        setSelectedSessionId(sessionId);
    };

    const handleCloseDetail = () => {
        setSelectedSessionId(null);
    };

    return (
        <div className={styles['history-container']}>
            <h2>{t('gameHub.history.title')}</h2>

            <div className={styles['history-list']}>
                {historyList.map((item) => (
                    <div 
                        key={item.sessionId} 
                        className={styles['history-item']}
                        onClick={() => handleOpenDetail(item.sessionId)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles['item-info']}>
                            <span className={`${styles['game-type-badge']} ${getGameTypeClass(item.gameType)}`}>
                                {formatGameType(item.gameType)}
                            </span>
                            <span className={styles['item-date']}>
                                {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                        </div>

                        <div className={styles['item-score-section']}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span className={`${styles['score-badge']} ${getScoreTierClass(item.finalAverageScore)}`}>
                                        {Number(item.finalAverageScore || 0).toFixed(0)}
                                    </span>
                                    <span className={styles['question-count']}>
                                        {item.totalQuestions} {t('gameHub.history.questionCount')}
                                    </span>
                                </div>
                                <RightOutlined style={{ color: 'var(--color-muted)', fontSize: '12px' }} />
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <>
                        <Skeleton active paragraph={{ rows: 1 }} />
                        <Skeleton active paragraph={{ rows: 1 }} />
                    </>
                )}

                {!loading && historyList.length === 0 && (
                    <div className={styles['empty-state']}>
                        {isAuthenticated() 
                            ? t('gameHub.history.empty')
                            : t('gameHub.history.loginRequired')}
                    </div>
                )}
            </div>

            {hasMore && !loading && (
                <button className={styles['load-more-btn']} onClick={onLoadMore}>
                    {t('gameHub.history.loadMore')}
                </button>
            )}

            <GameSessionDetailModal 
                visible={!!selectedSessionId} 
                sessionId={selectedSessionId} 
                onClose={handleCloseDetail} 
            />
        </div>
    );
};

export default GameHistoryList;
