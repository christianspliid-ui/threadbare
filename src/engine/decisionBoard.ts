/**
 * The one prioritization board — THR-1292 §4.
 *
 * ## What this replaced
 *
 * An agent's decision used to be **three sequential winner-take contests**:
 * encounter-internal selection (`scoreAndSelect`), then strategic-vs-encounter
 * (contest B), then — until slice 4 deleted it — initiative-vs-encounter. The
 * scorers being compared were incommensurate by construction: an encounter score
 * is unbounded above (multiplicative gates 1.3–2.5 stacked on additive bonuses)
 * while a strategic score was clamped into `[0.08, 0.851]` by
 * `STRATEGIC_ENCOUNTER_SCORE_BRIDGE`. One clamp and one constant were the entire
 * commensurability story, and the comparison itself was never traced — nothing
 * recorded what the losing family's best was. Measured before the cutover
 * (THR-1349), the clamp had contest B choosing an undertaking on 42–46% of
 * spotlight decisions and stacking eight to eleven on one mortal.
 *
 * This module ranks every candidate an agent has, of every family, on one
 * currency, says so on the record, and — since THR-1349 slice 3 — decides.
 * Contest B, the bridge and the clamp were deleted in that commit; the encounter
 * scorer's own selection is the one legacy contest left, and only as the
 * `legacyWinner` half of the comparison trace.
 *
 * ## The currency: expected value per tick (EVT)
 *
 * The encounter scorer already computes `euRanking / totalCost` — a five-band
 * expected utility over tick cost. Undertakings join *that* rather than inventing
 * a third scale:
 *
 * ```
 * boardScore = EVT × desireMultiplier × temperamentFamilyWeight × varietyMultiplier
 * ```
 *
 * The fourth term arrived with THR-1349 and applies to undertakings only: it is
 * the legacy scorer's `varietyPenalty`, relocated into this currency as a
 * proportional discount. Plan §4 claimed the penalty would survive the cutover as
 * an EVT input and it did not, so a live board had no variety mechanism of any
 * kind. See `computeBoardVarietyMultiplier`.
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
import { computeDesireScore, resolveAxiologicalProfile } from './encounterScoring';
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
  findGrievanceForAmbitionTemplate,
  grievanceHeat01,
} from './grievance/grievanceLifecycle';
import { GRIEVANCE_URGENCY_WEIGHT } from '../data/grievance-constants';
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
  UNDERTAKING_AMBITION_CENTRALITY_BOOST,
  UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT,
  UNDERTAKING_TEMPERAMENT_REACH_WEIGHT,
  BOARD_VARIETY_PENALTY_WEIGHT,
  UNDERTAKING_NEUTRAL_DESIRE,
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
   * The repetition discount, for an undertaking; `undefined` for an encounter,
   * which has no repetition counter to read.
   *
   * On the entry rather than folded silently into `score` for the reason
   * `ambitionBoost` is: a multiplier's *inputs* are where this family of defect
   * hides, and the last variety mechanism to go missing did so by being asserted
   * in a plan and present in no trace (THR-1349).
   */
  readonly varietyMultiplier?: number;
  /**
   * `P(advance-equivalent)` for an undertaking; `undefined` for an encounter,
   * whose EVT already folds its five-band expected utility.
   */
  readonly advanceProbability?: number;
  /**
   * The ambition-centrality term inside `desireMultiplier`, for an undertaking;
   * `undefined` for an encounter, which is scored on its own path.
   *
   * Carried separately because a multiplier's *inputs* are where this family of
   * defect hides: the term was a frozen constant for the whole shadow period and
   * `desireMultiplier` still varied — its other input moved — so nothing on the
   * trace could have shown it (THR-1302). Surfacing the input is what makes the
   * liveness assertion possible at all (NFP #2).
   */
  readonly ambitionBoost?: number;
  /**
   * Index of this entry's source candidate in its own family's input array —
   * `encounterCandidates` for an encounter, `strategicCandidates` for an
   * undertaking.
   *
   * Carried because in `'live'` mode the winner has to resolve back to the exact
   * candidate object, and `id` cannot do that: two encounter candidates for the
   * same template at different locations share a `templateId` but score
   * differently here (board score is `valuePerTick × desire`, both per-instance).
   * A `find` by id would silently execute the higher-ranked *legacy* instance
   * whenever the board preferred the other one — a wrong-noun bug of exactly the
   * kind the debugging protocol exists to catch, and invisible in every trace
   * because both rows would print the same id.
   */
  readonly candidateIndex: number;
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
 *
 * **Silence is neutrality, not revulsion (THR-1349).** `computeDesireScore` sums
 * signed profile values, so an *unauthored* motivation set scores exactly `0` —
 * indistinguishable, downstream, from an actor who actively wants none of what the
 * option offers. The floor then maps both to `MINIMUM_DESIRE ** EXPONENT` =
 * `0.0112`, roughly 250× below a matched candidate's `2.775`.
 *
 * That is harmless where this pipeline was calibrated and ruinous where the
 * cutover moved it. Encounters cannot reach the branch at all: every one draws its
 * motivations from `ENCOUNTER_TYPE_MOTIVATIONS`, a central table whose ten rows are
 * uniformly arity-2, so no encounter is ever axiologically silent and the floor
 * only ever catches a genuine *mismatch*. Undertakings are hand-authored per
 * template and **35 of 64 name no motivations at all** — so importing the same
 * floor pinned 55% of the corpus at the floor for declining to state an opinion,
 * and contest B never read desire, which is why the cutover is what exposed it.
 *
 * So an empty set contributes neutrality where it used to contribute `0`, and an
 * authored one is scored exactly as before. Neutral is the *axiological* term only,
 * not the returned multiplier: the ambition boost still adds to it and the exponent
 * still applies, so a silent template with a central ambition outranks a silent one
 * without — the discrimination that survives is the one the content did not decline
 * to express. This deliberately does **not** loosen the mismatch case: a template
 * that names motivations its proposer leans against still floors, because mortals
 * genuinely should not pursue what they do not value.
 *
 * **THR-1377 authored all 35 and the branch was deliberately kept.** It is now
 * unreachable from the shipped corpus — `undertaking-motivations.test.ts` pins
 * that, and would fail the moment it were not. It is retained because
 * `motivations` is still *optional* on `StrategicActionTemplate` and this function
 * takes a bare `readonly ValuePair[]`, so an empty set remains constructible by
 * every caller the type admits: a template added between two test runs, a pack
 * authored downstream, a candidate assembled at runtime. Deleting the branch would
 * restore "silence is revulsion" for exactly those, silently, which is the failure
 * this pair of tickets exists to close. A guard whose population is empty costs one
 * comparison and is the only thing standing between the corpus invariant and the
 * next silent template.
 */
export function computeBoardDesireMultiplier(
  motivations: readonly ValuePair[],
  profile: AxiologicalProfile,
  ambitionBoost: number,
): number {
  // The *only* divergence from the encounter pipeline, and it is confined to the
  // axiological term: an unauthored set contributes neutrality instead of the `0`
  // that `computeDesireScore` returns for it. Floor, ambition boost and exponent
  // are untouched and still shared, so a silent template remains sensitive to
  // ambition centrality rather than becoming a flat constant.
  const personalityBias = motivations.length === 0
    ? UNDERTAKING_NEUTRAL_DESIRE
    : computeDesireScore(motivations as ValuePair[], profile) * PERSONALITY_SELECTION_WEIGHT;
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
/**
 * How central is this undertaking's reach to the ambition that proposed it?
 *
 * **The term this replaces was true by construction** (THR-1302). The board read
 * the encounter path's `getAmbitionBoost`, which asks *"does the agent pursue
 * **any** ambition with positive affinity for this reach?"* — a question whose
 * population the board itself generates, since `generateStrategicCandidates` only
 * ever walks an active ambition's own `templateIds` and the board takes its reach
 * from that same template. Measured over 150 ticks on seeds 42 and 99, the
 * undertaking desire multiplier was `0.354` at p25, p50 **and** p75, identical on
 * both seeds: the boost was a flat constant wearing a predicate's clothes. This is
 * the same vacuity one term over from the one the temperament bracket caught
 * (impediment #829), and `ambitionPrefersVerb`'s docblock above is its sibling.
 *
 * Two changes make it discriminate:
 *
 * 1. **It asks the generating ambition, not the agent's whole pursued set.** The
 *    board knows *which* ambition proposed this candidate, so the diffuse question
 *    is not the one it has to ask. On the shipped corpus **19 of 77** real
 *    (ambition, template) pairs sit on a reach the proposing ambition has no
 *    affinity for at all — permitted by its template list, but not what it is
 *    about. Every one of those was paid the full flat boost before.
 * 2. **It reads the magnitude, not `> 0`.** `reachAffinity` is authored as a
 *    graded map (0.2–0.9) and was being collapsed to a boolean.
 *
 * Normalised by the ambition's *own* maximum affinity rather than used raw. Raw
 * magnitudes are not calibrated across 24 separately-authored ambitions, and since
 * no ambition authors a `1.0`, the raw form would cap every undertaking at `0.4`
 * — a uniform level cut dressed as a spread (measured: raw max `0.400`, mean
 * `0.258`; normalised max `0.500`, mean `0.331`, and 8 distinct values against 6).
 * Normalised, an undertaking on its ambition's most-preferred reach is paid
 * exactly what the flat term paid, and everything else is paid less in proportion
 * to how peripheral it is — which is the "how strongly, not whether" this term was
 * asked for.
 *
 * **Not a double-count of the temperament weight** (this issue's second Done-when).
 * `computeTemperamentWeight` reads two signals, and this reads neither: the
 * ambition's `preferredVerbs` *membership* (via `ambitionPrefersVerb`) and the
 * **template's** own `reachProfile`. This reads the **ambition's** `reachAffinity`
 * — a different field on a different entity. `decisionBoard.test.ts` pins the
 * independence on real data rather than leaving it to this paragraph.
 *
 * Fail-soft (NFP #4): an unresolvable ambition, an absent `reachAffinity`, or an
 * all-zero one reads `0` — an absent signal, never a thrown one, and never a
 * divide-by-zero.
 */
export function computeAmbitionCentralityBoost(
  ambitionTemplateId: string,
  reach: ReachDomain,
): number {
  const affinities = findAmbitionTemplate(ambitionTemplateId)?.reachAffinity;
  if (!affinities) return 0;

  const own = affinities[reach] ?? 0;
  if (own <= 0) return 0;

  const strongest = Math.max(...REACH_DOMAINS.map(d => affinities[d] ?? 0));
  if (strongest <= 0) return 0;

  return UNDERTAKING_AMBITION_CENTRALITY_BOOST * clamp01(own / strongest);
}

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
 * `1 + 0.3 × [the ambition prefers this verb] + 0.2 × reachAffinity + 0.4 × heat`.
 * An encounter candidate sits at a flat `1.0`, so these weights are the whole of
 * how an undertaking's pull is tuned *relative* to an encounter's — the tunable
 * the plan asks for, in one place (NFP #1).
 *
 * The third weight is the grievance urgency term THR-1298 declared here and slice 6
 * filled. `grievanceHeat01` is the candidate's own vendetta heat on `[0, 1]`, zero
 * for every ordinary candidate — so a fresh vendetta outranks an ordinary ambition
 * and, as its heat decays, competes fairly and eventually leaves the board on its
 * own. Urgency *is* the decay curve: there is no grievance scheduler anywhere, and
 * the plan's substrate ruling is that the one board is the competition surface.
 */
export function computeTemperamentWeight(
  template: StrategicActionTemplate | undefined,
  reach: ReachDomain,
  ambitionNamesThisKind: boolean,
  grievanceHeat01 = 0,
): number {
  const reachAffinity = template?.reachProfile?.[reach] ?? 0;
  return 1
    + UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT * (ambitionNamesThisKind ? 1 : 0)
    + UNDERTAKING_TEMPERAMENT_REACH_WEIGHT * clamp01(reachAffinity)
    + GRIEVANCE_URGENCY_WEIGHT * clamp01(grievanceHeat01);
}

// ─── Variety ────────────────────────────────────────────────────

/**
 * The share of its score a candidate keeps given how repeated it is.
 *
 * `varietyPenalty` is already computed per candidate by `scoreStrategicCandidates`
 * — `min(1, (boardCount - 1) × 0.2 + historyCount × 0.15)` over this agent's own
 * board duplicates and its recent starts — so this consumes the existing signal
 * rather than inventing a second one. That is the relocation plan §4 promised and
 * did not perform.
 *
 * Returns a multiplier in `[1 - BOARD_VARIETY_PENALTY_WEIGHT, 1]`. An encounter
 * entry has no analogue and is not discounted: `varietyPenalty` is defined over an
 * actor's undertaking history, and there is no encounter-side counter to read.
 * That asymmetry is deliberate and is the same one `temperamentWeight` already
 * carries, where the encounter family sits at a flat `1.0` baseline.
 *
 * Fail-soft (NFP #4): a candidate whose `varietyPenalty` is absent or non-finite
 * reads as unrepeated — an absent signal is never a penalty.
 */
export function computeBoardVarietyMultiplier(varietyPenalty: number | undefined): number {
  if (varietyPenalty === undefined || !Number.isFinite(varietyPenalty)) return 1;
  return 1 - BOARD_VARIETY_PENALTY_WEIGHT * clamp01(varietyPenalty);
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
  for (const [index, candidate] of input.encounterCandidates.entries()) {
    entries.push({
      family: 'encounter',
      id: candidate.entry.templateId,
      evt: candidate.valuePerTick,
      desireMultiplier: candidate.desireMultiplier,
      temperamentWeight: 1,
      score: candidate.valuePerTick * candidate.desireMultiplier,
      candidateIndex: index,
    });
  }

  // ── Undertakings ──
  for (const [index, candidate] of input.strategicCandidates.entries()) {
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

    const ambitionBoost = computeAmbitionCentralityBoost(candidate.ambitionId, reach);
    const desireMultiplier = computeBoardDesireMultiplier(
      template?.motivations ?? [],
      profile,
      ambitionBoost,
    );

    // The grievance this candidate would pursue, if any (THR-1298 slice 6). Resolved
    // per candidate rather than once per board because a board carries candidates from
    // several ambitions and only the ones under the vendetta may claim its urgency —
    // the lookup is two edge reads against an agent holding at most one grievance, and
    // an agent with none exits on the first.
    const grievanceHeat = grievanceHeat01(
      findGrievanceForAmbitionTemplate(graph, candidate.actorId, candidate.ambitionId),
    );

    const temperamentWeight = computeTemperamentWeight(
      template, reach, ambitionPrefersVerb(candidate.ambitionId, template), grievanceHeat,
    );

    const varietyMultiplier = computeBoardVarietyMultiplier(
      candidate.scoreComponents?.varietyPenalty,
    );

    entries.push({
      family: 'strategic_action',
      id: candidate.templateId,
      evt,
      desireMultiplier,
      temperamentWeight,
      varietyMultiplier,
      advanceProbability,
      ambitionBoost,
      score: evt * desireMultiplier * temperamentWeight * varietyMultiplier,
      candidateIndex: index,
    });
  }

  // Ties break on the input order both families already arrived in (each is
  // pre-ranked by its own scorer), never on `sort`'s unspecified behaviour for
  // equal keys — the board decides in live mode, and determinism is NFP #3.
  entries.sort((a, b) => (b.score - a.score) || (a.candidateIndex - b.candidateIndex));

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
