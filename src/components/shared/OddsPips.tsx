/**
 * OddsPips / CostPips — THR-890.
 *
 * The two pip rows the nudge card row draws. `OddsPips` renders a magnitude in
 * the approved odds vocabulary (shape per tier, colour secondary); `CostPips`
 * renders an essence price as glyphs rather than a digit.
 *
 * Both are presentational only — the tiering lives in
 * `src/data/nudge-pip-vocabulary.ts` and the glyphs in
 * `src/data/nudge-card-display.ts`, so re-tuning the ladder never touches a
 * component (NFP #1).
 *
 * **Accessibility.** Shape carries magnitude, colour merely reinforces it, and
 * the row exposes its reading as text on `aria-label` — the glyph run itself is
 * `aria-hidden`, because a screen reader spelling out "black circle black circle
 * white circle" is worse than silence.
 */

import { memo } from 'react';
import {
  ESSENCE_PIP_GLYPH,
  COST_OVERFLOW_GLYPH,
  MAX_COST_PIPS,
} from '../../data/nudge-card-display';
import { NUDGE_FREE_COST_LABEL } from '../../data/nudge-stage-content';
import { oddsPips, pipReadingLabel } from '../../data/nudge-pip-vocabulary';

/** Gold, matching the veil's essence accent. */
const ESSENCE_COLOR = '#d4af37';
const PIP_LETTER_SPACING = '0.14em';

export interface OddsPipsProps {
  /** Raw 0–1 magnitude — a `forecastDelta` or a success probability. */
  value: number;
  /** Glyph size in px. */
  size?: number;
  /** Dim the row without changing its reading (unaffordable cards). */
  muted?: boolean;
  'data-testid'?: string;
}

/**
 * A magnitude as pips. Renders nothing at all below the vocabulary's epsilon —
 * a card that moves no odds says so by having no odds row, not by drawing an
 * empty one.
 */
export const OddsPips = memo(function OddsPips({
  value,
  size = 12,
  muted = false,
  'data-testid': dataTestId,
}: OddsPipsProps) {
  const reading = oddsPips(value);
  if (!reading) return null;

  const glyphs = Array.from({ length: reading.total }, (_, i) =>
    (i < reading.filled ? reading.tier.filledGlyph : reading.tier.hollowGlyph),
  ).join('');

  return (
    <span
      data-testid={dataTestId}
      data-pip-tier={reading.tier.id}
      data-pip-filled={reading.filled}
      role="img"
      aria-label={pipReadingLabel(reading)}
      title={pipReadingLabel(reading)}
      style={{
        fontSize: size,
        lineHeight: 1,
        letterSpacing: PIP_LETTER_SPACING,
        color: reading.tier.color,
        opacity: muted ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true">{glyphs}</span>
    </span>
  );
});

export interface CostPipsProps {
  /** Essence price — the *effective* cost, after any sphere discount. */
  cost: number;
  size?: number;
  /** Emphasise the price, as an unaffordable card does. */
  emphasised?: boolean;
  'data-testid'?: string;
}

/**
 * An essence price as pips. A zero cost reads as the word `Free` rather than an
 * absent row: "this costs nothing" is information, and a blank would read as
 * "cost unknown".
 */
export const CostPips = memo(function CostPips({
  cost,
  size = 12,
  emphasised = false,
  'data-testid': dataTestId,
}: CostPipsProps) {
  const rounded = Math.max(0, Math.round(cost));

  if (rounded === 0) {
    return (
      <span
        data-testid={dataTestId}
        data-cost-pips={0}
        style={{
          fontSize: size,
          lineHeight: 1,
          color: ESSENCE_COLOR,
          letterSpacing: '0.06em',
          opacity: emphasised ? 1 : 0.85,
        }}
      >
        {NUDGE_FREE_COST_LABEL}
      </span>
    );
  }

  const shown = Math.min(rounded, MAX_COST_PIPS);
  const overflowed = rounded > MAX_COST_PIPS;
  const label = `${rounded} essence`;

  return (
    <span
      data-testid={dataTestId}
      data-cost-pips={rounded}
      role="img"
      aria-label={label}
      title={label}
      style={{
        fontSize: size,
        lineHeight: 1,
        letterSpacing: PIP_LETTER_SPACING,
        color: ESSENCE_COLOR,
        textShadow: emphasised ? `0 0 6px ${ESSENCE_COLOR}` : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true">
        {ESSENCE_PIP_GLYPH.repeat(shown)}
        {overflowed ? COST_OVERFLOW_GLYPH : ''}
      </span>
    </span>
  );
});
