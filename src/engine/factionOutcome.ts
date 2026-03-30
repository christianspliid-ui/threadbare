/**
 * Faction Outcome Processing — handles join and promotion encounter outcomes.
 *
 * Called from phaseEncounterProgressionV2 after an encounter completes.
 * Join success → creates member_of edge with starting reputation.
 * Promotion success → applies reputation boost, updates rank on edge.
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 3
 * NFP: Tunability (all amounts from constants), Determinism (seeded partial-success check),
 *       Fail-soft (missing data → skip), Inspectability (traces per outcome).
 */

import type { WorldGraph } from './graph';
import type { EncounterProgress } from '../types/encounter';
import type { FactionPromotionTrace } from '../types/faction';
import { computeRankFromReputation } from '../types/faction';
import type { MemberOfEdgeProperties } from '../types/disposition';
import type { TickEvent } from '../types/gameState';
import {
  FACTION_DEFINITIONS,
  FACTION_JOIN_STARTING_REPUTATION,
  FACTION_PROMOTION_REPUTATION_BOOST,
  PROMOTION_PARTIAL_SUCCESS_MARGIN,
} from '../data/faction-definitions';
import { FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import { applyFactionReputationGain } from './factionReputation';
import { emitTrace } from './traceBuffer';

// ─── Join Outcome ───────────────────────────────────────────────────────

/**
 * Process the outcome of a faction join encounter (e.g. 'ag.join').
 * On success: creates member_of edge with starting reputation + factionDefId.
 * On failure: no-op (agent can retry after cooldown).
 *
 * @returns true if a member_of edge was created
 */
export function processFactionJoinOutcome(
  graph: WorldGraph,
  progress: EncounterProgress,
  tick: number,
): boolean {
  if (progress.status !== 'completed') return false;

  const meta = FACTION_ENCOUNTER_META.get(progress.encounterId);
  if (!meta) return false;

  const definition = FACTION_DEFINITIONS.get(meta.factionDefId);
  if (!definition) return false;

  // Only process join encounters
  if (progress.encounterId !== definition.joinEncounterTemplateId) return false;

  const agentId = progress.actorId;

  // Check if already a member (fail-soft: don't create duplicate)
  const existingEdges = graph.getOutgoingEdges(agentId, 'member_of')
    .filter(e => {
      const props = e.properties as Partial<MemberOfEdgeProperties>;
      return props.factionDefId === definition.id;
    });

  if (existingEdges.length > 0) return false;

  // Find the faction node
  const factionNodes = graph.getNodesByType('actor')
    .filter(n => n.properties.factionDefId === definition.id);

  if (factionNodes.length === 0) return false;

  const factionId = factionNodes[0].id;
  const startingRank = computeRankFromReputation(FACTION_JOIN_STARTING_REPUTATION, definition);

  // Create member_of edge
  graph.addEdge({
    id: `member_${agentId}_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: {
      role: startingRank.id,
      rank: 0,
      joinedTick: tick,
      reputation: FACTION_JOIN_STARTING_REPUTATION,
      factionDefId: definition.id,
    } satisfies MemberOfEdgeProperties,
  });

  // Emit trace
  const agentName = graph.getNode(agentId)?.name ?? '?';
  const factionName = graph.getNode(factionId)?.name ?? '?';
  emitTrace({
    tick,
    category: 'faction_reputation',
    agentId,
    factionId,
    oldReputation: 0,
    newReputation: FACTION_JOIN_STARTING_REPUTATION,
    cause: 'quest_complete',
    rankChanged: true,
    oldRank: 'none',
    newRank: startingRank.id,
    summary: `${agentName} joined ${factionName} as ${startingRank.name} (reputation: ${FACTION_JOIN_STARTING_REPUTATION})`,
  } as unknown as Parameters<typeof emitTrace>[0]);

  return true;
}

// ─── Promotion Outcome ──────────────────────────────────────────────────

export type PromotionOutcomeResult = {
  promoted: boolean;
  outcome: 'full_success' | 'partial_success' | 'failure';
  fromRank: string;
  toRank: string;
  complication?: string;
};

/**
 * Process the outcome of a faction promotion encounter (e.g. 'ag.promotion').
 *
 * Success logic:
 *   - Full success: reputation >= next tier threshold → promoted, reputation boost
 *   - Partial success: reputation within PROMOTION_PARTIAL_SUCCESS_MARGIN of threshold
 *     → promoted but with a complication trait (narrative tension)
 *   - Failure: encounter abandoned → no change
 *
 * @param rng Seeded PRNG for partial-success complication selection
 */
export function processFactionPromotionOutcome(
  graph: WorldGraph,
  progress: EncounterProgress,
  tick: number,
  rng: () => number,
): PromotionOutcomeResult | null {
  if (progress.status !== 'completed') return null;

  const meta = FACTION_ENCOUNTER_META.get(progress.encounterId);
  if (!meta) return null;

  const definition = FACTION_DEFINITIONS.get(meta.factionDefId);
  if (!definition) return null;

  // Only process promotion encounters
  if (progress.encounterId !== definition.promotionEncounterTemplateId) return null;

  const agentId = progress.actorId;

  // Find member_of edge
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of')
    .filter(e => {
      const props = e.properties as Partial<MemberOfEdgeProperties>;
      return props.factionDefId === definition.id;
    });

  if (memberEdges.length === 0) return null;

  const edge = memberEdges[0];
  const props = edge.properties as Partial<MemberOfEdgeProperties>;
  const reputation = props.reputation ?? 0;
  const currentRank = computeRankFromReputation(reputation, definition);

  // Find next rank tier
  const currentTierIndex = definition.rankTiers.indexOf(currentRank);
  if (currentTierIndex < 0 || currentTierIndex >= definition.rankTiers.length - 1) {
    // Already at max rank or rank not found
    return { promoted: false, outcome: 'failure', fromRank: currentRank.id, toRank: currentRank.id };
  }

  const nextTier = definition.rankTiers[currentTierIndex + 1];
  const gap = nextTier.minReputation - reputation;

  // Determine outcome based on reputation proximity to threshold
  let outcome: 'full_success' | 'partial_success' | 'failure';
  let complication: string | undefined;

  if (reputation >= nextTier.minReputation) {
    // Already at or above threshold — full success
    outcome = 'full_success';
  } else if (gap <= PROMOTION_PARTIAL_SUCCESS_MARGIN) {
    // Within margin — partial success (promoted with complication)
    outcome = 'partial_success';
    complication = selectComplication(rng);
  } else {
    // Too far from threshold — the encounter completed but agent isn't ready
    return { promoted: false, outcome: 'failure', fromRank: currentRank.id, toRank: nextTier.id };
  }

  // Apply promotion: boost reputation to at least the next tier threshold
  const reputationBoost = outcome === 'full_success'
    ? FACTION_PROMOTION_REPUTATION_BOOST
    : Math.max(FACTION_PROMOTION_REPUTATION_BOOST, gap + 0.01); // Ensure we cross threshold

  applyFactionReputationGain(
    graph,
    agentId,
    edge.target,
    reputationBoost,
    tick,
    'promotion',
  );

  // Emit promotion trace
  const agentName = graph.getNode(agentId)?.name ?? '?';
  const factionName = graph.getNode(edge.target)?.name ?? '?';
  emitTrace({
    tick,
    category: 'faction_promotion',
    agentId,
    factionId: edge.target,
    fromRank: currentRank.id,
    toRank: nextTier.id,
    outcome,
    ...(complication ? { complication } : {}),
    summary: outcome === 'partial_success'
      ? `${agentName} promoted to ${nextTier.name} in ${factionName} (with complication: ${complication})`
      : `${agentName} promoted to ${nextTier.name} in ${factionName}`,
  } as unknown as Parameters<typeof emitTrace>[0]);

  return {
    promoted: true,
    outcome,
    fromRank: currentRank.id,
    toRank: nextTier.id,
    complication,
  };
}

// ─── Complication Pool ──────────────────────────────────────────────────

/** Complications for partial-success promotions — narrative tension hooks. */
const PROMOTION_COMPLICATIONS = [
  'rival_enmity',        // A rival within the faction resents the promotion
  'debt_of_honor',       // Promotion came with an unspoken obligation
  'scrutiny',            // Higher rank means more eyes watching
  'mentor_disappointment', // A mentor expected more before the promotion
  'hasty_oath',          // The oath of office included unexpected commitments
] as const;

function selectComplication(rng: () => number): string {
  const index = Math.floor(rng() * PROMOTION_COMPLICATIONS.length);
  return PROMOTION_COMPLICATIONS[index];
}

// ─── Dispatcher ─────────────────────────────────────────────────────────

/** Unique ID counter for faction tick events */
let factionEventSeq = 0;

/** Reset per-tick faction event counter. Called by orchestrator.resetEventCounters(). */
export function resetFactionEventSeq(): void {
  factionEventSeq = 0;
}

/**
 * Top-level dispatcher: given a completed faction encounter, route to
 * the appropriate outcome processor. Called from phaseEncounterProgressionV2.
 *
 * @returns Array of TickEvents to append to state (empty if no faction outcome)
 */
export function processFactionOutcome(
  graph: WorldGraph,
  progress: EncounterProgress,
  tick: number,
  rng: () => number,
): TickEvent[] {
  if (progress.status !== 'completed') return [];

  // Check if this is a faction encounter at all
  const meta = FACTION_ENCOUNTER_META.get(progress.encounterId);
  if (!meta) return [];

  const definition = FACTION_DEFINITIONS.get(meta.factionDefId);
  if (!definition) return [];

  const events: TickEvent[] = [];
  const agentName = graph.getNode(progress.actorId)?.name ?? '?';
  const factionNodes = graph.getNodesByType('actor')
    .filter(n => n.properties.factionDefId === definition.id);
  const factionName = factionNodes.length > 0 ? factionNodes[0].name : definition.nameTemplate;

  // Get hex coords for the agent's location
  const locEdges = graph.getOutgoingEdges(progress.actorId, 'located_at');
  const locNode = locEdges.length > 0 ? graph.getNode(locEdges[0].target) : undefined;
  const hexCoords = locNode?.properties?.hexCol != null
    ? { col: locNode.properties.hexCol as number, row: locNode.properties.hexRow as number }
    : undefined;

  // Route to appropriate processor
  if (progress.encounterId === definition.joinEncounterTemplateId) {
    const joined = processFactionJoinOutcome(graph, progress, tick);
    if (joined) {
      events.push({
        id: `faction_join_${tick}_${++factionEventSeq}`,
        tick,
        type: 'faction_founded', // closest existing type for "joined faction"
        message: `${agentName} has joined ${factionName}.`,
        significance: 0.6,
        notification: { channel: 'toast', icon: 'faction' },
        hexCoords,
        actorId: progress.actorId,
      });
    }
    return events;
  }

  if (progress.encounterId === definition.promotionEncounterTemplateId) {
    const result = processFactionPromotionOutcome(graph, progress, tick, rng);
    if (result !== null && result.promoted) {
      const nextRankDef = definition.rankTiers.find(r => r.id === result.toRank);
      const rankName = nextRankDef?.name ?? result.toRank;
      events.push({
        id: `faction_promote_${tick}_${++factionEventSeq}`,
        tick,
        type: 'faction_rank_changed',
        message: `${agentName} has been promoted to ${rankName} in ${factionName}.`,
        significance: 0.7,
        notification: { channel: 'alert', icon: 'faction' },
        hexCoords,
        actorId: progress.actorId,
      });
    }
    return events;
  }

  return events;
}
