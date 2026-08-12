/**
 * DeltaCluster (THR-1082) — how much a state changed, at a glance.
 *
 * ## The problem it exists to solve
 *
 * The aftermath used to say *"Vara's Stone grew steadily."* Christian's verdict
 * on that line is the reason this component exists: **"what does steadily even
 * mean? how can a player use that word to gage anything"**. The engine knew the
 * magnitude — a five-rung ladder in `engine/aftermathWords.ts` — and spent it on
 * an adverb whose place on that ladder the reader has no way to recover. A word
 * that cannot be compared to the word above it is not a measurement.
 *
 * So the headline reading becomes visual: a short run of triangles the eye
 * counts without reading. The banded word is not deleted — it moves to the
 * hover tier via `label`, which is also the `aria-label`, so the ladder still
 * explains itself where someone wants the detail.
 *
 * ## Why triangles, and why not `OddsPips`
 *
 * Christian's approval was conditional: *"chevrons are fine as long as we use
 * the same iconography as the encounter screens"*. `▲`/`▼` is exactly the
 * family the encounter hand already draws — `NUDGE_GLYPH_LEGEND`'s setback
 * marker is `▼` — so the ending speaks the vocabulary of the screens that led
 * to it.
 *
 * Law 10 then forbids the obvious shortcut. Pips mean **effect on the odds**,
 * everywhere, and reusing that row for realised state change would put one glyph
 * row in two jobs — the precise confusion THR-972 §5 found when price, odds and
 * forecast pips shared a look and the director could not tell them apart at
 * 13px. Same *family*, distinct *component*, distinct meaning.
 *
 * ## Law compliance, stated so a reviewer can check it
 *
 * - **Law 11** — glyphs render at `DELTA_CLUSTER_GLYPH_SIZE_PX` (14, the shipped
 *   floor for a meaning-bearing glyph), and the row carries an `aria-label`
 *   stating its reading in words. Shape is the accessibility channel: a gain and
 *   a loss differ by which way the triangle points, not only by colour.
 * - **Law 13** — no numeral is drawn. The count is expressed as *how many marks
 *   there are*, which is a shape, not a printed magnitude.
 * - **Law 30** — colour arrives as a token-valued `color` prop or falls back to
 *   `--positive` / `--negative` / `--accent-gold`. No hex here.
 * - **Law 31** — polarity is never carried by hue alone; the direction is in the
 *   glyph's orientation and again in the words of the label.
 */

import { memo } from 'react';

/** Law 11 — the shipped legibility floor for a meaning-bearing glyph. */
export const DELTA_CLUSTER_GLYPH_SIZE_PX = 14;

/**
 * The triangle family, matching the encounter hand's setback marker so the
 * aftermath and the screens before it share one vocabulary.
 */
export const DELTA_GAIN_GLYPH = '▲';
export const DELTA_LOSS_GLYPH = '▼';

/**
 * A way opening has no scale, so PATH takes a single scale-less marker rather
 * than a run that would imply a quantity nobody measured.
 */
export const PATH_MARKER_GLYPH = '◆';

/** Most marks a cluster draws — past three, a row stops being countable at a glance. */
export const DELTA_CLUSTER_MAX = 3;

export interface DeltaClusterProps {
  /** `gain`/`loss` draw a run of triangles; `opens` draws the single PATH marker. */
  direction: 'gain' | 'loss' | 'opens';
  /** Marks drawn, clamped to 1..`DELTA_CLUSTER_MAX`. */
  count: number;
  /**
   * The whole reading in words — "Stone rose, a clear amount". Becomes the
   * `aria-label` and the `title`, so the ladder the count was banded from stays
   * available to anyone who wants the detail (Law 11).
   */
  label: string;
  /**
   * Token-valued colour override. Surfaces with a sanctioned palette variant
   * (the encounter veil) pass their own token; everything else takes the
   * game-wide polarity tokens.
   */
  color?: string;
  /** Glyph size in px. Defaults to the Law 11 floor; never set below it. */
  size?: number;
}

function defaultColorFor(direction: DeltaClusterProps['direction']): string {
  if (direction === 'opens') return 'var(--accent-gold)';
  return direction === 'gain' ? 'var(--positive)' : 'var(--negative)';
}

export const DeltaCluster = memo(function DeltaCluster({
  direction,
  count,
  label,
  color,
  size = DELTA_CLUSTER_GLYPH_SIZE_PX,
}: DeltaClusterProps) {
  // A change that happened draws at least one mark. Zero marks would say
  // "nothing changed" on a chip whose entire reason for existing is that
  // something did — the fail-soft floor, not a defensive nicety.
  const drawn = direction === 'opens'
    ? 1
    : Math.max(1, Math.min(DELTA_CLUSTER_MAX, Math.round(count) || 1));
  const glyph = direction === 'opens'
    ? PATH_MARKER_GLYPH
    : direction === 'gain' ? DELTA_GAIN_GLYPH : DELTA_LOSS_GLYPH;

  return (
    <span
      // One image with one reading, rather than N marks a screen reader would
      // announce separately as meaningless glyph names.
      role="img"
      aria-label={label}
      title={label}
      data-testid="delta-cluster"
      data-direction={direction}
      data-count={drawn}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        color: color ?? defaultColorFor(direction),
        fontSize: size,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {Array.from({ length: drawn }, (_, i) => (
        <span key={i} aria-hidden="true">{glyph}</span>
      ))}
    </span>
  );
});
