import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';

// ─── Constants ─────────────────────────────────────────────────
const LS_KEY_DICT = 'fluentnova_pending_dictation';
const LS_KEY_SHAD = 'fluentnova_pending_shadowing';
const UPSERT_DEBOUNCE_MS = 800;

// ─── Helpers ───────────────────────────────────────────────────

const readFromLS = (key) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeToLS = (key, pendingMap) => {
    try {
        // Only persist unsynced items — React state is the source of truth
        const filtered = {};
        for (const [segId, data] of Object.entries(pendingMap)) {
            if (!data.isSynced) {
                filtered[segId] = data;
            }
        }
        localStorage.setItem(key, JSON.stringify(filtered));
    } catch (err) {
        console.warn('[AttemptSyncContext] Failed to write localStorage:', err);
    }
};

// ─── Context ───────────────────────────────────────────────────

const AttemptSyncContext = createContext(null);

/**
 * AttemptSyncProvider
 *
 * Manages TWO separate pending-attempts maps:
 * - dictation: keyed by segmentId, stores { segmentId, dictationScore, dictationUserText, isSynced }
 * - shadowing: keyed by segmentId, stores { segmentId, shadowingScore, shadowingUserText, isSynced }
 *
 * Each map persists to localStorage separately and supports debounced upserts.
 */
export const AttemptSyncProvider = ({ children }) => {
    // ── Dictation state ──
    const [dictAttempts, setDictAttempts] = useState(() => readFromLS(LS_KEY_DICT));
    const dictRef = useRef(dictAttempts);

    useEffect(() => {
        dictRef.current = dictAttempts;
        writeToLS(LS_KEY_DICT, dictAttempts);
    }, [dictAttempts]);

    // ── Shadowing state ──
    const [shadAttempts, setShadAttempts] = useState(() => readFromLS(LS_KEY_SHAD));
    const shadRef = useRef(shadAttempts);

    useEffect(() => {
        shadRef.current = shadAttempts;
        writeToLS(LS_KEY_SHAD, shadAttempts);
    }, [shadAttempts]);

    // Debounce timers
    const dictTimersRef = useRef({});
    const shadTimersRef = useRef({});
    // Pending data awaiting debounce commit (stored alongside timers)
    const dictPendingDataRef = useRef({});
    const shadPendingDataRef = useRef({});

    // ── Cross-tab sync ──
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === LS_KEY_DICT) {
                const external = readFromLS(LS_KEY_DICT);
                setDictAttempts(external);
                dictRef.current = external;
            }
            if (e.key === LS_KEY_SHAD) {
                const external = readFromLS(LS_KEY_SHAD);
                setShadAttempts(external);
                shadRef.current = external;
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    /**
     * Upsert a dictation attempt (debounced 800ms per segmentId).
     * @param {number} segmentId
     * @param {{ dictationScore?: number, dictationUserText?: string }} partialData
     */
    const upsertDictation = useCallback((segmentId, partialData) => {
        if (dictTimersRef.current[segmentId]) {
            clearTimeout(dictTimersRef.current[segmentId]);
        }

        const existing = dictRef.current[segmentId] || { segmentId };
        const pending = dictPendingDataRef.current[segmentId] || {};
        const mergedAttempt = {
            ...existing,
            ...pending,
            ...partialData,
            segmentId,
            isSynced: false,
        };

        // Keep the ref hot so an autosave tick cannot miss the latest text
        // while the React state/localStorage write is still debounced.
        dictRef.current = {
            ...dictRef.current,
            [segmentId]: mergedAttempt,
        };
        dictPendingDataRef.current[segmentId] = mergedAttempt;

        dictTimersRef.current[segmentId] = setTimeout(() => {
            setDictAttempts(prev => {
                const latest = dictPendingDataRef.current[segmentId] || mergedAttempt;
                const next = {
                    ...prev,
                    [segmentId]: latest,
                };
                dictRef.current = next;
                return next;
            });
            delete dictTimersRef.current[segmentId];
            delete dictPendingDataRef.current[segmentId];
        }, UPSERT_DEBOUNCE_MS);
    }, []);

    /**
     * upsertDictationImmediate — same as upsertDictation but skips the
     * 800ms debounce. Used when we know we need to flush right after
     * (e.g. completing the final segment).
     */
    const upsertDictationImmediate = useCallback((segmentId, partialData) => {
        // Cancel any pending debounce for this segment
        if (dictTimersRef.current[segmentId]) {
            clearTimeout(dictTimersRef.current[segmentId]);
            delete dictTimersRef.current[segmentId];
        }
        // Write immediately to both state AND ref
        setDictAttempts(prev => {
            const existing = prev[segmentId] || { segmentId };
            const next = {
                ...prev,
                [segmentId]: {
                    ...existing,
                    ...partialData,
                    segmentId,
                    isSynced: false,
                },
            };
            dictRef.current = next; // sync ref immediately for flush to read
            return next;
        });
    }, []);

    /**
     * Upsert a shadowing attempt (debounced 800ms per segmentId).
     * @param {number} segmentId
     * @param {{ shadowingScore?: number, shadowingUserText?: string }} partialData
     */
    const upsertShadowing = useCallback((segmentId, partialData) => {
        if (shadTimersRef.current[segmentId]) {
            clearTimeout(shadTimersRef.current[segmentId]);
        }

        const existing = shadRef.current[segmentId] || { segmentId };
        const pending = shadPendingDataRef.current[segmentId] || {};
        const mergedAttempt = {
            ...existing,
            ...pending,
            ...partialData,
            segmentId,
            isSynced: false,
        };

        shadRef.current = {
            ...shadRef.current,
            [segmentId]: mergedAttempt,
        };
        shadPendingDataRef.current[segmentId] = mergedAttempt;

        shadTimersRef.current[segmentId] = setTimeout(() => {
            setShadAttempts(prev => {
                const latest = shadPendingDataRef.current[segmentId] || mergedAttempt;
                const next = {
                    ...prev,
                    [segmentId]: latest,
                };
                shadRef.current = next;
                return next;
            });
            delete shadTimersRef.current[segmentId];
            delete shadPendingDataRef.current[segmentId];
        }, UPSERT_DEBOUNCE_MS);
    }, []);

    /**
     * upsertShadowingImmediate — same as upsertShadowing but skips the debounce.
     */
    const upsertShadowingImmediate = useCallback((segmentId, partialData) => {
        if (shadTimersRef.current[segmentId]) {
            clearTimeout(shadTimersRef.current[segmentId]);
            delete shadTimersRef.current[segmentId];
        }
        setShadAttempts(prev => {
            const existing = prev[segmentId] || { segmentId };
            const next = {
                ...prev,
                [segmentId]: {
                    ...existing,
                    ...partialData,
                    segmentId,
                    isSynced: false,
                },
            };
            shadRef.current = next;
            return next;
        });
    }, []);

    /**
     * markDictationSynced — called after successful API batch post.
     * @param {number[]} segmentIds
     */
    const markDictationSynced = useCallback((segmentIds) => {
        const ids = segmentIds.map(String);

        // 1. Cancel any pending debounce timers for these IDs to prevent "revival"
        for (const id of ids) {
            if (dictTimersRef.current[id]) {
                clearTimeout(dictTimersRef.current[id]);
                delete dictTimersRef.current[id];
            }
            delete dictPendingDataRef.current[id];
        }

        // 2. Keep synced attempts in React state for in-page restore, but
        // localStorage will still drop them via writeToLS().
        const current = dictRef.current;
        const next = { ...current };
        let changed = false;
        for (const id of ids) {
            if (next[id]) {
                next[id] = { ...next[id], isSynced: true };
                changed = true;
            }
        }

        if (changed) {
            dictRef.current = next;
            setDictAttempts(next);
            // Force immediate write to LS for unmount/tab safety
            writeToLS(LS_KEY_DICT, next);
        }
    }, []);

    /**
     * markShadowingSynced — called after successful API batch post.
     * @param {number[]} segmentIds
     */
    const markShadowingSynced = useCallback((segmentIds) => {
        const ids = segmentIds.map(String);

        // 1. Cancel pending timers
        for (const id of ids) {
            if (shadTimersRef.current[id]) {
                clearTimeout(shadTimersRef.current[id]);
                delete shadTimersRef.current[id];
            }
            delete shadPendingDataRef.current[id];
        }

        // 2. Keep synced attempts in React state for in-page restore, but
        // localStorage will still drop them via writeToLS().
        const current = shadRef.current;
        const next = { ...current };
        let changed = false;
        for (const id of ids) {
            if (next[id]) {
                next[id] = { ...next[id], isSynced: true };
                changed = true;
            }
        }

        if (changed) {
            shadRef.current = next;
            setShadAttempts(next);
            writeToLS(LS_KEY_SHAD, next);
        }
    }, []);

    /**
     * getPendingDictation — returns array of unsynced dictation attempt objects
     * formatted for the backend API.
     */
    const getPendingDictation = useCallback(() => {
        const pending = dictRef.current;
        return Object.values(pending)
            .filter((item) => !item.isSynced)
            .map(({ segmentId, dictationScore, dictationUserText, hintCount, replayCount, wrongSubmitCount }) => ({
                segmentId,
                dictationScore: dictationScore ?? 0,
                dictationUserText: dictationUserText || null,
                hintCount: hintCount ?? 0,
                replayCount: replayCount ?? 0,
                wrongSubmitCount: wrongSubmitCount ?? 0,
            }));
    }, []);

    /**
     * getPendingShadowing — returns array of unsynced shadowing attempt objects
     * formatted for the backend API.
     */
    const getPendingShadowing = useCallback(() => {
        const pending = shadRef.current;
        return Object.values(pending)
            .filter((item) => !item.isSynced)
            .map(({ segmentId, shadowingScore, shadowingUserText }) => ({
                segmentId,
                shadowingScore: shadowingScore ?? 0,
                shadowingUserText: shadowingUserText || null,
            }));
    }, []);

    /**
     * flushAllPendingTimers — immediately fires all pending debounce timers
     * so their data is committed to state+ref BEFORE an API flush.
     * Called on component unmount to prevent data loss.
     */
    const flushAllPendingTimers = useCallback(() => {
        // Flush dictation timers
        for (const [segId, timerId] of Object.entries(dictTimersRef.current)) {
            clearTimeout(timerId);
            const partialData = dictPendingDataRef.current[segId];
            if (partialData) {
                // Write directly to ref (state won't update during unmount)
                const existing = dictRef.current[segId] || { segmentId: segId };
                dictRef.current = {
                    ...dictRef.current,
                    [segId]: { ...existing, ...partialData, segmentId: Number(segId), isSynced: false },
                };
            }
        }
        dictTimersRef.current = {};
        dictPendingDataRef.current = {};

        // Flush shadowing timers
        for (const [segId, timerId] of Object.entries(shadTimersRef.current)) {
            clearTimeout(timerId);
            const partialData = shadPendingDataRef.current[segId];
            if (partialData) {
                const existing = shadRef.current[segId] || { segmentId: segId };
                shadRef.current = {
                    ...shadRef.current,
                    [segId]: { ...existing, ...partialData, segmentId: Number(segId), isSynced: false },
                };
            }
        }
        shadTimersRef.current = {};
        shadPendingDataRef.current = {};

        // Force write back to LS so LS is clean/updated before unmount
        setDictAttempts(dictRef.current);
        setShadAttempts(shadRef.current);
        writeToLS(LS_KEY_DICT, dictRef.current);
        writeToLS(LS_KEY_SHAD, shadRef.current);
    }, []);

    const value = {
        // State (for reading in components like useDictation to display historical data)
        dictAttempts,
        shadAttempts,
        // Legacy alias for compatibility with useDictation
        attempts: dictAttempts,
        // Upsert actions (debounced — normal mid-session use)
        upsertDictation,
        upsertShadowing,
        // Immediate upsert actions (no debounce — for final-segment flush)
        upsertDictationImmediate,
        upsertShadowingImmediate,
        // Legacy alias — useDictation calls upsertAttempt(segId, { dictationUserText })
        upsertAttempt: upsertDictation,
        // Sync actions
        markDictationSynced,
        markShadowingSynced,
        getPendingDictation,
        getPendingShadowing,
        // Flush all pending debounce timers (for unmount)
        flushAllPendingTimers,
    };

    return (
        <AttemptSyncContext.Provider value={value}>
            {children}
        </AttemptSyncContext.Provider>
    );
};

/**
 * useStudyAttempt — convenience hook to consume AttemptSyncContext.
 */
export const useStudyAttempt = () => {
    const ctx = useContext(AttemptSyncContext);
    if (!ctx) {
        throw new Error('useStudyAttempt must be used within <AttemptSyncProvider>');
    }
    return ctx;
};
