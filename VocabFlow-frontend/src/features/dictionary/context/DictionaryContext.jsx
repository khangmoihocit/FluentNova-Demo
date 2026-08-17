import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DictionaryContext = createContext(null);

/**
 * Global provider for the Dictionary Lookup Drawer & Popup.
 * Manages open/close state, trigger type, positional coordinates, and sentence context.
 */
export const DictionaryProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [initialWord, setInitialWord] = useState('');
  const [targetUnitId, setTargetUnitId] = useState(null);
  const [triggerType, setTriggerType] = useState('manual'); // 'manual' | 'selection'
  const [position, setPosition] = useState(null); // { x, y, selectionRect }
  const [sentence, setSentence] = useState('');

  const openDrawer = useCallback(({
    word = '',
    unitId = null,
    triggerType = 'manual',
    position = null,
    sentence = ''
  } = {}) => {
    setInitialWord(word);
    setTargetUnitId(unitId);
    setTriggerType(triggerType);
    setPosition(position);
    setSentence(sentence);
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    // Keep initialWord and position so closing transition animations render properly
  }, []);

  // Global double-click word lookup listener
  useEffect(() => {
    const handleGlobalDblClick = (e) => {
      const target = e.target;
      if (!target) return;

      // Skip interactive tags to avoid disrupting standard browser actions
      const interactiveSelector = 'a, button, input, textarea, select, option, [role="button"], [contenteditable="true"], .ant-select-selector, .ant-input-affix-wrapper';
      if (target.closest(interactiveSelector)) return;

      // Extract the double-clicked word from standard browser selection
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Clean leading/trailing punctuation (e.g. "word." -> "word")
      const cleanedText = selectedText.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

      // Match standard English words (supports hyphens and apostrophes like "don't", "self-study")
      const englishWordRegex = /^[a-zA-Z]+(?:['-][a-zA-Z]+)*$/;
      const vietnameseDiacritics = /[àáâãèéêìíòóôõùúýăđơưạảấầẩẫắặằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹỵÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐƠƯ]/i;

      if (
        cleanedText &&
        englishWordRegex.test(cleanedText) &&
        !vietnameseDiacritics.test(cleanedText) &&
        cleanedText.length >= 2 &&
        cleanedText.length <= 30
      ) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Try to extract the surrounding sentence for contextual cards
          let sentenceText = '';
          const node = selection.anchorNode;
          if (node && node.nodeType === 3) {
            const fullText = node.textContent;
            const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
            sentenceText = sentences.find(s => s.includes(selectedText)) || fullText;
            sentenceText = sentenceText.trim();
          }

          openDrawer({
            word: cleanedText.toLowerCase(),
            triggerType: 'selection',
            position: {
              x: rect.left + window.scrollX,
              y: rect.bottom + window.scrollY,
              selectionRect: {
                top: rect.top + window.scrollY,
                bottom: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                right: rect.right + window.scrollX,
                width: rect.width,
                height: rect.height,
              }
            },
            sentence: sentenceText
          });
        } catch (err) {
          console.warn('Failed to resolve double-click selection coordinates', err);
        }
      }
    };

    document.addEventListener('dblclick', handleGlobalDblClick);
    return () => {
      document.removeEventListener('dblclick', handleGlobalDblClick);
    };
  }, [openDrawer]);

  return (
    <DictionaryContext.Provider
      value={{
        open,
        initialWord,
        targetUnitId,
        triggerType,
        position,
        sentence,
        openDrawer,
        closeDrawer
      }}
    >
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = () => {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error('useDictionary must be used within DictionaryProvider');
  return ctx;
};
