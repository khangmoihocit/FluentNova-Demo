import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  message,
  Modal,
  Input,
  Empty,
  Spin,
  Pagination,
  Tag,
  Tooltip,
  Button,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  SoundOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
  BookOutlined,
  ReloadOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import { userSavedWordApi } from '../api/notebookApi';
import { extractErrorMessage } from '@/utils/apiError';
import { isAuthenticated } from '@/utils/auth';
import { getAnkiSyncSummary } from '@/utils/ankiSync';
import { useDictionary } from '../../dictionary/context/DictionaryContext';
import { syncCurrentWordsToAnki, syncVocabularyUnitToAnki } from '../utils/notebookAnkiSync';
import styles from '../styles/SavedWordsPage.module.scss';

const { confirm } = Modal;

const ANKI_STATUS_MAP = {
  SYNCED: { color: 'blue', label: 'Đã đồng bộ' },
  PENDING: { color: 'orange', label: 'Chưa đồng bộ' },
  ERROR: { color: 'red', label: 'Lỗi' },
};

const SavedWordsPage = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { openDrawer } = useDictionary();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageNo: 1, pageSize: 20, totalElements: 0 });
  const [keyword, setKeyword] = useState('');
  const [resyncingId, setResyncingId] = useState(null);
  const [expandedWordId, setExpandedWordId] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const groupName = location.state?.groupName || 'Vocabulary';
  const unitName = location.state?.unitName || 'Unit';

  // ── Fetch words ──
  const loadWords = useCallback(async (pageNo = 1, search = keyword) => {
    setLoading(true);
    try {
      const res = await userSavedWordApi.findAll(unitId, {
        pageNo,
        pageSize: pagination.pageSize,
        keyword: search,
      });
      const pageData = res.data || {};
      setWords(pageData.data || []);
      setPagination((prev) => ({
        ...prev,
        pageNo: pageData.pageNo || 1,
        totalElements: pageData.totalElements || 0,
      }));
    } catch (err) {
      message.error(extractErrorMessage(err, 'Không thể tải danh sách từ'));
    } finally {
      setLoading(false);
    }
  }, [unitId, pagination.pageSize, keyword]);

  const playPronunciation = (word, langCode = 'en-US', e = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = langCode;
      if (window.speechSynthesis.getVoices) {
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase())
          || voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase().split('-')[0]));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }
      window.speechSynthesis.speak(utterance);
    } else {
      message.warning('Trình duyệt của bạn không hỗ trợ đọc phát âm');
    }
  };

  const playAudio = (url, fallbackText, langCode = 'en-US', e = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (url) {
      const audio = new Audio(url);
      audio.play().catch((err) => {
        console.warn('Audio play failed, falling back to TTS', err);
        playPronunciation(fallbackText, langCode, e);
      });
    } else {
      playPronunciation(fallbackText, langCode, e);
    }
  };

  useEffect(() => {
    loadWords(1, '');
  }, [unitId]);

  // ── Delete word ──
  const handleDeleteWord = (word) => {
    if (!isAuthenticated()) {
      message.warning('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }
    const wordText = word.lookupWordResponse?.word || 'từ này';
    confirm({
      title: 'Xóa từ vựng',
      icon: <ExclamationCircleFilled />,
      content: `Bạn chắc chắn muốn xóa "${wordText}" khỏi sổ tay?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        try {
          await userSavedWordApi.delete(word.id);
          message.success('Đã xóa từ!');
          loadWords(pagination.pageNo);
        } catch (err) {
          message.error(extractErrorMessage(err, 'Không thể xóa từ'));
        }
      },
    });
  };

  // ── Resync single word ──
  const handleResyncAnki = async (wordId) => {
    if (!isAuthenticated()) {
      message.warning('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }
    setResyncingId(wordId);
    try {
      const word = words.find((item) => item.id === wordId);
      if (!word) {
        message.error('Không tìm thấy từ cần đồng bộ.');
        return;
      }
      const result = await syncCurrentWordsToAnki({
        words: [word],
        groupName,
        unitName,
        pendingOnly: false,
      });
      if (result.syncedCount === 0 && !result.duplicateCount) {
        throw new Error(result.errors[0]?.message || 'Đồng bộ lại thất bại');
      }

      // Sync backend status
      await userSavedWordApi.syncAnki();

      message.success(getAnkiSyncSummary(result, 'từ'));
      loadWords(pagination.pageNo);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Đồng bộ lại thất bại'));
    } finally {
      setResyncingId(null);
    }
  };

  // ── Search ──
  const handleSearch = (value) => {
    setKeyword(value);
    loadWords(1, value);
  };

  // ── Global Sync ──
  const handleSyncAnki = async () => {
    if (!isAuthenticated()) {
      message.warning('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncVocabularyUnitToAnki({
        unitId,
        groupName,
        unitName,
        pendingOnly: false,
      });
      const count = result.syncedCount || 0;
      if (result.errors.length > 0 && count === 0 && !result.duplicateCount) {
        throw new Error(result.errors[0]?.message || 'Đồng bộ Anki thất bại');
      }

      // Sync backend status
      await userSavedWordApi.syncAnki();

      message.success(getAnkiSyncSummary(result, 'từ'));
      loadWords(pagination.pageNo);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Đồng bộ Anki thất bại'));
    } finally {
      setSyncing(false);
    }
  };

  // ── Unit Resync ──
  const handleResyncUnitAnki = async () => {
    if (!isAuthenticated()) {
      message.warning('Vui lòng đăng nhập để sử dụng tính năng này!');
      return;
    }
    setResyncing(true);
    try {
      const result = await syncVocabularyUnitToAnki({
        unitId,
        groupName,
        unitName,
        pendingOnly: false,
      });
      const count = result.syncedCount || 0;
      if (result.errors.length > 0 && count === 0 && !result.duplicateCount) {
        throw new Error(result.errors[0]?.message || 'Đồng bộ Anki thất bại');
      }

      // Sync backend unit status
      await userSavedWordApi.resyncAnki(unitId);

      message.success(getAnkiSyncSummary(result, 'từ'));
      loadWords(pagination.pageNo);
    } catch (err) {
      message.error(extractErrorMessage(err, 'Đồng bộ Anki thất bại'));
    } finally {
      setResyncing(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <div className={styles.headerText}>
          <h1>Danh sách từ vựng</h1>
          <p>{pagination.totalElements} từ đã lưu</p>
        </div>
        <div className={styles.headerActions}>
          <Tooltip title="Đồng bộ lại toàn bộ unit này sang Anki">
            <button
              className={styles.resyncBtn}
              onClick={handleResyncUnitAnki}
              disabled={resyncing}
            >
              <ReloadOutlined spin={resyncing} />
              <span>Đồng bộ lại</span>
            </button>
          </Tooltip>

          <Tooltip title="Đồng bộ các từ mới sang Anki">
            <button
              className={styles.ankiSyncBtn}
              onClick={handleSyncAnki}
              disabled={syncing}
            >
              <CloudSyncOutlined spin={syncing} />
              <span>Sync Anki</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className={styles.searchBar}>
        <Input
          placeholder="Tìm kiếm từ vựng..."
          prefix={<SearchOutlined />}
          size="large"
          allowClear
          onPressEnter={(e) => handleSearch(e.target.value)}
          onChange={(e) => {
            if (!e.target.value) handleSearch('');
          }}
        />
      </div>

      {/* ── Word List ── */}
      <div className={`${styles.wordList} ${!loading && words.length > 0 ? styles.gridView : ''}`}>
        {loading ? (
          <div className={styles.loadingWrap}>
            <Spin size="large" />
          </div>
        ) : words.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>
              <BookOutlined className={styles.emptyIcon} />
              <div className={styles.pulseRing}></div>
            </div>
            <h2>Kho từ vựng còn trống</h2>
            <p>Bắt đầu hành trình chinh phục ngôn ngữ bằng cách thêm những từ vựng đầu tiên!</p>
            <Button
              type="primary"
              size="large"
              className={styles.primaryActionBtn}
              icon={<SearchOutlined />}
              onClick={() => openDrawer({ unitId: Number(unitId) })}
            >
              Tra từ & Lưu ngay
            </Button>
          </div>
        ) : (
          <>
            {words.map((word) => {
              const lookup = word.lookupWordResponse || {};
              const isExpanded = expandedWordId === word.id;
              const ankiMeta = ANKI_STATUS_MAP[word.ankiStatus] || ANKI_STATUS_MAP.PENDING;

              return (
                <div
                  key={word.id}
                  className={`${styles.wordCard} ${isExpanded ? styles.expanded : ''}`}
                >
                  <div
                    className={styles.wordHeader}
                    onClick={() => setExpandedWordId(isExpanded ? null : word.id)}
                  >
                    <div className={styles.wordInfo}>
                      <h3 className={styles.wordText}>{lookup.word}</h3>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                        {lookup.pronunciation && (
                          <span className={styles.pronunciation} style={{ margin: 0, paddingRight: '4px' }}>
                            /{lookup.pronunciation}/
                          </span>
                        )}
                        <Tag 
                          color="volcano"
                          icon={<SoundOutlined />}
                          style={{ cursor: 'pointer', borderRadius: '4px', margin: 0 }}
                          onClick={(e) => playAudio(lookup.audioUkUrl, lookup.word, 'en-GB', e)}
                        >
                          UK
                        </Tag>
                        <Tag 
                          color="geekblue"
                          icon={<SoundOutlined />}
                          style={{ cursor: 'pointer', borderRadius: '4px', margin: 0 }}
                          onClick={(e) => playAudio(lookup.audioUsUrl, lookup.word, 'en-US', e)}
                        >
                          US
                        </Tag>
                      </div>
                    </div>
                    <div className={styles.wordMeta}>
                      <Tag
                        color={ankiMeta.color}
                        className={styles.ankiTag}
                      >
                        {ankiMeta.label}
                      </Tag>
                    </div>
                  </div>

                  <p className={styles.wordDesc}>{lookup.description}</p>

                  {isExpanded && (
                    <div className={styles.wordBody}>
                      <div
                        className={styles.htmlContent}
                        dangerouslySetInnerHTML={{ __html: lookup.htmlContent }}
                      />
                      <div className={styles.wordActions}>
                        {word.ankiStatus !== 'SYNCED' && (
                          <Button
                            size="small"
                            icon={<ReloadOutlined spin={resyncingId === word.id} />}
                            onClick={() => handleResyncAnki(word.id)}
                            loading={resyncingId === word.id}
                          >
                            Đồng bộ lại
                          </Button>
                        )}
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteWord(word)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.totalElements > pagination.pageSize && (
              <div className={styles.paginationWrap}>
                <Pagination
                  current={pagination.pageNo}
                  pageSize={pagination.pageSize}
                  total={pagination.totalElements}
                  onChange={(page) => loadWords(page)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SavedWordsPage;
