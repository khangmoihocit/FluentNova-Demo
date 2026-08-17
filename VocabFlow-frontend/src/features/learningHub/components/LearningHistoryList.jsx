import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, formatDuration } from '../utils/formatters';
import './LearningHistoryList.scss';

// --- Skeleton Loader ---
const HistorySkeleton = () => (
    <div className="history-list">
        <div className="history-list__header">
            <div className="skeleton-line skeleton-line--h-title" />
        </div>
        <div className="history-list__items">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="history-item history-item--skeleton">
                    <div className="skeleton-thumb" />
                    <div className="history-item__body">
                        <div className="skeleton-line skeleton-line--h-name" />
                        <div className="skeleton-line skeleton-line--h-meta" />
                        <div className="skeleton-line skeleton-line--h-badges" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- Empty State ---
const HistoryEmpty = () => (
    <div className="history-list history-list--empty">
        <div className="history-list__empty-icon">📚</div>
        <p className="history-list__empty-title">Chưa có lịch sử học tập</p>
        <p className="history-list__empty-desc">
            Hãy bắt đầu học một video để xem lịch sử của bạn tại đây!
        </p>
    </div>
);

// --- Status Badge ---
const StatusBadge = ({ completed, label }) => (
    <span className={`history-badge ${completed ? 'history-badge--done' : 'history-badge--progress'}`}>
        <span className="history-badge__icon">{completed ? '✅' : '⏳'}</span>
        <span className="history-badge__text">{label}</span>
    </span>
);

// --- Single History Item ---
const HistoryItem = ({ item, onClick }) => {
    const thumbnailUrl = item.videoThumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;

    return (
        <div className="history-item" onClick={onClick} role="button" tabIndex={0}>
            <div className="history-item__thumb-wrap">
                <img
                    className="history-item__thumb"
                    src={thumbnailUrl}
                    alt={item.videoTitle}
                    loading="lazy"
                />
                {item.status === 'COMPLETED' && (
                    <div className="history-item__thumb-overlay">
                        <span>Hoàn thành</span>
                    </div>
                )}
            </div>
            <div className="history-item__body">
                <h4 className="history-item__title">{item.videoTitle}</h4>
                <div className="history-item__meta">
                    {item.channelName && (
                        <span className="history-item__channel">{item.channelName}</span>
                    )}
                    {item.difficultyLevel && (
                        <span className="history-item__level">{item.difficultyLevel}</span>
                    )}
                    <span className="history-item__time">
                        {formatRelativeTime(item.lastStudiedAt)}
                    </span>
                </div>
                <div className="history-item__badges">
                    <StatusBadge
                        completed={item.isDictationCompleted}
                        label="Dictation"
                    />
                    <StatusBadge
                        completed={item.isShadowingCompleted}
                        label="Shadowing"
                    />
                    {(item.dictationTimeSeconds > 0 || item.shadowingTimeSeconds > 0) && (
                        <span className="history-item__duration">
                            🕐 {formatDuration((item.dictationTimeSeconds || 0) + (item.shadowingTimeSeconds || 0))}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const LearningHistoryList = ({ history, loading, hasMore, onLoadMore, loadingMore }) => {
    const navigate = useNavigate();

    if (loading) return <HistorySkeleton />;

    const items = history?.data || [];
    if (items.length === 0) return <HistoryEmpty />;

    return (
        <div className="history-list">
            <div className="history-list__header">
                <h2 className="history-list__title">Lịch sử học tập</h2>
                <span className="history-list__count">
                    {history.totalElements} video đã học
                </span>
            </div>

            <div className="history-list__items">
                {items.map((item) => (
                    <HistoryItem
                        key={item.id}
                        item={item}
                        onClick={() => navigate(`/videos/${item.videoId}/study`)}
                    />
                ))}
            </div>

            {/* Load More */}
            {hasMore && (
                <div className="history-list__load-more">
                    <button
                        className="history-list__load-btn"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <span className="history-list__load-spinner" />
                        ) : (
                            'Xem thêm'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default LearningHistoryList;
