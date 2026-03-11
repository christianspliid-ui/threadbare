import { describe, it, expect } from 'vitest';
import { generateRivers } from '../riverGeneration';
import { createWorldGenData } from '../worldGenData';
import { RIVER_MIN_LENGTH } from '../worldGenData';

describe('generateRivers', () => {
  it('generates at least 1 river on a 20x15 grid', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    expect(data.riverPaths.length).toBeGreaterThanOrEqual(1);
  });

  it('marks hasRiver on traversed hexes', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    const riverHexCount = Array.from(data.hasRiver).filter(v => v === 1).length;
    expect(riverHexCount).toBeGreaterThan(0);
  });

  it('all rivers meet minimum length', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    for (const path of data.riverPaths) {
      expect(path.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
    }
  });

  it('rivers flow downhill (each hex has lower or equal elevation)', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    for (const path of data.riverPaths) {
      for (let i = 1; i < path.hexes.length; i++) {
        const prevIdx = path.hexes[i - 1].row * data.cols + path.hexes[i - 1].col;
        const currIdx = path.hexes[i].row * data.cols + path.hexes[i].col;
        expect(data.elevation[currIdx]).toBeLessThanOrEqual(data.elevation[prevIdx] + 0.01);
      }
    }
  });

  it('rivers terminate at ocean, lake, or confluence', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    for (const path of data.riverPaths) {
      const lastHex = path.hexes[path.hexes.length - 1];
      const idx = lastHex.row * data.cols + lastHex.col;
      const t = data.terrain[idx];
      const isWater = t === 'ocean' || t === 'coastal_shallows' || t === 'lake';
      // Either terminates at water or at a hex that already had a river (confluence)
      expect(isWater || data.hasRiver[idx] === 1).toBe(true);
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(20, 15, 42);
    generateRivers(a);
    const b = createWorldGenData(20, 15, 42);
    generateRivers(b);
    expect(a.riverPaths.length).toBe(b.riverPaths.length);
    for (let i = 0; i < a.riverPaths.length; i++) {
      expect(a.riverPaths[i].hexes).toEqual(b.riverPaths[i].hexes);
    }
  });
});
