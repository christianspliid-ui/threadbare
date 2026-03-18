/**
 * Faction Awareness — rank-gated, reach-filtered encounter visibility
 * through faction network connections.
 *
 * Agents who belong to factions gain visibility into encounters at
 * faction-controlled locations, filtered by the faction's reach
 * preferences and gated by the agent's rank within the faction.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                          | Default | Purpose                                      |
 * |-------------------------------|---------|----------------------------------------------|
 * | FACTION_NETWORK_AWARENESS     | true    | Global toggle for faction network intel       |
 * | FACTION_NETWORK_MAX_ENTRIES   | 20      | Max entries per faction at rank 1.0           |
 * | FACTION_SECONDARY_THRESHOLD   | 0.3     | Min weight for a reach to count as secondary  |
 * | FACTION_MIN_RANK_FOR_INTEL    | 0.05    | Min rank to receive any faction intel         |
 * | FACTION_DEFAULT_RANK          | 0.1     | Fallback rank when edge has no rank property  |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * This module is a pure filter; it does not emit tick-loop traces.
 * Consumers can inspect the returned entries and the mutated
 * alreadyVisible set to audit what was added.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                      | Fallback                        |
 * |-----------------------------------|---------------------------------|
 * | Agent has no member_of edges      | Return []                       |
 * | Faction node missing              | Skip, continue with next        |
 * | Faction has no reachPreferences   | Skip, continue with next        |
 * | Edge has no rank property         | Use FACTION_DEFAULT_RANK (0.1)  |
 * | Faction has no located_at edges   | No entries from that faction    |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — deterministic filter, no randomness involved.
 */

import type { EncounterCacheEntry } from './encounterCache';
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';

// ─── Constants ──────────────────────────────────────────────────

/** Global toggle for faction network intelligence */
export const FACTION_NETWORK_AWARENESS = true;

/** Maximum entries visible per faction at rank 1.0 */
export const FACTION_NETWORK_MAX_ENTRIES = 20;

/** Minimum reach weight to count as a secondary reach */
export const FACTION_SECONDARY_THRESHOLD = 0.3;

/** Minimum rank required to receive any faction intel */
export const FACTION_MIN_RANK_FOR_INTEL = 0.05;

/** Default rank when edge properties lack a rank field */
export const FACTION_DEFAULT_RANK = 0.1;

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Derive primary reach (highest weight) and secondary reaches
 * (weight > threshold) from a faction's reach preferences.
 */
function deriveReaches(
  reachPreferences: Record<string, number>,
): { primary: ReachDomain; secondaries: Set<ReachDomain> } | undefined {
  let primary: ReachDomain | undefined;
  let highestWeight = -1;
  const secondaries = new Set<ReachDomain>();

  for (const [reach, weight] of Object.entries(reachPreferences)) {
    if (typeof weight !== 'number') continue;
    if (weight > highestWeight) {
      highestWeight = weight;
      primary = reach as ReachDomain;
    }
    if (weight > FACTION_SECONDARY_THRESHOLD) {
      secondaries.add(reach as ReachDomain);
    }
  }

  if (!primary) return undefined;
  return { primary, secondaries };
}

/**
 * Build entry key for deduplication.
 */
function entryKey(entry: EncounterCacheEntry): string {
  return `${entry.templateId}:${entry.locationId}`;
}

// ─── Main Function ──────────────────────────────────────────────

/**
 * Get additional encounter entries visible through faction networks.
 *
 * Walks the agent's `member_of` edges to discover factions, then
 * filters encounter entries at faction locations by reach alignment
 * and agent rank.
 */
export function getFactionAwarenessEntries(
  allEntries: readonly EncounterCacheEntry[],
  agentId: string,
  graph: WorldGraph,
  alreadyVisible: Set<string>,
): EncounterCacheEntry[] {
  if (!FACTION_NETWORK_AWARENESS) return [];

  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  if (memberEdges.length === 0) return [];

  const result: EncounterCacheEntry[] = [];

  for (const memberEdge of memberEdges) {
    const factionId = memberEdge.target;
    const factionNode = graph.getNode(factionId);
    if (!factionNode) continue;

    const props = factionNode.properties as Record<string, unknown>;
    const reachPreferences = props.reachPreferences as Record<string, number> | undefined;
    if (!reachPreferences) continue;

    const reaches = deriveReaches(reachPreferences);
    if (!reaches) continue;

    const edgeProps = memberEdge.properties as Record<string, unknown>;
    const rank = typeof edgeProps.rank === 'number' ? edgeProps.rank : FACTION_DEFAULT_RANK;

    if (rank < FACTION_MIN_RANK_FOR_INTEL) continue;

    const maxEntries = Math.floor(rank * FACTION_NETWORK_MAX_ENTRIES);
    if (maxEntries <= 0) continue;

    // Collect faction location IDs
    const locationEdges = graph.getOutgoingEdges(factionId, 'located_at');
    if (locationEdges.length === 0) continue;

    const factionLocationIds = new Set<string>();
    for (const locEdge of locationEdges) {
      factionLocationIds.add(locEdge.target);
    }

    // Filter entries at faction locations matching reach alignment
    const candidates: EncounterCacheEntry[] = [];
    for (const entry of allEntries) {
      if (!factionLocationIds.has(entry.locationId)) continue;

      const key = entryKey(entry);
      if (alreadyVisible.has(key)) continue;

      // Check reach alignment:
      // entry's primary reach matches faction's primary, OR
      // entry's secondary reach matches faction's primary, OR
      // entry's primary reach matches any of faction's secondaries
      const matchesPrimary =
        entry.reachPrimary === reaches.primary ||
        entry.reachSecondary === reaches.primary;
      const matchesSecondary = reaches.secondaries.has(entry.reachPrimary);

      if (matchesPrimary || matchesSecondary) {
        candidates.push(entry);
      }
    }

    // Sort by questPriority descending, take top maxEntries
    candidates.sort((a, b) => b.questPriority - a.questPriority);
    const taken = candidates.slice(0, maxEntries);

    for (const entry of taken) {
      alreadyVisible.add(entryKey(entry));
      result.push(entry);
    }
  }

  return result;
}
