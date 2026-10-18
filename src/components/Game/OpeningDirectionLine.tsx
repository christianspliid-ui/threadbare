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
  /** THR-1875 (§ F3, yield step 5) — the short form; the full sentence is its tooltip. */
  short?: boolean;
}

/** THR-1875 — the direction line's column; it wraps to at most two lines inside it. */
export const TOPBAR_DIRECTION_MAX_REM = 22;

const LINE_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  lineHeight: 1.2,
  color: 'var(--text-secondary)',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  minWidth: 0,
  maxWidth: `${TOPBAR_DIRECTION_MAX_REM}rem`,
  flexShrink: 0,
};

export function OpeningDirectionLine({ mode, firstName, theirPossessive, onOpenChapter, short = false }: OpeningDirectionLineProps) {
  const full = formatOpeningDirection(mode, firstName, theirPossessive);
  const text = short ? formatOpeningDirection(mode, firstName, theirPossessive, true) : full;
  if (mode === 'chapter_waiting' && onOpenChapter) {
    return (
      <button
        type="button"
        data-testid="opening-direction-line"
        data-mode={mode}
        data-short={short ? 'true' : undefined}
        onClick={onOpenChapter}
        title={full}
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
    <span data-testid="opening-direction-line" data-mode={mode} title={full} style={LINE_STYLE}>
      {text}
    </span>
  );
}
