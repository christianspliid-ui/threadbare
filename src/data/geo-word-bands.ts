/**
 * Geographic word bands — how the player reads elevation, temperature and
 * moisture (UI Law 13: no percentages on any mortal-facing surface).
 *
 * These arrived as `${Math.round(v * 100)}%` on every surface that drew them.
 * `HexDetailView` banded its own copy first; THR-1451 found the same numeral
 * still live on `InfoPanel` and the hex tooltip, which is the shape UI Law 3
 * exists to prevent — one reading, three implementations, and only one of them
 * fixed. The ladder now lives here, beside nothing but itself, and the three
 * surfaces read from it.
 *
 * The raw number stays in `tile.geoParams` and on the designer view. The player
 * reads the land instead.
 *
 * NFP #1: five bands, one table each, retuned without touching logic.
 */

/** `[exclusive upper threshold, word]`, ascending. The last rung's threshold is >1 so it catches the top. */
export type GeoBand = readonly [threshold: number, word: string];

export const ELEVATION_WORDS: readonly GeoBand[] = [
  [0.2, 'Lowland'], [0.4, 'Rolling'], [0.6, 'Upland'], [0.8, 'Highland'], [1.01, 'Alpine'],
];

export const TEMPERATURE_WORDS: readonly GeoBand[] = [
  [0.2, 'Frozen'], [0.4, 'Cold'], [0.6, 'Temperate'], [0.8, 'Warm'], [1.01, 'Scorching'],
];

export const MOISTURE_WORDS: readonly GeoBand[] = [
  [0.2, 'Arid'], [0.4, 'Dry'], [0.6, 'Moderate'], [0.8, 'Damp'], [1.01, 'Drenched'],
];

/** Band a 0–1 geo parameter to its word. Out-of-range input clamps to the ends. */
export function geoWord(value: number, bands: readonly GeoBand[]): string {
  for (const [threshold, word] of bands) {
    if (value < threshold) return word;
  }
  return bands[bands.length - 1][1];
}
