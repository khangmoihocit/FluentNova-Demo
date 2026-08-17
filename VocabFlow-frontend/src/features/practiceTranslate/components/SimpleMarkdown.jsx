import { Fragment } from 'react';

/**
 * Ultra-light markdown renderer (no external deps).
 * Supports: **bold**, `inline code`, and "- " / "* " bullet lists.
 * Lines are split into paragraphs; consecutive bullet lines become a <ul>.
 */
function renderInline(text, keyPrefix) {
  // Split on **bold** and `code` while keeping delimiters
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={`${keyPrefix}-b-${i}`}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code
          key={`${keyPrefix}-c-${i}`}
          style={{
            background: 'var(--color-surface-container-high)',
            padding: '1px 5px',
            borderRadius: 4,
            fontSize: '0.9em',
          }}
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-t-${i}`}>{tok}</Fragment>;
  });
}

export default function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let bulletBuffer = [];

  const flushBullets = (idx) => {
    if (bulletBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${idx}`} style={{ margin: '4px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {bulletBuffer.map((b, i) => (
            <li key={`li-${idx}-${i}`}>{renderInline(b, `li-${idx}-${i}`)}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      flushBullets(idx);
      return;
    }
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
    } else {
      flushBullets(idx);
      blocks.push(
        <p key={`p-${idx}`} style={{ margin: '0 0 6px' }}>
          {renderInline(line, `p-${idx}`)}
        </p>
      );
    }
  });
  flushBullets('end');

  return <>{blocks}</>;
}
