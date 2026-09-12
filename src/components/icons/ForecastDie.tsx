import { memo, useMemo } from 'react';
import type { ForecastTier } from '../../types/resolution';

/**
 * ForecastDie — THR-1478.
 *
 * Fate's forecast as a die face. Director ask, 2026-09-12: *"remove the word
 * forecast. make the forecast score 'uncertain' into an icon like a dice … with
 * an icon on it. this means we need an icon version of the level of chance of
 * success."*
 *
 * **The pip count is the ladder rung**, not a quantity: five tiers, five die
 * faces, one through five. That is what keeps this inside Law 13 — nothing here
 * is a magnitude the player could read off as a number, it is the same ordinal
 * word ladder (`doomed … fated`) drawn as a shape. Shape carries the reading and
 * colour seconds it (Law 11), so the tier stays legible without colour vision;
 * the tier *word* is one hover away and is taught in the stage's first-contact
 * legend (Law 12).
 *
 * **Colour comes from the caller**, through `currentColor`. The forecast's
 * loss→gold→gain ladder lives in `FORECAST_TIER_COLORS` (`shared/CardFace`), a
 * component module the icon set must not import; setting `color` on the wrapper
 * keeps this icon a pure shape and lets it take theme colours the way the rest
 * of the set does.
 */

/**
 * Tier → pips on the face. The ordinal ladder, drawn.
 *
 * One pip is the worst reading and five the best, which is the direction a die
 * already teaches. Changing how a tier reads is changing a number here (NFP #1).
 */
export const FORECAST_TIER_PIPS: Readonly<Record<ForecastTier, number>> = {
  doomed: 1,
  perilous: 2,
  uncertain: 3,
  favorable: 4,
  fated: 5,
};

/** Pip layout on the unit face, in the classic die arrangement. */
const PIP_LAYOUTS: Readonly<Record<number, readonly (readonly [number, number])[]>> = {
  1: [[0.5, 0.5]],
  2: [[0.3, 0.3], [0.7, 0.7]],
  3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
  4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
  5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
};

/** Pip radius as a fraction of the die's edge. */
const PIP_RADIUS_RATIO = 0.085;
/** Corner rounding as a fraction of the edge. */
const CORNER_RATIO = 0.2;
/** Face wash behind the pips — present enough to read as a solid die, not a box. */
const FACE_FILL_OPACITY = 0.1;

export function generateForecastDieSvg(tier: ForecastTier, size: number): string {
  const pips = PIP_LAYOUTS[FORECAST_TIER_PIPS[tier]] ?? PIP_LAYOUTS[3]!;
  const rx = size * CORNER_RATIO;
  const r = size * PIP_RADIUS_RATIO;
  const inset = 1.25;

  const face =
    `<rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" ` +
    `rx="${rx}" ry="${rx}" fill="currentColor" fill-opacity="${FACE_FILL_OPACITY}" ` +
    `stroke="currentColor" stroke-width="1.5" />`;

  const marks = pips
    .map(([x, y]) => `<circle cx="${(x * size).toFixed(2)}" cy="${(y * size).toFixed(2)}" r="${r.toFixed(2)}" fill="currentColor" />`)
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    face +
    marks +
    `</svg>`
  );
}

interface ForecastDieProps {
  tier: ForecastTier;
  size: number;
  className?: string;
}

export const ForecastDie = memo(function ForecastDie({ tier, size, className }: ForecastDieProps) {
  const svgString = useMemo(() => generateForecastDieSvg(tier, size), [tier, size]);

  return (
    <span
      className={className}
      data-forecast-tier={tier}
      style={{ display: 'inline-flex', lineHeight: 0 }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
