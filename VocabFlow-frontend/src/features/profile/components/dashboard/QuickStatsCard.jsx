import React, { useState } from 'react';
import { formatMinutes } from '../../../learningHub/utils/formatters';
import { useTranslation } from 'react-i18next';

const QuickStatsCard = ({ statistics }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('fillBlank');

  const formatScore = (value) => {
    if (value === null || value === undefined) return '--';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return '--';
    return `${Math.round(numeric)}/100`;
  };

  const formatStudyTime = (seconds) => `${formatMinutes(seconds || 0)} ${t('profile.quickStats.minutes')}`;

  const stats = {
    fillBlank: {
      label: t('profile.quickStats.listening', 'Listening'),
      lessons: statistics?.fillBlankCompletedVideos || 0,
      score: formatScore(statistics?.avgFillBlankScore),
      time: formatStudyTime(statistics?.totalFillBlankDuration || 0),
      lessonsLabel: t('profile.quickStats.completedLessons'),
    },
    dictation: {
      label: t('profile.quickStats.dictation'),
      lessons: statistics?.dictationCompletedVideos || 0,
      score: formatScore(statistics?.avgDictationScore),
      time: formatStudyTime(statistics?.totalDictationDuration || 0),
      lessonsLabel: t('profile.quickStats.completedLessons'),
    },
    shadowing: {
      label: t('profile.quickStats.shadowing'),
      lessons: statistics?.shadowingCompletedVideos || 0,
      score: formatScore(statistics?.avgShadowingScore),
      time: formatStudyTime(statistics?.totalShadowingDuration || 0),
      lessonsLabel: t('profile.quickStats.completedLessons'),
    },
    quiz: {
      label: t('profile.quickStats.quiz', 'Quiz'),
      lessons: statistics?.quizCompletedVideos || 0,
      score: formatScore(statistics?.avgQuizScore),
      time: formatStudyTime(statistics?.totalQuizDuration || 0),
      lessonsLabel: t('profile.quickStats.completedLessons'),
    },
  };

  const currentStats = stats[activeTab];
  const tabs = Object.entries(stats);

  return (
    <div className="dashboard-card quick-stats">
      <div className="quick-stats__tabs">
        {tabs.map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`quick-stats__tab ${activeTab === key ? 'quick-stats__tab--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="quick-stats__grid">
        <div className="quick-stats__stat">
          <span className="quick-stats__stat-value">{currentStats.lessons}</span>
          <span className="quick-stats__stat-label">{currentStats.lessonsLabel}</span>
        </div>
        <div className="quick-stats__stat">
          <span className="quick-stats__stat-value">{currentStats.score}</span>
          <span className="quick-stats__stat-label">{t('profile.quickStats.averageScore', 'Điểm trung bình')}</span>
        </div>
        <div className="quick-stats__stat">
          <span className="quick-stats__stat-value">{currentStats.time}</span>
          <span className="quick-stats__stat-label">{t('profile.quickStats.activeTime')}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;
