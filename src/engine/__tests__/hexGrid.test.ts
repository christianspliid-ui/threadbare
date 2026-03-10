import { describe, it, expect } from 'vitest';
import { generateWorld } from '../hexGrid';
import { createBalancedCosmology } from '../cosmology';

describe('generateWorld', () => {
  const cosmology = createBalancedCosmology();

  it('generates the correct number of tiles', () => {
    const tiles = generateWorld(cosmology, 10, 8, 42);
    expect(tiles).toHaveLength(80);
  });

  it('every tile has valid geographic parameters in [0, 1]', () => {
    const tiles = generateWorld(cosmology, 5, 5, 42);
    for (const tile of tiles) {
      expect(tile.geoParams.elevation).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.elevation).toBeLessThanOrEqual(1);
      expect(tile.geoParams.temperature).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.temperature).toBeLessThanOrEqual(1);
      expect(tile.geoParams.moisture).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.moisture).toBeLessThanOrEqual(1);
    }
  });

  it('every tile has a valid terrain type', () => {
    const tiles = generateWorld(cosmology, 5, 5, 42);
    const validTerrains = [
      'ocean', 'coastal_shallows', 'lake', 'river',
      'grassland', 'farmland', 'savanna', 'steppe',
      'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
      'swamp', 'marsh',
      'hills', 'mountains', 'plateau', 'badlands',
      'desert', 'tundra', 'glacier', 'volcano',
    ];
    for (const tile of tiles) {
      expect(validTerrains).toContain(tile.terrain);
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateWorld(cosmology, 5, 5, 42);
    const b = generateWorld(cosmology, 5, 5, 42);
    expect(a).toEqual(b);
  });

  it('contains variety of terrain types in larger grid', () => {
    const tiles = generateWorld(cosmology, 20, 20, 42);
    const terrainSet = new Set(tiles.map(t => t.terrain));
    expect(terrainSet.size).toBeGreaterThan(5);
  });
});
