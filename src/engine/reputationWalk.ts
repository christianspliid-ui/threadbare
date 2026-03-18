/**
 * Reputation Walk — graph-walked reputation perception.
 *
 * Replaces flat reputationScore with a nuanced, path-based perception
 * that factors in intermediary distortion (Shadow capability),
 * source resistance (Heart capability), and faction rank bonuses.
 *
 * ─── Constants ────────────────────────────────────────────────
 * | Name                       | Default | Purpose                                    |
 * |----------------------------|---------|--------------------------------------------|
 * | REPUTATION_MAX_HOPS        | 4       | Max graph hops to search for indirect paths|
 * | UNKNOWN_REPUTATION         | 0.0     | Default when no path exists                |
 * | SHADOW_DISTORTION_FACTOR   | 0.15    | Shadow capability × this = distortion      |
 * | HEART_TRUST_FACTOR         | 0.3     | Heart capability × this = resistance       |
 * | FACTION_RANK_TRUST_BONUS   | 0.1     | Per-intermediary faction rank bonus         |
 *
 * ─── Tracing ─────────────────────────────────────────────────
 * Emits 'reputation_walk' trace with path details and distortion breakdown.
 *
 * ─── Fail-soft ───────────────────────────────────────────────
 * | Failure case                | Fallback                         |
 * |-----------------------------|----------------------------------|
 * | Source or target missing    | Return UNKNOWN_REPUTATION (0)    |
 * | No paths found              | Return UNKNOWN_REPUTATION (0)    |
 * | Self-reputation query       | Return UNKNOWN_REPUTATION (0)    |
 * | Missing node properties     | Treat capability as 0            |
 * | Missing faction membership  | Skip faction rank bonus          |
 *
 * ─── PRNG ────────────────────────────────────────────────────
 * None — reputation is a deterministic graph walk.
 */

import type { WorldGraph } from './graph';
import { findAllPaths } from './graphUtils';
import { computeCapability } from './domainCapability';
import { emitTrace } from './traceBuffer';

// ─── Constants ───────────────────────────────────────────────

/** Maximum hops for indirect reputation walks */
export const REPUTATION_MAX_HOPS = 4;

/** Default reputation when no path exists between agents */
export const UNKNOWN_REPUTATION = 0.0;

/** Multiplier for Shadow capability distortion by intermediaries */
export const SHADOW_DISTORTION_FACTOR = 0.15;

/** Multiplier for Heart capability trust resistance by the perceiver */
export const HEART_TRUST_FACTOR = 0.3;

/** Trust bonus per intermediary sharing a faction with the source */
export const FACTION_RANK_TRUST_BONUS = 0.1;

// ─── Core Function ───────────────────────────────────────────

/**
 * Perceive another agent's reputation through the graph.
 *
 * Algorithm:
 * 1. Direct edge → return trust value (personal experience trumps all)
 * 2. Walk all paths up to REPUTATION_MAX_HOPS via relates_to edges
 * 3. No paths → return UNKNOWN_REPUTATION (0)
 * 4. For each path, compute trust product along edges
 * 5. Select best path (highest absolute trust product)
 * 6. Apply intermediary Shadow distortion
 * 7. Apply source Heart resistance
 * 8. Apply faction rank bonuses
 * 9. Clamp to [-1, 1]
 */
export function perceiveReputation(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
): number {
  // Self-reputation: return 0
  if (sourceId === targetId) return UNKNOWN_REPUTATION;

  // Fail-soft: missing nodes
  if (!graph.getNode(sourceId) || !graph.getNode(targetId)) {
    return UNKNOWN_REPUTATION;
  }

  // Step 1: Check for direct relates_to edge
  const directTrust = getDirectTrust(graph, sourceId, targetId);
  if (directTrust !== undefined) {
    return directTrust;
  }

  // Step 2: Find all indirect paths
  const paths = findAllPaths(graph, sourceId, targetId, REPUTATION_MAX_HOPS, 'relates_to');

  // Step 3: No paths → unknown
  if (paths.length === 0) return UNKNOWN_REPUTATION;

  // Step 4-5: Compute trust product for each path, pick best
  let bestRawReputation = 0;
  let bestPathIndex = 0;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    let product = 1;

    for (const edgeId of path.edgeIds) {
      const edge = graph.getEdge(edgeId);
      const trust = (edge?.properties.trust as number) ?? 0;
      product *= trust;
    }

    if (Math.abs(product) > Math.abs(bestRawReputation)) {
      bestRawReputation = product;
      bestPathIndex = i;
    }
  }

  const bestPath = paths[bestPathIndex];

  // Step 6: Compute Shadow distortion from intermediaries
  // Intermediaries = all nodes in the path except source and target
  const intermediaryIds = bestPath.nodeIds.slice(1, -1);
  let distortion = 0;

  for (const intermediaryId of intermediaryIds) {
    const shadowCap = computeCapability(graph, intermediaryId, 'shadow');
    // Distortion direction: based on intermediary's trust with target
    const intermediaryTargetTrust = getDirectTrust(graph, intermediaryId, targetId) ?? 0;
    const sign = intermediaryTargetTrust >= 0 ? 1 : -1;
    distortion += shadowCap * SHADOW_DISTORTION_FACTOR * sign;
  }

  // Step 7: Compute source Heart resistance
  const sourceHeartCap = computeCapability(graph, sourceId, 'heart');
  const heartResistance = sourceHeartCap * HEART_TRUST_FACTOR;
  const effectiveDistortion = distortion * (1 - heartResistance);

  // Step 8: Faction rank bonus
  let rankBonus = 0;
  const sourceFactions = getAgentFactions(graph, sourceId);

  for (const intermediaryId of intermediaryIds) {
    const intermediaryFactions = getAgentFactions(graph, intermediaryId);
    // Check if source and intermediary share any faction
    for (const sf of sourceFactions) {
      for (const inf of intermediaryFactions) {
        if (sf.factionId === inf.factionId) {
          rankBonus += (inf.rank ?? 0) * FACTION_RANK_TRUST_BONUS;
        }
      }
    }
  }

  // Step 9: Combine and clamp
  const finalReputation = clamp(bestRawReputation + effectiveDistortion + rankBonus, -1, 1);

  emitTrace({
    tick: 0,
    category: 'reputation_walk',
    agentId: sourceId,
    targetId,
    summary: `Reputation ${sourceId}→${targetId}: ${finalReputation.toFixed(3)} (raw=${bestRawReputation.toFixed(3)}, distortion=${effectiveDistortion.toFixed(3)}, rank=${rankBonus.toFixed(3)})`,
    rawReputation: bestRawReputation,
    effectiveDistortion,
    rankBonus,
    pathHops: bestPath.hops,
    intermediaryCount: intermediaryIds.length,
  });

  return finalReputation;
}

// ─── Internal Helpers ────────────────────────────────────────

/**
 * Get direct trust from a relates_to edge between two agents.
 * Returns undefined if no direct edge exists.
 */
function getDirectTrust(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
): number | undefined {
  // Check outgoing
  const outgoing = graph.getOutgoingEdges(sourceId, 'relates_to');
  for (const edge of outgoing) {
    if (edge.target === targetId) {
      return (edge.properties.trust as number) ?? 0;
    }
  }

  // Check incoming (bidirectional relationship)
  const incoming = graph.getIncomingEdges(sourceId, 'relates_to');
  for (const edge of incoming) {
    if (edge.source === targetId) {
      return (edge.properties.trust as number) ?? 0;
    }
  }

  return undefined;
}

/**
 * Get all factions an agent belongs to, with rank info.
 */
function getAgentFactions(
  graph: WorldGraph,
  agentId: string,
): Array<{ factionId: string; rank: number }> {
  const results: Array<{ factionId: string; rank: number }> = [];

  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  for (const edge of memberEdges) {
    results.push({
      factionId: edge.target,
      rank: (edge.properties.rank as number) ?? 0,
    });
  }

  return results;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
