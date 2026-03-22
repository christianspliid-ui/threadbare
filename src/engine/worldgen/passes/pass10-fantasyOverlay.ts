/**
 * pass10-fantasyOverlay — Converts base biomes to magical variants based on sphere alignment.
 *
 * Applied after the pipeline completes, before toHexTilesFromContext.
 * Reads CosmologyProfile sphere weights and probabilistically transforms terrain types.
 *
 * NFP #1: All thresholds are named constants in FANTASY_OVERLAY_CONSTANTS.
 * NFP #3: Uses fractalNoise with PASS_SEED_FANTASY offset for determinism.
 * NFP #4: If cosmology is null/undefined, pass is a no-op.
 */

import type { CosmologyProfile, TerrainType } from '../../../types';
import { fractalNoise } from '../../../lib/prng';
import { PASS_SEED_FANTASY } from '../constants';

export const FANTASY_OVERLAY_CONSTANTS = {
  /** Minimum sphere weight to trigger overlay effects */
  SPHERE_THRESHOLD: 0.65,
  /**
   * Noise floor — hexes whose noise value falls BELOW this threshold are
   * candidates for transformation.  Lower values = fewer hexes transformed.
   */
  OVERLAY_CHANCE: 0.12,
  /** Spatial scale for the noise field (smaller = larger coherent patches) */
  NOISE_SCALE: 0.08,
};

/** Sphere-to-terrain transformation rules. First match per hex wins. */
const OVERLAY_RULES: Array<{
  sphere: keyof CosmologyProfile;
  from: TerrainType[];
  to: TerrainType;
}> = [
  // High entropy → corruption/death
  { sphere: 'entropy', from: ['temperate_forest', 'dense_forest'], to: 'dead_forest' },
  { sphere: 'entropy', from: ['grassland', 'savanna'], to: 'broken_lands' },
  { sphere: 'entropy', from: ['hills', 'forested_hills'], to: 'badlands' },
  { sphere: 'entropy', from: ['tundra', 'snow_fields'], to: 'glacier' },
  // High life → lush overgrowth
  { sphere: 'life', from: ['light_forest', 'temperate_forest'], to: 'tropical_forest' },
  { sphere: 'life', from: ['grassland', 'steppe'], to: 'light_forest' },
  { sphere: 'life', from: ['marsh'], to: 'swamp' },
  // High energy → volcanic activity
  { sphere: 'energy', from: ['rocky_desert', 'badlands'], to: 'volcano' },
  { sphere: 'energy', from: ['mountains', 'high_mountains'], to: 'volcano' },
  // High force → mountainous uplift
  { sphere: 'force', from: ['hills'], to: 'mountains' },
  { sphere: 'force', from: ['plateau'], to: 'high_mountains' },
];

/**
 * Run the fantasy overlay pass in-place on a terrain array.
 *
 * @param terrain  Flat terrain array (modified in place)
 * @param cols     Grid column count
 * @param rows     Grid row count
 * @param seed     World seed (combined with PASS_SEED_FANTASY for unique stream)
 * @param cosmology CosmologyProfile or null/undefined (no-op when absent)
 */
export function runFantasyOverlayPass(
  terrain: TerrainType[],
  cols: number,
  rows: number,
  seed: number,
  cosmology: CosmologyProfile | null | undefined,
): void {
  if (!cosmology) return; // NFP #4 fail-soft — no cosmology = no overlay

  const { SPHERE_THRESHOLD, OVERLAY_CHANCE, NOISE_SCALE } = FANTASY_OVERLAY_CONSTANTS;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const baseTerrain = terrain[idx];

      // Deterministic noise per hex (NFP #3) — combined seed ensures independence
      const rawNoise = fractalNoise(
        col * NOISE_SCALE,
        row * NOISE_SCALE,
        seed + PASS_SEED_FANTASY,
        2,
        0.5,
      );
      // Normalize [-1, 1] → [0, 1]
      const noise = (rawNoise + 1) / 2;

      // Only transform hexes whose noise falls below the chance threshold
      if (noise >= OVERLAY_CHANCE) continue;

      // Check each rule in priority order — first matching rule wins
      for (const rule of OVERLAY_RULES) {
        const sphereWeight = cosmology[rule.sphere];
        if (
          sphereWeight > SPHERE_THRESHOLD &&
          (rule.from as string[]).includes(baseTerrain)
        ) {
          terrain[idx] = rule.to;
          break;
        }
      }
    }
  }
}
