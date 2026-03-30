/**
 * Encounter Awareness Filter — per-reach distance-limited visibility.
 *
 * An agent's domain capability determines how far they can "see"
 * encounters in that reach. Higher capability = wider awareness radius.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                  | Default | Purpose                                     |
 * |-----------------------|---------|---------------------------------------------|
 * | AWARENESS_THRESHOLD   | 0.05    | Minimum capability to see anything at all    |
 * | BASE_AWARENESS_HOPS   | 1       | Hops granted to any agent above threshold    |
 * | CAPABILITY_PER_HOP    | 0.15    | Additional capability needed per extra hop   |
 * | MAX_AWARENESS_HOPS    | 5       | Hard cap on awareness range                  |
 * | (FLESH_MAX_HOPS removed in TB-075 Phase 1)                                         |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * This module is a pure filter — it does not emit traces.
 * Consumers may trace which entries were filtered in / out.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                     | Fallback                        |
 * |----------------------------------|---------------------------------|
 * | Agent not in graph               | Return empty array              |
 * | Agent has no capability data     | computeCapability returns ~0.02 |
 * |                                  | → below threshold → 0 hops     |
 * | Entry missing reachPrimary       | Skip entry                      |
 * | Distance lookup fails            | Infinity → invisible            |
 * | Agent has no location            | Return empty array              |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — deterministic filter, no randomness.
 */

import type { ReachDomain } from '../types/traits';
import type { WorldGraph } from './graph';
import type { DistanceMatrix } from './distanceMatrix';
import type { EncounterCacheEntry } from './encounterCache';
import { computeCapability } from './domainCapability';
import { getDistance } from './distanceMatrix';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
} from '../data/agent-behavior-constants';

import {
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
} from '../data/agent-behavior-constants';

// ─── Public API ─────────────────────────────────────────────────

/**
 * Compute awareness hops for a single reach domain given a capability value.
 *
 * 1. Below AWARENESS_THRESHOLD → 0 (invisible)
 * 2. BASE_AWARENESS_HOPS + floor(capability / CAPABILITY_PER_HOP)
 * 3. Capped at MAX_AWARENESS_HOPS
 */
export function computeAwarenessHops(capability: number, reach: ReachDomain): number {
  if (capability < AWARENESS_THRESHOLD) return 0;

  const hops = BASE_AWARENESS_HOPS + Math.floor(capability / CAPABILITY_PER_HOP);

  return Math.min(hops, MAX_AWARENESS_HOPS);
}

/**
 * Filter encounter cache entries by per-reach awareness distance.
 *
 * For each entry, the agent's best capability across primary and secondary
 * reaches determines the maximum hop distance at which the encounter is visible.
 */
export function filterByAwareness(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  distanceMatrix: DistanceMatrix,
): EncounterCacheEntry[] {
  // Fail-soft: agent must exist and have a location
  if (!agentLocationId) return [];
  if (!graph.getNode(agentId)) return [];

  const result: EncounterCacheEntry[] = [];

  for (const entry of entries) {
    // Fail-soft: skip entries with no primary reach
    if (!entry.reachPrimary) continue;

    // Compute capability in both reaches
    const primaryCap = computeCapability(graph, agentId, entry.reachPrimary);
    const secondaryCap = entry.reachSecondary
      ? computeCapability(graph, agentId, entry.reachSecondary)
      : 0;

    // Best visibility channel: max range from either reach
    const primaryRange = computeAwarenessHops(primaryCap, entry.reachPrimary);
    const secondaryRange = entry.reachSecondary
      ? computeAwarenessHops(secondaryCap, entry.reachSecondary)
      : 0;
    const maxRange = Math.max(primaryRange, secondaryRange);

    // Distance lookup (Infinity if unknown)
    const distance = getDistance(distanceMatrix, agentLocationId, entry.locationId);

    if (distance <= maxRange) {
      result.push(entry);
    }
  }

  return result;
}
