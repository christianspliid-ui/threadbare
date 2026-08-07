/**
 * CardKeywordChip — THR-890.
 *
 * The nudge card's library-type badge: one glyph and one keyword. The keyword is
 * the player's vocabulary for what kind of thing this card *is* — the same word
 * printed on every member of the family, which is what makes a Boost recognisable
 * before it is read.
 *
 * Presentational only. The keyword and its icon are derived from the card library
 * (`nudgeCardKeyword`) by the stage adapter, never by this component, so the chip
 * cannot disagree with the library about what a card is.
 */

import { memo } from 'react';

// Law 30 (THR-1010): chips render inside the nudge stage, so a local gold
// here paints as a second gold on the veil's composed surface.
const CHIP_BORDER = 'rgb(var(--veil-gold-rgb) / 0.28)';
const CHIP_BG = 'rgb(var(--veil-gold-rgb) / 0.07)';
const CHIP_TEXT = 'var(--veil-text-bright)';

export interface CardKeywordChipProps {
  keyword: string;
  /** Single glyph drawn ahead of the word. Omitted ⇒ word only. */
  icon?: string;
  /** Dim without changing the reading (unaffordable cards). */
  muted?: boolean;
  'data-testid'?: string;
}

export const CardKeywordChip = memo(function CardKeywordChip({
  keyword,
  icon,
  muted = false,
  'data-testid': dataTestId,
}: CardKeywordChipProps) {
  return (
    <span
      data-testid={dataTestId}
      data-card-keyword={keyword}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 7px',
        borderRadius: 999,
        border: `1px solid ${CHIP_BORDER}`,
        background: CHIP_BG,
        color: CHIP_TEXT,
        fontSize: 'var(--text-xs)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        opacity: muted ? 0.55 : 1,
      }}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {keyword}
    </span>
  );
});
