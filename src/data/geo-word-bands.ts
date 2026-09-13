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

import type { RegionFeatureType } from '../engine/regionDetection';

/** `[exclusive upper threshold, word]`, ascending. The last rung's threshold sits past the
 * quantity's top (>1 for a 0–1 parameter, `Infinity` for an unbounded count) so it always catches. */
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

/** Band a geo quantity to its word. Out-of-range input clamps to the ends. */
export function geoWord(value: number, bands: readonly GeoBand[]): string {
  for (const [threshold, word] of bands) {
    if (value < threshold) return word;
  }
  return bands[bands.length - 1][1];
}

// ── The Area's own two readings (THR-1455) ──────────────────────────────────
//
// `HexSidebar` drew an Area as `{hexCount} hexes` over a bare `featureType` —
// a raw magnitude (Law 13) above a raw `snake_case` enum (Law 14), on the one
// surface that shows an Area's detail. THR-1155 had just made the Area a
// first-class referenceable object; its type was still spelled as an engine key.
//
// These live here rather than in the component for the reason the module header
// already gives: a ladder private to one surface is the shape Law 3 exists to
// prevent. `HexSidebar` is the only player-facing reader today — that is the
// moment to put the ladder somewhere a second reader can find it, not after.

/**
 * What the player calls an Area's geography.
 *
 * Deliberately NOT shared with the `FEATURE_LABELS` tables in
 * `engine/regionNaming.ts` and `engine/hexGrid.ts`, which look identical and are
 * not: those are *name fragments* feeding generated region names ("Grey
 * Mountains"). Merging them would make retuning a display word silently rewrite
 * every generated Area name in a saved world. Same words today, different jobs —
 * the coupling is the hazard, not the duplication.
 *
 * Typed `Record<RegionFeatureType, string>` so an eleventh feature type is a
 * compile error here rather than a leaked key on the surface.
 */
export const AREA_FEATURE_WORDS: Record<RegionFeatureType, string> = {
  mountain_range: 'Mountains',
  hill_country: 'Hills',
  forest: 'Forest',
  plains: 'Plains',
  desert: 'Desert',
  wetland: 'Marshes',
  tundra: 'Wastes',
  river: 'River',
  lake: 'Lake',
  sea: 'Sea',
};

/**
 * Keys already warned about, so an unresolved feature type logs once per session
 * rather than once per render (Law 14: "warns once"). Module-scoped so
 * re-selecting the same hex stays quiet.
 */
const warnedFeatureKeys = new Set<string>();

/**
 * Resolve an Area's feature type to its player-facing word.
 *
 * `HexRegionData.featureType` is typed `string`, not `RegionFeatureType` — it is
 * read back off a graph node's property bag — so this takes the loose type and
 * handles the miss. Law 14's fallback path: best plain English, warn once, never
 * the key itself. NFP #4 — a vocabulary miss degrades the line, never throws.
 */
export function areaFeatureWord(featureType: string): string {
  const word = AREA_FEATURE_WORDS[featureType as RegionFeatureType];
  if (word) return word;

  if (!warnedFeatureKeys.has(featureType)) {
    warnedFeatureKeys.add(featureType);
    console.warn(
      `[geo-word-bands] AREA_FEATURE_WORDS has no entry for "${featureType}" — rendering a ` +
        `plain-English fallback. Add it to the vocabulary in src/data/geo-word-bands.ts.`,
    );
  }
  return featureType
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * How wide an Area reads, in place of its hex count.
 *
 * Thresholds are tuned to the *measured* spread, not the type's range: region
 * `hexCount` over seed 42 runs 50–100 on a small map, 9–150 on medium and 6–192
 * on large (median 59 / 36 / 83). Five rungs so the common medium-map band is
 * not the only one a player ever sees.
 *
 * NFP #1: retune the feel by editing the numbers; no logic changes.
 */
export const AREA_SIZE_WORDS: readonly GeoBand[] = [
  [15, 'Small lands'],
  [40, 'Modest lands'],
  [80, 'Wide lands'],
  [130, 'Vast lands'],
  [Infinity, 'Boundless lands'],
];

/** Band an Area's hex count to its word (Law 13 — the count stays on the trace). */
export function areaSizeWord(hexCount: number): string {
  return geoWord(hexCount, AREA_SIZE_WORDS);
}
