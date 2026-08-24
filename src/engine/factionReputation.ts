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
import type { GraphEdge } from '../types/graph';
import type { FactionDefinition, FactionReputationTrace } from '../types/faction';
import { computeRankFromReputation } from '../types/faction';
import type { MemberOfEdgeProperties } from '../types/disposition';
import {
  FACTION_DEFINITIONS,
  FACTION_REPUTATION_COMPLETION_BONUS,
  FACTION_REPUTATION_INACTIVITY_GRACE_TICKS,
} from '../data/faction-definitions';
import { FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import { getEncounterRewardMultiplier, emitFactionBonusTrace } from './factionRankBonus';
import { resolveFactionNodeId } from './factionMembership';
import { emitTrace } from './traceBuffer';
import type { GameState } from '../types/gameState';
import { getTraitsForNode } from './traits';
import { getReputationTraitId } from '../data/reputation-trait-content';
import {
  FACTION_ALIGNMENT_BONUS,
  FACTION_ALIGNMENT_PENALTY,
} from '../data/agent-behavior-constants';

// ─── Reputation Gain ─────────────────────────────────────────────────────

/**
 * Apply reputation gain to an agent's faction membership.
 * Recalculates rank from the new reputation value.
 *
 * `factionId` accepts either a faction **node** id or the **definition** id
 * authors write (`'mercenary_company'`) — see the resolution note below.
 *
 * @returns Object with new reputation, whether rank changed, and new rank ID.
 *   `newRank: 'none'` is the no-op sentinel; `reason` says which no-op it was, so
 *   a caller can trace the difference instead of dropping it (THR-1150).
 */
export function applyFactionReputationGain(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  amount: number,
  tick: number,
  cause: FactionReputationTrace['cause'],
): {
  newReputation: number;
  rankChanged: boolean;
  newRank: string;
  reason?: 'faction_not_found' | 'not_a_member';
} {
  // THR-1150 — `member_of.target` is a faction **node** id (`faction_def_<defId><chapter>`),
  // but every authored `faction_reputation_gain` passes the **definition** id, which
  // matches no edge target. Resolve first: exact-node-id-first order means every
  // existing node-id caller (`processFactionEncounterReputation`, `factionOutcome`,
  // `chosenFactionPowers`) resolves to itself and is unchanged.
  const factionNodeId = resolveFactionNodeId(graph, factionId, agentId);
  if (!factionNodeId) {
    return { newReputation: 0, rankChanged: false, newRank: 'none', reason: 'faction_not_found' };
  }

  // Find the member_of edge
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of')
    .filter(e => e.target === factionNodeId);

  if (memberEdges.length === 0) {
    return { newReputation: 0, rankChanged: false, newRank: 'none', reason: 'not_a_member' };
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
    ...(amount > 0 ? { lastFactionActivityTick: tick } : {}),
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
      // Rank increased — set promotionPending to auto-inject promotion encounter candidate
      promotionPending: amount > 0 ? true : (edge.properties.promotionPending ?? false),
    };
  }

  // Emit trace
  const agentName = graph.getNode(agentId)?.name ?? '?';
  const factionName = graph.getNode(factionNodeId)?.name ?? '?';
  emitTrace({
    tick,
    category: 'faction_reputation',
    agentId,
    factionId: factionNodeId,
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

// ─── Rank Requirement Gate (THR-805) ─────────────────────────────────────

/**
 * Does `agentId` stand at or above `minRankId` in the faction identified by
 * `factionDefId`?
 *
 * This is the read side of the guild-rank gate on the senior/elite tail of guild
 * content (`*.senior.*` / `*.elite.*`), whose required tier is authored per template
 * as `FACTION_ENCOUNTER_META[id].minRank`. Reputation is the single lever — rank is
 * always derived from it via {@link computeRankFromReputation}, never read from the
 * edge's cached `rank`/`role`, which only refresh on a tier *change* and so lag a
 * decay that has not yet crossed a boundary.
 *
 * Non-membership closes the gate: a mortal who never joined the Rangers cannot draw
 * the Rangers' captain-tier work. That is the gate's whole purpose, so it is the one
 * negative answer that is *not* fail-soft.
 *
 * Fail-**open** on unresolvable data (unknown `factionDefId`, or a `minRank` naming
 * no tier in that definition), because the alternative silently orphans authored
 * content on a typo — the failure mode THR-803 was filed for. A data defect must
 * surface as ungated content, never as content nothing can reach (NFP #4).
 *
 * @param minRankId Rank tier id, e.g. `'ranger_captain'` — a `FactionRankTier.id`.
 * @returns true when the gate is open (including the fail-open cases).
 */
export function meetsFactionRankRequirement(
  graph: WorldGraph,
  agentId: string,
  factionDefId: string,
  minRankId: string,
): boolean {
  const definition = FACTION_DEFINITIONS.get(factionDefId);
  if (!definition) return true; // fail-open: unknown faction definition

  const requiredTier = definition.rankTiers.find(t => t.id === minRankId);
  if (!requiredTier) return true; // fail-open: minRank names no tier here

  // The agent's membership in *this* faction. `member_of` points at a faction node
  // id, so the definition is matched through the edge's own factionDefId property.
  for (const edge of graph.getOutgoingEdges(agentId, 'member_of')) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (props.factionDefId !== factionDefId) continue;
    return (props.reputation ?? 0) >= requiredTier.minReputation;
  }

  return false; // not a member — gate closed
}

/**
 * The membership rank as a 0–1 scalar, **derived from `reputation`** rather than read
 * from the cached `member_of.rank`.
 *
 * Rank was read two ways and they disagreed (THR-1211 item 3). The gate above
 * (`meetsFactionRankRequirement`) recomputes from `reputation` on every check; three
 * scalar readers — `socialLeverage.getHighestFactionRank`, `factionAwareness`, and
 * `reputationWalk.getAgentFactions` — read `edge.rank` instead. The ticket framed the
 * divergence as decay drift, but both write paths above rewrite `rank` on every tier
 * change, so a *decaying* member stays consistent. The disagreement is **minted in**,
 * and because `rank` is then only ever rewritten on a tier change, it does not heal:
 *
 * - `npcSeeding.ts` mints `rank: 0.1` beside `reputation: 0.12` (and `rank: 0.16`
 *   beside `reputation: 0.22` for leadership roles), all carrying a `factionDefId`.
 *   Both reputations sit in the entry tier, so the gate reads index 0 → `0.0` while
 *   the scalar readers read `0.1` / `0.16`. That is every seeded faction NPC, from
 *   tick 0, and nothing rewrites it until they cross a tier boundary.
 * - `armySpawning.ts` writes `rank: 'army'`, a **string** in a numeric field. `?? 0`
 *   does not catch it (it is neither null nor undefined), so `reputationWalk`'s
 *   `rank * FACTION_RANK_TRUST_BONUS` evaluated to `NaN` and poisoned the entire walk
 *   through `clamp(raw + distortion + NaN)`.
 *
 * The mints that carry no `factionDefId` at all — the splinter and drift memberships in
 * `encounterAftermath.ts`, `factionTopology.ts`, `bandSpawner.ts`, and the seeded
 * membership in `worldSeed.ts` — have no definition to derive from and are left on the
 * fallback below. They are not a disagreement: the gate matches on `factionDefId` and
 * so does not see those edges either.
 *
 * Deriving is the answer the ticket asked for ("pick derived — it cannot go stale"),
 * and caching bought nothing: `rank` is a pure function of `reputation` plus the
 * definition, so the cache could only ever agree or be wrong.
 *
 * **Fail-soft (NFP #4):** memberships with no resolvable `FactionDefinition` — armies,
 * bands, and bare fixture factions — have nothing to derive *from*, so they keep the
 * cached value when it is a finite number and take `fallback` otherwise. That is what
 * makes the `'army'` string safe rather than merely rarer.
 */
export function getDerivedMembershipRank(edge: GraphEdge, fallback = 0): number {
  const props = edge.properties as Partial<MemberOfEdgeProperties>;

  const definition = props.factionDefId ? FACTION_DEFINITIONS.get(props.factionDefId) : undefined;
  if (definition && typeof props.reputation === 'number' && Number.isFinite(props.reputation)) {
    const tier = computeRankFromReputation(props.reputation, definition);
    return definition.rankTiers.indexOf(tier) / Math.max(definition.rankTiers.length - 1, 1);
  }

  const cached = props.rank;
  return typeof cached === 'number' && Number.isFinite(cached) ? cached : fallback;
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
  const events: import('../types/gameState').TickEvent[] = [];

  // Iterate all member_of edges
  const memberEdges = graph.getEdgesByType('member_of');

  for (const edge of memberEdges) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    const factionDefId = props.factionDefId;
    if (!factionDefId) continue; // Skip non-faction memberships

    // Skip dissolved factions (faction_dissolve aftermath sets dissolved: true on the node)
    const factionNode = graph.getNode(edge.target);
    if (factionNode?.properties?.dissolved) continue;

    const definition = FACTION_DEFINITIONS.get(factionDefId);
    if (!definition) continue; // Unknown definition — fail-soft

    const oldReputation = props.reputation ?? 0;
    if (oldReputation <= 0) continue; // Already at minimum

    const lastActivityTick = props.lastFactionActivityTick ?? props.joinedTick ?? 0;
    if ((tick - lastActivityTick) < FACTION_REPUTATION_INACTIVITY_GRACE_TICKS) {
      continue;
    }

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

      // Emit rank change event (TB-063)
      const agentName = graph.getNode(edge.source)?.name ?? '?';
      const factionName = graph.getNode(edge.target)?.name ?? '?';
      events.push({
        // The loop key is the membership edge, not the agent — an agent in two
        // factions decays in both and can be demoted in both on the same tick.
        // Faction nodes are minted per chapter (`faction_def_{defId}{suffix}`),
        // so two memberships share a decay rate and demote in lockstep. Without
        // edge.target both notices carry one id and React drops or duplicates
        // one of them (THR-781).
        id: `faction_decay_rank_${tick}_${edge.source}_${edge.target}`,
        tick,
        type: 'faction_rank_changed',
        message: `${agentName} has been demoted to ${newRank.name} in ${factionName}.`,
        significance: 0.5,
        notification: { channel: 'toast', icon: 'faction' },
        actorId: edge.source,
        factionId: edge.target,
      });
    }
  }

  return events.length > 0 ? { tickEvents: [...state.tickEvents, ...events] } : {};
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
 * @param rewardScale - Multiplier on the reputation paid, defaulting to 1 (full rate).
 *   THR-815 passes {@link FACTION_MEMBER_WORK_REWARD_SCALE} for work resolved off-screen
 *   at the faction tier, so the unattended path cannot out-earn a watched encounter.
 *   Kept as one optional parameter rather than a second reward function on purpose:
 *   rank bonus, alignment multiplier, and the completion bonus must stay on a single
 *   code path, or a future change to any of them silently applies to only one caller.
 */
export function processFactionEncounterReputation(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
  stepSuccess: boolean,
  encounterCompleted: boolean,
  tick: number,
  rewardScale = 1,
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

  // Clear promotionPending flag if this is a promotion encounter completion
  const edgeProps = factionEdge.properties as Partial<import('../types/disposition').MemberOfEdgeProperties>;
  const definition = edgeProps.factionDefId ? FACTION_DEFINITIONS.get(edgeProps.factionDefId) : undefined;
  if (encounterCompleted && definition?.promotionEncounterTemplateId === encounterId) {
    factionEdge.properties = {
      ...factionEdge.properties,
      promotionPending: false,
    };
  }

  // Apply encounter_reward_multiplier rank bonus (TB-062)
  const rewardMultiplier = getEncounterRewardMultiplier(graph, agentId, encounterId);
  if (rewardMultiplier !== 1.0) {
    emitFactionBonusTrace(tick, agentId, factionEdge.target, 'encounter_reward_multiplier', rewardMultiplier, encounterId);
  }

  // Apply reputation alignment multiplier — aligned traits boost, misaligned penalize
  const alignmentMultiplier = computeAlignmentMultiplier(graph, agentId, meta.factionDefId);
  const effectiveMultiplier = rewardMultiplier * alignmentMultiplier * rewardScale;

  // Apply per-step reputation gain (multiplied by rank + alignment bonuses)
  applyFactionReputationGain(
    graph,
    agentId,
    factionEdge.target,
    meta.reputationReward * effectiveMultiplier,
    tick,
    'quest_step',
  );

  // Apply bonus for full quest completion (also multiplied)
  if (encounterCompleted) {
    applyFactionReputationGain(
      graph,
      agentId,
      factionEdge.target,
      FACTION_REPUTATION_COMPLETION_BONUS * effectiveMultiplier,
      tick,
      'quest_complete',
    );
  }
}

// ─── Reputation Alignment ───────────────────────────────────────────────

/**
 * Compute a reputation gain multiplier based on how the agent's reputation
 * traits align with the faction's reputationAlignment preferences.
 *
 * Each aligned trait adds FACTION_ALIGNMENT_BONUS (e.g., +25%).
 * Each misaligned trait (opposite polarity on a reach the faction cares about)
 * applies FACTION_ALIGNMENT_PENALTY (e.g., -15%).
 *
 * Returns a multiplier (clamped to [0.5, 2.0]).
 */
function computeAlignmentMultiplier(
  graph: WorldGraph,
  agentId: string,
  factionDefId: string,
): number {
  const definition = FACTION_DEFINITIONS.get(factionDefId);
  if (!definition?.reputationAlignment) return 1.0;

  const agentTraits = getTraitsForNode(graph, agentId);
  const agentTraitIds = new Set(agentTraits.map(e => e.target));

  let bonus = 0;
  for (const [reach, desiredPolarity] of Object.entries(definition.reputationAlignment)) {
    const alignedId = getReputationTraitId(reach as import('../types/traits').ReachDomain, desiredPolarity);
    const oppositePolarity = desiredPolarity === 'positive' ? 'negative' : 'positive';
    const misalignedId = getReputationTraitId(reach as import('../types/traits').ReachDomain, oppositePolarity);

    if (agentTraitIds.has(alignedId)) {
      bonus += FACTION_ALIGNMENT_BONUS;
    }
    if (agentTraitIds.has(misalignedId)) {
      bonus += FACTION_ALIGNMENT_PENALTY;
    }
  }

  return Math.max(0.5, Math.min(2.0, 1.0 + bonus));
}
