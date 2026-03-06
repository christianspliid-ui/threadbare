import { describe, it, expect } from 'vitest';
import { getPolygonVertices } from '../polygonLayout';

describe('getPolygonVertices', () => {
  it('returns empty array for count 0', () => {
    expect(getPolygonVertices(0, 100, 100, 50)).toEqual([]);
  });

  it('returns center point for count 1', () => {
    const pts = getPolygonVertices(1, 100, 100, 50);
    expect(pts).toHaveLength(1);
    expect(pts[0].x).toBeCloseTo(100);
    expect(pts[0].y).toBeCloseTo(100);
  });

  it('returns 2 points on vertical line for count 2', () => {
    const pts = getPolygonVertices(2, 200, 200, 80);
    expect(pts).toHaveLength(2);
    // Points should be at opposite ends of a vertical diameter
    // (first vertex at top -90°, then 180° rotation puts second at bottom)
    expect(pts[0].x).toBeCloseTo(pts[1].x);
    expect(Math.abs(pts[0].y - pts[1].y)).toBeCloseTo(160); // 2 * radius
  });

  it('returns equilateral triangle for count 3', () => {
    const pts = getPolygonVertices(3, 0, 0, 100);
    expect(pts).toHaveLength(3);
    // All points should be at distance 100 from center
    for (const p of pts) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeCloseTo(100);
    }
    // All inter-point distances should be equal
    const d01 = Math.sqrt((pts[1].x - pts[0].x) ** 2 + (pts[1].y - pts[0].y) ** 2);
    const d12 = Math.sqrt((pts[2].x - pts[1].x) ** 2 + (pts[2].y - pts[1].y) ** 2);
    const d20 = Math.sqrt((pts[0].x - pts[2].x) ** 2 + (pts[0].y - pts[2].y) ** 2);
    expect(d01).toBeCloseTo(d12);
    expect(d12).toBeCloseTo(d20);
  });

  it('returns 6 hexagonal points for count 6', () => {
    const pts = getPolygonVertices(6, 0, 0, 100);
    expect(pts).toHaveLength(6);
    for (const p of pts) {
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      expect(dist).toBeCloseTo(100);
    }
  });

  it('first vertex points upward (top of circle)', () => {
    const pts = getPolygonVertices(4, 0, 0, 100);
    // First vertex at -90° → top of circle (x≈0, y≈-100)
    expect(pts[0].x).toBeCloseTo(0);
    expect(pts[0].y).toBeCloseTo(-100);
  });
});
