import { describe, it, expect } from 'vitest';
import { riverPathToSvgPath } from '../RiverOverlay';
import { hexToPixel } from '../../../lib/hexMath';

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

  it('river path avoids interior hex centers (edge-midpoint routing)', () => {
    const hexSize = 30;
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
    ];
    const path = riverPathToSvgPath(hexes, hexSize, 42);

    // Extract all coordinate pairs from the SVG path
    const coordRegex = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
    const pathPoints: { x: number; y: number }[] = [];
    let match;
    while ((match = coordRegex.exec(path)) !== null) {
      pathPoints.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
    }

    // Interior hex centers (not first/last) should not be hit by the path
    // "Hit" = any path point within a small radius of the center
    const avoidRadius = hexSize * 0.15;
    for (let i = 1; i < hexes.length - 1; i++) {
      const center = hexToPixel(hexes[i], hexSize);
      const tooClose = pathPoints.some(p => {
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        return Math.sqrt(dx * dx + dy * dy) < avoidRadius;
      });
      expect(tooClose).toBe(false);
    }
  });
});
