/**
 * Influence Essence economy engine.
 *
 * Manages the divine economy: essence pools, generation from graph state,
 * spending, and pool limits.
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { EssencePool, EssenceGeneration, SphereAlignment } from '../types/influence';
import {
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_WORSHIPPER,
  ESSENCE_PER_PLACE_OF_POWER,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_WORSHIPPER,
} from '../types/influence';
import type { WorldGraph } from './graph';

// ─── Pool Operations ─────────────────────────────────────────────────

/** Create an empty essence pool (all spheres at 0). */
export function createEmptyEssencePool(): EssencePool {
  const pool = {} as EssencePool;
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = 0;
  }
  return pool;
}

/** Check if a pool can afford a given cost in a specific sphere. */
export function canAfford(pool: EssencePool, sphere: SphereName, cost: number): boolean {
  return pool[sphere] >= cost;
}

/**
 * Spend essence from a pool. Returns true if successful, false if insufficient.
 * Mutates pool in place.
 */
export function spendEssence(pool: EssencePool, sphere: SphereName, cost: number): boolean {
  if (pool[sphere] < cost) return false;
  pool[sphere] -= cost;
  return true;
}

/**
 * Add generated essence to pool, capping each sphere at maxEssence.
 * Mutates pool in place.
 */
export function generateEssence(pool: EssencePool, generation: EssenceGeneration, maxEssence: number): void {
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = Math.min(pool[sphere] + generation[sphere], maxEssence);
  }
}

// ─── Generation Computation ──────────────────────────────────────────

/**
 * Distribute a total essence amount across spheres based on alignment.
 * Primary sphere: 35%, Secondary: 25%, remaining 6 split the rest (≈6.67% each).
 */
function distributeByAlignment(total: number, alignment: SphereAlignment): EssenceGeneration {
  const gen = createEmptyEssencePool();
  const primaryShare = total * 0.35;
  const secondaryShare = total * 0.25;
  const remainingShare = total * 0.40;
  const otherSpheres = SPHERE_NAMES.filter(
    (s) => s !== alignment.primary && s !== alignment.secondary
  );
  const perOther = remainingShare / otherSpheres.length;

  gen[alignment.primary] = primaryShare;
  gen[alignment.secondary] = secondaryShare;
  for (const s of otherSpheres) {
    gen[s] = perOther;
  }
  return gen;
}

/**
 * Compute per-tick essence generation for an Ascendant based on graph state.
 *
 * Sources:
 * 1. Base generation: 1.0 essence/tick distributed by sphere alignment
 * 2. Worshippers: +0.1 per worshipper (actors with 'worships' edge to ascendant)
 * 3. Places of power: +0.5 per controlled place of power
 */
export function computeEssenceGeneration(
  graph: WorldGraph,
  ascendantId: string
): EssenceGeneration {
  const node = graph.getNode(ascendantId);
  if (!node) throw new Error(`Ascendant node not found: ${ascendantId}`);

  const alignment = node.properties.sphereAlignment as SphereAlignment;
  if (!alignment) throw new Error(`Ascendant missing sphereAlignment: ${ascendantId}`);

  // 1. Base generation
  let totalRate = BASE_ESSENCE_PER_TICK;

  // 2. Worshipper bonus
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  totalRate += worshipEdges.length * ESSENCE_PER_WORSHIPPER;

  // 3. Places of power bonus
  const controlEdges = graph.getOutgoingEdges(ascendantId, 'controls');
  for (const edge of controlEdges) {
    const loc = graph.getNode(edge.target);
    if (loc && loc.properties.isPlaceOfPower) {
      totalRate += ESSENCE_PER_PLACE_OF_POWER;
    }
  }

  return distributeByAlignment(totalRate, alignment);
}

/**
 * Compute maximum essence pool size for an Ascendant.
 * BASE_MAX_ESSENCE + MAX_ESSENCE_PER_WORSHIPPER per worshipper.
 */
export function computeMaxEssence(graph: WorldGraph, ascendantId: string): number {
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  return BASE_MAX_ESSENCE + worshipEdges.length * MAX_ESSENCE_PER_WORSHIPPER;
}
