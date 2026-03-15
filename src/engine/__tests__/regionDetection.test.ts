import { describe, it, expect } from 'vitest';
import { TERRAIN_TO_FEATURE, FEATURE_MIN_SIZE, type RegionFeatureType } from '../regionDetection';

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
