import { memo, useMemo } from 'react';

/**
 * DifficultyScales — THR-1478.
 *
 * The step's difficulty as a drawn balance, replacing the `⚖` text glyph that
 * used to sit beside the word. Director ask, 2026-09-12: *"find a way to iconify
 * the difficulty (fair) without a text. use our color coding and an icon if
 * possible."*
 *
 * **The beam's tilt is the band.** With the word gone, colour alone would be the
 * only at-a-glance channel, and Law 11 puts shape first — so the beam rotates
 * per band, level at `fair` and tipping further against the mortal as the step
 * gets harder. That is also why this became an SVG rather than staying a text
 * character: a glyph cannot tilt, and a rotated `⚖` reads as a rendering fault.
 *
 * The scales themselves are kept deliberately. Two earlier director rulings bind
 * here — *"the difficulty cant stand alone"* (hence a frame around it) and
 * THR-972's icon-not-label directive — and this honours both: the band loses its
 * word on the surface, never its anchor. The word stays in the accessible name,
 * the `ui.nudge_difficulty` tooltip, and the stage's first-contact legend.
 *
 * Colour arrives through `currentColor`, as it does for {@link ForecastDie}, so
 * the caller applies the band ladder and the icon stays a pure shape.
 */

/**
 * Band → beam tilt, in degrees. Positive tips the far pan down: the harder the
 * step, the further the balance has already fallen away from the mortal.
 *
 * `gentle` leans the other way rather than sitting level — a step in the
 * mortal's favour should not look the same as an even one (NFP #1: re-feeling
 * the ladder is changing these four numbers).
 */
const BAND_TILT_DEG: Readonly<Record<string, number>> = {
  gentle: -12,
  fair: 0,
  steep: 11,
  severe: 21,
};

/** Fail-soft (NFP #4): an unrecognised band draws a level beam, never nothing. */
const DEFAULT_TILT_DEG = 0;

export function generateDifficultyScalesSvg(band: string, size: number): string {
  const tilt = BAND_TILT_DEG[band] ?? DEFAULT_TILT_DEG;

  const cx = size / 2;
  const beamY = size * 0.3;
  const beamHalf = size * 0.34;
  const panDrop = size * 0.13;
  const panHalf = size * 0.14;
  const postBottom = size * 0.8;
  const baseHalf = size * 0.19;
  const baseY = size * 0.86;

  /**
   * Stroke scales with the icon, clamped at both ends. Fixed at 1.4 the pans
   * dissolved into hooks at the 14px legend size and went spidery in a large
   * preview; the clamp keeps the silhouette the same weight at every size it is
   * actually drawn at (14 → 1.1, 30 → 1.4).
   */
  const strokeWidth = Math.min(2.2, Math.max(1.1, size * 0.047)).toFixed(2);
  const stroke = `stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" fill="none"`;

  // Stand: post from the pivot down to a foot. Drawn outside the rotation so the
  // scales stay planted while the beam moves. Deliberately just a post and a
  // foot — a tripod read as visual noise at the 30px the row draws it at.
  const stand =
    `<path d="M ${cx} ${beamY} L ${cx} ${postBottom.toFixed(2)}" ${stroke} />` +
    `<path d="M ${(cx - baseHalf).toFixed(2)} ${baseY.toFixed(2)} L ${(cx + baseHalf).toFixed(2)} ${baseY.toFixed(2)}" ${stroke} />`;

  /**
   * A pan hangs from the beam's end — and hangs *plumb*, whatever the beam is
   * doing. Counter-rotating each pan by `-tilt` about its own attachment point
   * is what buys that: rotated with the beam, the pans tipped with it and the
   * icon read as scales falling apart rather than as a balance weighing.
   */
  const pan = (x: number): string =>
    `<g transform="rotate(${-tilt} ${x.toFixed(2)} ${beamY.toFixed(2)})">` +
    `<path d="M ${x.toFixed(2)} ${beamY.toFixed(2)} L ${x.toFixed(2)} ${(beamY + panDrop).toFixed(2)}" ${stroke} />` +
    `<path d="M ${(x - panHalf).toFixed(2)} ${(beamY + panDrop).toFixed(2)} ` +
    `A ${panHalf.toFixed(2)} ${panHalf.toFixed(2)} 0 0 0 ${(x + panHalf).toFixed(2)} ${(beamY + panDrop).toFixed(2)}" ${stroke} />` +
    `</g>`;

  const beam =
    `<g transform="rotate(${tilt} ${cx} ${beamY})">` +
    `<path d="M ${(cx - beamHalf).toFixed(2)} ${beamY.toFixed(2)} L ${(cx + beamHalf).toFixed(2)} ${beamY.toFixed(2)}" ${stroke} />` +
    pan(cx - beamHalf) +
    pan(cx + beamHalf) +
    `</g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    stand +
    beam +
    `</svg>`
  );
}

interface DifficultyScalesProps {
  /** Band word from `DIFFICULTY_WORD_BANDS` — `gentle | fair | steep | severe`. */
  band: string;
  size: number;
  className?: string;
}

export const DifficultyScales = memo(function DifficultyScales({
  band,
  size,
  className,
}: DifficultyScalesProps) {
  const svgString = useMemo(() => generateDifficultyScalesSvg(band, size), [band, size]);

  return (
    <span
      className={className}
      data-difficulty-band={band}
      style={{ display: 'inline-flex', lineHeight: 0 }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
