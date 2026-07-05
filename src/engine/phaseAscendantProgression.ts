/**
 * Ascendant Progression — god-side capability growth (THR-613, plan §3, Slice 1).
 *
 * Two responsibilities, both engine substrate:
 *
 *  1. `accruePlayerReachPractice` — called from the unified-action resolution loop
 *     when the player (ascendant) resolves an action carrying an in-domain `reach`.
 *     It grows `ascendant.properties.reachPractice[reach]`, which `computeRawScore`
 *     folds into Domain Capability through the same sigmoid the agents use (one
 *     source of truth, no parallel XP number — load-bearing: "ascendants use the same
 *     prerequisite system as agents").
 *
 *  2. `phaseAscendantProgression` — a leaf tick phase that runs immediately before the
 *     Ascendant Beat Director. It derives the ascendant's live tier per permanent
 *     reach, compares against `reachTierSnapshot`, and on an upward crossing sets the
 *     Director's `pending` slot to a Deepening beat. Because it runs first and the
 *     Director skips when `pending` is set, a Deepening beat naturally preempts the
 *     cadence draw for that tick (highest progression priority) — with zero change to
 *     the Director itself (mutex-safe with THR-611's beat-enqueue work).
 *
 * Fail-soft throughout (NFP #4): missing ascendant / affinities / beat state → no-op.
 * Deterministic (NFP #3): pure derivation from graph state; no PRNG.
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type { AscendantProperties } from '../types/influence';
import type { PendingBeat } from '../types/ascendantBeat';
import { computeCapability, computeTier } from './domainCapability';
import { difficultyScaling } from './capabilityGrowth';
import { emitTrace } from './traceBuffer';
import {
  PLAYER_PRACTICE_PER_ACTION,
  PLAYER_DIMINISHING_RETURNS_FACTOR,
  SECONDARY_REACH_PRACTICE_MULT,
  DEEPENING_BEAT_MAX_PER_TICK,
  deepeningBeatIdForReach,
} from '../data/player-progression';

type EmitInput = Parameters<typeof emitTrace>[0];

/**
 * The ascendant's permanent reaches, ranked primary-first by affinity value. Stable:
 * ties broken by reach name so the ranking is deterministic across runs.
 */
function rankedAffinityReaches(props: AscendantProperties): ReachDomain[] {
  const affinities = props.domainAffinities;
  if (!affinities) return [];
  return (Object.entries(affinities) as [ReachDomain, number][])
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([reach]) => reach);
}

/**
 * Accrue reach practice for one resolved in-domain player action (plan §3.1).
 *
 * Only accrues when `reach` is one of the ascendant's two permanent reaches — a
 * universal (`star`) action fired by an off-domain god does not inflate that reach.
 * Returns the new `reachPractice[reach]` total, or `null` if nothing accrued
 * (missing node, off-domain reach).
 */
export function accruePlayerReachPractice(
  graph: WorldGraph,
  ascendantId: string,
  reach: ReachDomain,
  stepDifficulty0to1: number,
  tick: number,
): number | null {
  const node = graph.getNode(ascendantId);
  if (!node) return null;
  const props = node.properties as unknown as AscendantProperties;
  const ranked = rankedAffinityReaches(props);
  const rank = ranked.indexOf(reach);
  if (rank < 0) return null; // off-domain: no accrual (plan §3.1)

  const currentCap = computeCapability(graph, ascendantId, reach);
  const diffScale = difficultyScaling(stepDifficulty0to1 * 100);
  const diminishing = Math.max(1 - currentCap * PLAYER_DIMINISHING_RETURNS_FACTOR, 0.1);
  const secondaryMult = rank >= 1 ? SECONDARY_REACH_PRACTICE_MULT : 1;
  const delta = PLAYER_PRACTICE_PER_ACTION * diffScale * diminishing * secondaryMult;

  const bag: Partial<Record<ReachDomain, number>> = { ...(props.reachPractice ?? {}) };
  const total = (bag[reach] ?? 0) + delta;
  bag[reach] = total;
  node.properties.reachPractice = bag;

  emitTrace({
    category: 'ascendant.progression.practice',
    tick,
    turn: tick,
    reach,
    delta,
    total,
    summary: `reach practice ${reach} +${delta.toFixed(3)} (now ${total.toFixed(3)})`,
  } as unknown as EmitInput);

  return total;
}

/**
 * Tick phase: detect god-side tier crossings and enqueue a Deepening beat.
 * Returns a `Partial<GameState>` merged by the orchestrator; `{}` when there is
 * nothing to enqueue. Mutates the ascendant's `reachTierSnapshot` in place (property
 * bag on the node) as the crossing bookkeeping.
 */
export function phaseAscendantProgression(state: GameState): Partial<GameState> {
  const graph = state.graph;
  const ascId = state.ascendantId;
  const node = graph.getNode(ascId);
  if (!node) return {}; // fail-soft: no ascendant
  const props = node.properties as unknown as AscendantProperties;
  const reaches = rankedAffinityReaches(props);
  if (reaches.length === 0) return {}; // fail-soft: no permanent reaches

  const beats = state.ascendantBeats;
  const turn = state.tick;

  // A Deepening beat may be enqueued only once the onboarding spine is exhausted and
  // no beat is already pending — so it never interleaves the scripted opening and
  // honours the max-one-pending invariant.
  const canEnqueue = !!beats && beats.spineCursor === -1 && !beats.pending;

  const snapshot: Partial<Record<ReachDomain, number>> = { ...(props.reachTierSnapshot ?? {}) };
  let snapshotChanged = false;
  let pending: PendingBeat | null = null;
  let enqueuedThisTick = 0;

  for (const reach of reaches) {
    const cap = computeCapability(graph, ascId, reach);
    const tier = computeTier(cap);
    const prev = snapshot[reach];

    if (prev === undefined) {
      // First run for this reach: seed from the current tier, no spurious beat.
      snapshot[reach] = tier;
      snapshotChanged = true;
      continue;
    }

    if (tier > prev && canEnqueue && enqueuedThisTick < DEEPENING_BEAT_MAX_PER_TICK) {
      // Advance the snapshot one step and enqueue the matching Deepening beat.
      const toTier = prev + 1;
      snapshot[reach] = toTier;
      snapshotChanged = true;
      enqueuedThisTick += 1;
      pending = {
        beatId: deepeningBeatIdForReach(reach),
        kind: 'deepening',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      emitTrace({
        category: 'ascendant.progression.tier_up',
        tick: turn,
        turn,
        reach,
        fromTier: prev,
        toTier,
        summary: `Domain Capability in ${reach} rose ${prev} → ${toTier}`,
      } as unknown as EmitInput);
      emitTrace({
        category: 'ascendant.progression.deepening_enqueued',
        tick: turn,
        turn,
        reach,
        beatId: pending.beatId,
        summary: `Deepening beat enqueued: ${pending.beatId}`,
      } as unknown as EmitInput);
    }
    // If a crossing is detected but we cannot enqueue this tick (pending occupied,
    // spine active, or the per-tick cap is hit) the snapshot is left unchanged, so the
    // same crossing is re-detected next tick — no beat is lost and none double-fires.
  }

  if (snapshotChanged) {
    node.properties.reachTierSnapshot = snapshot;
  }
  if (pending && beats) {
    return { ascendantBeats: { ...beats, pending, lastBeatTurn: turn } };
  }
  return {};
}

/** One reach's live progression readout — for the debug bridge + (Slice 3+) UI. */
export interface AscendantReachProgress {
  reach: ReachDomain;
  isPrimary: boolean;
  rawPractice: number;
  capability: number;
  tier: number;
  snapshotTier: number | null;
  pendingDeepening: boolean;
}

/**
 * Pure read of the ascendant's progression state (THR-613 §3.6 / §5.E). Independent
 * of tracing; safe to call from `__DEBUG.getAscendantProgression()`.
 */
export function getAscendantProgress(state: GameState): {
  reaches: AscendantReachProgress[];
  pendingBeatId: string | null;
} | null {
  const graph = state.graph;
  const node = graph.getNode(state.ascendantId);
  if (!node) return null;
  const props = node.properties as unknown as AscendantProperties;
  const ranked = rankedAffinityReaches(props);
  const snapshot = props.reachTierSnapshot ?? {};
  const practice = props.reachPractice ?? {};
  const pendingBeatId = state.ascendantBeats?.pending?.beatId ?? null;
  const reaches: AscendantReachProgress[] = ranked.map((reach, i) => {
    const capability = computeCapability(graph, state.ascendantId, reach);
    return {
      reach,
      isPrimary: i === 0,
      rawPractice: practice[reach] ?? 0,
      capability,
      tier: computeTier(capability),
      snapshotTier: snapshot[reach] ?? null,
      pendingDeepening:
        pendingBeatId === deepeningBeatIdForReach(reach),
    };
  });
  return { reaches, pendingBeatId };
}
