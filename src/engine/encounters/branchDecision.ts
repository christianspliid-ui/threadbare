/**
 * Agent-decided branches — the mortal chooses, the god leans (THR-894).
 *
 * ## The gap this closes
 *
 * `ActionStepBranch` picks a variant by a recorded `choiceId`, and the only
 * thing that ever recorded one was the retired player-pick (`authoredChoices`).
 * A branch authored today can therefore only ever take `fallback` — the fork is
 * in the schema and unreachable in the world.
 *
 * The shipped pattern for a *personality-driven* fork lived in exactly one
 * place: Meet The First, where a mortal's value axes plus the net pole lean of
 * the committed cards pick the direction a success writes, and fate rolls how
 * cleanly. This module generalizes that selector to any encounter branch.
 *
 * ## Who decides
 *
 * The **mortal**, never the player. The player leans: cards committed on the
 * deciding step carry a `poleLean` that adds to (or argues against) where the
 * mortal already stands. A god with no cards in play still gets a decision — it
 * is simply the one the mortal would have made alone.
 *
 * ## How it reaches the branch
 *
 * Through the **existing** choice-history path. The decision is written as an
 * ordinary `EncounterChoiceMemory` on the deciding step, so `resolveStepDefinition`
 * reads it exactly as it reads a recorded player choice and there is no second
 * branch-resolution path to keep in sync. `variants` key `'positive'` /
 * `'negative'` for the same reason: the pole *is* the choice id.
 *
 * ## Two modes (THR-898)
 *
 * A fork is either **two poles** or **N routes**, and the difference is what the
 * fork is *asking*:
 *
 * - **Pole mode** (THR-894) — one axis, two opposed answers. "Which way do you
 *   lean?" Decided by a signed lean collapsed to a side.
 * - **Route mode** (THR-898) — several courses toward one objective. "Which of
 *   these is *your* way in?" Bribe the wainwright, intimidate him, or win him
 *   over: three routes, one door. Decided primarily on **capability**, because
 *   what makes a course someone's is being able to walk it — with the mortal's
 *   axis standing and the god's committed cards as the finer adjustments.
 *
 * Both modes land in the same place: a key written to choice history, matching a
 * `variants` key. Only the scoring differs.
 *
 * ## Determinism (NFP #3)
 *
 * The profile read, the capability read, and the card sums are pure. The seeded
 * draw is taken **only** where its value is used — inside the neutral band in
 * pole mode, and only among tied leaders in route mode — mirroring the meeting's
 * `resolveWrittenPole`. Drawing it unconditionally would advance the stream on
 * decided forks too, desynchronising two runs that differ only in how convinced
 * a mortal was.
 */

import type { GameState } from '../../types/gameState';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';
import type {
  ActionStepBranch,
  ActionStep,
  BranchPoleKey,
  BranchRoute,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { isActionStepBranch, isRouteDecision } from '../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../types/encounter';
import { getAxisByValuePair } from '../../types/axisRegistry';
import {
  BRANCH_DECISION_COIN_THRESHOLD,
  BRANCH_DECISION_DRIFT_MAGNITUDE,
  BRANCH_DECISION_NEUTRAL_EPSILON,
  ROUTE_DECISION_AXIS_WEIGHT,
  ROUTE_DECISION_CAPABILITY_WEIGHT,
  ROUTE_DECISION_CARD_WEIGHT,
  ROUTE_DECISION_TIE_EPSILON,
} from '../../data/nudge-constants';
import { applyDriftMagnitude, driftDeltaFor, liveAxisPosition } from './driftAccumulator';
import { sumHandLean, sumRouteLean } from './poleLean';
import { computeCapability } from '../domainCapability';
import { emitTrace } from '../traceBuffer';

/** Prefix marking a choice-history entry as engine-decided rather than player-picked. */
export const BRANCH_DECISION_CHOICE_PREFIX = 'decided:';

/** Human-readable intervention type recorded on an engine-decided choice. */
export const BRANCH_DECISION_INTERVENTION_TYPE = 'agent_decided';

/** The decision itself, before anything is written anywhere. */
export interface BranchDecisionResult {
  readonly pole: BranchPoleKey;
  /** Mortal's live axis position before the god's hand. */
  readonly profileLean: number;
  /** Net signed lean of the committed cards on the deciding step. */
  readonly cardLean: number;
  /** `profileLean + cardLean`. */
  readonly netLean: number;
  /** Whether conviction cleared the neutral band, or the coin settled it. */
  readonly decidedBy: 'conviction' | 'coin';
}

/**
 * The drift-store key for a value axis.
 *
 * The eight reach-bound pairs have a canonical `${reach}_axis` id and share the
 * drift store with every other axis reader. The meta pair `courage_prudence` has
 * no reach and therefore no canonical axis, so it keys on its own pair name:
 * drift entries are keyed by string, canonical readers look up by axis id and
 * simply do not find it, and the decision still gets a place to accumulate.
 * Fail-soft over refusing to decide (NFP #4) — `courage_prudence` is a designed
 * axis for authored forks, not an edge case.
 */
export function driftAxisIdForValuePair(pair: ValuePair): string {
  return getAxisByValuePair(pair)?.axisId ?? pair;
}

/**
 * Where the mortal stands on an axis right now: their standing baseline plus the
 * drift their past choices have accumulated.
 *
 * Reading the *live* position rather than the raw baseline is what closes the
 * loop with {@link applyBranchDecisionDrift} — a mortal who took the cunning
 * fork three times is measurably more likely to take it a fourth. Fail-soft: a
 * missing profile reads as neutral, which lands the fork on the coin rather than
 * on a silent default pole.
 */
export function readLiveAxisLean(
  state: GameState,
  agentId: string,
  axis: ValuePair,
): number {
  const node = state.graph.getNode(agentId);
  const profile = node?.properties?.axiologicalProfile as AxiologicalProfile | undefined;
  const baseline = typeof profile?.[axis] === 'number' ? profile[axis] : 0;
  const drift = driftDeltaFor(state.archetypeDrift ?? [], agentId, driftAxisIdForValuePair(axis));
  return liveAxisPosition(baseline, drift);
}

/**
 * Decide a fork from a mortal's standing and the god's committed hand. Pure.
 *
 * `rng` is consumed at most once, and only when the net lean falls inside the
 * neutral band.
 */
export function decideBranchPole(
  profileLean: number,
  cardLean: number,
  rng: () => number,
): BranchDecisionResult {
  const safeProfile = Number.isFinite(profileLean) ? profileLean : 0;
  const safeCards = Number.isFinite(cardLean) ? cardLean : 0;
  const netLean = safeProfile + safeCards;

  if (netLean > BRANCH_DECISION_NEUTRAL_EPSILON) {
    return { pole: 'positive', profileLean: safeProfile, cardLean: safeCards, netLean, decidedBy: 'conviction' };
  }
  if (netLean < -BRANCH_DECISION_NEUTRAL_EPSILON) {
    return { pole: 'negative', profileLean: safeProfile, cardLean: safeCards, netLean, decidedBy: 'conviction' };
  }

  const pole: BranchPoleKey = rng() < BRANCH_DECISION_COIN_THRESHOLD ? 'positive' : 'negative';
  return { pole, profileLean: safeProfile, cardLean: safeCards, netLean, decidedBy: 'coin' };
}

// ─── N-route decisions (THR-898) ─────────────────────────────────────

/** What one route scored, and why — the whole audit trail for a route fork. */
export interface RouteScore {
  readonly key: string;
  /** Mortal's capability in the route's reach, 0–1. */
  readonly capability: number;
  /** Their standing on the route's axis, signed toward the route's pole; 0 if it declares none. */
  readonly axisLean: number;
  /** Committed cards backing this route, by name and by its axis. */
  readonly cardLean: number;
  /** The weighted sum the comparison actually uses. */
  readonly score: number;
}

/** The chosen route, with every rival's score kept for the trace. */
export interface RouteDecisionResult {
  readonly routeKey: string;
  readonly scores: readonly RouteScore[];
  /** Whether one route won outright, or a seeded draw settled a tie. */
  readonly decidedBy: 'fit' | 'tiebreak';
}

/**
 * Sign a value toward a route's declared pole.
 *
 * A route sitting at the `negative` pole is *better* served by a mortal who
 * leans negative, so the axis term flips with the route. Without this the two
 * ends of one axis would both score as "positive is good" and the axis term
 * would silently be noise on half the routes.
 */
function towardRoute(value: number, route: BranchRoute): number {
  if (route.axis === undefined) return 0;
  const signed = route.toward === 'negative' ? -value : value;
  return Number.isFinite(signed) ? signed : 0;
}

/**
 * Score every route for one mortal. Pure, and consumes no randomness.
 *
 * The three terms are the three things that make a course *theirs*: what they
 * can do (capability in the route's reach — the same `computeCapability` read
 * resolution itself uses, so a route the mortal would actually succeed at is the
 * route they reach for), who they are (axis standing, when the route declares an
 * axis), and what the god argued (cards naming the route, plus cards arguing on
 * its axis). Weights are named constants — changing the feel is changing a
 * number (NFP #1).
 */
export function scoreRoutes(
  state: GameState,
  agentId: string,
  routes: readonly BranchRoute[],
  nudges: ActionStep['nudges'],
  playedNudgeIds: readonly string[] | undefined,
): RouteScore[] {
  return routes.map((route) => {
    const capability = computeCapability(state.graph, agentId, route.reach);
    const safeCapability = Number.isFinite(capability) ? capability : 0;

    const axisLean = route.axis === undefined
      ? 0
      : towardRoute(readLiveAxisLean(state, agentId, route.axis), route);

    // Both ways a card can back this course: naming it, or arguing on its axis.
    const namedLean = sumRouteLean(nudges, playedNudgeIds, route.key);
    const axisCardLean = route.axis === undefined
      ? 0
      : towardRoute(sumHandLean(nudges, playedNudgeIds, route.axis), route);
    const cardLean = namedLean + axisCardLean;

    const score = ROUTE_DECISION_CAPABILITY_WEIGHT * safeCapability
      + ROUTE_DECISION_AXIS_WEIGHT * axisLean
      + ROUTE_DECISION_CARD_WEIGHT * cardLean;

    return {
      key: route.key,
      capability: safeCapability,
      axisLean,
      cardLean,
      score: Number.isFinite(score) ? score : 0,
    };
  });
}

/**
 * Pick the winning route. Pure.
 *
 * `rng` is consumed at most once, and only when the leaders are tied — the same
 * discipline as the two-pole coin, and for the same reason: drawing
 * unconditionally would advance the stream on decided forks too, desynchronising
 * two runs that differ only in how clear-cut a mortal's best course was.
 */
export function decideBranchRoute(
  scores: readonly RouteScore[],
  rng: () => number,
): RouteDecisionResult {
  // Fail-soft (NFP #4): validation rejects an empty route list at build time, so
  // this is unreachable through authored content — but the tick loop must never
  // throw, and an empty decision is recoverable where an exception is not.
  if (scores.length === 0) {
    return { routeKey: '', scores, decidedBy: 'fit' };
  }

  const best = scores.reduce((a, b) => (b.score > a.score ? b : a));
  const tied = scores.filter((s) => Math.abs(s.score - best.score) <= ROUTE_DECISION_TIE_EPSILON);

  if (tied.length <= 1) {
    return { routeKey: best.key, scores, decidedBy: 'fit' };
  }

  // Index off a single draw, clamped so an rng returning exactly 1 stays in range.
  const index = Math.min(tied.length - 1, Math.floor(rng() * tied.length));
  return { routeKey: tied[index].key, scores, decidedBy: 'tiebreak' };
}

/**
 * Every `decidedBy` branch in a template that forks on `stepIndex`.
 *
 * A template may fork more than once off the same deciding step (the branch
 * step and a later branch-aware step both keying off step 0 is already legal),
 * so this returns all of them and the caller records one decision covering the
 * lot — one step, one choice, however many branches read it.
 */
function decidedBranchesForStep(
  template: UnifiedActionTemplate,
  stepIndex: number,
): ActionStepBranch[] {
  const found: ActionStepBranch[] = [];
  for (const step of template.steps) {
    if (isActionStepBranch(step) && step.decidedBy && step.branchOnStep === stepIndex) {
      found.push(step);
    }
  }
  return found;
}

/** Result of recording a decision: the updated action plus the drift to store. */
export interface BranchDecisionApplication {
  readonly action: UnifiedAction;
  readonly archetypeDrift: GameState['archetypeDrift'];
  /** Present when the fork ran in two-pole mode (THR-894). */
  readonly decision?: BranchDecisionResult;
  /** Present when the fork ran in N-route mode (THR-898). */
  readonly routeDecision?: RouteDecisionResult;
}

/**
 * Drift a mortal toward the pole they just took, emitting any threshold
 * crossings. Shared by both decision modes — a route that declares an axis
 * drifts exactly as a pole decision does, because it *is* the same claim about
 * who this person is becoming.
 *
 * Exported since THR-1179 so The Undertow drifts through this same function
 * rather than a card-side copy. One writer means a card-driven shift and a
 * choice-driven one accumulate into the same axis position and decay back toward
 * the same baseline; two writers would eventually disagree about the person, and
 * the disagreement would be invisible (each path's own tests would pass).
 *
 * @param magnitude Unsigned step size; `pole` supplies the sign. Defaults to the
 *   branch-decision magnitude, so both existing call sites are unchanged.
 */
export function driftTowardPole(
  drift: GameState['archetypeDrift'],
  agentId: string,
  axis: ValuePair,
  pole: BranchPoleKey,
  tick: number,
  magnitude: number = BRANCH_DECISION_DRIFT_MAGNITUDE,
): { drift: GameState['archetypeDrift']; driftAxisId: string } {
  const driftAxisId = driftAxisIdForValuePair(axis);
  const signedMagnitude = pole === 'positive' ? magnitude : -magnitude;
  const result = applyDriftMagnitude(drift, agentId, driftAxisId, signedMagnitude, tick);

  // Same emission shape as `phaseChoiceResolution`. Both emit uncast as of
  // THR-1065 — `DriftThresholdCrossedTrace` is a `TraceEntry` member and
  // `emitTrace` takes a distributive input, so the payload type-checks as itself.
  for (const driftTrace of result.traces) {
    emitTrace({
      ...driftTrace,
      summary: `Drift threshold ${driftTrace.thresholdCrossed}: ${driftTrace.axisId} `
        + `${driftTrace.fromPosition.toFixed(2)} → ${driftTrace.toPosition.toFixed(2)} (${driftTrace.pole})`,
    });
  }

  return { drift: result.drift, driftAxisId };
}

/**
 * Decide any agent-decided fork that keys off the step that just resolved, write
 * the pole into choice history, and drift the mortal toward the pole they took.
 *
 * Called immediately before `advanceStep`, which is the last moment the choice
 * can land and still be visible to `resolveStepDefinition` when the next step's
 * definition is resolved.
 *
 * No-op — and returns the inputs untouched — for every template with no
 * `decidedBy` branch, which is every template shipped today (NFP #6).
 */
export function applyAgentDecidedBranches(
  state: GameState,
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  resolvedStep: ActionStep,
  tick: number,
  rng: () => number,
): BranchDecisionApplication {
  const drift = state.archetypeDrift ?? [];
  const branches = decidedBranchesForStep(template, action.currentStep);
  if (branches.length === 0) {
    return { action, archetypeDrift: drift };
  }

  // Every branch off this step asks about the same moment; the first one's
  // configuration is the question. A template whose branches disagree is a
  // content error the validator reports — here it resolves fail-soft on the
  // first, rather than recording two contradictory choices for one step.
  const decidedBy = branches[0].decidedBy!;

  return isRouteDecision(decidedBy)
    ? applyRouteDecision(state, action, decidedBy.routes, resolvedStep, tick, rng, drift)
    : applyPoleDecision(state, action, decidedBy.axis, resolvedStep, tick, rng, drift);
}

/** Two-pole mode (THR-894): one axis, a signed lean, a side. */
function applyPoleDecision(
  state: GameState,
  action: UnifiedAction,
  axis: ValuePair,
  resolvedStep: ActionStep,
  tick: number,
  rng: () => number,
  drift: GameState['archetypeDrift'],
): BranchDecisionApplication {
  const profileLean = readLiveAxisLean(state, action.actorId, axis);
  const cardLean = sumHandLean(resolvedStep.nudges, action.activeNudges, axis);
  const decision = decideBranchPole(profileLean, cardLean, rng);

  const drifted = driftTowardPole(drift, action.actorId, axis, decision.pole, tick);

  emitTrace({
    category: 'branch_decided',
    tick,
    agentId: action.actorId,
    templateId: action.templateId,
    stepIndex: action.currentStep,
    mode: 'pole',
    axis,
    profileLean: decision.profileLean,
    cardLean: decision.cardLean,
    netLean: decision.netLean,
    resolvedPole: decision.pole,
    decidedBy: decision.decidedBy,
    driftAxisId: drifted.driftAxisId,
    summary: `branch_decided: ${action.actorId} took '${decision.pole}' on ${axis} `
      + `(profile ${decision.profileLean.toFixed(2)} + cards ${decision.cardLean.toFixed(2)} `
      + `= ${decision.netLean.toFixed(2)}, by ${decision.decidedBy})`,
  } as unknown as Parameters<typeof emitTrace>[0]);

  const choiceText = decision.decidedBy === 'coin'
    ? 'The moment found them undecided.'
    : 'They chose as they are.';

  return {
    action: recordDecidedChoice(action, stepIdFor(action.currentStep), decision.pole, choiceText, tick),
    archetypeDrift: drifted.drift,
    decision,
  };
}

/** N-route mode (THR-898): several courses, scored on fit, one taken. */
function applyRouteDecision(
  state: GameState,
  action: UnifiedAction,
  routes: readonly BranchRoute[],
  resolvedStep: ActionStep,
  tick: number,
  rng: () => number,
  drift: GameState['archetypeDrift'],
): BranchDecisionApplication {
  const scores = scoreRoutes(
    state, action.actorId, routes, resolvedStep.nudges, action.activeNudges,
  );
  const decision = decideBranchRoute(scores, rng);

  // A route that declares an axis drifts the mortal toward its pole, exactly as
  // a two-pole decision does. A pure-competence route declares none and drifts
  // nothing — there is no claim about character to record.
  const taken = routes.find((r) => r.key === decision.routeKey);
  const drifted = taken?.axis !== undefined
    ? driftTowardPole(drift, action.actorId, taken.axis, taken.toward ?? 'positive', tick)
    : { drift, driftAxisId: undefined as string | undefined };

  emitTrace({
    category: 'branch_decided',
    tick,
    agentId: action.actorId,
    templateId: action.templateId,
    stepIndex: action.currentStep,
    mode: 'route',
    resolvedRoute: decision.routeKey,
    decidedBy: decision.decidedBy,
    routeScores: decision.scores,
    driftAxisId: drifted.driftAxisId,
    summary: `branch_decided: ${action.actorId} took route '${decision.routeKey}' `
      + `by ${decision.decidedBy} (${decision.scores
        .map((s) => `${s.key} ${s.score.toFixed(2)}`)
        .join(', ')})`,
  } as unknown as Parameters<typeof emitTrace>[0]);

  const choiceText = decision.decidedBy === 'tiebreak'
    ? 'Either way would have suited them.'
    : 'They went the way that was theirs.';

  return {
    action: recordDecidedChoice(action, stepIdFor(action.currentStep), decision.routeKey, choiceText, tick),
    archetypeDrift: drifted.drift,
    routeDecision: decision,
  };
}

/**
 * Stable `stepId` for a choice-history entry.
 *
 * `ActionStep` carries no `id` field — the several existing `step.id` reads in
 * the resolution path are long-standing type errors that evaluate to
 * `undefined`. `EncounterChoiceMemory.stepId` is required and load-bearing for
 * lookups, so this derives one from the index instead of propagating that bug.
 */
function stepIdFor(stepIndex: number): string {
  return `step_${stepIndex}`;
}

/**
 * Write the decided key as an ordinary choice-history entry.
 *
 * `choiceId` is the bare pole key or route key, because that is what `variants`
 * are keyed by — the whole point of routing through the existing path. The
 * decision is still distinguishable from a player pick by `interventionType`,
 * and reads as one in any surface that renders choice history.
 */
function recordDecidedChoice(
  action: UnifiedAction,
  stepId: string,
  choiceId: string,
  choiceText: string,
  tick: number,
): UnifiedAction {
  const entry: EncounterChoiceMemory = {
    stepIndex: action.currentStep,
    stepId,
    choiceId,
    choiceText,
    interventionType: BRANCH_DECISION_INTERVENTION_TYPE,
    essenceSpent: 0,
    probabilityBoost: 0,
    tick,
  };

  const history = [
    ...(action.choiceHistory ?? []).filter((e) => e.stepIndex !== entry.stepIndex),
    entry,
  ].sort((left, right) => left.stepIndex - right.stepIndex);

  return { ...action, choiceHistory: history };
}
