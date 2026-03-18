/**
 * idleBehavior — personality-driven idle behavior for agents with no
 * encounter scoring above threshold.
 *
 * Heart axis (Loyalty vs Ambition) determines whether an agent drifts
 * toward ambition targets or stays local.
 *
 * ─── Constants ─────────────────────────────────────────────────────
 * | Constant                  | Default | Purpose                                    |
 * |---------------------------|---------|--------------------------------------------|
 * | AMBITION_DRIFT_THRESHOLD  | 0.2     | Minimum ambition to trigger drift behavior |
 * | IDLE_DRIFT_SPEED          | 1       | Hops per idle tick when drifting            |
 * | IDLE_TRIVIAL_PREFERENCE   | 0.8     | Probability loyal agent picks trivial task  |
 * | MAX_AWARENESS_HOPS        | 5       | Max distance to consider for drift targets  |
 *
 * ─── Tracing ──────────────────────────────────────────────────────
 * This module does not emit traces directly — consumers (tick loop)
 * wrap calls and emit trace_idle_decision events.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * | Failure case                  | Fallback                  |
 * |-------------------------------|---------------------------|
 * | Missing agent node            | return { action: 'stay' } |
 * | Missing axiological profile   | treat as 0.0 → stay      |
 * | Missing loyalty_ambition      | treat as 0.0 → stay      |
 * | No ambition edges             | drift to random adjacent  |
 * | No adjacent locations         | stay                      |
 * | No local trivial entries      | stay                      |
 *
 * ─── PRNG ─────────────────────────────────────────────────────────
 * `rng` parameter: used to decide between trivial_local and stay
 * for loyal/neutral agents.
 */

import type { AxiologicalProfile } from '../types/agent';
import type { EncounterCacheEntry } from './encounterCache';
import type { WorldGraph } from './graph';
import type { DistanceMatrix } from './distanceMatrix';
import { getDistance } from './distanceMatrix';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  AMBITION_DRIFT_THRESHOLD,
  IDLE_DRIFT_SPEED,
  IDLE_TRIVIAL_PREFERENCE,
  IDLE_MAX_AWARENESS_HOPS,
} from '../data/agent-behavior-constants';

import {
  AMBITION_DRIFT_THRESHOLD,
  IDLE_DRIFT_SPEED,
  IDLE_TRIVIAL_PREFERENCE,
  IDLE_MAX_AWARENESS_HOPS,
} from '../data/agent-behavior-constants';

/** @deprecated Use IDLE_MAX_AWARENESS_HOPS instead */
export const MAX_AWARENESS_HOPS = IDLE_MAX_AWARENESS_HOPS;

// ─── Types ──────────────────────────────────────────────────────

export interface IdleDecision {
  action: 'drift' | 'trivial_local' | 'stay';
  targetLocationId?: string;  // for drift
  templateId?: string;         // for trivial_local
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Get adjacent location IDs from the graph (bidirectional adjacent edges).
 */
function getAdjacentLocationIds(
  graph: WorldGraph,
  locationId: string,
): string[] {
  const ids = new Set<string>();
  for (const edge of graph.getOutgoingEdges(locationId, 'adjacent')) {
    ids.add(edge.target);
  }
  for (const edge of graph.getIncomingEdges(locationId, 'adjacent')) {
    ids.add(edge.source);
  }
  return [...ids];
}

/**
 * Read loyalty_ambition from an agent's axiological profile.
 * Returns 0.0 (neutral) if profile or field is missing.
 */
function getLoyaltyAmbition(
  graph: WorldGraph,
  agentId: string,
): number {
  const node = graph.getNode(agentId);
  if (!node) return 0.0;

  const profile = node.properties.axiologicalProfile as
    | AxiologicalProfile
    | undefined;
  if (!profile) return 0.0;

  const value = profile.loyalty_ambition;
  if (typeof value !== 'number') return 0.0;

  return value;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Derive a drift target from active ambition milestones.
 *
 * Simplified: if agent has any active ambitions, find the nearest
 * location (within MAX_AWARENESS_HOPS) that isn't the current one.
 * Full milestone→location derivation is deferred to a future pass.
 *
 * Returns the nearest non-current location ID, or null if none found.
 */
export function deriveAmbitionTarget(
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  distanceMatrix: DistanceMatrix,
): string | null {
  // Check if agent has any active ambitions
  const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
  if (pursuesEdges.length === 0) return null;

  // Find nearest non-current location within awareness range
  const row = distanceMatrix.distances.get(agentLocationId);
  if (!row) return null;

  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const [locId, dist] of row) {
    if (locId === agentLocationId) continue;
    if (dist > MAX_AWARENESS_HOPS) continue;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = locId;
    }
  }

  return bestId;
}

/**
 * Determine idle behavior based on personality.
 *
 * Algorithm:
 * 1. Read Heart axis (loyalty_ambition) from axiological profile.
 * 2. If ambitious (loyalty_ambition < -AMBITION_DRIFT_THRESHOLD):
 *    - Try deriveAmbitionTarget → drift there.
 *    - Else drift to random adjacent location.
 *    - Else stay.
 * 3. If content/loyal (loyalty_ambition >= -AMBITION_DRIFT_THRESHOLD):
 *    - If trivial local encounters exist and rng < IDLE_TRIVIAL_PREFERENCE:
 *      pick first trivial entry → trivial_local.
 *    - Else stay.
 */
export function resolveIdleBehavior(
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  distanceMatrix: DistanceMatrix,
  localEntries: readonly EncounterCacheEntry[],
  rng: () => number,
): IdleDecision {
  // Fail-soft: missing agent node → stay
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return { action: 'stay' };

  const loyaltyAmbition = getLoyaltyAmbition(graph, agentId);

  // Ambitious: loyalty_ambition < -threshold (negative = Ambition pole)
  if (loyaltyAmbition < -AMBITION_DRIFT_THRESHOLD) {
    // Try ambition-based drift target
    const target = deriveAmbitionTarget(
      agentId,
      agentLocationId,
      graph,
      distanceMatrix,
    );
    if (target) {
      return { action: 'drift', targetLocationId: target };
    }

    // No ambition target — drift to random adjacent
    const adjacent = getAdjacentLocationIds(graph, agentLocationId);
    if (adjacent.length > 0) {
      const idx = Math.floor(rng() * adjacent.length);
      return { action: 'drift', targetLocationId: adjacent[idx] };
    }

    // No adjacent locations — stay
    return { action: 'stay' };
  }

  // Content/loyal: look for trivial local encounters
  const trivialEntries = localEntries.filter(
    (e) => e.threatRating === 'trivial',
  );

  if (trivialEntries.length > 0 && rng() < IDLE_TRIVIAL_PREFERENCE) {
    return { action: 'trivial_local', templateId: trivialEntries[0].templateId };
  }

  return { action: 'stay' };
}
