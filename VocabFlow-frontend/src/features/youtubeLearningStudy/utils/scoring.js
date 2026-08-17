/**
 * scoring.js
 * Pure utility functions for text normalization, comparison, and scoring.
 * Zero React dependencies — fully testable in isolation.
 */

/**
 * Strip punctuation, lowercase, collapse whitespace.
 * @param {string} text
 * @returns {string}
 */
export const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Perform word-level sequence alignment using dynamic programming.
 * @param {string} original 
 * @param {string} recognized 
 * @returns {Object} { results, score }
 */
const getAlignment = (original, recognized) => {
    const origWords = normalizeText(original).split(/\s+/).filter(Boolean);
    const recWords = normalizeText(recognized).split(/\s+/).filter(Boolean);
    const displayOrigWords = (original || '').split(/\s+/).filter(Boolean);
    
    const m = origWords.length;
    const n = recWords.length;
    
    if (m === 0 && n === 0) return { results: [], score: 100 };
    if (m === 0) return { results: recWords.map(w => ({ word: '', userWord: w, status: 'extra' })), score: 0 };
    if (n === 0) return { results: displayOrigWords.map(w => ({ word: w, status: 'missing' })), score: 0 };

    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (origWords[i - 1] === recWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]; 
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],    // deletion (missing from rec)
                    dp[i][j - 1],    // insertion (extra in rec)
                    dp[i - 1][j - 1] // substitution (incorrect)
                );
            }
        }
    }
    
    let i = m;
    let j = n;
    const actions = [];
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && origWords[i - 1] === recWords[j - 1]) {
            actions.unshift({ type: 'correct', origIndex: i - 1, recIndex: j - 1 });
            i--; j--;
        } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
            actions.unshift({ type: 'incorrect', origIndex: i - 1, recIndex: j - 1 });
            i--; j--;
        } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
            actions.unshift({ type: 'missing', origIndex: i - 1, recIndex: null });
            i--;
        } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
            actions.unshift({ type: 'extra', origIndex: null, recIndex: j - 1 });
            j--;
        }
    }
    
    const results = [];
    
    for (const action of actions) {
        if (action.type === 'correct') {
            results.push({ word: displayOrigWords[action.origIndex] || origWords[action.origIndex], status: 'correct', userWord: recWords[action.recIndex] });
        } else if (action.type === 'incorrect') {
            results.push({ word: displayOrigWords[action.origIndex] || origWords[action.origIndex], userWord: recWords[action.recIndex], status: 'incorrect' });
        } else if (action.type === 'missing') {
            results.push({ word: displayOrigWords[action.origIndex] || origWords[action.origIndex], status: 'missing' });
        } else if (action.type === 'extra') {
            results.push({ word: '', userWord: recWords[action.recIndex], status: 'extra' });
        }
    }
    
    const distance = dp[m][n];
    const correctCount = actions.filter((action) => action.type === 'correct').length;
    const substitutions = actions.filter((action) => action.type === 'incorrect').length;
    const missing = actions.filter((action) => action.type === 'missing').length;
    const extra = actions.filter((action) => action.type === 'extra').length;
    const precision = correctCount / Math.max(n, 1);
    const recall = correctCount / Math.max(m, 1);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    // Shadowing should be encouraging: a small recognition mismatch should not
    // collapse the score. Missing words still matter more than extra/noisy words.
    const weightedPenalty = (substitutions * 0.55) + (missing * 0.75) + (extra * 0.25);
    const editScore = Math.max(0, 100 - ((weightedPenalty / Math.max(m, 1)) * 100));
    const f1Score = f1 * 100;
    const legacyScore = Math.max(0, ((m - distance) / m) * 100);
    const score = Math.max(0, Math.min(100, Math.round((editScore * 0.55) + (f1Score * 0.35) + (legacyScore * 0.10))));
    
    return { results, score };
};

/**
 * Compute similarity score (0–100) between original and recognized text at word level.
 * @param {string} original
 * @param {string} recognized
 * @returns {number}
 */
export const computeScore = (original, recognized) => {
    return getAlignment(original, recognized).score;
};

/**
 * Build word-by-word comparison results.
 * Each word → { word, status: 'correct' | 'incorrect' | 'missing' | 'extra' }
 * @param {string} original
 * @param {string} recognized
 * @returns {Array<{word: string, userWord?: string, status: string}>}
 */
export const compareWords = (original, recognized) => {
    return getAlignment(original, recognized).results;
};

/**
 * Return a color for the score progress display.
 * @param {number} score
 * @returns {string}
 */
export const scoreColor = (score) => {
    if (score >= 80) return '#2E7D32';
    if (score >= 50) return '#B26A00';
    return '#D32F2F';
};
