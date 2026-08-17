import { useEffect } from 'react';

/**
 * useDictationShortcuts
 * Encapsulates keyboard shortcut listeners for the Dictation panel.
 *
 * Shortcuts:
 *   Ctrl + ←       → previous sentence
 *   Ctrl + →       → next sentence
 *   Ctrl (alone)   → replay segment
 *
 * Note: Enter key is handled directly on the input via onKeyDown, not here.
 *
 * @param {Object} params
 * @param {Function} params.replaySegment  - Replay the current segment audio
 * @param {Function} params.goToSentence   - Navigate to a specific sentence index
 * @param {number}   params.currentIndex   - Current sentence index
 * @param {boolean}  params.isActive       - Whether the panel is currently active
 */
const useDictationShortcuts = ({ replaySegment, goToSentence, currentIndex, isActive = true }) => {
    useEffect(() => {
        if (!isActive) return;
        
        let ctrlComboUsed = false;

        const keyDownHandler = (e) => {
            // Track if Ctrl is used as part of a combo (arrows)
            if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                ctrlComboUsed = true;
            }

            // Ctrl + ArrowLeft → prev sentence
            if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                goToSentence(currentIndex - 1);
                return;
            }
            // Ctrl + ArrowRight → next sentence
            if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                goToSentence(currentIndex + 1);
                return;
            }
        };

        const keyUpHandler = (e) => {
            if (e.key === 'Control') {
                if (ctrlComboUsed) {
                    ctrlComboUsed = false;
                    return; // Don't replay if Ctrl was used for navigation
                }
                if (!e.shiftKey && !e.altKey && !e.metaKey) {
                    replaySegment();
                }
            }
        };

        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', keyUpHandler);
        return () => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('keyup', keyUpHandler);
        };
    }, [replaySegment, goToSentence, currentIndex, isActive]);
};

export default useDictationShortcuts;
