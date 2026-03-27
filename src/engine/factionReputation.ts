/**
 * Faction Reputation — gain, decay, and rank recalculation for faction memberships.
 *
 * Reputation is the single lever: rank, access, bonuses, and expulsion all flow from it.
 * Stored on member_of edge properties as `reputation` (0.0–1.0).
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 2
 * NFP: Tunability (all rates from constants), Determinism (no PRNG needed),
 *       Fail-soft (missing data → skip), Inspectability (traces per change).
 */

import type { WorldGraph } from './graph';
import type { FactionDefinition, FactionReputationTrace } from '../types/faction';
import { computeRankFromReputation } from '../types/faction';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { FACTION_DEFINITIONS, FACTION_REPUTATION_COMPLETION_BONUS } from '../data/faction-definitions';
import { FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import { getEncounterRewardMultiplier, emitFactionBonusTrace } from './factionRankBonus';
import { emitTrace } from './traceBuffer';
import type { GameState } from '../types/gameState';

// ─── Reputation Gain ─────────────────────────────────────────────────────

/**
 * Apply reputation gain to an agent's faction membership.
 * Recalculates rank from the new reputation value.
 *
 * @returns Object with new reputation, whether rank changed, and new rank ID
 */
export function applyFactionReputationGain(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  amount: number,
  tick: number,
  cause: FactionReputationTrace['cause'],
): { newReputation: number; rankChanged: boolean; newRank: string } {
  // Find the member_of edge
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of')
    .filter(e => e.target === factionId);

  if (memberEdges.length === 0) {
    return { newReputation: 0, rankChanged: false, newRank: 'none' };
  }

  const edge = memberEdges[0];
  const props = edge.properties as Partial<MemberOfEdgeProperties>;
  const factionDefId = props.factionDefId;
  const definition = factionDefId ? FACTION_DEFINITIONS.get(factionDefId) : undefined;

  const oldReputation = props.reputation ?? 0;
  const newReputation = Math.min(1.0, Math.max(0, oldReputation + amount));

  // Update edge properties
  edge.properties = {
    ...edge.properties,
    reputation: newReputation,
  };

  // Recalculate rank
  const oldRank = definition
    ? computeRankFromReputation(oldReputation, definition)
    : { id: props.role ?? 'member', name: props.role ?? 'Member' };
  const newRank = definition
    ? computeRankFromReputation(newReputation, definition)
    : oldRank;

  const rankChanged = oldRank.id !== newRank.id;

  if (rankChanged && definition) {
    edge.properties = {
      ...edge.properties,
      role: newRank.id,
      rank: definition.rankTiers.indexOf(newRank) / Math.max(definition.rankTiers.length - 1, 1),
    };
  }

  // Emit trace
  const agentName = graph.getNode(agentId)?.name ?? '?';
  const factionName = graph.getNode(factionId)?.name ?? '?';
  emitTrace({
    tick,
    category: 'faction_reputation',
    agentId,
    factionId,
    oldReputation,
    newReputation,
    cause,
    rankChanged,
    oldRank: oldRank.id,
    newRank: newRank.id,
    summary: rankChanged
      ? `${agentName} ${amount > 0 ? 'gained' : 'lost'} reputation in ${factionName}: ${oldReputation.toFixed(3)} → ${newReputation.toFixed(3)} (rank: ${oldRank.name} → ${newRank.name})`
      : `${agentName} ${amount > 0 ? 'gained' : 'lost'} reputation in ${factionName}: ${oldReputation.toFixed(3)} → ${newReputation.toFixed(3)}`,
  } as unknown as Parameters<typeof emitTrace>[0]);

  return { newReputation, rankChanged, newRank: newRank.id };
}

// ─── Reputation Decay ────────────────────────────────────────────────────

/**
 * Tick all faction reputation decay across all member_of edges.
 * For each edge with a factionDefId, subtract the definition's reputationDecayPerTick.
 * Clamp at 0.
 *
 * Called as orchestrator phase 6.55 (after phaseReputationDecay).
 */
export function phaseFactionReputationDecay(state: GameState): Partial<GameState> {
  const graph = state.graph;
  const tick = state.tick;

  // Iterate all member_of edges
  const memberEdges = graph.getEdgesByType('member_of');

  for (const edge of memberEdges) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    const factionDefId = props.factionDefId;
    if (!factionDefId) continue; // Skip non-faction memberships

    const definition = FACTION_DEFINITIONS.get(factionDefId);
    if (!definition) continue; // Unknown definition — fail-soft

    const oldReputation = props.reputation ?? 0;
    if (oldReputation <= 0) continue; // Already at minimum

    const decayRate = definition.reputationDecayPerTick;
    const newReputation = Math.max(0, oldReputation - decayRate);

    edge.properties = {
      ...edge.properties,
      reputation: newReputation,
    };

    // Recalculate rank after decay
    const oldRank = computeRankFromReputation(oldReputation, definition);
    const newRank = computeRankFromReputation(newReputation, definition);
    const rankChanged = oldRank.id !== newRank.id;

    if (rankChanged) {
      edge.properties = {
        ...edge.properties,
        role: newRank.id,
        rank: definition.rankTiers.indexOf(newRank) / Math.max(definition.rankTiers.length - 1, 1),
      };
    }
  }

  return {};
}

// ─── Encounter Reputation Hook ───────────────────────────────────────────

/**
 * Process faction reputation gain after an encounter step resolves.
 * Called from phaseEncounterProgressionV2 in the orchestrator.
 *
 * @param graph - World graph
 * @param agentId - Agent who completed the step
 * @param encounterId - Encounter template ID
 * @param stepSuccess - Whether the step was successful
 * @param encounterCompleted - Whether this was the final step (full completion)
 * @param tick - Current tick
 */
export function processFactionEncounterReputation(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
  stepSuccess: boolean,
  encounterCompleted: boolean,
  tick: number,
): void {
  const meta = FACTION_ENCOUNTER_META.get(encounterId);
  if (!meta) return; // Not a faction encounter

  if (!stepSuccess) return; // No reputation for failed steps

  // Find the agent's membership in this faction
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  const factionEdge = memberEdges.find(e => {
    const props = e.properties as Partial<MemberOfEdgeProperties>;
    return props.factionDefId === meta.factionDefId;
  });

  if (!factionEdge) return; // Agent not a member of this faction

  // Apply encounter_reward_multiplier rank bonus (TB-062)
  const rewardMultiplier = getEncounterRewardMultiplier(graph, agentId, encounterId);
  if (rewardMultiplier !== 1.0) {
    emitFactionBonusTrace(tick, agentId, factionEdge.target, 'encounter_reward_multiplier', rewardMultiplier, encounterId);
  }

  // Apply per-step reputation gain (multiplied by rank bonus)
  applyFactionReputationGain(
    graph,
    agentId,
    factionEdge.target,
    meta.reputationReward * rewardMultiplier,
    tick,
    'quest_step',
  );

  // Apply bonus for full quest completion (also multiplied)
  if (encounterCompleted) {
    applyFactionReputationGain(
      graph,
      agentId,
      factionEdge.target,
      FACTION_REPUTATION_COMPLETION_BONUS * rewardMultiplier,
      tick,
      'quest_complete',
    );
  }
}
