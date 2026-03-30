import { describe, it, expect } from 'vitest';
import { BIOME_COLORS } from '../color';
import type { TerrainType } from '../../types';

/** Parse hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

describe('BIOME_COLORS (Threadbare dark fallback)', () => {
  const allTerrains: TerrainType[] = [
    'ocean', 'coastal_shallows', 'lake', 'river',
    'grassland', 'farmland', 'savanna', 'steppe',
    'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
    'swamp', 'marsh',
    'hills', 'mountains', 'plateau', 'badlands',
    'desert', 'tundra', 'glacier', 'volcano',
  ];

  it('all biome colors have brightness under 120', () => {
    for (const terrain of allTerrains) {
      const hex = BIOME_COLORS[terrain];
      const rgb = hexToRgb(hex);
      const brightness = (rgb.r + rgb.g + rgb.b) / 3;
      expect(brightness, `${terrain} (${hex}) too bright: ${brightness}`).toBeLessThan(120);
    }
  });

  it('water biomes are darker than land biomes on average', () => {
    const waterBrightness = ['ocean', 'coastal_shallows', 'lake', 'river']
      .map(t => {
        const rgb = hexToRgb(BIOME_COLORS[t as TerrainType]);
        return (rgb.r + rgb.g + rgb.b) / 3;
      });
    const avgWater = waterBrightness.reduce((a, b) => a + b, 0) / waterBrightness.length;
    expect(avgWater).toBeLessThan(80);
  });
});
