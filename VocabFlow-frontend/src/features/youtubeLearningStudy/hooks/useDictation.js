import { useState, useRef, useEffect, useCallback } from 'react';
import { normalizeText } from '../utils/scoring';
import { parseWords, runClientCheck } from '../utils/dictation';
import { useStudyAttempt } from '../context/AttemptSyncContext';

/**
 * useDictation
 * Encapsulates all dictation exercise state: user inputs, answer checking,
 * completion tracking, and history restore.
 *
 * Submission is handled externally by useAttemptSync (background sync).
 *
 * @param {Object} params
 * @param {Array}         params.segments      - All segments
 * @param {Object|null}   params.currentSegment - The currently active segment
 * @param {number}        params.currentIndex   - Current sentence index
 * @param {boolean}       params.autoAdvance    - Whether to auto-advance on correct
 * @param {Function}      params.setCurrentIndex - Setter to advance to next sentence
 */
const useDictation = ({ segments, currentSegment, currentIndex, autoAdvance, setCurrentIndex, onCompletedChange }) => {
    const { attempts, upsertAttempt, upsertDictationImmediate, flushAllPendingTimers } = useStudyAttempt();
    const [userInputs, setUserInputs] = useState({});
    const [checkResults, setCheckResults] = useState({});
    const [completedSet, setCompletedSet] = useState(new Set());
    const historyLoadedRef = useRef(false);

    // ── Penalty metric trackers (keyed by segmentId) ──
    const [hintCounts, setHintCounts] = useState({});
    const [replayCounts, setReplayCounts] = useState({});
    const [wrongSubmitCounts, setWrongSubmitCounts] = useState({});

    // ── Auto advance timeout ref ──
    const autoAdvanceTimeoutRef = useRef(null);

    // Clean up timeout on index changes or unmount
    useEffect(() => {
        return () => {
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
            }
        };
    }, [currentIndex]);

    // ── Finalized scores (write-once per segment, frozen at completion) ──
    const [finalScores, setFinalScores] = useState({});

    useEffect(() => {
        return () => {
            flushAllPendingTimers?.();
        };
    }, [flushAllPendingTimers]);

    // ── Derived ──
    const segmentId = currentSegment?.id;
    // Prioritize in-flight user input, then context data (so it persists across navigations), then backend data
    const currentInput = currentSegment ?
        userInputs[currentSegment.id]
        ?? attempts[currentSegment.id]?.dictationUserText
        ?? currentSegment.userAttempt?.dictationUserText
        ?? ''
        : '';
    const currentResult = currentSegment ? checkResults[currentSegment.id] : null;
    const answeredCount = segments.filter((seg) =>
        userInputs[seg.id]?.trim() ||
        attempts[seg.id]?.dictationUserText?.trim() ||
        seg.userAttempt?.dictationUserText?.trim() ||
        seg.userAttempt?.dictationScore >= 100
    ).length;

    // ── Resume progress from userAttempt ──
    useEffect(() => {
        if (segments.length === 0 || historyLoadedRef.current) return;
        historyLoadedRef.current = true;

        const restoredInputs = {};
        const restoredResults = {};
        const restoredCompleted = new Set();
        const restoredHints = {};
        const restoredReplays = {};
        const restoredWrongSubmits = {};
        const restoredScores = {};

        segments.forEach((seg, idx) => {
            const apiAttempt = seg.userAttempt;
            const ctxAttempt = attempts[seg.id];

            // Restore penalty counts from context or API
            restoredHints[seg.id] = ctxAttempt?.hintCount ?? apiAttempt?.hintCount ?? 0;
            restoredReplays[seg.id] = ctxAttempt?.replayCount ?? apiAttempt?.replayCount ?? 0;
            restoredWrongSubmits[seg.id] = ctxAttempt?.wrongSubmitCount ?? apiAttempt?.wrongSubmitCount ?? 0;

            // Prioritize context attempt text, fallback to API
            const historicalText = ctxAttempt?.dictationUserText || apiAttempt?.dictationUserText;

            if (historicalText) {
                restoredInputs[seg.id] = historicalText;
                const result = runClientCheck(seg, historicalText);
                if (result) {
                    restoredResults[seg.id] = result;
                    if (result.allCorrect) {
                        restoredCompleted.add(idx);
                        // Restore the finalized score from the server or context
                        restoredScores[seg.id] = ctxAttempt?.dictationScore ?? apiAttempt?.dictationScore ?? 100;
                    }
                }
            }
        });

        if (Object.keys(restoredInputs).length > 0) {
            setUserInputs(restoredInputs);
            setCheckResults(restoredResults);
        }
        if (restoredCompleted.size > 0) {
            setCompletedSet(restoredCompleted);
            if (onCompletedChange) onCompletedChange(restoredCompleted);
        }
        if (Object.keys(restoredScores).length > 0) {
            setFinalScores(restoredScores);
        }
        setHintCounts(restoredHints);
        setReplayCounts(restoredReplays);
        setWrongSubmitCounts(restoredWrongSubmits);
    }, [segments]);

    const handleInputChange = useCallback(
        (e) => {
            const value = e.target.value.replace(/\n/g, '');
            if (segmentId == null) return;

            setUserInputs((prev) => ({ ...prev, [segmentId]: value }));
            upsertAttempt(segmentId, {
                dictationUserText: value,
                dictationScore: finalScores[segmentId] ?? attempts[segmentId]?.dictationScore ?? currentSegment?.userAttempt?.dictationScore ?? 0,
                hintCount: hintCounts[segmentId] ?? 0,
                replayCount: replayCounts[segmentId] ?? 0,
                wrongSubmitCount: wrongSubmitCounts[segmentId] ?? 0,
            });

            // Clear check result when user starts typing again
            if (checkResults[segmentId]) {
                setCheckResults((prev) => {
                    const next = { ...prev };
                    delete next[segmentId];
                    return next;
                });
            }
        },
        [segmentId, upsertAttempt, finalScores, attempts, currentSegment, hintCounts, replayCounts, wrongSubmitCounts, checkResults],
    );

    // ── Helper: build the penalty-metrics object for the current segment ──
    const getPenaltyMetrics = useCallback((segId) => ({
        hintCount: hintCounts[segId] ?? 0,
        replayCount: replayCounts[segId] ?? 0,
        wrongSubmitCount: wrongSubmitCounts[segId] ?? 0,
    }), [hintCounts, replayCounts, wrongSubmitCounts]);

    // ── Client-side check ──
    const handleCheck = useCallback(() => {
        if (!currentSegment) return;
        const segId = currentSegment.id;
        const userText = userInputs[segId] || '';
        if (!userText.trim()) return;

        const normalizedUser = normalizeText(userText).split(/\s+/).filter(Boolean);
        const originalWords = parseWords(currentSegment.englishText);

        const resultWords = [];
        let allCorrect = true;
        let userIdx = 0;
        let correctCount = 0;
        const totalWords = originalWords.filter(w => w.clean).length;

        for (let i = 0; i < originalWords.length; i++) {
            const hw = originalWords[i];

            if (!hw.clean) {
                // Punctuation-only token, automatically correct/skipped
                resultWords.push({ word: hw.original, status: 'correct' });
                continue;
            }

            const userWord = normalizedUser[userIdx];
            const expectedWord = hw.original;

            if (userWord && userWord === hw.clean) {
                resultWords.push({ word: expectedWord, status: 'correct' });
                correctCount++;
                userIdx++;
            } else {
                allCorrect = false;
                resultWords.push({
                    word: expectedWord,
                    userWord: userWord || null,
                    status: userWord ? 'incorrect' : 'missing',
                });
                // We stop at the first error in this simple check mode
                break;
            }
        }

        // Penalty metrics for this segment
        const metrics = getPenaltyMetrics(segId);

        if (allCorrect) {
            // Compute penalty-based score (backend will also recompute, but we mirror it for UI)
            const dictationScore = Math.max(0,
                100
                - (Math.max(0, metrics.replayCount - 3) * 2)
                - (metrics.wrongSubmitCount * 4)
                - (metrics.hintCount * 4)
            );

            // Check if this is the LAST segment to complete
            const willBeComplete = completedSet.size + 1 >= segments.length;

            const upsertPayload = { dictationUserText: userText, dictationScore, ...metrics };

            if (willBeComplete) {
                // Bypass debounce — write immediately so flush() can read it
                upsertDictationImmediate(segId, upsertPayload);
            } else {
                upsertAttempt(segId, upsertPayload);
            }

            setCompletedSet((prev) => {
                const next = new Set([...prev, currentIndex]);
                if (onCompletedChange) onCompletedChange(next);
                return next;
            });
            // Freeze the finalized score (write-once — never recalculated)
            setFinalScores(prev => ({ ...prev, [segId]: dictationScore }));
            setCheckResults((prev) => ({
                ...prev,
                [segId]: { allCorrect: true, words: resultWords },
            }));
            if (autoAdvance && currentIndex < segments.length - 1) {
                if (autoAdvanceTimeoutRef.current) {
                    clearTimeout(autoAdvanceTimeoutRef.current);
                }
                autoAdvanceTimeoutRef.current = setTimeout(() => {
                    setCurrentIndex(currentIndex + 1);
                }, 2000);
            }
        } else {
            // Wrong answer — increment wrongSubmitCount
            const newWrongCount = (wrongSubmitCounts[segId] ?? 0) + 1;
            setWrongSubmitCounts(prev => ({ ...prev, [segId]: newWrongCount }));

            const updatedMetrics = { ...metrics, wrongSubmitCount: newWrongCount };
            const dictationScore = Math.max(0,
                100
                - (Math.max(0, updatedMetrics.replayCount - 3) * 1)
                - (updatedMetrics.wrongSubmitCount * 2)
                - (updatedMetrics.hintCount * 2)
            );

            upsertAttempt(segId, { dictationUserText: userText, dictationScore, ...updatedMetrics });
            setCheckResults((prev) => ({
                ...prev,
                [segId]: { allCorrect: false, words: resultWords },
            }));
        }
    }, [currentSegment, userInputs, currentIndex, segments.length, autoAdvance, setCurrentIndex, onCompletedChange, upsertAttempt, upsertDictationImmediate, completedSet.size, getPenaltyMetrics, wrongSubmitCounts]);

    // ── Increment hint count for a segment ──
    const incrementHint = useCallback((segId) => {
        setHintCounts(prev => {
            const newCount = (prev[segId] ?? 0) + 1;
            // Persist to sync context immediately so it's captured by autosave
            const metrics = {
                hintCount: newCount,
                replayCount: replayCounts[segId] ?? 0,
                wrongSubmitCount: wrongSubmitCounts[segId] ?? 0,
            };
            upsertAttempt(segId, metrics);
            return { ...prev, [segId]: newCount };
        });
    }, [upsertAttempt, replayCounts, wrongSubmitCounts]);

    // ── Increment replay count for a segment ──
    const incrementReplay = useCallback((segId) => {
        setReplayCounts(prev => {
            const newCount = (prev[segId] ?? 0) + 1;
            const metrics = {
                hintCount: hintCounts[segId] ?? 0,
                replayCount: newCount,
                wrongSubmitCount: wrongSubmitCounts[segId] ?? 0,
            };
            upsertAttempt(segId, metrics);
            return { ...prev, [segId]: newCount };
        });
    }, [upsertAttempt, hintCounts, wrongSubmitCounts]);

    // ── Auto-check when input matches perfectly ──
    useEffect(() => {
        if (!currentSegment || !currentInput.trim()) return;

        const normUser = normalizeText(currentInput);
        const normTarget = normalizeText(currentSegment.englishText);

        // Auto-trigger handles check if user typed everything correctly
        if (normUser === normTarget && !currentResult?.allCorrect) {
            handleCheck();
        }
    }, [currentInput, currentSegment, handleCheck, currentResult]);

    return {
        // State
        userInputs,
        checkResults,
        completedSet,
        currentInput,
        currentResult,
        answeredCount,
        hintCounts,
        replayCounts,
        wrongSubmitCounts,
        finalScores,

        // Actions
        handleInputChange,
        handleCheck,
        incrementHint,
        incrementReplay,
    };
};

export default useDictation;
