/**
 * Tait-derived terrain palette for the Three.js hex renderer.
 * All 30 terrain types mapped to hex color strings.
 * NFP #1: Every color is a named entry — change game feel by changing a value here.
 */

export const TERRAIN_PALETTE: Record<string, string> = {
  // Lowland (4)
  grassland:       '#8EB852',
  savanna:         '#B8B44E',
  steppe:          '#C6DA79',
  floodplain:      '#7EA04A',

  // Forest (6)
  light_forest:    '#7AAE42',
  woodland:        '#6A9E3A',
  temperate_forest:'#4E8830',
  dense_forest:    '#3A6E24',
  boreal_forest:   '#3A6830',
  tropical_forest: '#2E6E2C',

  // Wet (3)
  marsh:           '#8A9850',
  swamp:           '#6E8838',
  moor_bog:        '#82C896',

  // Highland (6)
  hills:           '#C8A850',
  forested_hills:  '#5C8234',
  mountains:       '#9E7830',
  high_mountains:  '#8A8A8A',
  plateau:         '#B89848',
  mountain_pass:   '#A89060',

  // Desert (5)
  sand_desert:     '#D4B878',
  sand_dunes:      '#CCAC60',
  rocky_desert:    '#C09050',
  hardened_clay:   '#D0A090',
  badlands:        '#C07844',

  // Cold (3)
  tundra:          '#F0F0F0',
  snow_fields:     '#E8E8E8',
  glacier:         '#D0DDE8',

  // Volcanic (3)
  volcanic:        '#8A8890',
  volcano:         '#8A4430',
  lava:            '#D06830',

  // Special (2)
  broken_lands:    '#A09888',
  dead_forest:     '#98988A',
} as const;

/** Fallback color for any terrain type not in the palette. */
export const FALLBACK_TERRAIN_COLOR = '#888888';

/**
 * Converts a snake_case terrain key to Title Case display name.
 * e.g. 'temperate_forest' -> 'Temperate Forest'
 */
export function terrainDisplayName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
