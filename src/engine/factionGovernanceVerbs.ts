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
import type { GraphNode } from '../types/graph';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type {
  FactionStirDissentTrace,
  FactionWhisperLeaderTrace,
  FactionRecoverDoctrineTrace,
  FactionSurfaceDoubterTrace,
  FactionKindleCallingTrace,
} from '../types/factionAction';
import type { FactionAmbitionType } from '../types/faction';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
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
  KINDLE_CALLING_SEEDED_ENCOUNTER_ID,
  KINDLE_CALLING_ENCOUNTER_DELAY,
  KINDLE_CALLING_BIAS_WEIGHT_MEMBER,
  KINDLE_CALLING_BIAS_WEIGHT_LEADER,
  KINDLE_CALLING_BIAS_WEIGHT_DOCTRINE,
  KINDLE_CALLING_BIAS_WEIGHT_DISSENT,
  KINDLE_CALLING_DISSENT_BIAS_THRESHOLD,
  KINDLE_CALLING_ESSENCE_SHARPENING,
  KINDLE_CALLING_PRNG_SALT,
  KINDLED_CALLING_PENDING_CONDITION,
  KINDLED_CALLING_PENDING_DURATION,
} from '../data/faction-action-constants';
import { emitTrace } from './traceBuffer';
import {
  getDoubterCandidate,
  getFactionLeaderId,
  findRecoverableDoctrineClue,
} from './factionNetwork';
import {
  scoreEligibleAmbitions,
  mulberry32,
  hashString,
  type AmbitionCandidate,
} from './factionAmbitions';

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
  | 'surface_doubter'
  | 'kindle_a_calling';

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

// ─── Kindle a Calling (THR-433) ──────────────────────────────────────────────
//
// Internal-pressure resolver. Reuses scoreEligibleAmbitions/selectAmbitionType
// from factionAmbitions.ts; adds a four-signal `computeKindleBias` layer:
//   (a) member axiological pulls — what the rank-and-file leans toward
//   (b) leader bias — the seat's axiological profile, weighted higher
//   (c) doctrine pressure — recoveredDoctrineId nudges toward cultural / divine
//   (d) recent dissent — high dissentLevel pulls inward (defensive_consolidation),
//       away from territorial_expansion
// The essence-sharpening constant scales bias contributions before scoring.
// Result: a seeded PRNG draws one weighted candidate; the faction's `pursues`
// edge is replaced with the new ambition (unless army-locked); a calling-named
// encounter is planted on the leader. The player names neither the candidate
// nor the calling that will emerge from the gather.

/**
 * Map axiological pulls to ambition-type biases.
 *
 * Mortals don't pick ambitions; their values *lean* toward kinds of action.
 * This map captures that lean — each value pair contributes to one ambition
 * type on each pole. The signs are positive both directions because the
 * caller scales by |profile|, not by sign of profile.
 */
const AMBITION_BIAS_BY_VALUE_PAIR: Record<
  ValuePair,
  { positive: FactionAmbitionType; negative: FactionAmbitionType }
> = {
  mercy_ruthlessness: { positive: 'defensive_consolidation', negative: 'territorial_expansion' },
  asceticism_extravagance: { positive: 'cultural_dominance', negative: 'resource_acquisition' },
  honesty_cunning: { positive: 'divine_mandate', negative: 'revenge' },
  tradition_novelty: { positive: 'cultural_dominance', negative: 'territorial_expansion' },
  loyalty_ambition: { positive: 'defensive_consolidation', negative: 'territorial_expansion' },
  revelation_discretion: { positive: 'divine_mandate', negative: 'defensive_consolidation' },
  preservation_transformation: { positive: 'defensive_consolidation', negative: 'territorial_expansion' },
  sacrifice_survival: { positive: 'divine_mandate', negative: 'defensive_consolidation' },
  courage_prudence: { positive: 'territorial_expansion', negative: 'defensive_consolidation' },
};

type AmbitionBias = Partial<Record<FactionAmbitionType, number>>;

function applyProfileBias(
  bias: AmbitionBias,
  profile: AxiologicalProfile | undefined,
  scale: number,
): void {
  if (!profile) return;
  for (const pair of Object.keys(AMBITION_BIAS_BY_VALUE_PAIR) as ValuePair[]) {
    const value = profile[pair];
    if (value === undefined || value === 0) continue;
    const map = AMBITION_BIAS_BY_VALUE_PAIR[pair];
    const target = value > 0 ? map.positive : map.negative;
    bias[target] = (bias[target] ?? 0) + Math.abs(value) * scale;
  }
}

/**
 * Compute the four-signal bias map for a faction's latent goal candidates.
 * Returned biases are added to the base `scoreEligibleAmbitions` weights.
 */
function computeKindleBias(state: GameState, factionNode: GraphNode): AmbitionBias {
  const bias: AmbitionBias = {};
  const factionId = factionNode.id;

  // (a) Member axiological pulls — sum profiles across living, non-army members.
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  let memberCount = 0;
  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member) continue;
    if (member.type !== 'actor') continue;
    if (member.properties.actorType === 'group' || member.properties.armyState != null) continue;
    if (member.properties.deathTick != null) continue;
    const profile = member.properties.axiologicalProfile as AxiologicalProfile | undefined;
    applyProfileBias(bias, profile, KINDLE_CALLING_BIAS_WEIGHT_MEMBER);
    memberCount += 1;
  }
  // Normalize the member contribution so a 10-member faction doesn't dominate.
  if (memberCount > 1) {
    for (const key of Object.keys(bias) as FactionAmbitionType[]) {
      bias[key] = (bias[key] ?? 0) / memberCount;
    }
  }

  // (b) Leader bias — the seat carries weight beyond a single member.
  const leaderId = getFactionLeaderId(state.graph, factionId);
  if (leaderId) {
    const leader = state.graph.getNode(leaderId);
    if (leader) {
      const leaderProfile = leader.properties.axiologicalProfile as AxiologicalProfile | undefined;
      applyProfileBias(bias, leaderProfile, KINDLE_CALLING_BIAS_WEIGHT_LEADER);
    }
  }

  // (c) Doctrine pressure — a recovered doctrine actively reshapes the faction.
  const recoveredDoctrineId = factionNode.properties.recoveredDoctrineId as string | undefined;
  if (recoveredDoctrineId) {
    bias.cultural_dominance =
      (bias.cultural_dominance ?? 0) + KINDLE_CALLING_BIAS_WEIGHT_DOCTRINE;
    bias.divine_mandate =
      (bias.divine_mandate ?? 0) + KINDLE_CALLING_BIAS_WEIGHT_DOCTRINE * 0.6;
  }

  // (d) Recent dissent — high dissent pulls inward.
  const dissent = (factionNode.properties.dissentLevel as number | undefined) ?? 0;
  if (dissent >= KINDLE_CALLING_DISSENT_BIAS_THRESHOLD) {
    const dissentScale = (dissent - KINDLE_CALLING_DISSENT_BIAS_THRESHOLD)
      / Math.max(1 - KINDLE_CALLING_DISSENT_BIAS_THRESHOLD, 0.001);
    bias.defensive_consolidation =
      (bias.defensive_consolidation ?? 0)
      + KINDLE_CALLING_BIAS_WEIGHT_DISSENT * dissentScale;
    // Negative bias on expansion — a fracturing faction does not march out.
    bias.territorial_expansion =
      (bias.territorial_expansion ?? 0)
      - KINDLE_CALLING_BIAS_WEIGHT_DISSENT * dissentScale * 0.5;
  }

  // Apply essence sharpening — the cast pours heat; bias gets sharper.
  for (const key of Object.keys(bias) as FactionAmbitionType[]) {
    bias[key] = (bias[key] ?? 0) * KINDLE_CALLING_ESSENCE_SHARPENING;
  }

  return bias;
}

/**
 * Check whether the faction's current ambition is "locked" by an army that has
 * committed to pursuing it. An army-committed ambition cannot be overwritten —
 * the player must end the campaign before the next calling can rise.
 *
 * Returns the ambition node id when locked, or null when free to replace.
 */
function getArmyLockedAmbitionId(state: GameState, factionId: string): string | null {
  const factionPursues = state.graph.getOutgoingEdges(factionId, 'pursues');
  if (factionPursues.length === 0) return null;
  const ambitionId = factionPursues[0].target;

  // Any army (group actor in this faction) with a pursues edge to the same ambition?
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  for (const edge of memberEdges) {
    const member = state.graph.getNode(edge.source);
    if (!member) continue;
    if (member.properties.armyState == null && member.properties.actorType !== 'group') continue;
    const armyPursues = state.graph.getOutgoingEdges(edge.source, 'pursues');
    for (const pe of armyPursues) {
      if (pe.target === ambitionId) return ambitionId;
    }
  }
  return null;
}

function clampMin(value: number, floor: number): number {
  return value < floor ? floor : value;
}

/**
 * Apply Kindle a Calling: bias the faction's latent ambition candidates, draw
 * one with seeded PRNG, replace the faction's `pursues` edge (unless army-
 * locked), plant the calling-named encounter on the leader.
 *
 * Returns null when the faction node is missing, has no leader, has no
 * faction definition, has no eligible candidates, or is army-locked.
 * The trace is always emitted (including no-op cases) for inspectability.
 */
export function applyKindleACalling(
  state: GameState,
  factionId: string,
): FactionKindleCallingTrace | null {
  const factionNode = state.graph.getNode(factionId);
  if (!factionNode || factionNode.type !== 'actor') return null;
  if (factionNode.properties.actorType !== 'faction') return null;

  const definitionId = (factionNode.properties.factionDefId
    ?? factionNode.properties.factionDefinitionId) as string | undefined;
  if (!definitionId) return null;

  // Capture previous ambition (for trace + replacement).
  const previousPursues = state.graph.getOutgoingEdges(factionId, 'pursues');
  const previousAmbitionNode = previousPursues.length > 0
    ? state.graph.getNode(previousPursues[0].target)
    : null;
  const previousAmbitionType = previousAmbitionNode
    ? (previousAmbitionNode.properties.ambitionType as FactionAmbitionType | undefined) ?? null
    : null;

  // Army-lock check — refuse to overwrite a committed campaign.
  const lockedAmbitionId = getArmyLockedAmbitionId(state, factionId);
  if (lockedAmbitionId !== null) {
    const trace: FactionKindleCallingTrace = {
      tick: state.tick,
      category: 'faction_kindle_calling',
      factionId,
      factionName: factionNode.name,
      previousAmbitionType,
      newAmbitionType: null,
      candidates: [],
      lockedByArmy: true,
      noEligibleCandidates: false,
      summary:
        `The heat finds the ${factionNode.name}'s embers smothered — ` +
        `their army has already marched. The calling cannot rise.`,
    };
    emitTrace(trace);
    return trace;
  }

  // Score eligible candidates from the faction definition, then bias.
  const baseCandidates = scoreEligibleAmbitions(state, factionId, definitionId);
  if (baseCandidates.length === 0) {
    const trace: FactionKindleCallingTrace = {
      tick: state.tick,
      category: 'faction_kindle_calling',
      factionId,
      factionName: factionNode.name,
      previousAmbitionType,
      newAmbitionType: null,
      candidates: [],
      lockedByArmy: false,
      noEligibleCandidates: true,
      summary:
        `The embers in the ${factionNode.name} are cold — there is nothing ` +
        `here that wants. The calling does not rise.`,
    };
    emitTrace(trace);
    return trace;
  }

  const bias = computeKindleBias(state, factionNode);
  const biasedCandidates: AmbitionCandidate[] = baseCandidates.map(c => ({
    type: c.type,
    weight: clampMin(c.weight + (bias[c.type] ?? 0), 0.01),
  }));

  // Seeded PRNG draw — same per-faction-per-tick pattern as phaseFactionActions.
  const rng = mulberry32(
    state.seed + state.tick * 47 + hashString(factionId) + KINDLE_CALLING_PRNG_SALT,
  );
  const totalWeight = biasedCandidates.reduce((sum, c) => sum + c.weight, 0);
  const roll = rng() * totalWeight;
  let cumulative = 0;
  let chosenType: FactionAmbitionType = biasedCandidates[0].type;
  for (const candidate of biasedCandidates) {
    cumulative += candidate.weight;
    if (roll < cumulative) {
      chosenType = candidate.type;
      break;
    }
  }

  // Replace the faction's ambition. If the previous ambition was a non-army-
  // locked node we built before, remove it (and its edges) cleanly.
  if (previousAmbitionNode) {
    state.graph.removeNode(previousAmbitionNode.id);
  }
  const ambitionId = `amb_${factionId}_${state.tick}_kindled`;
  state.graph.addNode({
    id: ambitionId,
    type: 'ambition',
    name: `${factionNode.name} — ${chosenType.replace(/_/g, ' ')} (kindled)`,
    properties: {
      ambitionType: chosenType,
      priority: chosenType === 'revenge' ? 0.85 : 0.7,
      targetNodeId: null,
      grievanceDecay: 0,
      createdTick: state.tick,
      kindled: true,
    },
  });
  state.graph.addEdge({
    id: `e_pursues_${factionId}_${ambitionId}`,
    source: factionId,
    target: ambitionId,
    type: 'pursues',
    properties: {
      priority: chosenType === 'revenge' ? 0.85 : 0.7,
      status: 'active',
      milestones: [],
      kindled: true,
    },
  });

  // Plant the calling-named encounter on the leader (already verified by
  // surfacing — but be defensive).
  const leaderId = getFactionLeaderId(state.graph, factionId);
  const leaderNode = leaderId ? state.graph.getNode(leaderId) : null;
  let seededEncounterId: string | undefined;
  if (leaderId && leaderNode) {
    seededEncounterId = `seed_kindled_${factionId}_${state.tick}`;
    plantSeed(state, {
      seedId: seededEncounterId,
      sourceEncounterId: `divine_cast_kindle_calling_${state.tick}`,
      sourceReactionId: 'faction.kindle_a_calling',
      templateId: KINDLE_CALLING_SEEDED_ENCOUNTER_ID,
      targetAgentId: leaderId,
      eligibleAfterTick: state.tick + KINDLE_CALLING_ENCOUNTER_DELAY,
      priority: 0.7,
      seedLabel: `${factionNode.name} names its calling`,
      plantedTick: state.tick,
    });

    // Mark the leader so the chronicle / UI can show the kindled state.
    const conditions = (leaderNode.properties.conditions as string[] | undefined) ?? [];
    state.graph.updateNode(leaderId, {
      properties: {
        conditions: addCondition(conditions, KINDLED_CALLING_PENDING_CONDITION),
        kindledCallingExpiresTick: state.tick + KINDLED_CALLING_PENDING_DURATION,
        kindledCallingAmbitionType: chosenType,
      },
    });
  }

  const trace: FactionKindleCallingTrace = {
    tick: state.tick,
    category: 'faction_kindle_calling',
    factionId,
    factionName: factionNode.name,
    previousAmbitionType,
    newAmbitionType: chosenType,
    candidates: biasedCandidates.map(c => ({ type: c.type, finalWeight: c.weight })),
    lockedByArmy: false,
    noEligibleCandidates: false,
    seededEncounterId,
    leaderId: leaderId ?? undefined,
    leaderName: leaderNode?.name,
    summary:
      `You pour heat into the embers ${factionNode.name} have been keeping. ` +
      `${chosenType.replace(/_/g, ' ')} rises — the calling that wanted ` +
      `to be wanted now wants.`,
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
    case 'kindle_a_calling':
      return applyKindleACalling(state, factionId) !== null;
  }
}
