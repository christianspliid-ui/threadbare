import { describe, it, expect } from 'vitest';
import { TERRAIN_TO_FEATURE, FEATURE_MIN_SIZE, type RegionFeatureType } from '../regionDetection';
import type { HexTile, TerrainType } from '../../types';
import { detectRegions, type RegionCluster } from '../regionDetection';

function tile(col: number, row: number, terrain: TerrainType): HexTile {
  return { coord: { col, row }, geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 }, terrain };
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
