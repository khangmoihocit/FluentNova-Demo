import { useState, useEffect, useRef } from 'react';
import {
  Input,
  Button,
  Steps,
  Alert,
  Upload,
  Typography,
  message,
  Spin,
  Table,
  Switch,
  Popconfirm,
  Select,
  Space,
  Tooltip,
  DatePicker,
  Grid,
  List,
  Card,
  Checkbox,
  Progress,
  Tag,
  Popover,
  Segmented,
  Skeleton,
} from 'antd';
import {
  VideoCameraFilled,
  CloudUploadOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  LinkOutlined,
  FileTextOutlined,
  SmileOutlined,
  LoadingOutlined,
  TeamOutlined,
  DeleteOutlined,
  SettingOutlined,
  SyncOutlined,
  RobotOutlined,
  RedoOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { myVideoApi } from '../../services/api/myVideo.api';
import { myVideoSegmentApi } from '../../features/myVideo/api/myVideoSegment.api';
import { getAccessToken, getUser } from '../../utils/cookie';
import { isAuthenticated } from '../../utils/auth';
import { buildVideoDeckName, buildVideoSegmentNote, getAnkiSyncSummary, syncNotesToAnki } from '../../utils/ankiSync';
import { studyApi } from '../../features/youtubeLearningStudy/api/studyApi';
import './MyVideoPage.scss';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

const STEP_IDLE = -1;
const STEP_FETCHING_INFO = 0;
const STEP_IMPORTING = 1;
const STEP_DONE = 2;

const MyVideoPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(STEP_IDLE);
  const [videoInfo, setVideoInfo] = useState(null);
  const [dbVideoId, setDbVideoId] = useState(null);
  const [hasManualSubs, setHasManualSubs] = useState(null);
  const [importDone, setImportDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcribeQuotaMessage, setTranscribeQuotaMessage] = useState('');

  // ── Groq BYOK states ──
  const [groqKey, setGroqKey] = useState('');
  const [savedGroqKeyInfo, setSavedGroqKeyInfo] = useState(null);
  const [fetchingGroqKey, setFetchingGroqKey] = useState(false);
  const [savingGroqKey, setSavingGroqKey] = useState(false);
  const [transcribeModel, setTranscribeModel] = useState('whisper-large-v3');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [importType, setImportType] = useState('transcribe'); // 'transcribe' | 'upload'




  // My Videos Table States & Filters
  const [myVideos, setMyVideos] = useState([]);
  const [myVideosLoading, setMyVideosLoading] = useState(false);
  const [myVideosPage, setMyVideosPage] = useState(1);
  const [myVideosTotal, setMyVideosTotal] = useState(0);
  const [hasAnyVideos, setHasAnyVideos] = useState(false);

  const [filterPublished, setFilterPublished] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [sortOrder, setSortOrder] = useState('createdAt,desc');
  const [syncingId, setSyncingId] = useState(null);

  // ── First-time user guide states & effects ──
  const [highlightVideoId, setHighlightVideoId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const managementRef = useRef(null);

  const handleDismissFirstTimeGuide = () => {
    setShowGuide(false);
    setHighlightVideoId(null);
    setDbVideoId(null);
    try {
      localStorage.setItem('vocabflow_first_video_guide_done', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (dbVideoId && myVideos.length > 0) {
      const hasNewVideo = myVideos.some((v) => v.id === dbVideoId);
      const isFirstTime = !localStorage.getItem('vocabflow_first_video_guide_done');

      if (hasNewVideo && isFirstTime && !showGuide) {
        setHighlightVideoId(dbVideoId);
        setShowGuide(true);

        setTimeout(() => {
          if (managementRef.current) {
            managementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }
    }
  }, [dbVideoId, myVideos, showGuide]);

  const handleSyncToAnki = async (video) => {
    const videoIdVal = video.id || video.videoId;
    if (!isAuthenticated()) {
      message.warning(t('favorites.loginRequired') || 'Vui lòng đăng nhập để đồng bộ Anki.');
      return;
    }
    if (syncingId) return;
    try {
      setSyncingId(videoIdVal);

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
      setSyncingId(null);
    }
  };

  const fetchMyVideos = async (page = 1, currentFilters = {}) => {
    const token = getAccessToken();
    if (!token) {
      setMyVideos([]);
      setMyVideosTotal(0);
      setMyVideosLoading(false);
      setHasAnyVideos(false);
      return;
    }

    setMyVideosLoading(true);

    const publishedVal = currentFilters.hasOwnProperty('isPublished')
      ? currentFilters.isPublished
      : filterPublished;
    const dateRangeVal = currentFilters.hasOwnProperty('dateRange')
      ? currentFilters.dateRange
      : filterDateRange;
    const sortVal = currentFilters.hasOwnProperty('sort')
      ? currentFilters.sort
      : sortOrder;

    const params = {
      pageNo: page,
      pageSize: 10,
      sort: sortVal,
    };

    if (publishedVal === 'true') {
      params.isPublished = true;
    } else if (publishedVal === 'false') {
      params.isPublished = false;
    }

    if (dateRangeVal && dateRangeVal.length === 2) {
      params.fromDate = dateRangeVal[0].format('YYYY-MM-DD');
      params.toDate = dateRangeVal[1].format('YYYY-MM-DD');
    }

    try {
      const res = await myVideoApi.getMyVideos(params);
      const videoList = res?.data?.data || [];
      const totalCount = res?.data?.totalElements || 0;

      setMyVideos(videoList);
      setMyVideosTotal(totalCount);
      setMyVideosPage(page);

      const isFiltering = (publishedVal !== 'all' || (dateRangeVal && dateRangeVal.length === 2));
      if (!isFiltering) {
        setHasAnyVideos(totalCount > 0);
      } else {
        if (totalCount > 0) {
          setHasAnyVideos(true);
        }
      }
    } catch (err) {
      message.error(err?.message || 'Không thể lấy danh sách video của tôi');
    } finally {
      setMyVideosLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVideos(1);
  }, []);

  const handleFilterPublishedChange = (val) => {
    setFilterPublished(val);
    fetchMyVideos(1, { isPublished: val });
  };

  const handleDateRangeChange = (dates) => {
    setFilterDateRange(dates);
    fetchMyVideos(1, { dateRange: dates });
  };

  const handleSortOrderChange = (val) => {
    setSortOrder(val);
    fetchMyVideos(1, { sort: val });
  };

  const handleClearFilters = () => {
    setFilterPublished('all');
    setFilterDateRange(null);
    setSortOrder('createdAt,desc');
    fetchMyVideos(1, { isPublished: 'all', dateRange: null, sort: 'createdAt,desc' });
  };

  const handleUpdateLevel = async (videoId, level) => {
    try {
      await myVideoApi.updateMyVideo(videoId, { difficultyLevel: level });
      message.success('Cập nhật cấp độ video thành công');
      setMyVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, difficultyLevel: level } : v))
      );
    } catch (err) {
      message.error(err?.message || 'Cập nhật cấp độ thất bại');
    }
  };

  const handleTogglePublish = async (videoId, publishState) => {
    try {
      await myVideoApi.updateMyVideo(videoId, { isPublished: publishState });
      message.success(publishState ? 'Đã chia sẻ video vào cộng đồng' : 'Đã thu hồi video khỏi cộng đồng');
      setMyVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, isPublished: publishState } : v))
      );
    } catch (err) {
      message.error(err?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleDelete = async (videoId) => {
    try {
      await myVideoApi.deleteMyVideo(videoId);
      message.success('Xóa video thành công');
      fetchMyVideos(myVideosPage);
    } catch (err) {
      message.error(err?.message || 'Xóa video thất bại');
    }
  };

  const fetchGroqKey = async () => {
    if (!isAuthenticated()) return;
    setFetchingGroqKey(true);
    try {
      const res = await myVideoApi.getGroqKey();
      setSavedGroqKeyInfo(res?.data || null);
    } catch (err) {
      console.error('Error fetching Groq key:', err);
    } finally {
      setFetchingGroqKey(false);
    }
  };

  useEffect(() => {
    fetchGroqKey();
  }, []);

  const handleSaveGroqKey = async () => {
    if (!groqKey.trim()) {
      message.error('Vui lòng nhập API Key Groq!');
      return;
    }
    setSavingGroqKey(true);
    try {
      await myVideoApi.saveGroqKey(groqKey.trim());
      message.success('Đã lưu và mã hoá API Key Groq thành công!');
      setGroqKey('');
      await fetchGroqKey();
    } catch (err) {
      message.error(err?.message || 'Không thể lưu API Key.');
    } finally {
      setSavingGroqKey(false);
    }
  };

  const handleDeleteGroqKey = async () => {
    try {
      await myVideoApi.deleteGroqKey();
      message.success('Đã xoá API Key Groq khỏi hệ thống!');
      setSavedGroqKeyInfo(null);
    } catch (err) {
      message.error(err?.message || 'Không thể xoá API Key.');
    }
  };

  const handleTranscribeVideo = async () => {
    if (!videoInfo) return;
    
    // Check maximum duration: 25 minutes (1500 seconds)
    if (videoInfo.duration > 1500) {
      message.error(`Video quá dài (${Math.floor(videoInfo.duration / 60)} phút). Giới hạn tối đa là 25 phút!`);
      return;
    }

    setIsTranscribing(true);
    setCurrentStep(STEP_IMPORTING);
    try {
      const res = await myVideoApi.transcribeYoutubeVideo(url.trim(), transcribeModel);
      const createdVideo = res.data;
      const createdVideoId = createdVideo?.id;
      setDbVideoId(createdVideoId);
      


      const successMsg = res.message || res.data?.remainingQuotaMessage || 'Tự động phiên âm và tạo bài học thành công!';
      setTranscribeQuotaMessage(successMsg);
      
      setImportDone(true);
      setCurrentStep(STEP_DONE);
      
      message.success(successMsg);
      fetchMyVideos(1);
    } catch (err) {
      const errMsg = err?.message || 'Phiên âm video thất bại. Vui lòng kiểm tra lại URL hoặc thử lại sau!';
      message.error(errMsg);
      setCurrentStep(STEP_IDLE);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleNativeSubtitleImport = async () => {
    if (!videoInfo) return;
    
    // Check maximum duration: 25 minutes (1500 seconds)
    if (videoInfo.duration > 1500) {
      message.error(`Video quá dài (${Math.floor(videoInfo.duration / 60)} phút). Giới hạn tối đa là 25 phút!`);
      return;
    }

    setIsTranscribing(true);
    setCurrentStep(STEP_IMPORTING);
    try {
      // 1. Fetch subtitles with translation & IPA from Python
      const parsed = await myVideoApi.fetchManualSubtitles(videoInfo.youtubeVideoId);
      
      if (!parsed || parsed.length === 0) {
        message.warning('Không tìm thấy phụ đề tiếng Anh có sẵn cho video này.');
        setCurrentStep(STEP_IDLE);
        return;
      }

      const segments = parsed.map((seg, index) => ({
        id: index + 1,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        wordTimings: seg.words?.map((w) => ({
          start: w.start,
          end: w.end,
          text: w.text,
        })),
      }));

      // 2. Create the video lesson and import its segments
      const createRes = await myVideoApi.createMyVideo({
        youtubeVideoId: videoInfo.youtubeVideoId,
        title: videoInfo.title,
        thumbnailUrl: videoInfo.thumbnailUrl,
        duration: String(videoInfo.duration),
        toolRequests: segments
      });
      
      const createdVideo = createRes.data;
      const createdVideoId = createdVideo?.id;
      setDbVideoId(createdVideoId);

      const successMsg = createRes.message || 'Tải phụ đề từ YouTube và tạo bài học thành công!';
      setTranscribeQuotaMessage(successMsg);
      
      setImportDone(true);
      setCurrentStep(STEP_DONE);
      
      message.success(successMsg);
      fetchMyVideos(1);
    } catch (err) {
      const errMsg = err?.message || 'Tải phụ đề và tạo bài học thất bại. Vui lòng thử lại sau!';
      message.error(errMsg);
      setCurrentStep(STEP_IDLE);
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetState = () => {
    setVideoInfo(null);
    setDbVideoId(null);
    setHasManualSubs(null);
    setImportDone(false);
    setCurrentStep(STEP_IDLE);
    setIsTranscribing(false);
    setTranscribeQuotaMessage('');
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ── Main flow when user submits a YouTube link ──
  const handleSearch = async (value) => {
    const token = getAccessToken();
    if (!token) {
      message.warning('Bạn cần đăng nhập để tạo video cá nhân!');
      navigate('/login');
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) return;

    resetState();
    setLoading(true);

    try {
      // Step 1: Fetch video info from Python
      setCurrentStep(STEP_FETCHING_INFO);
      const info = await myVideoApi.fetchYoutubeInfo(trimmed);
      setVideoInfo(info);

      // Immediately show upload card, but do NOT save to database yet!
      setHasManualSubs(false);
      setCurrentStep(STEP_IDLE);
    } catch (err) {
      message.error(err?.message || t('myVideo.fetchError'));
      setCurrentStep(STEP_IDLE);
    } finally {
      setLoading(false);
    }
  };



  // ── Handle subtitle file upload (.json or .srt) ──
  const handleSubtitleUpload = async (file) => {
    const token = getAccessToken();
    if (!token) {
      message.warning('Bạn cần đăng nhập để tạo video cá nhân!');
      navigate('/login');
      return false;
    }

    const filenameLower = file.name.toLowerCase();
    if (!filenameLower.endsWith('.json') && !filenameLower.endsWith('.srt')) {
      message.error(t('myVideo.onlyJsonOrSrt'));
      return false;
    }

    setUploading(true);
    setCurrentStep(STEP_IMPORTING);
    try {
      // Step 1: Parse the subtitle file on the Python backend
      const parsed = await myVideoApi.parseCapcutFile(file);

      if (!parsed || parsed.length === 0) {
        message.warning(t('myVideo.emptyCapcut'));
        setCurrentStep(STEP_IDLE);
        return false;
      }

      const segments = parsed.map((seg, index) => ({
        id: index + 1,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        wordTimings: seg.words?.map((w) => ({
          start: w.start,
          end: w.end,
          text: w.text,
        })),
      }));

      // Step 2: Create the video lesson and import its segments inside a single transactional request on the Java backend
      const createRes = await myVideoApi.createMyVideo({
        youtubeVideoId: videoInfo.youtubeVideoId,
        title: videoInfo.title,
        thumbnailUrl: videoInfo.thumbnailUrl,
        duration: String(videoInfo.duration),
        toolRequests: segments
      });
      
      const createdVideoId = createRes.data?.id;
      setDbVideoId(createdVideoId);



      setImportDone(true);
      setCurrentStep(STEP_DONE);
      message.success(t('myVideo.importSuccess'));
      fetchMyVideos(1);
    } catch (err) {
      message.error(err?.message || t('myVideo.capCutError'));
      setCurrentStep(STEP_IDLE);
    } finally {
      setUploading(false);
    }

    return false; // prevent antd auto upload
  };

  // ── Steps config ──
  const stepsItems = [
    { title: t('myVideo.stepFetchInfo'), icon: currentStep === STEP_FETCHING_INFO ? <LoadingOutlined /> : <LinkOutlined /> },
    { title: t('myVideo.stepImport'), icon: currentStep === STEP_IMPORTING ? <LoadingOutlined /> : <CloudUploadOutlined /> },
    { title: t('myVideo.stepDone'), icon: <SmileOutlined /> },
  ];

  const columns = [
    {
      title: 'Video',
      key: 'video',
      render: (_, record) => (
        <div className="table-video-cell">
          <img src={record.thumbnailUrl} alt={record.title} className="table-video-thumb" />
          <div className="table-video-info">
            <Link to={`/videos/${record.id}/study`} state={{ from: '/my-video' }} className="table-video-title">
              {record.title}
            </Link>
          </div>
        </div>
      ),
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration) => {
        const secs = parseInt(duration, 10);
        return isNaN(secs) ? duration : formatDuration(secs);
      },
    },
    {
      title: 'Cấp độ',
      key: 'difficultyLevel',
      width: 140,
      render: (_, record) => (
        <Select
          className="table-level-select"
          value={record.difficultyLevel || 'UNKNOWN'}
          onChange={(val) => handleUpdateLevel(record.id, val)}
          style={{ width: 120 }}
          dropdownStyle={{ borderRadius: '12px' }}
        >
          <Select.Option value="UNKNOWN">UNKNOWN</Select.Option>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
            <Select.Option key={lvl} value={lvl}>
              {lvl}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Chia sẻ cộng đồng',
      key: 'isPublished',
      width: 150,
      render: (_, record) => (
        <Switch
          checked={record.isPublished}
          onChange={(checked) => handleTogglePublish(record.id, checked)}
        />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => {
        const isHighlighted = record.id === highlightVideoId && showGuide;
        const settingsBtn = (
          <Button
            type="text"
            icon={<SettingOutlined className={isHighlighted ? 'pulse-highlight-icon' : ''} style={{ color: '#4f46e5' }} />}
            onClick={() => {
              if (isHighlighted) {
                handleDismissFirstTimeGuide();
              }
              navigate(`/my-video/${record.id}/segments`);
            }}
            style={{ padding: 4 }}
            className={isHighlighted ? 'pulse-highlight-btn' : ''}
          />
        );

        return (
          <Space size="middle">
            <Tooltip title="Đồng bộ sang Anki">
              <Button
                type="text"
                icon={<SyncOutlined spin={syncingId === record.id} style={{ color: '#0ea5e9' }} />}
                onClick={() => handleSyncToAnki(record)}
                style={{ padding: 4 }}
                disabled={syncingId !== null && syncingId !== record.id}
              />
            </Tooltip>
            {isHighlighted ? (
              <Popover
                title={<span style={{ fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 6 }}><SettingOutlined /> Quản lý phụ đề & bài tập</span>}
                content={
                  <div style={{ maxWidth: 260 }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: 13, lineHeight: 1.5, color: '#475569' }}>
                      Tuyệt vời! Video của bạn đã được tạo thành công. Bạn có thể bấm vào nút <b>Cài đặt (⚙️)</b> này bất cứ lúc nào để sửa phụ đề, dịch tự động hoặc thiết lập bài tập AI!
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        type="primary" 
                        size="small" 
                        style={{ borderRadius: 6, fontWeight: 600, background: '#4f46e5', border: 'none' }}
                        onClick={handleDismissFirstTimeGuide}
                      >
                        Đã hiểu
                      </Button>
                    </div>
                  </div>
                }
                open={true}
                placement="topRight"
              >
                {settingsBtn}
              </Popover>
            ) : (
              <Tooltip title="Quản lý phân đoạn & bài tập">
                {settingsBtn}
              </Tooltip>
            )}
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa video này?"
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="table-delete-btn"
                style={{ padding: 4 }}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="my-video-page">
      {/* ── Hero ── */}
      <div className="my-video-hero">
        <div className="hero-icon"><VideoCameraFilled /></div>
        <div className="hero-title">{t('myVideo.title')}</div>
        <div className="hero-subtitle">{t('myVideo.subtitle')}</div>
      </div>

      {/* ── Search ── */}
      <div className="my-video-search-box">
        <Input
          id="my-video-url-input"
          placeholder={t('myVideo.inputPlaceholder')}
          size="large"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={() => handleSearch(url)}
          suffix={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? (
                <LoadingOutlined style={{ color: 'var(--color-primary)' }} />
              ) : (
                <LinkOutlined
                  style={{ color: 'var(--color-primary)', cursor: 'pointer', fontSize: '18px' }}
                  onClick={() => handleSearch(url)}
                />
              )}
            </div>
          }
          disabled={loading || uploading}
          allowClear
        />
      </div>

      {/* ── Community Link ── */}
      <div className="my-video-community-link">
        <Link to="/my-video/community">
          <TeamOutlined style={{ marginRight: 6 }} />
          {t('myVideo.communityLink')}
        </Link>
      </div>

      {/* ── Progress Steps ── */}
      {currentStep >= 0 && (
        <div className="my-video-status">
          <div className="status-steps">
            <Steps
              current={currentStep}
              items={stepsItems}
              size="small"
            />
          </div>
        </div>
      )}

      {/* ── Video Preview Card ── */}
      {videoInfo && (
        <div className="my-video-result-card">
          <div className="video-preview">
            <div className="video-thumbnail">
              <img src={videoInfo.thumbnailUrl} alt={videoInfo.title} />
            </div>
            <div className="video-info">
              <div className="video-title">{videoInfo.title}</div>
              <div className="video-meta">
                <span className="meta-tag">
                  <ClockCircleOutlined />
                  {formatDuration(videoInfo.duration)}
                </span>
                <span className="meta-tag">
                  <LinkOutlined />
                  {videoInfo.youtubeVideoId}
                </span>
                {videoInfo.hasSubtitles ? (
                  <span className="subtitle-badge has-subs">
                    <CheckCircleFilled /> Phụ đề: Sẵn có (YouTube)
                  </span>
                ) : (
                  <span className="subtitle-badge no-subs">
                    <RobotOutlined /> Phụ đề: Cần AI Whisper
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Success ── */}
      {importDone && (
        <div className="import-success">
          {transcribeQuotaMessage && (
            <div className="transcribe-quota-alert" style={{ marginBottom: 20, width: '100%', maxWidth: 500 }}>
              <Alert
                message={transcribeQuotaMessage}
                type="info"
                showIcon
                style={{ borderRadius: 12, textAlign: 'left' }}
              />
            </div>
          )}
          <CheckCircleFilled className="success-icon" />
          <div className="success-title">{t('myVideo.successTitle')}</div>
          <div className="success-desc">{t('myVideo.successDesc')}</div>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate(`/videos/${dbVideoId}/study`, { state: { from: '/my-video' } })}
          >
            {t('myVideo.goStudy')}
          </Button>
        </div>
      )}

      {/* ── No Subtitle Fallback ── */}
      {hasManualSubs === false && !importDone && (
        <div className="no-subtitle-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Import Mode Switcher */}
          <div className="import-mode-toggle" style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <Segmented
              value={importType}
              onChange={(val) => setImportType(val)}
              options={[
                { 
                  label: videoInfo?.hasSubtitles ? 'Nhập phụ đề có sẵn' : 'Phiên âm tự động bằng Whisper', 
                  value: 'transcribe', 
                  icon: videoInfo?.hasSubtitles ? <CheckCircleFilled /> : <RobotOutlined /> 
                },
                { label: 'Nhập phụ đề thủ công (.srt, draft_content.json)', value: 'upload', icon: <CloudUploadOutlined /> },
              ]}
              size="large"
              style={{
                borderRadius: 12,
                padding: 4,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-container-low)',
              }}
            />
          </div>

          {importType === 'transcribe' ? (
            <div className="ai-transcribe-area" style={{ width: '100%' }}>
              <Spin 
                spinning={isTranscribing} 
                tip={videoInfo?.hasSubtitles ? "Đang xử lý và tạo bài học từ phụ đề có sẵn..." : "Đang tải và phiên âm video bằng AI... Vui lòng đợi trong giây lát!"}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Limit checking / Status Alert */}
                  {videoInfo && videoInfo.duration > 1500 && (
                     <Alert
                      message="Video quá dài!"
                      description={`Thời lượng video là ${Math.floor(videoInfo.duration / 60)} phút. Phiên âm tự động qua Whisper chỉ hỗ trợ video dài tối đa 25 phút. \nHãy chuyển qua tạo phụ đề thủ công`}
                      type="warning"
                      showIcon
                      style={{ borderRadius: 12 }}
                    />
                  )}

                  {videoInfo && videoInfo.duration <= 1500 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                        {/* Action section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 500 }}>
                          {videoInfo && videoInfo.hasSubtitles ? (
                            <Alert
                              message="Tuyệt vời! Video này có sẵn phụ đề tiếng Anh từ YouTube"
                              description="Hệ thống sẽ tự động nhập phụ đề này để tạo bài học nhanh chóng (Miễn phí & Không tốn quota AI)."
                              type="success"
                              showIcon
                              style={{ borderRadius: 12 }}
                            />
                          ) : (
                            <Alert
                              message="Thông báo: Video này không có sẵn phụ đề tiếng Anh từ YouTube"
                              description="Hệ thống sẽ tự động dùng AI (Whisper) để nghe và chép chính tả (Có thể mất 15 giây)."
                              type="warning"
                              showIcon
                              style={{ borderRadius: 12 }}
                            />
                          )}
                          <Button
                            type="primary"
                            icon={videoInfo && videoInfo.hasSubtitles ? <CheckCircleFilled /> : <RobotOutlined />}
                            onClick={videoInfo && videoInfo.hasSubtitles ? handleNativeSubtitleImport : handleTranscribeVideo}
                            size="large"
                            loading={isTranscribing}
                            block
                            className={videoInfo && videoInfo.hasSubtitles ? "transcribe-btn-native" : "transcribe-btn-ai"}
                          >
                            {isTranscribing 
                              ? (videoInfo && videoInfo.hasSubtitles ? 'Đang nhập phụ đề...' : 'Đang phiên âm...') 
                              : (videoInfo && videoInfo.hasSubtitles ? 'Nhập phụ đề có sẵn từ YouTube (Khuyên dùng)' : 'Bắt đầu phiên âm tự động bằng Whisper')
                            }
                          </Button>

                        </div>
                      </div>
                  )}
                </div>
              </Spin>
            </div>
          ) : (
            <>
              <div className="guide-card">
                <div className="guide-title">
                  <FileTextOutlined />
                  {t('myVideo.guideTitle')}
                </div>
                <ul className="guide-steps" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                  <li style={{ padding: '8px 0' }}>
                    {t('myVideo.guideStep1')}{' '}
                    <Link to="/guide?section=downsub-guide" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'underline' }}>
                      {t('common.i18nGuide').toLowerCase()}
                    </Link>
                  </li>
                  <li style={{ padding: '8px 0' }}>
                    {t('myVideo.guideStep2')}{' '}
                    <Link to="/guide?section=capcut-guide" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'underline' }}>
                      {t('common.i18nGuide').toLowerCase()}
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="upload-area">
                <Spin spinning={uploading}>
                  <Dragger
                    id="my-video-capcut-upload"
                    accept=".json,.srt"
                    maxCount={1}
                    beforeUpload={handleSubtitleUpload}
                    showUploadList={false}
                    disabled={uploading}
                  >
                    <p className="ant-upload-drag-icon">
                      <CloudUploadOutlined />
                    </p>
                    <p className="ant-upload-text">{t('myVideo.uploadTitle')}</p>
                    <p className="ant-upload-hint">{t('myVideo.uploadHint')}</p>
                  </Dragger>
                </Spin>


              </div>
            </>
          )}


        </div>
      )}

      {/* ── My Videos Management Table ── */}
      {hasAnyVideos && getAccessToken() && (
        <div ref={managementRef} className="my-videos-management">
          <h2 className="management-title">
            <VideoCameraFilled style={{ marginRight: 8, color: 'var(--color-primary)' }} />
            Danh sách Video của tôi ({myVideosTotal})
          </h2>

        {/* ── Filters Bar ── */}
        <div className="my-videos-filter-bar">
          <div className="filter-group">
            <span className="filter-label">Trạng thái:</span>
            <Select
              value={filterPublished}
              onChange={handleFilterPublishedChange}
              style={{ width: 160 }}
              dropdownStyle={{ borderRadius: '12px' }}
              className="filter-select"
            >
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value="true">Đã chia sẻ</Select.Option>
              <Select.Option value="false">Chưa chia sẻ</Select.Option>
            </Select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Khoảng ngày:</span>
            <DatePicker.RangePicker
              value={filterDateRange}
              onChange={handleDateRangeChange}
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              className="filter-range-picker"
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">Sắp xếp:</span>
            <Select
              value={sortOrder}
              onChange={handleSortOrderChange}
              style={{ width: 160 }}
              dropdownStyle={{ borderRadius: '12px' }}
              className="filter-select"
            >
              <Select.Option value="createdAt,desc">Mới nhất trước</Select.Option>
              <Select.Option value="createdAt,asc">Cũ nhất trước</Select.Option>
            </Select>
          </div>

          {(filterPublished !== 'all' || filterDateRange !== null || sortOrder !== 'createdAt,desc') && (
            <Button
              type="text"
              onClick={handleClearFilters}
              className="clear-filters-btn"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {myVideosLoading ? (
          <div style={{
            padding: '24px',
            background: 'var(--color-surface-container, #ffffff)',
            borderRadius: 16,
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 20,
                  alignItems: 'center',
                  borderBottom: i === 4 ? 'none' : '1px dashed var(--color-border, #e2e8f0)',
                  paddingBottom: i === 4 ? 0 : 16
                }}>
                  <Skeleton.Button active style={{ width: 90, height: 50, borderRadius: 8 }} />
                  <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton.Input active size="small" style={{ width: '70%', height: 16 }} />
                    <Skeleton.Input active size="small" style={{ width: '35%', height: 12 }} />
                  </div>
                  {!isMobile && (
                    <>
                      <Skeleton.Input active size="small" style={{ width: 60, height: 16 }} />
                      <Skeleton.Button active size="small" style={{ width: 100, height: 32, borderRadius: 8 }} />
                      <Skeleton.Button active size="small" style={{ width: 55, height: 22, borderRadius: 12 }} />
                      <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                    </>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                    <Skeleton.Avatar active size="small" shape="circle" />
                    <Skeleton.Avatar active size="small" shape="circle" />
                    <Skeleton.Avatar active size="small" shape="circle" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !isMobile ? (
          <Table
            dataSource={myVideos}
            columns={columns}
            rowKey="id"
            loading={myVideosLoading}
            className="management-table"
            locale={{
              emptyText: !getAccessToken() ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 14 }}>
                    Vui lòng đăng nhập để xem và quản lý danh sách video của bạn.
                  </Paragraph>
                  <Button
                    type="primary"
                    onClick={() => navigate('/login')}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              ) : (
                'Không tìm thấy video nào.'
              )
            }}
            pagination={{
              current: myVideosPage,
              total: myVideosTotal,
              pageSize: 10,
              onChange: (page) => fetchMyVideos(page),
              showSizeChanger: false,
            }}
          />
        ) : (
          <List
            loading={myVideosLoading}
            dataSource={myVideos}
            pagination={{
              current: myVideosPage,
              total: myVideosTotal,
              pageSize: 10,
              onChange: (page) => fetchMyVideos(page),
              showSizeChanger: false,
              simple: true,
              style: { textAlign: 'center', marginTop: 16 }
            }}
            renderItem={(record) => (
              <List.Item style={{ padding: '8px 0', border: 'none' }}>
                <Card
                  className="my-video-mobile-card"
                  styles={{ body: { padding: '12px' } }}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-surface, #fef2df)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <img
                      src={record.thumbnailUrl}
                      alt={record.title}
                      style={{
                        width: '90px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/videos/${record.id}/study`}
                        state={{ from: '/my-video' }}
                        style={{
                          fontFamily: 'var(--font-headline)',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--color-text)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.3',
                        }}
                      >
                        {record.title}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '4px' }}>
                        Thời lượng: {(() => {
                          const secs = parseInt(record.duration, 10);
                          return isNaN(secs) ? record.duration : formatDuration(secs);
                        })()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)' }}>Cấp độ:</span>
                      <Select
                        className="table-level-select"
                        value={record.difficultyLevel || 'UNKNOWN'}
                        onChange={(val) => handleUpdateLevel(record.id, val)}
                        size="small"
                        style={{ width: 85 }}
                        dropdownStyle={{ borderRadius: '12px' }}
                      >
                        <Select.Option value="UNKNOWN">UNKNOWN</Select.Option>
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                          <Select.Option key={lvl} value={lvl}>
                            {lvl}
                          </Select.Option>
                        ))}
                      </Select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)' }}>Chia sẻ:</span>
                      <Switch
                        size="small"
                        checked={record.isPublished}
                        onChange={(checked) => handleTogglePublish(record.id, checked)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', backgroundColor: 'var(--color-surface-container-low, rgba(0,0,0,0.02))', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                      Tạo ngày: {record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Tooltip title="Đồng bộ sang Anki">
                        <Button
                          type="text"
                          size="small"
                          icon={<SyncOutlined spin={syncingId === record.id} style={{ color: '#0ea5e9', fontSize: '16px' }} />}
                          onClick={() => handleSyncToAnki(record)}
                          disabled={syncingId !== null && syncingId !== record.id}
                        />
                      </Tooltip>
                      {record.id === highlightVideoId && showGuide ? (
                        <Popover
                          title={<span style={{ fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 6 }}><SettingOutlined /> Quản lý phụ đề & bài tập</span>}
                          content={
                            <div style={{ maxWidth: 240 }}>
                              <p style={{ margin: '0 0 12px 0', fontSize: 12, lineHeight: 1.5, color: '#475569' }}>
                                Tuyệt vời! Video của bạn đã được tạo thành công. Bạn có thể bấm vào nút <b>Cài đặt (⚙️)</b> này bất cứ lúc nào để sửa phụ đề, dịch tự động hoặc thiết lập bài tập AI!
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button 
                                  type="primary" 
                                  size="small" 
                                  style={{ borderRadius: 6, fontWeight: 600, background: '#4f46e5', border: 'none' }}
                                  onClick={handleDismissFirstTimeGuide}
                                >
                                  Đã hiểu
                                </Button>
                              </div>
                            </div>
                          }
                          open={true}
                          placement="topRight"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<SettingOutlined className="pulse-highlight-icon" style={{ color: '#4f46e5', fontSize: '16px' }} />}
                            onClick={() => {
                              handleDismissFirstTimeGuide();
                              navigate(`/my-video/${record.id}/segments`);
                            }}
                            className="pulse-highlight-btn"
                          />
                        </Popover>
                      ) : (
                        <Tooltip title="Quản lý phân đoạn">
                          <Button
                            type="text"
                            size="small"
                            icon={<SettingOutlined style={{ color: '#4f46e5', fontSize: '16px' }} />}
                            onClick={() => navigate(`/my-video/${record.id}/segments`)}
                          />
                        </Tooltip>
                      )}
                      <Popconfirm
                        title="Bạn có chắc chắn muốn xóa video này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => handleDelete(record.id)}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
      )}
    </div>
  );
};

export default MyVideoPage;
