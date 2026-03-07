import type { TerrainType } from '../types';

/**
 * Threadbare dark palette for fallback biome colors.
 * Used as fallback behind terrain art images and during loading.
 * Kept dark to avoid bright flash as images load.
 */
export const BIOME_COLORS: Record<TerrainType, string> = {
  // Water — deep dark blues
  ocean: '#1a2a3a',
  coastal_shallows: '#2a3a4a',
  lake: '#1e3040',
  river: '#253545',

  // Lowlands — muted dark greens/browns
  grassland: '#3a3a20',
  farmland: '#3a3520',
  savanna: '#3a3520',
  steppe: '#35351e',

  // Forest — deep dark greens
  deciduous_forest: '#2a3a1a',
  dense_forest: '#1a2a10',
  taiga: '#1a2a1a',
  jungle: '#1a3a1a',

  // Wet — dark olive
  swamp: '#2a3a1a',
  bog: '#2a3020',

  // Elevated — dark browns/greys
  hills: '#3a3520',
  mountains: '#2a2a2a',
  plateau: '#3a3020',
  badlands: '#3a2520',

  // Elevated + forested — dark olive-browns
  forested_hills_evergreen: '#2a3520',
  forested_hills_deciduous: '#2a3520',
  forested_hills_jungle: '#2a3520',

  // Special
  great_home_trees: '#1a2a10',
  broken_lands: '#3a3530',

  // Extreme — dark themed
  desert: '#3a3020',
  tundra: '#2a3035',
  glacier: '#2a3a4a',
  volcanic: '#2a1515',
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
