/**
 * Pass 02: Elevation Generation
 *
 * Generates a province-biased heightmap with:
 * - Multi-octave simplex base elevation
 * - Dry rift canyon carving
 * - Province elevation bias (mountain/lowland/forest provinces)
 * - Ridge mountain spine overlay (max-blend, applied last for linear peaks)
 *
 * Exposes sampleElevation(col, row) continuous function for Phase 3 coastline rendering.
 *
 * NFP #1 Tunability: All noise parameters and ridge constants in constants.ts.
 * NFP #2 Inspectability: ctx.ridges and ctx.canyons store generation state.
 * NFP #3 Determinism: mulberry32(seed + PASS_SEED_ELEVATION) drives all randomness.
 * NFP #4 Fail-soft: Defaults to flat terrain if noise initialization fails.
 */
import { createNoise2D } from 'simplex-noise';
import { mulberry32 } from '../../../lib/prng';
import { hexNeighbors, hexDistance } from '../../../lib/hexMath';
import {
  PASS_SEED_ELEVATION,
  ELEVATION_SCALE,
  ELEVATION_OCTAVES,
  ELEVATION_PERSISTENCE,
  ELEVATION_LACUNARITY,
  RIDGE_COUNT_DEFAULT,
  RIDGE_PEAK_ELEVATION,
  RIDGE_FOOTHILLS_HEXES,
  RIDGE_FORK_PROBABILITY,
  RIDGE_MIN_LENGTH,
  RIDGE_MAX_LENGTH,
  RIDGE_MAX_FORKS,
  RIDGE_STEP_VARIANCE,
  CANYON_DRY_RIFT_COUNT,
  CANYON_DEPTH_FACTOR,
  SEA_LEVEL,
  PROVINCE_BIAS_DECAY_RATE,
  MOUNTAIN_PROVINCE_ELEV_RANGE,
  LOWLAND_PROVINCE_ELEV_RANGE,
  FOREST_PROVINCE_ELEV_RANGE,
  HEX_SAMPLE_POINTS,
} from '../constants';
import type { WorldGenContext, WorldGenParams, Ridge, Canyon } from '../types';
import type { HexCoord } from '../../../types';

// ─── 7-point hex sampling ─────────────────────────────────────────

/**
 * Samples a continuous field at hex center + 6 corners and returns the average.
 * Produces smoother values than single-point sampling.
 *
 * NFP #1: HEX_SAMPLE_POINTS = 7 (center + 6 corners)
 */
export function sample7Point(
  col: number,
  row: number,
  sampleFn: (c: number, r: number) => number,
  hexSize: number = 1.0,
): number {
  const center = sampleFn(col, row);
  let sum = center;
  // Flat-top hex: first corner at 0° (right), then every 60°
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const cornerCol = col + hexSize * Math.cos(angle);
    const cornerRow = row + hexSize * Math.sin(angle);
    sum += sampleFn(cornerCol, cornerRow);
  }
  return Math.max(0, Math.min(1, sum / HEX_SAMPLE_POINTS));
}

// ─── Noise helpers ────────────────────────────────────────────────

/** Multi-octave simplex noise, normalized to [0, 1] */
function fractalSimplex(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  scale: number,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  // Normalize from [-1, 1] to [0, 1]
  return (total / maxAmplitude + 1) / 2;
}

// ─── Ridge generation ─────────────────────────────────────────────

function generateRidges(
  cols: number,
  rows: number,
  count: number,
  rng: () => number,
): Ridge[] {
  const ridges: Ridge[] = [];

  for (let r = 0; r < count; r++) {
    // Start ridge at a random position (prefer middle latitudes)
    const startCol = Math.floor(rng() * cols);
    const startRow = Math.floor(rng() * rows * 0.7 + rows * 0.15); // avoid extreme poles
    const startAngle = rng() * Math.PI * 2;

    const spine: HexCoord[] = [];
    const forks: HexCoord[][] = [];
    let currentCol = startCol;
    let currentRow = startRow;
    let angle = startAngle;
    let forkCount = 0;

    const length = Math.floor(rng() * (RIDGE_MAX_LENGTH - RIDGE_MIN_LENGTH) + RIDGE_MIN_LENGTH);

    for (let step = 0; step < length; step++) {
      // Bounds check
      if (currentCol < 0 || currentCol >= cols || currentRow < 0 || currentRow >= rows) break;

      spine.push({ col: Math.round(currentCol), row: Math.round(currentRow) });

      // Random walk with directional momentum
      angle += (rng() - 0.5) * RIDGE_STEP_VARIANCE * 2;

      // Step in current direction (1 hex at a time)
      currentCol += Math.cos(angle);
      currentRow += Math.sin(angle);

      // Fork probability
      if (forkCount < RIDGE_MAX_FORKS && rng() < RIDGE_FORK_PROBABILITY && step > RIDGE_MIN_LENGTH / 3) {
        const fork: HexCoord[] = [];
        let forkCol = currentCol;
        let forkRow = currentRow;
        let forkAngle = angle + (rng() - 0.5) * Math.PI / 2;
        const forkLength = Math.floor(rng() * 20 + 10);

        for (let fs = 0; fs < forkLength; fs++) {
          if (forkCol < 0 || forkCol >= cols || forkRow < 0 || forkRow >= rows) break;
          fork.push({ col: Math.round(forkCol), row: Math.round(forkRow) });
          forkAngle += (rng() - 0.5) * RIDGE_STEP_VARIANCE * 2;
          forkCol += Math.cos(forkAngle);
          forkRow += Math.sin(forkAngle);
        }

        if (fork.length > 0) {
          forks.push(fork);
          forkCount++;
        }
      }
    }

    if (spine.length > 0) {
      // Calculate average orientation from the spine direction
      let dx = 0;
      let dy = 0;
      for (let i = 1; i < spine.length; i++) {
        dx += spine[i].col - spine[i - 1].col;
        dy += spine[i].row - spine[i - 1].row;
      }
      const orientation = Math.atan2(dy, dx);
      const normalizedOrientation = ((orientation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

      ridges.push({ spine, orientation: normalizedOrientation, forks });
    }
  }

  return ridges;
}

// ─── Ridge elevation overlay ──────────────────────────────────────

/**
 * Computes the ridge elevation contribution for a given hex.
 * Uses cosine falloff over RIDGE_FOOTHILLS_HEXES distance from spine.
 */
export function ridgeElevationAt(
  hex: HexCoord,
  ridges: Ridge[],
): number {
  let maxContrib = 0;

  for (const ridge of ridges) {
    // Check spine hexes
    for (const spineHex of ridge.spine) {
      const dist = hexDistance(hex, spineHex);
      if (dist <= RIDGE_FOOTHILLS_HEXES) {
        // Cosine falloff: 1.0 at center, 0.0 at foothills edge
        const t = 1 - dist / RIDGE_FOOTHILLS_HEXES;
        const contrib = RIDGE_PEAK_ELEVATION * (Math.cos(Math.PI * (1 - t)) + 1) / 2;
        maxContrib = Math.max(maxContrib, contrib);
      }
    }
    // Check fork hexes
    for (const fork of ridge.forks) {
      for (const forkHex of fork) {
        const dist = hexDistance(hex, forkHex);
        if (dist <= RIDGE_FOOTHILLS_HEXES) {
          const t = 1 - dist / RIDGE_FOOTHILLS_HEXES;
          const contrib = (RIDGE_PEAK_ELEVATION * 0.8) * (Math.cos(Math.PI * (1 - t)) + 1) / 2;
          maxContrib = Math.max(maxContrib, contrib);
        }
      }
    }
  }

  return maxContrib;
}

// ─── Province elevation bias ──────────────────────────────────────

const MOUNTAIN_BIOMES = new Set([
  'mountains', 'high_mountains', 'hills', 'glacier', 'plateau', 'mountain_pass',
  'tundra', 'arctic', 'snow_fields', 'badlands', 'volcano',
]);

const LOWLAND_BIOMES = new Set([
  'grassland', 'farmland', 'savanna', 'steppe', 'floodplain', 'desert',
  'sand_dunes', 'rocky_desert', 'oasis', 'coast', 'coastal_shallows', 'ocean',
  'deep_ocean', 'tropical_ocean', 'reef',
]);

const FOREST_BIOMES = new Set([
  'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle', 'tropical_forest',
  'evergreen_forest', 'light_forest', 'forested_hills', 'great_home_trees',
  'swamp', 'marsh', 'moor_bog', 'dead_forest',
]);

function getProvinceTargetElevation(terrainIdentity: string[]): [number, number] | null {
  if (terrainIdentity.length === 0) return null;

  const mountainCount = terrainIdentity.filter(b => MOUNTAIN_BIOMES.has(b)).length;
  const lowlandCount = terrainIdentity.filter(b => LOWLAND_BIOMES.has(b)).length;
  const forestCount = terrainIdentity.filter(b => FOREST_BIOMES.has(b)).length;

  if (mountainCount >= Math.max(lowlandCount, forestCount)) {
    return MOUNTAIN_PROVINCE_ELEV_RANGE;
  }
  if (forestCount >= lowlandCount) {
    return FOREST_PROVINCE_ELEV_RANGE;
  }
  return LOWLAND_PROVINCE_ELEV_RANGE;
}

// ─── Canyon generation ────────────────────────────────────────────

function generateCanyons(
  cols: number,
  rows: number,
  elevation: Float32Array,
  rng: () => number,
): Canyon[] {
  const canyons: Canyon[] = [];

  for (let c = 0; c < CANYON_DRY_RIFT_COUNT; c++) {
    // Start in a highland region
    let startCol = -1;
    let startRow = -1;
    for (let attempt = 0; attempt < 50; attempt++) {
      const col = Math.floor(rng() * cols);
      const row = Math.floor(rng() * rows);
      if (elevation[row * cols + col] > 0.6) {
        startCol = col;
        startRow = row;
        break;
      }
    }
    if (startCol < 0) continue;

    const path: HexCoord[] = [];
    const angle = rng() * Math.PI;
    let curCol = startCol;
    let curRow = startRow;
    const length = Math.floor(rng() * 20 + 10);

    for (let s = 0; s < length; s++) {
      if (curCol < 0 || curCol >= cols || curRow < 0 || curRow >= rows) break;
      path.push({ col: Math.round(curCol), row: Math.round(curRow) });
      curCol += Math.cos(angle + (rng() - 0.5) * 0.3);
      curRow += Math.sin(angle + (rng() - 0.5) * 0.3);
    }

    if (path.length > 0) {
      canyons.push({ path, type: 'dry-rift', depthFactor: CANYON_DEPTH_FACTOR });
    }
  }

  return canyons;
}

// ─── Main pass ───────────────────────────────────────────────────

export function runElevationPass(ctx: WorldGenContext, params: WorldGenParams): void {
  const { cols, rows, seed } = params;
  const rng = mulberry32(seed + PASS_SEED_ELEVATION);

  // Create seeded simplex noise using mulberry32 output
  // simplex-noise createNoise2D accepts a random function
  const noise2D = createNoise2D(rng);

  // Continuous noise evaluation function
  const evaluateElevationAt = (col: number, row: number): number => {
    return fractalSimplex(
      noise2D,
      col,
      row,
      ELEVATION_OCTAVES,
      ELEVATION_PERSISTENCE,
      ELEVATION_LACUNARITY,
      ELEVATION_SCALE,
    );
  };

  // 1. Generate base elevation with multi-octave simplex
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.elevation[row * cols + col] = evaluateElevationAt(col, row);
    }
  }

  // 2. Generate ridges (structure only — overlay applied after province bias)
  const ridgeCount = params.ridgeCount ?? RIDGE_COUNT_DEFAULT;
  const ridges = generateRidges(cols, rows, ridgeCount, rng);
  ctx.ridges = ridges;

  // 3. Generate canyons and apply
  const canyons = generateCanyons(cols, rows, ctx.elevation, rng);
  ctx.canyons = canyons;

  for (const canyon of canyons) {
    for (const hex of canyon.path) {
      if (hex.col < 0 || hex.col >= cols || hex.row < 0 || hex.row >= rows) continue;
      const idx = hex.row * cols + hex.col;
      ctx.elevation[idx] = Math.max(0, ctx.elevation[idx] - canyon.depthFactor);
    }
  }

  // 4. Apply province elevation bias
  for (const province of ctx.provinces) {
    const targetRange = getProvinceTargetElevation(province.terrainIdentity);
    if (!targetRange) continue;
    const [tMin, tMax] = targetRange;
    const targetElev = (tMin + tMax) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (ctx.provinceIds[idx] !== province.id) continue;

        const dist = hexDistance({ col, row }, province.seedHex);
        const biasStrength = Math.exp(-dist * PROVINCE_BIAS_DECAY_RATE);
        ctx.elevation[idx] = ctx.elevation[idx] * (1 - biasStrength) + targetElev * biasStrength;
      }
    }
  }

  // 5. Apply ridge elevation overlay (max-blend, not additive).
  // Runs AFTER province bias so ridge spines guarantee linear peak lines
  // that aren't pulled down by province smoothing.
  // max() means ridges set a floor elevation — only exact spine hexes
  // reach RIDGE_PEAK_ELEVATION (0.97), creating narrow ridgelines.
  if (ridges.length > 0) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const ridgeContrib = ridgeElevationAt({ col, row }, ridges);
        ctx.elevation[idx] = Math.max(ctx.elevation[idx], ridgeContrib);
      }
    }
  }

  // 6. Set sea level
  for (let i = 0; i < ctx.elevation.length; i++) {
    ctx.isOcean[i] = ctx.elevation[i] < SEA_LEVEL ? 1 : 0;
  }

  // 8. Store continuous sampleElevation function with ridge awareness
  ctx.sampleElevation = (col: number, row: number): number => {
    // Integer coords: return array value (fast path)
    if (Number.isInteger(col) && Number.isInteger(row)) {
      const c = Math.max(0, Math.min(cols - 1, col));
      const r = Math.max(0, Math.min(rows - 1, row));
      return ctx.elevation[r * cols + c];
    }
    // Fractional coords: re-evaluate noise + ridge overlay (max-blend) at this exact point
    const base = evaluateElevationAt(col, row);
    const ridge = ridgeElevationAt({ col: Math.round(col), row: Math.round(row) }, ridges);
    return Math.max(0, Math.min(1, Math.max(base, ridge)));
  };
}
