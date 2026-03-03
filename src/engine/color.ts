import type { TerrainType } from '../types';

/**
 * Naturalistic biome color palette inspired by cartography and Atlas of Mystara
 */
export const BIOME_COLORS: Record<TerrainType, string> = {
  // Water
  ocean: '#4477aa',
  coastal_shallows: '#88bbdd',
  lake: '#6699bb',
  river: '#5588aa',

  // Lowlands
  grassland: '#c8d87a',
  farmland: '#ddc855',
  savanna: '#d8c870',
  steppe: '#c0a868',

  // Forest
  deciduous_forest: '#6aaa5a',
  dense_forest: '#3d7a3d',
  taiga: '#7a9a6a',
  jungle: '#2d8a3d',

  // Wet
  swamp: '#6a8a5a',
  bog: '#5a6a4a',

  // Elevated
  hills: '#b8a870',
  mountains: '#8a7a6a',
  plateau: '#b89858',
  badlands: '#a87050',

  // Extreme
  desert: '#ddc890',
  tundra: '#c8c8b8',
  glacier: '#d8e8f0',
  volcanic: '#6a3a2a',
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
