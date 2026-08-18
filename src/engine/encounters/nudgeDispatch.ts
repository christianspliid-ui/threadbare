/**
 * Nudge dispatch — the cost channels a committed card charges and the world
 * changes it grants. THR-885 (card-system engine).
 *
 * **This module routes; it does not implement.** Every channel below hands off to
 * the system that already owns it — `applyDetectionDelta` for detection pressure,
 * `accelerateDoomClock` / `decelerateDoomClock` for doom, and the existing
 * aftermath applier for every grant. Nothing here writes a graph edge or mutates a
 * clock itself. That is the whole point: a card that plants an omen must reach the
 * omen system through the same door `emit_omen` already uses, or the two paths
 * drift and the second one rots (the failure the systems inventory exists to stop).
 *
 * Grants ride the existing `EncounterAftermathReactionEffect` vocabulary, so the
 * six dispatch hooks the plan names cost almost no new machinery:
 *
 * | Card                 | Effect kind         | Owning system         |
 * |----------------------|---------------------|-----------------------|
 * | The Omen             | `emit_omen`         | omens                 |
 * | The Balm             | `remove_condition`  | conditions            |
 * | The Cache            | `spawn_artifact`    | artifacts             |
 * | The Long Game        | `hidden_mark`       | traits/marks          |
 * | The Favor / Bargain  | `favor_creation`    | secrets & favors      |
 * | The Kindled Ambition | `assign_ambition`   | ambitions (new)       |
 * | The Compulsion       | `plant_compulsion`  | agent decision bias   |
 *
 * Only the last two needed a new effect kind. Ambitions genuinely had no
 * dispatcher outside the tick phase (THR-812 / THR-726); The Compulsion had no
 * *reachable* one (THR-886) — its apparent host, `buildCompulsionEvent`, takes the
 * decision pipeline's `ScoredCandidate[]`, a list that exists only mid-
 * `phaseAgentDecision` and that aftermath cannot obtain. Synthesizing fakes to fit
 * that signature would have been exactly the parallel path this module exists to
 * avoid, so the card waited on a design call instead of guessing.
 *
 * Christian resolved it 2026-08-09: The Compulsion plants a *weight*, not a menu.
 * A weight is available at the aftermath seam where a candidate list is not, so the
 * obstacle stopped being one — `plant_compulsion` writes a per-agent bias that
 * `phaseAgentDecision` folds into the same `combinedBias` the omen path feeds, and
 * `premonitionCompulsion` is not touched at all.
 *
 * Plan: `Docs/plans/2026-07-30-encounter-authoring-frameworks.md` § Decision 3.
 */

import type { GameState } from '../../types/gameState';
import type { SimulationRuntime } from '../simulationRuntime';
import type {
  ActionStep,
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  NudgeCostChannels,
  StepNudge,
  UnifiedAction,
} from '../../types/unifiedAction';
import type { AftermathMutationSummary } from '../encounterAftermath';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { applyRawDetectionDelta } from './detectionPressure';
import { driftTowardPole } from './branchDecision';
import { UNDERTOW_DRIFT_MAGNITUDE } from '../../data/nudge-constants';
import { accelerateDoomClock, decelerateDoomClock } from '../doomClock';
import { emitTrace } from '../traceBuffer';
import type { NudgeCostChargedTrace, NudgeDispatchFailedTrace } from '../../types/trace';

/** Reaction id the synthesized grant-carrier reaction reports as. */
export const NUDGE_GRANT_REACTION_ID = 'nudge_grants';

/**
 * `agentId` is optional on a trace and the project compiles with
 * `exactOptionalPropertyTypes`, so an absent actor must omit the key rather than
 * set it to `undefined`.
 */
function agentIdField(actorId: string | undefined): { agentId?: string } {
  return actorId ? { agentId: actorId } : {};
}

/**
 * Emit a nudge-dispatch trace.
 *
 * The cast is load-bearing, not laziness. `emitTrace` takes
 * `Omit<TraceEntry, 'id' | 'timestamp'>`, and `Omit` over a **discriminated
 * union** distributes into a single object type carrying only the keys every
 * member shares — so every category-specific field (`encounterId`, `channel`, …)
 * becomes an excess property and is rejected, no matter how correctly the trace
 * interface is declared. That is why this same error class runs through
 * `encounterAftermath.ts` in the type baseline.
 *
 * Typing the parameter as the real trace union here means the payload is still
 * checked against `NudgeCostChargedTrace` / `NudgeDispatchFailedTrace` — the cast
 * only crosses the collapsed boundary, it does not weaken the call sites.
 */
function emitNudgeTrace(
  entry:
    | Omit<NudgeCostChargedTrace, 'id' | 'timestamp'>
    | Omit<NudgeDispatchFailedTrace, 'id' | 'timestamp'>,
): void {
  emitTrace(entry as Parameters<typeof emitTrace>[0]);
}

/** Region a detection cost falls on when the actor's own region cannot be resolved. */
export const NUDGE_DETECTION_FALLBACK_REGION = 'unknown';

// ─── Pure collection ─────────────────────────────────────────────────

/**
 * Grants contributed by the committed hand, in authored card order.
 *
 * Pure — reads the step and the committed ids, touches nothing. Fail-soft: a
 * committed id with no matching card contributes nothing (the same tolerance
 * `collectNudgeModifiers` has for a stale id).
 */
export function collectNudgeGrants(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
): EncounterAftermathReactionEffect[] {
  if (!activeNudgeIds || activeNudgeIds.length === 0 || !step.nudges) return [];
  const byId = new Map(step.nudges.map((n) => [n.id, n]));
  const grants: EncounterAftermathReactionEffect[] = [];
  for (const id of activeNudgeIds) {
    const nudge = byId.get(id);
    if (!nudge?.grants) continue;
    grants.push(...nudge.grants);
  }
  return grants;
}

/**
 * Summed cost channels across the committed hand.
 *
 * Summing is right, not merely convenient: two cards that each raise detection
 * both raise it, and The Veil's negative delta is *supposed* to net off against
 * The Heavy Hand's positive one when a player commits both.
 */
export function collectNudgeCostChannels(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
): NudgeCostChannels {
  if (!activeNudgeIds || activeNudgeIds.length === 0 || !step.nudges) return {};
  const byId = new Map(step.nudges.map((n) => [n.id, n]));
  let detectionDelta = 0;
  let doomDelta = 0;
  for (const id of activeNudgeIds) {
    const costs = byId.get(id)?.costs;
    if (!costs) continue;
    detectionDelta += costs.detectionDelta ?? 0;
    doomDelta += costs.doomDelta ?? 0;
  }
  const result: NudgeCostChannels = {};
  return {
    ...result,
    ...(detectionDelta !== 0 ? { detectionDelta } : {}),
    ...(doomDelta !== 0 ? { doomDelta } : {}),
  };
}

/**
 * Value-axis drifts declared by the committed hand, in authored card order.
 *
 * Pure, and tolerant of a stale id for the same reason its two siblings are.
 * Two Undertows on the same axis drift twice — that is correct, and it is why
 * this returns a list rather than a summed axis map: each play is its own claim
 * about the mortal, and each one's threshold crossing deserves its own trace.
 */
export function collectNudgeValueDrifts(
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
): readonly NonNullable<StepNudge['valueDrift']>[] {
  if (!activeNudgeIds || activeNudgeIds.length === 0 || !step.nudges) return [];
  const byId = new Map(step.nudges.map((n) => [n.id, n]));
  const drifts: NonNullable<StepNudge['valueDrift']>[] = [];
  for (const id of activeNudgeIds) {
    const drift = byId.get(id)?.valueDrift;
    if (drift) drifts.push(drift);
  }
  return drifts;
}

// ─── Application ─────────────────────────────────────────────────────

export interface NudgeDispatchResult {
  readonly state: GameState;
  readonly mutationSummary: AftermathMutationSummary;
  /** Grant effect kinds actually dispatched — empty when the hand granted nothing. */
  readonly dispatchedGrantKinds: readonly string[];
  /** Cost channels actually charged. */
  readonly chargedCosts: NudgeCostChannels;
  /**
   * Drift axis ids the hand moved (The Undertow) — empty for every hand that
   * committed no value-shifting card.
   */
  readonly driftedAxisIds: readonly string[];
}

const EMPTY_SUMMARY: AftermathMutationSummary = {
  touchedWorld: false,
  touchedStructure: false,
  woundApplied: false,
};

/**
 * Charge a committed hand's non-essence costs and apply its grants.
 *
 * Call **after** the step resolves, so a card's fiction and its world change
 * cannot disagree about whether the thing happened. Essence is charged separately
 * at commit (`totalNudgeCost`) — that price is paid for playing the card, whereas
 * these channels are paid for what the card *did*.
 *
 * Fail-soft throughout (NFP #4): a hand with no costs and no grants returns the
 * input state untouched and allocates nothing; a throwing host API is caught, is
 * traced, and leaves every other channel to apply.
 */
export function dispatchNudgeCommitments(
  state: GameState,
  action: UnifiedAction | undefined,
  step: Pick<ActionStep, 'nudges'>,
  activeNudgeIds: readonly string[] | undefined,
  tick: number,
  runtime: SimulationRuntime,
): NudgeDispatchResult {
  const grants = collectNudgeGrants(step, activeNudgeIds);
  const costs = collectNudgeCostChannels(step, activeNudgeIds);

  const valueDrifts = collectNudgeValueDrifts(step, activeNudgeIds);

  // The overwhelmingly common case: a hand of pure forecast-shifting cards.
  if (
    grants.length === 0
    && valueDrifts.length === 0
    && costs.detectionDelta === undefined
    && costs.doomDelta === undefined
  ) {
    return {
      state,
      mutationSummary: EMPTY_SUMMARY,
      dispatchedGrantKinds: [],
      chargedCosts: {},
      driftedAxisIds: [],
    };
  }

  let nextState = state;
  let mutationSummary = EMPTY_SUMMARY;

  // ── Grants, through the existing aftermath applier ──
  if (grants.length > 0) {
    const reaction: EncounterAftermathReaction = {
      id: NUDGE_GRANT_REACTION_ID,
      label: 'the god’s hand',
      effects: grants,
    };
    try {
      const applied = applyEncounterAftermathReaction(nextState, action, reaction, tick, runtime);
      nextState = applied.state;
      mutationSummary = applied.mutationSummary;
    } catch (error) {
      emitNudgeTrace({
        tick,
        category: 'nudge_dispatch_failed',
        ...agentIdField(action?.actorId),
        encounterId: action?.templateId ?? 'unknown',
        channel: 'grants',
        failReason: error instanceof Error ? error.message : String(error),
        summary: `nudge grants failed to apply for ${action?.templateId ?? 'unknown'}`,
      });
    }
  }

  // ── Detection pressure, through the region detection API ──
  if (costs.detectionDelta !== undefined) {
    try {
      const regionId = resolveActorRegionId(nextState, action) ?? NUDGE_DETECTION_FALLBACK_REGION;
      // Signed, because The Veil *lowers* pressure and the choice-cost band API
      // can only raise it. Both entry points share the module's clamp.
      const result = applyRawDetectionDelta(
        nextState.regionalDetectionPressure ?? [],
        regionId,
        costs.detectionDelta,
        tick,
      );
      nextState = { ...nextState, regionalDetectionPressure: result.regionalDetectionPressure };
      emitNudgeTrace({
        tick,
        category: 'nudge_cost_charged',
        ...agentIdField(action?.actorId),
        encounterId: action?.templateId ?? 'unknown',
        channel: 'detection',
        regionId,
        appliedDelta: result.appliedDelta,
        fromPressure: result.fromPressure,
        toPressure: result.toPressure,
        summary: `nudge detection cost: ${regionId} ${result.fromPressure.toFixed(2)} → ${result.toPressure.toFixed(2)}`,
      });
    } catch (error) {
      emitNudgeTrace({
        tick,
        category: 'nudge_dispatch_failed',
        ...agentIdField(action?.actorId),
        encounterId: action?.templateId ?? 'unknown',
        channel: 'detection',
        failReason: error instanceof Error ? error.message : String(error),
        summary: 'nudge detection cost failed to apply',
      });
    }
  }

  // ── Doom clock, through the doom API ──
  if (costs.doomDelta !== undefined && nextState.doomClock) {
    try {
      const delta = costs.doomDelta;
      const nextDoom = delta > 0
        ? accelerateDoomClock(nextState.doomClock, delta)
        : decelerateDoomClock(nextState.doomClock, -delta);
      nextState = { ...nextState, doomClock: nextDoom };
      emitNudgeTrace({
        tick,
        category: 'nudge_cost_charged',
        ...agentIdField(action?.actorId),
        encounterId: action?.templateId ?? 'unknown',
        channel: 'doom',
        appliedDelta: delta,
        tickModifier: nextDoom.tickModifier,
        summary: `nudge doom cost: tickModifier → ${nextDoom.tickModifier.toFixed(2)}`,
      });
    } catch (error) {
      emitNudgeTrace({
        tick,
        category: 'nudge_dispatch_failed',
        ...agentIdField(action?.actorId),
        encounterId: action?.templateId ?? 'unknown',
        channel: 'doom',
        failReason: error instanceof Error ? error.message : String(error),
        summary: 'nudge doom cost failed to apply',
      });
    }
  }

  // ── Value drift, through the shared drift accumulator ──
  //
  // The Undertow is the one card that changes *the mortal* rather than the odds
  // or the world, so it routes to `driftTowardPole` — the same function a branch
  // decision drifts through. Riding it (rather than calling `applyDriftMagnitude`
  // here) also inherits the threshold-crossing traces for free, which is how a
  // card-driven crossing shows up in the drift readout indistinguishably from a
  // choice-driven one. That indistinguishability is the design: the mortal is
  // becoming someone, and it does not matter to them who pushed.
  const driftedAxisIds: string[] = [];
  for (const drift of valueDrifts) {
    if (!action?.actorId) break;
    try {
      const applied = driftTowardPole(
        nextState.archetypeDrift ?? [],
        action.actorId,
        drift.axis,
        drift.toward,
        tick,
        UNDERTOW_DRIFT_MAGNITUDE,
      );
      nextState = { ...nextState, archetypeDrift: applied.drift };
      driftedAxisIds.push(applied.driftAxisId);
    } catch (error) {
      emitNudgeTrace({
        tick,
        category: 'nudge_dispatch_failed',
        ...agentIdField(action?.actorId),
        encounterId: action?.templateId ?? 'unknown',
        channel: 'grants',
        failReason: error instanceof Error ? error.message : String(error),
        summary: `nudge value drift failed to apply on ${drift.axis}`,
      });
    }
  }

  return {
    state: nextState,
    mutationSummary,
    dispatchedGrantKinds: grants.map((g) => g.kind),
    chargedCosts: costs,
    driftedAxisIds,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * The region the acting mortal stands in, resolved through the three-tier
 * position model (sublocation → location → hex). Returns undefined when the
 * actor cannot be placed; the caller falls back rather than skipping the charge.
 */
function resolveActorRegionId(state: GameState, action: UnifiedAction | undefined): string | undefined {
  const actorId = action?.actorId;
  if (!actorId) return undefined;
  const locatedAt = state.graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  if (!locatedAt) return undefined;
  const node = state.graph.getNode(locatedAt);
  if (!node) return undefined;
  const regionId = node.properties?.regionId;
  return typeof regionId === 'string' && regionId.length > 0 ? regionId : undefined;
}
