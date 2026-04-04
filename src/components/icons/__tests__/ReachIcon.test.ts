import { describe, it, expect } from 'vitest';
import { generateReachIconSvg } from '../ReachIcon';
import { REACH_DOMAINS } from '../../../types/traits';
import { SPHERE_COLORS, REACH_TO_SPHERE } from '../constants';

describe('generateReachIconSvg', () => {
  it('returns valid SVG for all 8 reaches', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = generateReachIconSvg(reach, 32);
      expect(svg, `${reach} should open with <svg`).toMatch(/^<svg /);
      expect(svg, `${reach} should close with </svg>`).toContain('</svg>');
    }
  });

  it('uses canonical sphere color for each reach', () => {
    for (const reach of REACH_DOMAINS) {
      const color = SPHERE_COLORS[REACH_TO_SPHERE[reach]];
      const svg = generateReachIconSvg(reach, 32);
      expect(svg, `${reach} should contain sphere color ${color}`).toContain(color);
    }
  });

  it('sets correct width and height from size', () => {
    for (const size of [16, 32, 64]) {
      const svg = generateReachIconSvg('iron', size);
      expect(svg).toContain(`width="${size}"`);
      expect(svg).toContain(`height="${size}"`);
    }
  });

  it('uses square viewBox matching size', () => {
    const svg = generateReachIconSvg('gold', 48);
    expect(svg).toContain('viewBox="0 0 48 48"');
  });

  it('contains a rect element (rounded-rectangle background)', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = generateReachIconSvg(reach, 32);
      expect(svg, `${reach} should contain <rect`).toContain('<rect');
    }
  });

  it('rect has rx attribute (rounded corners)', () => {
    const svg = generateReachIconSvg('shadow', 32);
    expect(svg).toMatch(/rx="\d+"/);
  });

  it('contains a charge group element from renderCharge', () => {
    for (const reach of REACH_DOMAINS) {
      const svg = generateReachIconSvg(reach, 32);
      expect(svg, `${reach} should contain a charge <g> group`).toContain('<g transform=');
    }
  });

  it('all 8 reaches produce unique SVG content', () => {
    const outputs = REACH_DOMAINS.map(reach => generateReachIconSvg(reach, 32));
    const unique = new Set(outputs);
    expect(unique.size).toBe(REACH_DOMAINS.length);
  });

  it('background fill is different from the stroke color (darkened tint)', () => {
    for (const reach of REACH_DOMAINS) {
      const color = SPHERE_COLORS[REACH_TO_SPHERE[reach]];
      const svg = generateReachIconSvg(reach, 32);
      const rectMatch = svg.match(/<rect[^>]+>/);
      expect(rectMatch).not.toBeNull();
      const fillMatch = rectMatch![0].match(/fill="([^"]+)"/);
      expect(fillMatch).not.toBeNull();
      expect(fillMatch![1], `${reach} bg should be darker than stroke`).not.toBe(color);
    }
  });
});
