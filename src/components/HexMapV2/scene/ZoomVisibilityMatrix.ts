/**
 * ZoomVisibilityMatrix.ts — Zoom tier thresholds, visibility matrix, and fade alpha helper.
 *
 * Defines the four zoom tiers used throughout HexMapV2, specifies which render
 * layers are visible at each tier, and provides a smooth fade transition helper
 * at tier boundaries.
 *
 * NFP #1: All threshold values and fade constants are named — change game feel
 *         by tuning numbers here, not by editing call sites.
 * NFP #2: ZOOM_VISIBILITY_MATRIX is a complete, inspectable data structure —
 *         trace exactly why a layer is or isn't rendered at a given zoom level.
 */

// ── Zoom Tier Type ────────────────────────────────────────────────────────────

/**
 * The four discrete zoom levels used to control layer visibility.
 * - hero-local: zoomed in close (k >= 15), all detail visible
 * - regional: medium zoom (k >= 5), most content visible
 * - continental: zoomed out (k >= 1.5), sparse content
 * - full-world: fully zoomed out (k < 1.5), only coarse info
 */
export type ZoomTier = 'hero-local' | 'regional' | 'continental' | 'full-world';

// ── Zoom Tier Thresholds ─────────────────────────────────────────────────────

/**
 * Minimum k (d3-zoom scale) values for each zoom tier.
 * Tiers use >= checks in descending order: if k >= HERO_LOCAL → hero-local, etc.
 *
 * NFP #1: All threshold values are named constants.
 * Agent zoom visibility uses these thresholds via getZoomTier + ZOOM_VISIBILITY_MATRIX.
 */
export const ZOOM_TIER_THRESHOLDS = {
  /** Hero-local zoom: full detail, portraits, events, grid lines */
  HERO_LOCAL: 15,
  /** Regional zoom: signifiers, locations, dots, grid lines */
  REGIONAL: 5,
  /** Continental zoom: rivers, borders, retinue dots */
  CONTINENTAL: 1.5,
  /** Full-world zoom: only hex fill, coastlines, and kingdom borders */
  FULL_WORLD: 0,
} as const;

// ── Zoom Tier Resolver ───────────────────────────────────────────────────────

/**
 * Returns the zoom tier for a given d3-zoom scale value k.
 * Checks from highest to lowest — first match wins.
 *
 * @param k - Current d3-zoom transform scale (1.0 = no zoom)
 */
export function getZoomTier(k: number): ZoomTier {
  if (k >= ZOOM_TIER_THRESHOLDS.HERO_LOCAL) return 'hero-local';
  if (k >= ZOOM_TIER_THRESHOLDS.REGIONAL) return 'regional';
  if (k >= ZOOM_TIER_THRESHOLDS.CONTINENTAL) return 'continental';
  return 'full-world';
}

// ── Layer Name Type ──────────────────────────────────────────────────────────

/** All layer keys used in the visibility matrix. Literal union prevents typo bugs. */
export const LAYER_NAMES = [
  'hex_fill', 'coastline', 'grid_lines', 'elev_ticks',
  'rivers', 'roads', 'borders_kingdom', 'borders_barony',
  'signifiers', 'locations', 'agents_portrait', 'agents_dot',
  'agents_retinue', 'events', 'labels', 'fog',
] as const;

export type LayerName = typeof LAYER_NAMES[number];

// ── Visibility Matrix ────────────────────────────────────────────────────────

/**
 * Per-layer visibility at each zoom tier.
 *
 * Keys correspond to logical render layers (not necessarily 1:1 with
 * RENDER_ORDER, since some RENDER_ORDER entries split into multiple matrix keys).
 *
 * Derived from the Phase 7 UI-SPEC visibility matrix.
 *
 * NFP #2: Complete table — every layer x tier combination is explicit.
 */
export const ZOOM_VISIBILITY_MATRIX: Record<LayerName, Record<ZoomTier, boolean>> = {
  /** Base terrain fill — always visible */
  hex_fill: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': true,
  },
  /** Coastline contours — always visible */
  coastline: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': true,
  },
  /** Hex grid lines — visible at all zoom tiers */
  grid_lines: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': true,
  },
  /** Elevation tick marks — detail zoom only */
  elev_ticks: {
    'hero-local': true,
    'regional': true,
    'continental': false,
    'full-world': false,
  },
  /** River overlays — visible until full-world */
  rivers: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': false,
  },
  /** Road overlays — detail zoom only */
  roads: {
    'hero-local': true,
    'regional': true,
    'continental': false,
    'full-world': false,
  },
  /** Kingdom borders — always visible (coarse political info) */
  borders_kingdom: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': true,
  },
  /** Barony borders — visible until full-world */
  borders_barony: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': false,
  },
  /** Terrain signifiers (landscape art) — always visible */
  signifiers: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': true,
  },
  /** Location icons — regional+ only */
  locations: {
    'hero-local': true,
    'regional': true,
    'continental': false,
    'full-world': false,
  },
  /** Agent portrait thumbnails — hero-local only (V1 token zoom behavior) */
  agents_portrait: {
    'hero-local': true,
    'regional': false,
    'continental': false,
    'full-world': false,
  },
  /** Agent faction dots — visible at regional and continental tiers (V1 dot behavior) */
  agents_dot: {
    'hero-local': false,
    'regional': true,
    'continental': true,
    'full-world': false,
  },
  /** Agent retinue tiny dots — continental only */
  agents_retinue: {
    'hero-local': false,
    'regional': false,
    'continental': true,
    'full-world': false,
  },
  /** Event indicators — hero-local only */
  events: {
    'hero-local': true,
    'regional': false,
    'continental': false,
    'full-world': false,
  },
  /** Text labels — regional+ only */
  labels: {
    'hero-local': true,
    'regional': true,
    'continental': false,
    'full-world': false,
  },
  /** Fog of war overlay — always active when fog enabled */
  fog: {
    'hero-local': true,
    'regional': true,
    'continental': true,
    'full-world': true,
  },
} as const;

// ── Fade Alpha Helper ────────────────────────────────────────────────────────

/**
 * Default fade range used for smooth tier transitions.
 * Layers cross-fade over this k-range centred on each tier threshold.
 *
 * NFP #1: named constant, tune to adjust transition sharpness.
 */
export const FADE_RANGE = 0.2;

/**
 * Returns a fade alpha (0–1) for smooth transitions at tier boundaries.
 *
 * - Returns 0.0 when k <= threshold - fadeRange (fully below tier)
 * - Returns 1.0 when k >= threshold + fadeRange (fully above tier)
 * - Returns linear interpolation in between
 *
 * @param k          - Current d3-zoom scale
 * @param threshold  - Tier boundary k value
 * @param fadeRange  - Half-width of the cross-fade zone (use FADE_RANGE as default)
 */
export function getFadeAlpha(k: number, threshold: number, fadeRange: number): number {
  const low = threshold - fadeRange;
  const high = threshold + fadeRange;
  if (k <= low) return 0.0;
  if (k >= high) return 1.0;
  return (k - low) / (2 * fadeRange);
}
