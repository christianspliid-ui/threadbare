import { describe, it, expect } from 'vitest';
import { generateWorld } from '../hexGrid';
import { createBalancedCosmology } from '../cosmology';
import { FORCE_NAMES } from '../../types';

describe('generateWorld', () => {
  const cosmology = createBalancedCosmology();

  it('generates the correct number of tiles', () => {
    const tiles = generateWorld(cosmology, 10, 8, 42);
    expect(tiles).toHaveLength(80);
  });

  it('every tile has valid forces summing to ~1.0', () => {
    const tiles = generateWorld(cosmology, 5, 5, 42);
    for (const tile of tiles) {
      const sum = FORCE_NAMES.reduce((s, f) => s + tile.forces[f], 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('every tile has a terrain type', () => {
    const tiles = generateWorld(cosmology, 5, 5, 42);
    for (const tile of tiles) {
      expect(tile.terrain).toBeTruthy();
    }
  });

  it('is deterministic with same seed', () => {
    const a = generateWorld(cosmology, 5, 5, 42);
    const b = generateWorld(cosmology, 5, 5, 42);
    expect(a).toEqual(b);
  });
});
