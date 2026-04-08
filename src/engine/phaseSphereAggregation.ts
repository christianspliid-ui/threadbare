/**
 * Phase: Sphere Aggregation
 *
 * Each tick, iterates all graph entities with sphereAffinity and computes a
 * weighted sum — the global World-Soul aggregate. Different entity types
 * contribute different weights: hex-scale locations carry 1.0, agents 0.2,
 * factions 0.1, etc.
 *
 * The aggregate is stored on `state.worldSoul.aggregate` and the normalized
 * form is mirrored into `FundamentState.sphereWeights` for backward compat
 * with existing systems that read sphere weights from the fundament.
 *
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { GameState } from '../types/gameState';
import type { WorldSoulState, SphereAggregate } from '../types/worldSoul';
import type { SphereAffinity } from '../types/sphereAffinity';
import { getNodeSphereAffinity } from './sphereAffinity';

/**
 * Type guard: returns true only if the value is a well-formed SphereAffinity object
 * with a `scores` Record<SphereName, number>.
 *
 * Guards against legacy code that stores a SphereName string in the sphereAffinity
 * property (e.g., worldSeed.ts artifact nodes store a bare sphere name string).
 */
function isValidSphereAffinity(value: unknown): value is SphereAffinity {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.scores === 'object' && v.scores !== null && typeof v.progress === 'object' && v.progress !== null;
}

// Re-export SphereAggregate for convenience (defined in types/worldSoul.ts)
export type { SphereAggregate } from '../types/worldSoul';

// ─── Entity Weight Constants (NFP #1: Tunability) ────────────────────

/**
 * Per entity-type contribution weight to global sphere aggregate.
 * Higher weight = entity type more strongly shapes the World-Soul.
 *
 * | Entity | Weight | Rationale |
 * |--------|--------|-----------|
 * | hex/location | 1.0 | Primary geographic entity — strongest signal |
 * | artifact | 0.3 | Imbued items carry significant sphere signature |
 * | agent | 0.2 | Individuals shape their environment but don't dominate it |
 * | culture | 0.1 | Aggregated cultural sphere character, already diluted |
 * | faction | 0.1 | Faction is an abstraction over individual members |
 */
export const ENTITY_AGGREGATE_WEIGHT: Record<string, number> = {
  hex: 1.0,
  location: 1.0,
  artifact: 0.3,
  agent: 0.2,
  culture: 0.1,
  faction: 0.1,
};

// ─── Actor type → weight mapping ─────────────────────────────────────

/** Map actor subtypes to their aggregate weight */
function actorTypeWeight(actorType: string | undefined): number | null {
  switch (actorType) {
    case 'individual':
    case 'ascendant':
    case 'god':
      return ENTITY_AGGREGATE_WEIGHT.agent;
    case 'faction':
      return ENTITY_AGGREGATE_WEIGHT.faction;
    case 'culture':
      return ENTITY_AGGREGATE_WEIGHT.culture;
    default:
      return null; // unknown actor type — skip
  }
}

// ─── Normalization ────────────────────────────────────────────────────

/**
 * Normalize a sphere totals record to sum to 1.0.
 * If all totals are zero (e.g., empty world), returns equal distribution (1/8 each).
 */
export function normalizeAggregate(
  totals: Record<SphereName, number>
): Record<SphereName, number> {
  const total = SPHERE_NAMES.reduce((sum, s) => sum + totals[s], 0);
  const result = {} as Record<SphereName, number>;
  if (total === 0) {
    const equal = 1.0 / SPHERE_NAMES.length;
    for (const s of SPHERE_NAMES) result[s] = equal;
  } else {
    for (const s of SPHERE_NAMES) result[s] = totals[s] / total;
  }
  return result;
}

// ─── Dominant Sphere ──────────────────────────────────────────────────

/**
 * Return the sphere with the highest total, or null if all are zero.
 */
export function getDominantSphere(totals: Record<SphereName, number>): SphereName | null {
  let dominant: SphereName | null = null;
  let highest = 0;
  for (const s of SPHERE_NAMES) {
    if (totals[s] > highest) {
      highest = totals[s];
      dominant = s;
    }
  }
  return dominant;
}

// ─── Orchestrator Phase ───────────────────────────────────────────────

/**
 * Compute the global World-Soul aggregate from all entity sphere scores.
 *
 * - Iterates all graph nodes with sphereAffinity
 * - Weights each by ENTITY_AGGREGATE_WEIGHT (location=1.0, agent=0.2, etc.)
 * - Computes totalBySphere, normalizes to sphereWeights, computes axes
 * - Stores full SphereAggregate on worldSoul.aggregate
 * - Mirrors normalized weights to FundamentState.sphereWeights (backward compat)
 *
 * Returns: Partial<GameState> with updated worldSoul.
 * Fail-soft: nodes without sphereAffinity are silently skipped.
 */
export function computeSphereAggregate(graph: GameState['graph']): SphereAggregate {
  // Initialize totals
  const totals = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) totals[s] = 0;
  let entityCount = 0;

  // ── Location nodes ────────────────────────────────────────────────
  const locationNodes = graph.getNodesByType('location');
  for (const node of locationNodes) {
    const raw = getNodeSphereAffinity(node);
    if (!isValidSphereAffinity(raw)) continue; // skip nodes without proper SphereAffinity
    const weight = ENTITY_AGGREGATE_WEIGHT.location;
    entityCount++;
    for (const s of SPHERE_NAMES) {
      totals[s] += (raw.scores[s] ?? 0) * weight;
    }
  }

  // ── Actor nodes ────────────────────────────────────────────────────
  const actorNodes = graph.getNodesByType('actor');
  for (const node of actorNodes) {
    const raw = getNodeSphereAffinity(node);
    if (!isValidSphereAffinity(raw)) continue;
    const actorType = node.properties?.actorType as string | undefined;
    const weight = actorTypeWeight(actorType);
    if (weight === null) continue; // unknown actor type — skip
    entityCount++;
    for (const s of SPHERE_NAMES) {
      totals[s] += (raw.scores[s] ?? 0) * weight;
    }
  }

  // ── Artifact nodes ─────────────────────────────────────────────────
  // Note: Some legacy artifacts store a bare SphereName string in sphereAffinity
  // (from worldSeed.ts). These are skipped by isValidSphereAffinity.
  const artifactNodes = graph.getNodesByType('artifact');
  for (const node of artifactNodes) {
    const raw = getNodeSphereAffinity(node);
    if (!isValidSphereAffinity(raw)) continue;
    const weight = ENTITY_AGGREGATE_WEIGHT.artifact;
    entityCount++;
    for (const s of SPHERE_NAMES) {
      totals[s] += (raw.scores[s] ?? 0) * weight;
    }
  }

  // ── Compute aggregate ──────────────────────────────────────────────
  const dominantSphere = getDominantSphere(totals);
  const normalizedWeights = normalizeAggregate(totals);

  return {
    totalBySphere: { ...totals },
    dominantSphere,
    entityCount,
  };
}

export function phaseSphereAggregation(state: GameState): Partial<GameState> {
  const aggregate = computeSphereAggregate(state.graph);
  const normalizedWeights = normalizeAggregate(aggregate.totalBySphere);

  // ── Update worldSoul ───────────────────────────────────────────────
  const currentWorldSoul = state.worldSoul;
  const updatedWorldSoul: WorldSoulState = {
    ...currentWorldSoul,
    fundament: {
      ...currentWorldSoul.fundament,
      sphereWeights: normalizedWeights,
    },
    aggregate,
  };

  return { worldSoul: updatedWorldSoul };
}
