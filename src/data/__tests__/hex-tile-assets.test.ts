import { describe, it, expect } from 'vitest';
import { getHexTileUrl, TERRAIN_TILE_MAP } from '../hex-tile-assets';
import type { TerrainType } from '../../types';

const ALL_TERRAIN_TYPES: TerrainType[] = [
  'ocean', 'coastal_shallows', 'lake', 'river',
  'grassland', 'farmland', 'savanna', 'steppe',
  'deciduous_forest', 'dense_forest', 'taiga', 'jungle',
  'swamp', 'bog',
  'hills', 'mountains', 'plateau', 'badlands',
  'desert', 'tundra', 'glacier', 'volcanic',
];

describe('hex-tile-assets', () => {
  it('has a mapping for every TerrainType', () => {
    for (const terrain of ALL_TERRAIN_TYPES) {
      expect(TERRAIN_TILE_MAP[terrain], `Missing mapping for ${terrain}`).toBeDefined();
    }
  });

  it('getHexTileUrl returns a path under /hex-tiles/', () => {
    const url = getHexTileUrl('dense_forest');
    expect(url).toBe('/hex-tiles/dense-forest.png');
  });

  it('getHexTileUrl handles grassland → open-grassland', () => {
    expect(getHexTileUrl('grassland')).toBe('/hex-tiles/open-grassland.png');
  });

  it('getHexTileUrl handles mountains → mountain', () => {
    expect(getHexTileUrl('mountains')).toBe('/hex-tiles/mountain.png');
  });

  it('all mapped filenames end with .png', () => {
    for (const terrain of ALL_TERRAIN_TYPES) {
      expect(getHexTileUrl(terrain)).toMatch(/\.png$/);
    }
  });
});
