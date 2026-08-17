import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Spin, Empty, message, Select, Button, Tag, Popover } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  SearchOutlined,
  SaveOutlined,
  SoundOutlined,
  CloseOutlined,
  BookOutlined,
  PlusOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons';
import { useDictionary } from '../context/DictionaryContext';
import { dictionaryLookupApi } from '../../notebook/api/dictionaryApi';
import { vocabularyGroupApi, userSavedWordApi } from '../../notebook/api/notebookApi';
import { extractErrorMessage } from '@/utils/apiError';
import { isAuthenticated } from '@/utils/auth';
import './DictionaryDrawer.scss';

const DictionaryDrawer = () => {
  const { t } = useTranslation();
  const { open, initialWord, targetUnitId, triggerType, position, sentence, closeDrawer } = useDictionary();

  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Save-word & Pinned states
  const [groups, setGroups] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [pinnedUnitId, setPinnedUnitId] = useState(null);
  const [savingWordId, setSavingWordId] = useState(null);
  const [activePopoverWordId, setActivePopoverWordId] = useState(null);
  const [autoPronounce, setAutoPronounce] = useState(false);

  // Coordinates for inline tooltip
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const popupRef = useRef(null);

  // Load pinned unit ID and auto-pronounce on open
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem('vocabflow_pinned_unit_id');
      if (stored) {
        setPinnedUnitId(Number(stored) || stored);
      }
      const storedAuto = localStorage.getItem('vocabflow_auto_pronounce');
      if (storedAuto) {
        setAutoPronounce(storedAuto === 'true');
      }
    }
  }, [open]);

  // Sync initial word and state when drawer/popup opens
  useEffect(() => {
    if (open) {
      setSearchValue(initialWord || '');
      setSelectedUnitId(targetUnitId);
      setResults([]);
      setExpandedIndex(0);
      if (initialWord) {
        handleSearch(initialWord);
      }
      if (isAuthenticated()) {
        loadGroups();
      }
    }
  }, [open, initialWord, targetUnitId]);

  // Auto-pronounce when search finishes
  useEffect(() => {
    if (open && autoPronounce && !loading && results && results.length > 0) {
      const entry = results[0];
      const audioUrl = entry.audioUsUrl || entry.audioUkUrl;
      const langCode = entry.audioUsUrl ? 'en-US' : 'en-GB';
      
      const timer = setTimeout(() => {
        playAudio(audioUrl, entry.word, langCode);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, loading, results, autoPronounce]);

  // Viewport boundaries positioning for inline selection mode
  useEffect(() => {
    if (open && triggerType === 'selection' && position && popupRef.current) {
      // Delay slightly to let the DOM dimensions update with the retrieved results
      const adjustCoordinates = () => {
        if (!popupRef.current) return;
        const rect = popupRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const innerHeight = window.innerHeight;
        const innerWidth = window.innerWidth;
        const selectionRect = position.selectionRect;

        // Ideal position: below the selected text
        let newTop = selectionRect.bottom + 10;
        let newLeft = selectionRect.left;

        // Viewport relative bottom coordinate of selection
        const viewportBottom = selectionRect.bottom - scrollY;

        // 1. Bottom overflow check: if not enough space below, place above the selection
        if (viewportBottom + 10 + rect.height > innerHeight) {
          const topAbove = selectionRect.top - rect.height - 10;
          if (topAbove >= scrollY) {
            newTop = topAbove;
          } else {
            // Both sides overflow, fallback to screen centering or clamping
            if (rect.height > innerHeight) {
              newTop = scrollY + 10;
            } else {
              newTop = scrollY + (innerHeight - rect.height) / 2;
            }
          }
        }

        // 2. Right/Left overflow check
        if (newLeft + rect.width > scrollX + innerWidth) {
          newLeft = scrollX + innerWidth - rect.width - 20;
        }
        if (newLeft < scrollX) {
          newLeft = scrollX + 10;
        }

        setPos({ top: newTop, left: newLeft });
      };

      // Run immediately and also in a microtask/timer to ensure content height is accounted for
      adjustCoordinates();
      const timer = setTimeout(adjustCoordinates, 50);
      return () => clearTimeout(timer);
    }
  }, [open, triggerType, position, results, loading]);

  // Global click outside to dismiss the floating popover
  useEffect(() => {
    if (!open || triggerType !== 'selection') return;

    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        // Skip closing if clicking inside Antd selects/popovers
        if (
          e.target.closest('.ant-select-dropdown') ||
          e.target.closest('.ant-popover') ||
          e.target.closest('.ant-message')
        ) {
          return;
        }
        closeDrawer();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open, triggerType, closeDrawer]);

  const loadGroups = async () => {
    try {
      const res = await vocabularyGroupApi.findAll('createdAt,desc');
      setGroups(res.data || []);
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  const handleSearch = async (word) => {
    const trimmed = (word || searchValue || '').trim();
    if (!trimmed) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await dictionaryLookupApi.lookup(trimmed);
      setResults(res.data || []);
      setExpandedIndex(0);
    } catch (err) {
      message.error(extractErrorMessage(err, t('profile.dictionary.lookupError')));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = (unitId) => {
    if (!unitId) return;
    if (pinnedUnitId === unitId) {
      setPinnedUnitId(null);
      localStorage.removeItem('vocabflow_pinned_unit_id');
      message.info('Đã bỏ ghim Unit');
    } else {
      setPinnedUnitId(unitId);
      localStorage.setItem('vocabflow_pinned_unit_id', unitId);
      message.success('Đã ghim Unit làm mặc định');
    }
  };

  const handleSaveWord = async (dictionaryWordId) => {
    if (!isAuthenticated()) {
      message.warning(t('profile.dictionary.loginRequired'));
      return;
    }
    const finalUnitId = selectedUnitId || pinnedUnitId;
    if (!finalUnitId) {
      message.warning(t('profile.dictionary.selectUnit'));
      return;
    }
    setSavingWordId(dictionaryWordId);
    try {
      await userSavedWordApi.save({
        dictionaryWordId,
        sourceSentence: sentence || '',
        sourceUrl: window.location.href,
        vocabularyUnitId: finalUnitId,
      });
      message.success(t('profile.dictionary.saveSuccess'));
      setActivePopoverWordId(null);
    } catch (err) {
      message.error(extractErrorMessage(err, t('profile.dictionary.saveError')));
    } finally {
      setSavingWordId(null);
    }
  };

  // Instant Quick Save using the Pinned Unit
  const handleQuickSave = async (dictionaryWordId) => {
    if (!pinnedUnitId) return;
    setSavingWordId(dictionaryWordId);
    try {
      await userSavedWordApi.save({
        dictionaryWordId,
        sourceSentence: sentence || '',
        sourceUrl: window.location.href,
        vocabularyUnitId: pinnedUnitId,
      });
      message.success(t('profile.dictionary.saveSuccess'));
    } catch (err) {
      message.error(extractErrorMessage(err, t('profile.dictionary.saveError')));
    } finally {
      setSavingWordId(null);
    }
  };

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
      message.warning(t('profile.dictionary.ttsNotSupported'));
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

  // Unit Options
  const unitOptions = groups.flatMap((g) => {
    const groupName = g.vocabularyGroupResponse?.name || t('notebook.groupLabel');
    return (g.vocabularyUnitResponseList || []).map((u) => ({
      label: `${groupName} › ${u.name}`,
      value: u.id,
    }));
  });

  const savePopoverContent = (dictionaryWordId) => (
    <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Select
        placeholder={t('profile.dictionary.selectUnitPlaceholder')}
        options={unitOptions}
        value={selectedUnitId || pinnedUnitId}
        onChange={setSelectedUnitId}
        allowClear
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
        <Button
          icon={pinnedUnitId === (selectedUnitId || pinnedUnitId) ? <PushpinFilled style={{ color: 'var(--color-primary)' }} /> : <PushpinOutlined />}
          onClick={() => handleTogglePin(selectedUnitId || pinnedUnitId)}
          title={pinnedUnitId === (selectedUnitId || pinnedUnitId) ? "Bỏ ghim" : "Ghim làm mặc định"}
        />
        <Button
          type="primary"
          loading={savingWordId === dictionaryWordId}
          onClick={() => handleSaveWord(dictionaryWordId)}
          style={{ flex: 1, background: 'var(--color-primary)', border: 'none' }}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  );

  if (!open) return null;

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: Selection In-Context Popup (Exact match to extension tooltip)
  // ══════════════════════════════════════════════════════════════════════════════
  if (triggerType === 'selection') {
    return (
      <div
        ref={popupRef}
        className="dict-inline-popup"
        style={{
          position: 'absolute',
          top: `${pos.top}px`,
          left: `${pos.left}px`,
          zIndex: 950,
        }}
      >
        <div className="popup-header">
          <span className="logo">FluentNova</span>
          <button className="close-btn" onClick={closeDrawer}>
            <CloseOutlined />
          </button>
        </div>

        <div className="popup-body">
          {loading && (
            <div className="dict-loading">
              <Spin size="default" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <Empty description={t('profile.dictionary.noResults')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}

          {!loading && results.length > 0 && (() => {
            const entry = results[0]; // Only render the first result, matching the Chrome Extension's tooltip behavior
            return (
              <div key={entry.dictionaryWordId} className="result-card">
                {/* Structured Natural Flowing Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px dashed rgba(221, 193, 179, 0.4)', paddingBottom: 8 }}>
                  {/* Left: UK & US audio tags */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Tag 
                      color="volcano"
                      icon={<SoundOutlined />}
                      style={{ cursor: 'pointer', borderRadius: '4px', margin: 0 }}
                      onClick={(e) => playAudio(entry.audioUkUrl, entry.word, 'en-GB', e)}
                    >
                      UK
                    </Tag>
                    <Tag 
                      color="geekblue"
                      icon={<SoundOutlined />}
                      style={{ cursor: 'pointer', borderRadius: '4px', margin: 0 }}
                      onClick={(e) => playAudio(entry.audioUsUrl, entry.word, 'en-US', e)}
                    >
                      US
                    </Tag>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {/* Auto-pronounce toggle button */}
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<SoundOutlined style={{ color: autoPronounce ? 'var(--color-primary)' : 'var(--color-muted)' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextValue = !autoPronounce;
                        setAutoPronounce(nextValue);
                        localStorage.setItem('vocabflow_auto_pronounce', String(nextValue));
                        message.success(nextValue ? "Đã bật tự động phát âm khi tra từ" : "Đã tắt tự động phát âm");
                      }}
                      title={autoPronounce ? "Tắt tự động phát âm" : "Bật tự động phát âm"}
                      style={{ background: autoPronounce ? 'rgba(221, 193, 179, 0.2)' : 'transparent' }}
                    />

                    {isAuthenticated() && (
                      <>
                        <Popover
                          content={() => savePopoverContent(entry.dictionaryWordId)}
                          title="Lưu từ vựng"
                          trigger="click"
                          open={activePopoverWordId === entry.dictionaryWordId}
                          onOpenChange={(visible) => {
                            if (pinnedUnitId && visible) return;
                            setActivePopoverWordId(visible ? entry.dictionaryWordId : null);
                          }}
                          placement="bottomRight"
                        >
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<PlusOutlined />}
                            loading={savingWordId === entry.dictionaryWordId}
                            onClick={(e) => {
                              if (pinnedUnitId) {
                                e.stopPropagation();
                                handleQuickSave(entry.dictionaryWordId);
                              }
                            }}
                            title={pinnedUnitId ? "Lưu ngay vào sổ tay" : "Lưu từ"}
                            style={{ background: 'var(--color-primary)', border: 'none' }}
                          />
                        </Popover>

                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={pinnedUnitId ? <PushpinFilled style={{ color: 'var(--color-primary)' }} /> : <PushpinOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (pinnedUnitId) {
                              handleTogglePin(pinnedUnitId);
                            } else {
                              setActivePopoverWordId(entry.dictionaryWordId);
                            }
                          }}
                          title={pinnedUnitId ? "Bỏ ghim Unit mặc định" : "Ghim Unit"}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div
                  className="html-content"
                  dangerouslySetInnerHTML={{ __html: entry.htmlContent }}
                />
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: Chatbot Sidebar / Manual Search Mode
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="dict-chatbot-widget">
      {/* Header */}
      <div className="dict-drawer-header">
        <div className="dict-drawer-title">
          <BookOutlined />
          <span>{t('profile.dictionary.title')}</span>
        </div>
        <button className="dict-close-btn" onClick={closeDrawer}>
          <CloseOutlined />
        </button>
      </div>

      <div className="dict-chatbot-body">
        {/* Search Bar */}
        <div className="dict-search-bar">
          <Input
            size="large"
            placeholder={t('profile.dictionary.searchPlaceholder')}
            prefix={<SearchOutlined style={{ fontSize: '16px', color: 'var(--color-muted)' }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={() => handleSearch()}
            allowClear
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="dict-results">
          {loading && (
            <div className="dict-loading">
              <Spin size="large" />
            </div>
          )}

          {!loading && results.length === 0 && searchValue && (
            <Empty description={t('profile.dictionary.noResults')} />
          )}

          {!loading &&
            results.map((entry, idx) => (
              <div
                key={entry.dictionaryWordId}
                className={`dict-entry ${expandedIndex === idx ? 'expanded' : ''}`}
              >
                <div
                  className="dict-entry-header"
                  onClick={() => setExpandedIndex(idx === expandedIndex ? -1 : idx)}
                >
                  <div className="dict-entry-word">
                    <h3>{entry.word}</h3>
                    {entry.pronunciation && (
                      <span className="dict-pronunciation-text" style={{ fontStyle: 'italic', color: 'var(--color-muted)', fontSize: '13px', marginRight: '4px' }}>
                        /{entry.pronunciation}/
                      </span>
                    )}
                    <Tag 
                      color="volcano"
                      icon={<SoundOutlined />}
                      style={{ cursor: 'pointer', borderRadius: '4px', margin: 0 }}
                      onClick={(e) => playAudio(entry.audioUkUrl, entry.word, 'en-GB', e)}
                    >
                      UK
                    </Tag>
                    <Tag 
                      color="geekblue"
                      icon={<SoundOutlined />}
                      style={{ cursor: 'pointer', borderRadius: '4px', margin: 0 }}
                      onClick={(e) => playAudio(entry.audioUsUrl, entry.word, 'en-US', e)}
                    >
                      US
                    </Tag>
                  </div>
                  <p className="dict-entry-desc">{entry.description}</p>
                </div>

                {expandedIndex === idx && (
                  <div className="dict-entry-body">
                    {isAuthenticated() && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
                        <Popover
                          content={() => savePopoverContent(entry.dictionaryWordId)}
                          title={t('profile.dictionary.saveToNotebook')}
                          trigger="click"
                          placement="bottomRight"
                          open={activePopoverWordId === entry.dictionaryWordId}
                          onOpenChange={(visible) => {
                            if (pinnedUnitId && visible) return;
                            setActivePopoverWordId(visible ? entry.dictionaryWordId : null);
                          }}
                        >
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            className="dict-save-btn"
                            loading={savingWordId === entry.dictionaryWordId}
                            onClick={(e) => {
                              if (pinnedUnitId) {
                                e.stopPropagation();
                                handleQuickSave(entry.dictionaryWordId);
                              }
                            }}
                            style={{ width: 'auto', height: 36, padding: '0 20px' }}
                          >
                            {pinnedUnitId ? "Lưu nhanh sổ tay" : t('profile.dictionary.saveThisWord')}
                          </Button>
                        </Popover>

                        <Button
                          icon={pinnedUnitId ? <PushpinFilled style={{ color: 'var(--color-primary)' }} /> : <PushpinOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (pinnedUnitId) {
                              handleTogglePin(pinnedUnitId);
                            } else {
                              setActivePopoverWordId(entry.dictionaryWordId);
                            }
                          }}
                          style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={pinnedUnitId ? "Bỏ ghim Unit mặc định" : "Ghim Unit"}
                        />
                      </div>
                    )}
                    <div
                      className="dict-html-content"
                      dangerouslySetInnerHTML={{ __html: entry.htmlContent }}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DictionaryDrawer;
