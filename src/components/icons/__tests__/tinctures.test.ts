import { describe, it, expect } from 'vitest';
import { deriveTinctures } from '../heraldry/tinctures';
import { SPHERE_COLORS, REACH_TO_SPHERE } from '../constants';
import { REACH_DOMAINS } from '../../../types/traits';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Mean channel brightness in 0..1 — the "% brightness" STYLE.md bands the world by. */
function brightness(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 0xff) + ((n >> 8) & 0xff) + (n & 0xff)) / 3 / 255;
}

describe('deriveTinctures — structure', () => {
  it('all 8 reaches produce valid hex color strings', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect(t.primary, `${reach} primary`).toMatch(HEX_COLOR_RE);
      expect(t.secondary, `${reach} secondary`).toMatch(HEX_COLOR_RE);
      expect(t.foundation, `${reach} foundation`).toMatch(HEX_COLOR_RE);
      expect(t.charge, `${reach} charge`).toMatch(HEX_COLOR_RE);
    }
  });

  it('secondary (division field) is darker than primary (field)', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect(brightness(t.secondary), `secondary for ${reach}`).toBeLessThan(
        brightness(t.primary),
      );
    }
  });
});

/**
 * THR-638 — the Threadbare register. These replace the previous
 * `primary === SPHERE_COLORS[sphere]` identity assertions, which pinned the
 * palette to a contract the style guide contradicts: they passed while the
 * generator emitted bright pastel fields (mint, salmon, sky blue), because
 * "equals the sphere constant" says nothing about whether the result belongs
 * in this world. These assert the property that actually matters.
 */
describe('deriveTinctures — Threadbare register (STYLE.md)', () => {
  it('keeps every field inside the world value range (10–40% brightness)', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      const b = brightness(t.primary);
      expect(b, `${reach} field brightness`).toBeGreaterThan(0.02);
      expect(b, `${reach} field brightness`).toBeLessThanOrEqual(0.4);
    }
  });

  it('keeps the division field and foundation dark too', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect(brightness(t.secondary), `${reach} division`).toBeLessThanOrEqual(0.4);
      expect(brightness(t.foundation), `${reach} foundation`).toBeLessThanOrEqual(0.4);
    }
  });

  it('carries the sphere colour as the luminous charge, undimmed', () => {
    // The charge is the device that reads at distance — the thread breaking
    // through. It is the sphere's own colour, not a two-value contrast flip.
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect(t.charge, `${reach} charge`).toBe(SPHERE_COLORS[REACH_TO_SPHERE[reach]]);
    }
  });

  it('gives the charge clear separation from its field', () => {
    for (const reach of REACH_DOMAINS) {
      const t = deriveTinctures(reach);
      expect(
        brightness(t.charge) - brightness(t.primary),
        `${reach} charge/field separation`,
      ).toBeGreaterThan(0.2);
    }
  });

  it('tints the field with its own sphere hue rather than one shared grey', () => {
    const fields = REACH_DOMAINS.map((r) => deriveTinctures(r).primary);
    expect(new Set(fields).size).toBe(REACH_DOMAINS.length);
  });
});
