import type { CosmologyProfile, HexTile } from '../types';
import { WorldGenPipeline } from './worldgen/WorldGenPipeline';
import type { WorldGenContext, WorldGenParams, Province, CultureForWorldgen } from './worldgen/types';
import type { RiverPath } from './worldGenData';
import { detectRegionsBorderCost, type RegionFeatureType } from './regionDetection';
import { assignPoliticalRegions } from './regionPolitical';
import type { RegionData, RegionCluster } from './regionTypes';
import { runFantasyOverlayPass } from './worldgen/passes/pass10-fantasyOverlay';
import {
  DANGER_CORNER_MARGIN_FRACTION,
  DANGER_CORNER_PEAK,
  DANGER_EDGE_BASELINE,
  DANGER_CENTER_FLOOR,
} from './worldgen/constants';

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
  /**
   * Province role per hex (0=capital, 1=heartland, 2=borderland).
   * Used by lair seeding pass (m2.5) to apply danger gradient.
   * Index = col + row * cols.
   */
  provinceRoles: Uint8Array;
  /**
   * Province ID per hex (-1 = unassigned). Used by culture seeding to
   * map locations → provinces → cultures. Index = col + row * cols.
   */
  provinceIds?: Int16Array;
  /** Province metadata array. Index = province ID. */
  provinces?: Province[];
}

// ── Simple region naming (no graph required) ─────────────────────────────────

/** Feature type display labels for region names */
const FEATURE_LABELS: Record<string, string> = {
  mountain_range: 'Mountains', hill_country: 'Hills', forest: 'Forest',
  plains: 'Plains', desert: 'Desert', wetland: 'Marshes',
  tundra: 'Wastes', river: 'River', lake: 'Lake', sea: 'Sea',
};

const GEO_ADJECTIVES = [
  'Grey', 'Iron', 'Stone', 'Dark', 'White', 'Long', 'Old', 'Black',
  'Silver', 'Ash', 'Red', 'Wind', 'Frost', 'Storm', 'Deep',
];

/** mulberry32 PRNG */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a simple geographic name: "{Adjective} {FeatureType}" */
function generateSimpleRegionName(featureType: RegionFeatureType, id: number, seed: number): string {
  const rng = mulberry32(seed + id * 4919 + 7331);
  const adj = GEO_ADJECTIVES[Math.floor(rng() * GEO_ADJECTIVES.length)];
  const feature = FEATURE_LABELS[featureType] ?? 'Lands';
  return `${adj} ${feature}`;
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
  livingCultures?: CultureForWorldgen[],
  lostCultures?: CultureForWorldgen[],
): WorldGenResult {
  const params: WorldGenParams = {
    cols,
    rows,
    seed,
    ridgeCount: 4,
    seaLevelThreshold: 0.38,
    landShape: 'continent',
    mountainDensity: 'moderate',
    livingCultures: livingCultures ?? [],
    lostCultures: lostCultures ?? [],
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

    // Name geographic regions — detectRegionsBorderCost returns clusters without names.
    // Uses simple wilderness naming (feature-based) since graph isn't available at this stage.
    // NFP #3: Seeded PRNG for deterministic names.
    const namedRegions: RegionCluster[] = regions.map(r => ({
      ...r,
      name: (r as RegionCluster).name ?? generateSimpleRegionName(r.featureType, r.id, seed),
    }));

    regionData = {
      geographicRegions: namedRegions,
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
    provinceRoles: ctx.provinceRoles,
    provinceIds: ctx.provinceIds,
    provinces: ctx.provinces,
  };
}

/**
 * Compute positional danger level for a hex based on proximity to corners and edges.
 * Pure function of position — no PRNG, fully deterministic (NFP #3).
 * Scales automatically with map size via diagonal-fraction radius.
 */
function computeDangerLevel(col: number, row: number, cols: number, rows: number): number {
  const diagonal = Math.sqrt(cols * cols + rows * rows);
  const cornerRadius = diagonal * DANGER_CORNER_MARGIN_FRACTION;

  // Corner danger: Euclidean distance to nearest corner, linear decay
  const cornerCoords = [[0, 0], [cols - 1, 0], [0, rows - 1], [cols - 1, rows - 1]];
  let minCornerDist = Infinity;
  for (const [cx, cy] of cornerCoords) {
    const d = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
    if (d < minCornerDist) minCornerDist = d;
  }
  const cornerDanger = Math.max(0, 1 - minCornerDist / cornerRadius) * DANGER_CORNER_PEAK;

  // Edge danger: distance to nearest map edge, linear decay
  const edgeDist = Math.min(col, row, cols - 1 - col, rows - 1 - row);
  const edgeRadius = Math.min(cols, rows) * 0.25;
  const edgeDanger = Math.max(0, 1 - edgeDist / edgeRadius) * DANGER_EDGE_BASELINE;

  return Math.min(1.0, Math.max(cornerDanger, edgeDanger, DANGER_CENTER_FLOOR));
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
      const danger = computeDangerLevel(col, row, cols, rows);
      if (danger > 0) {
        tile.dangerLevel = danger;
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
