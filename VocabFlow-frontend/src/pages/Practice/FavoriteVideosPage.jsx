import React, { useMemo, useState } from 'react';
import { message, Spin, Empty, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '../../utils/auth';
import { getUser } from '../../utils/cookie';
import { buildVideoDeckName, buildVideoSegmentNote, getAnkiSyncSummary, syncNotesToAnki } from '../../utils/ankiSync';
import { studyApi } from '../../features/youtubeLearningStudy/api/studyApi';
import FavoriteButton from '../../components/common/Button/FavoriteButton';
import styles from './FavoriteVideosPage.module.scss';
import { useNavigate, Link } from 'react-router-dom';
import { SyncOutlined } from '@ant-design/icons';
import { useFavoritesQuery } from '../../hooks/queries/useFavoriteQueries';
import { QUERY_KEYS } from '../../constants/queryKeys';

const formatDuration = (durationStr) => {
  if (!durationStr) return '';
  const seconds = parseInt(durationStr, 10);
  if (isNaN(seconds)) return durationStr;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const FavoriteVideosPage = () => {
  const { t } = useTranslation();
  const [syncingId, setSyncingId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useMemo(() => ({ pageNo: 1, pageSize: 50 }), []);
  const favoritesQuery = useFavoritesQuery(params);
  const videos = favoritesQuery.data?.data || [];

  const handleRemoved = (videoId) => {
    queryClient.setQueryData(QUERY_KEYS.favoritesList(params), (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: (oldData.data || []).filter((video) => video.videoId !== videoId),
      };
    });
  };

  const handleSyncToAnki = async (video) => {
    if (!isAuthenticated()) {
      message.warning(t('favorites.loginRequired'));
      return;
    }
    if (syncingId) return;
    try {
      setSyncingId(video.videoId);

      const studyRes = await studyApi.getStudyDetail(video.videoId);
      const segments = studyRes.data?.segments || [];
      const videoDetail = studyRes.data?.videoDetail || {};

      if (!segments.length) {
        message.warning('Video này chưa có transcript để đồng bộ sang Anki.');
        return;
      }

      const user = getUser();
      const deckName = buildVideoDeckName({
        rootDeckName: user?.ankiVideoDeckName || 'English by VocabFlow Video',
        videoTitle: video.title || videoDetail.title,
      });
      const notes = segments.map((segment) => buildVideoSegmentNote({
        segment,
        deckName,
        youtubeVideoId: video.youtubeVideoId || videoDetail.youtubeVideoId,
      }));
      const result = await syncNotesToAnki(notes);

      if (result.syncedCount > 0 || result.duplicateCount > 0) {
        message.success(getAnkiSyncSummary(result, 'đoạn'));
      } else {
        message.error(result.errors[0]?.message || t('favorites.syncFail'));
      }
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(t('favorites.ankiConnectError'));
      }
    } finally {
      setSyncingId(null);
    }
  };

  if (favoritesQuery.isLoading && !favoritesQuery.data) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.favoritePage}>
      <header className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <h1>{t('favorites.title')}</h1>
          <div className={styles.syncGuideNote}>
            <span>
              {t('notebook.syncGuideNote')} <Link to="/guide" className={styles.guideLink}>{t('notebook.syncGuideLink')}</Link>.
            </span>
          </div>
        </div>
        <p>{t('favorites.subtitle')} <b>Lưu ý: các video của kênh Vietnam today khi đồng bộ sang anki sẽ lỗi không tìm thấy video</b></p> 
      </header>

      {videos.length === 0 ? (
        <Empty description={t('favorites.emptyState')} className={styles.emptyState} />
      ) : (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <div key={video.videoId} className={styles.videoCard}>
              <div
                className={styles.thumbnailContainer}
                onClick={() => navigate(`/videos/${video.videoId}/study`)}
              >
                <img
                  src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`}
                  alt={video.title}
                  className={styles.thumbnail}
                />
                <span className={styles.duration}>{formatDuration(video.duration)}</span>
                <div className={styles.favoriteBtnWrapper}>
                  <FavoriteButton
                    videoId={video.videoId}
                    initialIsFavorite={true}
                    onToggle={(status) => {
                      if (!status) handleRemoved(video.videoId);
                    }}
                  />
                </div>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.title} title={video.title} onClick={() => navigate(`/videos/${video.videoId}/study`)}>
                  {video.title}
                </h3>

                <div className={styles.cardActions}>
                  <Button
                    type="primary"
                    className={styles.ankiSyncBtn}
                    loading={syncingId === video.videoId}
                    onClick={() => handleSyncToAnki(video)}
                    icon={syncingId === video.videoId ? null : <SyncOutlined />}
                  >
                    {t('favorites.syncAnki')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteVideosPage;
