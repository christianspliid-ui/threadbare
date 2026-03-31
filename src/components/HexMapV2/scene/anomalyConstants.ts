/**
 * anomalyConstants.ts — Pure constants for the anomaly shimmer/halo visual system.
 *
 * No Three.js dependency — safe to import from tests and CMS.
 * Maps anomaly location subtypes to their thematic sphere for visual tinting.
 *
 * NFP #1 (tunability): All animation timing, opacity, and scale values are named exports.
 */

// ── Anomaly → Sphere Mapping ─────────────────────────────────────────────────

/** Maps each anomaly location subtype to its thematic sphere name. */
export const ANOMALY_SPHERE_MAP: Record<string, string> = {
  gem_deposit:     'matter',
  golden_grove:    'life',
  crystal_cavern:  'energy',
  ancient_vault:   'time',
  sunken_treasury: 'entropy',
  herb_garden:     'life',
  fossil_bed:      'time',
  iron_seep:       'matter',
  pearl_shoal:     'spirit',
  glowcap_hollow:  'mind',
};

/** Set of all anomaly location subtypes — for quick membership checks. */
export const ANOMALY_LOCATION_TYPES: ReadonlySet<string> = new Set(Object.keys(ANOMALY_SPHERE_MAP));

// ── Shimmer Constants (undiscovered state) ───────────────────────────────────

/** Sinusoidal pulse period in seconds — slow, subtle breathing. */
export const SHIMMER_PULSE_PERIOD_S = 4.0;

/** Minimum opacity at pulse trough — barely visible. */
export const SHIMMER_MIN_OPACITY = 0.08;

/** Maximum opacity at pulse peak — noticeable but not distracting. */
export const SHIMMER_MAX_OPACITY = 0.18;

/** Sprite scale as fraction of HEX_SIZE — covers ~60% of hex. */
export const SHIMMER_SPRITE_SCALE = 0.6;

/** Canvas resolution for shimmer radial gradient texture. */
export const SHIMMER_TEXTURE_SIZE = 64;

// ── Halo Constants (discovered state) ────────────────────────────────────────

/** Sinusoidal pulse period — slightly faster than shimmer. */
export const HALO_PULSE_PERIOD_S = 3.5;

/** Minimum opacity at rest — clearly visible. */
export const HALO_MIN_OPACITY = 0.25;

/** Maximum opacity at peak — prominent but not overwhelming. */
export const HALO_MAX_OPACITY = 0.45;

/** Sprite scale as fraction of HEX_SIZE — larger ring around icon. */
export const HALO_SPRITE_SCALE = 0.8;

/** Canvas resolution for halo ring texture. */
export const HALO_TEXTURE_SIZE = 128;

/** Inner radius of halo ring as fraction of texture half-size. */
export const HALO_RING_INNER_RADIUS_FRAC = 0.35;

/** Outer radius of halo ring as fraction of texture half-size. */
export const HALO_RING_OUTER_RADIUS_FRAC = 0.48;

// ── Reveal Flash Constants (discovery transition) ────────────────────────────

/** Duration of the reveal flash animation in milliseconds. */
export const REVEAL_FLASH_DURATION_MS = 1000;

/** Peak opacity of the reveal flash (bright burst). */
export const REVEAL_FLASH_PEAK_OPACITY = 0.7;

/** Duration of shimmer fade-out during reveal (milliseconds). */
export const REVEAL_SHIMMER_FADEOUT_MS = 500;

// ── Fallback ─────────────────────────────────────────────────────────────────

/** Fallback sphere color when anomaly sphere lookup fails — warm amber. */
export const ANOMALY_FALLBACK_SPHERE_COLOR = '#d4a574';
