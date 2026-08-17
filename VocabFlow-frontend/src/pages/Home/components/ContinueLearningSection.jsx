import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VideoCard from '../../../features/youtubeLearning/components/VideoCard';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// ContinueLearningSection
// Uses the same VideoCard component from /videos page
// with a progress bar appended below each card
//
// Backend DTO (LearningHistoryResponse) → mapped to VideoCard shape:
//   videoId → id, videoTitle → title, videoThumbnailUrl → thumbnailUrl
//   difficultyLevel, avgDictationScore, avgShadowingScore, status
// ═══════════════════════════════════════════

/**
 * Transform LearningHistoryResponse into VideoCard-compatible shape
 */
const mapToVideoCardShape = (item) => ({
    id: item.videoId,
    title: item.videoTitle,
    thumbnailUrl: item.videoThumbnailUrl,
    difficultyLevel: item.difficultyLevel,
    channelName: item.channelName,
    createdAt: item.lastStudiedAt,
    userProgressResponse: {
        status: item.status || 'IN_PROGRESS',
        avgDictationScore: item.avgDictationScore,
        avgShadowingScore: item.avgShadowingScore,
    },
    isFavorited: item.isFavorited,
});

const ContinueLearningSection = ({ videos }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!videos || videos.length === 0) {
        return null;
    }

    return (
        <div className={`${styles['home-section']} ${styles['continue-section']}`}>
            <div className={styles['section-header']}>
                <h2 className={styles['section-title']}>{t('home.continueLearning')}</h2>
                <button
                    className={styles['section-action']}
                    onClick={() => navigate('/profile')}
                >
                    {t('common.viewAll')} →
                </button>
            </div>

            <div className={styles['scroll-row']}>
                {videos.map((item) => {
                    const videoData = mapToVideoCardShape(item);

                    return (
                        <div key={item.id} className={styles['progress-card-wrap']}>
                            <VideoCard video={videoData} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ContinueLearningSection;
