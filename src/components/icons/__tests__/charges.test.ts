import { describe, it, expect } from 'vitest';
import { renderCharge } from '../heraldry/charges';
import { REACH_DOMAINS } from '../../../types/traits';

describe('renderCharge', () => {
  it('all 8 reaches produce an SVG group element', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = renderCharge(reach, '#ffffff', 1);
      expect(svg, `${reach} should produce a <g> element`).toMatch(/^<g /);
      expect(svg, `${reach} should close the group`).toContain('</g>');
    }
  });

  it('scale parameter appears in transform attribute', () => {
    const svg1 = renderCharge('iron', '#ffffff', 1.5);
    expect(svg1).toContain('scale(1.5)');

    const svg2 = renderCharge('iron', '#ffffff', 0.8);
    expect(svg2).toContain('scale(0.8)');
  });

  it('default center is (60, 75)', () => {
    const svg = renderCharge('iron', '#ffffff', 1);
    expect(svg).toContain('translate(60,75)');
  });

  it('custom center coordinates work', () => {
    const svg = renderCharge('iron', '#ffffff', 1, 30, 40);
    expect(svg).toContain('translate(30,40)');
  });

  it('charge color appears in the output', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = renderCharge(reach, '#abcdef', 1);
      expect(svg, `${reach} should use the provided color`).toContain('#abcdef');
    }
  });

  it('each reach produces a unique shape (different SVG content)', () => {
    const outputs = REACH_DOMAINS.map(reach => renderCharge(reach, '#ffffff', 1));
    const unique = new Set(outputs);
    expect(unique.size).toBe(REACH_DOMAINS.length);
  });
});
