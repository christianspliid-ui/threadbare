import { describe, it, expect } from 'vitest';
import { getHexTileUrl, TERRAIN_TILE_MAP, getMagicOverlayUrl, MAGIC_OVERLAY_MAP } from '../hex-tile-assets';
import type { TerrainType } from '../../types';

const ALL_TERRAIN_TYPES: TerrainType[] = [
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

describe('MAGIC_OVERLAY_MAP', () => {
  it('has entries for all 8 creation spheres', () => {
    const creationSpheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
    for (const sphere of creationSpheres) {
      expect(MAGIC_OVERLAY_MAP[sphere as keyof typeof MAGIC_OVERLAY_MAP]).toBeDefined();
    }
  });

  it('has entries for all 4 foundation spheres', () => {
    const foundationSpheres = ['chaos', 'order', 'light', 'darkness'];
    for (const sphere of foundationSpheres) {
      expect(MAGIC_OVERLAY_MAP[sphere as keyof typeof MAGIC_OVERLAY_MAP]).toBeDefined();
    }
  });

  it('has exactly 12 entries', () => {
    expect(Object.keys(MAGIC_OVERLAY_MAP)).toHaveLength(12);
  });

  it('all filenames follow magic-{sphere}.png pattern', () => {
    for (const [sphere, filename] of Object.entries(MAGIC_OVERLAY_MAP)) {
      expect(filename).toBe(`magic-${sphere}.png`);
    }
  });
});

describe('getMagicOverlayUrl', () => {
  it('returns correct URL for a creation sphere', () => {
    expect(getMagicOverlayUrl('force')).toBe('/hex-tiles/magic-force.png');
  });

  it('returns correct URL for a foundation sphere', () => {
    expect(getMagicOverlayUrl('order')).toBe('/hex-tiles/magic-order.png');
  });
});
