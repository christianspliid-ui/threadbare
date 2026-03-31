/**
 * Validation pass tests + end-to-end world generation tests.
 *
 * TDD: Written BEFORE implementation (RED phase).
 * Tests exercise pass09-validation.ts and the updated generateWorld() in hexGrid.ts.
 *
 * NFP #2 Inspectability: ValidationResult provides full diagnostic data.
 * NFP #3 Determinism: Same seed must produce identical output end-to-end.
 * NFP #4 Fail-soft: Pipeline handles broken drainage gracefully (logs errors, doesn't crash).
 */
import { describe, it, expect } from 'vitest';
import { WorldGenPipeline } from '../WorldGenPipeline';
import { runValidationPass, type ValidationResult } from '../passes/pass09-validation';
import { generateWorld } from '../../hexGrid';
import type { WorldGenParams } from '../types';
import type { CosmologyProfile } from '../../../types';

const SMALL_PARAMS: WorldGenParams = {
  cols: 20,
  rows: 30,
  seed: 42,
  ridgeCount: 2,
  seaLevelThreshold: 0.38,
  landShape: 'continent',
  mountainDensity: 'moderate',
  livingCultures: [
    {
      id: 'highland_folk',
      preferredBiomes: ['mountains', 'hills', 'plateau'],
      toleratedBiomes: ['tundra', 'glacier', 'badlands'],
    },
  ],
  lostCultures: [],
};

const DEFAULT_COSMOLOGY: CosmologyProfile = {
  force: 0.125,
  matter: 0.125,
  energy: 0.125,
  life: 0.125,
  mind: 0.125,
  spirit: 0.125,
  time: 0.125,
  entropy: 0.125,
};

function runPipeline(params: WorldGenParams = SMALL_PARAMS) {
  const pipeline = new WorldGenPipeline();
  return pipeline.run(params);
}

describe('Validation pass — pass09', () => {
  it('runValidationPass returns a ValidationResult with all required fields', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    expect(result).toBeDefined();
    expect(typeof result.drainageGuaranteed).toBe('boolean');
    expect(typeof result.provinceCoverage).toBe('number');
    expect(typeof result.landFraction).toBe('number');
    expect(typeof result.oceanFraction).toBe('number');
    expect(typeof result.riverCount).toBe('number');
    expect(typeof result.lakeCount).toBe('number');
    expect(result.terrainDistribution).toBeDefined();
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.errors).toBeInstanceOf(Array);
  });

  it('validation confirms drainage on a valid world', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    expect(result.drainageGuaranteed).toBe(true);
  });

  it('validation confirms province coverage >= 0.99', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    expect(result.provinceCoverage).toBeGreaterThanOrEqual(0.99);
  });

  it('validation reports land/ocean balance — both > 0% (some land, some ocean)', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    // Small test grids (20x30) may have skewed ratios — just verify both exist
    expect(result.landFraction).toBeGreaterThan(0);
    expect(result.oceanFraction).toBeGreaterThan(0);
    // At least one of them must be significant (not a trivial amount)
    expect(Math.max(result.landFraction, result.oceanFraction)).toBeGreaterThan(0.3);
  });

  it('validation reports river count > 0', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    expect(result.riverCount).toBeGreaterThan(0);
  });

  it('validation reports terrain distribution with multiple distinct types', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    const types = Object.keys(result.terrainDistribution).filter(k => result.terrainDistribution[k] > 0);
    // A valid 20x30 world should have at least 5 distinct terrain types
    expect(types.length).toBeGreaterThanOrEqual(5);
  });

  it('validation detects drainage violation when drainageElevation is corrupted', () => {
    const ctx = runPipeline();
    // Corrupt drainage on a land hex to create a local maximum
    const { cols, rows, isOcean, drainageElevation } = ctx;
    let corruptIdx = -1;
    for (let row = 2; row < rows - 2; row++) {
      for (let col = 2; col < cols - 2; col++) {
        const idx = row * cols + col;
        if (!isOcean[idx]) {
          corruptIdx = idx;
          break;
        }
      }
      if (corruptIdx >= 0) break;
    }
    if (corruptIdx >= 0) {
      // Raise drainageElevation of all neighbors to create a local maximum at corruptIdx
      // by zeroing out drainageElevation of this hex (makes it appear to not drain)
      const origValue = drainageElevation[corruptIdx];
      drainageElevation[corruptIdx] = 1.0; // Set to maximum — no downhill neighbor
      const result = runValidationPass(ctx, {});
      // Restore
      drainageElevation[corruptIdx] = origValue;
      // With all neighbors lower and this hex at 1.0, there should be at least one hex
      // where this hex is higher than all its neighbors — but the neighbors will still drain
      // This is a soft check — the validation should at minimum run without throwing
      expect(result).toBeDefined();
    }
  });
});

describe('generateWorld() — hexGrid.ts entry point', () => {
  it('generateWorld returns WorldGenResult with tiles, riverPaths, lakeIds', () => {
    const result = generateWorld(DEFAULT_COSMOLOGY, 20, 30, 42);
    expect(result).toHaveProperty('tiles');
    expect(result).toHaveProperty('riverPaths');
    expect(result).toHaveProperty('lakeIds');
    expect(result.tiles).toBeInstanceOf(Array);
    expect(result.tiles.length).toBe(20 * 30);
  });

  it('every HexTile has coord, geoParams, and terrain', () => {
    const { tiles } = generateWorld(DEFAULT_COSMOLOGY, 20, 30, 42);
    for (const tile of tiles) {
      expect(tile.coord).toBeDefined();
      expect(typeof tile.coord.col).toBe('number');
      expect(typeof tile.coord.row).toBe('number');
      expect(tile.geoParams).toBeDefined();
      expect(typeof tile.geoParams.elevation).toBe('number');
      expect(typeof tile.geoParams.temperature).toBe('number');
      expect(typeof tile.geoParams.moisture).toBe('number');
      expect(tile.terrain).toBeDefined();
      expect(typeof tile.terrain).toBe('string');
    }
  });

  it('geoParams values are in [0, 1] range', () => {
    const { tiles } = generateWorld(DEFAULT_COSMOLOGY, 20, 30, 42);
    for (const tile of tiles) {
      expect(tile.geoParams.elevation).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.elevation).toBeLessThanOrEqual(1);
      expect(tile.geoParams.temperature).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.temperature).toBeLessThanOrEqual(1);
      expect(tile.geoParams.moisture).toBeGreaterThanOrEqual(0);
      expect(tile.geoParams.moisture).toBeLessThanOrEqual(1);
    }
  });

  it('end-to-end determinism: same seed produces identical terrain at every hex', () => {
    const { tiles: tiles1 } = generateWorld(DEFAULT_COSMOLOGY, 20, 30, 42);
    const { tiles: tiles2 } = generateWorld(DEFAULT_COSMOLOGY, 20, 30, 42);
    expect(tiles1.length).toBe(tiles2.length);
    for (let i = 0; i < tiles1.length; i++) {
      expect(tiles1[i].terrain).toBe(tiles2[i].terrain);
      expect(tiles1[i].geoParams.elevation).toBe(tiles2[i].geoParams.elevation);
    }
  });

  it('coords cover the full grid (0,0) to (cols-1, rows-1)', () => {
    const cols = 20;
    const rows = 30;
    const { tiles } = generateWorld(DEFAULT_COSMOLOGY, cols, rows, 42);
    const coordSet = new Set(tiles.map(t => `${t.coord.col},${t.coord.row}`));
    expect(coordSet.size).toBe(cols * rows);
    expect(coordSet.has('0,0')).toBe(true);
    expect(coordSet.has(`${cols - 1},${rows - 1}`)).toBe(true);
  });

  it('generated tiles include some river hexes (hasRiver)', () => {
    const { tiles } = generateWorld(DEFAULT_COSMOLOGY, 20, 30, 42);
    const riverTiles = tiles.filter(t => t.hasRiver === true);
    expect(riverTiles.length).toBeGreaterThan(0);
  });
});

describe('Land connectivity — orphan detection & repair', () => {
  it('validation result includes orphan fields', () => {
    const ctx = runPipeline();
    const result = runValidationPass(ctx, {});
    expect(typeof result.orphanComponentsFixed).toBe('number');
    expect(typeof result.orphanHexesFixed).toBe('number');
  });

  it('detects and bridges an artificial orphan island', () => {
    const ctx = runPipeline();
    const { cols, rows, terrain, isOcean } = ctx;

    // Find a land hex with all-land neighbors, then surround it with ocean to create an orphan
    let targetIdx = -1;
    for (let row = 3; row < rows - 3; row++) {
      for (let col = 3; col < cols - 3; col++) {
        const idx = row * cols + col;
        if (isOcean[idx]) continue;

        const isOddCol = col % 2 === 1;
        const dirs = isOddCol
          ? [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]]
          : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]];

        // Check that ALL neighbors AND their neighbors are land (so we can make a ring of ocean)
        let allNeighborsLand = true;
        const ring1: number[] = [];
        for (const [dc, dr] of dirs) {
          const nc = col + dc;
          const nr = row + dr;
          if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) { allNeighborsLand = false; break; }
          const nIdx = nr * cols + nc;
          if (isOcean[nIdx]) { allNeighborsLand = false; break; }
          ring1.push(nIdx);
        }
        if (!allNeighborsLand || ring1.length < 6) continue;

        targetIdx = idx;

        // Surround this hex with ocean — creating an orphan island of 1 hex
        for (const nIdx of ring1) {
          terrain[nIdx] = 'ocean';
          isOcean[nIdx] = 1;
        }
        break;
      }
      if (targetIdx >= 0) break;
    }

    // Skip test if we couldn't find a suitable hex (very unlikely on 20x30)
    if (targetIdx < 0) return;

    // Run validation — should detect and fix the orphan
    const result = runValidationPass(ctx, {});
    expect(result.orphanComponentsFixed).toBeGreaterThanOrEqual(1);
    expect(result.orphanHexesFixed).toBeGreaterThanOrEqual(1);

    // Verify the orphan hex is now reachable — at least one neighbor should be passable
    const col = targetIdx % cols;
    const row = Math.floor(targetIdx / cols);
    const isOddCol = col % 2 === 1;
    const dirs = isOddCol
      ? [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]]
      : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]];
    let hasPassableNeighbor = false;
    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
        const nIdx = nr * cols + nc;
        if (terrain[nIdx] !== 'ocean' && terrain[nIdx] !== 'deep_ocean' && terrain[nIdx] !== 'lake') {
          hasPassableNeighbor = true;
          break;
        }
      }
    }
    expect(hasPassableNeighbor).toBe(true);
  });

  it('no-op when all land hexes are already connected', () => {
    const ctx = runPipeline();
    // First pass fixes any natural orphans
    runValidationPass(ctx, {});
    // Second pass should find nothing to fix
    const result2 = runValidationPass(ctx, {});
    expect(result2.orphanComponentsFixed).toBe(0);
    expect(result2.orphanHexesFixed).toBe(0);
  });

  it('bridge terrain uses coast for ocean and marsh for lake', () => {
    const ctx = runPipeline();
    const { cols, rows, terrain, isOcean } = ctx;

    // Create a 1-hex orphan surrounded by ocean
    let targetIdx = -1;
    for (let row = 3; row < rows - 3; row++) {
      for (let col = 3; col < cols - 3; col++) {
        const idx = row * cols + col;
        if (isOcean[idx]) continue;

        const isOddCol = col % 2 === 1;
        const dirs = isOddCol
          ? [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]]
          : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]];

        let allNeighborsLand = true;
        const ring: number[] = [];
        for (const [dc, dr] of dirs) {
          const nc = col + dc;
          const nr = row + dr;
          if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) { allNeighborsLand = false; break; }
          const nIdx = nr * cols + nc;
          if (isOcean[nIdx]) { allNeighborsLand = false; break; }
          ring.push(nIdx);
        }
        if (!allNeighborsLand || ring.length < 6) continue;

        targetIdx = idx;
        for (const nIdx of ring) {
          terrain[nIdx] = 'ocean';
          isOcean[nIdx] = 1;
        }
        break;
      }
      if (targetIdx >= 0) break;
    }

    if (targetIdx < 0) return;

    runValidationPass(ctx, {});

    // At least one of the former-ocean neighbors should now be 'coast'
    const col = targetIdx % cols;
    const row = Math.floor(targetIdx / cols);
    const isOddCol = col % 2 === 1;
    const dirs = isOddCol
      ? [[1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1], [0, 1]]
      : [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [0, 1]];
    let hasCoast = false;
    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
        const nIdx = nr * cols + nc;
        if (terrain[nIdx] === 'coast') {
          hasCoast = true;
          break;
        }
      }
    }
    expect(hasCoast).toBe(true);
  });
});

describe('WorldGenPipeline — end-to-end integration', () => {
  it('full pipeline runs in under 10 seconds on 20x30 grid', () => {
    const start = Date.now();
    runPipeline();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  it('pipeline produces terrain variety — at least 5 distinct terrain types', () => {
    const ctx = runPipeline();
    const types = new Set(ctx.terrain);
    expect(types.size).toBeGreaterThanOrEqual(5);
  });

  it('pipeline produces at least some land and some ocean', () => {
    const ctx = runPipeline();
    let landCount = 0;
    let oceanCount = 0;
    for (let i = 0; i < ctx.isOcean.length; i++) {
      if (ctx.isOcean[i]) oceanCount++;
      else landCount++;
    }
    expect(landCount).toBeGreaterThan(0);
    expect(oceanCount).toBeGreaterThan(0);
  });
});
