import type { TerrainType } from '../../types';

// ---- Tunable Constants ----

// Pass 1: Ocean Mask
export const CONTINENT_COUNT_MIN = 2;
export const CONTINENT_COUNT_MAX = 4;
export const LAND_TARGET_MIN = 0.55;
export const LAND_TARGET_MAX = 0.65;
export const CONTINENT_RADIUS_MIN = 8;
export const CONTINENT_RADIUS_MAX = 18;

// Pass 2: Tectonics
export const FAULT_COUNT_MIN = 3;
export const FAULT_COUNT_MAX = 6;
export const MOUNTAIN_SPINE_WIDTH = 2;
export const FAULT_CONTROL_POINTS = 4;

// Pass 3: Elevation
export const ELEVATION_MOUNTAIN_BASE = 0.85;
export const ELEVATION_FALLOFF_RATE = 0.07;
export const ELEVATION_NOISE_AMPLITUDE = 0.15;

// Pass 4: Temperature
export const LATITUDE_EQUATOR_ROW = 22; // Middle of 45-row grid
export const TEMP_ALTITUDE_PENALTY = 0.3;
export const TEMP_BASE_RANGE = 0.9;

// Pass 5: Moisture
export const WIND_DIRECTION = -1; // -1 = westerly (left to right)
export const MOISTURE_COAST_BONUS = 0.3;
export const RAIN_SHADOW_FACTOR = 0.4;
export const MOISTURE_BASE = 0.2;

// Pass 6: Rivers & Lakes
export const RIVER_SOURCE_COUNT = 8;
export const RIVER_MIN_LENGTH = 5;
export const LAKE_SIZE_MAX = 6;
export const GREAT_LAKE_SIZE_MAX = 15;
export const GREAT_LAKE_CHANCE = 0.15;

// Pass 8: Regions
export const REGION_SIZE_MIN = 8;
export const REGION_SIZE_MAX = 40;

// ---- Data Structures ----

export interface HexGenCell {
  col: number;
  row: number;
  isLand: boolean;
  elevation: number;       // 0..1
  temperature: number;     // 0..1
  moisture: number;        // 0..1
  isMountainSpine: boolean;
  isFaultAdjacent: boolean;
  hasRiver: boolean;
  isLake: boolean;
  terrain: TerrainType | null; // null until Pass 7
  regionId: string | null;     // null until Pass 8
}

export interface WorldGenData {
  cols: number;
  rows: number;
  seed: number;
  cells: HexGenCell[];
  faultLines: FaultLine[];
  rivers: RiverPath[];
  lakes: LakeCluster[];
  regions: GeoRegion[];
}

export interface WorldGenConfig {
  cols: number;
  rows: number;
  seed: number;
  cosmologyTempBias?: number; // -0.2..+0.2 shift from foundation spheres
}

export interface FaultLine {
  id: string;
  controlPoints: Array<{ x: number; y: number }>;
  affectedHexes: Array<{ col: number; row: number }>;
}

export interface RiverPath {
  id: string;
  hexes: Array<{ col: number; row: number }>;
  name: string;
}

export interface LakeCluster {
  id: string;
  hexes: Array<{ col: number; row: number }>;
  isGreatLake: boolean;
  name: string;
}

export interface GeoRegion {
  id: string;
  name: string;
  hexes: Array<{ col: number; row: number }>;
  dominantTerrain: TerrainType;
  averageElevation: number;
}
