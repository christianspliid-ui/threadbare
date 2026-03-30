import { describe, it, expect } from 'vitest';
import { WATER_PALETTE, getWaterColor, getDepthBandColor } from '../waterPalette';

describe('WATER_PALETTE', () => {
  it('has the expected keys', () => {
    expect(WATER_PALETTE).toHaveProperty('shallows');
    expect(WATER_PALETTE).toHaveProperty('ocean');
    expect(WATER_PALETTE).toHaveProperty('deep_ocean');
    expect(WATER_PALETTE).toHaveProperty('lake');
    expect(WATER_PALETTE).toHaveProperty('river');
  });

  it('all color values match #RRGGBB format', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [key, value] of Object.entries(WATER_PALETTE)) {
      expect(value, `WATER_PALETTE['${key}'] = '${value}'`).toMatch(hexPattern);
    }
  });
});

describe('getDepthBandColor', () => {
  it('returns deep ocean color for elevation 0.05 (below deep threshold 0.15)', () => {
    const color = getDepthBandColor(0.05);
    expect(color).toBe(WATER_PALETTE['deep_ocean']);
  });

  it('returns mid ocean color for elevation 0.25 (between 0.15 and 0.30)', () => {
    const color = getDepthBandColor(0.25);
    expect(color).toBe(WATER_PALETTE['ocean']);
  });

  it('returns shallows color for elevation 0.34 (above mid threshold 0.30)', () => {
    const color = getDepthBandColor(0.34);
    expect(color).toBe(WATER_PALETTE['shallows']);
  });

  it('returns a valid #RRGGBB color for any ocean elevation', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const elev of [0.0, 0.1, 0.2, 0.3, 0.35, 0.37]) {
      expect(getDepthBandColor(elev)).toMatch(hexPattern);
    }
  });
});

describe('getWaterColor', () => {
  it('returns lake water color for lake terrain', () => {
    const color = getWaterColor('lake');
    expect(color).toBe(WATER_PALETTE['lake']);
  });

  it('returns null for non-water terrain', () => {
    expect(getWaterColor('grassland')).toBeNull();
    expect(getWaterColor('desert')).toBeNull();
  });

  it('returns a color for all water terrain types', () => {
    const waterTerrains = ['ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef'];
    for (const terrain of waterTerrains) {
      expect(getWaterColor(terrain), `terrain: ${terrain}`).not.toBeNull();
    }
  });
});
