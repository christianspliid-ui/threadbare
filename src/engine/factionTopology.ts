/**
 * Faction Topology — schism-resolution graph mutations (THR-430).
 *
 * Two sibling operations callable from phaseSchismResolution:
 *
 *   - `performFactionSplit`  — partitions the faction along the axis of
 *     disagreement, mints a new actor node, transfers ~half of member_of
 *     edges to the splinter, copies relates_to edges, creates a hostile
 *     back-edge, and emits faction_splintered + schism_resolved traces.
 *
 *   - `performFactionReform` — applies a reputation penalty to the faction,
 *     expels the SCHISM_REFORM_EXPULSION_COUNT most-misaligned members, and
 *     emits the faction_reformed + schism_resolved traces.
 *
 * These do NOT call into the existing encounter-aftermath `faction_splinter`
 * effect path (which lives inside applyAftermathEffects' big switch and
 * requires an encounter context that the schism resolution phase does not
 * have). Instead they reuse the same graph-mutation primitives and the same
 * tuning constants (FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE,
 * FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT, FACTION_MUTATION_CHRONICLE_SIGNIFICANCE),
 * so the produced graph is observationally identical to a splinter aftermath
 * outcome.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld, touchStructure } from './simulationRuntime';
import { emitTrace } from './traceBuffer';
import { DEFAULT_REPUTATION } from '../types/disposition';
import {
  FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE,
  FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT,
  FACTION_MUTATION_CHRONICLE_SIGNIFICANCE,
  SCHISM_REFORM_REPUTATION_PENALTY,
  SCHISM_REFORM_EXPULSION_COUNT,
  SCHISM_RESOLUTION_CHRONICLE_SIGNIFICANCE,
} from '../data/game-config';
import { appendRecentEvent } from './encounterAftermath';
import {
  generateSplinterName,
  formatSchismSplitChronicle,
  formatSchismReformChronicle,
} from '../data/faction-schism-content';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Outcome decision inputs surfaced on the schism_resolved trace. */
export interface SchismDecisionInputs {
  cohesionDrop: number;
  spread: number;
  dissent: number;
}

export interface SchismDecision {
  outcome: 'split' | 'reform';
  splitPressure: number;
  inputs: SchismDecisionInputs;
}

/**
 * Compute a faction-cohesion scalar in [0, 1] as the mean reputation across
 * member_of edges. High values = members are aligned and engaged; low values
 * = members have drifted toward expulsion or alignment with rivals.
 *
 * Returns 0 when the faction has no members (a faction with no members is
 * trivially incohesive — schism resolution will short-circuit it elsewhere).
 */
export function computeFactionCohesion(state: GameState, factionId: string): number {
  const edges = state.graph.getIncomingEdges(factionId, 'member_of');
  if (edges.length === 0) return 0;
  let total = 0;
  for (const e of edges) {
    const rep = (e.properties?.reputation as number | undefined);
    total += typeof rep === 'number' ? rep : DEFAULT_REPUTATION;
  }
  return clamp01(total / edges.length);
}

/**
 * Faction split — minted splinter inherits ~half the members (the ones with
 * the lowest reputation against the parent, i.e. the most misaligned), gets
 * a fractional inherited reputation, copies relates_to edges, and starts
 * resentful toward the parent.
 *
 * Mirrors the splinter-aftermath shape in encounterAftermath.ts. Returns the
 * minted faction id + an updated `recentEvents` array (caller decides where
 * to assign it).
 */
export function performFactionSplit(
  state: GameState,
  runtime: SimulationRuntime | undefined,
  factionId: string,
  decision: SchismDecision,
  tick: number,
): {
  success: boolean;
  splinterFactionId?: string;
  splinterName?: string;
  memberCount?: number;
  events: TickEvent[];
  failReason?: string;
} {
  const faction = state.graph.getNode(factionId);
  if (!faction || (faction.properties?.actorStatus as string | undefined) === 'dissolved') {
    return { success: false, events: [], failReason: 'faction_invalid' };
  }

  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  if (memberEdges.length < 2) {
    // Can't split a faction of fewer than 2 — caller should route to reform.
    return { success: false, events: [], failReason: 'too_few_members' };
  }

  // Pick the misaligned half: members with the lowest reputation against
  // the parent. Deterministic across runs (sort by reputation asc, then by
  // edge id as tie-break).
  const ranked = [...memberEdges].sort((a, b) => {
    const repA = (a.properties?.reputation as number | undefined) ?? DEFAULT_REPUTATION;
    const repB = (b.properties?.reputation as number | undefined) ?? DEFAULT_REPUTATION;
    if (repA !== repB) return repA - repB;
    return a.id.localeCompare(b.id);
  });
  const splinterCount = Math.max(1, Math.floor(memberEdges.length / 2));
  const splinterEdges = ranked.slice(0, splinterCount);

  // Determine factionType + dominant reach for naming
  const factionType = (faction.properties?.factionType as string | undefined);
  const dominantReach = (faction.properties?.dominantReach as string | undefined);
  const splinterName = generateSplinterName(faction.name ?? 'faction', factionType, dominantReach);
  const splinterFactionId = `faction_schism_${factionId}_${tick}`;

  state.graph.addNode({
    id: splinterFactionId,
    type: 'actor',
    name: splinterName,
    properties: {
      actorType: 'faction',
      actorStatus: 'active',
      foundedTick: tick,
      schismParentFactionId: factionId,
      // Inherit visible faction-type bookkeeping
      factionType: factionType,
      dominantReach: dominantReach,
    },
  });

  // Move member_of edges to splinter
  const repShare = FACTION_SPLINTER_DEFAULT_REPUTATION_SHARE;
  for (const e of splinterEdges) {
    const memberId = e.source;
    const oldRep = (e.properties?.reputation as number | undefined) ?? DEFAULT_REPUTATION;
    state.graph.removeEdge(e.id);
    state.graph.addEdge({
      id: `member_of_${memberId}_${splinterFactionId}`,
      source: memberId,
      target: splinterFactionId,
      type: 'member_of',
      properties: { reputation: clamp01(oldRep * repShare), joinedTick: tick },
    });
  }

  // Copy relates_to edges from parent → other factions (marked inherited)
  const srcRelations = state.graph.getOutgoingEdges(factionId, 'relates_to');
  for (const rel of srcRelations) {
    if (rel.target === splinterFactionId) continue;
    state.graph.addEdge({
      id: `relates_to_${splinterFactionId}_${rel.target}_inherited`,
      source: splinterFactionId,
      target: rel.target,
      type: 'relates_to',
      properties: { ...rel.properties, inherited: true },
    });
  }

  // Resentful back-edge: splinter → parent
  state.graph.addEdge({
    id: `relates_to_${splinterFactionId}_${factionId}`,
    source: splinterFactionId,
    target: factionId,
    type: 'relates_to',
    properties: {
      sentiment: FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT,
      strength: 0.8,
      basis: 'schism',
    },
  });

  if (runtime) {
    touchWorld(runtime);
    touchStructure(runtime);
  }

  const factionName = faction.name ?? 'faction';
  const significance = FACTION_MUTATION_CHRONICLE_SIGNIFICANCE.splinter;
  const message = formatSchismSplitChronicle(factionName, splinterName);
  const event: TickEvent = {
    id: `${splinterFactionId}_chronicle`,
    tick,
    type: 'narrative',
    message,
    significance,
    actorId: factionId,
  };

  emitTrace({
    tick,
    category: 'faction_splintered',
    sourceFactionId: factionId,
    newFactionId: splinterFactionId,
    memberCount: splinterEdges.length,
    selectionKind: 'schism',
    reputationShare: repShare,
    success: true,
    summary: `schism→split: ${factionId} → ${splinterFactionId} (${splinterEdges.length} members)`,
  });

  emitTrace({
    tick,
    category: 'schism_resolved',
    factionId,
    factionName,
    outcome: 'split',
    splitPressure: decision.splitPressure,
    inputs: decision.inputs,
    splinterFactionId,
    splinterMemberCount: splinterEdges.length,
    summary: `schism_resolved[${factionId}]: split → ${splinterFactionId} (pressure=${decision.splitPressure.toFixed(2)})`,
  });

  return {
    success: true,
    splinterFactionId,
    splinterName,
    memberCount: splinterEdges.length,
    events: [event],
  };
}

/**
 * Faction reform — the schism resolved inward. Apply a reputation penalty to
 * the faction node and expel the SCHISM_REFORM_EXPULSION_COUNT most-misaligned
 * members (clamped so the faction is never left empty).
 */
export function performFactionReform(
  state: GameState,
  runtime: SimulationRuntime | undefined,
  factionId: string,
  decision: SchismDecision,
  tick: number,
): {
  success: boolean;
  expelledIds: string[];
  reputationBefore: number;
  reputationAfter: number;
  events: TickEvent[];
  failReason?: string;
} {
  const faction = state.graph.getNode(factionId);
  if (!faction || (faction.properties?.actorStatus as string | undefined) === 'dissolved') {
    return { success: false, expelledIds: [], reputationBefore: 0, reputationAfter: 0, events: [], failReason: 'faction_invalid' };
  }

  // 1. Reputation penalty on the faction itself
  const reputationBefore = (faction.properties.reputation as number | undefined) ?? 0.5;
  const reputationAfter = clamp01(reputationBefore - SCHISM_REFORM_REPUTATION_PENALTY);
  faction.properties.reputation = reputationAfter;
  faction.properties.lastSchismReformTick = tick;

  // 2. Expel K most-misaligned members (clamped to leave at least 1 standing)
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  const ranked = [...memberEdges].sort((a, b) => {
    const repA = (a.properties?.reputation as number | undefined) ?? DEFAULT_REPUTATION;
    const repB = (b.properties?.reputation as number | undefined) ?? DEFAULT_REPUTATION;
    if (repA !== repB) return repA - repB;
    return a.id.localeCompare(b.id);
  });
  const maxExpel = Math.max(0, memberEdges.length - 1);
  const expelCount = Math.min(SCHISM_REFORM_EXPULSION_COUNT, maxExpel);
  const expelEdges = ranked.slice(0, expelCount);
  const expelledIds: string[] = [];
  for (const e of expelEdges) {
    state.graph.removeEdge(e.id);
    expelledIds.push(e.source);
  }
  faction.properties.lastSchismExpelledCount = expelledIds.length;

  if (runtime) {
    touchWorld(runtime);
    touchStructure(runtime);
  }

  const factionName = faction.name ?? 'faction';
  const significance = SCHISM_RESOLUTION_CHRONICLE_SIGNIFICANCE;
  const message = formatSchismReformChronicle(factionName, expelledIds.length);
  const event: TickEvent = {
    id: `${factionId}_chronicle_schism_reform_${tick}`,
    tick,
    type: 'narrative',
    message,
    significance,
    actorId: factionId,
  };

  emitTrace({
    tick,
    category: 'faction_reformed',
    factionId,
    factionName,
    reputationBefore,
    reputationAfter,
    expelledCount: expelledIds.length,
    expelledIds,
    summary: `faction_reformed[${factionId}]: ${expelledIds.length} expelled, rep ${reputationBefore.toFixed(2)} → ${reputationAfter.toFixed(2)}`,
  });

  emitTrace({
    tick,
    category: 'schism_resolved',
    factionId,
    factionName,
    outcome: 'reform',
    splitPressure: decision.splitPressure,
    inputs: decision.inputs,
    expelledMemberIds: expelledIds,
    summary: `schism_resolved[${factionId}]: reform → ${expelledIds.length} expelled (pressure=${decision.splitPressure.toFixed(2)})`,
  });

  return {
    success: true,
    expelledIds,
    reputationBefore,
    reputationAfter,
    events: [event],
  };
}

/**
 * Decide reform-or-split for a pending schism. Pure: takes state at the
 * resolution tick + the baseline cohesion that was snapshotted at plant
 * time + a deterministic [0, 1) sample, returns the outcome and inputs.
 *
 * The PRNG sample lets callers feed a tick-seeded source so the decision is
 * replayable.
 */
export function decideSchismOutcome(
  state: GameState,
  factionId: string,
  baselineCohesion: number,
  prngSample: number,
  weights: { cohesion: number; spread: number; dissent: number },
): SchismDecision {
  const currentCohesion = computeFactionCohesion(state, factionId);
  const cohesionDrop = clamp01(baselineCohesion - currentCohesion);
  // Spread input is fail-soft to 0 per plan §3.8 row 3 — full member-axiology
  // stddev is out of scope for v1; the system drifts toward reform when this
  // signal is unavailable, which matches the "world heals" failure mode.
  const spread = 0;
  const faction = state.graph.getNode(factionId);
  const dissentRaw = (faction?.properties?.dissentScore as number | undefined) ?? 0;
  const dissent = clamp01(dissentRaw);

  const splitPressure = clamp01(
    weights.cohesion * cohesionDrop +
    weights.spread * spread +
    weights.dissent * dissent
  );

  return {
    outcome: prngSample < splitPressure ? 'split' : 'reform',
    splitPressure,
    inputs: { cohesionDrop, spread, dissent },
  };
}
