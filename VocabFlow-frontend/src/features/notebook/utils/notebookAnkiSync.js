import { getUser } from '@/utils/cookie';
import {
  buildVocabularyDeckName,
  buildVocabularyNote,
  syncNotesToAnki,
} from '@/utils/ankiSync';
import { userSavedWordApi } from '../api/notebookApi';

const WORD_PAGE_SIZE = 500;

const getUnitWords = async (unitId) => {
  const first = await userSavedWordApi.findAll(unitId, { pageNo: 1, pageSize: WORD_PAGE_SIZE });
  const firstPage = first.data || {};
  const totalPages = firstPage.totalPages || 1;
  const words = [...(firstPage.data || [])];

  for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
    const res = await userSavedWordApi.findAll(unitId, { pageNo, pageSize: WORD_PAGE_SIZE });
    words.push(...(res.data?.data || []));
  }

  return words;
};

const getUnitEntries = (groups = [], targetUnitId = null) => {
  const entries = [];

  groups.forEach((group) => {
    const groupName = group?.vocabularyGroupResponse?.name || 'Vocabulary';
    const units = group?.vocabularyUnitResponseList || [];

    units.forEach((unit) => {
      if (targetUnitId && Number(unit.id) !== Number(targetUnitId)) return;
      entries.push({
        unitId: unit.id,
        groupName,
        unitName: unit.name || 'Unit',
      });
    });
  });

  return entries;
};

export const syncVocabularyUnitsToAnki = async ({ groups, unitId = null, pendingOnly = true }) => {
  const user = getUser();
  const rootDeckName = user?.ankiDeckName || 'VocabFlow';
  const unitEntries = getUnitEntries(groups, unitId);
  const notes = [];

  for (const entry of unitEntries) {
    const words = await getUnitWords(entry.unitId);
    const syncableWords = pendingOnly
      ? words.filter((word) => word.ankiStatus !== 'SYNCED')
      : words;
    const deckName = buildVocabularyDeckName({
      rootDeckName,
      groupName: entry.groupName,
      unitName: entry.unitName,
    });

    syncableWords.forEach((word) => {
      notes.push(buildVocabularyNote({ word, deckName }));
    });
  }

  if (notes.length === 0) {
    return { syncedCount: 0, duplicateCount: 0, errors: [] };
  }

  return syncNotesToAnki(notes);
};

export const syncVocabularyUnitToAnki = async ({
  unitId,
  groupName = 'Vocabulary',
  unitName = 'Unit',
  pendingOnly = true,
}) => {
  const user = getUser();
  const deckName = buildVocabularyDeckName({
    rootDeckName: user?.ankiDeckName || 'VocabFlow',
    groupName,
    unitName,
  });
  const words = await getUnitWords(unitId);
  const syncableWords = pendingOnly ? words.filter((word) => word.ankiStatus !== 'SYNCED') : words;
  const notes = syncableWords.map((word) => buildVocabularyNote({ word, deckName }));

  if (notes.length === 0) {
    return { syncedCount: 0, duplicateCount: 0, errors: [] };
  }

  return syncNotesToAnki(notes);
};

export const syncCurrentWordsToAnki = async ({ words, groupName = 'Vocabulary', unitName = 'Unit', pendingOnly = true }) => {
  const user = getUser();
  const deckName = buildVocabularyDeckName({
    rootDeckName: user?.ankiDeckName || 'VocabFlow',
    groupName,
    unitName,
  });
  const syncableWords = pendingOnly ? words.filter((word) => word.ankiStatus !== 'SYNCED') : words;
  const notes = syncableWords.map((word) => buildVocabularyNote({ word, deckName }));
  return syncNotesToAnki(notes);
};
