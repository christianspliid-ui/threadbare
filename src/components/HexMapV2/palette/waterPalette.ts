/**
 * Water palette for the Three.js hex renderer.
 * Separate from the terrain palette — water hexes always use these blues.
 * NFP #1: Every color is a named entry.
 */

export const WATER_PALETTE: Record<string, string> = {
  shallows:  '#88C0E0',
  ocean:     '#5898D0',
  deep_ocean:'#3870B0',
  lake:      '#5888B8',
  river:     '#4878A8',
} as const;

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
