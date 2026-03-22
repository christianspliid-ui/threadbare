/**
 * Signifier registry — maps TerrainType land values to SVG signifier variants.
 *
 * Coverage:
 *   - 28 terrain types with direct registry entries (25 from LART requirements + 3 extras)
 *   - 6 terrain types mapped via TERRAIN_SIGNIFIER_FALLBACK (farmland, jungle, evergreen_forest,
 *     arctic, great_home_trees, oasis)
 *   - 2 LART requirements absorbed into combined entries:
 *       LART-22 (hardened_clay) → absorbed into 'badlands' (total: 5 variants)
 *       LART-28 (lava) → absorbed into 'volcano' (total: 5 variants)
 *   Total coverage: 28 direct + 6 fallback = all 33 land TerrainType values
 *
 * NFP #1 (tunability): Jitter and rotation ranges are named constants below.
 * NFP #3 (determinism): getSignifierParams uses mulberry32 seeded from hex coordinates.
 * NFP #4 (fail-soft): Lookups are against plain Record — missing keys return undefined, not errors.
 *
 * PLACEHOLDER NOTICE: All `d` strings contain valid placeholder SVG path data.
 * Plans 03 and 04 will replace these with production hand-drawn SVGs matching the
 * Spliid art style (asymmetric sun-from-right shadow, organic paths, fill-only).
 */

import { mulberry32 } from '../../../lib/prng';

// ── NFP #1: Tunable constants ────────────────────────────────────────────────

/** Position jitter range: ±10% of hex size in each axis */
const SIGNIFIER_JITTER_RANGE = 0.2;   // full range; jitter = (rng() - 0.5) * RANGE

/** Rotation jitter range: ±15° (π/12 radians) */
const SIGNIFIER_ROTATION_RANGE = Math.PI / 6;  // full range; rotation = (rng() - 0.5) * RANGE

// ── Types ────────────────────────────────────────────────────────────────────

/** A single fill-only SVG path element. No stroke — fills scale cleanly at all sizes. */
export interface SignifierPath {
  d: string;       // SVG path data (M, L, C, Q, Z commands)
  opacity: number; // 0.2–0.7 range per multi-layer depth decision (locked)
}

/**
 * One visual variant of a terrain signifier.
 * Paths are composited bottom-to-top using canvas globalAlpha.
 */
export interface SignifierVariant {
  paths: SignifierPath[];
  viewBox: string; // always '0 0 100 100' to match hand-drawn SVG coordinate space
}

/** Map from TerrainType name to ordered array of variants. */
export type SignifierRegistry = Record<string, SignifierVariant[]>;

// ── Placeholder path data helpers ────────────────────────────────────────────

/**
 * Build placeholder variants for a terrain type.
 * Each variant is a simple shape distinguishable by minor path difference.
 * Plans 03–04 will replace these d strings with production art.
 */

// Simple reusable placeholder shapes (100x100 viewBox coordinates)
const PLACEHOLDER_TRIANGLE = 'M50,15 L85,80 L15,80 Z';
const PLACEHOLDER_HILL = 'M15,75 Q50,20 85,75 Z';
const PLACEHOLDER_HILL_DOUBLE = 'M10,75 Q30,30 55,75 Q70,40 90,75 Z';
const PLACEHOLDER_TREE = 'M50,15 L75,55 L62,55 L75,80 L25,80 L38,55 L25,55 Z';
const PLACEHOLDER_CIRCLE = 'M50,20 A30,30 0 1,0 50.01,20 Z';
const PLACEHOLDER_WAVE = 'M10,50 Q25,30 40,50 Q55,70 70,50 Q85,30 90,50 L90,75 L10,75 Z';
const PLACEHOLDER_CRACKS = 'M20,20 L35,45 L25,60 L40,80 M60,20 L50,40 L65,55 L55,80 M40,30 L55,50';
const PLACEHOLDER_DOTS = 'M30,40 A5,5 0 1,0 30.01,40 Z M60,35 A5,5 0 1,0 60.01,35 Z M50,60 A4,4 0 1,0 50.01,60 Z';
const PLACEHOLDER_RIDGE = 'M10,70 L30,35 L50,55 L70,25 L90,70 Z';
const PLACEHOLDER_SPIRES = 'M25,75 L35,30 L45,75 M45,75 L55,40 L65,75 M65,75 L70,50 L80,75 Z';
const PLACEHOLDER_DUNES = 'M10,65 Q30,35 50,60 Q70,35 90,65 L90,80 L10,80 Z';
const PLACEHOLDER_REEDS = 'M30,20 L28,80 M50,15 L48,80 M70,25 L68,80 M20,50 Q50,40 80,50';

// ── SIGNIFIER_REGISTRY ───────────────────────────────────────────────────────

/**
 * Authoritative signifier variant registry.
 *
 * Key: actual TerrainType name (from src/types/index.ts).
 * Value: ordered array of SignifierVariant. Variant selected per-hex via getSignifierParams.
 *
 * LART mapping notes:
 *   - 'light_forest' corresponds to LART-05 'woodland'
 *   - 'desert' corresponds to LART-19 'sand_desert'
 *   - 'volcano' covers both LART-27 'volcanic' (variants 0-2) and LART-28 'lava' (variants 3-4)
 *   - 'badlands' covers both LART-23 'badlands' (variants 0-2) and LART-22 'hardened_clay' (variants 3-4)
 */
export const SIGNIFIER_REGISTRY: SignifierRegistry = {

  // ── Lowlands ──────────────────────────────────────────────────────────────

  // LART-01: grassland (3 variants: clean, light tufts, wildflowers)
  grassland: [
    { paths: [{ d: 'M20,70 Q30,55 40,70 Q50,55 60,70 Q70,55 80,70', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,72 Q25,58 35,72 Q45,60 55,72 Q65,58 75,72 Q82,62 88,72', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: PLACEHOLDER_DOTS + ' M20,65 A3,3 0 1,0 20.01,65 Z M70,68 A3,3 0 1,0 70.01,68 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-02: savanna (3 variants: single tree, two trees, dry grass)
  savanna: [
    { paths: [{ d: 'M50,20 Q65,40 50,50 Q35,40 50,20 M50,50 L50,80', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M30,25 Q42,42 30,50 Q18,42 30,25 M30,50 L30,80 M65,30 Q77,47 65,55 Q53,47 65,30 M65,55 L65,80', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,75 L20,55 M30,75 L38,60 M50,75 L55,58 M65,75 L72,62 M80,75 L88,57', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-03: steppe (3 variants: scrub, bent grass, bare)
  steppe: [
    { paths: [{ d: 'M20,68 L18,55 M35,70 L33,58 M50,66 L48,54 M65,69 L63,57 M80,67 L78,56', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,70 Q15,55 25,52 M45,68 Q40,54 50,51 M70,70 Q65,56 75,53', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,75 L85,75 M20,72 L80,72', opacity: 0.3 }], viewBox: '0 0 100 100' },
  ],

  // LART-04: floodplain (2 variants: dry, wet-season marks)
  floodplain: [
    { paths: [{ d: 'M10,60 Q50,55 90,60 Q50,65 10,60', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,55 Q50,50 90,55 M10,65 Q50,60 90,65 M10,75 Q50,70 90,75', opacity: 0.4 }], viewBox: '0 0 100 100' },
  ],

  // ── Forest ────────────────────────────────────────────────────────────────

  // LART-05: woodland / light_forest (4 variants: 2-tree, 3-tree, single large, mixed)
  light_forest: [
    { paths: [{ d: `${PLACEHOLDER_TREE.replace(/50/g, '35').replace(/75/g, '60').replace(/25/g, '10').replace(/62/g, '47').replace(/38/g, '23')} M${PLACEHOLDER_TREE.replace(/50/g, '65')}`, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,70 L25,50 L10,50 L25,25 L40,50 L25,50 M50,70 L50,45 L35,45 L50,20 L65,45 L50,45 M75,70 L75,52 L62,52 L75,30 L88,52 L75,52', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M50,70 L50,40 L30,40 L50,10 L70,40 L50,40', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M30,72 L30,55 L18,55 L30,32 L42,55 L30,55 M65,68 Q80,48 65,48 Q50,48 65,68', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-06: temperate_forest (4 variants: tight cluster, mixed sizes, clearing, full canopy)
  temperate_forest: [
    { paths: [{ d: 'M35,70 L35,48 L20,48 L35,20 L50,48 L35,48 M55,70 L55,50 L42,50 L55,25 L68,50 L55,50', opacity: 0.55 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,72 L25,52 L12,52 L25,28 L38,52 L25,52 M55,68 L55,42 L40,42 L55,15 L70,42 L55,42 M78,74 L78,58 L68,58 L78,40 L88,58 L78,58', opacity: 0.55 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,72 L15,52 L5,52 L15,32 L25,52 L15,52 M85,72 L85,52 L75,52 L85,32 L95,52 L85,52 M30,78 Q50,55 70,78', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,72 L20,50 L10,50 L20,25 L30,50 L20,50 M45,70 L45,45 L32,45 L45,18 L58,45 L45,45 M70,72 L70,50 L60,50 L70,28 L80,50 L70,50', opacity: 0.6 }], viewBox: '0 0 100 100' },
  ],

  // LART-07: dense_forest (3 variants: solid canopy, deep shade, ancient trunks)
  dense_forest: [
    { paths: [{ d: 'M15,70 L15,45 L5,45 L15,20 L25,45 L15,45 M40,72 L40,48 L28,48 L40,22 L52,48 L40,48 M65,70 L65,45 L53,45 L65,20 L77,45 L65,45 M82,72 L82,52 L74,52 L82,35 L90,52 L82,52', opacity: 0.6 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,72 L20,48 L8,48 L20,22 L32,48 L20,48 M50,70 L50,44 L37,44 L50,18 L63,44 L50,44 M75,72 L75,50 L65,50 L75,30 L85,50 L75,50', opacity: 0.6 }, { d: 'M10,80 L10,55 M35,80 L35,58 M60,80 L60,55 M80,80 L80,58', opacity: 0.3 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,80 L20,35 M35,80 L35,40 M55,80 L55,32 M70,80 L70,38 M82,80 L82,42', opacity: 0.4 }, { d: 'M12,38 Q20,25 28,38 M28,42 Q35,28 42,42 M48,35 Q55,20 62,35 M62,40 Q70,25 78,40', opacity: 0.55 }], viewBox: '0 0 100 100' },
  ],

  // LART-08: boreal_forest (4 variants: tight conifers, mixed height, snow-dusted, sparse)
  boreal_forest: [
    { paths: [{ d: 'M25,75 L25,30 L10,55 L25,30 L40,55 L25,30 M55,75 L55,28 L40,53 L55,28 L70,53 L55,28 M78,75 L78,38 L66,58 L78,38 L90,58 L78,38', opacity: 0.55 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,75 L20,25 L5,50 L20,25 L35,50 L20,25 M55,75 L55,35 L42,58 L55,35 L68,58 L55,35 M80,75 L80,42 L70,62 L80,42 L90,62 L80,42', opacity: 0.55 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M30,72 L30,28 L15,52 L30,28 L45,52 L30,28 M65,72 L65,32 L50,56 L65,32 L80,56 L65,32', opacity: 0.5 }, { d: 'M20,28 Q30,22 40,28 M55,32 Q65,26 75,32', opacity: 0.3 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M30,75 L30,35 L18,55 L30,35 L42,55 L30,35 M65,75 L65,40 L55,60 L65,40 L75,60 L65,40', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-09: tropical_forest (3 variants: dense canopy, palms mixed, vine-draped)
  tropical_forest: [
    { paths: [{ d: 'M20,70 Q20,42 35,35 Q50,28 50,55 Q50,28 65,35 Q80,42 80,70', opacity: 0.55 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,75 Q25,45 35,35 Q40,30 45,35 Q50,40 45,75 M65,75 Q65,40 75,30 Q80,25 82,32 Q80,40 75,75', opacity: 0.55 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,70 Q20,42 32,35 Q44,28 44,70 M55,68 Q55,40 67,33 Q79,26 79,68', opacity: 0.5 }, { d: 'M30,50 Q50,55 70,50', opacity: 0.3 }], viewBox: '0 0 100 100' },
  ],

  // LART-30: dead_forest (3 variants: standing dead, fallen, charred)
  dead_forest: [
    { paths: [{ d: 'M25,78 L25,32 M22,42 L30,42 M20,55 L30,55 M50,78 L50,28 M47,40 L55,40 M45,54 L55,54 M75,78 L75,35 M72,48 L80,48', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,60 L40,58 M15,62 L12,70 M35,61 L38,68 M50,55 L80,52 M55,57 L52,65 M75,54 L78,62', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,78 L25,35 M22,45 L28,45 M47,78 L47,32 M44,42 L50,42 M70,78 L70,38 M68,50 L74,50', opacity: 0.35 }, { d: 'M20,70 Q35,65 50,70 Q65,65 80,70', opacity: 0.25 }], viewBox: '0 0 100 100' },
  ],

  // ── Wet ───────────────────────────────────────────────────────────────────

  // LART-10: marsh (3 variants: reeds, water lines, mixed)
  marsh: [
    { paths: [{ d: PLACEHOLDER_REEDS, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,45 Q50,38 90,45 M10,58 Q50,51 90,58 M10,70 Q50,63 90,70', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,25 L23,80 M50,20 L48,80 M75,28 L73,80', opacity: 0.45 }, { d: 'M10,55 Q50,48 90,55', opacity: 0.35 }], viewBox: '0 0 100 100' },
  ],

  // LART-11: swamp (3 variants: standing water, dead trees, dense reeds)
  swamp: [
    { paths: [{ d: 'M10,55 Q30,48 50,55 Q70,62 90,55 L90,75 Q70,82 50,75 Q30,68 10,75 Z', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,75 L25,35 M22,45 L28,45 M22,58 L28,58 M55,75 L55,40 M52,52 L58,52 M75,75 L75,45 M72,55 L78,55', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,25 L18,80 M35,20 L33,80 M50,22 L48,80 M65,18 L63,80 M80,24 L78,80', opacity: 0.45 }], viewBox: '0 0 100 100' },
  ],

  // LART-12: moor_bog (3 variants: heather, peat, sparse scrub)
  moor_bog: [
    { paths: [{ d: 'M15,65 Q20,52 25,65 Q30,52 35,65 Q40,52 45,65 Q50,52 55,65 Q60,52 65,65 Q70,52 75,65 Q80,52 85,65', opacity: 0.45 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,70 Q50,60 90,70 Q50,80 10,70 M15,58 Q50,50 85,58', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,68 L18,55 M40,70 Q35,58 42,54 M60,67 L58,56 M80,69 Q75,57 82,53', opacity: 0.45 }], viewBox: '0 0 100 100' },
  ],

  // ── Elevated ──────────────────────────────────────────────────────────────

  // LART-13: hills (4 variants: single hill, double hill, rolling, steep)
  hills: [
    { paths: [{ d: PLACEHOLDER_HILL, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: PLACEHOLDER_HILL_DOUBLE, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M5,75 Q25,45 45,68 Q65,45 85,65 L95,75', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,75 Q35,25 50,75', opacity: 0.55 }], viewBox: '0 0 100 100' },
  ],

  // LART-14: forested_hills (3 variants: deciduous-topped, conifer-topped, mixed)
  forested_hills: [
    { paths: [{ d: PLACEHOLDER_HILL, opacity: 0.45 }, { d: 'M35,47 Q50,32 65,47', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: PLACEHOLDER_HILL, opacity: 0.45 }, { d: 'M50,50 L50,30 L38,45 L50,30 L62,45 L50,30', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: PLACEHOLDER_HILL_DOUBLE, opacity: 0.45 }, { d: 'M28,42 Q35,32 42,42 M62,38 L62,22 L54,36 L62,22 L70,36 L62,22', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-15: mountains (4 variants: single peak, double peak, ridge, cliff face)
  mountains: [
    { paths: [{ d: PLACEHOLDER_TRIANGLE, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,80 L40,20 L65,80 Z M50,80 L70,30 L90,80 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: PLACEHOLDER_RIDGE, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,80 L20,20 L60,20 L60,80 Z M60,20 Q80,35 80,80', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-16: high_mountains (3 variants: snow peak, twin peaks, massive single)
  high_mountains: [
    { paths: [{ d: PLACEHOLDER_TRIANGLE, opacity: 0.55 }, { d: 'M35,42 Q50,30 65,42', opacity: 0.3 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,80 L35,18 L60,80 Z M45,80 L68,22 L90,80 Z', opacity: 0.55 }, { d: 'M22,42 Q35,32 48,42 M57,38 Q68,28 80,38', opacity: 0.3 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,80 L50,10 L85,80 Z', opacity: 0.6 }, { d: 'M35,45 Q50,32 65,45', opacity: 0.3 }], viewBox: '0 0 100 100' },
  ],

  // LART-17: plateau (3 variants: mesa, cliff edge, stepped)
  plateau: [
    { paths: [{ d: 'M15,55 L15,70 L85,70 L85,55 Q70,35 50,35 Q30,35 15,55 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,55 L10,70 L90,70 L90,55 L10,55 M10,55 Q30,40 50,40 Q70,40 90,55', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,70 L10,60 L30,60 L30,50 L60,50 L60,40 L90,40 L90,70 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-18: mountain_pass (2 variants: narrow pass, broad saddle)
  mountain_pass: [
    { paths: [{ d: 'M10,80 L30,25 L45,55 L55,55 L70,25 L90,80 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,80 L30,35 L50,60 L70,35 L90,80 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-23 (badlands variants 0-2) + LART-22 hardened_clay (variants 3-4): total 5
  badlands: [
    // LART-23 badlands (3 variants: spires, layered, eroded pillars)
    { paths: [{ d: PLACEHOLDER_SPIRES, opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,75 L10,55 L90,55 L90,75 M10,55 L10,40 L70,40 L70,55 M10,40 L10,28 L50,28 L50,40', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,80 L25,40 Q28,30 30,40 L35,80 M45,80 L50,35 Q53,25 55,35 L60,80 M70,80 L74,45 Q76,38 78,45 L82,80', opacity: 0.5 }], viewBox: '0 0 100 100' },
    // LART-22 hardened_clay (2 variants: fine cracks, deep cracks)
    { paths: [{ d: 'M15,30 L25,50 L20,65 M40,25 L50,45 M60,35 L55,55 L65,70 M75,20 L80,45 L70,60', opacity: 0.35 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,25 L22,50 L18,70 M35,20 L48,48 L40,75 M55,30 L65,55 L60,78 M75,22 L83,50 L78,72', opacity: 0.4 }], viewBox: '0 0 100 100' },
  ],

  // ── Extreme ───────────────────────────────────────────────────────────────

  // LART-19: sand_desert / desert (3 variants: clean, wind ripples, scattered dots)
  desert: [
    { paths: [{ d: 'M10,65 Q50,55 90,65 Q50,75 10,65', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,50 Q30,42 50,50 Q70,42 90,50 M10,62 Q30,54 50,62 Q70,54 90,62 M10,74 Q30,66 50,74 Q70,66 90,74', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: PLACEHOLDER_DOTS, opacity: 0.4 }], viewBox: '0 0 100 100' },
  ],

  // LART-20: sand_dunes (3 variants: rolling dunes, crescent, tall dune)
  sand_dunes: [
    { paths: [{ d: PLACEHOLDER_DUNES, opacity: 0.45 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,65 Q50,38 75,65 Q62,72 50,75 Q38,72 25,65 Z', opacity: 0.45 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,75 Q50,25 80,75 Q65,80 50,82 Q35,80 20,75 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
  ],

  // LART-21: rocky_desert (3 variants: scattered rocks, rock pile, flat rocks)
  rocky_desert: [
    { paths: [{ d: 'M20,65 L15,55 L25,50 L35,55 L30,65 Z M55,60 L50,50 L60,45 L70,52 L65,62 Z M75,70 L70,62 L80,58 L88,65 L82,72 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M30,70 L22,55 L35,45 L48,50 L55,62 L45,72 Z M50,58 L45,45 L58,38 L68,45 L65,58 L55,65 Z M60,68 L55,58 L65,55 L72,62 L68,70 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,65 L10,70 L90,70 L90,65 Z M15,60 L15,65 L70,65 L70,60 Z M25,55 L25,60 L60,60 L60,55 Z', opacity: 0.45 }], viewBox: '0 0 100 100' },
  ],

  // LART-24: tundra (3 variants: lichen, scrub, bare)
  tundra: [
    { paths: [{ d: 'M20,60 A8,5 0 1,0 20.01,60 Z M45,55 A6,4 0 1,0 45.01,55 Z M65,62 A7,5 0 1,0 65.01,62 Z M80,57 A5,4 0 1,0 80.01,57 Z', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M18,68 L16,55 Q20,50 22,55 M40,65 L38,53 Q42,48 44,53 M62,67 L60,56 Q64,51 66,56 M80,66 L78,55 Q82,50 84,55', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,70 Q50,62 90,70', opacity: 0.3 }], viewBox: '0 0 100 100' },
  ],

  // LART-25: snow_fields (2 variants: clean, drift patterns)
  snow_fields: [
    { paths: [{ d: 'M10,65 Q50,58 90,65 Q50,72 10,65', opacity: 0.3 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,58 Q30,50 50,58 Q70,50 90,58 M15,68 Q35,62 55,68 Q75,62 90,68', opacity: 0.3 }], viewBox: '0 0 100 100' },
  ],

  // LART-26: glacier (2 variants: crevassed, smooth)
  glacier: [
    { paths: [{ d: 'M20,70 L20,30 L80,30 L80,70 Z M35,30 L35,70 M55,30 L55,70 M20,50 L80,50', opacity: 0.35 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,70 Q50,45 85,70 Q50,78 15,70', opacity: 0.35 }], viewBox: '0 0 100 100' },
  ],

  // LART-27 volcanic / volcano (variants 0-2) + LART-28 lava (variants 3-4): total 5
  volcano: [
    // LART-27 volcanic (3 variants: active crater, dormant, vent)
    { paths: [{ d: 'M15,80 L50,20 L85,80 Z M40,45 Q50,38 60,45', opacity: 0.55 }, { d: 'M45,20 Q50,10 55,20 Q55,15 50,12 Q45,15 45,20', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M20,80 L50,25 L80,80 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,80 L50,20 L85,80 Z M45,55 L50,35 L55,55', opacity: 0.5 }], viewBox: '0 0 100 100' },
    // LART-28 lava (2 variants: fresh flow, cooling)
    { paths: [{ d: 'M30,30 Q50,50 70,30 Q80,55 70,70 Q50,80 30,70 Q20,55 30,30 Z', opacity: 0.5 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,35 Q50,55 75,35 Q80,60 65,75 Q50,82 35,75 Q20,60 25,35 Z M35,50 Q50,62 65,50', opacity: 0.45 }], viewBox: '0 0 100 100' },
  ],

  // LART-29: broken_lands (2 variants: cracked, rubble)
  broken_lands: [
    { paths: [{ d: PLACEHOLDER_CRACKS, opacity: 0.45 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M15,65 L20,55 L30,60 L25,70 Z M40,60 L48,50 L58,55 L52,66 Z M65,68 L70,58 L80,62 L75,72 Z', opacity: 0.45 }], viewBox: '0 0 100 100' },
  ],
};

// ── Terrain type fallback mapping ─────────────────────────────────────────────

/**
 * Maps TerrainType values that have no direct LART requirement to the closest
 * visual cousin in the registry.
 *
 * NFP #1: Change this table to remap fallbacks without touching signifier art.
 */
export const TERRAIN_SIGNIFIER_FALLBACK: Record<string, string> = {
  farmland: 'grassland',             // LART-01 covers grassland
  jungle: 'tropical_forest',         // LART-09 covers tropical_forest
  evergreen_forest: 'boreal_forest', // LART-08 covers boreal_forest
  arctic: 'snow_fields',             // LART-25 covers snow_fields
  great_home_trees: 'dense_forest',  // LART-07 covers dense_forest
  oasis: 'savanna',                  // LART-02 covers savanna
};

// ── Per-hex seeded parameter generation ──────────────────────────────────────

/**
 * Deterministically compute per-hex signifier parameters from hex coordinates and world seed.
 *
 * NFP #3 (determinism): Same inputs → same outputs via mulberry32.
 * NFP #1 (tunability): Jitter range and rotation range are named constants above.
 *
 * Seed formula matches existing volcanic placement pattern in the codebase.
 *
 * @param col - Hex column offset coordinate
 * @param row - Hex row offset coordinate
 * @param worldSeed - World generation seed
 * @param variantCount - Number of available variants for this terrain type
 * @returns Deterministic per-hex params: variantIndex, jitterX, jitterY, rotation
 */
export function getSignifierParams(
  col: number,
  row: number,
  worldSeed: number,
  variantCount: number,
): { variantIndex: number; jitterX: number; jitterY: number; rotation: number } {
  // Unique integer seed per hex — same formula as volcanic placement in RiverMesh.ts
  const hexSeed = (col * 374761393 + row * 668265263 + worldSeed * 1274126177) | 0;
  const rng = mulberry32(hexSeed);

  const variantIndex = Math.floor(rng() * variantCount);
  const jitterX = (rng() - 0.5) * SIGNIFIER_JITTER_RANGE;   // ±10% of hex size
  const jitterY = (rng() - 0.5) * SIGNIFIER_JITTER_RANGE;
  const rotation = (rng() - 0.5) * SIGNIFIER_ROTATION_RANGE; // ±15°

  return { variantIndex, jitterX, jitterY, rotation };
}
