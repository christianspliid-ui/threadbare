import type { HexTile, TerrainType } from '../types';
import { generateGeoField } from './forceField';
import { classifyBiome } from './terrain';
import type { HexCoord } from '../types';

// ─── River/Lake constants ────────────────────────────────────────
export const RIVER_SOURCE_COUNT_MIN = 4;
export const RIVER_SOURCE_COUNT_MAX = 8;
export const RIVER_MIN_LENGTH = 4;
export const RIVER_SOURCE_ELEVATION_THRESHOLD = 0.7;
/** Min hex distance between river spring sources (prevents parallel rivers) */
export const RIVER_SOURCE_MIN_DISTANCE = 3;

export const LAKE_SIZE_MIN = 1;
export const LAKE_SIZE_MAX = 5;
export const GREAT_LAKE_SIZE_MAX = 12;
export const GREAT_LAKE_COUNT = 1;
export const LAKE_BLOB_RADIUS_FACTOR = 0.6;

// ─── Depression filling constants ────────────────────────────────
/** Tiny elevation bump per filled hex for strict downhill ordering */
export const DRAIN_EPSILON = 0.0001;
/** Min filled-hex cluster size to become a lake when a river flows through */
export const DEPRESSION_LAKE_MIN_SIZE = 2;

// ─── Coastal continuation constants ─────────────────────────────
/** Max shallows hexes a river traverses before giving up */
export const RIVER_COASTAL_MAX_STEPS = 6;

// ─── Lake outflow constants ─────────────────────────────────────
/** Min outflow river length to keep (prevents trivial stubs) */
export const LAKE_OUTFLOW_MIN_LENGTH = 2;

// ─── River forking constants ────────────────────────────────────
/** Probability a river forks when entering coastal shallows */
export const RIVER_FORK_COASTAL_CHANCE = 0.4;
/** Max number of forks a single river can produce */
export const RIVER_FORK_MAX_PER_RIVER = 2;
/** Min remaining path length before a fork is allowed */
export const RIVER_FORK_MIN_REMAINING_LENGTH = 3;

// ─── River merging constants ────────────────────────────────────
/** When routing, if an adjacent hex has a river, bias toward merging into it */
export const RIVER_MERGE_PROXIMITY_BIAS = 0.4;

// ─── Types ───────────────────────────────────────────────────────

export interface RiverPath {
  id: string;
  hexes: HexCoord[];
}

export interface WorldGenData {
  cols: number;
  rows: number;
  seed: number;

  elevation: Float32Array;
  temperature: Float32Array;
  moisture: Float32Array;
  isOcean: Uint8Array;
  terrain: TerrainType[];
  hasRiver: Uint8Array;
  riverPaths: RiverPath[];
  lakeIds: Int16Array;

  /** Filled elevation surface for river routing (computed by fillDepressions) */
  drainageElevation: Float32Array;
  /** Per-hex fill depth: drainageElevation - elevation (computed by fillDepressions) */
  filledDepth: Float32Array;
}

// ─── Factory ─────────────────────────────────────────────────────

export function createWorldGenData(
  cols: number,
  rows: number,
  seed: number,
): WorldGenData {
  const total = cols * rows;
  const geoField = generateGeoField(cols, rows, seed);

  const elevation = new Float32Array(total);
  const temperature = new Float32Array(total);
  const moisture = new Float32Array(total);
  const isOcean = new Uint8Array(total);
  const terrain: TerrainType[] = new Array(total);
  const hasRiver = new Uint8Array(total);
  const lakeIds = new Int16Array(total).fill(-1);
  const drainageElevation = new Float32Array(total);
  const filledDepth = new Float32Array(total);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const geo = geoField.get(`${col},${row}`);
      // RC-217: Fail-soft fallback — missing geo data produces ocean instead of crashing
      const safeGeo = geo ?? { elevation: 0.1, temperature: 0.5, moisture: 0.5 };

      elevation[idx] = safeGeo.elevation;
      temperature[idx] = safeGeo.temperature;
      moisture[idx] = safeGeo.moisture;

      const biome = classifyBiome(safeGeo.elevation, safeGeo.temperature, safeGeo.moisture);
      terrain[idx] = biome;
      isOcean[idx] = (biome === 'ocean' || biome === 'coastal_shallows') ? 1 : 0;
    }
  }

  return {
    cols, rows, seed,
    elevation, temperature, moisture, isOcean,
    terrain, hasRiver,
    riverPaths: [],
    lakeIds,
    drainageElevation,
    filledDepth,
  };
}

// ─── Converter ───────────────────────────────────────────────────

export function toHexTiles(data: WorldGenData): HexTile[] {
  const tiles: HexTile[] = [];
  for (let row = 0; row < data.rows; row++) {
    for (let col = 0; col < data.cols; col++) {
      const idx = row * data.cols + col;
      const tile: HexTile = {
        coord: { col, row },
        geoParams: {
          elevation: data.elevation[idx],
          temperature: data.temperature[idx],
          moisture: data.moisture[idx],
        },
        terrain: data.terrain[idx],
      };
      if (data.hasRiver[idx]) {
        tile.hasRiver = true;
      }
      tiles.push(tile);
    }
  }
  return tiles;
}
