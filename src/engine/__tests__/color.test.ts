import { describe, it, expect } from 'vitest';
import { BIOME_COLORS, hexToRgb, rgbToHex } from '../color';

describe('hexToRgb / rgbToHex', () => {
  it('round-trips correctly', () => {
    expect(rgbToHex(hexToRgb('#6B5CE7'))).toBe('#6b5ce7');
  });
});

describe('BIOME_COLORS', () => {
  it('all terrain types have valid hex color codes', () => {
    Object.entries(BIOME_COLORS).forEach(([, color]) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('has colors for all 22 biome types', () => {
    expect(Object.keys(BIOME_COLORS).length).toBe(22);
  });

  it('ocean has a blue color', () => {
    expect(BIOME_COLORS.ocean).toBe('#4477aa');
  });

  it('grassland has a green-yellow color', () => {
    expect(BIOME_COLORS.grassland).toBe('#c8d87a');
  });

  it('mountains has a grey-brown color', () => {
    expect(BIOME_COLORS.mountains).toBe('#8a7a6a');
  });
});
