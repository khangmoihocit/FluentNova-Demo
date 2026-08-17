import React from 'react';
import { Card, Typography, Grid, Avatar, message } from 'antd';
import { ClockCircleOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../../components/common/Button/FavoriteButton';
import { isAuthenticated } from '../../utils/auth';
import { getUser } from '../../utils/cookie';
import { buildVideoDeckName, buildVideoSegmentNote, getAnkiSyncSummary, syncNotesToAnki } from '../../utils/ankiSync';
import { studyApi } from '../../features/youtubeLearningStudy/api/studyApi';

const { Text } = Typography;

// The backend serializes LocalDateTime in the server's local timezone WITHOUT an offset
// (e.g. "2026-05-30T13:50:40.327"). The server and our users share the same timezone, so
// `new Date(str)` (parsed as browser-local) lines up correctly — do NOT force UTC here.
const parseServerDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date) ? null : date;
};

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = parseServerDate(dateString);
  if (!date) return '';
  const now = new Date();
  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Guard against minor clock skew that could make a brand-new item look like it's in the future.
  if (diffInSeconds < 0) {
    return 'Vừa xong';
  }

  // Nếu là cùng ngày hôm nay
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    if (diffInHours > 0) {
      return `${diffInHours} giờ trước`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  }

  // Ngày hôm qua hoặc 1 ngày trước
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday || diffInDays === 1) {
    return '1 ngày trước';
  }

  // Từ 2 ngày trước đến dưới 30 ngày
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }

  // Dưới 365 ngày (tháng trước)
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInDays < 365) {
    return `${diffInMonths} tháng trước`;
  }

  // Trên 1 năm
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
};

const getDifficultyColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'A1': return '#10b981';
    case 'A2': return '#84cc16';
    case 'B1': return '#3b82f6';
    case 'B2': return '#8b5cf6';
    case 'C1': return '#f97316';
    case 'C2': return '#f43f5e';
    default: return 'var(--color-muted)';
  }
};

const formatDuration = (durationStr) => {
  if (!durationStr) return '';
  const seconds = parseInt(durationStr, 10);
  if (isNaN(seconds)) return durationStr;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const UserVideoCard = ({ video }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { t } = useTranslation();
  const [localIsFavorited, setLocalIsFavorited] = React.useState(video.isFavorited || false);
  const [syncing, setSyncing] = React.useState(false);

  const handleSyncToAnki = async (video) => {
    const videoIdVal = video.id || video.videoId;
    if (!isAuthenticated()) {
      message.warning(t('favorites.loginRequired') || 'Vui lòng đăng nhập để đồng bộ Anki.');
      return;
    }
    if (syncing) return;
    try {
      setSyncing(true);

      const studyRes = await studyApi.getStudyDetail(videoIdVal);
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
        message.error(result.errors[0]?.message || t('favorites.syncFail') || 'Đồng bộ thất bại.');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(t('favorites.ankiConnectError') || 'Không thể kết nối với Anki. Vui lòng mở ứng dụng Anki và bật AnkiConnect.');
      }
    } finally {
      setSyncing(false);
    }
  };

  // Sync state if the video prop changes from the parent
  React.useEffect(() => {
    setLocalIsFavorited(video.isFavorited || false);
  }, [video.isFavorited]);

  const handleClick = () => {
    navigate(`/videos/${video.id}/study`, {
      state: { from: location.pathname },
    });
  };

  return (
    <Card
      hoverable
      onClick={handleClick}
      styles={{ body: { padding: '0px' } }}
      className="video-card-solar"
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface, #fef2df)',
        border: 'none',
        boxShadow: '0px 12px 24px rgba(155, 69, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden', marginBottom: '13px' }}>
        <img
          alt={video.title}
          src={video.thumbnailUrl || 'https://via.placeholder.com/320x180'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Level Tag */}
        {video.difficultyLevel && video.difficultyLevel !== 'UNKNOWN' && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: getDifficultyColor(video.difficultyLevel),
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 2,
          }}>
            {video.difficultyLevel}
          </div>
        )}

        {/* Anki Sync Icon (Top Left) */}
        <div
          className="anki-sync-card-btn-trigger"
          style={{
            position: 'absolute',
            top: '8px',
            left: video.difficultyLevel && video.difficultyLevel !== 'UNKNOWN' ? '50px' : '8px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            width: isMobile ? '28px' : '33px',
            height: isMobile ? '28px' : '33px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '12px' : '14px',
            zIndex: 2,
            opacity: isMobile ? 1 : 0,
            transition: 'all 0.3s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSyncToAnki(video);
          }}
        >
          <SyncOutlined spin={syncing} />
        </div>

        {/* Favorite Icon (Top Right) */}
        <div
          className={`favorite-icon-trigger ${localIsFavorited ? 'always-visible' : ''}`}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            width: isMobile ? '28px' : '33px',
            height: isMobile ? '28px' : '33px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '14px' : '18px',
            zIndex: 2,
            opacity: (localIsFavorited || isMobile) ? 1 : 0,
            transition: 'all 0.3s ease',
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <FavoriteButton
            videoId={video.id}
            initialIsFavorite={localIsFavorited}
            onToggle={setLocalIsFavorited}
          />
        </div>

        {/* Duration Overlay */}
        {video.duration && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 2,
          }}>
            <ClockCircleOutlined /> {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Title */}
      <div
        className="video-card-title"
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--color-text, #201b10)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4',
          minHeight: '42px',
          marginBottom: '8px',
          fontFamily: 'Manrope, sans-serif',
          padding: '0 8px',
          transition: 'color 0.3s ease',
        }}
      >
        {video.title}
      </div>

      {/* User Info Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px 10px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <Avatar
            size={isMobile ? 20 : 22}
            src={video.userAvatarUrl || null}
            icon={!video.userAvatarUrl ? <UserOutlined /> : undefined}
            style={{
              flexShrink: 0,
              backgroundColor: !video.userAvatarUrl ? 'var(--color-surface-container-highest)' : undefined,
              color: !video.userAvatarUrl ? 'var(--color-muted)' : undefined,
            }}
          />
          <Text
            ellipsis
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-muted, #5F5F66)',
              lineHeight: 1.2,
              maxWidth: isMobile ? '90px' : '120px',
            }}
          >
            {video.userFullName || 'Anonymous'}
          </Text>
        </div>
        <Text type="secondary" style={{ fontSize: '11px', color: 'var(--color-muted, #5F5F66)', flexShrink: 0 }}>
          {getRelativeTime(video.createdAt)}
        </Text>
      </div>
    </Card>
  );
};

export default UserVideoCard;
