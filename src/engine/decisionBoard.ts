/**
 * The one prioritization board — THR-1292 §4.
 *
 * ## What this replaces
 *
 * An agent's decision is today **three sequential winner-take contests**:
 * encounter-internal selection (`scoreAndSelect`), then strategic-vs-encounter,
 * then — until slice 4 deleted it — initiative-vs-encounter. The scorers being
 * compared are incommensurate by construction: an encounter score is unbounded
 * above (multiplicative gates 1.3–2.5 stacked on additive bonuses) while a
 * strategic score is clamped into `[0.08, 0.851]` by
 * `STRATEGIC_ENCOUNTER_SCORE_BRIDGE`. One clamp and one constant are the entire
 * commensurability story, and the comparison itself has **never been traced** —
 * nothing anywhere records what the losing family's best was.
 *
 * This module ranks every candidate an agent has, of every family, on one
 * currency, and says so on the record.
 *
 * ## The currency: expected value per tick (EVT)
 *
 * The encounter scorer already computes `euRanking / totalCost` — a five-band
 * expected utility over tick cost. Undertakings join *that* rather than inventing
 * a third scale:
 *
 * ```
 * boardScore = EVT × desireMultiplier × temperamentFamilyWeight
 * ```
 *
 * - **Encounters** contribute `valuePerTick` and `desireMultiplier` straight from
 *   `ScoredCandidate` — the same two numbers the live scorer multiplies — at
 *   temperament weight exactly `1.0`. The baseline is the encounter family by
 *   definition; what is tunable is every other family's weight *relative* to it.
 * - **Undertakings** derive EVT from the checkpoint machinery slice 3 shipped, so
 *   the board's forecast and the dice that resolve it read the same inputs.
 *
 * ### Why `P` appears twice in the undertaking EVT
 *
 * Per the plan:
 *
 * ```
 * expectedPayoff        = payoffValue × P(advance)
 * expectedDurationTicks = checkpointsRemaining × interval / P(advance)
 * EVT                   = expectedPayoff / expectedDurationTicks
 *                       = payoffValue × P² / (checkpointsRemaining × interval)
 * ```
 *
 * That is not a slip in the plan and it is not one here. `P` enters once because
 * an undertaking that halts forever never pays at all, and once more because
 * halts *stretch* the calendar — a coin-flip undertaking costs about twice the
 * ticks of a certain one. Both effects are real and they compound, so a marginal
 * undertaking is penalised quadratically against a safe one. Written as one
 * expression it would read like a bug, so it is kept as the plan's two named
 * terms and this paragraph exists to stop a future reader "fixing" it.
 *
 * ## Fail-soft, and deliberately loud (NFP #4, NFP #2)
 *
 * The legacy paths this sits beside degrade through **empty `catch` blocks** — a
 * strategic-generation throw silently produces encounter-only behaviour, which is
 * exactly what a healthy run looks like from outside. A shadow period spent
 * swallowing board throws would read as agreement. So a throw here is caught at
 * the call site and traced as `decision_board_error`: the board contributes
 * nothing to that decision, and the fact that it contributed nothing is on the
 * record.
 *
 * ## Scope
 *
 * Scoring only. This module reads the graph and returns a ranking; it never
 * mutates, never queues an event, never emits a trace (the caller owns emission,
 * matching `stepResolutionCore`'s returns-only contract). In `'shadow'` mode
 * nothing at all consumes the ranking except telemetry — which is the point.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { FundamentState } from '../types/worldSoul';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { DecisionFamily, StrategicActionTemplate } from '../types/strategicAction';
import type { ScoredCandidate } from './encounterScoring';
import type { ScoredStrategicCandidate } from './strategicActionScoring';
import { computeDesireScore, getAmbitionBoost, resolveAxiologicalProfile } from './encounterScoring';
import {
  breakdownToOutcome,
  classifyResolutionRoll,
  computeResolutionThreshold,
} from './resolutionService';
import { applyScaleDifficultyAdjust, MIN_PROBABILITY_BY_SCALE } from './resolutionScaleAdjust';
import { FLOOR_UPGRADE_OUTCOME, mapResolverOutcomeToStep } from './stepResolutionCore';
import { CHECKPOINT_EFFECT_BY_BAND, pickPrimaryReach } from './undertakingCheckpoints';
import { computeCapability } from './domainCapability';
import { findAmbitionTemplate, getStrategicTemplate } from './strategicActionCandidates';
import {
  MINIMUM_DESIRE,
  PERSONALITY_SCORE_EXPONENT,
  PERSONALITY_SELECTION_WEIGHT,
} from '../data/agent-behavior-constants';
import {
  BOARD_TRACE_TOP_N,
  STRATEGIC_DEFAULT_PROJECT_WORK_TICKS,
  STRATEGIC_VERB_IMPACT,
  STRATEGIC_VERB_IMPACT_DEFAULT,
  UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
  UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY,
  UNDERTAKING_PAYOFF_SCALE,
  UNDERTAKING_PROGRESS_PER_ADVANCE,
  UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT,
  UNDERTAKING_TEMPERAMENT_REACH_WEIGHT,
} from '../data/strategic-action-constants';

// ─── Contract ───────────────────────────────────────────────────

/** One ranked candidate, of any family, in board currency. */
export interface BoardEntry {
  readonly family: DecisionFamily;
  /** Template id for an undertaking, encounter template id for an encounter. */
  readonly id: string;
  /** `EVT × desire × temperament` — the one number families are compared on. */
  readonly score: number;
  /** Expected value per tick, before the two multipliers. */
  readonly evt: number;
  readonly desireMultiplier: number;
  readonly temperamentWeight: number;
  /**
   * `P(advance-equivalent)` for an undertaking; `undefined` for an encounter,
   * whose EVT already folds its five-band expected utility.
   */
  readonly advanceProbability?: number;
}

export interface BoardResult {
  /** Every scored entry, descending. */
  readonly entries: readonly BoardEntry[];
  /** The first `BOARD_TRACE_TOP_N` of `entries` — what the trace carries. */
  readonly top: readonly BoardEntry[];
  /** Highest-scoring entry, or `null` on an empty board. */
  readonly winner: BoardEntry | null;
}

export interface BoardInput {
  readonly graph: WorldGraph;
  readonly agentId: string;
  readonly tick: number;
  /** Ranked encounter candidates, as `scoreAndSelect` produced them. */
  readonly encounterCandidates: readonly ScoredCandidate[];
  /** Ranked strategic candidates, as `scoreStrategicCandidates` produced them. */
  readonly strategicCandidates: readonly ScoredStrategicCandidate[];
  readonly fundament?: FundamentState;
}

// ─── Payoff ─────────────────────────────────────────────────────

/**
 * An undertaking's payoff value: the authored field, else the shared verb-impact
 * table, scaled by `UNDERTAKING_PAYOFF_SCALE`.
 *
 * `payoffValue` is unauthored on every template in v1 — doc 2's kind rows are what
 * fill it — so this reads the verb table for all 43 today. That is the honest v1
 * state and not a stub: the verb table is the same one the legacy `worldImpact`
 * component already scores on, so the board is not being handed a made-up number.
 */
export function resolveUndertakingPayoff(template: StrategicActionTemplate | undefined): number {
  if (template?.payoffValue !== undefined) return template.payoffValue * UNDERTAKING_PAYOFF_SCALE;
  const byVerb = template ? STRATEGIC_VERB_IMPACT[template.verb] : undefined;
  return (byVerb ?? STRATEGIC_VERB_IMPACT_DEFAULT) * UNDERTAKING_PAYOFF_SCALE;
}

// ─── Desire ─────────────────────────────────────────────────────

/**
 * The encounter scorer's desire pipeline, applied to any motivation set.
 *
 * Extracted verbatim from `scoreAndSelect` steps 7–9 so undertakings and
 * encounters are weighted by personality through the *same* function rather than
 * through two implementations that agree today. The bond and behaviour-weight
 * terms stay at the encounter call site: both key off an encounter's target agent
 * and reach effects, and neither has an undertaking analogue to read.
 */
export function computeBoardDesireMultiplier(
  motivations: readonly ValuePair[],
  profile: AxiologicalProfile,
  ambitionBoost: number,
): number {
  const axiological = computeDesireScore(motivations as ValuePair[], profile);
  const personalityBias = axiological * PERSONALITY_SELECTION_WEIGHT;
  const base = Math.max(personalityBias + ambitionBoost, MINIMUM_DESIRE);
  return Math.pow(Math.max(base, 0.01), PERSONALITY_SCORE_EXPONENT);
}

// ─── Temperament ────────────────────────────────────────────────

/**
 * Does the ambition driving this candidate name its verb among its own
 * preferred ones?
 *
 * **This is not the reading the plan's bracket first suggests, and the obvious
 * reading is vacuous.** "An active ambition names this kind" is true of every
 * strategic candidate *by construction*: `generateStrategicCandidates` only ever
 * walks the templates an active ambition's `strategicProfile.templateIds` lists,
 * so a term keyed on membership would be a constant `+0.3` on every undertaking
 * and would tune nothing. `preferredVerbs` is the field that actually
 * discriminates — it is documented as "ordered by priority" and several ambitions
 * omit `change` or `destroy` entirely — so an ambition can permit a template
 * whose verb it does not prefer, which is exactly the distinction the weight is
 * for: is this undertaking what the ambition is *about*, or merely something it
 * allows?
 *
 * Fail-soft: an ambition with no strategic profile, or a template that cannot be
 * resolved, reads `false` — an absent signal, never a thrown one.
 */
export function ambitionPrefersVerb(
  ambitionTemplateId: string,
  template: StrategicActionTemplate | undefined,
): boolean {
  if (!template) return false;
  const profile = findAmbitionTemplate(ambitionTemplateId)?.strategicProfile;
  return profile?.preferredVerbs.includes(template.verb) ?? false;
}

/**
 * The family mix the THR-1280 verdict requires.
 *
 * `1 + 0.3 × [the ambition prefers this verb] + 0.2 × reachAffinity`. An
 * encounter candidate sits at a flat `1.0`, so these two weights are the whole of
 * how an undertaking's pull is tuned *relative* to an encounter's — the tunable
 * the plan asks for, in one place (NFP #1).
 *
 * Doc 4's grievance candidates arrive on this same board with an `urgencyWeight`
 * term; the slot is this function's third weight, declared here and filled there.
 */
export function computeTemperamentWeight(
  template: StrategicActionTemplate | undefined,
  reach: ReachDomain,
  ambitionNamesThisKind: boolean,
): number {
  const reachAffinity = template?.reachProfile?.[reach] ?? 0;
  return 1
    + UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT * (ambitionNamesThisKind ? 1 : 0)
    + UNDERTAKING_TEMPERAMENT_REACH_WEIGHT * clamp01(reachAffinity);
}

// ─── The board ──────────────────────────────────────────────────

/**
 * Rank every candidate the agent has, of every family, on one currency.
 *
 * Pure with respect to game state. May throw — the caller catches and traces
 * `decision_board_error` rather than degrading in silence.
 */
export function scoreUnifiedBoard(input: BoardInput): BoardResult {
  const { graph, agentId, tick } = input;
  const entries: BoardEntry[] = [];

  const profile = resolveAxiologicalProfile(graph, agentId, tick, input.fundament);

  // ── Encounters: the baseline family ──
  //
  // `valuePerTick` IS the EVT — `(euRanking + pushBenefit + resistBenefit) /
  // totalCost`, already computed by the live scorer. Reading it rather than
  // recomputing is what makes this a genuine comparison: if the board and the
  // encounter scorer ever disagree about an encounter's value, the disagreement
  // is in the multipliers, which are visible on the entry.
  for (const candidate of input.encounterCandidates) {
    entries.push({
      family: 'encounter',
      id: candidate.entry.templateId,
      evt: candidate.valuePerTick,
      desireMultiplier: candidate.desireMultiplier,
      temperamentWeight: 1,
      score: candidate.valuePerTick * candidate.desireMultiplier,
    });
  }

  // ── Undertakings ──
  for (const candidate of input.strategicCandidates) {
    const template = getStrategicTemplate(candidate.templateId);
    const reach = pickPrimaryReach(template);

    const advanceProbability = forecastAdvanceProbability(
      safeCapability(graph, candidate.actorId, reach),
      template?.checkpointDifficulty ?? UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY,
    );
    const payoff = resolveUndertakingPayoff(template);

    // A candidate has not started, so the whole undertaking is remaining.
    const workTicks = template?.projectDuration ?? STRATEGIC_DEFAULT_PROJECT_WORK_TICKS;
    const checkpointsRemaining = Math.max(1, Math.ceil(workTicks / UNDERTAKING_PROGRESS_PER_ADVANCE));

    const evt = undertakingEVT(payoff, advanceProbability, checkpointsRemaining);

    const ambitionBoost = getAmbitionBoost(graph, agentId, reach);
    const desireMultiplier = computeBoardDesireMultiplier(
      template?.motivations ?? [],
      profile,
      ambitionBoost,
    );

    const temperamentWeight = computeTemperamentWeight(
      template, reach, ambitionPrefersVerb(candidate.ambitionId, template),
    );

    entries.push({
      family: 'strategic_action',
      id: candidate.templateId,
      evt,
      desireMultiplier,
      temperamentWeight,
      advanceProbability,
      score: evt * desireMultiplier * temperamentWeight,
    });
  }

  entries.sort((a, b) => b.score - a.score);

  return {
    entries,
    top: entries.slice(0, BOARD_TRACE_TOP_N),
    winner: entries.length > 0 ? entries[0] : null,
  };
}

// ─── EVT ────────────────────────────────────────────────────────

/**
 * `payoffValue × P² / (checkpointsRemaining × interval)`.
 *
 * See the module header for why `P` is squared — it is the plan's two named terms
 * multiplied out, not an error. Kept as a named function so the golden test can
 * pin the shape independently of how the board assembles its inputs.
 */
export function undertakingEVT(
  payoffValue: number,
  advanceProbability: number,
  checkpointsRemaining: number,
): number {
  const expectedPayoff = payoffValue * advanceProbability;
  const expectedDurationTicks =
    (checkpointsRemaining * UNDERTAKING_CHECKPOINT_INTERVAL_TICKS)
    / Math.max(advanceProbability, PROBABILITY_EPSILON);
  return expectedPayoff / Math.max(expectedDurationTicks, 1);
}

/**
 * Floor on the probability divisor.
 *
 * `computeOutcomeProbabilities` already clamps to `[0.05, 0.95]`, so this can only
 * bite if a caller hands in a hand-built zero. It exists so `undertakingEVT` is
 * total for every input rather than only for the ones the engine happens to
 * produce — a helper that divides by a caller's number owes that (NFP #4).
 */
const PROBABILITY_EPSILON = 0.01;

/**
 * `P(advance-equivalent)` — the odds a checkpoint lands on a band that moves the
 * undertaking forward, enumerated over all 100 rolls of the real ladder.
 *
 * **`successProbability` is the obvious answer and it is wrong**, by about five
 * points, always in the same direction. `CHECKPOINT_EFFECT_BY_BAND` sends
 * `critical_success`, `success` and `success_at_cost` to an advance — but it
 * sends **`near_miss` to a halt**, and a near miss is a *succeeding* roll:
 * `mapResolverOutcomeToStep` reclassifies a `success` whose margin is within
 * `NEAR_MISS_MARGIN` (5). So the top five points of the success range halt, and
 * `successProbability` counts them as advances. Below the scale probability floor
 * the error runs the other way — `FLOOR_UPGRADE_OUTCOME` turns sub-floor failures
 * into `success_at_cost`, which advances.
 *
 * Since the EVT squares this number, a systematic ~5-point error is not a rounding
 * concern; so the forecast enumerates instead of approximating. Every step below
 * calls the *same* function the dice call — `classifyResolutionRoll`,
 * `breakdownToOutcome`, `mapResolverOutcomeToStep`, `CHECKPOINT_EFFECT_BY_BAND` —
 * so a future edit to the band map or the near-miss margin moves the forecast with
 * it rather than leaving it quietly stale. The contract test drives the real
 * `resolveStepCore` over all 100 rolls and requires an exact match.
 *
 * 100 iterations per undertaking candidate, and candidates are capped per actor
 * (`STRATEGIC_MAX_CANDIDATES_PER_ACTOR`), so this is bounded arithmetic on the
 * decision path with no graph access (NFP #7).
 *
 * ## The band this actually responds over, measured
 *
 * `computeCapability` is a sigmoid over raw domain scores of 10–40, so competent
 * mortals sit near the top of it: a 150-tick seed-42 medium run resolved 384
 * checkpoints whose capability ranged **0.792–1.000** (mean 0.983) against
 * difficulties of 0.450–0.550. Across that band this forecast is monotone and
 * spread 0.21–0.48.
 *
 * Below roughly 0.65 it is **constant**, because the raw threshold drops under the
 * regional scale floor and `FLOOR_UPGRADE_OUTCOME` decides the band instead of the
 * roll. That is the ladder working as designed, not a dead term — but it is worth
 * stating, because a reader sanity-checking this function over a natural-looking
 * 0.2–0.8 sweep will see a flat 0.14 and conclude the forecast is broken. The unit
 * tests sweep the measured band for exactly that reason, and pin the floor-pinned
 * region separately so a change to `MIN_PROBABILITY_BY_SCALE` surfaces as a test
 * failure rather than as a quietly different ranking for incapable actors.
 */
export function forecastAdvanceProbability(capability: number, difficulty: number): number {
  // The checkpoint passes no `scale`, so both the adjust and the floor resolve at
  // their `'regional'` default — matching `undertakingCheckpoints`, which passes
  // none either.
  const { adjustedDifficulty } = applyScaleDifficultyAdjust(difficulty, capability, 0, 0, undefined);

  const probability = computeResolutionThreshold({
    actorId: FORECAST_ACTOR_LABEL,
    domain: REACH_DOMAINS[0],
    capability,
    difficulty: adjustedDifficulty,
    sphereFactor: 0,
    actionModifiers: 0,
  });

  const scaleMinP = MIN_PROBABILITY_BY_SCALE['regional'];
  const floorActive = probability < scaleMinP;
  const floorThreshold = Math.floor(scaleMinP * 100);

  let advances = 0;
  for (let roll = 1; roll <= 100; roll++) {
    const breakdown = classifyResolutionRoll(probability, roll);
    let outcome = breakdownToOutcome(breakdown);

    if (floorActive
      && roll <= floorThreshold
      && (outcome === 'failure' || outcome === 'critical_failure')) {
      outcome = FLOOR_UPGRADE_OUTCOME;
    }

    const band = mapResolverOutcomeToStep(outcome, breakdown.nearMiss);
    if (CHECKPOINT_EFFECT_BY_BAND[band] !== 'halt') advances++;
  }

  return advances / 100;
}

/**
 * `computeResolutionThreshold` takes an `actorId` purely for telemetry attribution
 * and never reads the graph with it. The forecast has no telemetry, so it passes a
 * label that says so rather than an id that would imply a lookup happened.
 */
const FORECAST_ACTOR_LABEL = 'board-forecast';

function safeCapability(graph: WorldGraph, actorId: string, reach: ReachDomain): number {
  try {
    return computeCapability(graph, actorId, reach);
  } catch {
    return 0.5;
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
