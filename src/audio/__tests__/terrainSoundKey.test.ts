import { describe, it, expect } from 'vitest';
import { terrainToSoundKey } from '../terrainSoundKey';
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

const VALID_SOUND_KEYS = new Set([
  'water', 'grassland', 'forest', 'swamp', 'mountains',
  'desert', 'tundra', 'volcanic', 'wasteland', 'plateau',
]);

describe('terrainToSoundKey', () => {
  it('maps every TerrainType to a valid sound key', () => {
    for (const terrain of ALL_TERRAIN_TYPES) {
      const key = terrainToSoundKey(terrain);
      expect(VALID_SOUND_KEYS.has(key), `${terrain} → "${key}" is not a valid sound key`).toBe(true);
    }
  });

  it('maps water terrains to water', () => {
    expect(terrainToSoundKey('ocean')).toBe('water');
    expect(terrainToSoundKey('lake')).toBe('water');
    expect(terrainToSoundKey('reef')).toBe('water');
  });

  it('maps forest terrains to forest', () => {
    expect(terrainToSoundKey('jungle')).toBe('forest');
    expect(terrainToSoundKey('boreal_forest')).toBe('forest');
    expect(terrainToSoundKey('great_home_trees')).toBe('forest');
  });

  it('maps desert terrains to desert', () => {
    expect(terrainToSoundKey('sand_dunes')).toBe('desert');
    expect(terrainToSoundKey('badlands')).toBe('desert');
  });

  it('maps cold terrains to tundra', () => {
    expect(terrainToSoundKey('arctic')).toBe('tundra');
    expect(terrainToSoundKey('glacier')).toBe('tundra');
  });

  it('maps volcano to volcanic', () => {
    expect(terrainToSoundKey('volcano')).toBe('volcanic');
  });

  it('falls back to grassland with a warning for unknown terrain', () => {
    const warned: string[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warned.push(String(args[0]));
    const result = terrainToSoundKey('unknown_terrain' as TerrainType);
    console.warn = orig;
    expect(result).toBe('grassland');
    expect(warned.length).toBeGreaterThan(0);
    expect(warned[0]).toContain('unknown_terrain');
  });
});
