/**
 * Pass 05: Hydrology
 *
 * Integrates the existing hydrology modules into the pipeline:
 * 1. fillDepressions — priority-flood pit-filling to guarantee drainage
 * 2. generateRivers — steepest-descent routing from high-elevation sources
 * 3. promoteDepressionLakes — convert river-fed depressions to lakes
 * 4. generateLakeOutflows — route rivers from lakes to sea
 * 5. Canyon carving (river-carved) — depress elevation along highland rivers
 *
 * The river generation in riverGeneration.ts already includes delta forking
 * (distributaries near coast) via its RIVER_FORK_COASTAL_CHANCE logic.
 *
 * Wetland metadata is handled directly in pass07-biome.ts via:
 * - isNearRiverMouth() — floodplain placement at river mouths
 * - isNearLakeShore() — marsh placement at lake shores
 * Both use ctx.hasRiver and ctx.lakeIds set by this pass.
 *
 * NFP #1 Tunability: All constants in constants.ts.
 * NFP #2 Inspectability: Mutates ctx.hasRiver, ctx.riverPaths, ctx.lakeIds in place.
 * NFP #3 Determinism: Delegates to existing deterministic hydrology modules.
 * NFP #4 Fail-soft: Each sub-step is independent; failures log and continue.
 */
import { fillDepressions } from '../../depressionFilling';
import { generateRivers } from '../../riverGeneration';
import { promoteDepressionLakes } from '../../depressionLakes';
import { generateLakeOutflows } from '../../lakeOutflow';
import { CANYON_DEPTH_FACTOR, SEA_LEVEL } from '../constants';
import type { WorldGenContext, WorldGenParams } from '../types';
import type { TerrainType } from '../../../types';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Carve river-cut canyons: depress elevation along river paths that flow
 * through highland terrain. This creates visible river-carved features.
 *
 * Only applies to rivers flowing through highland (elevation > SEA_LEVEL * 1.5)
 * and only if the river path is long enough to represent a carved valley.
 */
function carveRiverCanyons(ctx: WorldGenContext): void {
  const { cols, elevation, isOcean } = ctx;
  const HIGHLAND_THRESHOLD = SEA_LEVEL * 1.5; // ~0.57

  for (const rp of ctx.riverPaths) {
    if (rp.hexes.length < 5) continue; // Only carve established rivers

    for (const hex of rp.hexes) {
      const idx = hex.row * cols + hex.col;
      if (isOcean[idx]) continue;
      const elev = elevation[idx];
      if (elev <= HIGHLAND_THRESHOLD) continue;

      // Depress elevation slightly — creates visible canyon/valley
      elevation[idx] = clamp(elev - CANYON_DEPTH_FACTOR * 0.1, 0, 1);
      // Also update drainageElevation to stay consistent
      ctx.drainageElevation[idx] = clamp(ctx.drainageElevation[idx] - CANYON_DEPTH_FACTOR * 0.1, 0, 1);
    }
  }
}

/**
 * Seed terrain array with minimal ocean/land classification for hydrology routing.
 *
 * At the point hydrology runs, ctx.terrain is all 'ocean' (pass00-grid default).
 * River routing and depression filling rely on terrain to distinguish ocean from
 * land and to identify coastal_shallows. This pre-seeds terrain from isOcean and
 * elevation so routing works correctly before pass07-biome runs the full classification.
 *
 * Biome pass (pass07-biome) will overwrite these with the full Whittaker classification.
 */
function seedTerrainForHydrology(ctx: WorldGenContext): void {
  const { cols, rows, isOcean, elevation, terrain } = ctx;
  const SHALLOWS_THRESHOLD = 0.42;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (isOcean[idx]) {
        // Classify ocean depth — needed for routing termination logic
        const elev = elevation[idx];
        let oceanType: TerrainType;
        if (elev < 0.2) oceanType = 'deep_ocean';
        else if (elev < SHALLOWS_THRESHOLD) oceanType = 'ocean';
        else oceanType = 'coastal_shallows';
        terrain[idx] = oceanType;
      } else {
        // Any non-ocean placeholder is fine — biome pass will reclassify
        // Use 'grassland' as a neutral land placeholder
        if (terrain[idx] === 'ocean') {
          terrain[idx] = 'grassland';
        }
      }
    }
  }
}

/**
 * Main hydrology pass.
 *
 * Ordering (critical — see RESEARCH.md anti-patterns):
 * 1. seedTerrainForHydrology — seed terrain for routing before biome pass runs
 * 2. fillDepressions — guarantees drainage surface exists for routing
 * 3. generateRivers — uses drainageElevation for steepest-descent routing
 * 4. promoteDepressionLakes — river-fed depressions become lakes
 * 5. generateLakeOutflows — lakes drain via pour-point rivers
 * 6. Canyon carving — depress elevation along highland river paths
 *
 * Delta generation is built into generateRivers (distributary forking near coast).
 * Wetland placement metadata is consumed by pass07-biome (uses hasRiver + lakeIds).
 */
export function runHydrologyPass(ctx: WorldGenContext, _params: WorldGenParams): void {
  // Step 0: Seed terrain for hydrology routing (biome pass hasn't run yet)
  seedTerrainForHydrology(ctx);

  // Step 1: Fill depressions to create guaranteed drainage surface
  // This populates ctx.drainageElevation and ctx.filledDepth
  try {
    fillDepressions(ctx);
  } catch (err) {
    console.error('[Hydrology] fillDepressions failed:', err);
    // Fail-soft: copy elevation to drainageElevation so routing still works
    ctx.drainageElevation.set(ctx.elevation);
  }

  // Step 2: Generate rivers via steepest descent on drainageElevation
  // Populates ctx.hasRiver and ctx.riverPaths (including delta forks)
  try {
    generateRivers(ctx);
  } catch (err) {
    console.error('[Hydrology] generateRivers failed:', err);
    // Fail-soft: no rivers — downstream passes handle empty riverPaths gracefully
  }

  // Step 3: Promote river-fed depressions to lakes
  // Populates ctx.lakeIds and sets terrain to 'lake' for lake hexes
  try {
    promoteDepressionLakes(ctx);
  } catch (err) {
    console.error('[Hydrology] promoteDepressionLakes failed:', err);
  }

  // Step 4: Generate outflow rivers from lakes
  // Adds more river paths from lake pour-points to the sea
  try {
    generateLakeOutflows(ctx);
  } catch (err) {
    console.error('[Hydrology] generateLakeOutflows failed:', err);
  }

  // Step 5: Carve river canyons in highland terrain
  // Slightly depresses elevation along highland river paths for visual variety
  try {
    carveRiverCanyons(ctx);
  } catch (err) {
    console.error('[Hydrology] carveRiverCanyons failed:', err);
  }
}
