import React from 'react';
import { Card, Typography, Space, Grid, message } from 'antd';
import { ClockCircleOutlined, FireOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FavoriteButton from '../../../components/common/Button/FavoriteButton';
import { isAuthenticated } from '../../../utils/auth';
import { getUser } from '../../../utils/cookie';
import { buildVideoDeckName, buildVideoSegmentNote, getAnkiSyncSummary, syncNotesToAnki } from '../../../utils/ankiSync';
import { studyApi } from '../../../features/youtubeLearningStudy/api/studyApi';

const { Text } = Typography;

// Helper to calculate relative time
const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    // Backend serializes LocalDateTime in the server's local timezone (no offset), and the
    // server shares the same timezone as our users, so parse as browser-local directly.
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays <= 0) return 'Hôm nay';
    if (diffInDays < 30) return `${diffInDays} ngày trước`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} tháng trước`;
    return `${Math.floor(diffInDays / 365)} năm trước`;
};

// Map difficulty string to a nice color badge based on Solar Theme
const getDifficultyColor = (level) => {
    switch (level?.toUpperCase()) {
        case 'A1': return '#10b981'; // Green
        case 'A2': return '#84cc16'; // Lime
        case 'B1': return '#3b82f6'; // Blue
        case 'B2': return '#8b5cf6'; // Violet
        case 'C1': return '#f97316'; // Orange
        case 'C2': return '#f43f5e'; // Rose
        default: return 'var(--color-primary)';
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

const VideoCard = ({ video }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md; // true when < 768px
    const { t } = useTranslation();
    const isFavorited = video.isFavorited || false;
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

    const handleClick = () => {
        navigate(`/videos/${video.id}/study`, {
            state: { from: location.pathname }
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
                // backgroundColor: 'var(--color-surface-container-low, #fef2df)',
                backgroundColor: 'var(--color-surface, #fef2df)',
                border: 'none',
                boxShadow: '0px 12px 24px rgba(155, 69, 0, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
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
                        objectFit: 'cover'
                    }}
                />
                
                {/* Level Tag (Top Left) */}
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
                    zIndex: 2
                }}>
                    {video.difficultyLevel || 'A1'}
                </div>

                {/* Anki Sync Icon (Top Left) */}
                <div
                    className="anki-sync-card-btn-trigger"
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50px',
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
                        transition: 'all 0.3s ease'
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
                    className={`favorite-icon-trigger ${isFavorited ? 'always-visible' : ''}`} 
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
                        opacity: (isFavorited || isMobile) ? 1 : 0,
                        transition: 'all 0.3s ease'
                    }}
                    onClick={(e) => {
                        e.stopPropagation(); // Ngăn chặn sự kiện click vào thẻ Card
                    }}
                >
                    <FavoriteButton 
                        videoId={video.id} 
                        initialIsFavorite={isFavorited} 
                    />
                </div>

                {/* Duration Overlay (Bottom Right) */}
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
                        zIndex: 2
                    }}>
                        <ClockCircleOutlined /> {formatDuration(video.duration)}
                    </div>
                )}
            </div>
            
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
                    transition: 'color 0.3s ease'
                }}
            >
                {video.title}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px 8px 10px' }}>
                {video.userProgressResponse && video.userProgressResponse.status !== 'NOT_STARTED' ? (
                    video.userProgressResponse.status === 'IN_PROGRESS' ? (
                        <Text style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
                            <ClockCircleOutlined style={{ marginRight: '4px' }} /> Đang học
                        </Text>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={{ fontSize: '10px', color: 'var(--color-muted, #5F5F66)' }}>Dictation</Text>
                                <Text style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, lineHeight: 1 }}>
                                    {video.userProgressResponse.avgDictationScore || 0}/100
                                </Text>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text style={{ fontSize: '10px', color: 'var(--color-muted, #5F5F66)' }}>Shadowing</Text>
                                <Text style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, lineHeight: 1 }}>
                                    {video.userProgressResponse.avgShadowingScore || 0}/100
                                </Text>
                            </div>
                        </div>
                    )
                ) : (
                    <Text style={{ fontSize: '12px', color: 'var(--color-primary, #9b4500)', fontWeight: 600 }}>
                        <FireOutlined /> Explore
                    </Text>
                )}
                <Space size={4}>
                    <Text type="secondary" style={{ fontSize: '11px', color: 'var(--color-muted, #5F5F66)' }}>
                        {getRelativeTime(video.createdAt)}
                    </Text>
                </Space>
            </div>
        </Card>
    );
};

export default VideoCard;
