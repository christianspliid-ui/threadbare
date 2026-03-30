import { describe, it, expect } from 'vitest';
import { TERRAIN_MODIFIERS, getTerrainModifiers } from '../terrain-modifiers';
import type { TerrainType } from '../../types';

describe('terrain-modifiers', () => {
  it('exports TERRAIN_MODIFIERS record', () => {
    expect(TERRAIN_MODIFIERS).toBeDefined();
    expect(typeof TERRAIN_MODIFIERS).toBe('object');
  });

  it('dense_forest reduces los_range by 1', () => {
    expect(TERRAIN_MODIFIERS.dense_forest?.los_range).toBe(-1);
  });

  it('mountains increase los_range by 2', () => {
    expect(TERRAIN_MODIFIERS.mountains?.los_range).toBe(2);
  });

  it('grassland has no los modifiers', () => {
    expect(TERRAIN_MODIFIERS.grassland).toBeUndefined();
  });

  it('getTerrainModifiers returns modifiers for known terrain', () => {
    const mods = getTerrainModifiers('dense_forest');
    expect(mods).toEqual({ los_range: -1 });
  });

  it('getTerrainModifiers returns empty object for unknown terrain', () => {
    const mods = getTerrainModifiers('grassland');
    expect(mods).toEqual({});
  });

  it('all terrain keys are valid TerrainType values', () => {
    const validTerrains: TerrainType[] = [
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
    for (const key of Object.keys(TERRAIN_MODIFIERS)) {
      expect(validTerrains).toContain(key);
    }
  });
});
