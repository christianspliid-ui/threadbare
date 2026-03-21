import { describe, it, expect } from 'vitest';
import { generateWorld } from '../hexGrid';
import type { WorldGenResult } from '../hexGrid';
import { createBalancedCosmology } from '../cosmology';

describe('generateWorld', () => {
  const cosmology = createBalancedCosmology();

  it('returns WorldGenResult with tiles, riverPaths, lakeIds', () => {
    const result: WorldGenResult = generateWorld(cosmology, 10, 8, 42);
    expect(result).toHaveProperty('tiles');
    expect(result).toHaveProperty('riverPaths');
    expect(result).toHaveProperty('lakeIds');
    expect(result).toHaveProperty('cols');
    expect(result).toHaveProperty('rows');
    expect(result).toHaveProperty('seed');
  });

  it('generates the correct number of tiles', () => {
    const result = generateWorld(cosmology, 10, 8, 42);
    expect(result.tiles).toHaveLength(80);
  });

  it('riverPaths is an array', () => {
    const result = generateWorld(cosmology, 10, 8, 42);
    expect(Array.isArray(result.riverPaths)).toBe(true);
  });

  it('lakeIds is an Int16Array with length = cols * rows', () => {
    const result = generateWorld(cosmology, 10, 8, 42);
    expect(result.lakeIds).toBeInstanceOf(Int16Array);
    expect(result.lakeIds.length).toBe(80);
  });

  it('cols and rows match params', () => {
    const result = generateWorld(cosmology, 10, 8, 42);
    expect(result.cols).toBe(10);
    expect(result.rows).toBe(8);
    expect(result.seed).toBe(42);
  });

  it('every tile has valid geographic parameters in [0, 1]', () => {
    const result = generateWorld(cosmology, 5, 5, 42);
    for (const tile of result.tiles) {
      expect(tile.geoParams.elevation).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.elevation).toBeLessThanOrEqual(1);
      expect(tile.geoParams.temperature).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.temperature).toBeLessThanOrEqual(1);
      expect(tile.geoParams.moisture).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.moisture).toBeLessThanOrEqual(1);
    }
  });

  it('every tile has a valid terrain type', () => {
    const result = generateWorld(cosmology, 5, 5, 42);
    const validTerrains = [
      'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
      'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
      'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
      'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
      'swamp', 'marsh', 'moor_bog',
      'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
      'forested_hills',
      'great_home_trees', 'broken_lands', 'oasis',
      'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
      'arctic', 'snow_fields',
    ];
    for (const tile of result.tiles) {
      expect(validTerrains).toContain(tile.terrain);
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateWorld(cosmology, 5, 5, 42);
    const b = generateWorld(cosmology, 5, 5, 42);
    expect(a.tiles).toEqual(b.tiles);
    expect(a.riverPaths).toEqual(b.riverPaths);
  });

  it('contains variety of terrain types in larger grid', () => {
    const result = generateWorld(cosmology, 20, 20, 42);
    const terrainSet = new Set(result.tiles.map(t => t.terrain));
    expect(terrainSet.size).toBeGreaterThan(5);
  });
});
