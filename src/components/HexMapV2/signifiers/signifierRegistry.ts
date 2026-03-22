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

  // LART-01: grassland (3 variants: clean low grass, light tufts, wildflowers)
  grassland: [
    // Variant 0: Clean low grass — sparse tufts from 3 base points, left-side heavier
    {
      paths: [
        // Left tuft cluster — left side heavier (sun-from-right shadow)
        { d: 'M18,74 L15,62 L17,60 L19,64 L21,59 L23,65 L25,61 L26,67 L22,74 Z M28,76 L26,66 L28,64 L30,68 L32,64 L33,70 L29,76 Z', opacity: 0.55 },
        // Right tuft cluster — thinner/lighter
        { d: 'M60,74 L58,65 L60,63 L62,67 L64,63 L65,69 L61,74 Z M72,76 L70,67 L72,65 L74,69 L76,65 L77,71 L73,76 Z M83,73 L81,66 L83,64 L85,68 L87,65 L88,70 L84,73 Z', opacity: 0.35 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Light tufts — 5 grass clumps, left clumps denser
    {
      paths: [
        // Dense left-side clumps
        { d: 'M14,76 L12,63 L15,60 L17,65 L20,59 L22,67 L19,74 L14,76 Z M28,75 L26,64 L29,61 L31,66 L34,61 L35,68 L32,72 L28,75 Z M42,77 L40,66 L43,63 L45,68 L47,64 L48,70 L44,76 L42,77 Z', opacity: 0.55 },
        // Light right-side clumps
        { d: 'M60,76 L58,67 L61,64 L63,69 L65,65 L66,71 L62,75 L60,76 Z M76,75 L74,67 L77,64 L79,69 L81,66 L82,71 L78,74 L76,75 Z', opacity: 0.3 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Wildflowers — grass tufts with flower dots scattered through left side
    {
      paths: [
        // Grass base
        { d: 'M16,75 L14,63 L17,60 L19,66 L22,61 L23,68 L20,73 L16,75 Z M32,76 L30,65 L33,62 L35,67 L38,63 L39,69 L35,74 L32,76 Z M58,75 L56,66 L59,63 L61,68 L63,64 L64,70 L60,74 L58,75 Z M74,74 L72,66 L75,63 L77,68 L79,65 L80,70 L76,73 L74,74 Z', opacity: 0.5 },
        // Flower dots left-heavy
        { d: 'M20,58 L22,54 L24,58 L22,62 L20,58 Z M28,52 L30,48 L32,52 L30,56 L28,52 Z M38,55 L40,51 L42,55 L40,59 L38,55 Z M62,56 L64,52 L66,56 L64,60 L62,56 Z M80,54 L82,50 L84,54 L82,58 L80,54 Z', opacity: 0.35 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-02: savanna (3 variants: single acacia, two trees, dry grass)
  savanna: [
    // Variant 0: Single acacia — flat-top canopy, shadow baked left
    {
      paths: [
        // Trunk — left side filled more
        { d: 'M46,80 L44,55 L48,52 L52,52 L56,55 L54,80 Z', opacity: 0.55 },
        // Left canopy mass — heavier
        { d: 'M15,52 L18,42 L22,36 L28,32 L36,30 L44,32 L50,36 L48,42 L40,46 L30,48 L20,52 L15,52 Z', opacity: 0.6 },
        // Right canopy mass — lighter
        { d: 'M50,36 L58,30 L66,28 L74,30 L80,34 L84,40 L82,46 L76,50 L68,52 L58,50 L52,46 L50,42 L50,36 Z', opacity: 0.35 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Two trees — one large left, one smaller right, sparse grass base
    {
      paths: [
        // Left large tree trunk
        { d: 'M28,80 L26,58 L30,55 L34,55 L38,58 L36,80 Z', opacity: 0.55 },
        // Left canopy — heavy shadow
        { d: 'M10,55 L12,44 L18,38 L28,35 L38,38 L42,44 L40,52 L30,56 L18,56 L10,55 Z', opacity: 0.6 },
        // Right small tree trunk
        { d: 'M66,80 L64,64 L68,62 L72,62 L74,64 L72,80 Z', opacity: 0.45 },
        // Right canopy — light
        { d: 'M54,62 L56,54 L62,50 L68,50 L74,52 L78,58 L76,63 L68,65 L60,64 L54,62 Z', opacity: 0.3 },
        // Ground grass
        { d: 'M10,78 L12,72 L14,68 L16,72 L18,68 L20,74 L18,78 Z M40,79 L42,73 L44,70 L46,74 L44,79 Z', opacity: 0.4 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Dry grass — tall windswept stalks leaning right, left stalks heavier
    {
      paths: [
        // Left stalks — thick, upright-leaning
        { d: 'M12,78 L10,52 L14,48 L16,52 L18,46 L20,54 L22,78 Z M26,78 L24,55 L28,51 L30,56 L32,50 L34,57 L36,78 Z M40,77 L38,57 L42,53 L44,58 L46,53 L47,60 L48,77 Z', opacity: 0.55 },
        // Right stalks — lighter, lean right
        { d: 'M58,76 L60,58 L64,56 L66,62 L69,58 L70,65 L68,76 Z M74,75 L76,60 L80,58 L82,63 L84,59 L85,66 L82,75 Z M88,74 L90,62 L92,60 L93,65 L94,62 L94,68 L90,74 Z', opacity: 0.3 },
        // Seed heads
        { d: 'M10,48 Q14,44 18,46 M24,51 Q28,47 32,50 M38,53 Q42,49 46,53 M60,56 Q64,52 68,56 M76,58 Q80,54 84,58', opacity: 0.45 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-03: steppe (3 variants: scrub/rolling, bent grass, bare steppe)
  steppe: [
    // Variant 0: Scrub — from Design/steppes-hand-drawn.svg (style standard)
    {
      paths: [
        {
          d: 'M27.1,73.0 L26.4,72.5 L27.9,72.6 L28.4,70.8 L30.4,71.3 L30.1,68.6 L32.2,71.6 L27.1,73.0 Z M43.1,72.2 L44.5,69.8 L45.3,71.9 L43.1,72.2 Z M36.3,72.0 L33.6,71.8 L31.1,63.9 L35.0,68.1 L36.1,63.2 L36.5,70.5 L40.0,64.5 L39.4,71.7 L42.4,67.1 L41.3,72.2 L36.3,72.0 Z M63.1,59.3 L64.4,57.1 L66.0,59.3 L64.0,60.2 L63.1,59.3 Z M75.8,59.1 L67.6,58.4 L66.5,55.3 L69.2,57.5 L69.3,56.5 L68.0,51.4 L70.5,55.6 L71.2,50.2 L72.1,54.8 L74.4,52.0 L73.9,57.9 L76.2,55.4 L77.4,56.4 L79.5,55.1 L80.2,58.2 L75.8,59.1 Z M80.9,59.1 L83.3,59.2 L80.9,59.1 Z M49.6,30.3 L48.9,29.0 L50.3,29.8 L51.1,31.5 L49.6,30.3 Z M53.6,31.1 L51.8,27.8 L54.3,29.4 L53.4,24.7 L55.6,30.6 L53.6,31.1 Z M68.6,30.6 L65.4,30.5 L69.5,24.4 L67.7,29.9 L69.7,28.3 L70.1,30.3 L71.9,30.3 L68.6,30.6 Z M62.8,30.4 L57.4,29.4 L56.1,22.7 L58.0,27.8 L60.4,17.0 L60.5,24.4 L61.6,20.4 L62.3,21.3 L62.9,20.4 L62.3,26.4 L65.1,20.9 L63.8,27.0 L66.4,23.5 L65.2,27.9 L62.8,30.4 Z',
          opacity: 0.55,
        },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Bent grass — windswept stalks leaning right, denser on left
    {
      paths: [
        // Left dense cluster bending right
        { d: 'M12,76 L18,55 L22,52 L20,62 L24,48 L26,60 L28,76 Z M28,75 L34,57 L38,54 L36,63 L40,50 L42,62 L40,75 Z M44,76 L50,59 L54,56 L52,65 L56,52 L58,63 L56,76 Z', opacity: 0.55 },
        // Right lighter stalks
        { d: 'M62,74 L68,59 L72,56 L70,65 L74,54 L76,64 L74,74 Z M78,73 L84,60 L87,57 L85,66 L89,55 L90,65 L88,73 Z', opacity: 0.3 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Bare steppe — minimal vegetation, rocky ground marks, low profile
    {
      paths: [
        // Ground level base line
        { d: 'M8,72 Q25,68 40,70 Q55,66 70,69 Q82,67 92,72 L92,76 Q75,74 55,72 Q35,74 15,75 L8,72 Z', opacity: 0.25 },
        // Scattered low pebble/rock marks
        { d: 'M18,70 L15,67 L20,65 L24,67 L22,70 L18,70 Z M38,68 L35,65 L40,63 L44,65 L42,68 L38,68 Z M55,71 L52,68 L57,66 L61,68 L59,71 L55,71 Z M72,69 L69,66 L74,64 L78,66 L76,69 L72,69 Z', opacity: 0.45 },
        // Tiny sparse grass
        { d: 'M25,68 L24,62 L26,60 L28,64 L26,68 Z M48,67 L47,61 L49,59 L51,63 L49,67 Z M80,66 L79,61 L81,59 L83,63 L81,66 Z', opacity: 0.35 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-04: floodplain (2 variants: dry season, wet-season marks)
  floodplain: [
    // Variant 0: Dry season — fine crack lines radiating from left, sparse low grass
    {
      paths: [
        // Crack network — heavier on left
        { d: 'M14,42 L22,58 L18,70 L26,64 L30,78 M22,58 L32,52 L38,60 M38,30 L44,50 L40,66 L50,58 L54,72 M44,50 L54,44 L60,55 M62,38 L68,56 L72,68 M68,56 L76,50 L80,62 M80,38 L84,52 L88,64', opacity: 0.35 },
        // Sparse low grass tufts
        { d: 'M16,74 L14,68 L18,66 L20,70 L18,74 Z M46,72 L44,66 L48,64 L50,68 L48,72 Z M76,73 L74,67 L78,65 L80,69 L78,73 Z', opacity: 0.4 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Wet-season marks — horizontal wavy waterlines + sediment dots
    {
      paths: [
        // Water line marks
        { d: 'M8,40 Q22,35 36,40 Q50,45 64,40 Q78,35 92,40 M8,52 Q22,47 36,52 Q50,57 64,52 Q78,47 92,52 M8,64 Q22,59 36,64 Q50,69 64,64 Q78,59 92,64', opacity: 0.25 },
        // Sediment deposit dots — left side heavier
        { d: 'M15,58 L13,54 L17,52 L20,54 L18,58 L15,58 Z M28,55 L26,51 L30,49 L33,51 L31,55 L28,55 Z M42,57 L40,53 L44,51 L47,53 L45,57 L42,57 Z M60,56 L58,52 L62,50 L65,52 L63,56 L60,56 Z M78,55 L76,51 L80,49 L83,51 L81,55 L78,55 Z', opacity: 0.4 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // ── Forest ────────────────────────────────────────────────────────────────

  // LART-05: woodland / light_forest (4 variants: 2-tree, 3-tree, single large, mixed)
  light_forest: [
    // Variant 0: Two deciduous trees — left tree has heavier shadow mass
    {
      paths: [
        // Left tree — organic canopy, trunk shadow on left
        { d: 'M28,78 L26,54 L24,52 L28,50 L32,52 L30,56 L28,78 Z', opacity: 0.55 },
        { d: 'M10,50 L12,40 L16,34 L22,30 L30,28 L38,30 L42,36 L44,44 L40,50 L30,54 L20,52 L10,50 Z', opacity: 0.6 },
        // Right tree — lighter canopy
        { d: 'M66,78 L64,56 L62,54 L66,52 L70,54 L68,58 L66,78 Z', opacity: 0.45 },
        { d: 'M52,52 L54,43 L58,38 L64,34 L70,32 L76,34 L80,40 L82,47 L78,52 L70,56 L62,54 L52,52 Z', opacity: 0.35 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Three trees in cluster — varying heights, left heavier
    {
      paths: [
        // Leftmost tree trunk + canopy — tallest
        { d: 'M20,78 L18,50 L16,48 L20,46 L24,48 L22,52 L20,78 Z', opacity: 0.55 },
        { d: 'M6,46 L8,36 L12,28 L20,23 L28,25 L34,31 L36,40 L32,48 L22,52 L12,50 L6,46 Z', opacity: 0.62 },
        // Middle tree — medium height
        { d: 'M50,78 L48,55 L46,53 L50,51 L54,53 L52,57 L50,78 Z', opacity: 0.5 },
        { d: 'M38,51 L40,42 L44,36 L50,32 L58,33 L62,38 L64,46 L60,52 L52,55 L42,53 L38,51 Z', opacity: 0.45 },
        // Right tree — smaller, lighter
        { d: 'M76,78 L74,60 L72,58 L76,56 L80,58 L78,62 L76,78 Z', opacity: 0.4 },
        { d: 'M64,56 L66,49 L70,44 L76,41 L82,43 L86,48 L86,54 L82,58 L74,60 L66,58 L64,56 Z', opacity: 0.3 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Single large deciduous — prominent wide canopy
    {
      paths: [
        // Trunk — thick, left shadow
        { d: 'M46,80 L42,50 L40,46 L46,44 L54,44 L60,46 L58,52 L54,80 Z', opacity: 0.55 },
        // Left canopy mass — large and heavy
        { d: 'M10,44 L12,32 L18,22 L28,16 L40,14 L50,18 L52,30 L46,42 L34,48 L20,48 L10,44 Z', opacity: 0.65 },
        // Right canopy — slightly lighter
        { d: 'M50,18 L60,14 L72,16 L82,22 L88,32 L88,42 L84,48 L72,50 L60,48 L52,40 L50,30 L50,18 Z', opacity: 0.4 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 3: Mixed — one tall, one short, grass between
    {
      paths: [
        // Tall left tree
        { d: 'M22,78 L20,48 L18,46 L22,44 L26,46 L24,50 L22,78 Z', opacity: 0.55 },
        { d: 'M8,44 L10,32 L16,24 L24,20 L32,22 L38,28 L38,38 L34,46 L24,50 L14,48 L8,44 Z', opacity: 0.62 },
        // Short right tree
        { d: 'M72,78 L70,62 L68,60 L72,58 L76,60 L74,64 L72,78 Z', opacity: 0.42 },
        { d: 'M60,58 L62,50 L66,45 L72,42 L78,44 L82,49 L82,56 L76,60 L68,60 L62,58 L60,58 Z', opacity: 0.32 },
        // Ground grass tuft
        { d: 'M38,76 L36,68 L40,66 L42,70 L44,66 L46,70 L44,76 Z M52,77 L50,70 L54,68 L56,72 L54,77 Z', opacity: 0.4 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-06: temperate_forest (4 variants: tight cluster, mixed sizes, clearing, full canopy)
  temperate_forest: [
    // Variant 0: Tight cluster — 4-5 canopies touching, filled mass with left shadow
    {
      paths: [
        // Left-heavy canopy mass
        { d: 'M10,52 L12,38 L18,28 L28,22 L38,24 L46,32 L48,44 L42,52 L30,56 L18,56 L10,52 Z', opacity: 0.65 },
        // Central cluster overlap
        { d: 'M38,24 L48,20 L60,22 L68,30 L70,42 L64,50 L52,54 L42,52 L38,44 L38,34 L38,24 Z', opacity: 0.55 },
        // Right lighter edge
        { d: 'M60,22 L70,18 L80,22 L86,30 L88,42 L82,50 L72,54 L64,50 L60,42 L60,30 L60,22 Z', opacity: 0.35 },
        // Trunk bases
        { d: 'M26,78 L24,54 L28,52 L30,56 L28,78 Z M54,78 L52,54 L56,52 L58,56 L54,78 Z M78,78 L76,54 L80,52 L82,56 L78,78 Z', opacity: 0.5 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Mixed sizes — varying heights in natural group
    {
      paths: [
        // Tallest left tree
        { d: 'M18,78 L16,44 L14,42 L18,40 L22,42 L20,46 L18,78 Z', opacity: 0.55 },
        { d: 'M6,40 L8,28 L14,18 L22,14 L30,16 L36,24 L36,36 L30,42 L20,46 L10,44 L6,40 Z', opacity: 0.65 },
        // Medium center tree
        { d: 'M50,78 L48,52 L46,50 L50,48 L54,50 L52,54 L50,78 Z', opacity: 0.5 },
        { d: 'M38,48 L40,36 L46,28 L52,24 L60,26 L64,34 L64,44 L58,50 L50,52 L42,50 L38,48 Z', opacity: 0.5 },
        // Short right tree
        { d: 'M78,78 L76,62 L74,60 L78,58 L82,60 L80,64 L78,78 Z', opacity: 0.4 },
        { d: 'M66,58 L68,50 L74,44 L80,42 L86,44 L90,50 L90,56 L84,60 L76,62 L68,60 L66,58 Z', opacity: 0.3 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Clearing — ring of trees with open center
    {
      paths: [
        // Left tree ring — heavy
        { d: 'M12,78 L10,50 L8,48 L12,46 L16,48 L14,52 L12,78 Z', opacity: 0.55 },
        { d: 'M2,46 L4,34 L10,24 L18,20 L26,22 L30,30 L28,40 L22,46 L14,50 L6,48 L2,46 Z', opacity: 0.62 },
        // Right tree ring — lighter
        { d: 'M84,78 L82,50 L80,48 L84,46 L88,48 L86,52 L84,78 Z', opacity: 0.42 },
        { d: 'M72,46 L74,34 L80,24 L88,20 L94,22 L98,30 L96,40 L90,46 L82,50 L74,48 L72,46 Z', opacity: 0.32 },
        // Open center ground — clearing light suggestion
        { d: 'M30,68 Q50,60 70,68 Q50,78 30,68 Z', opacity: 0.2 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 3: Full canopy — solid canopy mass, irregular edge
    {
      paths: [
        // Dense left-side canopy mass
        { d: 'M6,56 L8,42 L14,28 L24,18 L36,14 L46,18 L52,28 L52,42 L46,54 L34,60 L20,60 L10,58 L6,56 Z', opacity: 0.65 },
        // Center-right overlap
        { d: 'M44,18 L56,14 L68,16 L78,24 L82,36 L80,48 L72,56 L60,60 L48,58 L42,48 L42,34 L44,24 L44,18 Z', opacity: 0.55 },
        // Far right lighter
        { d: 'M70,16 L80,14 L90,18 L96,28 L96,40 L90,50 L80,56 L70,56 L64,48 L64,32 L68,22 L70,16 Z', opacity: 0.35 },
        // Trunk bases
        { d: 'M24,78 L22,58 L26,56 L28,60 L24,78 Z M54,78 L52,58 L56,56 L58,60 L54,78 Z M80,78 L78,58 L82,56 L84,60 L80,78 Z', opacity: 0.5 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-07: dense_forest (3 variants: solid canopy, deep shade, ancient trunks)
  dense_forest: [
    // Variant 0: Solid canopy — from Design/deepforest-hand-drawn.svg (style standard)
    {
      paths: [
        {
          d: 'M51.5,78.8 L47.5,70.1 L35.1,66.9 L34.3,57.6 L30.4,60.9 L27.3,60.3 L12.7,43.6 L15.0,35.4 L20.0,27.0 L26.7,22.2 L36.6,18.3 L44.3,22.2 L51.2,28.4 L57.1,23.2 L67.4,22.9 L74.0,20.9 L79.7,22.5 L84.7,27.4 L86.9,35.7 L86.9,46.9 L82.6,55.8 L73.3,60.9 L70.4,67.9 L68.3,63.4 L54.6,69.5 L53.0,78.9 L51.5,78.8 Z M53.7,67.9 L51.3,67.5 L53.7,67.9 Z M62.2,64.9 L69.4,56.2 L64.7,46.4 L58.7,39.1 L55.0,42.4 L49.2,43.9 L44.1,48.4 L48.0,54.3 L44.4,54.4 L51.6,61.7 L62.2,64.9 Z M53.5,58.1 L55.1,58.6 L53.5,58.1 Z M77.8,57.6 L86.0,43.8 L84.5,33.3 L80.9,26.6 L81.6,31.9 L77.4,24.8 L75.9,29.6 L76.3,33.5 L71.0,35.5 L73.3,51.9 L75.8,57.5 L77.8,57.6 Z M31.4,51.6 L35.6,48.7 L41.6,41.5 L50.3,37.2 L53.7,33.1 L47.9,26.3 L40.9,27.7 L36.2,33.4 L34.3,28.5 L32.4,29.3 L27.6,42.0 L24.8,44.6 L26.9,48.0 L31.4,51.6 Z M71.0,31.5 L69.4,29.6 L71.0,31.5 Z',
          opacity: 0.62,
        },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Deep shade — darker, thicker left masses, more filled
    {
      paths: [
        // Dense left mass
        { d: 'M6,60 L8,44 L14,30 L24,20 L36,15 L46,18 L54,28 L54,44 L48,56 L36,64 L22,64 L10,62 L6,60 Z', opacity: 0.68 },
        // Overlapping center mass
        { d: 'M42,18 L56,14 L70,18 L78,28 L80,42 L74,54 L62,62 L50,62 L44,52 L42,38 L42,28 L42,18 Z', opacity: 0.58 },
        // Right lighter edge with irregular knobs
        { d: 'M68,18 L78,16 L88,22 L94,32 L94,46 L88,56 L78,62 L68,60 L62,50 L62,34 L66,24 L68,18 Z', opacity: 0.38 },
        // Shadow ground layer
        { d: 'M10,72 Q30,66 50,70 Q70,66 88,72 L88,78 Q68,76 50,78 Q30,76 10,78 L10,72 Z', opacity: 0.25 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 3: Ancient trunks — wide gnarled trunk bases visible, canopy above
    {
      paths: [
        // Wide left trunk base — gnarled
        { d: 'M16,80 L12,56 L10,50 L14,44 L20,42 L26,44 L30,50 L28,58 L24,80 L16,80 Z', opacity: 0.58 },
        // Left ancient canopy
        { d: 'M8,44 L10,30 L18,20 L28,16 L38,18 L44,26 L42,38 L34,44 L22,48 L12,46 L8,44 Z', opacity: 0.62 },
        // Center trunk base
        { d: 'M46,80 L42,60 L40,54 L44,48 L52,46 L58,48 L62,54 L58,62 L54,80 L46,80 Z', opacity: 0.5 },
        // Center canopy
        { d: 'M38,48 L40,34 L48,24 L56,22 L64,24 L70,32 L68,44 L60,50 L50,52 L42,50 L38,48 Z', opacity: 0.5 },
        // Right tree — lighter
        { d: 'M74,80 L72,62 L70,56 L74,52 L80,50 L86,52 L88,58 L86,64 L82,80 L74,80 Z', opacity: 0.38 },
        { d: 'M66,50 L68,38 L76,28 L84,26 L90,30 L94,40 L92,50 L84,54 L74,56 L68,52 L66,50 Z', opacity: 0.3 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-08: boreal_forest (4 variants: tight conifers, mixed height, snow-dusted, sparse)
  boreal_forest: [
    // Variant 0: Tight conifers — 3-4 narrow pointed triangles in a row
    {
      paths: [
        // Left conifer — tallest, heaviest shadow
        { d: 'M22,78 L20,72 L14,56 L10,46 L16,42 L22,38 L28,38 L34,42 L30,52 L26,66 L24,72 L22,78 Z', opacity: 0.6 },
        { d: 'M20,42 L16,36 L22,28 L28,26 L34,28 L36,36 L30,42 L24,40 L20,42 Z', opacity: 0.55 },
        { d: 'M22,28 L20,20 L26,14 L32,14 L36,20 L34,28 L28,26 L22,28 Z', opacity: 0.5 },
        // Center conifer
        { d: 'M50,78 L48,70 L42,56 L38,46 L44,42 L50,38 L56,42 L52,52 L54,66 L52,72 L50,78 Z', opacity: 0.5 },
        { d: 'M46,40 L42,34 L48,26 L54,24 L60,26 L62,34 L56,40 L50,38 L46,40 Z', opacity: 0.42 },
        { d: 'M48,26 L46,18 L52,12 L58,12 L62,18 L60,26 L54,24 L48,26 Z', opacity: 0.38 },
        // Right conifer — smallest, lightest
        { d: 'M76,78 L74,72 L68,60 L64,52 L70,48 L76,44 L82,48 L78,58 L80,70 L78,74 L76,78 Z', opacity: 0.38 },
        { d: 'M70,48 L66,42 L72,34 L78,32 L84,34 L86,42 L80,48 L74,46 L70,48 Z', opacity: 0.3 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Mixed height — conifers varying size, tallest left
    {
      paths: [
        // Tallest left conifer
        { d: 'M18,78 L16,68 L10,50 L6,36 L12,30 L18,26 L24,30 L20,42 L22,60 L20,70 L18,78 Z', opacity: 0.62 },
        { d: 'M14,32 L10,24 L18,16 L26,16 L30,24 L24,32 L18,30 L14,32 Z', opacity: 0.55 },
        { d: 'M16,18 L14,10 L20,6 L26,8 L28,16 L22,18 L16,18 Z', opacity: 0.48 },
        // Medium center conifer
        { d: 'M50,78 L48,66 L42,50 L38,40 L44,36 L50,32 L56,36 L52,46 L54,62 L52,68 L50,78 Z', opacity: 0.5 },
        { d: 'M44,36 L40,28 L48,20 L56,20 L60,28 L54,36 L50,34 L44,36 Z', opacity: 0.42 },
        // Short right conifer
        { d: 'M78,78 L76,70 L70,58 L66,50 L72,46 L78,42 L84,46 L80,56 L82,68 L80,72 L78,78 Z', opacity: 0.35 },
        { d: 'M70,48 L68,40 L76,34 L84,36 L86,44 L78,48 L72,46 L70,48 Z', opacity: 0.28 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Snow-dusted — conifers with snow gaps on upper right sides
    {
      paths: [
        // Left conifer body — main shadow side
        { d: 'M25,78 L22,66 L16,50 L12,38 L18,34 L25,30 L32,34 L28,46 L30,62 L28,70 L25,78 Z', opacity: 0.58 },
        { d: 'M18,34 L14,26 L22,18 L30,18 L36,26 L30,34 L24,32 L18,34 Z', opacity: 0.52 },
        // Snow highlight on upper right of left conifer — very light
        { d: 'M26,30 L30,26 L34,22 L36,18 L34,14 L28,16 L24,22 L24,28 L26,30 Z', opacity: 0.25 },
        // Right conifer body
        { d: 'M68,78 L66,68 L60,54 L56,44 L62,40 L68,36 L74,40 L70,50 L72,64 L70,70 L68,78 Z', opacity: 0.42 },
        { d: 'M62,40 L58,32 L66,24 L74,24 L78,32 L72,40 L66,38 L62,40 Z', opacity: 0.36 },
        // Snow on right conifer
        { d: 'M68,36 L74,32 L78,26 L76,20 L70,20 L66,24 L66,32 L68,36 Z', opacity: 0.22 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 3: Sparse — 2 conifers with open space between
    {
      paths: [
        // Left conifer
        { d: 'M22,78 L20,66 L14,50 L10,38 L16,34 L22,30 L28,34 L24,46 L26,62 L24,70 L22,78 Z', opacity: 0.58 },
        { d: 'M16,34 L12,26 L20,18 L28,18 L32,26 L26,34 L20,32 L16,34 Z', opacity: 0.52 },
        { d: 'M18,20 L16,12 L24,8 L30,10 L32,18 L24,20 L18,20 Z', opacity: 0.44 },
        // Right conifer — lighter
        { d: 'M76,78 L74,68 L68,54 L64,44 L70,40 L76,36 L82,40 L78,50 L80,64 L78,70 L76,78 Z', opacity: 0.4 },
        { d: 'M68,42 L64,34 L72,26 L80,26 L84,34 L78,42 L72,40 L68,42 Z', opacity: 0.34 },
        // Open ground suggestion
        { d: 'M30,74 Q50,68 66,74 Q50,80 30,74 Z', opacity: 0.22 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-09: tropical_forest (3 variants: dense canopy, palms mixed, vine-draped)
  tropical_forest: [
    // Variant 0: Dense canopy — broad leafy mass, very filled, organic bulging edge
    {
      paths: [
        // Left heavy canopy mass
        { d: 'M8,58 L10,42 L16,28 L26,18 L38,14 L48,18 L56,28 L56,42 L50,56 L38,64 L24,64 L12,62 L8,58 Z', opacity: 0.65 },
        // Center-right bulk
        { d: 'M46,18 L60,14 L74,16 L84,24 L88,36 L86,50 L78,58 L66,64 L54,62 L48,52 L46,38 L46,28 L46,18 Z', opacity: 0.55 },
        // Far right lighter bulk
        { d: 'M74,16 L86,18 L94,28 L96,40 L92,52 L84,60 L74,62 L64,58 L60,46 L60,32 L66,22 L74,16 Z', opacity: 0.35 },
        // Trunk bases
        { d: 'M26,80 L24,62 L28,60 L30,64 L28,80 Z M54,80 L52,62 L56,60 L58,64 L54,80 Z M78,80 L76,62 L80,60 L82,64 L78,80 Z', opacity: 0.52 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Palms mixed — curved palm trunks among broad-leaf canopy
    {
      paths: [
        // Left broad-leaf tree
        { d: 'M10,60 L12,44 L18,30 L28,22 L38,24 L44,34 L42,48 L32,58 L18,62 L10,60 Z', opacity: 0.62 },
        { d: 'M24,80 L22,60 L26,58 L28,62 L26,80 Z', opacity: 0.55 },
        // Left palm — curved trunk sweeping right
        { d: 'M44,80 L48,60 L55,46 L60,36 L62,30 L60,26 L58,30 L55,36 L50,46 L46,60 L44,80 Z', opacity: 0.5 },
        // Palm fronds radiating from top — left fronds heavy
        { d: 'M58,28 L48,20 L44,14 L46,10 L52,14 L58,22 L58,28 Z M60,26 L52,18 M62,30 L70,22 L76,16 L74,12 L68,16 L64,22 L62,30 Z M60,26 L68,20', opacity: 0.5 },
        // Right broad-leaf tree — lighter
        { d: 'M66,58 L68,44 L74,32 L82,26 L90,28 L94,38 L92,50 L84,58 L72,62 L66,60 L66,58 Z', opacity: 0.35 },
        { d: 'M80,80 L78,62 L82,60 L84,64 L80,80 Z', opacity: 0.38 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Vine-draped — trees with hanging vine curves on left side
    {
      paths: [
        // Left tree — broad canopy
        { d: 'M8,56 L10,40 L16,26 L26,18 L36,18 L44,26 L44,40 L36,52 L24,58 L12,58 L8,56 Z', opacity: 0.62 },
        { d: 'M22,80 L20,58 L24,56 L26,60 L24,80 Z', opacity: 0.55 },
        // Vines hanging from left tree — curving drapes
        { d: 'M14,42 Q10,56 12,70 Q10,74 14,78 M18,44 Q14,58 16,72 Q14,76 18,80 M22,46 Q18,60 20,74 Q18,78 22,82', opacity: 0.35 },
        // Right tree — lighter
        { d: 'M58,54 L60,38 L66,26 L76,20 L86,22 L92,32 L90,46 L82,54 L70,58 L60,56 L58,54 Z', opacity: 0.42 },
        { d: 'M72,80 L70,58 L74,56 L76,60 L72,80 Z', opacity: 0.38 },
        // Light right vines
        { d: 'M62,40 Q58,54 60,66 Q58,70 62,74 M70,42 Q66,56 68,68 Q66,72 70,76', opacity: 0.25 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-30: dead_forest (3 variants: standing dead, fallen, charred)
  dead_forest: [
    { paths: [{ d: 'M25,78 L25,32 M22,42 L30,42 M20,55 L30,55 M50,78 L50,28 M47,40 L55,40 M45,54 L55,54 M75,78 L75,35 M72,48 L80,48', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M10,60 L40,58 M15,62 L12,70 M35,61 L38,68 M50,55 L80,52 M55,57 L52,65 M75,54 L78,62', opacity: 0.4 }], viewBox: '0 0 100 100' },
    { paths: [{ d: 'M25,78 L25,35 M22,45 L28,45 M47,78 L47,32 M44,42 L50,42 M70,78 L70,38 M68,50 L74,50', opacity: 0.35 }, { d: 'M20,70 Q35,65 50,70 Q65,65 80,70', opacity: 0.25 }], viewBox: '0 0 100 100' },
  ],

  // ── Wet ───────────────────────────────────────────────────────────────────

  // LART-10: marsh (3 variants: reeds, water lines + reeds, mixed reeds + grass)
  marsh: [
    // Variant 0: Reeds — vertical thin stalks, bulrush tops, left cluster heavier
    {
      paths: [
        // Left reed cluster — denser, taller
        { d: 'M16,78 L14,36 L16,34 L18,38 L18,78 Z M22,78 L20,30 L22,28 L24,32 L24,78 Z M30,78 L28,38 L30,36 L32,40 L32,78 Z M38,78 L36,42 L38,40 L40,44 L40,78 Z', opacity: 0.55 },
        // Bulrush tops on left reeds
        { d: 'M14,36 L12,30 L16,26 L20,28 L18,34 L14,36 Z M20,30 L18,24 L22,20 L26,22 L24,28 L20,30 Z M28,38 L26,32 L30,28 L34,30 L32,36 L28,38 Z M36,42 L34,36 L38,32 L42,34 L40,40 L36,42 Z', opacity: 0.52 },
        // Right reed cluster — lighter, shorter
        { d: 'M60,78 L58,46 L60,44 L62,48 L62,78 Z M70,78 L68,42 L70,40 L72,44 L72,78 Z M80,78 L78,48 L80,46 L82,50 L82,78 Z', opacity: 0.32 },
        // Bulrush tops right
        { d: 'M56,46 L54,40 L60,36 L64,38 L62,44 L56,46 Z M66,42 L64,36 L70,32 L74,34 L72,40 L66,42 Z M76,48 L74,42 L80,38 L84,40 L82,46 L76,48 Z', opacity: 0.28 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Water lines + reeds — horizontal wavy water, reeds in background
    {
      paths: [
        // Water surface lines
        { d: 'M8,56 Q22,50 36,56 Q50,62 64,56 Q78,50 92,56 M8,66 Q22,60 36,66 Q50,72 64,66 Q78,60 92,66 M8,76 Q22,70 36,76 Q50,82 64,76 Q78,70 92,76', opacity: 0.28 },
        // Reed stalks rising from water — left heavy
        { d: 'M18,54 L16,22 L18,20 L20,24 L20,54 Z M28,52 L26,18 L28,16 L30,20 L30,52 Z M40,54 L38,26 L40,24 L42,28 L42,54 Z', opacity: 0.5 },
        // Right lighter reeds
        { d: 'M62,54 L60,28 L62,26 L64,30 L64,54 Z M74,52 L72,32 L74,30 L76,34 L76,52 Z M84,54 L82,30 L84,28 L86,32 L86,54 Z', opacity: 0.3 },
        // Bulrush tops
        { d: 'M14,22 L12,16 L18,12 L22,14 L20,20 L14,22 Z M24,18 L22,12 L28,8 L32,10 L30,16 L24,18 Z', opacity: 0.48 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Mixed — reeds + small grass tufts, water dots
    {
      paths: [
        // Left reeds
        { d: 'M14,78 L12,34 L14,32 L16,36 L16,78 Z M24,78 L22,40 L24,38 L26,42 L26,78 Z M34,78 L32,44 L34,42 L36,46 L36,78 Z', opacity: 0.55 },
        // Bulrush tops
        { d: 'M10,34 L8,28 L14,24 L18,26 L16,32 L10,34 Z M20,40 L18,34 L24,30 L28,32 L26,38 L20,40 Z M30,44 L28,38 L34,34 L38,36 L36,42 L30,44 Z', opacity: 0.5 },
        // Grass tufts in gaps
        { d: 'M42,78 L40,66 L44,64 L46,68 L48,64 L50,68 L48,76 L42,78 Z M56,76 L54,66 L58,64 L60,68 L58,74 L56,76 Z', opacity: 0.45 },
        // Right reeds — lighter
        { d: 'M68,78 L66,44 L68,42 L70,46 L70,78 Z M78,78 L76,40 L78,38 L80,42 L80,78 Z M88,78 L86,46 L88,44 L90,48 L90,78 Z', opacity: 0.3 },
        // Water dots scattered
        { d: 'M46,58 L44,54 L48,52 L50,56 L48,60 L46,58 Z M60,54 L58,50 L62,48 L64,52 L62,56 L60,54 Z M74,56 L72,52 L76,50 L78,54 L76,58 L74,56 Z', opacity: 0.25 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-11: swamp (3 variants: standing water + dead trees, dead trees, dense reeds)
  swamp: [
    // Variant 0: Standing water — dead trees (thin trunks, no canopy) in water
    {
      paths: [
        // Water surface — left edge darker
        { d: 'M6,62 Q25,56 44,62 Q63,68 82,62 Q90,58 94,62 L94,78 Q75,82 56,78 Q37,82 18,78 Q10,74 6,78 L6,62 Z', opacity: 0.28 },
        // Left dead trunk — tallest
        { d: 'M18,78 L16,36 L18,34 L20,38 L18,78 Z M12,48 L18,44 M12,58 L18,54', opacity: 0.5 },
        // Center dead trunk
        { d: 'M48,78 L46,44 L48,42 L50,46 L48,78 Z M42,54 L48,50 M42,64 L48,60', opacity: 0.45 },
        // Right dead trunk — lighter
        { d: 'M78,78 L76,50 L78,48 L80,52 L78,78 Z M72,60 L78,56 M72,70 L78,66', opacity: 0.3 },
        // Broken branches
        { d: 'M10,42 L16,40 L12,36 M18,36 L22,32 L20,28 M42,48 L46,44 M48,44 L52,40 L50,36', opacity: 0.4 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Dead trees — 2-3 bare trunks with broken branches, shadow left
    {
      paths: [
        // Left tall dead trunk — full shadow mass
        { d: 'M20,80 L16,32 L18,30 L22,32 L20,80 Z', opacity: 0.55 },
        // Left branches — heavy
        { d: 'M14,42 L20,38 L14,36 L10,32 M16,54 L20,50 L14,46 M18,64 L20,60 L14,56', opacity: 0.5 },
        // Center dead trunk
        { d: 'M52,80 L48,40 L50,38 L54,40 L52,80 Z', opacity: 0.48 },
        { d: 'M46,50 L52,46 L46,42 L42,38 M48,60 L52,56 L46,52 M50,70 L52,66 L46,62', opacity: 0.42 },
        // Right dead trunk — lighter
        { d: 'M80,80 L78,48 L80,46 L82,48 L80,80 Z', opacity: 0.35 },
        { d: 'M74,58 L80,54 L76,50 L72,46 M76,66 L80,62 M78,72 L80,68', opacity: 0.28 },
        // Ground — wet dark marks
        { d: 'M10,76 Q30,70 50,74 Q70,70 90,76 Q70,80 50,80 Q30,80 10,76 Z', opacity: 0.25 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Dense reeds — thick reed mass, very filled, irregular top edge
    {
      paths: [
        // Left dense reed mass — very filled
        { d: 'M10,78 L8,28 L10,24 L14,22 L16,28 L18,22 L20,26 L22,20 L24,24 L26,18 L28,24 L30,20 L32,26 L34,78 L10,78 Z', opacity: 0.6 },
        // Center reed band
        { d: 'M34,78 L32,26 L36,22 L38,28 L40,22 L42,28 L44,22 L46,26 L48,20 L50,24 L52,18 L54,24 L56,78 L34,78 Z', opacity: 0.52 },
        // Right reed band — lighter
        { d: 'M56,78 L54,24 L58,22 L60,28 L62,22 L64,28 L66,24 L68,30 L70,24 L72,30 L74,26 L76,78 L56,78 Z', opacity: 0.38 },
        // Far right — lightest
        { d: 'M76,78 L74,28 L78,26 L80,32 L82,26 L84,32 L86,28 L88,34 L90,78 L76,78 Z', opacity: 0.28 },
      ],
      viewBox: '0 0 100 100',
    },
  ],

  // LART-12: moor_bog (3 variants: heather, peat, sparse scrub)
  moor_bog: [
    // Variant 0: Heather — low rolling bush shapes, low profile, left side denser
    {
      paths: [
        // Left heather mounds — denser
        { d: 'M10,72 L10,62 Q14,54 20,58 Q24,52 28,56 Q32,50 38,54 Q42,58 42,66 L42,72 L10,72 Z', opacity: 0.55 },
        { d: 'M12,60 Q16,52 22,56 Q26,50 30,54 Q34,50 38,56 M14,56 Q18,50 24,54', opacity: 0.45 },
        // Center heather — medium
        { d: 'M42,72 L42,64 Q46,56 52,60 Q56,54 62,58 Q66,62 66,68 L66,72 L42,72 Z', opacity: 0.45 },
        // Right heather — lighter
        { d: 'M66,72 L66,65 Q70,58 76,62 Q80,56 86,60 Q90,64 90,70 L90,72 L66,72 Z', opacity: 0.3 },
        { d: 'M68,62 Q72,56 78,60 Q82,56 86,62', opacity: 0.25 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 1: Peat — rough textured ground with small dots/marks and cracks
    {
      paths: [
        // Peat ground layer — wavy
        { d: 'M8,70 Q20,64 32,68 Q44,62 56,68 Q68,62 80,68 Q88,64 92,70 L92,78 Q80,74 68,76 Q56,72 44,76 Q32,72 20,76 Q12,74 8,78 L8,70 Z', opacity: 0.32 },
        // Dark peat marks — left heavy
        { d: 'M14,68 L12,62 L16,60 L20,62 L18,68 L14,68 Z M24,66 L22,60 L26,58 L30,60 L28,66 L24,66 Z M36,68 L34,62 L38,60 L42,62 L40,68 L36,68 Z M48,66 L46,60 L50,58 L54,60 L52,66 L48,66 Z', opacity: 0.45 },
        // Right peat marks — lighter
        { d: 'M60,66 L58,60 L62,58 L66,60 L64,66 L60,66 Z M72,68 L70,62 L74,60 L78,62 L76,68 L72,68 Z M82,66 L80,62 L84,60 L88,62 L86,66 L82,66 Z', opacity: 0.3 },
        // Surface crack lines — left heavy
        { d: 'M12,58 L18,54 L16,50 L22,46 M28,56 L34,52 L32,48 M44,58 L50,54 L48,50', opacity: 0.25 },
      ],
      viewBox: '0 0 100 100',
    },
    // Variant 2: Sparse scrub — tiny scattered bush shapes, mostly bare ground
    {
      paths: [
        // Bare ground base
        { d: 'M8,72 Q30,66 52,70 Q74,66 92,72 L92,78 Q70,76 50,78 Q28,76 8,78 L8,72 Z', opacity: 0.25 },
        // Left scrub clumps — heavier
        { d: 'M14,70 L12,60 Q16,54 22,58 Q26,52 30,56 Q32,60 30,68 L14,70 Z', opacity: 0.52 },
        { d: 'M14,60 Q18,54 24,58 Q22,52 26,56', opacity: 0.4 },
        // Center sparse scrub
        { d: 'M44,70 L42,62 Q46,56 50,60 Q54,56 56,60 Q58,64 56,70 L44,70 Z', opacity: 0.42 },
        // Right minimal scrub — very light
        { d: 'M68,68 L66,62 Q70,58 74,62 Q78,58 80,62 Q80,66 78,68 L68,68 Z', opacity: 0.28 },
        // Scattered bare dots
        { d: 'M36,66 L34,62 L38,60 L40,64 L38,66 L36,66 Z M58,64 L56,60 L60,58 L62,62 L60,64 L58,64 Z M84,66 L82,62 L86,60 L88,64 L86,66 L84,66 Z', opacity: 0.35 },
      ],
      viewBox: '0 0 100 100',
    },
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
