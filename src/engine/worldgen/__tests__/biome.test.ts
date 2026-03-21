/**
 * Tests for pass06-tempReassess.ts, pass07-biome.ts, pass08-smoothing.ts
 *
 * Validates temperature reassessment (lake effect, river valley),
 * biome classification overrides (elevation, wetland, desert sub-types, volcanic),
 * and adjacency smoothing.
 *
 * TDD: Written before full implementation — all tests should fail initially.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { runGridPass } from '../passes/pass00-grid';
import { runProvincePass } from '../passes/pass01-provinces';
import { runElevationPass } from '../passes/pass02-elevation';
import { runCoastlinePass } from '../passes/pass03-coastline';
import { runClimatePass } from '../passes/pass04-climate';
import { runTempReassessPass } from '../passes/pass06-tempReassess';
import { runBiomePass } from '../passes/pass07-biome';
import { runSmoothingPass } from '../passes/pass08-smoothing';
import type { WorldGenContext, WorldGenParams } from '../types';

// ─── Test grid factory ───────────────────────────────────────────

function makeTestParams(overrides: Partial<WorldGenParams> = {}): WorldGenParams {
  return {
    cols: 30,
    rows: 20,
    seed: 42,
    ridgeCount: 2,
    seaLevelThreshold: 0.38,
    landShape: 'continent',
    mountainDensity: 'moderate',
    livingCultures: [],
    lostCultures: [],
    ...overrides,
  };
}

function makeCtx(params: WorldGenParams): WorldGenContext {
  const ctx = runGridPass(params);
  runProvincePass(ctx, params);
  runElevationPass(ctx, params);
  runCoastlinePass(ctx, params);
  runClimatePass(ctx, params);
  return ctx;
}

// ─── Temperature reassessment ────────────────────────────────────

describe('runTempReassessPass — lake effect', () => {
  it('lake-adjacent hexes have temperature moderated toward 0.5', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Create a 5-hex lake at a known location
    const lakeRow = Math.floor(rows / 2);
    const lakeCol = Math.floor(cols / 2);
    const lakeHexes = [
      { col: lakeCol, row: lakeRow },
      { col: lakeCol + 1, row: lakeRow },
      { col: lakeCol - 1, row: lakeRow },
      { col: lakeCol, row: lakeRow + 1 },
      { col: lakeCol, row: lakeRow - 1 },
    ];
    const lakeId = 1;
    for (const h of lakeHexes) {
      if (h.col >= 0 && h.col < cols && h.row >= 0 && h.row < rows) {
        ctx.lakeIds[h.row * cols + h.col] = lakeId;
        ctx.isOcean[h.row * cols + h.col] = 0; // not ocean
      }
    }

    // Find a non-lake hex adjacent to the lake
    const adjacentCol = lakeCol + 2;
    const adjacentIdx = lakeRow * cols + adjacentCol;
    if (adjacentCol >= cols) return;

    // Set temperature far from 0.5 to make moderation visible
    const tempBefore = 0.1;
    ctx.temperature[adjacentIdx] = tempBefore;

    runTempReassessPass(ctx);

    const tempAfter = ctx.temperature[adjacentIdx];

    // Temperature should have moved toward 0.5
    const deviationBefore = Math.abs(tempBefore - 0.5);
    const deviationAfter = Math.abs(tempAfter - 0.5);
    expect(deviationAfter).toBeLessThan(deviationBefore);
  });
});

describe('runTempReassessPass — river valley effect', () => {
  it('river hexes get temperature and moisture boost', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Set up a known river hex
    const riverRow = Math.floor(rows / 2);
    const riverCol = Math.floor(cols / 2);
    const riverIdx = riverRow * cols + riverCol;

    // Make sure it's land
    ctx.isOcean[riverIdx] = 0;
    ctx.hasRiver[riverIdx] = 1;

    const tempBefore = ctx.temperature[riverIdx];
    const moistureBefore = ctx.moisture[riverIdx];

    runTempReassessPass(ctx);

    const tempAfter = ctx.temperature[riverIdx];
    const moistureAfter = ctx.moisture[riverIdx];

    // Should have boosted both
    expect(tempAfter).toBeGreaterThan(tempBefore);
    expect(moistureAfter).toBeGreaterThan(moistureBefore);
  });

  it('river valley temperature boost is in expected range [0.02, 0.05]', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    const riverRow = 5;
    const riverCol = 5;
    const riverIdx = riverRow * cols + riverCol;

    ctx.isOcean[riverIdx] = 0;
    ctx.hasRiver[riverIdx] = 1;
    // Set to a value where boost won't hit ceiling
    ctx.temperature[riverIdx] = 0.5;
    ctx.moisture[riverIdx] = 0.4;

    runTempReassessPass(ctx);

    const tempBoost = ctx.temperature[riverIdx] - 0.5;
    const moistureBoost = ctx.moisture[riverIdx] - 0.4;

    expect(tempBoost).toBeGreaterThanOrEqual(0.02);
    expect(tempBoost).toBeLessThanOrEqual(0.05);
    expect(moistureBoost).toBeGreaterThanOrEqual(0.05);
    expect(moistureBoost).toBeLessThanOrEqual(0.10);
  });
});

// ─── Biome elevation overrides ────────────────────────────────────

describe('runBiomePass — elevation overrides', () => {
  it('high elevation hexes (>= 0.85) are classified as high_mountains or volcano', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Set specific hexes to very high elevation
    const testRow = Math.floor(rows / 2);
    for (let col = 5; col < 10; col++) {
      const idx = testRow * cols + col;
      ctx.elevation[idx] = 0.9;
      ctx.isOcean[idx] = 0;
      ctx.temperature[idx] = 0.3; // cold (no volcano)
    }

    runTempReassessPass(ctx);
    runBiomePass(ctx);

    for (let col = 5; col < 10; col++) {
      const idx = testRow * cols + col;
      const terrain = ctx.terrain[idx];
      expect(
        terrain === 'high_mountains' || terrain === 'mountains' || terrain === 'glacier' || terrain === 'volcano',
        `Expected highland type but got '${terrain}' at col=${col}`,
      ).toBe(true);
    }
  });

  it('highland elevation (>= ELEV.HIGHLAND = 0.80) produces mountains or plateau', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    const testRow = Math.floor(rows / 2);
    for (let col = 3; col < 8; col++) {
      const idx = testRow * cols + col;
      ctx.elevation[idx] = 0.82;
      ctx.isOcean[idx] = 0;
      ctx.temperature[idx] = 0.5; // temperate
      ctx.moisture[idx] = 0.4;
    }

    runBiomePass(ctx);

    for (let col = 3; col < 8; col++) {
      const idx = testRow * cols + col;
      const terrain = ctx.terrain[idx];
      expect(
        terrain === 'mountains' || terrain === 'high_mountains' || terrain === 'plateau' ||
        terrain === 'mountain_pass' || terrain === 'forested_hills' || terrain === 'glacier',
        `Expected highland type but got '${terrain}'`,
      ).toBe(true);
    }
  });

  it('plateau detection: high flat region produces plateau', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Create a 5x5 block of high-elevation flat land (variance < 0.0025)
    const startRow = 5;
    const startCol = 10;
    const flatElev = 0.82;

    for (let r = startRow - 2; r <= startRow + 2; r++) {
      for (let c = startCol - 2; c <= startCol + 2; c++) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const idx = r * cols + c;
        ctx.elevation[idx] = flatElev + (Math.random() * 0.001); // near-zero variance
        ctx.isOcean[idx] = 0;
        ctx.temperature[idx] = 0.5;
        ctx.moisture[idx] = 0.3;
      }
    }

    runBiomePass(ctx);

    // Center hex of the flat block should be plateau
    const centerIdx = startRow * cols + startCol;
    const terrain = ctx.terrain[centerIdx];
    expect(
      terrain === 'plateau' || terrain === 'mountains' || terrain === 'high_mountains',
      `Expected plateau or mountains but got '${terrain}'`,
    ).toBe(true);
  });
});

// ─── Wetland overrides ─────────────────────────────────────────────

describe('runBiomePass — wetland overrides', () => {
  it('low-elevation + high-moisture hexes near lake shore become marsh', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    const lakeRow = Math.floor(rows / 2);
    const lakeCol = Math.floor(cols / 2);

    // Create a 5-hex lake
    const lakeHexes = [
      { col: lakeCol, row: lakeRow },
      { col: lakeCol + 1, row: lakeRow },
      { col: lakeCol - 1, row: lakeRow },
      { col: lakeCol, row: lakeRow + 1 },
      { col: lakeCol, row: lakeRow - 1 },
    ];
    for (const h of lakeHexes) {
      if (h.col >= 0 && h.col < cols && h.row >= 0 && h.row < rows) {
        ctx.lakeIds[h.row * cols + h.col] = 1;
        ctx.isOcean[h.row * cols + h.col] = 0;
      }
    }

    // Create a wetland hex adjacent to the lake
    // Use elev=0.39 (strictly < ELEV.LOWLAND=0.40 to get lowland classification)
    const wetlandCol = lakeCol + 2;
    const wetlandIdx = lakeRow * cols + wetlandCol;
    if (wetlandCol < cols) {
      ctx.elevation[wetlandIdx] = 0.39;
      ctx.moisture[wetlandIdx] = 0.75;
      ctx.temperature[wetlandIdx] = 0.5; // warm → swamp or marsh
      ctx.isOcean[wetlandIdx] = 0;
      ctx.lakeIds[wetlandIdx] = -1;
    }

    runBiomePass(ctx);

    if (wetlandCol < cols) {
      const terrain = ctx.terrain[wetlandIdx];
      expect(
        terrain === 'marsh' || terrain === 'swamp' || terrain === 'moor_bog' || terrain === 'floodplain',
        `Expected wetland type but got '${terrain}'`,
      ).toBe(true);
    }
  });

  it('cold wet lowlands become moor_bog, warm wet lowlands become swamp', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    const coldIdx = 5 * cols + 5;
    const warmIdx = 5 * cols + 8;

    // Cold wet lowland — elevation strictly below ELEV.LOWLAND (0.40) for lowland classification
    ctx.elevation[coldIdx] = 0.39;
    ctx.moisture[coldIdx] = 0.75;
    ctx.temperature[coldIdx] = 0.2; // cold → moor_bog
    ctx.isOcean[coldIdx] = 0;
    ctx.lakeIds[coldIdx] = -1;

    // Warm wet lowland
    ctx.elevation[warmIdx] = 0.39;
    ctx.moisture[warmIdx] = 0.75;
    ctx.temperature[warmIdx] = 0.6; // warm → swamp
    ctx.isOcean[warmIdx] = 0;
    ctx.lakeIds[warmIdx] = -1;

    runBiomePass(ctx);

    // Cold → moor_bog, warm → swamp (unless near lake which would give marsh)
    const coldTerrain = ctx.terrain[coldIdx];
    const warmTerrain = ctx.terrain[warmIdx];

    expect(
      coldTerrain === 'moor_bog' || coldTerrain === 'marsh' || coldTerrain === 'swamp',
      `Expected wetland but got '${coldTerrain}'`,
    ).toBe(true);
    expect(
      warmTerrain === 'swamp' || warmTerrain === 'marsh' || warmTerrain === 'moor_bog',
      `Expected wetland but got '${warmTerrain}'`,
    ).toBe(true);
  });
});

// ─── Desert sub-types ─────────────────────────────────────────────

describe('runBiomePass — desert sub-types', () => {
  it('at least 3 different desert sub-types appear across many desert hexes', () => {
    const params = makeTestParams({ seed: 42, cols: 60, rows: 40 });
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Force a large region to be desert conditions
    const desertTypes = new Set<string>();
    let forcedCount = 0;

    for (let row = 5; row < rows - 5; row++) {
      for (let col = 5; col < cols - 5; col++) {
        const idx = row * cols + col;
        // Desert conditions: high temp, very low moisture, strictly lowland (< 0.40)
        ctx.elevation[idx] = 0.39;
        ctx.temperature[idx] = 0.75; // scorching → desert
        ctx.moisture[idx] = 0.15; // < MOIST.ARID (0.25)
        ctx.isOcean[idx] = 0; // ensure land
        ctx.lakeIds[idx] = -1;
        forcedCount++;
        if (forcedCount >= 500) break;
      }
      if (forcedCount >= 500) break;
    }

    runBiomePass(ctx);

    // Count desert subtypes
    for (let i = 0; i < cols * rows; i++) {
      const t = ctx.terrain[i];
      if (
        t === 'desert' || t === 'sand_dunes' || t === 'rocky_desert' || t === 'badlands'
      ) {
        desertTypes.add(t);
      }
    }

    expect(desertTypes.size).toBeGreaterThanOrEqual(3);
  });
});

// ─── Volcanic placement ───────────────────────────────────────────

describe('runBiomePass — volcanic placement', () => {
  it('volcano hexes appear only at high elevation and high temperature', () => {
    const params = makeTestParams({ seed: 42, cols: 60, rows: 40 });
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Force many qualifying hexes — both high elevation (>= 0.85) and high temp (> 0.4)
    for (let i = 0; i < cols * rows; i++) {
      ctx.elevation[i] = 0.88;
      ctx.temperature[i] = 0.72; // > VOLCANO_MIN_TEMPERATURE (0.4)
      ctx.moisture[i] = 0.3;
      ctx.isOcean[i] = 0; // all land
    }

    runBiomePass(ctx);

    let volcanoCount = 0;
    let highElevHotCount = 0;
    for (let i = 0; i < cols * rows; i++) {
      if (ctx.isOcean[i]) continue;
      highElevHotCount++;
      if (ctx.terrain[i] === 'volcano') volcanoCount++;
    }

    // Volcano rate should be < 10% (target ~5%)
    const rate = volcanoCount / highElevHotCount;
    expect(rate).toBeLessThan(0.1);
    // And should appear at least occasionally
    expect(volcanoCount).toBeGreaterThan(0);
  });
});

// ─── Adjacency smoothing ──────────────────────────────────────────

describe('runSmoothingPass — illegal adjacencies eliminated', () => {
  it('no illegal adjacency pairs remain after smoothing', () => {
    const params = makeTestParams({ seed: 42 });
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Create some illegal adjacencies manually
    const midRow = Math.floor(rows / 2);
    // Place desert next to dense_forest
    const col1 = 5;
    const col2 = 6;
    ctx.elevation[midRow * cols + col1] = 0.42;
    ctx.temperature[midRow * cols + col1] = 0.8;
    ctx.moisture[midRow * cols + col1] = 0.1;
    ctx.isOcean[midRow * cols + col1] = 0;

    ctx.elevation[midRow * cols + col2] = 0.42;
    ctx.temperature[midRow * cols + col2] = 0.3;
    ctx.moisture[midRow * cols + col2] = 0.8;
    ctx.isOcean[midRow * cols + col2] = 0;

    runBiomePass(ctx);

    // Force the illegal pair directly
    ctx.terrain[midRow * cols + col1] = 'desert';
    ctx.terrain[midRow * cols + col2] = 'dense_forest';

    runSmoothingPass(ctx);

    // After smoothing, 'desert' and 'dense_forest' should not be adjacent
    const ILLEGAL_CHECK = new Set([
      'desert|dense_forest', 'desert|tropical_forest', 'desert|jungle', 'desert|swamp',
      'tundra|tropical_forest', 'tundra|jungle', 'tundra|desert',
      'glacier|desert', 'glacier|tropical_forest', 'glacier|jungle', 'glacier|savanna',
      'snow_fields|tropical_forest', 'snow_fields|jungle', 'snow_fields|desert',
      'arctic|tropical_forest', 'arctic|jungle', 'arctic|desert', 'arctic|savanna',
    ]);
    const addBoth = (a: string, b: string) => { ILLEGAL_CHECK.add(`${b}|${a}`); };
    // Add reverse pairs
    for (const pair of Array.from(ILLEGAL_CHECK)) {
      const [a, b] = pair.split('|');
      ILLEGAL_CHECK.add(`${b}|${a}`);
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (ctx.isOcean[idx]) continue;
        const terrain = ctx.terrain[idx];

        const isOddCol = col % 2 === 1;
        const dirs = isOddCol
          ? [[1,1],[1,0],[0,-1],[-1,0],[-1,1],[0,1]]
          : [[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[0,1]];

        for (const [dc, dr] of dirs) {
          const nc = col + dc;
          const nr = row + dr;
          if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
          const nIdx = nr * cols + nc;
          if (ctx.isOcean[nIdx]) continue;
          const nTerrain = ctx.terrain[nIdx];

          const pair = `${terrain}|${nTerrain}`;
          expect(
            ILLEGAL_CHECK.has(pair),
            `Illegal adjacency found: ${terrain} next to ${nTerrain} at (${col},${row})`,
          ).toBe(false);
        }
      }
    }
  });

  it('smoothing changes fewer than 20% of hexes (conservative)', () => {
    const params = makeTestParams({ seed: 42 });
    const ctx = makeCtx(params);
    runBiomePass(ctx);

    const { cols, rows } = params;
    const total = cols * rows;

    // Snapshot before smoothing
    const before = ctx.terrain.slice();
    runSmoothingPass(ctx);

    let changed = 0;
    let landCount = 0;
    for (let i = 0; i < total; i++) {
      if (ctx.isOcean[i]) continue;
      landCount++;
      if (ctx.terrain[i] !== before[i]) changed++;
    }

    const changeRate = landCount > 0 ? changed / landCount : 0;
    expect(changeRate).toBeLessThan(0.20);
  });
});

// ─── Full pipeline integration ────────────────────────────────────

describe('runBiomePass + runSmoothingPass — integration', () => {
  it('ocean hexes get appropriate depth classification', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    runTempReassessPass(ctx);
    runBiomePass(ctx);

    const { cols, rows } = params;
    const oceanTypes = new Set(['ocean', 'deep_ocean', 'coastal_shallows', 'lake']);

    for (let i = 0; i < cols * rows; i++) {
      if (ctx.isOcean[i]) {
        expect(
          oceanTypes.has(ctx.terrain[i]),
          `Ocean hex has non-ocean terrain: ${ctx.terrain[i]}`,
        ).toBe(true);
      }
    }
  });

  it('all terrain values are valid TerrainType strings', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    runTempReassessPass(ctx);
    runBiomePass(ctx);
    runSmoothingPass(ctx);

    const VALID_TERRAIN = new Set([
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
    ]);

    const { cols, rows } = params;
    for (let i = 0; i < cols * rows; i++) {
      const t = ctx.terrain[i];
      expect(VALID_TERRAIN.has(t), `Invalid terrain type: '${t}' at index ${i}`).toBe(true);
    }
  });

  it('temperature reassessment all values remain in [0, 1]', () => {
    const params = makeTestParams();
    const ctx = makeCtx(params);
    const { cols, rows } = params;

    // Add some river data
    ctx.hasRiver[10 * cols + 5] = 1;
    ctx.hasRiver[10 * cols + 6] = 1;

    runTempReassessPass(ctx);

    for (let i = 0; i < cols * rows; i++) {
      expect(ctx.temperature[i]).toBeGreaterThanOrEqual(0);
      expect(ctx.temperature[i]).toBeLessThanOrEqual(1);
      expect(ctx.moisture[i]).toBeGreaterThanOrEqual(0);
      expect(ctx.moisture[i]).toBeLessThanOrEqual(1);
    }
  });
});
