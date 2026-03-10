import type { TerrainType } from '../types';

/**
 * Threadbare dark palette for fallback biome colors.
 * Used as fallback behind terrain art images and during loading.
 * Kept dark to avoid bright flash as images load.
 */
export const BIOME_COLORS: Record<TerrainType, string> = {
  // Water — deep dark blues
  ocean: '#1a2a3a',
  deep_ocean: '#0f1a2a',
  tropical_ocean: '#1a2f3a',
  coastal_shallows: '#2a3a4a',
  coast: '#2a3a4a',
  lake: '#1e3040',
  river: '#253545',
  reef: '#1a3040',

  // Lowlands — muted dark greens/browns
  grassland: '#3a3a20',
  farmland: '#3a3520',
  savanna: '#3a3520',
  steppe: '#35351e',
  floodplain: '#2a3520',

  // Forest — deep dark greens
  temperate_forest: '#2a3a1a',
  dense_forest: '#1a2a10',
  boreal_forest: '#1a2a1a',
  jungle: '#1a3a1a',
  tropical_forest: '#1a3a1a',
  evergreen_forest: '#1a2a1a',
  light_forest: '#2a3a20',
  dead_forest: '#3a3530',

  // Wet — dark olive
  swamp: '#2a3a1a',
  marsh: '#2a3020',
  moor_bog: '#2a3020',

  // Elevated — dark browns/greys
  hills: '#3a3520',
  mountains: '#2a2a2a',
  high_mountains: '#2a2a2a',
  plateau: '#3a3020',
  badlands: '#3a2520',
  mountain_pass: '#3a3020',

  // Elevated + forested — dark olive-browns
  forested_hills: '#2a3520',

  // Special
  great_home_trees: '#1a2a10',
  broken_lands: '#3a3530',
  oasis: '#2a3520',

  // Extreme — dark themed
  desert: '#3a3020',
  rocky_desert: '#3a3020',
  sand_dunes: '#3a3520',
  tundra: '#2a3035',
  glacier: '#2a3a4a',
  volcano: '#2a1515',
  arctic: '#2a3540',
  snow_fields: '#2a3a4a',
};

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.min(255, Math.max(0, rgb.r)));
  const g = Math.round(Math.min(255, Math.max(0, rgb.g)));
  const b = Math.round(Math.min(255, Math.max(0, rgb.b)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function darkenColor(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  return rgbToHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
}
