import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { normalizeText } from '../../youtubeLearningStudy/utils/scoring';
import { parseWords, runClientCheck } from '../../youtubeLearningStudy/utils/dictation';

/**
 * useGameDictation
 *
 * A lightweight dictation hook for Game Mode.
 * Tracks penalty metrics (hints, replays, wrong submissions) locally in memory.
 * Does NOT interact with AttemptSyncContext — game data is strictly separated.
 *
 * On completion of all segments, the parent collects the metrics via `getGameResults()`
 * and submits them to the Game API in a single batch.
 */
const useGameDictation = ({ segments, currentSegment, currentIndex, autoAdvance, setCurrentIndex, onCompletedChange }) => {
    const [userInputs, setUserInputs] = useState({});
    const [checkResults, setCheckResults] = useState({});
    const [completedSet, setCompletedSet] = useState(new Set());

    // ── Penalty metric trackers (keyed by segmentId) ──
    const [hintCounts, setHintCounts] = useState({});
    const [replayCounts, setReplayCounts] = useState({});
    const [wrongSubmitCounts, setWrongSubmitCounts] = useState({});

    // ── Finalized scores (write-once per segment, frozen at completion) ──
    const [finalScores, setFinalScores] = useState({});

    // ── Derived ──
    const segmentId = currentSegment?.id;
    const currentInput = currentSegment ? (userInputs[currentSegment.id] ?? '') : '';
    const currentResult = currentSegment ? checkResults[currentSegment.id] : null;
    const answeredCount = segments.filter((seg) => userInputs[seg.id]?.trim()).length;

    // ── Helper: compute score ──
    const computeScore = useCallback((hint, replay, wrong) => {
        const FREE_REPLAYS = 3;
        return Math.max(0,
            100
            - (Math.max(0, replay - FREE_REPLAYS) * 3)
            - (wrong * 5)
            - (hint * 5)
        );
    }, []);

    const handleInputChange = useCallback(
        (e) => {
            const value = e.target.value.replace(/\n/g, '');
            if (segmentId == null) return;
            setUserInputs((prev) => ({ ...prev, [segmentId]: value }));
            if (checkResults[segmentId]) {
                setCheckResults((prev) => {
                    const next = { ...prev };
                    delete next[segmentId];
                    return next;
                });
            }
        },
        [segmentId, checkResults],
    );

    // ── Helper: build penalty-metrics ──
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

        for (let i = 0; i < originalWords.length; i++) {
            const hw = originalWords[i];

            if (!hw.clean) {
                resultWords.push({ word: hw.original, status: 'correct' });
                continue;
            }

            const userWord = normalizedUser[userIdx];
            const expectedWord = hw.original;

            if (userWord && userWord === hw.clean) {
                resultWords.push({ word: expectedWord, status: 'correct' });
                userIdx++;
            } else {
                allCorrect = false;
                resultWords.push({
                    word: expectedWord,
                    userWord: userWord || null,
                    status: userWord ? 'incorrect' : 'missing',
                });
                break;
            }
        }

        const metrics = getPenaltyMetrics(segId);

        if (allCorrect) {
            const dictationScore = computeScore(metrics.hintCount, metrics.replayCount, metrics.wrongSubmitCount);

            setCompletedSet((prev) => {
                const next = new Set([...prev, currentIndex]);
                if (onCompletedChange) onCompletedChange(next);
                return next;
            });
            setFinalScores(prev => ({ ...prev, [segId]: dictationScore }));
            setCheckResults((prev) => ({
                ...prev,
                [segId]: { allCorrect: true, words: resultWords },
            }));

            if (autoAdvance && currentIndex < segments.length - 1) {
                setTimeout(() => {
                    setCurrentIndex(currentIndex + 1);
                }, 2000);
            }
        } else {
            const newWrongCount = (wrongSubmitCounts[segId] ?? 0) + 1;
            setWrongSubmitCounts(prev => ({ ...prev, [segId]: newWrongCount }));
            setCheckResults((prev) => ({
                ...prev,
                [segId]: { allCorrect: false, words: resultWords },
            }));
        }
    }, [currentSegment, userInputs, currentIndex, segments.length, autoAdvance, setCurrentIndex, onCompletedChange, getPenaltyMetrics, wrongSubmitCounts, computeScore]);

    // ── Increment hint count ──
    const incrementHint = useCallback((segId) => {
        setHintCounts(prev => ({ ...prev, [segId]: (prev[segId] ?? 0) + 1 }));
    }, []);

    // ── Increment replay count ──
    const incrementReplay = useCallback((segId) => {
        setReplayCounts(prev => ({ ...prev, [segId]: (prev[segId] ?? 0) + 1 }));
    }, []);

    // ── Auto-check when input matches perfectly ──
    useEffect(() => {
        if (!currentSegment || !currentInput.trim()) return;

        const normUser = normalizeText(currentInput);
        const normTarget = normalizeText(currentSegment.englishText);

        if (normUser === normTarget && !currentResult?.allCorrect) {
            handleCheck();
        }
    }, [currentInput, currentSegment, handleCheck, currentResult]);

    /**
     * getGameResults — returns the final array of results for submitting to the Game API.
     * Called once when all segments are completed.
     */
    const getGameResults = useCallback(() => {
        return segments.map((seg) => ({
            segmentId: seg.id,
            hintCount: hintCounts[seg.id] ?? 0,
            replayCount: replayCounts[seg.id] ?? 0,
            wrongSubmitCount: wrongSubmitCounts[seg.id] ?? 0,
        }));
    }, [segments, hintCounts, replayCounts, wrongSubmitCounts]);

    return {
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

        handleInputChange,
        handleCheck,
        incrementHint,
        incrementReplay,
        getGameResults,
    };
};

export default useGameDictation;
