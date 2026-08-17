import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Typography, Spin, Empty, message, Select } from 'antd';
import { FireOutlined, LoadingOutlined, SortAscendingOutlined, FilterOutlined } from '@ant-design/icons';
import { useSearchParams, useLocation } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import '../styles/YoutubeLearning.scss';
import { useTranslation } from 'react-i18next';
import {
    useCategoriesQuery,
    useDiscoveryVideosQuery,
} from '../../../hooks/queries/useCategoryQueries';
import {
    useChannelsQuery,
    useVideoLessonsInfiniteQuery,
} from '../../../hooks/queries/useVideoQueries';

const { Title, Text } = Typography;
const { Option } = Select;

const DIFFICULTY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SORT_OPTIONS = [
    { label: 'Mới nhất', value: 'createdAt,desc' },
    { label: 'Cũ nhất', value: 'createdAt,asc' },
    { label: 'Nhiều lượt xem nhất', value: 'views,desc' }
];

const YoutubeLearningPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const [activeChannelId, setActiveChannelId] = useState(() => {
        const saved = sessionStorage.getItem('ytLearning_activeChannelId');
        return saved ? JSON.parse(saved) : null;
    });
    const [activeCategoryId, setActiveCategoryId] = useState(() => {
        const saved = sessionStorage.getItem('ytLearning_activeCategoryId');
        return saved ? JSON.parse(saved) : null;
    });
    const [activeLevel, setActiveLevel] = useState(() => {
        const saved = sessionStorage.getItem('ytLearning_activeLevel');
        return saved ? JSON.parse(saved) : null;
    });
    const [activeSort, setActiveSort] = useState(() => {
        const saved = sessionStorage.getItem('ytLearning_activeSort');
        return saved ? JSON.parse(saved) : 'createdAt,desc';
    });

    const urlCategoryId = useMemo(() => {
        const value = searchParams.get('categoryId');
        return value ? parseInt(value, 10) : null;
    }, [searchParams]);

    const urlChannelId = useMemo(() => {
        const value = searchParams.get('channelId');
        return value ? parseInt(value, 10) : null;
    }, [searchParams]);

    const effectiveCategoryId = urlCategoryId ?? (urlChannelId ? null : activeCategoryId);
    const effectiveChannelId = urlChannelId ?? (urlCategoryId ? null : activeChannelId);
    const effectiveLevel = (urlCategoryId || urlChannelId) ? null : activeLevel;

    const isHomeView = effectiveCategoryId === null && effectiveLevel === null && effectiveChannelId === null;

    const videoFilters = useMemo(() => ({
        channelId: effectiveChannelId,
        categoryId: effectiveCategoryId,
        difficultyLevel: effectiveLevel,
        sort: activeSort,
    }), [effectiveChannelId, effectiveCategoryId, effectiveLevel, activeSort]);

    const channelsQuery = useChannelsQuery();
    const categoriesQuery = useCategoriesQuery();
    const discoveryQuery = useDiscoveryVideosQuery();
    const videosQuery = useVideoLessonsInfiniteQuery(videoFilters, { enabled: !isHomeView });

    useEffect(() => {
        if (channelsQuery.isError || categoriesQuery.isError || discoveryQuery.isError) {
            message.error(t('youtubeLearning.loadDataError', 'Không thể tải dữ liệu'));
        }
    }, [
        categoriesQuery.isError,
        channelsQuery.isError,
        discoveryQuery.isError,
        t,
    ]);

    useEffect(() => {
        if (videosQuery.isError) {
            console.error('Failed to load videos:', videosQuery.error);
            message.error(t('youtubeLearning.loadVideosError', 'Không thể tải danh sách Video'));
        }
    }, [t, videosQuery.error, videosQuery.isError]);

    const categories = categoriesQuery.data || [];
    const channels = channelsQuery.data || [];
    const homeCategories = discoveryQuery.data || [];
    const videoPages = videosQuery.data?.pages || [];
    const videos = videoPages.flatMap((page) => page?.data || []);
    const totalElements = videoPages[0]?.totalElements || 0;

    const loadingHome = !discoveryQuery.data && discoveryQuery.isLoading;
    const loadingVideos = !videosQuery.data && videosQuery.isLoading;
    const isRefreshingVideos = videosQuery.isFetching && !videosQuery.isFetchingNextPage && videos.length > 0;

    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loadingVideos || videosQuery.isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && videosQuery.hasNextPage) {
                videosQuery.fetchNextPage();
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingVideos, videosQuery]);

    const handleFilterChange = (key, currentValue, setter) => (value) => {
        if (currentValue === value) return;
        if (location.search) {
            setSearchParams({});
        }
        setter(value);
        sessionStorage.setItem(`ytLearning_${key}`, JSON.stringify(value));
    };

    return (
        <div className="youtube-learning-page">
            <div className="filter-section">
                <div className="filter-row">
                    <button
                        className={`filter-pill ${effectiveCategoryId === null ? 'active' : ''}`}
                        onClick={() => handleFilterChange('activeCategoryId', effectiveCategoryId, setActiveCategoryId)(null)}
                    >
                        Tất cả Danh mục
                    </button>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`filter-pill ${effectiveCategoryId === category.id ? 'active' : ''}`}
                            onClick={() => handleFilterChange('activeCategoryId', effectiveCategoryId, setActiveCategoryId)(category.id)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                <div className="filter-row filter-row2">
                   <div>
                     <button
                        className={`filter-pill ${effectiveLevel === null ? 'active' : ''}`}
                        onClick={() => handleFilterChange('activeLevel', effectiveLevel, setActiveLevel)(null)}
                    >
                        Tất cả Level
                    </button>
                    {DIFFICULTY_LEVELS.map(level => (
                        <button
                            key={level}
                            className={`filter-pill ${effectiveLevel === level ? 'active' : ''}`}
                            onClick={() => handleFilterChange('activeLevel', effectiveLevel, setActiveLevel)(level)}
                        >
                            {level}
                        </button>
                    ))}
                   </div>
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-surface-container-high)', margin: '0 8px' }}></div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                    <Select
                        className="solar-select"
                        value={effectiveChannelId}
                        onChange={handleFilterChange('activeChannelId', effectiveChannelId, setActiveChannelId)}
                        style={{ width: 240 }}
                        placeholder="Chọn kênh"
                        loading={channelsQuery.isLoading && !channelsQuery.data}
                        dropdownStyle={{ borderRadius: '16px', padding: '8px', boxShadow: '0px 24px 48px rgba(155, 69, 0, 0.08)' }}
                    >
                        <Option value={null}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FilterOutlined style={{ color: 'var(--color-primary)' }} />
                                <span>Tất cả các Kênh</span>
                            </div>
                        </Option>
                        {channels.map(ch => (
                            <Option key={ch.id} value={ch.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={ch.avatarUrl} alt={ch.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                    <span>{ch.name}</span>
                                </div>
                            </Option>
                        ))}
                    </Select>

                    <Select
                        className="solar-select"
                        value={activeSort}
                        onChange={handleFilterChange('activeSort', activeSort, setActiveSort)}
                        style={{ width: 180 }}
                        placeholder="Sắp xếp theo"
                        dropdownStyle={{ borderRadius: '16px', padding: '8px', boxShadow: '0px 24px 48px rgba(155, 69, 0, 0.08)' }}
                    >
                        {SORT_OPTIONS.map(opt => (
                            <Option key={opt.value} value={opt.value}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <SortAscendingOutlined style={{ color: 'var(--color-primary)' }} />
                                    <span>{opt.label}</span>
                                </div>
                            </Option>
                        ))}
                    </Select>
                    </div>
                </div>
            </div>

            {isHomeView ? (
                loadingHome ? (
                    <div className="loading-container">
                        <Spin size="large" />
                    </div>
                ) : homeCategories.length > 0 ? (
                    <div className="home-categories-list">
                        {homeCategories.map(cat => (
                            <div key={cat.categoryId} style={{ marginBottom: '32px' }}>
                                <div className="section-header">
                                    <h2 className="section-title">
                                        {cat.categoryName}
                                    </h2>
                                    <button
                                        className="section-action"
                                        onClick={() => handleFilterChange('activeCategoryId', effectiveCategoryId, setActiveCategoryId)(cat.categoryId)}
                                    >
                                        Xem tất cả
                                    </button>
                                </div>
                                {cat.videoLessonFilterResponses && cat.videoLessonFilterResponses.length > 0 ? (
                                    <div className="video-grid">
                                        {cat.videoLessonFilterResponses.map(video => (
                                            <VideoCard key={video.id} video={video} />
                                        ))}
                                    </div>
                                ) : (
                                    <Empty description={`Không có video nào trong danh mục ${cat.categoryName}`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty description="Không có dữ liệu trang chủ" />
                )
            ) : (
                <>
                    <Title level={3} className="section-title">
                        <FireOutlined style={{ color: 'var(--color-primary)', marginRight: 8 }} />
                        Kết quả tìm kiếm <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>({totalElements})</Text>
                        {isRefreshingVideos && (
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 18, marginLeft: 12, color: 'var(--color-primary)' }} spin />} />
                        )}
                    </Title>

                    {loadingVideos ? (
                        <div className="loading-container">
                            <Spin size="large" />
                        </div>
                    ) : videos.length > 0 ? (
                        <>
                            <div className="video-grid">
                                {videos.map(video => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>

                            <div ref={lastElementRef} style={{ height: '20px', margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
                                {videosQuery.isFetchingNextPage && (
                                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} spin />} />
                                )}
                            </div>
                        </>
                    ) : (
                        <Empty description="Không tìm thấy Video nào phù hợp" />
                    )}
                </>
            )}
        </div>
    );
};

export default YoutubeLearningPage;
