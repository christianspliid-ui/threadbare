import type { CosmologyProfile, HexTile } from '../types';
import { WorldGenPipeline } from './worldgen/WorldGenPipeline';
import type { WorldGenContext, WorldGenParams } from './worldgen/types';

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
  _cosmology: CosmologyProfile,
  cols: number,
  rows: number,
  seed: number,
): HexTile[] {
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

  return toHexTilesFromContext(ctx);
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
