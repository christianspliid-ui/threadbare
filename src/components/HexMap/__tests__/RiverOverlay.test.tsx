import { describe, it, expect } from 'vitest';
import { riverPathToSvgPath } from '../RiverOverlay';

describe('riverPathToSvgPath', () => {
  it('returns empty string for path with fewer than 2 hexes', () => {
    expect(riverPathToSvgPath([], 30)).toBe('');
    expect(riverPathToSvgPath([{ col: 0, row: 0 }], 30)).toBe('');
  });

  it('returns a valid SVG path for 2-hex path', () => {
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ];
    const path = riverPathToSvgPath(hexes, 30, 42);
    expect(path).toContain('M');
    // After meander processing, 2-hex paths produce Bezier curves
    expect(path.length).toBeGreaterThan(0);
  });

  it('returns SVG cubic Bezier for 3+ hex path', () => {
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ];
    const path = riverPathToSvgPath(hexes, 30, 42);
    expect(path).toContain('M');
    expect(path).toContain('C');
    expect(path.length).toBeGreaterThan(0);
  });

  it('is deterministic — same seed produces same path', () => {
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
    ];
    const a = riverPathToSvgPath(hexes, 30, 42);
    const b = riverPathToSvgPath(hexes, 30, 42);
    expect(a).toBe(b);
  });

  it('different seeds produce different paths', () => {
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
    ];
    const a = riverPathToSvgPath(hexes, 30, 42);
    const b = riverPathToSvgPath(hexes, 30, 99);
    expect(a).not.toBe(b);
  });

  it('meandering path has more Bezier segments than hex count', () => {
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
    ];
    const path = riverPathToSvgPath(hexes, 30, 42);
    // With subdivisions + smoothing, we expect many more Bezier segments
    // than the original 3 (one per hex pair)
    const bezierCount = (path.match(/C/g) || []).length;
    expect(bezierCount).toBeGreaterThan(3);
  });
});
