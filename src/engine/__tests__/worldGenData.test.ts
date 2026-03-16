import { describe, it, expect } from 'vitest';
import { createWorldGenData, toHexTiles } from '../worldGenData';

describe('createWorldGenData', () => {
  it('creates data with correct dimensions', () => {
    const data = createWorldGenData(10, 8, 42);
    expect(data.cols).toBe(10);
    expect(data.rows).toBe(8);
    expect(data.seed).toBe(42);
    expect(data.elevation.length).toBe(80);
    expect(data.temperature.length).toBe(80);
    expect(data.moisture.length).toBe(80);
    expect(data.isOcean.length).toBe(80);
    expect(data.terrain.length).toBe(80);
    expect(data.hasRiver.length).toBe(80);
    expect(data.lakeIds.length).toBe(80);
  });

  it('populates elevation, temperature, moisture in [0, 1]', () => {
    const data = createWorldGenData(5, 5, 42);
    for (let i = 0; i < 25; i++) {
      expect(data.elevation[i]).toBeGreaterThanOrEqual(0);
      expect(data.elevation[i]).toBeLessThanOrEqual(1);
      expect(data.temperature[i]).toBeGreaterThanOrEqual(0);
      expect(data.temperature[i]).toBeLessThanOrEqual(1);
      expect(data.moisture[i]).toBeGreaterThanOrEqual(0);
      expect(data.moisture[i]).toBeLessThanOrEqual(1);
    }
  });

  it('classifies all terrain types as valid strings', () => {
    const data = createWorldGenData(10, 8, 42);
    for (let i = 0; i < data.terrain.length; i++) {
      expect(typeof data.terrain[i]).toBe('string');
      expect(data.terrain[i].length).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(5, 5, 42);
    const b = createWorldGenData(5, 5, 42);
    expect(Array.from(a.elevation)).toEqual(Array.from(b.elevation));
    expect(a.terrain).toEqual(b.terrain);
  });
});

describe('toHexTiles', () => {
  it('converts WorldGenData to HexTile array', () => {
    const data = createWorldGenData(5, 5, 42);
    const tiles = toHexTiles(data);
    expect(tiles).toHaveLength(25);
    for (const tile of tiles) {
      expect(tile.coord).toBeDefined();
      expect(tile.geoParams).toBeDefined();
      expect(tile.terrain).toBeDefined();
    }
  });

  it('preserves hasRiver flag', () => {
    const data = createWorldGenData(5, 5, 42);
    data.hasRiver[0] = 1;
    const tiles = toHexTiles(data);
    expect(tiles[0].hasRiver).toBe(true);
    expect(tiles[1].hasRiver).toBeUndefined();
  });

  it('produces correct col/row coordinates', () => {
    const data = createWorldGenData(3, 2, 42);
    const tiles = toHexTiles(data);
    expect(tiles).toHaveLength(6);
    // Row-major order: (0,0),(1,0),(2,0),(0,1),(1,1),(2,1)
    expect(tiles[0].coord).toEqual({ col: 0, row: 0 });
    expect(tiles[2].coord).toEqual({ col: 2, row: 0 });
    expect(tiles[3].coord).toEqual({ col: 0, row: 1 });
    expect(tiles[5].coord).toEqual({ col: 2, row: 1 });
  });
});
