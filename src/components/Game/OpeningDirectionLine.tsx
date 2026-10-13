/**
 * The one standing direction line (THR-1837, plan U3 / C3).
 *
 * From the bond until The First's first non-routine chapter has resolved, the top
 * bar says what to do first. A caption, never an interrupt: it never pauses the
 * clock. In `chapter_waiting` mode the whole line is a button that opens The
 * First's waiting chapter; otherwise it is plain text naming the one control that
 * moves the story (time). Body size, not uppercase (Law 37); one line, truncating.
 */

import type { OpeningDirectionMode } from '../../engine/openingReveal';
import { formatOpeningDirection } from '../../data/ui-content';

interface OpeningDirectionLineProps {
  mode: OpeningDirectionMode;
  firstName: string | undefined;
  /** "her" / "his" / "their" — from `getPronouns`. */
  theirPossessive: string;
  onOpenChapter?: () => void;
}

const LINE_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
  maxWidth: '520px',
};

export function OpeningDirectionLine({ mode, firstName, theirPossessive, onOpenChapter }: OpeningDirectionLineProps) {
  const text = formatOpeningDirection(mode, firstName, theirPossessive);
  if (mode === 'chapter_waiting' && onOpenChapter) {
    return (
      <button
        type="button"
        data-testid="opening-direction-line"
        data-mode={mode}
        onClick={onOpenChapter}
        title={text}
        style={{
          ...LINE_STYLE,
          color: 'var(--text-primary)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {text}
      </button>
    );
  }
  return (
    <span data-testid="opening-direction-line" data-mode={mode} title={text} style={LINE_STYLE}>
      {text}
    </span>
  );
}
