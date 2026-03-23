/**
 * Pass 07: Biome Classification
 *
 * Assigns terrain types to all hexes using:
 * 1. Base Whittaker classification via classifyBiome()
 * 2. Elevation overrides (highland → hills/mountains/plateau/mountain_pass)
 * 3. Wetland overrides (low elevation + high moisture near water → marsh/swamp/floodplain/moor_bog)
 * 4. Desert sub-type selection via noise
 * 5. Volcanic placement (rare, high elevation, high temperature)
 * 6. Ocean depth classification
 *
 * NFP #1 Tunability: All thresholds and constants in constants.ts.
 * NFP #2 Inspectability: All terrain assignments stored in ctx.terrain[].
 * NFP #3 Determinism: fractalNoise with seed offsets — no external PRNG state consumed.
 * NFP #4 Fail-soft: Falls back to classifyBiome result for any unhandled case.
 */
import { classifyBiome, ELEV, TEMP, VOLCANO_CHANCE } from '../../terrain';
import { fractalNoise } from '../../../lib/prng';
import { hexDistance } from '../../../lib/hexMath';
import {
  PASS_SEED_BIOME,
  SEA_LEVEL,
  WETLAND_MOISTURE_THRESHOLD,
  WETLAND_ELEVATION_MAX,
  WETLAND_RIVER_MOUTH_RADIUS,
  WETLAND_LAKE_SHORE_RADIUS,
  DESERT_SUBTYPE_NOISE_SCALE,
  VOLCANO_MIN_ELEVATION,
  VOLCANO_MIN_TEMPERATURE,
} from '../constants';
import type { WorldGenContext } from '../types';
import type { TerrainType, HexCoord } from '../../../types';

// ─── Helpers ─────────────────────────────────────────────────────

function getNeighborCoords(col: number, row: number, cols: number, rows: number): HexCoord[] {
  const isOddCol = col % 2 === 1;
  const dirs = isOddCol
    ? [
        [1, 1], [1, 0],
        [0, -1], [-1, 0],
        [-1, 1], [0, 1],
      ]
    : [
        [1, 0], [1, -1],
        [0, -1], [-1, -1],
        [-1, 0], [0, 1],
      ];

  const result: HexCoord[] = [];
  for (const [dc, dr] of dirs) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
      result.push({ col: nc, row: nr });
    }
  }
  return result;
}

// ─── Desert sub-type selection ────────────────────────────────────

/** Map base desert terrain to a sub-type using fractalNoise */
function selectDesertSubtype(col: number, row: number, seed: number): TerrainType {
  const raw = fractalNoise(
    col * DESERT_SUBTYPE_NOISE_SCALE,
    row * DESERT_SUBTYPE_NOISE_SCALE,
    seed + PASS_SEED_BIOME,
    2,
    0.5,
  );
  // Normalize from [-1, 1] to [0, 1]
  const n = (raw + 1) / 2;

  if (n < 0.2) return 'sand_dunes';
  if (n < 0.4) return 'desert'; // sandy desert (base)
  if (n < 0.6) return 'rocky_desert';
  if (n < 0.8) return 'badlands';
  return 'rocky_desert'; // fifth variant — closest to hardened clay
}

// ─── Elevation overrides ──────────────────────────────────────────

function isHighlandType(terrain: TerrainType): boolean {
  return (
    terrain === 'hills' ||
    terrain === 'mountains' ||
    terrain === 'high_mountains' ||
    terrain === 'plateau' ||
    terrain === 'mountain_pass' ||
    terrain === 'forested_hills' ||
    terrain === 'glacier' ||
    terrain === 'tundra' ||
    terrain === 'arctic' ||
    terrain === 'snow_fields'
  );
}

function isForestType(terrain: TerrainType): boolean {
  return (
    terrain === 'temperate_forest' ||
    terrain === 'dense_forest' ||
    terrain === 'boreal_forest' ||
    terrain === 'jungle' ||
    terrain === 'tropical_forest' ||
    terrain === 'evergreen_forest' ||
    terrain === 'light_forest' ||
    terrain === 'forested_hills'
  );
}

function applyElevationOverride(
  col: number,
  row: number,
  ctx: WorldGenContext,
  baseTerrain: TerrainType,
  seed: number,
): TerrainType {
  const { cols, rows } = ctx;
  const idx = row * cols + col;
  const elev = ctx.elevation[idx];

  // Very high mountains
  if (elev >= ELEV.HIGH_MOUNTAINS) {
    // Check for volcanic placement
    if (
      elev > VOLCANO_MIN_ELEVATION &&
      ctx.temperature[idx] > VOLCANO_MIN_TEMPERATURE
    ) {
      // Deterministic integer hash for volcano placement.
      // Produces uniform [0, 1) using mulberry32-style bit mixing.
      let h = (col * 374761393 + row * 668265263 + seed * 1274126177) | 0;
      h = Math.imul(h ^ (h >>> 13), h | 1);
      h = (h ^ (h >>> 15)) >>> 0;
      const hash = h / 4294967296;
      if (hash < VOLCANO_CHANCE) return 'volcano';
    }
    return 'high_mountains';
  }

  // Mountains
  if (elev >= ELEV.HIGHLAND) {
    // Check for plateau: high elevation + neighbors at similar elevation (variance < 0.05)
    const neighbors = getNeighborCoords(col, row, cols, rows);
    if (neighbors.length >= 4) {
      let neighborElevSum = 0;
      let neighborElevSqSum = 0;
      let validCount = 0;
      for (const n of neighbors) {
        const nElev = ctx.elevation[n.row * cols + n.col];
        if (nElev >= ELEV.HIGHLAND * 0.8) { // neighbor also high
          neighborElevSum += nElev;
          neighborElevSqSum += nElev * nElev;
          validCount++;
        }
      }
      if (validCount >= 4) {
        const mean = neighborElevSum / validCount;
        const variance = neighborElevSqSum / validCount - mean * mean;
        if (variance < 0.0025) return 'plateau'; // flat highland plateau
      }
    }

    // Check for mountain pass: local minimum along ridge (lower than all 6 neighbors)
    const isLocalMin = neighbors.every(n => {
      const nElev = ctx.elevation[n.row * cols + n.col];
      return nElev >= elev;
    });
    if (isLocalMin && neighbors.length === 6 && elev < ELEV.HIGH_MOUNTAINS) {
      return 'mountain_pass';
    }

    // Forested hills override
    if (isForestType(baseTerrain)) return 'forested_hills';

    return 'mountains';
  }

  // Mid-highland: use classifyBiome result unless it's lowland
  if (elev >= ELEV.MID) {
    if (!isHighlandType(baseTerrain) && !isForestType(baseTerrain)) {
      return 'hills';
    }
  }

  return baseTerrain;
}

// ─── Wetland overrides ────────────────────────────────────────────

/** Find ocean/lake hexes that a river hex drains into (simple: check if adjacent ocean/lake) */
function isNearRiverMouth(col: number, row: number, ctx: WorldGenContext): boolean {
  const { cols, rows } = ctx;
  const idx = row * cols + col;
  if (!ctx.hasRiver[idx]) return false;

  const neighbors = getNeighborCoords(col, row, cols, rows);
  for (const n of neighbors) {
    const nIdx = n.row * cols + n.col;
    // River mouth = river hex adjacent to ocean or lake
    if (ctx.isOcean[nIdx] || ctx.lakeIds[nIdx] >= 0) {
      return true;
    }
  }
  return false;
}

/** Check if hex is within WETLAND_LAKE_SHORE_RADIUS of a lake */
function isNearLakeShore(col: number, row: number, ctx: WorldGenContext): boolean {
  const { cols, rows } = ctx;
  const r1 = Math.max(0, row - WETLAND_LAKE_SHORE_RADIUS);
  const r2 = Math.min(rows - 1, row + WETLAND_LAKE_SHORE_RADIUS);
  const c1 = Math.max(0, col - WETLAND_LAKE_SHORE_RADIUS);
  const c2 = Math.min(cols - 1, col + WETLAND_LAKE_SHORE_RADIUS);

  for (let nr = r1; nr <= r2; nr++) {
    for (let nc = c1; nc <= c2; nc++) {
      if (ctx.lakeIds[nr * cols + nc] >= 0) return true;
    }
  }
  return false;
}

function applyWetlandOverride(col: number, row: number, ctx: WorldGenContext): TerrainType | null {
  const { cols } = ctx;
  const idx = row * cols + col;
  const elev = ctx.elevation[idx];
  const moisture = ctx.moisture[idx];
  const temperature = ctx.temperature[idx];

  if (elev >= WETLAND_ELEVATION_MAX || moisture < WETLAND_MOISTURE_THRESHOLD) return null;

  // Near river mouth → floodplain
  if (ctx.hasRiver[idx] === 1 && isNearRiverMouth(col, row, ctx)) return 'floodplain';

  // Also check hexes near river mouths within radius
  const neighbors = getNeighborCoords(col, row, ctx.cols, ctx.rows);
  for (const n of neighbors) {
    if (isNearRiverMouth(n.col, n.row, ctx)) return 'floodplain';
  }

  // Near lake shore → marsh
  if (isNearLakeShore(col, row, ctx)) return 'marsh';

  // General wet lowlands — temperature determines swamp vs moor_bog
  if (temperature < TEMP.COLD) return 'moor_bog';
  return 'swamp';
}

// ─── Ocean depth classification ───────────────────────────────────

function classifyOceanDepth(elevation: number): TerrainType {
  if (elevation < ELEV.DEEP_OCEAN) return 'deep_ocean';
  if (elevation < ELEV.SHALLOWS) return 'ocean';
  return 'coastal_shallows';
}

// ─── Main pass ───────────────────────────────────────────────────

export function runBiomePass(ctx: WorldGenContext): void {
  const { cols, rows, seed } = ctx;
  const total = cols * rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const elev = ctx.elevation[idx];
      const temp = ctx.temperature[idx];
      const moist = ctx.moisture[idx];

      // Ocean hexes: classify by depth
      if (ctx.isOcean[idx]) {
        ctx.terrain[idx] = classifyOceanDepth(elev);
        continue;
      }

      // Preserve lake terrain set by hydrology pass
      if (ctx.lakeIds[idx] >= 0) {
        ctx.terrain[idx] = 'lake';
        continue;
      }

      // Base Whittaker classification
      let terrain = classifyBiome(elev, temp, moist);

      // Elevation overrides (highlands take precedence)
      terrain = applyElevationOverride(col, row, ctx, terrain, seed);

      // Wetland overrides (only for non-highland land hexes)
      if (
        elev < WETLAND_ELEVATION_MAX &&
        !isHighlandType(terrain) &&
        terrain !== 'desert' &&
        terrain !== 'rocky_desert' &&
        terrain !== 'sand_dunes' &&
        terrain !== 'badlands'
      ) {
        const wetlandType = applyWetlandOverride(col, row, ctx);
        if (wetlandType !== null) {
          terrain = wetlandType;
        }
      }

      // Desert sub-type selection
      if (terrain === 'desert') {
        terrain = selectDesertSubtype(col, row, seed);
      }

      ctx.terrain[idx] = terrain;
    }
  }
}
