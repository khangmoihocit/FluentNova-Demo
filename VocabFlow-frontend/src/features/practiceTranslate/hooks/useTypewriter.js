import { useEffect, useRef, useState } from 'react';

/**
 * Reveals `fullText` progressively (word-by-word) like popular AI chat UIs.
 * @param {string} fullText - the complete text to reveal
 * @param {{ enabled?: boolean, speed?: number }} options - speed = ms per step
 * @returns {{ displayed: string, done: boolean, skip: () => void }}
 */
export default function useTypewriter(fullText, { enabled = true, speed = 18 } = {}) {
  const [displayed, setDisplayed] = useState(enabled ? '' : fullText || '');
  const [done, setDone] = useState(!enabled);
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);

    if (!fullText) {
      setDisplayed('');
      setDone(true);
      return;
    }

    if (!enabled) {
      setDisplayed(fullText);
      setDone(true);
      return;
    }

    // Reveal by characters but in small chunks for a smooth, fast stream.
    setDisplayed('');
    setDone(false);
    let index = 0;
    const step = Math.max(2, Math.round(fullText.length / 160)); // adaptive chunk size

    timerRef.current = setInterval(() => {
      index += step;
      if (index >= fullText.length) {
        setDisplayed(fullText);
        setDone(true);
        clearInterval(timerRef.current);
      } else {
        setDisplayed(fullText.slice(0, index));
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [fullText, enabled, speed]);

  const skip = () => {
    clearInterval(timerRef.current);
    setDisplayed(fullText || '');
    setDone(true);
  };

  return { displayed, done, skip };
}
