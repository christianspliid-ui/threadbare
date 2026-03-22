/**
 * Tests for pass10-fantasyOverlay — sphere-driven biome transformation
 *
 * NFP #3: All tests verify determinism with seeded PRNG.
 * NFP #4: Null/balanced cosmology tests verify fail-soft behaviour.
 */
import { describe, it, expect } from 'vitest';
import { runFantasyOverlayPass, FANTASY_OVERLAY_CONSTANTS } from '../passes/pass10-fantasyOverlay';
import type { CosmologyProfile, TerrainType } from '../../../types';

// ─── Test helpers ─────────────────────────────────────────────────

/** Build a flat terrain array with all hexes set to the given type */
function makeTerrainGrid(cols: number, rows: number, fill: TerrainType): TerrainType[] {
  return new Array(cols * rows).fill(fill);
}

const BALANCED: CosmologyProfile = {
  force: 0.5, matter: 0.5, energy: 0.5, life: 0.5,
  mind: 0.5, spirit: 0.5, time: 0.5, entropy: 0.5,
};

const HIGH_ENTROPY: CosmologyProfile = {
  ...BALANCED,
  entropy: 0.9, // well above SPHERE_THRESHOLD (0.65)
};

const HIGH_LIFE: CosmologyProfile = {
  ...BALANCED,
  life: 0.9, // well above SPHERE_THRESHOLD (0.65)
};

// Use a large enough grid so statistical probability guarantees at least one
// hex transforms.  At OVERLAY_CHANCE=0.12, 30×30=900 hexes should have ~108
// eligible hexes on average, far more than needed to detect any change.
const COLS = 30;
const ROWS = 30;
const SEED = 42;

// ─── Tests ────────────────────────────────────────────────────────

describe('runFantasyOverlayPass', () => {
  it('exports FANTASY_OVERLAY_CONSTANTS with expected defaults', () => {
    expect(FANTASY_OVERLAY_CONSTANTS.SPHERE_THRESHOLD).toBe(0.65);
    expect(FANTASY_OVERLAY_CONSTANTS.OVERLAY_CHANCE).toBeGreaterThan(0);
    expect(FANTASY_OVERLAY_CONSTANTS.OVERLAY_CHANCE).toBeLessThan(1);
    expect(FANTASY_OVERLAY_CONSTANTS.NOISE_SCALE).toBeGreaterThan(0);
  });

  it('transforms temperate_forest to dead_forest when entropy is high', () => {
    // Entropy > SPHERE_THRESHOLD triggers dead_forest conversion from temperate_forest
    const terrain = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    runFantasyOverlayPass(terrain, COLS, ROWS, SEED, HIGH_ENTROPY);
    const hasDeadForest = terrain.some(t => t === 'dead_forest');
    expect(hasDeadForest).toBe(true);
  });

  it('transforms light_forest to tropical_forest when life is high', () => {
    // Life > SPHERE_THRESHOLD triggers tropical_forest conversion from light_forest
    const terrain = makeTerrainGrid(COLS, ROWS, 'light_forest');
    runFantasyOverlayPass(terrain, COLS, ROWS, SEED, HIGH_LIFE);
    const hasTropicalForest = terrain.some(t => t === 'tropical_forest');
    expect(hasTropicalForest).toBe(true);
  });

  it('is a no-op when all spheres are balanced (below threshold)', () => {
    // Balanced cosmology (all 0.5) is below SPHERE_THRESHOLD (0.65) — no transforms
    const terrain = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    const before = [...terrain];
    runFantasyOverlayPass(terrain, COLS, ROWS, SEED, BALANCED);
    expect(terrain).toEqual(before);
  });

  it('is a no-op when cosmology is null (fail-soft NFP #4)', () => {
    const terrain = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    const before = [...terrain];
    runFantasyOverlayPass(terrain, COLS, ROWS, SEED, null);
    expect(terrain).toEqual(before);
  });

  it('is a no-op when cosmology is undefined (fail-soft NFP #4)', () => {
    const terrain = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    const before = [...terrain];
    runFantasyOverlayPass(terrain, COLS, ROWS, SEED, undefined);
    expect(terrain).toEqual(before);
  });

  it('produces the same output with the same seed (determinism NFP #3)', () => {
    const terrain1 = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    const terrain2 = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    runFantasyOverlayPass(terrain1, COLS, ROWS, SEED, HIGH_ENTROPY);
    runFantasyOverlayPass(terrain2, COLS, ROWS, SEED, HIGH_ENTROPY);
    expect(terrain1).toEqual(terrain2);
  });

  it('produces different outputs with different seeds (sanity check)', () => {
    const terrain1 = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    const terrain2 = makeTerrainGrid(COLS, ROWS, 'temperate_forest');
    runFantasyOverlayPass(terrain1, COLS, ROWS, 42, HIGH_ENTROPY);
    runFantasyOverlayPass(terrain2, COLS, ROWS, 99999, HIGH_ENTROPY);
    // Different seeds should produce at least some different results in a 900-hex grid
    const diff = terrain1.filter((t, i) => t !== terrain2[i]);
    expect(diff.length).toBeGreaterThan(0);
  });
});
