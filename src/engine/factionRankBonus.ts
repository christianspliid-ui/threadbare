/**
 * Faction Rank Bonus — utilities for looking up and applying rank-based bonuses.
 *
 * Three bonus types:
 * - encounter_reward_multiplier: Multiplies faction reputation gain from quests
 * - scoring_boost: Additive boost to encounter scoring for faction encounters
 * - reputation_walk_bonus: Additive trust bonus via guild network (future)
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 4
 * NFP: Tunability (values on FactionRankTier.bonuses), Fail-soft (no bonus → 1.0/0.0).
 */

import type { WorldGraph } from './graph';
import type { FactionRankBonusType, FactionRankBonus } from '../types/faction';
import { computeRankFromReputation } from '../types/faction';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import { emitTrace } from './traceBuffer';

// ─── Lookup ─────────────────────────────────────────────────────────────

/**
 * Get all active bonuses of a given type for an agent across all faction memberships.
 * Returns an array of { factionDefId, bonus } pairs.
 */
export function getAgentFactionBonuses(
  graph: WorldGraph,
  agentId: string,
  bonusType: FactionRankBonusType,
): { factionDefId: string; factionNodeId: string; bonus: FactionRankBonus }[] {
  const results: { factionDefId: string; factionNodeId: string; bonus: FactionRankBonus }[] = [];

  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  for (const edge of memberEdges) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    const factionDefId = props.factionDefId;
    if (!factionDefId) continue;

    const definition = FACTION_DEFINITIONS.get(factionDefId);
    if (!definition) continue;

    const reputation = props.reputation ?? 0;
    const rank = computeRankFromReputation(reputation, definition);

    for (const bonus of rank.bonuses) {
      if (bonus.type === bonusType) {
        results.push({ factionDefId, factionNodeId: edge.target, bonus });
      }
    }
  }

  return results;
}

// ─── Application: Encounter Reward Multiplier ───────────────────────────

/**
 * Compute the combined encounter_reward_multiplier for an agent on a given encounter.
 * Only applies if the encounter belongs to a faction the agent is a member of.
 * Returns 1.0 if no multiplier applies (identity for multiplication).
 */
export function getEncounterRewardMultiplier(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
): number {
  const meta = FACTION_ENCOUNTER_META.get(encounterId);
  if (!meta) return 1.0; // Not a faction encounter

  const bonuses = getAgentFactionBonuses(graph, agentId, 'encounter_reward_multiplier');
  // Find the bonus for this encounter's faction
  const match = bonuses.find(b => b.factionDefId === meta.factionDefId);
  return match ? match.bonus.value : 1.0;
}

// ─── Application: Scoring Boost ─────────────────────────────────────────

/**
 * Compute the scoring_boost for an agent on a given encounter.
 * Only applies to encounters belonging to a faction the agent is a member of.
 * Returns 0.0 if no boost applies (identity for addition).
 */
export function getScoringBoost(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
): number {
  const meta = FACTION_ENCOUNTER_META.get(encounterId);
  if (!meta) return 0.0; // Not a faction encounter

  const bonuses = getAgentFactionBonuses(graph, agentId, 'scoring_boost');
  const match = bonuses.find(b => b.factionDefId === meta.factionDefId);
  return match ? match.bonus.value : 0.0;
}

// ─── Tracing ────────────────────────────────────────────────────────────

/**
 * Emit a faction bonus trace when a bonus is applied.
 */
export function emitFactionBonusTrace(
  tick: number,
  agentId: string,
  factionNodeId: string,
  bonusType: FactionRankBonusType,
  value: number,
  context: string,
): void {
  const summary = `Faction bonus applied: ${bonusType}=${value} for agent ${agentId} (${context})`;
  emitTrace({
    tick,
    category: 'faction_bonus',
    agentId,
    factionId: factionNodeId,
    bonusType,
    value,
    context,
    summary,
  } as Parameters<typeof emitTrace>[0]);
}
