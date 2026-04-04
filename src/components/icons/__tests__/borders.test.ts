import { describe, it, expect } from 'vitest';
import { renderBorder } from '../heraldry/borders';
import type { ProminenceLevel } from '../constants';

const ALL_LEVELS: ProminenceLevel[] = ['base', 'established', 'dominant'];

describe('renderBorder', () => {
  it('base level has exactly 1 path element', () => {
    const svg = renderBorder('base', '#gold');
    const pathCount = (svg.match(/<path/g) ?? []).length;
    expect(pathCount).toBe(1);
  });

  it('established level has exactly 2 path elements', () => {
    const svg = renderBorder('established', '#silver');
    const pathCount = (svg.match(/<path/g) ?? []).length;
    expect(pathCount).toBe(2);
  });

  it('dominant level has paths and 3 circle ornaments', () => {
    const svg = renderBorder('dominant', '#gold');
    const pathCount = (svg.match(/<path/g) ?? []).length;
    const circleCount = (svg.match(/<circle/g) ?? []).length;
    expect(pathCount).toBeGreaterThanOrEqual(2);
    expect(circleCount).toBe(3);
  });

  it('dominant ornament circles are at (18,14), (102,14), (60,140)', () => {
    const svg = renderBorder('dominant', '#ffffff');
    expect(svg).toContain('cx="18"');
    expect(svg).toContain('cy="14"');
    expect(svg).toContain('cx="102"');
    expect(svg).toContain('cx="60"');
    expect(svg).toContain('cy="140"');
  });

  it('all levels include the border color', () => {
    for (const level of ALL_LEVELS) {
      const svg = renderBorder(level, '#abcdef');
      expect(svg, `${level} should use the provided color`).toContain('#abcdef');
    }
  });

  it('established second path has dashed stroke', () => {
    const svg = renderBorder('established', '#ffffff');
    expect(svg).toContain('stroke-dasharray');
  });

  it('base border uses stroke-width 2.5', () => {
    const svg = renderBorder('base', '#ffffff');
    expect(svg).toContain('2.5');
  });
});
