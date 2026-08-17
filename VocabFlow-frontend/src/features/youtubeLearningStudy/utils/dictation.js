/**
 * dictation.js
 * Pure utility functions for the dictation exercise.
 * Handles text parsing, character-level hints, and client-side answer checking.
 */

import { normalizeText } from './scoring';

/**
 * Parse original text into word objects for hint display.
 * Each word → { original: "Hello,", clean: "hello" }
 * @param {string} text
 * @returns {Array<{original: string, clean: string}>}
 */
export const parseWords = (text) => {
    if (!text) return [];
    return text.split(/\s+/).map((token) => {
        const clean = token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return { original: token, clean };
    });
};

/**
 * Get character-level hints for a single word.
 * Compare each char of the typed word with the expected clean word.
 * @param {string} originalWord - The word with original casing/punctuation
 * @param {string} cleanWord    - The lowercase, punctuation-stripped version
 * @param {string} typedWord    - What the user typed (normalized)
 * @returns {Array<{char: string, status: 'correct'|'incorrect'|'neutral'}>}
 */
export const getCharHints = (originalWord, cleanWord, typedWord) => {
    const result = [];
    let cleanIdx = 0;

    for (let i = 0; i < originalWord.length; i++) {
        const origChar = originalWord[i];

        // Is this an alpha/numeric/apostrophe character?
        if (/[a-zA-Z0-9]/.test(origChar)) {
            const expectedChar = cleanWord[cleanIdx]?.toLowerCase();
            const typedChar = typedWord?.[cleanIdx]?.toLowerCase();

            if (typedChar === undefined) {
                // Not typed yet → show *
                result.push({ char: '*', status: 'neutral' });
            } else if (typedChar === expectedChar) {
                // Correct → reveal original character
                result.push({ char: origChar, status: 'correct' });
            } else {
                // Incorrect → show * in red
                result.push({ char: '*', status: 'incorrect' });
            }
            cleanIdx++;
        } else {
            // Punctuation → always show as-is
            result.push({ char: origChar, status: 'neutral' });
        }
    }

    return result;
};

/**
 * Run client-side check for a specific segment (pure function, no state).
 * Shows correct words the user typed, stops at the first wrong/missing word.
 * @param {Object} segment  - Segment with .englishText
 * @param {string} userText - User's typed input
 * @returns {{ allCorrect: boolean, words: Array<{word: string, userWord?: string, status: string}> } | null}
 */
export const runClientCheck = (segment, userText) => {
    if (!segment || !userText?.trim()) return null;
    const normalizedUser = normalizeText(userText).split(/\s+/).filter(Boolean);
    const originalWords = parseWords(segment.englishText);

    const resultWords = [];
    let allCorrect = true;
    let userIdx = 0;

    for (let i = 0; i < originalWords.length; i++) {
        const hw = originalWords[i];

        if (!hw.clean) {
            // Punctuation-only token
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
    return { allCorrect, words: resultWords };
};
