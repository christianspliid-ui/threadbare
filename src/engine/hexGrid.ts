import type { CosmologyProfile, HexTile } from '../types';
import { WorldGenPipeline } from './worldgen/WorldGenPipeline';
import type { WorldGenContext, WorldGenParams } from './worldgen/types';
import type { RiverPath } from './worldGenData';
import { detectRegionsBorderCost } from './regionDetection';
import { assignPoliticalRegions } from './regionPolitical';
import type { RegionData } from './regionTypes';
import { runFantasyOverlayPass } from './worldgen/passes/pass10-fantasyOverlay';

/**
 * The result of world generation — includes tiles for rendering plus
 * hydrology data (riverPaths, lakeIds) and region data threaded through
 * to the renderer.
 *
 * NFP #2: Inspectability — riverPaths, lakeIds, and regionData allow downstream
 * systems to trace which hexes have river/lake water or belong to which region
 * without re-running worldgen.
 *
 * NFP #4: Fail-soft — regionData is optional (undefined if detection fails).
 */
export interface WorldGenResult {
  tiles: HexTile[];
  riverPaths: RiverPath[];
  lakeIds: Int16Array;
  cols: number;
  rows: number;
  seed: number;
  /** Geographic region assignments. Optional for backward compat — always set by generateWorld(). */
  regionData?: RegionData;
}

/**
 * Generate a complete world using the multi-pass pipeline.
 *
 * This replaces the old single-pass forceField+classifyBiome approach.
 * The pipeline produces full hydrology (rivers, lakes, drainage), climate,
 * biome classification, and validation in one deterministic run.
 *
 * Note: cosmology parameter is accepted for API compatibility.
 * Full cosmology integration (sphere-weighted field generation) is deferred
 * until forceField supports it in the pipeline path.
 */
export function generateWorld(
  cosmology: CosmologyProfile,
  cols: number,
  rows: number,
  seed: number,
): WorldGenResult {
  const params: WorldGenParams = {
    cols,
    rows,
    seed,
    ridgeCount: 4,
    seaLevelThreshold: 0.38,
    landShape: 'continent',
    mountainDensity: 'moderate',
    livingCultures: [],
    lostCultures: [],
  };

  const pipeline = new WorldGenPipeline();
  const ctx = pipeline.run(params);

  // WGEN-14: Fantasy overlay pass — transform biomes based on sphere alignment
  // NFP #4: if cosmology is null/balanced, pass is a no-op
  runFantasyOverlayPass(ctx.terrain, cols, rows, seed, cosmology);

  const tiles = toHexTilesFromContext(ctx);

  // Detect geographic regions using border-cost watershed.
  // Seeds from province capital hexes — each capital anchors one natural region.
  // NFP #4 Fail-soft: if detection fails, regionData is undefined (caller handles).
  let regionData: RegionData | undefined;
  try {
    const { regions, hexRegionId } = detectRegionsBorderCost(
      tiles,
      ctx.riverPaths,
      cols,
      ctx.provinceCapitalHexes,
    );

    // Assign political regions (baronies + kingdoms) from geographic regions + provinces.
    // NFP #4 Fail-soft: if assignment fails, baronies/kingdoms stay empty (Plan 01 state).
    let baronies: RegionData['baronies'] = [];
    let kingdoms: RegionData['kingdoms'] = [];
    let hexBaronyId = new Map<string, number>();
    let hexKingdomId = new Map<string, number>();
    try {
      const political = assignPoliticalRegions(
        regions,
        hexRegionId,
        ctx.provinces,
        ctx.provinceCapitalHexes,
        ctx.provinceIds,
        cols,
        seed,
      );
      baronies = political.baronies;
      kingdoms = political.kingdoms;
      hexBaronyId = political.hexBaronyId;
      hexKingdomId = political.hexKingdomId;
    } catch {
      // NFP #4 Fail-soft: political assignment failure keeps empty baronies/kingdoms
    }

    regionData = {
      geographicRegions: regions,
      baronies,
      kingdoms,
      labels: [],
      hexRegionId,
      hexBaronyId,
      hexKingdomId,
    };
  } catch {
    // NFP #4 Fail-soft: region detection failure must not crash world generation
    regionData = undefined;
  }

  return {
    tiles,
    riverPaths: ctx.riverPaths,
    lakeIds: ctx.lakeIds,
    cols,
    rows,
    seed,
    regionData,
  };
}

/**
 * Convert WorldGenContext to HexTile[] for the Phase 1 renderer.
 * WorldGenContext extends WorldGenData which has all required fields.
 */
function toHexTilesFromContext(ctx: WorldGenContext): HexTile[] {
  const { cols, rows, elevation, temperature, moisture, terrain, hasRiver } = ctx;
  const tiles: HexTile[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const tile: HexTile = {
        coord: { col, row },
        geoParams: {
          elevation: elevation[i],
          temperature: temperature[i],
          moisture: moisture[i],
        },
        terrain: terrain[i],
      };
      if (hasRiver[i] === 1) {
        tile.hasRiver = true;
      }
      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Pipeline-based world generation (for rivers/lakes passes).
 * Returns WorldGenData that can be enriched by passes, then converted to HexTile[].
 * Kept for backward compatibility with tests that use createWorldGenData directly.
 */
export { createWorldGenData, toHexTiles } from './worldGenData';
export type { WorldGenData, RiverPath } from './worldGenData';
