import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDuration, formatRelativeTime } from '../../../learningHub/utils/formatters';

const LearningHistoryCard = ({ history, loading, hasMore, onLoadMore, loadingMore }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');

  const items = history?.data || [];

  const filteredItems = useMemo(() => {
    if (activeTab === 'ALL') return items;
    return items.filter((item) => item.status === activeTab);
  }, [items, activeTab]);

  const formatScore = (value) => {
    const numeric = Number(value || 0);
    return `${Math.round(numeric)}/100`;
  };

  const buildModeBadges = (item) => {
    const badges = [];

    if ((item.videoWatchTimeSeconds || 0) > 0) {
      badges.push({
        key: 'watch',
        label: `Watch ${formatDuration(item.videoWatchTimeSeconds)}`,
        completed: true,
      });
    }

    badges.push(
      {
        key: 'fillBlank',
        label: item.fillBlankCompleted ? `Listening ${formatScore(item.avgFillBlankScore)}` : 'Listening (Chưa xong)',
        completed: Boolean(item.fillBlankCompleted),
      },
      {
        key: 'dictation',
        label: item.isDictationCompleted ? `Dictation ${formatScore(item.avgDictationScore)}` : 'Dictation (Đang học)',
        completed: Boolean(item.isDictationCompleted),
      },
      {
        key: 'shadowing',
        label: item.isShadowingCompleted ? `Shadowing ${formatScore(item.avgShadowingScore)}` : 'Shadowing (Đang học)',
        completed: Boolean(item.isShadowingCompleted),
      },
      {
        key: 'quiz',
        label: (item.quizCompleted || item.isQuizCompleted) ? `Quiz ${formatScore(item.avgQuizScore)}` : 'Quiz (Chưa xong)',
        completed: Boolean(item.quizCompleted || item.isQuizCompleted),
      },
    );

    return badges;
  };

  const getOverallScore = (item) => {
    const scores = [
      item.fillBlankCompleted ? Number(item.avgFillBlankScore || 0) : null,
      item.isDictationCompleted ? Number(item.avgDictationScore || 0) : null,
      item.isShadowingCompleted ? Number(item.avgShadowingScore || 0) : null,
      (item.quizCompleted || item.isQuizCompleted) ? Number(item.avgQuizScore || 0) : null,
    ].filter((score) => score !== null && !Number.isNaN(score));

    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  return (
    <div className="dashboard-card history-card">
      <div className="dashboard-card__header">
        <h2 className="dashboard-card__title">{t('profile.history.title')}</h2>
      </div>

      <div className="history-card__tabs">
        <button
          type="button"
          className={`history-card__tab ${activeTab === 'ALL' ? 'history-card__tab--active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          {t('profile.history.tabs.all')}
        </button>
        <button
          type="button"
          className={`history-card__tab ${activeTab === 'COMPLETED' ? 'history-card__tab--active' : ''}`}
          onClick={() => setActiveTab('COMPLETED')}
        >
          {t('profile.history.tabs.completed')}
        </button>
        <button
          type="button"
          className={`history-card__tab ${activeTab === 'IN_PROGRESS' ? 'history-card__tab--active' : ''}`}
          onClick={() => setActiveTab('IN_PROGRESS')}
        >
          {t('profile.history.tabs.inProgress')}
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>{t('profile.history.loading')}</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
          {t('profile.history.empty')}
        </div>
      ) : (
        <div className="history-card__list">
          {filteredItems.map((item) => {
            const thumbnailUrl = item.videoThumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
            const totalTime = item.totalLearningTime || 0;
            const overallScore = getOverallScore(item);
            const modeBadges = buildModeBadges(item);

            return (
              <div
                key={item.id}
                className="history-list-item"
                onClick={() => navigate(`/videos/${item.videoId}/study`)}
                role="button"
              >
                <img src={thumbnailUrl} alt={item.videoTitle} className="history-list-item__thumb" loading="lazy" />

                <div className="history-list-item__info">
                  <h4 className="history-list-item__title" title={item.videoTitle}>{item.videoTitle}</h4>

                  <div className="history-list-item__badges">
                    {modeBadges.map((badge) => (
                      <span
                        key={badge.key}
                        className={`history-list-item__badge ${badge.completed ? '' : 'history-list-item__badge--pending'}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="history-list-item__score">
                  {overallScore !== null ? (
                    <>
                      <span className="history-list-item__score-value">{overallScore}/100</span>
                      <span className="history-list-item__score-meta">
                        {t('profile.history.lastStudiedAt', { time: formatRelativeTime(item.lastStudiedAt || item.lastActivityAt) })}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="history-list-item__score-value history-list-item__score-value--time">
                        {t('profile.history.totalStudyTime', { time: formatDuration(totalTime) })}
                      </span>
                      <span className="history-list-item__score-meta">
                        {t('profile.history.lastStudiedAt', { time: formatRelativeTime(item.lastStudiedAt || item.lastActivityAt) })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              background: 'var(--color-primary-container, #ff8c42)',
              color: 'var(--color-on-primary-container, #370e00)',
              border: 'none',
              padding: '0.625rem 2rem',
              borderRadius: '9999px',
              fontFamily: 'Inter',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loadingMore ? t('profile.history.loading') : t('profile.history.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningHistoryCard;
