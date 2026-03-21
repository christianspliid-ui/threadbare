/**
 * Pass 08: Biome Adjacency Smoothing
 *
 * Eliminates impossible biome transitions by replacing hexes involved in
 * illegal adjacency pairs with appropriate transition biomes.
 *
 * NFP #1 Tunability: SMOOTHING_MAX_ITERATIONS and SMOOTHING_MAX_PERCENT in constants.ts.
 * NFP #2 Inspectability: ctx.terrain[] updated in-place; illegal pair table is explicit.
 * NFP #3 Determinism: No PRNG — deterministic based on terrain state.
 * NFP #4 Fail-soft: Caps at SMOOTHING_MAX_ITERATIONS; stops early if converged.
 */
import {
  SMOOTHING_MAX_ITERATIONS,
  SMOOTHING_MAX_PERCENT,
} from '../constants';
import type { WorldGenContext } from '../types';
import type { TerrainType } from '../../../types';

// ─── Illegal adjacency pairs ──────────────────────────────────────

/**
 * Set of illegal biome adjacency pairs (stored as "typeA|typeB" — both orderings).
 * Pairs here cannot be direct neighbors in the final map.
 */
const ILLEGAL_ADJACENCY_PAIRS: Array<[TerrainType, TerrainType]> = [
  ['desert', 'dense_forest'],
  ['desert', 'tropical_forest'],
  ['desert', 'jungle'],
  ['desert', 'swamp'],
  ['sand_desert' as TerrainType, 'dense_forest'],
  ['sand_desert' as TerrainType, 'tropical_forest'],
  ['sand_desert' as TerrainType, 'swamp'],
  ['sand_dunes', 'dense_forest'],
  ['sand_dunes', 'tropical_forest'],
  ['tundra', 'tropical_forest'],
  ['tundra', 'jungle'],
  ['tundra', 'desert'],
  ['tundra', 'sand_dunes'],
  ['glacier', 'desert'],
  ['glacier', 'tropical_forest'],
  ['glacier', 'jungle'],
  ['glacier', 'savanna'],
  ['snow_fields', 'tropical_forest'],
  ['snow_fields', 'jungle'],
  ['snow_fields', 'desert'],
  ['arctic', 'tropical_forest'],
  ['arctic', 'jungle'],
  ['arctic', 'desert'],
  ['arctic', 'savanna'],
  ['rocky_desert', 'dense_forest'],
  ['rocky_desert', 'tropical_forest'],
  ['badlands', 'dense_forest'],
  ['badlands', 'tropical_forest'],
];

const ILLEGAL_ADJACENCIES = new Set<string>();
for (const [a, b] of ILLEGAL_ADJACENCY_PAIRS) {
  ILLEGAL_ADJACENCIES.add(`${a}|${b}`);
  ILLEGAL_ADJACENCIES.add(`${b}|${a}`);
}

function isIllegal(a: TerrainType, b: TerrainType): boolean {
  return ILLEGAL_ADJACENCIES.has(`${a}|${b}`);
}

// ─── Transition biome lookup ──────────────────────────────────────

/**
 * Given a hex with an illegal adjacency, returns a transition biome
 * that is compatible with both neighbors.
 */
function resolveTransition(terrain: TerrainType, neighborTerrain: TerrainType): TerrainType {
  // Desert + forest → savanna or steppe
  if (
    (terrain === 'desert' || terrain === 'sand_dunes' || terrain === 'rocky_desert' || terrain === 'badlands') &&
    (neighborTerrain === 'dense_forest' || neighborTerrain === 'tropical_forest' || neighborTerrain === 'jungle')
  ) {
    return 'savanna';
  }
  if (
    (neighborTerrain === 'desert' || neighborTerrain === 'sand_dunes' || neighborTerrain === 'rocky_desert' || neighborTerrain === 'badlands') &&
    (terrain === 'dense_forest' || terrain === 'tropical_forest' || terrain === 'jungle')
  ) {
    return 'savanna';
  }

  // Desert + swamp → grassland
  if (
    (terrain === 'desert' && neighborTerrain === 'swamp') ||
    (terrain === 'swamp' && neighborTerrain === 'desert')
  ) {
    return 'grassland';
  }

  // Tundra + tropical → boreal
  if (
    (terrain === 'tundra' || terrain === 'snow_fields' || terrain === 'arctic') &&
    (neighborTerrain === 'tropical_forest' || neighborTerrain === 'jungle' || neighborTerrain === 'savanna')
  ) {
    return 'boreal_forest';
  }
  if (
    (neighborTerrain === 'tundra' || neighborTerrain === 'snow_fields' || neighborTerrain === 'arctic') &&
    (terrain === 'tropical_forest' || terrain === 'jungle' || terrain === 'savanna')
  ) {
    return 'boreal_forest';
  }

  // Tundra + desert → tundra (keep cold)
  if (
    (terrain === 'tundra' && (neighborTerrain === 'desert' || neighborTerrain === 'sand_dunes')) ||
    ((terrain === 'desert' || terrain === 'sand_dunes') && neighborTerrain === 'tundra')
  ) {
    return 'tundra';
  }

  // Glacier + desert → tundra
  if (
    (terrain === 'glacier' && (neighborTerrain === 'desert' || neighborTerrain === 'savanna')) ||
    ((neighborTerrain === 'glacier') && (terrain === 'desert' || terrain === 'savanna'))
  ) {
    return 'tundra';
  }

  // Glacier + tropical → tundra
  if (
    (terrain === 'glacier' && (neighborTerrain === 'tropical_forest' || neighborTerrain === 'jungle')) ||
    (neighborTerrain === 'glacier' && (terrain === 'tropical_forest' || terrain === 'jungle'))
  ) {
    return 'tundra';
  }

  // Default: use steppe as universal transition
  return 'steppe';
}

// ─── Neighbor helpers ─────────────────────────────────────────────

function getNeighborCoords(
  col: number,
  row: number,
  cols: number,
  rows: number,
): Array<{ col: number; row: number }> {
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

  return dirs
    .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
    .filter(({ col: nc, row: nr }) => nc >= 0 && nc < cols && nr >= 0 && nr < rows);
}

// ─── Main pass ───────────────────────────────────────────────────

export function runSmoothingPass(ctx: WorldGenContext): void {
  const { cols, rows } = ctx;
  const total = cols * rows;

  for (let iteration = 0; iteration < SMOOTHING_MAX_ITERATIONS; iteration++) {
    let changedCount = 0;
    const nextTerrain = ctx.terrain.slice(); // work on a copy

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const terrain = ctx.terrain[idx];

        // Ocean hexes: skip
        if (ctx.isOcean[idx]) continue;

        const neighbors = getNeighborCoords(col, row, cols, rows);

        // Check all neighbors for illegal pairs
        for (const n of neighbors) {
          const nIdx = n.row * cols + n.col;
          if (ctx.isOcean[nIdx]) continue;
          const nTerrain = ctx.terrain[nIdx];

          if (isIllegal(terrain, nTerrain)) {
            // Replace this hex with a transition biome
            const transition = resolveTransition(terrain, nTerrain);
            if (transition !== terrain) {
              nextTerrain[idx] = transition;
              changedCount++;
              break; // Only one change per hex per iteration
            }
          }
        }
      }
    }

    // Apply changes
    for (let i = 0; i < total; i++) {
      ctx.terrain[i] = nextTerrain[i];
    }

    // Early exit if converged
    if (changedCount < total * SMOOTHING_MAX_PERCENT) break;
  }
}
