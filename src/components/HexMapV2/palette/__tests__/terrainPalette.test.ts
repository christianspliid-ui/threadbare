import { describe, it, expect } from 'vitest';
import { TERRAIN_PALETTE, FALLBACK_TERRAIN_COLOR, terrainDisplayName } from '../terrainPalette';
import { WATER_PALETTE, getWaterColor } from '../waterPalette';
import { hexToThreeColor, applyBrightnessNoise } from '../colorUtils';

describe('TERRAIN_PALETTE', () => {
  it('has exactly 30 keys', () => {
    expect(Object.keys(TERRAIN_PALETTE)).toHaveLength(30);
  });

  it('every value matches #RRGGBB format', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [key, value] of Object.entries(TERRAIN_PALETTE)) {
      expect(value, `terrain '${key}' color '${value}'`).toMatch(hexPattern);
    }
  });

  it('FALLBACK_TERRAIN_COLOR matches #RRGGBB format', () => {
    expect(FALLBACK_TERRAIN_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('WATER_PALETTE', () => {
  it('has exactly 5 keys', () => {
    expect(Object.keys(WATER_PALETTE)).toHaveLength(5);
  });

  it('contains shallows with correct color (from Design/hexmap macro-reference.png)', () => {
    expect(WATER_PALETTE['shallows']).toBe('#78BCE0');
  });

  it('contains deep_ocean with correct color (from Design/hexmap macro-reference.png)', () => {
    expect(WATER_PALETTE['deep_ocean']).toBe('#3A7AB8');
  });
});

describe('terrainDisplayName', () => {
  it("converts 'temperate_forest' to 'Temperate Forest'", () => {
    expect(terrainDisplayName('temperate_forest')).toBe('Temperate Forest');
  });

  it("converts 'moor_bog' to 'Moor Bog'", () => {
    expect(terrainDisplayName('moor_bog')).toBe('Moor Bog');
  });

  it("converts single word 'grassland' to 'Grassland'", () => {
    expect(terrainDisplayName('grassland')).toBe('Grassland');
  });
});

describe('getWaterColor', () => {
  it("returns ocean color for 'ocean'", () => {
    expect(getWaterColor('ocean')).toBe('#5098D0');
  });

  it("returns null for non-water terrain 'grassland'", () => {
    expect(getWaterColor('grassland')).toBeNull();
  });

  it("returns shallows color for 'coastal_shallows'", () => {
    expect(getWaterColor('coastal_shallows')).toBe('#78BCE0');
  });

  it("returns shallows color for 'coast'", () => {
    expect(getWaterColor('coast')).toBe('#78BCE0');
  });

  it("returns deep_ocean color for 'deep_ocean'", () => {
    expect(getWaterColor('deep_ocean')).toBe('#3A7AB8');
  });
});

describe('hexToThreeColor', () => {
  it("converts '#FF0000' to [1, 0, 0]", () => {
    const [r, g, b] = hexToThreeColor('#FF0000');
    expect(r).toBeCloseTo(1, 5);
    expect(g).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });

  it("converts '#000000' to [0, 0, 0]", () => {
    const [r, g, b] = hexToThreeColor('#000000');
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it("converts '#FFFFFF' to [1, 1, 1]", () => {
    const [r, g, b] = hexToThreeColor('#FFFFFF');
    expect(r).toBeCloseTo(1, 5);
    expect(g).toBeCloseTo(1, 5);
    expect(b).toBeCloseTo(1, 5);
  });

  it('returns fallback grey for malformed input', () => {
    const [r, g, b] = hexToThreeColor('not-a-color');
    expect(r).toBeCloseTo(0.533, 2);
    expect(g).toBeCloseTo(0.533, 2);
    expect(b).toBeCloseTo(0.533, 2);
  });
});

describe('applyBrightnessNoise', () => {
  it('applies positive noise factor correctly', () => {
    const [r, g, b] = applyBrightnessNoise(0.5, 0.5, 0.5, 0.05);
    expect(r).toBeCloseTo(0.525, 5);
    expect(g).toBeCloseTo(0.525, 5);
    expect(b).toBeCloseTo(0.525, 5);
  });

  it('clamps to 1.0 on overflow', () => {
    const [r, g, b] = applyBrightnessNoise(1.0, 1.0, 1.0, 0.05);
    expect(r).toBe(1.0);
    expect(g).toBe(1.0);
    expect(b).toBe(1.0);
  });

  it('clamps to 0.0 on underflow', () => {
    const [r, g, b] = applyBrightnessNoise(0.0, 0.0, 0.0, -0.05);
    expect(r).toBe(0.0);
    expect(g).toBe(0.0);
    expect(b).toBe(0.0);
  });

  it('applies negative noise factor correctly', () => {
    const [r, g, b] = applyBrightnessNoise(0.5, 0.5, 0.5, -0.05);
    expect(r).toBeCloseTo(0.475, 5);
    expect(g).toBeCloseTo(0.475, 5);
    expect(b).toBeCloseTo(0.475, 5);
  });
});
