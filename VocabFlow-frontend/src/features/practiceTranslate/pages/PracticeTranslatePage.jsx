import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Select, Spin, Empty, message, Segmented, Tooltip, Tag, Modal, Popconfirm, Space, Alert } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  FormOutlined,
  AudioOutlined,
  TranslationOutlined,
  UnorderedListOutlined,
  ExperimentOutlined,
  KeyOutlined,
  DesktopOutlined,
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  GlobalOutlined,
  HistoryOutlined,
  EditOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from '@/utils/auth';
import { translationApi } from '../api/translationApi';
import FeedbackPanel from '../components/FeedbackPanel';
import VoiceInput from '../components/VoiceInput';
import SentenceListDrawer from '../components/SentenceListDrawer';
import GeminiKeysManager from '../components/GeminiKeysManager';
import CreateTopicModal from '../components/CreateTopicModal';
import AttemptHistoryModal from '../components/AttemptHistoryModal';
import styles from '../styles/PracticeTranslatePage.module.scss';

const { TextArea } = Input;

const DIFFICULTY_OPTIONS = [
  { value: 'ALL', labelKey: 'practiceTranslate.difficultyAll' },
  { value: 'EASY', labelKey: 'practiceTranslate.difficultyEasy' },
  { value: 'MEDIUM', labelKey: 'practiceTranslate.difficultyMedium' },
  { value: 'HARD', labelKey: 'practiceTranslate.difficultyHard' },
];

export default function PracticeTranslatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isAuthenticated();

  // ── Topic selection ──
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);

  // ── Exercises ──
  const [exercises, setExercises] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Per-exercise saved state: keyed by exercise id ──
  // { [exerciseId]: { answer, feedback, mode } }
  const [stateByExercise, setStateByExercise] = useState({});
  // Tracks which exerciseId just got a FRESH feedback (so we animate only that once)
  const [freshFeedbackId, setFreshFeedbackId] = useState(null);

  const [grading, setGrading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState(false);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const currentExercise = exercises[currentIndex] || null;
  const currentId = currentExercise?.id;
  const currentState = currentId ? stateByExercise[currentId] : null;
  const answer = currentState?.answer || '';
  const feedback = currentState?.feedback || null;
  const mode = currentState?.mode || 'type';

  const textAreaRef = useRef(null);
  const voiceToggleRef = useRef(null); // set by VoiceInput to allow shortcut toggling

  // Helper to patch the current exercise's saved state
  const patchCurrent = useCallback((patch) => {
    if (!currentId) return;
    setStateByExercise((prev) => ({
      ...prev,
      [currentId]: { ...(prev[currentId] || { answer: '', feedback: null, mode: 'type' }), ...patch },
    }));
  }, [currentId]);

  const setAnswer = useCallback((val) => {
    const value = typeof val === 'function' ? val(answer) : val;
    patchCurrent({ answer: value });
  }, [patchCurrent, answer]);

  const setMode = useCallback((m) => patchCurrent({ mode: m }), [patchCurrent]);

  // ── Load topics on mount ──
  const fetchTopics = useCallback(async () => {
    try {
      setTopicsLoading(true);
      const res = await translationApi.getTopics();
      setTopics(res.data || []);
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.loadTopicsError'));
    } finally {
      setTopicsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleDeleteTopic = useCallback(async (topicId) => {
    try {
      await translationApi.deleteTopic(topicId);
      message.success(t('practiceTranslate.create.deleted'));
      fetchTopics();
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.create.deleteError'));
    }
  }, [fetchTopics, t]);

  // ── Load exercises when topic or difficulty changes ──
  const loadExercises = useCallback(async (topicId, diff) => {
    setExLoading(true);
    try {
      const res = await translationApi.getExercises(topicId, { difficulty: diff, pageNo: 0, pageSize: 100 });
      setExercises(res.data?.content || []);
      setCurrentIndex(0);
      setFreshFeedbackId(null);

      // Restore the user's saved progress for this topic (typed answer + AI feedback).
      if (isAuthenticated()) {
        try {
          const progRes = await translationApi.getProgress(topicId);
          const restored = {};
          (progRes.data || []).forEach((a) => {
            restored[a.exerciseId] = {
              answer: a.userInput || '',
              mode: 'type',
              feedback: {
                attemptId: a.id,
                exerciseId: a.exerciseId,
                isCorrect: a.isCorrect,
                feedback: a.aiFeedback,
                betterVersion: a.aiBetterVersion,
                // standardAnswer is only revealed on a fresh submit; not persisted in history
              },
            };
          });
          setStateByExercise(restored);
        } catch {
          setStateByExercise({}); // progress is best-effort; ignore failures
        }
      } else {
        setStateByExercise({});
      }
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.loadExercisesError'));
    } finally {
      setExLoading(false);
    }
  }, [t]);

  const handleSelectTopic = (topic) => {
    setActiveTopic(topic);
    setDifficulty('ALL');
    loadExercises(topic.id, 'ALL');
  };

  const handleBackToTopics = () => {
    setActiveTopic(null);
    setExercises([]);
    setStateByExercise({});
    setFreshFeedbackId(null);
    // Refresh so exercise counts reflect any add/edit/delete done inside the set.
    fetchTopics();
  };

  const handleDifficultyChange = (value) => {
    setDifficulty(value);
    if (activeTopic) loadExercises(activeTopic.id, value);
  };

  // Navigate WITHOUT wiping saved answers/feedback (fix for "lost work on revisit")
  const goToIndex = useCallback((idx) => {
    if (idx < 0 || idx >= exercises.length) return;
    setCurrentIndex(idx);
    setFreshFeedbackId(null); // revisiting => do not re-animate
    setListOpen(false);
    setEditingSentence(false);
  }, [exercises.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i < exercises.length - 1 ? i + 1 : i));
    setFreshFeedbackId(null);
    setEditingSentence(false);
  }, [exercises.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
    setFreshFeedbackId(null);
    setEditingSentence(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentExercise) return;
    if (!isAuthenticated()) {
      message.info(t('practiceTranslate.loginRequired'));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const trimmed = (stateByExercise[currentExercise.id]?.answer || '').trim();
    if (!trimmed) {
      message.warning(t('practiceTranslate.emptyAnswer'));
      return;
    }
    setGrading(true);
    try {
      const res = await translationApi.submit({
        exerciseId: currentExercise.id,
        userInput: trimmed,
        isVoiceMode: (stateByExercise[currentExercise.id]?.mode || 'type') === 'voice',
      });
      setStateByExercise((prev) => ({
        ...prev,
        [currentExercise.id]: { ...(prev[currentExercise.id] || {}), feedback: res.data },
      }));
      setFreshFeedbackId(currentExercise.id); // animate this fresh result
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.gradeError'));
    } finally {
      setGrading(false);
    }
  }, [currentExercise, stateByExercise, t, navigate, location.pathname]);

  // ── Edit / delete the current sentence (owned topics only) ──
  const isOwnedTopic = !!activeTopic?.owned;

  const handleStartEdit = useCallback(() => {
    if (!currentExercise) return;
    setEditText(currentExercise.vietnameseText || '');
    setEditingSentence(true);
  }, [currentExercise]);

  const handleSaveEdit = useCallback(async () => {
    if (!currentExercise) return;
    const text = editText.trim();
    if (!text) {
      message.warning(t('practiceTranslate.manage.emptySentence'));
      return;
    }
    setSavingEdit(true);
    try {
      await translationApi.updateExercise(currentExercise.id, { vietnameseText: text });
      // Update local exercise list in place
      setExercises((prev) => prev.map((ex) => (ex.id === currentExercise.id ? { ...ex, vietnameseText: text } : ex)));
      setEditingSentence(false);
      message.success(t('practiceTranslate.manage.sentenceUpdated'));
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.manage.updateError'));
    } finally {
      setSavingEdit(false);
    }
  }, [currentExercise, editText, t]);

  const handleDeleteSentence = useCallback(async () => {
    if (!currentExercise) return;
    const removedId = currentExercise.id;
    try {
      await translationApi.deleteExercise(removedId);
      message.success(t('practiceTranslate.manage.sentenceDeleted'));
      // Remove locally + clean its saved state, then clamp the index.
      setExercises((prev) => {
        const next = prev.filter((ex) => ex.id !== removedId);
        setCurrentIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
        return next;
      });
      setStateByExercise((prev) => {
        const next = { ...prev };
        delete next[removedId];
        return next;
      });
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.manage.deleteError'));
    }
  }, [currentExercise, t]);
  useEffect(() => {
    if (!activeTopic) return;
    const onKeyDown = (e) => {
      // Navigation: Ctrl + Arrow
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        return;
      }
      // Recording: Shift + ` — ONLY works while already in voice mode.
      if (e.shiftKey && e.key === '`') {
        e.preventDefault();
        if (mode === 'voice') {
          voiceToggleRef.current?.();
        } else {
          message.info(t('practiceTranslate.recordOnlyVoiceMode'));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTopic, handlePrev, handleNext, mode, t]);

  // ── Guest gate helper: AI grading & personal sets require login ──
  const goToLogin = useCallback(() => {
    navigate('/login', { state: { from: location.pathname } });
  }, [navigate, location.pathname]);

  // ── Render: topic selection ──
  if (!activeTopic) {
    return (
      <div className={styles.page}>
        <div className={styles['page-header']}>
          <h1 className={styles['page-title']}>
            <TranslationOutlined style={{ color: 'var(--color-primary)' }} />
            {t('practiceTranslate.title')}
            <Tag icon={<ExperimentOutlined />} color="purple" className={styles['beta-tag']}>
              {t('practiceTranslate.experimental')}
            </Tag>
          </h1>
          <p className={styles['page-subtitle']}>{t('practiceTranslate.subtitle')}</p>
          <div className={styles['header-actions']}>
            {loggedIn ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
                style={{ borderRadius: 8 }}
              >
                {t('practiceTranslate.create.newTopic')}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={goToLogin}
                style={{ borderRadius: 8 }}
              >
                {t('practiceTranslate.guest.loginBtn')}
              </Button>
            )}
            <Button
              icon={<KeyOutlined />}
              onClick={() => (loggedIn ? setGeminiOpen(true) : goToLogin())}
              style={{ borderRadius: 8 }}
            >
              {t('practiceTranslate.manageGeminiKeys')}
            </Button>
          </div>
          {!loggedIn && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12, borderRadius: 10, textAlign: 'left' }}
              message={t('practiceTranslate.guest.title')}
              description={t('practiceTranslate.guest.desc')}
            />
          )}
        </div>

        {topicsLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
        ) : topics.length === 0 ? (
          <Empty description={t('practiceTranslate.noTopics')} className={styles['empty-state']} />
        ) : (
          <div className={styles['topic-grid']}>
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={styles['topic-card']}
                onClick={() => handleSelectTopic(topic)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectTopic(topic)}
              >
                <div className={styles['topic-card-head']}>
                  <h3 className={styles['topic-title']}>{topic.title}</h3>
                  {topic.owned && (
                    <Space size={2} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={t('practiceTranslate.manage.editTopic')}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => { e.stopPropagation(); setEditTopic(topic); }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title={t('practiceTranslate.create.confirmDelete')}
                        okText={t('common.delete')}
                        cancelText={t('common.cancel')}
                        okButtonProps={{ danger: true }}
                        onConfirm={(e) => { e?.stopPropagation?.(); handleDeleteTopic(topic.id); }}
                        onCancel={(e) => e?.stopPropagation?.()}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </Space>
                  )}
                </div>
                <p className={styles['topic-desc']}>{topic.description}</p>
                <div className={styles['topic-card-foot']}>
                  <span className={styles['topic-count']}>
                    {t('practiceTranslate.exerciseCount', { count: topic.exerciseCount })}
                  </span>
                  <Space size={4}>
                    {topic.system && <Tag color="blue">{t('practiceTranslate.create.systemTag')}</Tag>}
                    {topic.owned && (
                      topic.isPublic
                        ? <Tag icon={<GlobalOutlined />} color="green">{t('practiceTranslate.create.public')}</Tag>
                        : <Tag icon={<LockOutlined />}>{t('practiceTranslate.create.private')}</Tag>
                    )}
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={geminiOpen}
          onCancel={() => setGeminiOpen(false)}
          footer={null}
          width={960}
          title={t('practiceTranslate.manageGeminiKeys')}
          styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
        >
          <GeminiKeysManager />
        </Modal>

        <CreateTopicModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => fetchTopics()}
        />

        <CreateTopicModal
          key={editTopic?.id || 'edit'}
          open={!!editTopic}
          editTopic={editTopic}
          onClose={() => setEditTopic(null)}
          onCreated={() => fetchTopics()}
        />
      </div>
    );
  }

  // ── answeredMap for the drawer ──
  const answeredMap = {};
  Object.entries(stateByExercise).forEach(([id, s]) => {
    if (s?.feedback) answeredMap[id] = { isCorrect: s.feedback.isCorrect };
  });

  // ── Render: practice workspace ──
  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <div className={styles.toolbar}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToTopics} style={{ borderRadius: 8 }}>
            {t('practiceTranslate.backToTopics')}
          </Button>
          <span className={styles['progress-text']}>
            {activeTopic.title}
            {exercises.length > 0 && ` — ${currentIndex + 1}/${exercises.length}`}
            <Tag icon={<ExperimentOutlined />} color="purple" style={{ marginLeft: 8 }}>
              {t('practiceTranslate.experimental')}
            </Tag>
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Tooltip title={t('practiceTranslate.viewList')}>
              <Button
                icon={<UnorderedListOutlined />}
                onClick={() => setListOpen(true)}
                style={{ borderRadius: 8 }}
              >
                {t('practiceTranslate.sentenceList')}
              </Button>
            </Tooltip>
            <Tooltip title={t('practiceTranslate.manageGeminiKeys')}>
              <Button
                icon={<KeyOutlined />}
                onClick={() => (loggedIn ? setGeminiOpen(true) : goToLogin())}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
            <Select
              value={difficulty}
              onChange={handleDifficultyChange}
              style={{ width: 150 }}
              options={DIFFICULTY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </div>
        </div>

        <div className={styles['shortcut-hint']}>
          {t('practiceTranslate.shortcutHint')}
        </div>

        {exLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
        ) : !currentExercise ? (
          <Empty description={t('practiceTranslate.noExercises')} className={styles['empty-state']} />
        ) : (
          <div className={styles['exercise-card']}>
            <div className={styles['exercise-card-top']}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className={styles['vi-label']}>{t('practiceTranslate.translateThis')}</span>
                {editingSentence ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    <TextArea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      maxLength={1000}
                      style={{ borderRadius: 8, fontSize: 16 }}
                    />
                    <Space>
                      <Button type="primary" size="small" loading={savingEdit} onClick={handleSaveEdit} style={{ borderRadius: 6 }}>
                        {t('common.save')}
                      </Button>
                      <Button size="small" onClick={() => setEditingSentence(false)} style={{ borderRadius: 6 }}>
                        {t('common.cancel')}
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <p className={styles['vi-text']}>{currentExercise.vietnameseText}</p>
                )}
              </div>

              <Space size={4} className={styles['exercise-actions']}>
                {loggedIn && (
                  <Tooltip title={t('practiceTranslate.history.view')}>
                    <Button
                      type="text"
                      icon={<HistoryOutlined />}
                      onClick={() => setHistoryOpen(true)}
                    />
                  </Tooltip>
                )}
                {isOwnedTopic && !editingSentence && (
                  <>
                    <Tooltip title={t('practiceTranslate.manage.editSentence')}>
                      <Button type="text" icon={<EditOutlined />} onClick={handleStartEdit} />
                    </Tooltip>
                    <Popconfirm
                      title={t('practiceTranslate.manage.confirmDeleteSentence')}
                      description={t('practiceTranslate.manage.deleteSentenceWarning')}
                      okText={t('common.delete')}
                      cancelText={t('common.cancel')}
                      okButtonProps={{ danger: true }}
                      onConfirm={handleDeleteSentence}
                    >
                      <Tooltip title={t('practiceTranslate.manage.deleteSentence')}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>
                  </>
                )}
              </Space>
            </div>

            <div className={styles['answer-area']}>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'type', label: t('practiceTranslate.typeMode'), icon: <FormOutlined /> },
                  { value: 'voice', label: t('practiceTranslate.voiceMode'), icon: <AudioOutlined /> },
                ]}
              />

              {mode === 'voice' && (
                <div className={styles['pc-only-note']}>
                  <DesktopOutlined /> {t('practiceTranslate.voicePcOnly')}
                </div>
              )}

              {mode === 'type' ? (
                <TextArea
                  ref={textAreaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t('practiceTranslate.typePlaceholder')}
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) { e.preventDefault(); handleSubmit(); }
                  }}
                  style={{ borderRadius: 10, fontSize: 15 }}
                />
              ) : (
                <>
                  <VoiceInput
                    onTranscript={setAnswer}
                    resetSignal={currentExercise.id}
                    registerToggle={(fn) => { voiceToggleRef.current = fn; }}
                  />
                  {answer && (
                    <TextArea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={t('practiceTranslate.typePlaceholder')}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      style={{ borderRadius: 10, fontSize: 15 }}
                    />
                  )}
                </>
              )}

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={grading}
                disabled={!answer.trim()}
                style={{ borderRadius: 8, fontWeight: 600, alignSelf: 'flex-start' }}
              >
                {t('practiceTranslate.submit')}
              </Button>
            </div>

            {grading && (
              <div style={{ textAlign: 'center', padding: 8 }}>
                <Spin /> <span style={{ marginLeft: 8, color: 'var(--color-muted)' }}>{t('practiceTranslate.grading')}</span>
              </div>
            )}

            <FeedbackPanel feedback={feedback} animate={freshFeedbackId === currentId} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{ borderRadius: 8 }}
              >
                {t('practiceTranslate.previous')}
              </Button>
              <Button
                type={feedback ? 'primary' : 'default'}
                onClick={handleNext}
                disabled={currentIndex >= exercises.length - 1}
                style={{ borderRadius: 8 }}
              >
                {t('practiceTranslate.next')} <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        )}
      </div>

      <SentenceListDrawer
        open={listOpen}
        onClose={() => setListOpen(false)}
        exercises={exercises}
        currentIndex={currentIndex}
        answeredMap={answeredMap}
        onSelect={goToIndex}
        topicTitle={activeTopic.title}
      />

      <Modal
        open={geminiOpen}
        onCancel={() => setGeminiOpen(false)}
        footer={null}
        width={960}
        title={t('practiceTranslate.manageGeminiKeys')}
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      >
        <GeminiKeysManager />
      </Modal>

      <AttemptHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseId={currentId}
        vietnameseText={currentExercise?.vietnameseText}
      />
    </div>
  );
}
