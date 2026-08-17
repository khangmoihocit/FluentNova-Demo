import { useEffect } from 'react';

/**
 * useShortcuts
 * Encapsulates keyboard shortcut listeners for the Shadowing panel.
 *
 * Shortcuts:
 *   Shift + `       → toggle recording
 *   Ctrl + ←/→     → navigate sentences
 *   Space           → play user's recording
 *   Ctrl (alone)    → play sample audio
 *
 * @param {Object} params
 * @param {Function} params.toggleRecording
 * @param {Function} params.playSample
 * @param {Function} params.playUserAudio
 * @param {number}   params.currentIndex
 * @param {boolean}  params.isActive
 */
const useShortcuts = ({ toggleRecording, playSample, playUserAudio, goToSentence, currentIndex, isActive = true }) => {
    useEffect(() => {
        if (!isActive) return;

        // Track whether Ctrl was used in a combo to avoid double-fire
        let ctrlComboUsed = false;

        const handleKeyDown = (e) => {
            // Shift + ` (Backquote) → toggle recording
            if (e.shiftKey && e.code === 'Backquote') {
                e.preventDefault();
                toggleRecording();
                return;
            }
            // Ctrl + ArrowLeft → prev sentence
            if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                ctrlComboUsed = true;
                goToSentence(currentIndex - 1);
                return;
            }
            // Ctrl + ArrowRight → next sentence
            if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                ctrlComboUsed = true;
                goToSentence(currentIndex + 1);
                return;
            }
            // Space (no modifiers) → play user's recording
            if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
                // Don't hijack Space if user is in an input/textarea
                const tag = document.activeElement?.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;
                e.preventDefault();
                playUserAudio();
                return;
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Control') {
                if (ctrlComboUsed) {
                    ctrlComboUsed = false;
                    return; // Don't fire sample play after a Ctrl combo
                }
                // Only fire if no other modifier
                if (!e.shiftKey && !e.altKey && !e.metaKey) {
                    playSample();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [toggleRecording, playSample, playUserAudio, goToSentence, currentIndex, isActive]);
};

export default useShortcuts;
