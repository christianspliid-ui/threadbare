/**
 * WorldGen type definitions — interfaces for the multi-pass world generation pipeline.
 *
 * WorldGenContext extends WorldGenData (per-hex typed arrays) with province data,
 * elevation features (ridges, canyons), and continuous field sampling functions
 * needed by Phase 3 coastline rendering.
 *
 * NFP #1 Tunability: All magic numbers live in constants.ts.
 * NFP #2 Inspectability: Ridge and Province interfaces capture generation state for tracing.
 * NFP #3 Determinism: seed + PASS_SEED_* offsets drive all PRNG streams.
 */

import type { WorldGenData } from '../worldGenData';
import type { HexCoord, TerrainType } from '../../types';

// ─── Province ────────────────────────────────────────────────────

/** Province role encoded as integer for Uint8Array storage */
export type ProvinceRole = 'capital' | 'heartland' | 'borderland';

/** Numeric encoding of ProvinceRole for typed array storage */
export const PROVINCE_ROLE_CAPITAL = 0;
export const PROVINCE_ROLE_HEARTLAND = 1;
export const PROVINCE_ROLE_BORDERLAND = 2;

export interface Province {
  id: number;
  cultureId: string | null;    // null = wilderness
  isLost: boolean;             // true = dead culture ruins
  seedHex: HexCoord;
  capitalHex: HexCoord;
  terrainIdentity: TerrainType[]; // preferred biomes for this province
  maxHexes: number;
}

// ─── Elevation features ──────────────────────────────────────────

export interface Ridge {
  spine: HexCoord[];
  orientation: number;  // radians — direction of ridge spine
  forks: HexCoord[][];  // forked sub-spines
}

export interface Canyon {
  path: HexCoord[];
  type: 'river-carved' | 'dry-rift';
  depthFactor: number;  // 0-1, how deep the canyon cuts
}

// ─── WorldGenContext ─────────────────────────────────────────────

/**
 * Extended world generation data context.
 * Passed through all pipeline passes; each pass mutates it in place.
 */
export interface WorldGenContext extends WorldGenData {
  // Province data
  provinceIds: Int16Array;
  provinceRoles: Uint8Array;  // ProvinceRole encoded as 0=capital, 1=heartland, 2=borderland
  provinces: Province[];
  provinceCapitalHexes: HexCoord[];

  // Elevation features
  ridges: Ridge[];
  canyons: Canyon[];

  // Continuous field functions for Phase 3
  sampleElevation: (col: number, row: number) => number;
  sampleTemperature: (col: number, row: number) => number;
  sampleMoisture: (col: number, row: number) => number;
}

// ─── WorldGenParams ──────────────────────────────────────────────

/** Player-tunable generation parameters (exposed as code-level inputs; UI deferred). */
export interface WorldGenParams {
  cols: number;
  rows: number;
  seed: number;
  ridgeCount: number;          // default 4 (3-5 range)
  seaLevelThreshold: number;   // default 0.38 (from ELEV.SEA_LEVEL)
  landShape: 'continent' | 'continents' | 'islands' | 'archipelago' | 'landlocked';
  mountainDensity: 'few' | 'moderate' | 'many';
  // Culture roster provided externally
  livingCultures: CultureForWorldgen[];
  lostCultures: CultureForWorldgen[];
}

/** Minimal culture data needed by worldgen — extracted from full CultureIdentity */
export interface CultureForWorldgen {
  id: string;
  preferredBiomes: TerrainType[];
  toleratedBiomes: TerrainType[];
}
