import type { HexTile, TerrainType } from '../types';
import { generateGeoField } from './forceField';
import { classifyBiome } from './terrain';
import type { HexCoord } from '../types';

// ─── River/Lake constants ────────────────────────────────────────
export const RIVER_SOURCE_COUNT_MIN = 4;
export const RIVER_SOURCE_COUNT_MAX = 8;
export const RIVER_MIN_LENGTH = 4;
export const RIVER_SOURCE_ELEVATION_THRESHOLD = 0.7;

export const LAKE_SIZE_MIN = 1;
export const LAKE_SIZE_MAX = 5;
export const GREAT_LAKE_SIZE_MAX = 12;
export const GREAT_LAKE_COUNT = 1;
export const LAKE_BLOB_RADIUS_FACTOR = 0.6;

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
