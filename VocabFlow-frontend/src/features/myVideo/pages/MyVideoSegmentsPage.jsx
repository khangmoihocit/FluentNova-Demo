import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Input,
  InputNumber,
  Button,
  Space,
  Card,
  Alert,
  message,
  Divider,
  Tag,
  Tooltip,
  Tabs,
  Spin,
  Empty,
  Popconfirm,
  Badge,
  Switch,
  Progress,
  Modal,
  Pagination,
  Upload,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CopyOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  UnorderedListOutlined,
  CloudUploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  SoundOutlined,
  TranslationOutlined,
  LinkOutlined,
  UndoOutlined,
  RobotOutlined,
  RedoOutlined,
  CloseCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  FormatPainterOutlined,
} from '@ant-design/icons';
import { myVideoSegmentApi } from '../api/myVideoSegment.api';
import { myVideoApi } from '../../../services/api/myVideo.api';
import FillBlankTab from '../components/FillBlankTab';
import QuizTab from '../components/QuizTab';
import GeminiKeysManager from '../../practiceTranslate/components/GeminiKeysManager';
import styles from './MyVideoSegmentsPage.module.scss';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============================================================
// HELPER: Format seconds to mm:ss
// ============================================================
const formatTime = (inputSeconds) => {
  const num = parseFloat(inputSeconds);
  if (isNaN(num) || num < 0) return '—';

  const roundedNum = Math.round(num * 100) / 100;
  const totalSeconds = Math.floor(roundedNum);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');

  return `${mm}:${ss}`;
};

// ============================================================
// HELPER: Auto-escape unescaped quotes in JSON string
// ============================================================
const autoFixJson = (jsonStr) => {
  if (!jsonStr) return jsonStr;
  const lines = jsonStr.split('\n');
  const fixedLines = lines.map(line => {
    // Match line like: "text": "something "quoted" here",
    const match = line.match(/^(\s*"[^"]+"\s*:\s*")([\s\S]*?)("\s*,?\s*)$/);
    if (match) {
      const prefix = match[1];
      const value = match[2];
      const suffix = match[3];
      
      // Escape any unescaped double quotes inside the value.
      // We look for double quotes that are NOT preceded by a backslash.
      const fixedValue = value.replace(/(?<!\\)"/g, '\\"');
      return prefix + fixedValue + suffix;
    }
    return line;
  });
  return fixedLines.join('\n');
};

// ============================================================
// SEGMENT FIELDS CONFIG
// ============================================================
const SEGMENT_FIELDS = [
  { key: 'text', label: 'English Text', icon: <SoundOutlined />, required: true },
  { key: 'vietnameseTranslation', label: 'Vietnamese', icon: <TranslationOutlined /> },
  { key: 'ipa', label: 'IPA', icon: <InfoCircleOutlined /> },
];

// ============================================================
// SUB-COMPONENT: Single Segment Card (Visual Editor)
// ============================================================
const SegmentRow = memo(({ segment, index, onChange, onDelete, onMerge, totalCount }) => {
  const handleFieldChange = (field, value) => {
    onChange(index, { ...segment, [field]: value });
  };

  return (
    <div className={styles.segmentRow}>
      {/* Left: Index badge + Timestamps */}
      <div className={styles.segmentLeft}>
        <div className={styles.segmentIndex}>
          <Badge
            count={segment.segmentOrder || index + 1}
            style={{
              backgroundColor: '#6366f1',
              fontWeight: 700,
              fontSize: 11,
              minWidth: 28,
              height: 28,
              lineHeight: '28px',
              borderRadius: 8,
            }}
          />
        </div>

        <div className={styles.timestampGroup}>
          <div className={styles.timestampField}>
            <label className={styles.timestampLabel}>Start</label>
            <InputNumber
              value={segment.start}
              onChange={(val) => handleFieldChange('start', val)}
              min={0}
              step={0.1}
              precision={2}
              size="small"
              className={styles.timestampInput}
              controls={{ upIcon: '▲', downIcon: '▼' }}
            />
            <span className={styles.timestampPreview}>{formatTime(segment.start)}</span>
          </div>
          <div className={styles.timestampField}>
            <label className={styles.timestampLabel}>End</label>
            <InputNumber
              value={segment.end}
              onChange={(val) => handleFieldChange('end', val)}
              min={0}
              step={0.1}
              precision={2}
              size="small"
              className={styles.timestampInput}
              controls={{ upIcon: '▲', downIcon: '▼' }}
            />
            <span className={styles.timestampPreview}>{formatTime(segment.end)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Switch
              size="small"
              checked={!!segment.lineBreakBefore}
              onChange={(checked) => handleFieldChange('lineBreakBefore', checked)}
            />
            <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.2 }}>
              Ngắt đoạn mới
            </Text>
          </div>
        </div>
      </div>

      {/* Right: Text fields */}
      <div className={styles.segmentRight}>
        {SEGMENT_FIELDS.map((field) => (
          <div key={field.key} className={styles.textFieldRow}>
            <Tooltip title={field.label}>
              <span className={styles.fieldIcon}>{field.icon}</span>
            </Tooltip>
            <Input
              value={segment[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.label}
              size="small"
              className={`${styles.textInput} ${field.key === 'ipa' ? styles.ipaInput : ''}`}
              status={field.required && !segment[field.key]?.trim() ? 'warning' : ''}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.segmentActions}>
        <Tooltip title="Gộp với phân đoạn dưới">
          <Button
            type="text"
            icon={<LinkOutlined />}
            size="small"
            onClick={() => onMerge(index)}
            disabled={index === totalCount - 1}
            className={styles.mergeRowBtn}
          />
        </Tooltip>
        <Popconfirm
          title="Xoá phân đoạn này?"
          onConfirm={() => onDelete(index)}
          okText="Xoá"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          disabled={totalCount <= 1}
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            disabled={totalCount <= 1}
            className={styles.deleteRowBtn}
          />
        </Popconfirm>
      </div>
    </div>
  );
});

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MyVideoSegmentsPage() {
  const { id: videoId } = useParams();
  const navigate = useNavigate();

  // ── State ──
  const [segments, setSegments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState('segments');
  const [activeTab, setActiveTab] = useState('visual');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonErrorLine, setJsonErrorLine] = useState(null);
  const jsonEditorRef = useRef(null);
  const jsonTextareaRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [mergeHistory, setMergeHistory] = useState([]);
  const listContainerRef = useRef(null);

  const [reuploading, setReuploading] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const containerRef = useRef(null);

  // ── Unsaved changes warning blocker (browser-level reloads & internal SPA transitions) ──
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi?';
        return 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!hasChanges) return;
      if (!containerRef.current) return;

      // Ignore clicks on elements that have been detached from the DOM (e.g., closed modals, dropdowns)
      if (e.target && !document.body.contains(e.target)) return;

      // Ignore clicks inside Ant Design dynamic overlays/portals (modals, dropdowns, tooltips, messages)
      const isAntdPortal = e.target.closest('.ant-modal, .ant-modal-wrap, .ant-modal-root, .ant-select-dropdown, .ant-dropdown, .ant-tooltip, .ant-message');
      if (isAntdPortal) return;

      // If the click target is outside the segments editor container
      if (!containerRef.current.contains(e.target)) {
        // Intercept clicks on clickable/interactive items (like sidebar lists, buttons, tabs, links)
        const isClickable = e.target.closest('a, button, li, .ant-menu-item, [role="button"], [class*="sider"], [class*="menu"]');
        if (!isClickable) return;

        const confirmLeave = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi mà không lưu?');
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Use capture phase (true) to intercept clicks before any internal React Router onClick events fire
    document.addEventListener('click', handleOutsideClick, true);
    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, [hasChanges]);

  // ── Centralized AI Background Task Manager State ──
  const [aiTasks, setAiTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('vocabflow_ai_tasks');
      if (!saved) return {};
      const parsed = JSON.parse(saved);

      // Auto-cleanup: drop tasks created before today's local midnight (i.e. from a previous day)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayMs = startOfToday.getTime();

      const cleaned = {};
      Object.keys(parsed).forEach((taskId) => {
        const task = parsed[taskId];
        if (!task) return;
        if (typeof task.createdAt !== 'number' || task.createdAt < todayMs) {
          // Task is from a previous day — drop it
          return;
        }
        // For surviving tasks: if interrupted in 'running' state, reset any 'loading' chunk back to 'pending'
        if (task.status === 'running' && Array.isArray(task.chunkStatuses)) {
          task.chunkStatuses = task.chunkStatuses.map((c) =>
            c.status === 'loading' ? { ...c, status: 'pending' } : c
          );
        }
        cleaned[taskId] = task;
      });
      return cleaned;
    } catch {
      return {};
    }
  });

  const [dismissedTaskId, setDismissedTaskId] = useState(null);

  // ── Per-chunk inline "Auto Translate & IPA" (visual editor) ──
  // Lets the user (re)run translation for each 25-segment block independently, and retry
  // just the failed block. Keyed by chunk index → { status: 'idle'|'loading'|'done'|'error', errorMsg }.
  const TRANSLATE_CHUNK_SIZE = 25;
  const [chunkTranslateStatus, setChunkTranslateStatus] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Synced active running locks
  const activeRunnersRef = useRef(new Set());

  // Save tasks to localStorage on change
  useEffect(() => {
    localStorage.setItem('vocabflow_ai_tasks', JSON.stringify(aiTasks));
  }, [aiTasks]);

  // Periodic auto-cleanup: every hour, drop tasks from previous days (handles tabs left open across midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayMs = startOfToday.getTime();

      setAiTasks((prev) => {
        const next = {};
        let changed = false;
        Object.keys(prev).forEach((taskId) => {
          const task = prev[taskId];
          if (!task) return;
          if (typeof task.createdAt === 'number' && task.createdAt >= todayMs) {
            next[taskId] = task;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 60 * 60 * 1000); // every hour

    return () => clearInterval(interval);
  }, []);

  // Keep a ref of aiTasks to prevent stale closures in async execution loop
  const aiTasksRef = useRef(aiTasks);
  useEffect(() => {
    aiTasksRef.current = aiTasks;
  }, [aiTasks]);

  // Derived state to check which task types are running
  const isMerging = useMemo(() => {
    return aiTasks[`${videoId}_merge`]?.status === 'running';
  }, [aiTasks, videoId]);

  const isParagraphBreaking = useMemo(() => {
    return aiTasks[`${videoId}_paragraph`]?.status === 'running';
  }, [aiTasks, videoId]);

  const isTranslating = useMemo(() => {
    return aiTasks[`${videoId}_translate`]?.status === 'running';
  }, [aiTasks, videoId]);

  // ── Derived ──
  const segmentCount = segments.length;
  const jsonParsedCount = useMemo(() => {
    if (!jsonText.trim()) return null;
    try {
      const fixed = autoFixJson(jsonText);
      const arr = JSON.parse(fixed);
      return Array.isArray(arr) ? arr.length : null;
    } catch {
      return null;
    }
  }, [jsonText]);

  // ── Fetch existing segments + video title ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await myVideoSegmentApi.getByVideoId(videoId);
      const payload = res?.data;

      if (payload?.videoDetail) {
        setVideoTitle(payload.videoDetail.title || '');
      }

      if (payload?.segments && Array.isArray(payload.segments)) {
        // Map API field names → Editor field names
        const normalized = payload.segments.map((s, i) => ({
          id: s.id, // Primary key id
          segmentOrder: s.segmentOrder ?? i + 1,
          start: s.startTime ?? 0,
          end: s.endTime ?? 0,
          text: s.englishText ?? '',
          vietnameseTranslation: s.vietnameseTranslation ?? '',
          ipa: s.ipa ?? '',
          lineBreakBefore: !!s.lineBreakBefore,
        }));
        setSegments(normalized);
        setJsonText(JSON.stringify(normalized, null, 2));
      }
    } catch (err) {
      message.error(err?.message || 'Không thể tải dữ liệu segments.');
    } finally {
      setLoading(false);
      setHasChanges(false);
      setMergeHistory([]);
    }
  }, [videoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Sync JSON text when switching TO json tab ──
  useEffect(() => {
    if (activeTab === 'json') {
      setJsonText(JSON.stringify(segments, null, 2));
      setJsonError('');
    }
  }, [activeTab, segments]);

  // ── Visual editor handlers (Optimized to be referentially stable) ──
  const handleSegmentChange = useCallback((index, updated) => {
    setSegments((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
    setHasChanges(true);
    setMergeHistory([]);
  }, []);

  const handleDeleteSegment = useCallback((index) => {
    setSegments((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const nextCount = next.length;

      // Adjust page if current page becomes empty
      const maxPage = Math.max(1, Math.ceil(nextCount / PAGE_SIZE));
      setTimeout(() => {
        setCurrentPage((curr) => Math.min(curr, maxPage));
      }, 0);

      return next.map((s, i) => ({ ...s, segmentOrder: i + 1 }));
    });
    setHasChanges(true);
    setMergeHistory([]);
  }, []);

  const handleAddSegment = useCallback(() => {
    setSegments((prev) => {
      const lastSeg = prev[prev.length - 1];
      const newStart = lastSeg ? lastSeg.end : 0;
      const nextCount = prev.length + 1;

      // Automatically jump to the last page when a segment is added
      const lastPage = Math.ceil(nextCount / PAGE_SIZE);
      setTimeout(() => {
        setCurrentPage(lastPage);
      }, 0);

      return [
        ...prev,
        {
          segmentOrder: nextCount,
          start: parseFloat(newStart.toFixed(2)),
          end: parseFloat((newStart + 3).toFixed(2)),
          text: '',
          vietnameseTranslation: '',
          ipa: '',
          lineBreakBefore: false,
        },
      ];
    });
    setHasChanges(true);
    setMergeHistory([]);

    setTimeout(() => {
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  const handleMergeSegment = useCallback((index) => {
    setSegments((prev) => {
      if (index < 0 || index >= prev.length - 1) return prev;

      const snapshot = prev.map((s) => ({ ...s }));
      const current = prev[index];
      const next = prev[index + 1];
      const mergeText = (a, b) => [a, b].filter((v) => v && String(v).trim()).join(' ').trim();

      const mergedSegment = {
        ...current,
        start: current.start,
        end: next.end,
        text: mergeText(current.text, next.text),
        vietnameseTranslation: mergeText(current.vietnameseTranslation, next.vietnameseTranslation),
        ipa: mergeText(current.ipa, next.ipa),
      };

      const nextSegments = [
        ...prev.slice(0, index),
        mergedSegment,
        ...prev.slice(index + 2),
      ].map((s, i) => ({ ...s, segmentOrder: i + 1 }));

      setMergeHistory((history) => [...history, snapshot]);
      setHasChanges(true);

      setTimeout(() => {
        message.success(`Đã gộp phân đoạn #${index + 1} và #${index + 2}.`);
      }, 0);

      return nextSegments;
    });
  }, []);

  const handleRollbackMerge = useCallback(() => {
    setMergeHistory((prevHistory) => {
      if (prevHistory.length === 0) {
        message.info('Không có thao tác gộp để hoàn tác.');
        return prevHistory;
      }

      const previousSegments = prevHistory[prevHistory.length - 1].map((s) => ({ ...s }));
      setSegments(previousSegments);
      setHasChanges(true);

      setTimeout(() => {
        message.success('Đã hoàn tác thao tác gộp gần nhất.');
      }, 0);

      return prevHistory.slice(0, -1);
    });
  }, []);

  // ── JSON editor handlers ──
  const parseJsonErrorLine = (errorMsg, jsonStr) => {
    // Try to extract line from message like "at position 813 (line 27 column 50)"
    const lineMatch = errorMsg.match(/line\s+(\d+)/i);
    if (lineMatch) return parseInt(lineMatch[1], 10);

    // Fallback: extract position and calculate line
    const posMatch = errorMsg.match(/position\s+(\d+)/i);
    if (posMatch && jsonStr) {
      const pos = parseInt(posMatch[1], 10);
      const upToPos = jsonStr.substring(0, pos);
      return (upToPos.match(/\n/g) || []).length + 1;
    }
    return null;
  };

  const scrollToJsonErrorLine = useCallback((lineNum) => {
    if (!lineNum || !jsonEditorRef.current) return;
    const textarea = jsonEditorRef.current?.querySelector('textarea');
    if (!textarea) return;
    const lineHeight = 22.1; // matches CSS line-height
    const scrollTarget = Math.max(0, (lineNum - 5) * lineHeight);
    textarea.scrollTop = scrollTarget;
    // Also scroll the line numbers
    const lineNumEl = jsonEditorRef.current?.querySelector('.' + styles.jsonLineNumbers);
    if (lineNumEl) lineNumEl.scrollTop = scrollTarget;
  }, []);

  const handleJsonChange = (e) => {
    const value = e.target.value;
    setJsonText(value);
    setJsonError('');
    setJsonErrorLine(null);
    setHasChanges(true);
    setMergeHistory([]);

    if (value.trim()) {
      try {
        const fixed = autoFixJson(value);
        const parsed = JSON.parse(fixed);
        if (!Array.isArray(parsed)) {
          setJsonError('JSON phải là một Mảng (Array).');
          setJsonErrorLine(null);
        }
      } catch (err) {
        const errLine = parseJsonErrorLine(err.message, value);
        setJsonError(`JSON không hợp lệ: ${err.message}`);
        setJsonErrorLine(errLine);
      }
    }
  };

  // Format JSON
  const handleFormatJson = useCallback(() => {
    if (!jsonText.trim()) {
      message.warning('Không có nội dung JSON để format.');
      return;
    }
    try {
      // Auto-escape any unescaped double quotes inside values first
      const fixedJson = autoFixJson(jsonText);
      const parsed = JSON.parse(fixedJson);
      const formatted = JSON.stringify(parsed, null, 2);
      
      setJsonText(formatted);
      setJsonError('');
      setJsonErrorLine(null);
      setHasChanges(true);
      
      if (fixedJson !== jsonText) {
        message.success('Đã tự động sửa lỗi dấu nháy kép và format JSON thành công!');
      } else {
        message.success('JSON đã được format!');
      }
      
      // Reset scroll to top
      setTimeout(() => {
        const textarea = jsonEditorRef.current?.querySelector('textarea');
        if (textarea) textarea.scrollTop = 0;
        const lineNumEl = jsonEditorRef.current?.querySelector('.' + styles.jsonLineNumbers);
        if (lineNumEl) lineNumEl.scrollTop = 0;
      }, 50);
    } catch (err) {
      const errLine = parseJsonErrorLine(err.message, jsonText);
      setJsonError(`Không thể format — JSON không hợp lệ: ${err.message}`);
      setJsonErrorLine(errLine);
      if (errLine) {
        setTimeout(() => scrollToJsonErrorLine(errLine), 100);
      }
    }
  }, [jsonText, scrollToJsonErrorLine]);

  // Sync scroll between line numbers and textarea
  const handleJsonScroll = useCallback((e) => {
    const lineNumEl = jsonEditorRef.current?.querySelector('.' + styles.jsonLineNumbers);
    if (lineNumEl) lineNumEl.scrollTop = e.target.scrollTop;
  }, []);

  // ── Get current segments (from either mode) ──
  const getCurrentSegments = () => {
    if (activeTab === 'json') {
      if (!jsonText.trim()) return null;
      try {
        const fixed = autoFixJson(jsonText);
        const parsed = JSON.parse(fixed);
        if (!Array.isArray(parsed)) return null;
        return parsed;
      } catch {
        return null;
      }
    }
    return segments;
  };

  // ── Export / Copy ──
  const handleExport = () => {
    const data = getCurrentSegments();
    if (!data || data.length === 0) {
      message.warning('Không có phân đoạn để xuất.');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segments_video_${videoId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Tải file JSON thành công!');
  };

  const handleCopy = async () => {
    const data = getCurrentSegments();
    if (!data || data.length === 0) {
      message.warning('Không có phân đoạn để copy.');
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(true);
      message.success('Đã copy dữ liệu JSON vào Clipboard!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      message.error('Không thể copy vào clipboard. Vui lòng thử lại.');
    }
  };

  const handleCopyPrompt = () => {
    const promptText = `Please act as a data processing expert for a language learning application. I will provide you with JSON arrays containing video subtitle segments in subsequent messages. Your task is to process, enrich, and optimize this JSON data based on the following strict instructions:

1. ENRICH MISSING FIELDS:
- "vietnameseTranslation": Provide an accurate, natural-sounding Vietnamese translation for the "text".
- "ipa": Provide the standard International Phonetic Alphabet (IPA) transcription for the English "text".
- "lineBreakBefore": Evaluate the context and set this to \`true\` if a natural pause or a new paragraph should start before this segment; otherwise, keep it \`false\`.

2. SMART MERGING OF SEGMENTS:
- Analyze adjacent segments. If sentences are unnaturally fragmented (cut off mid-sentence) or if the segments are too short and contextually belong together, you MUST merge them into a single, cohesive segment.
- LENGTH CONSTRAINT (CRITICAL): Do NOT merge segments into overly long sentences. These segments are used for Dictation and Shadowing exercises. Keep the merged segments concise, natural, and manageable for a language learner to listen and repeat. If a sentence is naturally very long, leave it as manageable, logical chunks.
- TIMESTAMP MERGING: When merging segments, the new "start" time must be the start time of the first segment, and the new "end" time must be the end time of the last segment in the group.
- TEXT MERGING (STRICT RULE): When combining the "text" of merged segments, just concatenate them with a single space. YOU ARE ABSOLUTELY FORBIDDEN FROM ADDING, REMOVING, OR MODIFYING ANY WORDS from the original "text". The combined text must be an exact match of the original parts.
- IDs and ORDERING: Keep the "id" of the first segment in the merged group. After all merging is done, re-index the "segmentOrder" so it strictly follows a sequential order (1, 2, 3, etc.).

3. OUTPUT REQUIREMENT:
Output ONLY the final, processed valid JSON array. Do not include any markdown formatting like \`\`\`json, greetings, explanations, or conversational filler. I only need the raw JSON code.

If you understand these instructions perfectly, please reply ONLY with "UNDERSTOOD. Please provide the JSON data."`;

    navigator.clipboard.writeText(promptText);
    message.success('Đã sao chép prompt hướng dẫn cho Gemini Pro!');
  };

  const executeNextChunk = useCallback(async (taskId) => {
    const task = aiTasksRef.current[taskId];
    if (!task || task.status !== 'running') return;

    // Find first chunk that is not 'done'
    const chunkIndex = task.chunkStatuses.findIndex(c => c.status !== 'done');
    if (chunkIndex === -1) {
      // All chunks done!
      setAiTasks(prev => {
        const t = prev[taskId];
        if (!t) return prev;
        return {
          ...prev,
          [taskId]: { ...t, status: 'completed' }
        };
      });
      activeRunnersRef.current.delete(taskId);
      message.success(`Tác vụ ${getTaskName(task.taskType)} đã hoàn thành!`);
      return;
    }

    // Set chunk status to 'loading'
    setAiTasks(prev => {
      const t = prev[taskId];
      if (!t) return prev;
      return {
        ...prev,
        [taskId]: {
          ...t,
          chunkStatuses: t.chunkStatuses.map((c, idx) => idx === chunkIndex ? { ...c, status: 'loading' } : c)
        }
      };
    });

    try {
      if (task.taskType === 'translate') {
        const res = await myVideoSegmentApi.autoTranslateIpaChunk(videoId, chunkIndex, 25);
        const payload = res.data;
        if (payload?.segments && Array.isArray(payload.segments)) {
          const segmentMap = {};
          payload.segments.forEach((s) => {
            const order = s.segmentOrder;
            if (order != null) {
              segmentMap[order] = {
                vietnameseTranslation: s.vietnameseTranslation ?? '',
                ipa: s.ipa ?? '',
              };
            }
          });
          setSegments(prev =>
            prev.map(seg => {
              const updated = segmentMap[seg.segmentOrder];
              if (updated && (updated.vietnameseTranslation || updated.ipa)) {
                return { ...seg, vietnameseTranslation: updated.vietnameseTranslation, ipa: updated.ipa };
              }
              return seg;
            })
          );
        }
      } else if (task.taskType === 'merge') {
        const res = await myVideoSegmentApi.autoMergeSegments(videoId, chunkIndex, 50);
        const payload = res.data;
        if (payload?.segments && Array.isArray(payload.segments)) {
          const normalized = payload.segments.map((s, idx) => ({
            id: s.id,
            segmentOrder: s.segmentOrder ?? idx + 1,
            start: s.startTime ?? 0,
            end: s.endTime ?? 0,
            text: s.englishText ?? '',
            vietnameseTranslation: s.vietnameseTranslation ?? '',
            ipa: s.ipa ?? '',
            lineBreakBefore: !!s.lineBreakBefore,
          }));
          setSegments(normalized);
          setJsonText(JSON.stringify(normalized, null, 2));
        }
      } else if (task.taskType === 'paragraph') {
        const res = await myVideoSegmentApi.autoParagraphBreak(videoId, chunkIndex, 100);
        const payload = res.data;
        if (payload?.segments && Array.isArray(payload.segments)) {
          const normalized = payload.segments.map((s, idx) => ({
            id: s.id,
            segmentOrder: s.segmentOrder ?? idx + 1,
            start: s.startTime ?? 0,
            end: s.endTime ?? 0,
            text: s.englishText ?? '',
            vietnameseTranslation: s.vietnameseTranslation ?? '',
            ipa: s.ipa ?? '',
            lineBreakBefore: !!s.lineBreakBefore,
          }));
          setSegments(normalized);
          setJsonText(JSON.stringify(normalized, null, 2));
        }
      } else if (task.taskType === 'fillBlank') {
        await myVideoSegmentApi.autoGenerateBlanks(videoId, chunkIndex, 50);
        setRefreshTrigger(prev => prev + 1);
      } else if (task.taskType === 'quiz') {
        await myVideoSegmentApi.autoGenerateQuizzes(videoId, chunkIndex, 100);
        setRefreshTrigger(prev => prev + 1);
      }

      // Compute allDone synchronously (don't rely on setState updater side effects in React 18 batched mode)
      const currentTaskState = aiTasksRef.current[taskId];
      if (!currentTaskState) return;
      const nextStatuses = currentTaskState.chunkStatuses.map((c, idx) => idx === chunkIndex ? { ...c, status: 'done' } : c);
      const allDone = nextStatuses.every(c => c.status === 'done');

      // Mark chunk as done (and task completed if all chunks finished)
      setAiTasks(prev => {
        const t = prev[taskId];
        if (!t) return prev;
        return {
          ...prev,
          [taskId]: {
            ...t,
            status: allDone ? 'completed' : 'running',
            chunkStatuses: nextStatuses
          }
        };
      });

      if (allDone) {
        activeRunnersRef.current.delete(taskId);
        message.success(`Tác vụ "${getTaskName(task.taskType)}" đã hoàn thành!`);
        return;
      }

      // Add a small delay between chunks to avoid rate limiting
      setTimeout(() => {
        executeNextChunk(taskId);
      }, 800);

    } catch (err) {
      console.error(`Chunk execution failed for task ${taskId}:`, err);
      // Mark chunk as error, set task as failed
      setAiTasks(prev => {
        const t = prev[taskId];
        if (!t) return prev;
        return {
          ...prev,
          [taskId]: {
            ...t,
            status: 'failed',
            chunkStatuses: t.chunkStatuses.map((c, idx) => idx === chunkIndex ? { ...c, status: 'error', errorMsg: err?.message || 'Lỗi không xác định' } : c)
          }
        };
      });
      activeRunnersRef.current.delete(taskId);
      message.error(`Tác vụ ${getTaskName(task.taskType)} gặp lỗi ở phần ${chunkIndex + 1}: ${err?.message || 'Lỗi không xác định'}`);
    } finally {
      const currentTask = aiTasksRef.current[taskId];
      if (!currentTask || currentTask.status !== 'running') {
        activeRunnersRef.current.delete(taskId);
      }
    }
  }, [videoId]);

  // Resume running tasks on mount or when aiTasks/videoId changes
  useEffect(() => {
    Object.keys(aiTasks).forEach(taskId => {
      const task = aiTasks[taskId];
      if (task && task.status === 'running' && task.videoId === Number(videoId)) {
        if (!activeRunnersRef.current.has(taskId)) {
          activeRunnersRef.current.add(taskId);
          executeNextChunk(taskId);
        }
      }
    });
  }, [aiTasks, videoId, executeNextChunk]);

  // Task Name Helper
  const getTaskName = (taskType) => {
    switch (taskType) {
      case 'translate': return 'Dịch nghĩa & Tạo IPA (AI)';
      case 'merge': return 'Tự động gộp phân đoạn (AI)';
      case 'paragraph': return 'Tự động ngắt đoạn (AI)';
      case 'fillBlank': return 'Tự động tạo điền từ (AI)';
      case 'quiz': return 'Tự động tạo câu hỏi (AI)';
      default: return 'Tác vụ AI';
    }
  };

  const handlePauseTask = useCallback((taskId) => {
    setAiTasks(prev => {
      const t = prev[taskId];
      if (!t) return prev;
      return {
        ...prev,
        [taskId]: {
          ...t,
          status: 'paused'
        }
      };
    });
    activeRunnersRef.current.delete(taskId);
    message.info('Đã tạm dừng tác vụ AI.');
  }, []);

  const handleResumeTask = useCallback((taskId) => {
    setAiTasks(prev => {
      const t = prev[taskId];
      if (!t) return prev;
      return {
        ...prev,
        [taskId]: {
          ...t,
          status: 'running',
          chunkStatuses: t.chunkStatuses.map(c => 
            c.status === 'error' || c.status === 'loading' || c.status === 'pending'
              ? { ...c, status: 'pending', errorMsg: '' }
              : c
          )
        }
      };
    });
    setDismissedTaskId(null);
  }, []);

  const handleRetryTask = useCallback((taskId) => {
    setAiTasks(prev => {
      const t = prev[taskId];
      if (!t) return prev;
      return {
        ...prev,
        [taskId]: {
          ...t,
          status: 'running',
          chunkStatuses: t.chunkStatuses.map(c => c.status === 'error' ? { ...c, status: 'pending', errorMsg: '' } : c)
        }
      };
    });
    setDismissedTaskId(null);
  }, []);

  const handleRetrySingleChunk = useCallback((taskId, chunkIndex) => {
    setAiTasks(prev => {
      const t = prev[taskId];
      if (!t) return prev;
      return {
        ...prev,
        [taskId]: {
          ...t,
          status: 'running',
          chunkStatuses: t.chunkStatuses.map((c, idx) => idx === chunkIndex ? { ...c, status: 'pending', errorMsg: '' } : c)
        }
      };
    });
    setDismissedTaskId(null);
  }, []);

  // ── Auto Merge Segments (AI) ──
  const handleAutoMerge = () => {
    if (segments.length === 0) {
      message.warning('Không có phân đoạn để gộp.');
      return;
    }
    const totalChunks = Math.ceil(segments.length / 50);
    const taskId = `${videoId}_merge`;
    const newTask = {
      id: taskId,
      videoId: Number(videoId),
      taskType: 'merge',
      status: 'running',
      totalChunks,
      chunkStatuses: Array.from({ length: totalChunks }, (_, i) => ({ index: i, status: 'pending', errorMsg: '' })),
      createdAt: Date.now()
    };
    setAiTasks(prev => ({ ...prev, [taskId]: newTask }));
    setDismissedTaskId(null);
  };

  // ── Auto Paragraph Break (AI) ──
  const handleAutoParagraphBreak = () => {
    if (segments.length === 0) {
      message.warning('Không có phân đoạn để ngắt đoạn.');
      return;
    }
    const totalChunks = Math.ceil(segments.length / 100);
    const taskId = `${videoId}_paragraph`;
    const newTask = {
      id: taskId,
      videoId: Number(videoId),
      taskType: 'paragraph',
      status: 'running',
      totalChunks,
      chunkStatuses: Array.from({ length: totalChunks }, (_, i) => ({ index: i, status: 'pending', errorMsg: '' })),
      createdAt: Date.now()
    };
    setAiTasks(prev => ({ ...prev, [taskId]: newTask }));
    setDismissedTaskId(null);
  };

  // ── Auto Translate & IPA (AI) ──
  const handleAutoTranslateIpa = () => {
    if (segments.length === 0) {
      message.warning('Không có phân đoạn để dịch.');
      return;
    }
    const totalChunks = Math.ceil(segments.length / 25);
    const taskId = `${videoId}_translate`;
    const newTask = {
      id: taskId,
      videoId: Number(videoId),
      taskType: 'translate',
      status: 'running',
      totalChunks,
      chunkStatuses: Array.from({ length: totalChunks }, (_, i) => ({ index: i, status: 'pending', errorMsg: '' })),
      createdAt: Date.now()
    };
    setAiTasks(prev => ({ ...prev, [taskId]: newTask }));
    setDismissedTaskId(null);
  };

  // ── Per-chunk inline Auto Translate & IPA (visual editor) ──
  // Calls the same auto-translate-ipa-chunk endpoint for one 25-segment block, updating just
  // that block's status so a failed chunk can be retried on its own.
  const handleTranslateChunk = useCallback(async (chunkIndex) => {
    setChunkTranslateStatus((prev) => ({ ...prev, [chunkIndex]: { status: 'loading', errorMsg: '' } }));
    try {
      const res = await myVideoSegmentApi.autoTranslateIpaChunk(videoId, chunkIndex, TRANSLATE_CHUNK_SIZE);
      const payload = res.data;
      if (payload?.segments && Array.isArray(payload.segments)) {
        const segmentMap = {};
        payload.segments.forEach((s) => {
          const order = s.segmentOrder;
          if (order != null) {
            segmentMap[order] = {
              vietnameseTranslation: s.vietnameseTranslation ?? '',
              ipa: s.ipa ?? '',
            };
          }
        });
        setSegments((prev) =>
          prev.map((seg) => {
            const updated = segmentMap[seg.segmentOrder];
            if (updated && (updated.vietnameseTranslation || updated.ipa)) {
              return {
                ...seg,
                vietnameseTranslation: updated.vietnameseTranslation || seg.vietnameseTranslation,
                ipa: updated.ipa || seg.ipa,
              };
            }
            return seg;
          })
        );
      }
      setChunkTranslateStatus((prev) => ({ ...prev, [chunkIndex]: { status: 'done', errorMsg: '' } }));
      message.success(`Đã dịch & tạo IPA cho phần ${chunkIndex + 1}!`);
    } catch (err) {
      const msg = err?.message || 'AI hệ thống đang quá tải, vui lòng thử lại';
      setChunkTranslateStatus((prev) => ({ ...prev, [chunkIndex]: { status: 'error', errorMsg: msg } }));
      message.error(`Phần ${chunkIndex + 1} dịch lỗi: ${msg}`);
    }
  }, [videoId]);
  const handleStartAiTask = useCallback((taskType) => {
    if (segments.length === 0) {
      message.warning('Không có phân đoạn để phân tích.');
      return;
    }

    // Chunk size MUST match what executeNextChunk sends per task type
    // (fillBlank = 50, quiz = 100), otherwise the number of chunk slots won't line up.
    const chunkSize = taskType === 'quiz' ? 100 : 50;
    const totalChunks = Math.ceil(segments.length / chunkSize);
    const taskId = `${videoId}_${taskType}`;
    const newTask = {
      id: taskId,
      videoId: Number(videoId),
      taskType,
      status: 'running',
      totalChunks,
      chunkStatuses: Array.from({ length: totalChunks }, (_, i) => ({ index: i, status: 'pending', errorMsg: '' })),
      createdAt: Date.now()
    };

    setAiTasks(prev => ({ ...prev, [taskId]: newTask }));
    setDismissedTaskId(null);
  }, [segments.length, videoId]);

  const handleReuploadSubtitles = async (file) => {
    const filenameLower = file.name.toLowerCase();
    if (!filenameLower.endsWith('.json') && !filenameLower.endsWith('.srt')) {
      message.error('Chỉ chấp nhận file phụ đề dạng .json hoặc .srt!');
      return false;
    }

    setReuploading(true);
    message.loading({ content: 'Đang tải lên và xử lý file phụ đề mới...', key: 'reuploadSub', duration: 0 });
    try {
      const parsed = await myVideoApi.parseCapcutFile(file);

      if (!parsed || parsed.length === 0) {
        message.warning({ content: 'File phụ đề rỗng hoặc không hợp lệ!', key: 'reuploadSub', duration: 4 });
        setReuploading(false);
        return false;
      }

      const payload = parsed.map((seg, index) => ({
        id: index + 1,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        vietnameseTranslation: '',
        ipa: '',
        lineBreakBefore: false,
      }));

      await myVideoSegmentApi.updateSegments(videoId, payload);

      message.success({ content: 'Tải lại và ghi đè phụ đề mới thành công!', key: 'reuploadSub', duration: 3 });
      
      await fetchData();
    } catch (err) {
      console.error("Re-upload subtitles failed:", err);
      message.error({ content: err?.message || 'Có lỗi xảy ra khi ghi đè phụ đề mới.', key: 'reuploadSub', duration: 5 });
    } finally {
      setReuploading(false);
    }
    return false;
  };

  const handleSave = async () => {
    const data = getCurrentSegments();
    if (!data) {
      message.error(activeTab === 'json' ? 'JSON không hợp lệ.' : 'Không có dữ liệu.');
      return false;
    }
    if (data.length === 0) {
      message.warning('Danh sách phân đoạn trống.');
      return false;
    }

    // Mapping editor format to API expectations
    const payload = data.map((s, i) => ({
      id: s.segmentOrder ?? i + 1,
      start: s.start ?? s.startTime ?? 0,
      end: s.end ?? s.endTime ?? 0,
      text: s.text ?? s.englishText ?? '',
      vietnameseTranslation: s.vietnameseTranslation ?? '',
      ipa: s.ipa ?? '',
      lineBreakBefore: !!s.lineBreakBefore,
    }));

    setSaving(true);
    try {
      await myVideoSegmentApi.updateSegments(videoId, payload);
      message.success(`Đã lưu ${payload.length} phân đoạn thành công!`);
      setHasChanges(false);
      setMergeHistory([]);

      // If saved in JSON mode, update visual state
      if (activeTab === 'json') {
        const fixed = autoFixJson(jsonText);
        const parsed = JSON.parse(fixed);
        const formatted = JSON.stringify(parsed, null, 2);
        setJsonText(formatted);
        setSegments(parsed.map((s, i) => ({
          id: s.id,
          segmentOrder: s.segmentOrder ?? i + 1,
          start: s.start ?? s.startTime ?? 0,
          end: s.end ?? s.endTime ?? 0,
          text: s.text ?? s.englishText ?? '',
          vietnameseTranslation: s.vietnameseTranslation ?? '',
          ipa: s.ipa ?? '',
          lineBreakBefore: !!s.lineBreakBefore,
        })));
      }
      return true;
    } catch (err) {
      message.error(err?.message || 'Lỗi khi lưu phân đoạn.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (hasChanges) {
      const confirmSave = window.confirm('Bạn có thay đổi chưa lưu. Lưu thay đổi trước khi quay lại?');
      if (confirmSave) {
        const success = await handleSave();
        if (!success) return;
      }
    }
    navigate('/my-video');
  };

  // ── Tab configs ──
  const tabItems = [
    {
      key: 'visual',
      label: (
        <span className={styles.tabLabel}>
          <UnorderedListOutlined />
          Chỉnh sửa trực quan
        </span>
      ),
    },
    {
      key: 'json',
      label: (
        <span className={styles.tabLabel}>
          <CodeOutlined />
          Soạn thảo JSON
        </span>
      ),
    },
  ];

  const workspaceTabItems = [
    { key: 'segments', label: 'Segments - phân đoạn' },
    { key: 'fillBlank', label: 'Quản lý fill blank' },
    { key: 'quiz', label: 'Quản lý quiz' },
    { key: 'aiTasksTab', label: 'Tiến trình AI Tasks' },
    { key: 'geminiKeys', label: 'Quản lý Gemini Keys' },
  ];

  // Derive current task to show in immediate progress panel
  const activeTask = useMemo(() => {
    return Object.values(aiTasks).find(t => t.videoId === Number(videoId) && t.status === 'running');
  }, [aiTasks, videoId]);

  const latestTask = useMemo(() => {
    return Object.values(aiTasks)
      .filter(t => t.videoId === Number(videoId))
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [aiTasks, videoId]);

  const currentTaskToShow = (activeTask && activeTask.id !== dismissedTaskId) ? activeTask : ((latestTask && latestTask.id !== dismissedTaskId) ? latestTask : null);

  return (
    <div ref={containerRef} className={styles.segmentsPage} style={{ background: '#ffffff', minHeight: '100vh', padding: '24px 30px' }}>
      {/* ════════════════ 1. HEADER AT THE VERY TOP ════════════════ */}
      <div className={styles.pageHeader} style={{ marginBottom: 20 }}>
        <div className={styles.headerLeft} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className={styles.backBtn}
            style={{ borderRadius: 6 }}
          >
            Quay lại
          </Button>
          <div className={styles.headerInfo} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className={styles.headerMeta} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 600 }}>Video ID: {videoId}</Tag>
              {videoTitle && (
                <Text type="secondary" className={styles.videoTitleText}>
                  {videoTitle}
                </Text>
              )}
              <Tag color={segmentCount > 0 ? 'success' : 'default'} style={{ borderRadius: 4 }}>
                {segmentCount} phân đoạn
              </Tag>
              {hasChanges && (
                <Tag icon={<WarningOutlined />} color="warning" style={{ borderRadius: 4 }}>
                  Chưa lưu
                </Tag>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Spin size="large" />
          <Text type="secondary" style={{ marginTop: 16 }}>Đang tải dữ liệu phân đoạn...</Text>
        </div>
      ) : (
        <>
          {/* ════════════════ 2. TABS BELOW THE HEADER ════════════════ */}
          <Tabs
            activeKey={workspaceTab}
            onChange={setWorkspaceTab}
            items={workspaceTabItems}
            className={styles.workspaceTabs}
            size="large"
            type="card"
            style={{ marginBottom: 16 }}
            tabBarExtraContent={
              <Button
                type="text"
                icon={<InfoCircleOutlined style={{ color: '#6366f1', fontSize: 16 }} />}
                onClick={() => setHelpVisible(true)}
                style={{ fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}
              >
                Hướng dẫn sử dụng
              </Button>
            }
          />

          {/* ═══ Centralized Chunk Progress Panel ═══ */}
          {currentTaskToShow && (currentTaskToShow.status === 'running' || currentTaskToShow.status === 'failed') && (
            <div className={styles.chunkPanel} style={{ marginBottom: 16 }}>
              <div className={styles.chunkPanelHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RobotOutlined style={{ color: '#6366f1' }} />
                  <Text strong style={{ fontSize: 13 }}>
                    {getTaskName(currentTaskToShow.taskType)}
                  </Text>
                  <Tag color="blue" style={{ borderRadius: 4, fontWeight: 600, margin: 0 }}>
                    {currentTaskToShow.chunkStatuses.filter((c) => c.status === 'done').length}/{currentTaskToShow.totalChunks}
                  </Tag>
                  {currentTaskToShow.chunkStatuses.some((c) => c.status === 'error') && (
                    <Tag color="error" style={{ borderRadius: 4, fontWeight: 600, margin: 0 }}>
                      {currentTaskToShow.chunkStatuses.filter((c) => c.status === 'error').length} lỗi
                    </Tag>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {currentTaskToShow.status === 'failed' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<RedoOutlined />}
                      onClick={() => handleRetryTask(currentTaskToShow.id)}
                      style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
                    >
                      Thử lại tác vụ
                    </Button>
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={() => setDismissedTaskId(currentTaskToShow.id)}
                    style={{ color: '#94a3b8' }}
                  />
                </div>
              </div>
              <Progress
                percent={Math.round(
                  (currentTaskToShow.chunkStatuses.filter((c) => c.status === 'done').length / currentTaskToShow.totalChunks) * 100
                )}
                size="small"
                strokeColor={currentTaskToShow.status === 'failed' ? '#ef4444' : '#6366f1'}
                style={{ marginBottom: 8 }}
              />
              <div className={styles.chunkGrid}>
                {currentTaskToShow.chunkStatuses.map((chunk) => {
                  const currentBatchSize = currentTaskToShow.taskType === 'translate' ? 40 : (currentTaskToShow.taskType === 'quiz' ? 100 : 50);
                  const startSeg = chunk.index * currentBatchSize + 1;
                  const endSeg = Math.min((chunk.index + 1) * currentBatchSize, segments.length);
                  return (
                    <div
                      key={chunk.index}
                      className={`${styles.chunkItem} ${styles[`chunkItem_${chunk.status}`]}`}
                    >
                      <div className={styles.chunkItemLeft}>
                        {chunk.status === 'done' && <CheckCircleFilled style={{ color: '#10b981', fontSize: 14 }} />}
                        {chunk.status === 'error' && <CloseCircleFilled style={{ color: '#ef4444', fontSize: 14 }} />}
                        {chunk.status === 'loading' && <LoadingOutlined style={{ color: '#6366f1', fontSize: 14 }} />}
                        {chunk.status === 'pending' && <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#e2e8f0', display: 'inline-block' }} />}
                        <Text style={{ fontSize: 12, fontWeight: 500 }}>
                          Phần {chunk.index + 1} <Text type="secondary" style={{ fontSize: 11 }}>(#{startSeg}–{endSeg})</Text>
                        </Text>
                      </div>
                      <div className={styles.chunkItemRight}>
                        {chunk.status === 'error' && (
                          <>
                            <Tooltip title={chunk.errorMsg}>
                              <Text type="danger" style={{ fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                {chunk.errorMsg}
                              </Text>
                            </Tooltip>
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<RedoOutlined />}
                              onClick={() => handleRetrySingleChunk(currentTaskToShow.id, chunk.index)}
                              style={{ borderRadius: 4, fontSize: 11, height: 24, padding: '0 8px' }}
                            >
                              Thử lại
                            </Button>
                          </>
                        )}
                        {chunk.status === 'done' && (
                          <Tag color="success" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>Xong</Tag>
                        )}
                        {chunk.status === 'loading' && (
                          <Tag color="processing" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>Đang chạy...</Tag>
                        )}
                        {chunk.status === 'pending' && (
                          <Tag style={{ margin: 0, borderRadius: 4, fontSize: 11, color: '#94a3b8' }}>Chờ</Tag>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ════════════════ 3. ACTION TOOLBAR BELOW TABS (ONLY FOR SEGMENTS TAB) ════════════════ */}
          {workspaceTab === 'segments' && (
            <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <WarningOutlined style={{ color: '#d97706', fontSize: 14 }} />
                  <strong>Lưu ý:</strong> Bạn nên bạn nên sử dụng api key riêng của bạn để AI hoạt động ổn định nhất.
                </span>
              </div>
              <Space size="small" className={styles.toolbar} wrap>
                <Tooltip title="Dùng khi bạn thấy phụ đề rời rạc, muốn câu dài hơn">
                  <Button
                  type="primary"
                  ghost
                  icon={<RobotOutlined />}
                  onClick={handleAutoMerge}
                  loading={isMerging}
                  style={{ fontWeight: 600, borderColor: '#10b981', color: '#10b981' }}
                >
                  Auto Gộp Phân Đoạn (AI)
                </Button>
                </Tooltip>
                <Tooltip title="Dùng để tạo nhanh bản dịch và ipa (sử dụng api key gemini)">
                  <Button
                  type="primary"
                  ghost
                  icon={<RobotOutlined />}
                  onClick={handleAutoTranslateIpa}
                  loading={isTranslating}
                  style={{ fontWeight: 600, borderColor: '#6366f1', color: '#6366f1' }}
                >
                  Dịch nghĩa & Tạo IPA (AI)
                </Button>
                </Tooltip>
               <Tooltip title="Dùng để ngắt đoạn giúp dễ đọc ở phần listening và quiz">
                 <Button
                  type="primary"
                  ghost
                  icon={<RobotOutlined />}
                  onClick={handleAutoParagraphBreak}
                  loading={isParagraphBreaking}
                  style={{ fontWeight: 600, borderColor: '#a855f7', color: '#a855f7' }}
                >
                  Auto Ngắt Đoạn (AI)
                </Button>
               </Tooltip>
                <Upload
                  accept=".json,.srt"
                  maxCount={1}
                  beforeUpload={handleReuploadSubtitles}
                  showUploadList={false}
                  disabled={reuploading}
                >
                  <Button
                    type="primary"
                    ghost
                    icon={<CloudUploadOutlined />}
                    loading={reuploading}
                    style={{
                      fontWeight: 600,
                      borderColor: '#f59e0b',
                      color: '#d97706',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)'
                    }}
                  >
                    Tải lại phụ đề (.srt, .json)
                  </Button>
                </Upload>
                <Tooltip title="Tải lại dữ liệu">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchData}
                    loading={loading}
                  />
                </Tooltip>
                <Tooltip title="Xuất JSON file">
                  <Button icon={<DownloadOutlined />} onClick={handleExport}>
                    Xuất file
                  </Button>
                </Tooltip>
                <Tooltip title="Sao chép toàn bộ JSON">
                  <Button
                    icon={copySuccess ? <CheckCircleOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                    className={copySuccess ? styles.copySuccessBtn : ''}
                  >
                    {copySuccess ? 'Đã Copy!' : 'Copy JSON'}
                  </Button>
                </Tooltip>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                  disabled={activeTab === 'json' && !!jsonError}
                  style={{ fontWeight: 600 }}
                >
                  Lưu phân đoạn
                </Button>
              </Space>
            </div>
            </>
          )}

          <Divider className={styles.headerDivider} style={{ margin: '12px 0 20px 0' }} />

          {/* ════════════════ 4. MAIN CONTENT AREA ════════════════ */}
          {workspaceTab === 'segments' && (
            <Card className={styles.editorCard} styles={{ body: { padding: 0 } }} variant="borderless">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                className={styles.editorTabs}
                tabBarExtraContent={
                  activeTab === 'visual' ? (
                    <Space size="small">
                      <Tooltip title="Hoàn tác thao tác gộp phân đoạn gần nhất">
                        <Button
                          icon={<UndoOutlined />}
                          onClick={handleRollbackMerge}
                          disabled={mergeHistory.length === 0}
                          style={{ borderRadius: 6 }}
                        >
                          Hoàn tác gộp
                        </Button>
                      </Tooltip>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddSegment}
                        className={styles.addSegmentBtn}
                      >
                        Thêm phân đoạn
                      </Button>
                    </Space>
                  ) : (
                    <Space size="small">
                      <Button
                        icon={<FormatPainterOutlined />}
                        onClick={handleFormatJson}
                        style={{ borderRadius: 6, fontWeight: 600, borderColor: '#6366f1', color: '#6366f1' }}
                      >
                        Format JSON
                      </Button>
                      {jsonParsedCount !== null && (
                        <Tag icon={<CheckCircleOutlined />} color="success" className={styles.jsonCountTag}>
                          {jsonParsedCount} phân đoạn hợp lệ
                        </Tag>
                      )}
                    </Space>
                  )
                }
              />

              {/* ──────── Mode A: Visual List ──────── */}
              {activeTab === 'visual' && (
                <div className={styles.visualEditor}>
                  {segments.length === 0 ? (
                    <Empty
                      description="Chưa có phân đoạn nào. Hãy thêm mới hoặc dán JSON."
                      className={styles.emptySegments}
                    />
                  ) : (
                    <>
                      {/* Column headers */}
                      <div className={styles.columnHeaders}>
                        <div className={styles.colHeaderLeft}>
                          <span className={styles.colHeader}>Thứ tự</span>
                          <span className={styles.colHeader}>Timestamps</span>
                        </div>
                        <div className={styles.colHeaderRight}>
                          <span className={styles.colHeader}>Nội dung chi tiết (Text / Dịch nghĩa / IPA)</span>
                        </div>
                        <div className={styles.colHeaderActions} />
                      </div>

                      {/* Scrollable list */}
                      <div className={styles.segmentList} ref={listContainerRef}>
                        {segments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((seg, i) => {
                          const realIndex = (currentPage - 1) * PAGE_SIZE + i;
                          const chunkIndex = Math.floor(realIndex / TRANSLATE_CHUNK_SIZE);
                          const isChunkStart = realIndex % TRANSLATE_CHUNK_SIZE === 0;
                          const cStatus = chunkTranslateStatus[chunkIndex]?.status || 'idle';
                          const cError = chunkTranslateStatus[chunkIndex]?.errorMsg || '';
                          const chunkStartSeg = chunkIndex * TRANSLATE_CHUNK_SIZE + 1;
                          const chunkEndSeg = Math.min((chunkIndex + 1) * TRANSLATE_CHUNK_SIZE, segmentCount);
                          return (
                            <div key={seg.id || `seg-${realIndex}`}>
                              {isChunkStart && (
                                <div className={styles.chunkTranslateBar}>
                                  <Space size={8} wrap>
                                    <Text strong style={{ fontSize: 12 }}>
                                      Phần {chunkIndex + 1}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      (#{chunkStartSeg}–{chunkEndSeg})
                                    </Text>
                                    {cStatus === 'done' && <Tag color="success" style={{ margin: 0 }}>Đã dịch</Tag>}
                                    {cStatus === 'error' && <Tag color="error" style={{ margin: 0 }}>Lỗi</Tag>}
                                    {cStatus === 'error' && cError && (
                                      <Tooltip title={cError}>
                                        <Text type="danger" style={{ fontSize: 11, maxWidth: 240, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                          {cError}
                                        </Text>
                                      </Tooltip>
                                    )}
                                  </Space>
                                  <Button
                                    size="small"
                                    type={cStatus === 'error' ? 'primary' : 'default'}
                                    danger={cStatus === 'error'}
                                    icon={cStatus === 'error' ? <RedoOutlined /> : <RobotOutlined />}
                                    loading={cStatus === 'loading'}
                                    onClick={() => handleTranslateChunk(chunkIndex)}
                                    style={{ borderRadius: 6, fontSize: 12 }}
                                  >
                                    {cStatus === 'error' ? 'Thử lại' : (cStatus === 'done' ? 'Dịch lại' : 'Dịch & IPA (AI)')}
                                  </Button>
                                </div>
                              )}
                              <SegmentRow
                                segment={seg}
                                index={realIndex}
                                onChange={handleSegmentChange}
                                onDelete={handleDeleteSegment}
                                onMerge={handleMergeSegment}
                                totalCount={segmentCount}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Control */}
                      {segments.length > PAGE_SIZE && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, marginBottom: 10 }}>
                          <Pagination
                            current={currentPage}
                            pageSize={PAGE_SIZE}
                            total={segments.length}
                            onChange={(page) => {
                              setCurrentPage(page);
                              if (listContainerRef.current) {
                                listContainerRef.current.scrollTop = 0;
                              }
                            }}
                            showSizeChanger={false}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ──────── Mode B: JSON Editor ──────── */}
              {activeTab === 'json' && (
                <div className={styles.jsonEditor}>
                  {jsonError && (
                    <div
                      className={styles.jsonErrorBanner}
                      onClick={() => jsonErrorLine && scrollToJsonErrorLine(jsonErrorLine)}
                      style={{ cursor: jsonErrorLine ? 'pointer' : 'default' }}
                    >
                      <CloseCircleFilled style={{ color: '#ef4444', fontSize: 15, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
                          {jsonError}
                        </Text>
                        {jsonErrorLine && (
                          <Text style={{ color: '#fbbf24', fontSize: 12, marginLeft: 8, fontWeight: 700 }}>
                            → Dòng {jsonErrorLine} (nhấp để cuộn tới)
                          </Text>
                        )}
                        <div style={{ color: '#93c5fd', fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                          💡 Mẹo: Nhấn nút <b>Format JSON</b> ở góc trên bên phải để tự động sửa các lỗi dấu nháy kép chưa escape!
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={styles.jsonEditorWrapper} ref={jsonEditorRef}>
                    <div className={styles.jsonLineNumbers}>
                      {jsonText.split('\n').map((_, i) => (
                        <div
                          key={i}
                          className={`${styles.jsonLineNum} ${jsonErrorLine === i + 1 ? styles.jsonLineNumError : ''}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <TextArea
                      ref={jsonTextareaRef}
                      value={jsonText}
                      onChange={handleJsonChange}
                      onScroll={handleJsonScroll}
                      rows={22}
                      placeholder='Dán mảng JSON vào đây...'
                      className={`${styles.jsonTextArea} ${jsonError ? styles.jsonTextAreaError : ''}`}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {workspaceTab === 'fillBlank' && (
            <FillBlankTab
              videoId={videoId}
              onStartAiTask={handleStartAiTask}
              isAiGenerating={aiTasks[`${videoId}_fillBlank`]?.status === 'running'}
              refreshTrigger={refreshTrigger}
            />
          )}

          {workspaceTab === 'quiz' && (
            <QuizTab
              videoId={videoId}
              onStartAiTask={handleStartAiTask}
              isAiGenerating={aiTasks[`${videoId}_quiz`]?.status === 'running'}
              refreshTrigger={refreshTrigger}
            />
          )}

          {workspaceTab === 'aiTasksTab' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.values(aiTasks)
                  .filter(t => t.videoId === Number(videoId))
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map(task => {
                    const doneCount = task.chunkStatuses.filter(c => c.status === 'done').length;
                    const errorCount = task.chunkStatuses.filter(c => c.status === 'error').length;
                    const percent = Math.round((doneCount / task.totalChunks) * 100);
                    
                    let statusColor = 'default';
                    let statusText = 'Chờ chạy';
                    if (task.status === 'running') {
                      statusColor = 'processing';
                      statusText = 'Đang chạy';
                    } else if (task.status === 'completed') {
                      statusColor = 'success';
                      statusText = 'Hoàn thành';
                    } else if (task.status === 'failed') {
                      statusColor = 'error';
                      statusText = 'Gặp lỗi';
                    } else if (task.status === 'paused') {
                      statusColor = 'warning';
                      statusText = 'Tạm dừng';
                    }
                    
                    return (
                      <Card
                        key={task.id}
                        style={{
                          borderRadius: 16,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #f3f4f6',
                          background: '#ffffff'
                        }}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Space>
                              <RobotOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                              <Text strong style={{ fontSize: 15 }}>{getTaskName(task.taskType)}</Text>
                              <Tag color={statusColor} style={{ borderRadius: 4, fontWeight: 600 }}>{statusText}</Tag>
                            </Space>
                            <Space>
                              {task.status === 'running' && (
                                <Button
                                  type="primary"
                                  danger
                                  ghost
                                  size="small"
                                  onClick={() => handlePauseTask(task.id)}
                                  style={{ borderRadius: 6, fontWeight: 600 }}
                                >
                                  Tạm dừng
                                </Button>
                              )}
                              {(task.status === 'failed' || task.status === 'paused') && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => handleResumeTask(task.id)}
                                  style={{ borderRadius: 6, fontWeight: 600 }}
                                >
                                  Tiếp tục
                                </Button>
                              )}
                              <Popconfirm
                                title="Xoá lịch sử tác vụ này?"
                                onConfirm={() => {
                                  setAiTasks(prev => {
                                    const next = { ...prev };
                                    delete next[task.id];
                                    return next;
                                  });
                                }}
                                okText="Xoá"
                                cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                              >
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>
                            </Space>
                          </div>
                        }
                      >
                        <Row gutter={[20, 12]} style={{ marginBottom: 12 }}>
                          <Col xs={24} sm={12}>
                            <Text type="secondary">Thời gian tạo: </Text>
                            <Text strong>{new Date(task.createdAt).toLocaleString('vi-VN')}</Text>
                          </Col>
                          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                            <Text type="secondary">Tiến độ: </Text>
                            <Text strong>{doneCount}/{task.totalChunks} phần ({percent}%)</Text>
                            {errorCount > 0 && (
                              <Text type="danger" style={{ marginLeft: 12 }}>
                                ({errorCount} phần lỗi)
                              </Text>
                            )}
                          </Col>
                        </Row>
                        
                        <Progress
                          percent={percent}
                          status={task.status === 'failed' ? 'exception' : (task.status === 'running' ? 'active' : 'normal')}
                          strokeColor={task.status === 'failed' ? '#ef4444' : (task.status === 'paused' ? '#f59e0b' : '#6366f1')}
                          style={{ marginBottom: 16 }}
                        />
                        
                        <Divider dashed style={{ margin: '12px 0' }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <Text strong style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>Chi tiết các phần:</Text>
                          <div className={styles.chunkGrid}>
                            {task.chunkStatuses.map((chunk) => {
                              const currentBatchSize = task.taskType === 'translate' ? 40 : (task.taskType === 'quiz' ? 100 : 50);
                              const startSeg = chunk.index * currentBatchSize + 1;
                              const endSeg = Math.min((chunk.index + 1) * currentBatchSize, segments.length);
                              return (
                                <div
                                  key={chunk.index}
                                  className={`${styles.chunkItem} ${styles[`chunkItem_${chunk.status}`]}`}
                                >
                                  <div className={styles.chunkItemLeft}>
                                    {chunk.status === 'done' && <CheckCircleFilled style={{ color: '#10b981', fontSize: 14 }} />}
                                    {chunk.status === 'error' && <CloseCircleFilled style={{ color: '#ef4444', fontSize: 14 }} />}
                                    {chunk.status === 'loading' && <LoadingOutlined style={{ color: '#6366f1', fontSize: 14 }} />}
                                    {chunk.status === 'pending' && <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#e2e8f0', display: 'inline-block' }} />}
                                    <Text style={{ fontSize: 12, fontWeight: 500 }}>
                                      Phần {chunk.index + 1} <Text type="secondary" style={{ fontSize: 11 }}>(#{startSeg}–{endSeg})</Text>
                                    </Text>
                                  </div>
                                  <div className={styles.chunkItemRight}>
                                    {chunk.status === 'error' && (
                                      <>
                                        <Tooltip title={chunk.errorMsg}>
                                          <Text type="danger" style={{ fontSize: 11, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                            {chunk.errorMsg}
                                          </Text>
                                        </Tooltip>
                                        <Button
                                          type="primary"
                                          danger
                                          size="small"
                                          icon={<RedoOutlined />}
                                          onClick={() => handleRetrySingleChunk(task.id, chunk.index)}
                                          style={{ borderRadius: 4, fontSize: 11, height: 24, padding: '0 8px' }}
                                        >
                                          Thử lại
                                        </Button>
                                      </>
                                    )}
                                    {chunk.status === 'done' && (
                                      <Tag color="success" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>Xong</Tag>
                                    )}
                                    {chunk.status === 'loading' && (
                                      <Tag color="processing" style={{ margin: 0, borderRadius: 4, fontSize: 11 }}>Đang chạy...</Tag>
                                    )}
                                    {chunk.status === 'pending' && (
                                      <Tag style={{ margin: 0, borderRadius: 4, fontSize: 11, color: '#94a3b8' }}>Chờ</Tag>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  
                {Object.values(aiTasks).filter(t => t.videoId === Number(videoId)).length === 0 && (
                  <Empty description="Chưa có tiến trình AI nào được tạo cho bài học này." style={{ padding: 40 }} />
                )}
              </div>
            </div>
          )}

          {workspaceTab === 'geminiKeys' && (
            <GeminiKeysManager />
          )}
        </>
      )}



      {/* Interactive Centered Guide Modal */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RobotOutlined style={{ fontSize: 20 }} /> Hướng dẫn sử dụng Workspace
          </span>
        }
        open={helpVisible}
        onCancel={() => setHelpVisible(false)}
        centered
        width={760}
        styles={{ body: { padding: '24px', lineHeight: 1.6, maxHeight: '68vh', overflowY: 'auto' } }}
        footer={[
          <Button key="close" type="primary" onClick={() => setHelpVisible(false)} style={{ borderRadius: 6, fontWeight: 600 }}>
            Đã hiểu
          </Button>
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <Title level={5} style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 0 }}>
              1. Sử dụng các web chat AI thay vì thao tác trên giao diện segments-phân đoạn
            </Title>
            <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text>
                Ngoài việc sử dụng các thao tác trên giao diện segments-phân đoạn bạn có thể sử dụng web chat AI như chatgpt, deepseek, grok, gemini, ... để tạo bản dịch, ipa, gộp các câu rời rạc, tự ngắt đoạn
                (khuyên dùng gemini pro)
              </Text>
              <ol style={{ paddingLeft: 18, margin: '4px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>
                   Ở thanh công cụ phân đoạn (tab Segments - phân đoạn), bấm nút <strong>"Xuất file"</strong> để tải file phụ đề (định dạng JSON) về máy.
                </li>
                <li>
                  Nhấp vào nút dưới đây để sao chép System Prompt tối ưu hóa dữ liệu:
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <Button 
                      type="dashed" 
                      icon={<CopyOutlined />} 
                      onClick={handleCopyPrompt}
                      style={{ borderColor: '#6366f1', color: '#6366f1', fontWeight: 600 }}
                    >
                      Sao chép Prompt hướng dẫn cho AI
                    </Button>
                  </div>
                </li>
                <li>
                  Mở trang web ai chatgpt, grok, deepseek, ... (khyên dùng Gemini Pro) và dán đoạn Prompt vừa sao chép vào khung chat, rồi nhấn Gửi.
                </li>
                
                <li>
                  Sau khi AI trả lời <strong>"UNDERSTOOD. Please provide the JSON data."</strong>, hãy tải file JSON bạn vừa tải lên ô chat để AI tự động xử lý.
                </li>
                <li>
                  Sao chép đoạn code JSON hoàn chỉnh mà AI trả về, chuyển sang tab phụ <strong>"Soạn thảo JSON"</strong> của trang này, dán đè lên nội dung cũ và bấm nút <strong>"Lưu phân đoạn"</strong> màu xanh. Vậy là xong!
                </li>
              </ol>
            </div>
          </div>

          <Divider style={{ margin: '0' }} />

          <div>
            <Title level={5} style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              2. Segments - phân đoạn 
            </Title>
            <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text>Nếu bạn muốn thao tác trực tiếp trên hệ thống hoặc dùng API Key cá nhân, hãy thực hiện theo thứ tự sau:</Text>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Bước 1 - Gộp phân đoạn:</strong> Bấm <strong>"Auto Gộp Phân Đoạn (AI)"</strong> để hệ thống tự động ghép các câu ngắn, vụn vặt thành một câu hoàn chỉnh, giúp người học dễ dàng luyện nghe.</li>
                <li><strong>Bước 2 - Dịch & IPA:</strong> Bấm <strong>"Dịch nghĩa & Tạo IPA (AI)"</strong> để hệ thống tạo bản dịch tiếng Việt và phiên âm quốc tế chuẩn xác cho toàn bộ video. Quá trình chạy ngầm từng đoạn nhỏ nên bạn có thể theo dõi tiến độ ngay trên màn hình.</li>
                <li><strong>Bước 3 - Ngắt đoạn:</strong> Bấm <strong>"Auto Ngắt Đoạn (AI)"</strong> hoặc bật nút gạt <strong>"Ngắt đoạn mới"</strong> ở đầu các câu quan trọng. Điều này giúp chia văn bản thành các đoạn văn (paragraph) hiển thị đều và đẹp mắt (justify 14px) khi người học sử dụng bài Điền từ.</li>
                <li><strong>Chỉnh sửa thủ công:</strong> Bạn có thể nhấp vào bất kỳ ô Text, IPA, hoặc Translation nào để tự gõ lại, hoặc dùng nút gộp nhanh segment. Bạn cũng có thể tinh chỉnh số giây bắt đầu/kết thúc để khớp với video .</li>
              </ul>
            </div>
          </div>

          <Divider style={{ margin: '0' }} />

          <div>
            <Title level={5} style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              3. Quản lý fill blank
            </Title>
            <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text>Tính năng này giúp tạo các chỗ trống trong đoạn hội thoại trong mode listening để luyện nghe và điền từ:</Text>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Tạo thủ công:</strong> Chuyển khung Transcript sang chế độ "Dịch/Bôi đen". Hãy dùng chuột <strong>bôi đen trực tiếp</strong> một từ hoặc cụm từ bạn muốn đục lỗ bên khung văn bản gốc. Hệ thống sẽ tự động tính toán vị trí và điền từ đó vào Form tạo Blank bên trái. Bạn chỉ cần bấm "Thêm".</li>
                <li><strong>Tạo bằng AI:</strong> Bấm nút <strong>"Auto AI"</strong>. Hệ thống sẽ quét toàn bộ văn bản và chọn ra những từ vựng quan trọng (danh từ, động từ, tính từ khó) để tự động tạo các điền từ chất lượng.</li>
              </ul>
            </div>
          </div>

          <Divider style={{ margin: '0' }} />

          <div>
            <Title level={5} style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              4. Quản lý quiz
            </Title>
            <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text>Tạo các câu hỏi trắc nghiệm kiểm tra hiểu biết về nội dung video:</Text>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong>Tạo thủ công:</strong> Nhập nội dung câu hỏi, thêm các phương án A, B, C, D (bấm dấu cộng để thêm phương án mới), thêm lời giải thích (Explanation).</li>
                <li><strong>Tạo bằng AI:</strong> Bấm nút <strong>"Auto AI"</strong> để hệ thống tự suy luận ngữ cảnh video và thiết kế toàn bộ câu hỏi trắc nghiệm khách quan.</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
