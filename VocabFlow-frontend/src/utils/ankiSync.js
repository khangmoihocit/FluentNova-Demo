const ANKI_MESSAGE_TYPE = 'FLUENTNOVA_SYNC_TO_ANKI';
export const VOCAB_ANKI_MODEL = 'FluentNova_Model';
export const VIDEO_ANKI_MODEL = 'FluentNova_dictation';


const DEFAULT_VOCAB_DECK_NAME = 'VocabFlow';
const DEFAULT_VIDEO_DECK_NAME = 'English by VocabFlow Video';
const EXTENSION_ID = import.meta.env.VITE_VOCABFLOW_EXTENSION_ID;
const EXTENSION_RESPONSE_TIMEOUT_MS = 6000;

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const requiredString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
};

export const sanitizeDeckPart = (value, fallback = 'Untitled') => {
  const normalized = String(value || fallback)
    .trim()
    .replace(/:/g, '-')
    .replace(/\s+/g, ' ');

  return normalized || fallback;
};

export const buildVocabularyDeckName = ({ rootDeckName, groupName, unitName }) => {
  const parts = [
    sanitizeDeckPart(rootDeckName, DEFAULT_VOCAB_DECK_NAME),
    sanitizeDeckPart(groupName, 'Vocabulary'),
    sanitizeDeckPart(unitName, 'Unit'),
  ];
  return parts.join('::');
};

export const buildVideoDeckName = ({ rootDeckName, videoTitle }) => {
  const safeTitle = sanitizeDeckPart(videoTitle, 'Video');
  const shortTitle = safeTitle.length > 50 ? `${safeTitle.slice(0, 50)}...` : safeTitle;
  return `${sanitizeDeckPart(rootDeckName, DEFAULT_VIDEO_DECK_NAME)}::${shortTitle}`;
};

export const buildVocabularyNote = ({ word, deckName, tags = ['vocabflow', 'vocabulary'] }) => {
  const lookup = word?.lookupWordResponse || word || {};

  return {
    deckName: requiredString(deckName, 'deckName'),
    modelName: VOCAB_ANKI_MODEL,
    fields: {
      Word: requiredString(lookup.word, 'word.lookupWordResponse.word'),
      Pronunciation: typeof lookup.pronunciation === 'string' ? lookup.pronunciation : '',
      Description: typeof lookup.description === 'string' ? lookup.description : '',
      HtmlContent: typeof lookup.htmlContent === 'string' ? lookup.htmlContent : '',
    },
    options: {
      allowDuplicate: false,
      duplicateScope: 'deck',
    },
    tags,
  };
};

export const buildVideoSegmentNote = ({ segment, deckName, youtubeVideoId, tags = ['vocabflow', 'video', 'dictation'] }) => ({
  deckName: requiredString(deckName, 'deckName'),
  modelName: VIDEO_ANKI_MODEL,
  fields: {
    SegmentOrder: String(segment?.segmentOrder ?? ''),
    StartTime: segment?.startTime != null ? String(segment.startTime) : '',
    EndTime: segment?.endTime != null ? String(segment.endTime) : '',
    EnglishText: requiredString(segment?.englishText, 'segment.englishText'),
    VietnameseTranslation: typeof segment?.vietnameseTranslation === 'string' ? segment.vietnameseTranslation : '',
    Ipa: typeof segment?.ipa === 'string' ? segment.ipa : '',
    YoutubeId: typeof youtubeVideoId === 'string' ? youtubeVideoId : '',
  },
  options: {
    allowDuplicate: false,
    duplicateScope: 'deck',
  },
  tags,
});

const buildAddNoteRequest = (noteData) => {
  if (!isPlainObject(noteData)) {
    throw new Error('noteData must be an object');
  }

  return {
    action: 'addNote',
    version: 6,
    params: {
      note: {
        deckName: noteData.deckName || DEFAULT_VOCAB_DECK_NAME,
        modelName: noteData.modelName || VOCAB_ANKI_MODEL,
        fields: noteData.fields,
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck',
          ...(isPlainObject(noteData.options) ? noteData.options : {}),
        },
        tags: Array.isArray(noteData.tags) ? noteData.tags : ['vocabflow'],
      },
    },
  };
};

const buildCreateDeckRequest = (deckName) => ({
  action: 'createDeck',
  version: 6,
  params: {
    deck: requiredString(deckName, 'deckName'),
  },
});

const buildVersionRequest = () => ({
  action: 'version',
  version: 6,
});

const mapAnkiErrorMessage = (error) => {
  const code = error?.code;
  const message = error?.message || '';

  if (code === 'ANKI_DUPLICATE_NOTE' || /duplicate/i.test(message)) {
    return 'Nội dung này đã tồn tại trong Anki nên không tạo thêm bản trùng.';
  }

  if (code === 'ANKI_TIMEOUT' || code === 'ANKI_UNAVAILABLE') {
    return 'Không kết nối được Anki. Hãy mở Anki Desktop, kiểm tra add-on AnkiConnect, rồi bấm đồng bộ lại.';
  }

  if (code === 'FORBIDDEN_ORIGIN') {
    return 'Extension từ chối yêu cầu đồng bộ từ website hiện tại.';
  }

  return message || 'Không thể đồng bộ sang Anki.';
};

const createAnkiSyncError = (responseError) => {
  const error = new Error(mapAnkiErrorMessage(responseError));
  error.code = responseError?.code;
  return error;
};

const sendAnkiRequest = (request) => {
  if (!EXTENSION_ID) {
    return Promise.reject(new Error('VocabFlow extension ID is not configured.'));
  }

  if (!globalThis.chrome?.runtime?.sendMessage) {
    return Promise.reject(new Error('Chrome extension runtime is unavailable.'));
  }

  const message = {
    type: ANKI_MESSAGE_TYPE,
    request,
  };

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Không nhận được phản hồi từ extension. Hãy reload extension, mở Anki rồi thử lại.'));
    }, EXTENSION_RESPONSE_TIMEOUT_MS);

    globalThis.chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
      window.clearTimeout(timeoutId);
      const runtimeError = globalThis.chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error('VocabFlow extension is not installed or is not reachable.'));
        return;
      }

      if (!response) {
        reject(new Error('VocabFlow extension returned an empty response.'));
        return;
      }

      if (!response.success) {
        reject(createAnkiSyncError(response.error));
        return;
      }

      resolve(response.data);
    });
  });
};

export const checkAnkiConnection = () => sendAnkiRequest(buildVersionRequest());

export const createAnkiDeck = (deckName) => sendAnkiRequest(buildCreateDeckRequest(deckName));

export const syncToAnki = (noteData) => sendAnkiRequest(buildAddNoteRequest(noteData));

export const syncNotesToAnki = async (notes) => {
  let syncedCount = 0;
  let duplicateCount = 0;
  const errors = [];
  const createdDecks = new Set();

  await checkAnkiConnection();

  for (const note of notes) {
    try {
      const deckName = requiredString(note.deckName, 'note.deckName');
      if (!createdDecks.has(deckName)) {
        await createAnkiDeck(deckName);
        createdDecks.add(deckName);
      }
      await syncToAnki(note);
      syncedCount += 1;
    } catch (error) {
      if (error.code === 'ANKI_DUPLICATE_NOTE') {
        duplicateCount += 1;
      } else {
        errors.push(error);
      }
    }
  }

  return { syncedCount, duplicateCount, errors };
};

export const getAnkiSyncSummary = (result, itemLabel = 'nội dung') => {
  const synced = result?.syncedCount || 0;
  const duplicated = result?.duplicateCount || 0;
  const failed = result?.errors?.length || 0;

  if (synced > 0 && duplicated > 0) {
    return `Đồng bộ thành công ${synced} ${itemLabel}. Bỏ qua ${duplicated} ${itemLabel} đã tồn tại trong Anki.`;
  }

  if (synced > 0) {
    return `Đồng bộ thành công ${synced} ${itemLabel} sang Anki.`;
  }

  if (duplicated > 0 && failed === 0) {
    return `Tất cả ${duplicated} ${itemLabel} đã tồn tại trong Anki, không tạo thêm bản trùng.`;
  }

  return result?.errors?.[0]?.message || 'Đồng bộ Anki thất bại.';
};

export default syncToAnki;
