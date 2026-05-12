/**
 * Faction Governance Verbs (THR-400) — engine dispatch for the four divine
 * actions that target a faction:
 *
 *   - Stir Dissent        → applyStirDissent
 *   - Whisper to Leader   → applyWhisperLeader
 *   - Recover Doctrine    → applyRecoverDoctrine
 *   - Surface a Doubter   → applySurfaceDoubter
 *
 * Each verb mutates the world graph, emits a trace, and (where applicable)
 * plants an encounter seed via `state.pendingEncounterSeeds`. Verbs are pure
 * w.r.t. the GameState handed in (they call `state.graph.updateNode(...)` —
 * the world graph is mutated in place per the load-bearing decision in
 * CLAUDE.md, with structural-version touches taken care of by the caller's
 * tick phase).
 *
 * Plan doc: Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md §5
 *
 * NFPs:
 *   #1 Tunability  — all magic numbers in faction-action-constants.ts
 *   #2 Inspectability — every verb emits a typed trace
 *   #3 Determinism  — verbs read state only; no PRNG (doubter resolution is
 *                     deterministic via getDoubterCandidate)
 *   #4 Fail-soft    — every verb returns null on missing substrate; no throws
 */

import type { GameState } from '../types/gameState';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type {
  FactionStirDissentTrace,
  FactionWhisperLeaderTrace,
  FactionRecoverDoctrineTrace,
  FactionSurfaceDoubterTrace,
} from '../types/factionAction';
import {
  STIR_DISSENT_INCREMENT,
  WHISPER_LEADER_CONDITION_DURATION,
  LEADER_WHISPER_FOLLOWUP_DELAY,
  WHISPER_LEADER_FOLLOWUP_ENCOUNTER_ID,
  RECOVERED_DOCTRINE_REALIGN_DURATION,
  RECOVER_DOCTRINE_SEEDED_ENCOUNTER_ID,
  SURFACE_DOUBTER_DISSENT_CONTRIBUTION,
  SURFACE_DOUBTER_ENCOUNTER_DELAY,
  SURFACE_DOUBTER_SEEDED_ENCOUNTER_ID,
  SURFACED_BY_DIVINE_ATTENTION_CONDITION,
  DIVINE_WHISPER_PENDING_CONDITION,
} from '../data/faction-action-constants';
import { emitTrace } from './traceBuffer';
import {
  getDoubterCandidate,
  getFactionLeaderId,
  findRecoverableDoctrineClue,
} from './factionNetwork';

// ─── Shared helpers ──────────────────────────────────────────────────────────

function addCondition(conditions: string[] | undefined, value: string): string[] {
  const list = conditions ?? [];
  if (list.includes(value)) return list;
  return [...list, value];
}

function plantSeed(state: GameState, seed: PendingEncounterSeed): void {
  state.pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? []), seed];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ─── Verb dispatch kinds ─────────────────────────────────────────────────────

export type FactionGovernanceVerbKind =
  | 'stir_dissent'
  | 'whisper_leader'
  | 'recover_doctrine'
  | 'surface_doubter';

export type LeaderWhisperPole = 'protector' | 'conqueror' | 'sworn' | 'renegade';

// ─── Stir Dissent ────────────────────────────────────────────────────────────

/**
 * Raise the faction's `dissentLevel` by STIR_DISSENT_INCREMENT (clamped to 1).
 * The tick-phase decay + threshold check picks up the elevated level and may
 * seed an encounter on a member when crossing the threshold; this verb itself
 * only nudges the bar. Returns null only when the faction node is missing.
 */
export function applyStirDissent(
  state: GameState,
  factionId: string,
): FactionStirDissentTrace | null {
  const factionNode = state.graph.getNode(factionId);
  if (!factionNode || factionNode.type !== 'actor') return null;
  if (factionNode.properties.actorType !== 'faction') return null;

  const previous = (factionNode.properties.dissentLevel as number | undefined) ?? 0;
  const next = clamp01(previous + STIR_DISSENT_INCREMENT);
  state.graph.updateNode(factionId, { properties: { dissentLevel: next } });

  const trace: FactionStirDissentTrace = {
    tick: state.tick,
    category: 'faction_stir_dissent',
    factionId,
    factionName: factionNode.name,
    previousDissentLevel: previous,
    newDissentLevel: next,
    summary:
      `${factionNode.name} grows quieter than it should — dissent rises ` +
      `from ${previous.toFixed(2)} to ${next.toFixed(2)}.`,
  };
  emitTrace(trace);
  return trace;
}

// ─── Whisper to the Leader ───────────────────────────────────────────────────

/**
 * Apply a divine-whisper condition to the faction's current leader, optionally
 * planting a leader-at-a-crossroads encounter seed on a delay. The condition
 * carries the player's chosen pole and a tick-down timer.
 *
 * Conflict semantics: if the leader already has a `divine_whisper_pending`
 * condition (from another god / another cast), the cast still costs essence
 * and updates the pole, but the trace's `conflictedWithOtherWhisper` flag
 * surfaces this for chronicle prose.
 *
 * Returns null when the faction has no resolvable leader.
 */
export function applyWhisperLeader(
  state: GameState,
  factionId: string,
  preferredPole: LeaderWhisperPole,
): FactionWhisperLeaderTrace | null {
  const factionNode = state.graph.getNode(factionId);
  if (!factionNode || factionNode.type !== 'actor') return null;
  if (factionNode.properties.actorType !== 'faction') return null;

  const leaderId = getFactionLeaderId(state.graph, factionId);
  if (!leaderId) return null;
  const leaderNode = state.graph.getNode(leaderId);
  if (!leaderNode) return null;

  const conditions = (leaderNode.properties.conditions as string[] | undefined) ?? [];
  const wasAlreadyWhispered = conditions.includes(DIVINE_WHISPER_PENDING_CONDITION);

  state.graph.updateNode(leaderId, {
    properties: {
      conditions: addCondition(conditions, DIVINE_WHISPER_PENDING_CONDITION),
      divineWhisperPreferredPole: preferredPole,
      divineWhisperExpiresTick: state.tick + WHISPER_LEADER_CONDITION_DURATION,
    },
  });

  const seedId = `seed_whisper_${factionId}_${state.tick}`;
  plantSeed(state, {
    seedId,
    sourceEncounterId: `divine_cast_whisper_leader_${state.tick}`,
    sourceReactionId: 'faction.whisper_leader',
    templateId: WHISPER_LEADER_FOLLOWUP_ENCOUNTER_ID,
    targetAgentId: leaderId,
    eligibleAfterTick: state.tick + LEADER_WHISPER_FOLLOWUP_DELAY,
    priority: 0.6,
    seedLabel: `whisper to ${leaderNode.name}`,
    plantedTick: state.tick,
  });

  const trace: FactionWhisperLeaderTrace = {
    tick: state.tick,
    category: 'faction_whisper_leader',
    factionId,
    factionName: factionNode.name,
    leaderId,
    leaderName: leaderNode.name,
    preferredPole,
    conflictedWithOtherWhisper: wasAlreadyWhispered,
    seededFollowupEncounterId: seedId,
    summary:
      `${leaderNode.name} carries a question now that is not their own — ` +
      `the ${preferredPole} pole tilts ${factionNode.name}'s next decision.`,
  };
  emitTrace(trace);
  return trace;
}

// ─── Recover Doctrine ────────────────────────────────────────────────────────

/**
 * Surface a recovered_doctrine clue tagged for this faction. Consumes the clue
 * node, sets `recoveredDoctrineId` + expiry on the faction, and seeds a
 * doctrine-surfaces encounter on the leader (or the faction's anointed
 * champion if one is active). Realigns the faction's reputationAlignment for
 * RECOVERED_DOCTRINE_REALIGN_DURATION ticks when the clue carries a
 * `realignment` field.
 *
 * Returns null when no clue exists (verb should not have surfaced — guard).
 */
export function applyRecoverDoctrine(
  state: GameState,
  factionId: string,
): FactionRecoverDoctrineTrace | null {
  const factionNode = state.graph.getNode(factionId);
  if (!factionNode || factionNode.type !== 'actor') return null;
  if (factionNode.properties.actorType !== 'faction') return null;

  const clue = findRecoverableDoctrineClue(state.graph, factionId);
  if (!clue) return null;

  const doctrineId = (clue.properties.doctrineId as string | undefined) ?? clue.id;
  const realignment = clue.properties.realignment as
    | Partial<Record<string, string>>
    | undefined;

  // Resolve the target mortal: anointed champion if active, else leader.
  const leaderId = getFactionLeaderId(state.graph, factionId);
  // Check for an active champion (member with championBlessing condition).
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  let championId: string | null = null;
  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member) continue;
    if (member.properties.championBlessing) {
      championId = member.id;
      break;
    }
  }
  const targetMortalId = championId ?? leaderId;
  if (!targetMortalId) return null;
  const targetMortalNode = state.graph.getNode(targetMortalId);
  if (!targetMortalNode) return null;

  // Consume the clue node.
  state.graph.removeNode(clue.id);

  // Set the recovered doctrine + realignment markers on the faction.
  const previousAlignment = factionNode.properties.reputationAlignment as
    | Partial<Record<string, string>>
    | undefined;
  const realignmentApplied = !!realignment && Object.keys(realignment).length > 0;
  const updates: Record<string, unknown> = {
    recoveredDoctrineId: doctrineId,
    recoveredDoctrineExpiresTick: state.tick + RECOVERED_DOCTRINE_REALIGN_DURATION,
  };
  if (realignmentApplied && realignment) {
    updates.reputationAlignmentBeforeDoctrine = previousAlignment ?? null;
    updates.reputationAlignment = { ...(previousAlignment ?? {}), ...realignment };
  }
  state.graph.updateNode(factionId, { properties: updates });

  const seedId = `seed_doctrine_${factionId}_${state.tick}`;
  plantSeed(state, {
    seedId,
    sourceEncounterId: `divine_cast_recover_doctrine_${state.tick}`,
    sourceReactionId: 'faction.recover_doctrine',
    templateId: RECOVER_DOCTRINE_SEEDED_ENCOUNTER_ID,
    targetAgentId: targetMortalId,
    eligibleAfterTick: state.tick + 1,
    priority: 0.65,
    seedLabel: `recovered doctrine surfaces in ${factionNode.name}`,
    plantedTick: state.tick,
  });

  const trace: FactionRecoverDoctrineTrace = {
    tick: state.tick,
    category: 'faction_recover_doctrine',
    factionId,
    factionName: factionNode.name,
    doctrineId,
    targetMortalId,
    targetMortalName: targetMortalNode.name,
    realignmentApplied,
    seededEncounterId: seedId,
    summary:
      `Inside ${factionNode.name}, a teaching surfaces that was old before ` +
      `the faction had its name — ${targetMortalNode.name} carries it now.`,
  };
  emitTrace(trace);
  return trace;
}

// ─── Surface a Doubter ───────────────────────────────────────────────────────

/**
 * Name the faction's most axiologically misaligned member, marking them with
 * the `surfaced_by_divine_attention` condition + planting a doubter-chooses
 * encounter on a delay. Also nudges the faction's dissent by a small amount
 * (smaller than Stir Dissent — surfacing is a quieter act).
 *
 * Returns null when no doubter candidate exists (verb should not have surfaced
 * — guard).
 */
export function applySurfaceDoubter(
  state: GameState,
  factionId: string,
): FactionSurfaceDoubterTrace | null {
  const factionNode = state.graph.getNode(factionId);
  if (!factionNode || factionNode.type !== 'actor') return null;
  if (factionNode.properties.actorType !== 'faction') return null;

  const doubter = getDoubterCandidate(state.graph, factionId);
  if (!doubter) return null;
  const doubterNode = state.graph.getNode(doubter.agentId);
  if (!doubterNode) return null;

  // Apply the condition + axisDistance breadcrumb.
  const conditions = (doubterNode.properties.conditions as string[] | undefined) ?? [];
  state.graph.updateNode(doubter.agentId, {
    properties: {
      conditions: addCondition(conditions, SURFACED_BY_DIVINE_ATTENTION_CONDITION),
      surfacedByDivineAttentionTick: state.tick,
      surfacedDoubterAxisDistance: doubter.axisDistance,
    },
  });

  // Bump faction dissent (smaller than Stir Dissent's increment).
  const previousDissent = (factionNode.properties.dissentLevel as number | undefined) ?? 0;
  const nextDissent = clamp01(previousDissent + SURFACE_DOUBTER_DISSENT_CONTRIBUTION);
  state.graph.updateNode(factionId, { properties: { dissentLevel: nextDissent } });

  // Plant the doubter-chooses encounter on a delay.
  const seedId = `seed_doubter_${factionId}_${state.tick}`;
  plantSeed(state, {
    seedId,
    sourceEncounterId: `divine_cast_surface_doubter_${state.tick}`,
    sourceReactionId: 'faction.surface_doubter',
    templateId: SURFACE_DOUBTER_SEEDED_ENCOUNTER_ID,
    targetAgentId: doubter.agentId,
    eligibleAfterTick: state.tick + SURFACE_DOUBTER_ENCOUNTER_DELAY,
    priority: 0.6,
    seedLabel: `${doubter.agentName} feels themselves seen`,
    plantedTick: state.tick,
  });

  // Detect bond initiation: if no thread edge from ascendant to doubter, this
  // surfaces is what gives them their first thread. We don't create the thread
  // here (that's the player's call afterward) — we just flag the lack on the
  // trace for the chronicle.
  const ascendantId = state.ascendantId;
  let bondInitiated = false;
  if (ascendantId) {
    const threadEdges = state.graph.getOutgoingEdges(ascendantId, 'bond');
    bondInitiated = !threadEdges.some(e => e.target === doubter.agentId);
  }

  const intelligenceGrantId = `intel_${factionId}_doubter_${state.tick}`;
  const trace: FactionSurfaceDoubterTrace = {
    tick: state.tick,
    category: 'faction_surface_doubter',
    factionId,
    factionName: factionNode.name,
    doubterId: doubter.agentId,
    doubterName: doubter.agentName,
    axisDistance: doubter.axisDistance,
    bondInitiated,
    intelligenceGrantId,
    seededEncounterId: seedId,
    summary:
      `${doubter.agentName} feels themselves seen by something larger than ` +
      `${factionNode.name} — the seeing is the gift.`,
  };
  emitTrace(trace);
  return trace;
}

// ─── Verb dispatch ───────────────────────────────────────────────────────────

/**
 * Single entrypoint used by the graphOpExecutor when running a
 * `op: 'faction_verb'` operation. Dispatches by `verbKind` to the matching
 * applier above. Returns true on success, false when substrate was missing.
 */
export function applyFactionGovernanceVerb(
  state: GameState,
  verbKind: FactionGovernanceVerbKind,
  factionId: string,
  options: { preferredPole?: LeaderWhisperPole } = {},
): boolean {
  switch (verbKind) {
    case 'stir_dissent':
      return applyStirDissent(state, factionId) !== null;
    case 'whisper_leader':
      return applyWhisperLeader(state, factionId, options.preferredPole ?? 'sworn') !== null;
    case 'recover_doctrine':
      return applyRecoverDoctrine(state, factionId) !== null;
    case 'surface_doubter':
      return applySurfaceDoubter(state, factionId) !== null;
  }
}
