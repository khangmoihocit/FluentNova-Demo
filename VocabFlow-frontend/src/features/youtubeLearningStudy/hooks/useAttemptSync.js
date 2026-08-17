import { useEffect, useCallback, useRef } from 'react';
import { useStudyAttempt } from '../context/AttemptSyncContext';
import { studyApi } from '../api/studyApi';
import { isAuthenticated } from '../../../utils/auth';
import { getAccessToken } from '../../../utils/cookie';
import { baseURL } from '../../../services/api/axiosClient';

// ─── Constants ─────────────────────────────────────────────────
const SYNC_INTERVAL_MS = 120_000;        // 2 minutes
const MAX_BATCH_SIZE = 50;               // max 50 segments per request

// ─── Helpers ───────────────────────────────────────────────────

/** Split an array into chunks of at most `size` items. */
const chunk = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

/**
 * useAttemptSync
 *
 * Background synchronisation hook that periodically batch-flushes
 * pending study attempts (dictation + shadowing) via the new
 * Realtime Aggregation autosave endpoints.
 *
 * All callback dependencies are stored in refs so `flush` has a
 * 100% stable identity — preventing spurious effect cleanups.
 *
 * @param {number}   videoId
 * @param {Function} onDictationCompleted
 * @param {Function} onShadowingCompleted
 * @param {Function} onProgressUpdate
 * @param {Function} extractStudyTime — returns { dictation, shadowing } seconds and resets
 */
const useAttemptSync = ({ videoId, onDictationCompleted, onShadowingCompleted, onProgressUpdate, extractStudyTime } = {}) => {
    const { getPendingDictation, getPendingShadowing, markDictationSynced, markShadowingSynced, flushAllPendingTimers } = useStudyAttempt();

    const flushingRef = useRef(false);
    const stoppedRef = useRef(false);
    const intervalIdRef = useRef(null);

    // ── Store ALL deps in refs → flush identity stays stable ──
    const getPendingDictRef = useRef(getPendingDictation);
    const getPendingShadRef = useRef(getPendingShadowing);
    const markDictSyncedRef = useRef(markDictationSynced);
    const markShadSyncedRef = useRef(markShadowingSynced);
    const videoIdRef = useRef(videoId);
    const onDictCompletedRef = useRef(onDictationCompleted);
    const onShadCompletedRef = useRef(onShadowingCompleted);
    const onProgressRef = useRef(onProgressUpdate);
    const extractTimeRef = useRef(extractStudyTime);

    useEffect(() => { getPendingDictRef.current = getPendingDictation; }, [getPendingDictation]);
    useEffect(() => { getPendingShadRef.current = getPendingShadowing; }, [getPendingShadowing]);
    useEffect(() => { markDictSyncedRef.current = markDictationSynced; }, [markDictationSynced]);
    useEffect(() => { markShadSyncedRef.current = markShadowingSynced; }, [markShadowingSynced]);
    useEffect(() => { videoIdRef.current = videoId; }, [videoId]);
    useEffect(() => { onDictCompletedRef.current = onDictationCompleted; }, [onDictationCompleted]);
    useEffect(() => { onShadCompletedRef.current = onShadowingCompleted; }, [onShadowingCompleted]);
    useEffect(() => { onProgressRef.current = onProgressUpdate; }, [onProgressUpdate]);
    useEffect(() => { extractTimeRef.current = extractStudyTime; }, [extractStudyTime]);

    // Ref for flushAllPendingTimers (stable identity)
    const flushTimersRef = useRef(flushAllPendingTimers);
    useEffect(() => { flushTimersRef.current = flushAllPendingTimers; }, [flushAllPendingTimers]);

    /**
     * Core flush logic — sends all pending dictation & shadowing data to the API.
     * Uses refs exclusively → identity is 100% stable (no deps).
     *
     * @param {Object} options
     * @param {boolean} options.force — skip the flushingRef guard (for immediate flush)
     */
    const flush = useCallback(async ({ force = false } = {}) => {
        // If already flushing, skip unless forced
        if (flushingRef.current && !force) return;
        if (stoppedRef.current && !force) return;
        if (!videoIdRef.current) return;
        if (!isAuthenticated()) return; // Don't flush if guest

        flushingRef.current = true;

        try {
            const timeData = extractTimeRef.current ? extractTimeRef.current() : { dictation: 0, shadowing: 0 };

            // ── Flush dictation ──
            const dictPending = getPendingDictRef.current();
            if (dictPending.length > 0) {
                const batches = chunk(dictPending, MAX_BATCH_SIZE);

                for (let i = 0; i < batches.length; i++) {
                    const batch = batches[i];
                    try {
                        // Only send time on the first batch to avoid double counting
                        const timeToSend = i === 0 ? timeData.dictation : 0;
                        const response = await studyApi.autosaveDictation(videoIdRef.current, batch, timeToSend);
                        markDictSyncedRef.current(batch.map((item) => item.segmentId));

                        // Mark time as sent so we don't accumulate it back
                        if (i === 0) timeData.dictation = 0;

                        const data = response?.data;
                        if (data && onProgressRef.current) {
                            onProgressRef.current({
                                type: 'dictation',
                                completedSegments: data.completedSegments,
                                avgScore: data.avgScore,
                                isDictationCompleted: data.dictationCompleted,
                            });
                        }
                        if (data?.dictationCompleted && onDictCompletedRef.current) {
                            onDictCompletedRef.current(data);
                            stoppedRef.current = true;
                        }
                    } catch (err) {
                        console.warn('[useAttemptSync] dictation batch flush failed, will retry:', err);
                    }
                }
            }

            // ── Flush shadowing ──
            const shadPending = getPendingShadRef.current();
            if (shadPending.length > 0) {
                const batches = chunk(shadPending, MAX_BATCH_SIZE);

                for (let i = 0; i < batches.length; i++) {
                    const batch = batches[i];
                    try {
                        const timeToSend = i === 0 ? timeData.shadowing : 0;
                        const response = await studyApi.autosaveShadowing(videoIdRef.current, batch, timeToSend);
                        markShadSyncedRef.current(batch.map((item) => item.segmentId));

                        if (i === 0) timeData.shadowing = 0;

                        const data = response?.data;
                        if (data && onProgressRef.current) {
                            onProgressRef.current({
                                type: 'shadowing',
                                completedSegments: data.completedSegments,
                                avgScore: data.avgScore,
                                isShadowingCompleted: data.shadowingCompleted,
                            });
                        }
                        if (data?.shadowingCompleted && onShadCompletedRef.current) {
                            onShadCompletedRef.current(data);
                        }
                    } catch (err) {
                        console.warn('[useAttemptSync] shadowing batch flush failed, will retry:', err);
                    }
                }
            }
        } finally {
            flushingRef.current = false;
        }
    }, []); // ← NO dependencies — uses refs only → stable identity

    /**
     * flushImmediate — called when we KNOW all segments are done.
     *
     * 1. Resets the 2-minute interval (prevents double-fire)
     * 2. Forces past flushingRef and stoppedRef guards
     * 3. Sends all pending data immediately
     */
    const flushImmediate = useCallback(async () => {
        console.info('[useAttemptSync] Immediate flush triggered (completion detected)');

        // Reset the periodic interval to prevent it from firing right after
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = setInterval(() => { flush(); }, SYNC_INTERVAL_MS);
        }

        // Wait a microtask for React state to settle (the immediate upsert may
        // have just called setState — we need the ref to be updated)
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Force flush, bypassing guards
        await flush({ force: true });
    }, [flush]);

    /** Reset the stopped flag (e.g., when switching videos). */
    const resume = useCallback(() => {
        stoppedRef.current = false;
    }, []);

    // ── 1. Periodic interval (every 2 min) ──
    useEffect(() => {
        intervalIdRef.current = setInterval(() => { flush(); }, SYNC_INTERVAL_MS);
        return () => {
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        };
    }, [flush]);

    // ── 2. beforeunload — ensure zero data loss on exit ──
    useEffect(() => {
        const handleUnload = () => {
            if (!videoIdRef.current || !isAuthenticated()) return;

            // 1. Force flush any debounced timers in context/LS
            if (flushTimersRef.current) flushTimersRef.current();

            // 2. Extract remaining study time
            const timeData = extractTimeRef.current ? extractTimeRef.current() : { dictation: 0, shadowing: 0 };
            
            // 3. Get ALL pending data (not just first batch)
            const dictPending = getPendingDictRef.current();
            const shadPending = getPendingShadRef.current();

            if (dictPending.length === 0 && shadPending.length === 0 && timeData.dictation === 0 && timeData.shadowing === 0) return;

            const token = getAccessToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // We use fetch + keepalive:true because it's more reliable than sendBeacon 
            // for JSON payloads and custom headers (Authorization).
            
            if (dictPending.length > 0 || timeData.dictation > 0) {
                const body = JSON.stringify({
                    videoId: videoIdRef.current,
                    segments: dictPending,
                    studyTimeSeconds: timeData.dictation,
                });
                
                fetch(`${baseURL}/progress/dictation/autosave`, {
                    method: 'POST',
                    headers,
                    body,
                    keepalive: true,
                }).catch(() => {});
                
                if (markDictSyncedRef.current) markDictSyncedRef.current(dictPending.map(i => i.segmentId));
            }

            if (shadPending.length > 0 || timeData.shadowing > 0) {
                const body = JSON.stringify({
                    videoId: videoIdRef.current,
                    segments: shadPending,
                    studyTimeSeconds: timeData.shadowing,
                });
                
                fetch(`${baseURL}/progress/shadowing/autosave`, {
                    method: 'POST',
                    headers,
                    body,
                    keepalive: true,
                }).catch(() => {});
                
                if (markShadSyncedRef.current) markShadSyncedRef.current(shadPending.map(i => i.segmentId));
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);

    // ── 3. Component unmount (route change) ──
    // Flush all pending debounce timers then fire the API call.
    useEffect(() => {
        return () => {
            // Commit all debounced data to refs immediately
            if (flushTimersRef.current) flushTimersRef.current();
            // Then flush everything to the server
            flush({ force: true });
        };
    }, []); // ← empty deps: cleanup runs ONLY on true unmount

    // ── 4. Network reconnect — flush when coming back online ──
    useEffect(() => {
        const handler = () => {
            console.info('[useAttemptSync] Network restored, flushing pending data...');
            flush();
        };
        window.addEventListener('online', handler);
        return () => window.removeEventListener('online', handler);
    }, [flush]);

    return { flush, flushImmediate, resume };
};

export default useAttemptSync;
