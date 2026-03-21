/**
 * Pass 03: Coastline Detail
 *
 * Refines elevation near the land/sea boundary to produce:
 * - High-frequency coastal noise (fine inlets, peninsulas, bays)
 * - Island chain generation
 * - Peninsula generator
 * - Bay carver
 *
 * NFP #1 Tunability: All constants in constants.ts.
 * NFP #3 Determinism: mulberry32(seed + PASS_SEED_COASTLINE) drives all randomness.
 * NFP #4 Fail-soft: Skips any feature if no valid anchor hex is found.
 */
import { createNoise2D } from 'simplex-noise';
import { mulberry32 } from '../../../lib/prng';
import { hexNeighbors, hexDistance } from '../../../lib/hexMath';
import {
  PASS_SEED_COASTLINE,
  SEA_LEVEL,
  COASTAL_NOISE_SCALE,
  COASTAL_NOISE_OCTAVES,
  COASTAL_NOISE_RANGE,
  ISLAND_CHAIN_COUNT,
  ISLAND_CHAIN_MIN_LENGTH,
  ISLAND_CHAIN_MAX_LENGTH,
  PENINSULA_COUNT,
  BAY_CARVE_COUNT,
} from '../constants';
import type { WorldGenContext, WorldGenParams } from '../types';
import type { HexCoord } from '../../../types';

// ─── Helpers ─────────────────────────────────────────────────────

/** Check if a hex is at the land/sea boundary */
function isCoastal(col: number, row: number, ctx: WorldGenContext): boolean {
  if (col < 0 || col >= ctx.cols || row < 0 || row >= ctx.rows) return false;
  const isOcean = ctx.isOcean[row * ctx.cols + col];
  const neighbors = hexNeighbors({ col, row });
  for (const n of neighbors) {
    if (n.col < 0 || n.col >= ctx.cols || n.row < 0 || n.row >= ctx.rows) continue;
    if (ctx.isOcean[n.row * ctx.cols + n.col] !== isOcean) return true;
  }
  return false;
}

/** Multi-octave simplex noise for coastline, normalized to [0, 1] */
function fractalCoastal(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
  scale: number,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return (total / maxAmp + 1) / 2;
}

// ─── Main pass ───────────────────────────────────────────────────

export function runCoastlinePass(ctx: WorldGenContext, params: WorldGenParams): void {
  const { cols, rows, seed } = params;
  const rng = mulberry32(seed + PASS_SEED_COASTLINE);
  const coastNoise = createNoise2D(rng);

  // 1. High-frequency coastal noise — only near land/sea boundary
  const coastalHexes: HexCoord[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isCoastal(col, row, ctx)) {
        coastalHexes.push({ col, row });
      }
    }
  }

  // Build a set of hexes within COASTAL_NOISE_RANGE of any coastal hex
  const nearCoastSet = new Set<number>();
  for (const hex of coastalHexes) {
    for (let row2 = Math.max(0, hex.row - COASTAL_NOISE_RANGE); row2 <= Math.min(rows - 1, hex.row + COASTAL_NOISE_RANGE); row2++) {
      for (let col2 = Math.max(0, hex.col - COASTAL_NOISE_RANGE); col2 <= Math.min(cols - 1, hex.col + COASTAL_NOISE_RANGE); col2++) {
        if (hexDistance(hex, { col: col2, row: row2 }) <= COASTAL_NOISE_RANGE) {
          nearCoastSet.add(row2 * cols + col2);
        }
      }
    }
  }

  for (const idx of nearCoastSet) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const noiseVal = fractalCoastal(coastNoise, col, row, COASTAL_NOISE_OCTAVES, COASTAL_NOISE_SCALE);
    // Apply small perturbation around sea level
    const perturbation = (noiseVal - 0.5) * 0.08;
    ctx.elevation[idx] = Math.max(0, Math.min(1, ctx.elevation[idx] + perturbation));
  }

  // 2. Island chain generator
  const oceanHexes: HexCoord[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (ctx.isOcean[row * cols + col]) {
        oceanHexes.push({ col, row });
      }
    }
  }

  const landShape = params.landShape;

  for (let chain = 0; chain < ISLAND_CHAIN_COUNT; chain++) {
    if (oceanHexes.length === 0) break;

    // Pick a random starting ocean hex near coast
    let startIdx = -1;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidateIdx = Math.floor(rng() * oceanHexes.length);
      const candidate = oceanHexes[candidateIdx];
      if (isCoastal(candidate.col, candidate.row, ctx)) {
        startIdx = candidateIdx;
        break;
      }
    }
    if (startIdx < 0) {
      // Fallback: any ocean hex
      startIdx = Math.floor(rng() * oceanHexes.length);
    }

    const startHex = oceanHexes[startIdx];
    const chainLength = Math.floor(rng() * (ISLAND_CHAIN_MAX_LENGTH - ISLAND_CHAIN_MIN_LENGTH) + ISLAND_CHAIN_MIN_LENGTH);

    let curCol = startHex.col;
    let curRow = startHex.row;
    const direction = rng() * Math.PI * 2;

    for (let island = 0; island < chainLength; island++) {
      // Step outward from coast
      curCol += Math.round(Math.cos(direction + (rng() - 0.5) * 0.5));
      curRow += Math.round(Math.sin(direction + (rng() - 0.5) * 0.5));

      if (curCol < 0 || curCol >= cols || curRow < 0 || curRow >= rows) break;

      const islandIdx = curRow * cols + curCol;
      // Raise elevation above sea level
      const islandSize = Math.floor(rng() * 3) + 1;
      for (let r = curRow - islandSize; r <= curRow + islandSize; r++) {
        for (let c = curCol - islandSize; c <= curCol + islandSize; c++) {
          if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
          const dist = hexDistance({ col: curCol, row: curRow }, { col: c, row: r });
          if (dist <= islandSize) {
            const idx2 = r * cols + c;
            const elevation = SEA_LEVEL + 0.05 + (1 - dist / islandSize) * 0.1;
            if (ctx.elevation[idx2] < elevation) {
              ctx.elevation[idx2] = Math.min(1, elevation);
            }
          }
        }
      }
    }
  }

  // 3. Peninsula generator — narrow land extensions from coastline
  for (let p = 0; p < PENINSULA_COUNT; p++) {
    if (coastalHexes.length === 0) break;

    // Pick a random coastal land hex as peninsula base
    let baseHex: HexCoord | null = null;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = coastalHexes[Math.floor(rng() * coastalHexes.length)];
      if (!ctx.isOcean[candidate.row * cols + candidate.col]) {
        baseHex = candidate;
        break;
      }
    }
    if (!baseHex) continue;

    // Extend peninsula into ocean
    const penAngle = rng() * Math.PI * 2;
    const penLength = Math.floor(rng() * 8 + 5);
    let penCol = baseHex.col;
    let penRow = baseHex.row;

    for (let step = 0; step < penLength; step++) {
      penCol += Math.round(Math.cos(penAngle + (rng() - 0.5) * 0.4));
      penRow += Math.round(Math.sin(penAngle + (rng() - 0.5) * 0.4));
      if (penCol < 0 || penCol >= cols || penRow < 0 || penRow >= rows) break;

      const idx2 = penRow * cols + penCol;
      // Peninsula elevation: just above sea level
      const penElev = SEA_LEVEL + 0.03 + (rng() * 0.05);
      if (ctx.elevation[idx2] < penElev) {
        ctx.elevation[idx2] = penElev;
      }
      // One hex wide on each side
      const sideAngle = penAngle + Math.PI / 2;
      for (const sign of [-1, 1]) {
        const sideCol = Math.round(penCol + Math.cos(sideAngle) * sign);
        const sideRow = Math.round(penRow + Math.sin(sideAngle) * sign);
        if (sideCol < 0 || sideCol >= cols || sideRow < 0 || sideRow >= rows) continue;
        const sideIdx = sideRow * cols + sideCol;
        if (ctx.elevation[sideIdx] < SEA_LEVEL) {
          ctx.elevation[sideIdx] = SEA_LEVEL + 0.01;
        }
      }
    }
  }

  // 4. Bay carver — cut deep inlets into coastline
  for (let b = 0; b < BAY_CARVE_COUNT; b++) {
    if (coastalHexes.length === 0) break;

    let baseHex: HexCoord | null = null;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = coastalHexes[Math.floor(rng() * coastalHexes.length)];
      if (!ctx.isOcean[candidate.row * cols + candidate.col]) {
        baseHex = candidate;
        break;
      }
    }
    if (!baseHex) continue;

    // Carve inland
    const bayAngle = rng() * Math.PI * 2;
    const bayLength = Math.floor(rng() * 6 + 4);
    let bayCol = baseHex.col;
    let bayRow = baseHex.row;

    for (let step = 0; step < bayLength; step++) {
      bayCol += Math.round(Math.cos(bayAngle + (rng() - 0.5) * 0.4));
      bayRow += Math.round(Math.sin(bayAngle + (rng() - 0.5) * 0.4));
      if (bayCol < 0 || bayCol >= cols || bayRow < 0 || bayRow >= rows) break;

      const idx2 = bayRow * cols + bayCol;
      // Lower elevation below sea level to carve bay
      const bayDepth = SEA_LEVEL - 0.05 - (rng() * 0.05);
      ctx.elevation[idx2] = Math.min(ctx.elevation[idx2], bayDepth);
    }
  }

  // 5. Recalculate isOcean after all coastline modifications
  for (let i = 0; i < ctx.elevation.length; i++) {
    ctx.isOcean[i] = ctx.elevation[i] < SEA_LEVEL ? 1 : 0;
  }
}
