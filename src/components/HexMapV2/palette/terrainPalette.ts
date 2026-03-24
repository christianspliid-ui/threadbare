/**
 * "Golden Hour" terrain palette for the Three.js hex renderer.
 * Warm-shifted from the original Tait reference to harmonize with
 * the dark-parchment-and-gold UI chrome. Greens lean olive/sage,
 * cold tiles gain warm ivory, water desaturates toward teal-blue.
 *
 * All 30 terrain types mapped to hex color strings.
 * NFP #1: Every color is a named entry — change game feel by changing a value here.
 */

export const TERRAIN_PALETTE: Record<string, string> = {
  // Lowland (4)
  grassland:       '#9CA85C',
  savanna:         '#B4A654',
  steppe:          '#BCC272',
  floodplain:      '#88945A',

  // Forest (6)
  light_forest:    '#849A52',
  woodland:        '#748C48',
  temperate_forest:'#5C783E',
  dense_forest:    '#4C6436',
  boreal_forest:   '#4A5E3A',
  tropical_forest: '#426440',

  // Wet (3)
  marsh:           '#8E905A',
  swamp:           '#748046',
  moor_bog:        '#80B488',

  // Highland (6)
  hills:           '#C0A05A',
  forested_hills:  '#687844',
  mountains:       '#A47A3C',
  high_mountains:  '#908680',
  plateau:         '#B69450',
  mountain_pass:   '#A68C58',

  // Desert (5)
  sand_desert:     '#CEAE72',
  sand_dunes:      '#C8A460',
  rocky_desert:    '#B88C50',
  hardened_clay:   '#C69A84',
  badlands:        '#B4764A',

  // Cold (3)
  tundra:          '#E2DCD0',
  snow_fields:     '#DAD4C8',
  glacier:         '#C6CCD2',

  // Volcanic (3)
  volcanic:        '#8A8480',
  volcano:         '#884C38',
  lava:            '#C46C3C',

  // Special (2)
  broken_lands:    '#9C9284',
  dead_forest:     '#929080',
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
