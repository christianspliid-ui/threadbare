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
