/**
 * Encounter Awareness Filter — per-reach hex-distance-limited visibility.
 *
 * An agent's domain capability determines how many hex hops they can "see"
 * encounters across. Visibility is hex-granular: if the agent can see a hex,
 * they can see everything on it (every location, sublocation, encounter).
 *
 * Within-hex visibility is automatic (distance 0). Cross-hex visibility is
 * computed as hex coordinate distance vs. per-reach awareness hops.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                  | Default | Purpose                                     |
 * |-----------------------|---------|---------------------------------------------|
 * | AWARENESS_THRESHOLD   | 0.05    | Minimum capability to see beyond own hex     |
 * | BASE_AWARENESS_HOPS   | 1       | Hex hops granted to any agent above threshold|
 * | CAPABILITY_PER_HOP    | 0.15    | Additional capability needed per extra hop   |
 * | MAX_AWARENESS_HOPS    | 5       | Hard cap on awareness range                  |
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
 * | Location missing hex coordinates | Skip entry (invisible)          |
 * | Agent location missing hex coords| Return empty array              |
 * | Agent at sublocation             | Resolve to parent via           |
 * |                                  | parentLocationId → hex coords   |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — deterministic filter, no randomness.
 */

import type { ReachDomain } from '../types/traits';
import type { WorldGraph } from './graph';
import type { EncounterCacheEntry } from './encounterCache';
import { computeCapability } from './domainCapability';
import { hexDistance } from '../lib/hexMath';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
  EDGE_HEX_AWARENESS_BONUS,
} from '../data/agent-behavior-constants';

import {
  AWARENESS_THRESHOLD,
  BASE_AWARENESS_HOPS,
  CAPABILITY_PER_HOP,
  MAX_AWARENESS_HOPS,
  EDGE_HEX_AWARENESS_BONUS,
} from '../data/agent-behavior-constants';

import { hexNeighbors } from '../lib/hexMath';

// ─── Hex resolution helpers ─────────────────────────────────────

/**
 * Resolve a location (or sublocation) node to its hex coordinates.
 * Sublocations are resolved via parentLocationId → parent location → hex.
 * Returns null if coordinates cannot be determined (fail-soft).
 */
export function resolveLocationToHex(
  graph: WorldGraph,
  locationId: string,
): { col: number; row: number } | null {
  const node = graph.getNode(locationId);
  if (!node) return null;

  const props = node.properties as Record<string, unknown>;

  // If this is a sublocation, resolve to parent
  const parentId = props.parentLocationId as string | undefined;
  if (parentId) {
    return resolveLocationToHex(graph, parentId);
  }

  // Read hex coordinates from the location node
  const col = props.hexCol as number | undefined;
  const row = props.hexRow as number | undefined;
  if (col === undefined || row === undefined) return null;

  return { col, row };
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Compute awareness hops for a single reach domain given a capability value.
 *
 * 1. Below AWARENESS_THRESHOLD → 0 (own hex only)
 * 2. BASE_AWARENESS_HOPS + floor(capability / CAPABILITY_PER_HOP)
 * 3. Capped at MAX_AWARENESS_HOPS
 */
export function computeAwarenessHops(capability: number, reach: ReachDomain): number {
  if (capability < AWARENESS_THRESHOLD) return 0;

  const hops = BASE_AWARENESS_HOPS + Math.floor(capability / CAPABILITY_PER_HOP);

  return Math.min(hops, MAX_AWARENESS_HOPS);
}

/**
 * Filter encounter cache entries by per-reach hex-distance awareness.
 *
 * For each entry, the agent's best capability across primary and secondary
 * reaches determines the maximum hex distance at which the encounter is visible.
 * Within-hex encounters (distance 0) are always visible regardless of capability.
 *
 * Agent position is resolved to hex coordinates: sublocation → parent → hex.
 * This means an agent at a sublocation sees all encounters on their hex automatically.
 */
/**
 * Check if a hex is on the map border (has fewer than 6 valid neighbors).
 * Uses map dimensions to determine if any neighbor would be out of bounds.
 */
function isEdgeHex(hex: { col: number; row: number }, mapCols?: number, mapRows?: number): boolean {
  if (mapCols === undefined || mapRows === undefined) return false;
  const neighbors = hexNeighbors(hex);
  return neighbors.some(n => n.col < 0 || n.row < 0 || n.col >= mapCols || n.row >= mapRows);
}

export function filterByAwareness(
  entries: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  mapCols?: number,
  mapRows?: number,
): EncounterCacheEntry[] {
  // Fail-soft: agent must exist and have a location
  if (!agentLocationId) return [];
  if (!graph.getNode(agentId)) return [];

  // Resolve agent location (or sublocation) to hex coordinates
  const agentHex = resolveLocationToHex(graph, agentLocationId);
  if (!agentHex) return [];

  // Edge hex bonus: agents on map borders get extra awareness to compensate
  const edgeBonus = isEdgeHex(agentHex, mapCols, mapRows) ? EDGE_HEX_AWARENESS_BONUS : 0;

  // Pre-compute a cache of locationId → hex coords to avoid repeated lookups
  const hexCache = new Map<string, { col: number; row: number } | null>();

  const result: EncounterCacheEntry[] = [];

  for (const entry of entries) {
    // Fail-soft: skip entries with no primary reach
    if (!entry.reachPrimary) continue;

    // Resolve encounter location to hex (with caching)
    let entryHex = hexCache.get(entry.locationId);
    if (entryHex === undefined) {
      entryHex = resolveLocationToHex(graph, entry.locationId);
      hexCache.set(entry.locationId, entryHex);
    }
    if (!entryHex) continue;

    // Compute hex distance
    const dist = hexDistance(agentHex, entryHex);

    // Same hex (distance 0) → always visible, no capability check needed
    if (dist === 0) {
      result.push(entry);
      continue;
    }

    // Cross-hex: compute capability in both reaches
    const primaryCap = computeCapability(graph, agentId, entry.reachPrimary);
    const secondaryCap = entry.reachSecondary
      ? computeCapability(graph, agentId, entry.reachSecondary)
      : 0;

    // Best visibility channel: max range from either reach
    const primaryRange = computeAwarenessHops(primaryCap, entry.reachPrimary);
    const secondaryRange = entry.reachSecondary
      ? computeAwarenessHops(secondaryCap, entry.reachSecondary)
      : 0;
    const maxRange = Math.max(primaryRange, secondaryRange) + edgeBonus;

    if (dist <= maxRange) {
      result.push(entry);
    }
  }

  return result;
}
