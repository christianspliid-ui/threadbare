/**
 * Water palette for the Three.js hex renderer.
 * Separate from the terrain palette — water hexes always use these blues.
 * NFP #1: Every color is a named entry.
 *
 * COLOR SOURCE: "Golden Hour" warm-shifted palette derived from the original
 * Tait reference (Design/hexmap macro-reference.png). Blues desaturated and
 * warmed toward muted teal-blue to harmonize with the dark-gold UI chrome.
 *
 * Original Tait values for reference:
 *   deep_ocean: #3A7AB8 → #366A98
 *   ocean:      #5098D0 → #4886B0
 *   shallows:   #78BCE0 → #6AA2C0
 *   lake:       #4A8FC0 → #4280A8
 *   river:      #78BCE0 → #6AA2C0
 */

export const WATER_PALETTE: Record<string, string> = {
  shallows:   '#6AA2C0',
  ocean:      '#4886B0',
  deep_ocean: '#366A98',
  lake:       '#4280A8',
  river:      '#6AA2C0',
} as const;

/**
 * Sea level threshold — ocean hexes are those with elevation below this value.
 * Must match worldGen seaLevelThreshold in hexGrid.ts.
 * NFP #1: Named constant.
 */
export const SEA_LEVEL = 0.38;

/**
 * Depth band elevation thresholds for ocean coloring.
 * Hexes with elevation below SEA_LEVEL are ocean; depth band is determined
 * by elevation relative to these thresholds.
 *
 * NFP #1: All thresholds are named constants.
 */
export const DEPTH_BAND_THRESHOLDS = {
  /** Below this elevation → deep ocean (darkest) */
  deep: 0.15,
  /** Below this elevation (but above deep) → mid ocean */
  mid: 0.30,
  /** Above mid threshold (but below SEA_LEVEL) → shallows */
} as const;

/**
 * Returns the appropriate water color for an ocean hex based on elevation.
 * Used to produce a depth gradient: deep ocean → mid ocean → shallows.
 *
 * NFP #3: Deterministic — color depends only on elevation value.
 * NFP #4: Fail-soft — any elevation returns a valid color, no throws.
 */
export function getDepthBandColor(elevation: number): string {
  if (elevation < DEPTH_BAND_THRESHOLDS.deep) {
    return WATER_PALETTE['deep_ocean'];
  }
  if (elevation < DEPTH_BAND_THRESHOLDS.mid) {
    return WATER_PALETTE['ocean'];
  }
  return WATER_PALETTE['shallows'];
}

/**
 * The set of TerrainType values that are "water" terrain and should
 * use the WATER_PALETTE rather than TERRAIN_PALETTE.
 */
export const WATER_TERRAIN_KEYS = new Set([
  'shallows',
  'ocean',
  'deep_ocean',
  'lake',
  'river',
  'coastal_shallows',
  'tropical_ocean',
  'reef',
  'coast',
]);

/**
 * Maps existing TerrainType water variants to WATER_PALETTE keys.
 * Returns null if the terrain is not a water type.
 */
export function getWaterColor(terrain: string): string | null {
  switch (terrain) {
    case 'ocean':
    case 'tropical_ocean':
      return WATER_PALETTE['ocean'];
    case 'deep_ocean':
      return WATER_PALETTE['deep_ocean'];
    case 'lake':
      return WATER_PALETTE['lake'];
    case 'river':
      return WATER_PALETTE['river'];
    case 'shallows':
    case 'coastal_shallows':
    case 'coast':
    case 'reef':
      return WATER_PALETTE['shallows'];
    default:
      return null;
  }
}
