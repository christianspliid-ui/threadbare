import { describe, it, expect } from 'vitest';
import {
  offsetToCube,
  cubeToOffset,
  hexNeighbors,
  hexDistance,
  hexToPixel,
  generateHexGrid,
} from '../hexMath';

describe('offsetToCube / cubeToOffset', () => {
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
});

describe('hexNeighbors', () => {
  it('returns 6 neighbors', () => {
    const neighbors = hexNeighbors({ col: 2, row: 2 });
    expect(neighbors).toHaveLength(6);
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

describe('hexToPixel', () => {
  it('returns pixel coordinates for origin hex', () => {
    const px = hexToPixel({ col: 0, row: 0 }, 30);
    expect(px.x).toBeCloseTo(0);
    expect(px.y).toBeCloseTo(0);
  });

  it('offsets columns correctly', () => {
    const px0 = hexToPixel({ col: 0, row: 0 }, 30);
    const px1 = hexToPixel({ col: 1, row: 0 }, 30);
    expect(px1.x).toBeGreaterThan(px0.x);
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
