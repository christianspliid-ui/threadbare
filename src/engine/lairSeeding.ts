/**
 * Lair Seeding — places monster lairs in the world graph at worldgen time.
 *
 * Lairs are seeded based on the province danger gradient:
 *   capital   → 0% density
 *   heartland → 0.5% density
 *   borderland → 3% density
 *   wilderness → 8% density
 *
 * A minimum separation distance prevents clustering. Each lair is seeded as
 * a 'location' graph node with locationSubtype='lair' and an initial LairTier
 * of 'minor'. The dominant sphere is derived from the hex's terrain type.
 *
 * Plan: m2.5-01
 * NFP #1 Tunability: all density and separation values are in LAIR_SEEDING_CONSTANTS.
 * NFP #3 Determinism: uses mulberry32(seed + PASS_SEED_LAIRS) for repeatable placement.
 * NFP #4 Fail-soft: bad provinceRoles data → treats tile as wilderness (permissive).
 */

import { mulberry32 } from '../lib/prng';
import { PASS_SEED_LAIRS } from './worldgen/constants';
import {
  PROVINCE_ROLE_CAPITAL,
  PROVINCE_ROLE_HEARTLAND,
  PROVINCE_ROLE_BORDERLAND,
} from './worldgen/types';
import type { WorldGraph } from './graph';
import type { HexTile, SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { DangerZone } from '../types/monster';
import { seedHexSphereAffinity } from './sphereAffinity';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Lair seeding tunable constants.
 * All density values are per-hex spawn probability rolls.
 * NFP #1: Change game difficulty by adjusting these values alone.
 */
export const LAIR_SEEDING_CONSTANTS = {
  /** Spawn probability per eligible wilderness hex */
  WILDERNESS_LAIR_DENSITY: 0.08,
  /** Spawn probability per eligible borderland hex */
  BORDERLAND_LAIR_DENSITY: 0.03,
  /** Spawn probability per eligible heartland hex */
  HEARTLAND_LAIR_DENSITY: 0.005,
  /** No lairs in capital zones */
  CAPITAL_LAIR_DENSITY: 0.0,
  /** Minimum Manhattan distance between any two lairs (hexes) */
  MIN_LAIR_SEPARATION: 3,
} as const;

// ─── Water terrain check ──────────────────────────────────────────────────────

/** Terrain types that cannot host lairs */
const WATER_TERRAINS = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast',
  'lake', 'river', 'reef',
]);

// ─── Province role → danger zone ─────────────────────────────────────────────

/**
 * Map numeric province role to DangerZone.
 * Values outside 0-2 (e.g. unassigned wilderness tiles) map to 'wilderness'.
 */
function roleToDangerZone(role: number): DangerZone {
  switch (role) {
    case PROVINCE_ROLE_CAPITAL:    return 'capital';
    case PROVINCE_ROLE_HEARTLAND:  return 'heartland';
    case PROVINCE_ROLE_BORDERLAND: return 'borderland';
    default:                       return 'wilderness';
  }
}

/**
 * Map DangerZone to lair spawn density.
 */
function dangerZoneToDensity(zone: DangerZone): number {
  switch (zone) {
    case 'capital':    return LAIR_SEEDING_CONSTANTS.CAPITAL_LAIR_DENSITY;
    case 'heartland':  return LAIR_SEEDING_CONSTANTS.HEARTLAND_LAIR_DENSITY;
    case 'borderland': return LAIR_SEEDING_CONSTANTS.BORDERLAND_LAIR_DENSITY;
    case 'wilderness': return LAIR_SEEDING_CONSTANTS.WILDERNESS_LAIR_DENSITY;
  }
}

// ─── Dominant sphere derivation ───────────────────────────────────────────────

/**
 * Pick the dominant sphere for a hex based on its terrain affinity.
 * Uses seedHexSphereAffinity to get scores, then picks the highest.
 * Falls back to 'force' if all scores are zero.
 */
function getDominantSphere(terrain: string): SphereName {
  const affinity = seedHexSphereAffinity(terrain);
  let bestSphere: SphereName = 'force';
  let bestScore = -1;
  for (const sphere of SPHERE_NAMES) {
    const score = affinity.scores[sphere] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestSphere = sphere;
    }
  }
  return bestSphere;
}

// ─── Lair seeding ────────────────────────────────────────────────────────────

/**
 * Seed monster lairs into the world graph based on province danger gradient.
 *
 * Called during game initialization, after sphere affinity seeding and before
 * loc.start placement.
 *
 * @param graph         - World graph to mutate (lairs are added as location nodes)
 * @param provinceRoles - Uint8Array mapping tile index → province role (0=capital, 1=heartland, 2=borderland)
 * @param tiles         - HexTile array from worldgen (same order as provinceRoles)
 * @param seed          - World seed for deterministic PRNG
 * @param cols          - Grid column count (used for tile index = col + row * cols)
 */
export function seedMonsterLairs(
  graph: WorldGraph,
  provinceRoles: Uint8Array,
  tiles: HexTile[],
  seed: number,
  cols: number,
): void {
  const rng = mulberry32(seed + PASS_SEED_LAIRS);

  // Track placed lair coordinates for separation check
  const placedLairs: Array<{ col: number; row: number }> = [];
  let lairIndex = 0;

  for (const tile of tiles) {
    const { col, row } = tile.coord;

    // Skip water tiles — lairs only on land
    if (WATER_TERRAINS.has(tile.terrain)) {
      continue;
    }

    // Get province role and map to danger zone
    const idx = col + row * cols;
    const role = provinceRoles[idx] ?? 3; // default to wilderness if out of bounds
    const dangerZone = roleToDangerZone(role);
    const density = dangerZoneToDensity(dangerZone);

    // Capital zones never get lairs
    if (density === 0) {
      rng(); // consume RNG to maintain determinism downstream
      continue;
    }

    // Roll for lair spawning
    const roll = rng();
    if (roll >= density) {
      continue;
    }

    // Check minimum separation from existing lairs (Manhattan distance)
    const tooClose = placedLairs.some(placed => {
      const dist = Math.abs(col - placed.col) + Math.abs(row - placed.row);
      return dist < LAIR_SEEDING_CONSTANTS.MIN_LAIR_SEPARATION;
    });
    if (tooClose) {
      continue;
    }

    // Derive dominant sphere from terrain
    const dominantSphere = getDominantSphere(tile.terrain);

    // Create lair location node
    const lairId = `lair_${lairIndex}`;
    graph.addNode({
      id: lairId,
      type: 'location',
      name: `Lair ${lairIndex}`,
      properties: {
        locationType: 'lair',
        locationSubtype: 'lair',
        hexCol: col,
        hexRow: row,
        terrain: tile.terrain,
        lairTier: 'minor',
        dominantSphere,
        spawnedAtTick: 0,
        lastEscalationTick: 0,
        dangerZone,
      },
    });

    placedLairs.push({ col, row });
    lairIndex++;
  }
}
