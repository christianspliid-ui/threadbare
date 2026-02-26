import { describe, it, expect } from 'vitest';
import { blendForceColors, FORCE_COLORS, hexToRgb, rgbToHex } from '../color';
import type { ForceVector } from '../../types';

describe('hexToRgb / rgbToHex', () => {
  it('round-trips correctly', () => {
    expect(rgbToHex(hexToRgb('#6B5CE7'))).toBe('#6b5ce7');
  });
});

describe('blendForceColors', () => {
  it('returns pure force color when one force dominates completely', () => {
    const fv: ForceVector = { aether: 1, verdance: 0, ignis: 0, umbra: 0, terra: 0 };
    const color = blendForceColors(fv);
    expect(color).toBe(FORCE_COLORS.aether.primary.toLowerCase());
  });

  it('returns a valid hex color string', () => {
    const fv: ForceVector = { aether: 0.2, verdance: 0.2, ignis: 0.2, umbra: 0.2, terra: 0.2 };
    const color = blendForceColors(fv);
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
});
