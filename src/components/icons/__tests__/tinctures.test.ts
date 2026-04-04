import { describe, it, expect } from 'vitest';
import { deriveTinctures } from '../heraldry/tinctures';
import { SPHERE_COLORS, REACH_TO_SPHERE, SPHERE_TO_FOUNDATION } from '../constants';
import { REACH_DOMAINS } from '../../../types/traits';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

describe('deriveTinctures', () => {
  it('iron maps to force sphere (red) and chaos foundation', () => {
    const t = deriveTinctures('iron');
    expect(t.primary).toBe(SPHERE_COLORS.force);
    expect(t.foundation).toBe(SPHERE_COLORS.chaos);
  });

  it('heart maps to spirit sphere (purple) and darkness foundation', () => {
    const t = deriveTinctures('heart');
    expect(t.primary).toBe(SPHERE_COLORS.spirit);
    expect(t.foundation).toBe(SPHERE_COLORS.darkness);
  });

  it('secondary color is darker than primary', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      // Parse brightness: secondary should be numerically darker (lower average)
      const primAvg = parseInt(t.primary.slice(1, 3), 16) + parseInt(t.primary.slice(3, 5), 16) + parseInt(t.primary.slice(5, 7), 16);
      const secAvg = parseInt(t.secondary.slice(1, 3), 16) + parseInt(t.secondary.slice(3, 5), 16) + parseInt(t.secondary.slice(5, 7), 16);
      expect(secAvg, `secondary for ${reach} should be darker than primary`).toBeLessThan(primAvg);
    }
  });

  it('all 8 reaches produce valid hex color strings', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect(t.primary, `${reach} primary`).toMatch(HEX_COLOR_RE);
      expect(t.secondary, `${reach} secondary`).toMatch(HEX_COLOR_RE);
      expect(t.foundation, `${reach} foundation`).toMatch(HEX_COLOR_RE);
      expect(t.charge, `${reach} charge`).toMatch(HEX_COLOR_RE);
    }
  });

  it('primary comes from SPHERE_COLORS via REACH_TO_SPHERE', () => {
    for (const reach of REACH_DOMAINS) {
      const sphere = REACH_TO_SPHERE[reach];
      const t = deriveTinctures(reach);
      expect(t.primary).toBe(SPHERE_COLORS[sphere]);
    }
  });

  it('foundation comes from SPHERE_COLORS via SPHERE_TO_FOUNDATION', () => {
    for (const reach of REACH_DOMAINS) {
      const sphere = REACH_TO_SPHERE[reach];
      const foundation = SPHERE_TO_FOUNDATION[sphere];
      const t = deriveTinctures(reach);
      expect(t.foundation).toBe(SPHERE_COLORS[foundation]);
    }
  });

  it('charge color is either dark navy or off-white for contrast', () => {
    const darkCharge = '#1a1a2e';
    const lightCharge = '#e0ddd4';
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect([darkCharge, lightCharge], `${reach} charge should be one of the two contrast values`).toContain(t.charge);
    }
  });
});
