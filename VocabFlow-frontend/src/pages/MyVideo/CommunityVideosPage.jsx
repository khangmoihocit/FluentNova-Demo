import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Spin, Empty, Typography, Select } from 'antd';
import {
  SearchOutlined,
  TeamOutlined,
  LoadingOutlined,
  FireOutlined,
  SortAscendingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { myVideoApi } from '../../services/api/myVideo.api';
import UserVideoCard from './UserVideoCard';
import './CommunityVideosPage.scss';

const { Text } = Typography;
const { Option } = Select;

const DIFFICULTY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'createdAt,desc' },
  { label: 'Cũ nhất', value: 'createdAt,asc' }
];

const CommunityVideosPage = () => {
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeSort, setActiveSort] = useState('createdAt,desc');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNo, setPageNo] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const observer = useRef();

  const fetchVideos = useCallback(async (page, kw, lvl, srt, replace = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await myVideoApi.getAllVideoOwn({
        pageNo: page,
        pageSize,
        sort: srt,
        keyword: kw,
        level: lvl,
      });

      const pageData = res?.data;
      const newVideos = pageData?.data || [];
      const total = pageData?.totalElements || 0;

      setTotalElements(total);
      setVideos((prev) => (replace ? newVideos : [...prev, ...newVideos]));
      setHasMore(page < (pageData?.totalPages || 1));
    } catch (err) {
      console.error('Failed to load community videos:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Trigger fetch when filters, sort, or keyword changes
  useEffect(() => {
    setPageNo(1);
    fetchVideos(1, keyword, activeLevel, activeSort, true);
  }, [keyword, activeLevel, activeSort, fetchVideos]);

  // Infinite scroll sentinel
  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = pageNo + 1;
          setPageNo(nextPage);
          fetchVideos(nextPage, keyword, activeLevel, activeSort, false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, pageNo, keyword, activeLevel, activeSort, fetchVideos]
  );

  const handleSearchTrigger = (e) => {
    // Prevent IME enter confirmation from triggering search
    if (e && (e.isComposing || e.nativeEvent?.isComposing)) {
      return;
    }
    setKeyword(inputValue);
  };

  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Reset search immediately if cleared
    if (!value) {
      setKeyword('');
    }
  };

  return (
    <div className="community-videos-page">
      {/* ── Header ── */}
      <div className="community-header">
        <div className="community-header-top">
          <div className="community-title-row">
            <TeamOutlined className="community-icon" />
            <h1 className="community-title">{t('communityVideos.title')}</h1>
          </div>
          <Link to="/my-video" className="community-back-link">
            ← {t('communityVideos.backToMyVideo')}
          </Link>
        </div>
        <p className="community-subtitle">{t('communityVideos.subtitle')}</p>
      </div>

      {/* ── Search Bar ── */}
      <div className="community-search-bar">
        <Input
          id="community-search-input"
          placeholder={t('communityVideos.searchPlaceholder')}
          size="large"
          value={inputValue}
          onChange={handleKeywordChange}
          onPressEnter={handleSearchTrigger}
          suffix={
            <SearchOutlined
              style={{ color: 'var(--color-primary)', cursor: 'pointer', fontSize: '18px' }}
              onClick={handleSearchTrigger}
            />
          }
          allowClear
        />
      </div>

      {/* ── Filters Section ── */}
      <div className="filter-section">
        <div className="filter-row filter-row2">
          <div>
            <button
              className={`filter-pill ${activeLevel === null ? 'active' : ''}`}
              onClick={() => setActiveLevel(null)}
            >
              Tất cả Level
            </button>
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                className={`filter-pill ${activeLevel === level ? 'active' : ''}`}
                onClick={() => setActiveLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-surface-container-high)', margin: '0 8px' }}></div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Select
              className="solar-select"
              value={activeSort}
              onChange={(val) => setActiveSort(val)}
              style={{ width: 180 }}
              placeholder="Sắp xếp theo"
              dropdownStyle={{
                borderRadius: '16px',
                padding: '8px',
                boxShadow: '0px 24px 48px rgba(155, 69, 0, 0.08)',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
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

      {/* ── Results Header ── */}
      <div className="community-results-header">
        <h2 className="community-results-title">
          <FireOutlined style={{ color: 'var(--color-primary)', marginRight: 8 }} />
          {keyword ? t('communityVideos.searchResults') : t('communityVideos.allVideos')}
          <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>
            ({totalElements})
          </Text>
        </h2>
      </div>

      {/* ── Video Grid ── */}
      {loading && videos.length === 0 ? (
        <div className="community-loading">
          <Spin size="large" />
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className={`community-video-grid ${loading ? 'grid-loading' : ''}`}>
            {videos.map((video) => (
              <UserVideoCard key={video.id} video={video} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div
            ref={lastElementRef}
            style={{ height: '40px', margin: '20px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {(loadingMore || (loading && videos.length > 0)) && (
              <Spin
                indicator={
                  <LoadingOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} spin />
                }
              />
            )}
          </div>
        </>
      ) : (
        <Empty
          description={
            keyword
              ? t('communityVideos.noSearchResults')
              : t('communityVideos.noVideos')
          }
        />
      )}
    </div>
  );
};

export default CommunityVideosPage;
