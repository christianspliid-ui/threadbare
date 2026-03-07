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

  it('ocean has a dark blue color', () => {
    expect(BIOME_COLORS.ocean).toBe('#1a2a3a');
  });

  it('grassland has a dark muted color', () => {
    expect(BIOME_COLORS.grassland).toBe('#3a3a20');
  });

  it('mountains has a dark grey color', () => {
    expect(BIOME_COLORS.mountains).toBe('#2a2a2a');
  });
});
