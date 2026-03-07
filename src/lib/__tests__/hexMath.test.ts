import { describe, it, expect } from 'vitest';
import {
  offsetToCube,
  cubeToOffset,
  hexNeighbors,
  hexDistance,
  hexToPixel,
  generateHexGrid,
  hexPolygonPoints,
} from '../hexMath';

describe('offsetToCube / cubeToOffset (flat-top odd-q)', () => {
  it('round-trips offset → cube → offset', () => {
    const offset = { col: 3, row: 5 };
    const cube = offsetToCube(offset);
    const back = cubeToOffset(cube);
    expect(back).toEqual(offset);
  });

  it('converts origin correctly', () => {
    const cube = offsetToCube({ col: 0, row: 0 });
    expect(cube).toEqual({ q: 0, r: 0, s: 0 });
  });

  it('round-trips many coordinates', () => {
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        const offset = { col, row };
        const cube = offsetToCube(offset);
        const back = cubeToOffset(cube);
        expect(back).toEqual(offset);
        // Cube constraint: q + r + s = 0
        expect(cube.q + cube.r + cube.s).toBeCloseTo(0);
      }
    }
  });

  it('odd-q: col maps directly to q', () => {
    // In flat-top odd-q, q === col
    expect(offsetToCube({ col: 5, row: 3 }).q).toBe(5);
    expect(offsetToCube({ col: 0, row: 7 }).q).toBe(0);
  });
});

describe('hexNeighbors (flat-top odd-q)', () => {
  it('returns 6 neighbors', () => {
    const neighbors = hexNeighbors({ col: 2, row: 2 });
    expect(neighbors).toHaveLength(6);
  });

  it('all neighbors are distance 1', () => {
    const center = { col: 3, row: 3 };
    const neighbors = hexNeighbors(center);
    for (const n of neighbors) {
      expect(hexDistance(center, n)).toBe(1);
    }
  });

  it('even col neighbors differ from odd col neighbors', () => {
    const evenNeighbors = hexNeighbors({ col: 2, row: 2 });
    const oddNeighbors = hexNeighbors({ col: 3, row: 2 });
    // Should not be identical sets (different offset patterns)
    const evenSet = new Set(evenNeighbors.map(n => `${n.col},${n.row}`));
    const oddSet = new Set(oddNeighbors.map(n => `${n.col},${n.row}`));
    expect(evenSet).not.toEqual(oddSet);
  });
});

describe('hexDistance', () => {
  it('returns 0 for same hex', () => {
    expect(hexDistance({ col: 3, row: 3 }, { col: 3, row: 3 })).toBe(0);
  });

  it('returns 1 for adjacent hexes', () => {
    const neighbors = hexNeighbors({ col: 3, row: 3 });
    for (const n of neighbors) {
      expect(hexDistance({ col: 3, row: 3 }, n)).toBe(1);
    }
  });
});

describe('hexToPixel (flat-top)', () => {
  it('returns pixel coordinates for origin hex', () => {
    const px = hexToPixel({ col: 0, row: 0 }, 30);
    expect(px.x).toBeCloseTo(0);
    expect(px.y).toBeCloseTo(0);
  });

  it('columns spaced at 1.5 * size horizontally', () => {
    const px0 = hexToPixel({ col: 0, row: 0 }, 30);
    const px1 = hexToPixel({ col: 1, row: 0 }, 30);
    expect(px1.x - px0.x).toBeCloseTo(45); // 1.5 * 30
  });

  it('rows spaced at √3 * size vertically', () => {
    const px0 = hexToPixel({ col: 0, row: 0 }, 30);
    const px1 = hexToPixel({ col: 0, row: 1 }, 30);
    expect(px1.y - px0.y).toBeCloseTo(Math.sqrt(3) * 30);
  });

  it('odd columns shift down by half vertical spacing', () => {
    const even = hexToPixel({ col: 0, row: 0 }, 30);
    const odd = hexToPixel({ col: 1, row: 0 }, 30);
    expect(odd.y - even.y).toBeCloseTo(Math.sqrt(3) * 30 / 2);
  });
});

describe('generateHexGrid', () => {
  it('generates correct number of hexes', () => {
    const grid = generateHexGrid(5, 4);
    expect(grid).toHaveLength(20);
  });

  it('first hex is (0,0)', () => {
    const grid = generateHexGrid(3, 3);
    expect(grid[0]).toEqual({ col: 0, row: 0 });
  });
});

describe('hexPolygonPoints (flat-top)', () => {
  it('first vertex is at 0° (rightmost point)', () => {
    const points = hexPolygonPoints(0, 0, 30);
    const vertices = points.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    // First vertex at 0°: (size, 0) = (30, 0)
    expect(vertices[0].x).toBeCloseTo(30);
    expect(vertices[0].y).toBeCloseTo(0);
  });

  it('has flat edges on top and bottom', () => {
    const points = hexPolygonPoints(0, 0, 30);
    const vertices = points.split(' ').map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
    // Top edge: vertices at 60° and 120° should share the same y
    // vertex[1] at 60°, vertex[2] at 120°
    expect(vertices[1].y).toBeCloseTo(vertices[2].y);
    // Bottom edge: vertices at 240° and 300° share same y
    expect(vertices[4].y).toBeCloseTo(vertices[5].y);
  });

  it('produces 6 vertices', () => {
    const points = hexPolygonPoints(100, 100, 30);
    const vertices = points.split(' ');
    expect(vertices).toHaveLength(6);
  });
});
