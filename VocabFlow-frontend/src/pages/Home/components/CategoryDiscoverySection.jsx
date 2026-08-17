import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VideoCard from '../../../features/youtubeLearning/components/VideoCard';
import styles from '../styles/HomePage.module.scss';

// ═══════════════════════════════════════════
// CategoryDiscoverySection
// Iterates over categories from GET /categories/get-category-video
//
// Backend DTO (HomeCategoryResponse):
//   { categoryId: Long, categoryName: String,
//     videoLessonFilterResponses: [VideoLessonFilterResponse...] }
//
// Reuses the existing <VideoCard /> component to ensure UI consistency
// ═══════════════════════════════════════════

const CategoryDiscoverySection = ({ categories }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!categories || categories.length === 0) return null;

    return (
        <>
            {categories.map((cat) => {
                const videos = cat.videoLessonFilterResponses || [];
                if (videos.length === 0) return null;

                return (
                    <div key={cat.categoryId} className={`${styles['home-section']} ${styles['category-section']}`}>
                        <div className={styles['section-header']}>
                            <h2 className={styles['section-title']}>{cat.categoryName}</h2>
                            <button
                                className={styles['section-action']}
                                onClick={() => navigate(`/videos?categoryId=${cat.categoryId}`)}
                            >
                                {t('common.viewAll')} →
                            </button>
                        </div>

                        <div className={styles['video-row']}>
                            {videos.slice(0, 10).map((video) => (
                                <div key={video.id} className={styles['video-card-item']}>
                                    <VideoCard video={video} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default CategoryDiscoverySection;
