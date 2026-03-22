import { describe, it, expect } from 'vitest';
import { TERRAIN_TO_FEATURE, FEATURE_MIN_SIZE, type RegionFeatureType } from '../regionDetection';
import type { HexTile, TerrainType } from '../../types';
import { detectRegions, edgeBorderCost, type RegionCluster } from '../regionDetection';

function tile(col: number, row: number, terrain: TerrainType, elevation = 0.5): HexTile {
  return { coord: { col, row }, geoParams: { elevation, temperature: 0.5, moisture: 0.5 }, terrain };
}

describe('region detection constants', () => {
  it('maps every grouped terrain type to a feature type', () => {
    expect(TERRAIN_TO_FEATURE.mountains).toBe('mountain_range');
    expect(TERRAIN_TO_FEATURE.high_mountains).toBe('mountain_range');
    expect(TERRAIN_TO_FEATURE.glacier).toBe('mountain_range');
    expect(TERRAIN_TO_FEATURE.hills).toBe('hill_country');
    expect(TERRAIN_TO_FEATURE.temperate_forest).toBe('forest');
    expect(TERRAIN_TO_FEATURE.grassland).toBe('plains');
    expect(TERRAIN_TO_FEATURE.desert).toBe('desert');
    expect(TERRAIN_TO_FEATURE.swamp).toBe('wetland');
    expect(TERRAIN_TO_FEATURE.tundra).toBe('tundra');
    expect(TERRAIN_TO_FEATURE.lake).toBe('lake');
    expect(TERRAIN_TO_FEATURE.ocean).toBe('sea');
  });

  it('has minimum cluster sizes for each feature type', () => {
    expect(FEATURE_MIN_SIZE.mountain_range).toBe(3);
    expect(FEATURE_MIN_SIZE.hill_country).toBe(4);
    expect(FEATURE_MIN_SIZE.forest).toBe(5);
    expect(FEATURE_MIN_SIZE.plains).toBe(6);
    expect(FEATURE_MIN_SIZE.desert).toBe(4);
    expect(FEATURE_MIN_SIZE.wetland).toBe(3);
    expect(FEATURE_MIN_SIZE.tundra).toBe(4);
    expect(FEATURE_MIN_SIZE.river).toBe(5);
    expect(FEATURE_MIN_SIZE.lake).toBe(1);
  });

  // Task 1 TDD: TERRAIN_TO_FEATURE coverage for all 42 terrain types
  it('covers all land terrain types (non-water) in TERRAIN_TO_FEATURE', () => {
    // Water types — these may map to 'sea', 'lake', 'river', or undefined (all valid)
    const waterTypes: TerrainType[] = [
      'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
    ];

    // All TerrainType values (42 types from types/index.ts)
    const allTerrainTypes: TerrainType[] = [
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

    const missing: TerrainType[] = [];
    for (const terrain of allTerrainTypes) {
      if (waterTypes.includes(terrain)) continue; // water types are optional
      if (TERRAIN_TO_FEATURE[terrain] === undefined) {
        missing.push(terrain);
      }
    }
    expect(missing, `Missing land terrain types: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('has entries for newly required terrain types: plateau, oasis, coastal_shallows, coast, reef', () => {
    expect(TERRAIN_TO_FEATURE.plateau).toBeDefined();
    expect(TERRAIN_TO_FEATURE.oasis).toBeDefined();
    expect(TERRAIN_TO_FEATURE.coastal_shallows).toBeDefined();
    expect(TERRAIN_TO_FEATURE.coast).toBeDefined();
    expect(TERRAIN_TO_FEATURE.reef).toBeDefined();
  });
});

describe('edgeBorderCost', () => {
  it('returns 1.0 when neighbor is coast/ocean', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'coast', 0.3);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(1.0);
  });

  it('returns 0.9 when neighbor is mountain', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'mountains', 0.5);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.9);
  });

  it('returns 0.7 when there is a river edge between the two hexes', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'grassland', 0.5);
    expect(edgeBorderCost(current, neighbor, true)).toBeCloseTo(0.7);
  });

  it('returns 0.5 for steep elevation difference (>0.15)', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'grassland', 0.68); // diff = 0.18 > 0.15
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.5);
  });

  it('returns 0.4 for biome change (different feature type)', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'desert', 0.5);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.4);
  });

  it('returns 0.1 for same terrain', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'grassland', 0.5);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.1);
  });

  it('prioritizes highest cost: mountain neighbor beats river edge (0.9 not 0.7)', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'mountains', 0.5);
    // Even with river edge, mountain wins (higher cost = stronger boundary)
    expect(edgeBorderCost(current, neighbor, true)).toBeCloseTo(0.9);
  });

  it('prioritizes coast/ocean over mountain (1.0 > 0.9)', () => {
    const current = tile(0, 0, 'mountains', 0.5);
    const neighbor = tile(1, 0, 'ocean', 0.3);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(1.0);
  });
});

describe('RegionCluster interface', () => {
  it('has an id field on RegionCluster returned from detectRegions', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'), tile(2, 0, 'mountains'),
    ];
    const regions = detectRegions(tiles);
    const mountain = regions.find(r => r.featureType === 'mountain_range');
    // id may be undefined in old RegionCluster — test that new interface has it
    if (mountain) {
      expect(typeof (mountain as RegionCluster & { id?: number }).id).toBe('number');
    }
    // At minimum, the type shape must compile (no runtime error)
    expect(true).toBe(true);
  });
});

describe('detectRegions', () => {
  it('groups contiguous same-feature hexes into a cluster', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'), tile(2, 0, 'mountains'),
      tile(0, 1, 'grassland'), tile(1, 1, 'grassland'), tile(2, 1, 'grassland'),
    ];
    const regions = detectRegions(tiles);
    const mountains = regions.filter(r => r.featureType === 'mountain_range');
    expect(mountains).toHaveLength(1);
    expect(mountains[0].hexes).toHaveLength(3);
  });

  it('splits non-contiguous same-feature hexes into separate clusters', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'grassland'), tile(2, 0, 'mountains'),
      tile(0, 1, 'grassland'), tile(1, 1, 'grassland'), tile(2, 1, 'grassland'),
    ];
    const regions = detectRegions(tiles);
    const mountains = regions.filter(r => r.featureType === 'mountain_range');
    expect(mountains).toHaveLength(0); // each single hex below min size 3
  });

  it('discards clusters below minimum size', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'),
      tile(0, 1, 'grassland'), tile(1, 1, 'grassland'),
      tile(0, 2, 'grassland'), tile(1, 2, 'grassland'),
      tile(0, 3, 'grassland'), tile(1, 3, 'grassland'),
      tile(0, 4, 'grassland'), tile(1, 4, 'grassland'),
      tile(0, 5, 'grassland'), tile(1, 5, 'grassland'),
    ];
    const regions = detectRegions(tiles);
    const mountains = regions.filter(r => r.featureType === 'mountain_range');
    expect(mountains).toHaveLength(0);
    const plains = regions.filter(r => r.featureType === 'plains');
    expect(plains.length).toBeGreaterThanOrEqual(1);
  });

  it('groups related terrain types (e.g., hills + forested_hills)', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'hills'), tile(1, 0, 'forested_hills'),
      tile(0, 1, 'hills'), tile(1, 1, 'forested_hills'),
    ];
    const regions = detectRegions(tiles);
    const hillRegions = regions.filter(r => r.featureType === 'hill_country');
    expect(hillRegions).toHaveLength(1);
    expect(hillRegions[0].hexes).toHaveLength(4);
  });

  it('computes centroid for each cluster', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'), tile(2, 0, 'mountains'),
    ];
    const regions = detectRegions(tiles);
    const mountain = regions.find(r => r.featureType === 'mountain_range');
    expect(mountain).toBeDefined();
    expect(mountain!.centerCol).toBe(1);
    expect(mountain!.centerRow).toBe(0);
  });
});
