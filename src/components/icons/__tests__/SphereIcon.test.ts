import { describe, it, expect } from 'vitest';
import { generateSphereIconSvg } from '../SphereIcon';
import { SPHERE_NAMES } from '../../../types/index';
import { SPHERE_COLORS } from '../constants';

describe('generateSphereIconSvg', () => {
  it('returns valid SVG for all 12 spheres', () => {
    for (const sphere of SPHERE_NAMES) {
      const svg = generateSphereIconSvg(sphere, 32);
      expect(svg, `${sphere} should open with <svg`).toMatch(/^<svg /);
      expect(svg, `${sphere} should close with </svg>`).toContain('</svg>');
    }
  });

  it('uses canonical sphere color in the output', () => {
    for (const sphere of SPHERE_NAMES) {
      const color = SPHERE_COLORS[sphere];
      const svg = generateSphereIconSvg(sphere, 32);
      expect(svg, `${sphere} should contain its canonical color ${color}`).toContain(color);
    }
  });

  it('sets correct width and height from size', () => {
    for (const size of [16, 32, 64]) {
      const svg = generateSphereIconSvg('force', size);
      expect(svg).toContain(`width="${size}"`);
      expect(svg).toContain(`height="${size}"`);
    }
  });

  it('uses square viewBox matching the size', () => {
    const svg = generateSphereIconSvg('mind', 48);
    expect(svg).toContain('viewBox="0 0 48 48"');
  });

  it('contains outer circle element', () => {
    const svg = generateSphereIconSvg('order', 32);
    expect(svg).toContain('<circle');
    // Stroke should be the canonical color
    expect(svg).toContain(`stroke="${SPHERE_COLORS['order']}"`);
  });

  it('all 12 spheres produce unique SVG content', () => {
    const outputs = SPHERE_NAMES.map(sphere => generateSphereIconSvg(sphere, 32));
    const unique = new Set(outputs);
    expect(unique.size).toBe(SPHERE_NAMES.length);
  });

  it('outer circle has 1.5 stroke-width', () => {
    const svg = generateSphereIconSvg('time', 32);
    expect(svg).toContain('stroke-width="1.5"');
  });

  it('contains a dark background fill on the outer circle', () => {
    // background is a darkened tint — just verify it has a fill attribute that is NOT the primary color
    const sphere = 'energy';
    const color = SPHERE_COLORS[sphere];
    const svg = generateSphereIconSvg(sphere, 32);
    // The first fill attribute on the <circle> should be the dark bg, not the primary
    const firstCircle = svg.match(/<circle[^>]+>/);
    expect(firstCircle).not.toBeNull();
    const fillMatch = firstCircle![0].match(/fill="([^"]+)"/);
    expect(fillMatch).not.toBeNull();
    expect(fillMatch![1]).not.toBe(color);
  });
});
