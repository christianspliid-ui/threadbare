/**
 * Step resolution core — the one band ladder (THR-1292 §1).
 *
 * Everything from "we know the capability and the difficulty" to "we know which
 * of the six `StepOutcome` bands happened" lives here, and nowhere else. Two
 * callers share it:
 *
 *  1. **Encounters** — `resolveUncontestedStep` (`unifiedActionResolution.ts`),
 *     which derives the inputs from a `UnifiedAction` + template + graph, then
 *     applies what this module *returns*.
 *  2. **Undertakings** — `undertakingCheckpoints.ts` (slice 3), which calls the
 *     same core with `variancePolicy: 'agent'` and `quintessencePolicy: 'none'`.
 *
 * ## Why a returns-only contract
 *
 * The library **returns, the caller mutates**. Nothing here touches the graph,
 * queues an event, or emits a trace: quintessence costs come back as
 * `spendIntents[]` and the resolution telemetry comes back as `tracePayload`.
 * That is what lets a second caller adopt the ladder without also inheriting the
 * encounter runtime's state couplings, and it matches the stated design of
 * `resolutionService` one layer down ("callers emit traces").
 *
 * ## The determinism contract (NFP #3)
 *
 * The core draws **at most two** values from `rng`, in this fixed order:
 *   1. the d100, inside `resolveAction` — always;
 *   2. the resist check — only when a resist is actually funded and attempted.
 *
 * Riders, the floors and the debug band pin draw **zero**. Any change to the draw
 * count is a stream break for every downstream consumer of the same generator, so
 * `stepResolutionGolden.test.ts` pins `roll` and `probability` per row, not merely
 * the band, and would fail on a re-ordering that left every band intact.
 *
 * ## The asymmetry between push and resist, and why it is not an oversight
 *
 * **Resist lives here. Push does not.** Resist is *post-roll* — it reads the band
 * the d100 produced and draws a second value against it — so it cannot be lifted
 * out without breaking the stream order above. Push is *pre-roll* and draws
 * nothing: its whole contribution is a number folded into `actionModifiers`, which
 * is already an input. Moving push in would mean carrying the template registry
 * (`isPushEligible`), the raw authored difficulty and the actor node into the core
 * so that caller 2 — which spends no quintessence in v1 — could ignore all three.
 *
 * So push stays with the caller that has that context, and its already-built event
 * is handed to `pushIntent` purely so it comes back inside `spendIntents[]`.
 * Callers then have **one** queue to drain rather than two, and "everything this
 * resolution wants to spend" stays a single list. (Executor calibration call,
 * plan § Grey zones; the plan's own input list carries `actionModifiers` as a
 * pre-summed input, which is what makes this the reading it already implied.)
 */

import type { OutcomeType, ResolutionInput, ResolutionResult } from '../types/resolution';
import type { ReachDomain } from '../types/traits';
import type { ActionScale, NudgeRider, StepOutcome } from '../types/unifiedAction';
import type { QuintessenceEvent } from '../types/quintessence';
import { applyRider } from './encounters/nudges';
import { isStepFailure } from '../types/unifiedAction';
import { resolveAction as resolveActionShared } from './resolutionService';
import { applyScaleDifficultyAdjust, MIN_PROBABILITY_BY_SCALE } from './resolutionScaleAdjust';
import {
  applyResistOutcome,
  canResistOutcome,
  RESIST_DOWNGRADE_CHANCE,
} from './quintessenceActions';
import {
  PLAYER_CAST_VARIANCE_ENABLED,
  PLAYER_CAST_OUTCOME_FLOOR,
  PLAYER_CAST_PUSH_ENABLED,
} from '../data/player-cast-constants';

// ─── THR-571: Outcome-ladder constants ──────────────────────────

/**
 * What a probability-floor upgrade turns a sub-floor failure into.
 *
 * An incapable actor guaranteed progress by the floor *is* the definition of
 * success-at-cost — they got through, but not cleanly. Clean `success` therefore
 * still means the roll landed on capability, not on the floor. (NFP #1.)
 */
export const FLOOR_UPGRADE_OUTCOME: OutcomeType = 'success_at_cost';

// ─── Contract ───────────────────────────────────────────────────

/**
 * A read-only view of the node whose quintessence funds a resist. Structural, so
 * a `WorldGraph` node satisfies it without this module importing the graph.
 */
export interface StepCoreQuintessenceView {
  readonly id: string;
  readonly properties: Record<string, unknown>;
}

export interface StepCoreInput {
  readonly actorId: string;
  readonly reach: ReachDomain;
  /** Post-sigmoid domain capability, 0–1. Callers own the sigmoid. */
  readonly capability: number;
  /**
   * Normalised 0–1 difficulty, **after** every caller-side derivation (tier
   * scaling, intel sensitivity, trait-variant deltas) and **before** the scale
   * adjustment this module applies.
   */
  readonly difficulty: number;
  readonly scale?: ActionScale;
  /** Caller-composed additive term: push + company assist + named nudges. Not clamped. */
  readonly actionModifiers: number;
  readonly testShapers: ResolutionInput['testShapers'];
  /**
   * Dormant in both callers today (the encounter path hardcodes 0). Carried as a
   * real input rather than deleted so the ladder keeps the shape
   * `computeResolutionThreshold` expects — an honest dormant input, not a new behavior.
   */
  readonly sphereFactor?: number;
  /** `'player'` arms the THR-728 floor; `'agent'` is the ordinary mortal ladder. */
  readonly variancePolicy: 'player' | 'agent';
  /** `'none'` skips the resist branch entirely — and so its conditional rng draw. */
  readonly quintessencePolicy: 'spend-intent' | 'none';
  /** Template-registry verdict, resolved caller-side (`isResistEligible`). */
  readonly resistEligible?: boolean;
  readonly resistActor?: StepCoreQuintessenceView;
  /** Interpolated into the resist event's `source` string. */
  readonly resistSourceLabel?: string;
  /** Pre-roll push event built by the caller; echoed into `spendIntents`. Never mutated. */
  readonly pushIntent?: QuintessenceEvent | null;
  /**
   * Rider *selection* is caller-side (it reads the nudge registry); rider
   * *application* is core, because the ordering — after floors and resist, before
   * the debug pin — is exactly the invariant that must not drift between callers.
   */
  readonly bandRider?: NudgeRider;
  /** THR-1030 debug pin. Applied last of all; draws zero rng. */
  readonly bandOverride?: StepOutcome;
  readonly tick: number;
  readonly sourceLabel: ResolutionResult['sourceSystem'];
}

/**
 * Everything the caller needs to emit `resolution.input` telemetry. Field names
 * mirror `ResolutionInputTrace` exactly; the caller supplies the fields only it
 * knows (`templateId`, group attribution, the summary string).
 */
export interface StepCoreTracePayload {
  readonly capability: number;
  /** Post-scale-adjustment difficulty — what the roll actually ran against. */
  readonly difficulty: number;
  readonly rawDifficulty: number;
  readonly scaleOffsetApplied: number;
  readonly sphereFactor: number;
  readonly actionModifiers: number;
  readonly influenceNudge: number;
  readonly probability: number;
  readonly scaleFloorApplied: boolean;
  readonly probabilityFloorApplied: boolean;
  readonly roll: number;
  readonly outcome: OutcomeType;
  /**
   * The resolver's verdict **before** any floor — the observable "before" of the
   * THR-571 erasure. Distinct from `StepCoreResult.resolverOutcome`, which is the
   * post-floor value; the two disagree on exactly the floored rows, which is the
   * whole point of reporting both.
   */
  readonly rawOutcome: OutcomeType;
  readonly critClassification: 'critical_success' | 'critical_failure' | 'none';
  readonly floorUpgradeApplied: boolean;
  readonly playerFloorApplied: boolean;
}

export interface StepCoreResult {
  /** The final band, after floors, resist, rider and pin. */
  readonly outcome: StepOutcome;
  /**
   * The resolver `OutcomeType` **after** the floors but before the step-band
   * mapping. Named to match what `StepResolutionResult.rawOutcome` has always
   * carried; `tracePayload.rawOutcome` is the genuinely pre-floor one.
   */
  readonly resolverOutcome: OutcomeType;
  readonly probability: number;
  readonly roll: number;
  readonly resistAttempted: boolean;
  readonly resistSucceeded: boolean;
  readonly resistCost: number;
  readonly preResistOutcome?: StepOutcome;
  /** Push (echoed) then resist (produced), in the order they were incurred. */
  readonly spendIntents: readonly QuintessenceEvent[];
  readonly tracePayload: StepCoreTracePayload;
}

// ─── Band mapping ───────────────────────────────────────────────

/**
 * Map the shared resolver's `OutcomeType` to a `StepOutcome`, preserving the full
 * ladder instead of collapsing to binary.
 *
 * `near_miss` is generated when a roll succeeds but lands within
 * `NEAR_MISS_MARGIN` of the threshold — distinct from a shaper-shifted
 * `success_at_cost`.
 */
export function mapResolverOutcomeToStep(resolverOutcome: OutcomeType, nearMiss: boolean): StepOutcome {
  switch (resolverOutcome) {
    case 'critical_success': return 'critical_success';
    case 'success':
      return nearMiss ? 'near_miss' : 'success';
    case 'success_at_cost': return 'success_at_cost';
    case 'failure': return 'failure';
    case 'critical_failure': return 'critical_failure';
  }
}

// ─── The core ───────────────────────────────────────────────────

/**
 * Resolve one step to a band. Pure with respect to game state — see the module
 * header for the returns-only contract and the two-draw determinism rule.
 */
export function resolveStepCore(input: StepCoreInput, rng: () => number): StepCoreResult {
  const sphereFactor = input.sphereFactor ?? 0;

  // THR-451: scale-based difficulty adjustment happens at this boundary; the
  // resolver one layer down stays scale-agnostic.
  const rawDifficulty = input.difficulty;
  const { adjustedDifficulty, scaleOffsetApplied, scaleFloorApplied } = applyScaleDifficultyAdjust(
    input.difficulty,
    input.capability,
    sphereFactor,
    input.actionModifiers,
    input.scale,
  );

  const resolutionInput: ResolutionInput = {
    actorId: input.actorId,
    domain: input.reach,
    capability: input.capability,
    difficulty: adjustedDifficulty,
    sphereFactor,
    actionModifiers: input.actionModifiers,
    testShapers: input.testShapers,
  };

  // ── rng draw 1 of at most 2: the d100 ──
  const rawResult = resolveActionShared(resolutionInput, rng, undefined, input.sourceLabel);

  // THR-571: the raw resolver outcome, captured before any floor upgrade.
  const preFloorOutcome = rawResult.outcome;
  const critClassification: 'critical_success' | 'critical_failure' | 'none' =
    preFloorOutcome === 'critical_success' ? 'critical_success'
      : preFloorOutcome === 'critical_failure' ? 'critical_failure'
        : 'none';

  // THR-451 Phase B / THR-571: the scale probability floor for incapable actors.
  // A sub-floor failing roll the floor guarantees through becomes success_at_cost,
  // not a clean success — they scraped through on the floor, they did not earn a
  // clean win. A doubles-classified critical_success is preserved (rare brilliance
  // from the incapable is desirable drama).
  const scaleMinP = MIN_PROBABILITY_BY_SCALE[input.scale ?? 'regional'];
  const probabilityFloorActive = rawResult.probability < scaleMinP;
  const floorUpgradeApplied = probabilityFloorActive &&
    rawResult.roll <= Math.floor(scaleMinP * 100) &&
    (preFloorOutcome === 'failure' || preFloorOutcome === 'critical_failure');
  const flooredResult = probabilityFloorActive
    ? {
      ...rawResult,
      probability: scaleMinP,
      outcome: (floorUpgradeApplied ? FLOOR_UPGRADE_OUTCOME : rawResult.outcome) as OutcomeType,
    }
    : rawResult;

  // THR-728: the player safety floor. A paid cast never outright fails — a failing
  // roll becomes success-at-cost, so `step.onSuccess` still runs and the essence
  // always bought something. `critical_success` and `near_miss` pass through: the
  // full upside stays live, only the bottom is closed off.
  //
  // Deliberately a SECOND floor stacked after the THR-571 one, so the two markers
  // (`[floor↑]`, `[player-floor↑]`) stay distinguishable in traces — "the incapable
  // scraped through" and "the god cannot fail" are never confused for one another.
  const playerFloorApplied = PLAYER_CAST_VARIANCE_ENABLED &&
    input.variancePolicy === 'player' &&
    (flooredResult.outcome === 'failure' || flooredResult.outcome === 'critical_failure');
  const result = playerFloorApplied
    ? { ...flooredResult, outcome: PLAYER_CAST_OUTCOME_FLOOR }
    : flooredResult;

  const nearMiss = result.rollBreakdown?.nearMiss ?? false;
  const initialOutcome = mapResolverOutcomeToStep(result.outcome, nearMiss);
  let outcome = initialOutcome;

  // ── Resist: post-roll, and rng draw 2 of at most 2 ──
  // Social/influence actions may spend quintessence for a chance to soften a bad
  // band. Mortal-only, for the same reason as push — and with the player floor
  // above it is unreachable for a player cast anyway (the outcome is never a
  // failure by the time control arrives here). The explicit guard states the rule
  // rather than leaving it an emergent consequence.
  const spendIntents: QuintessenceEvent[] = [];
  if (input.pushIntent) spendIntents.push(input.pushIntent);

  let resistEvent: QuintessenceEvent | null = null;
  const resistAllowed = PLAYER_CAST_PUSH_ENABLED || input.variancePolicy !== 'player';
  if (
    input.quintessencePolicy === 'spend-intent' &&
    resistAllowed &&
    isStepFailure(outcome) &&
    input.resistEligible === true &&
    input.resistActor &&
    canResistOutcome(input.resistActor)
  ) {
    resistEvent = applyResistOutcome(
      input.resistActor,
      `action_resist_${input.resistSourceLabel ?? input.actorId}`,
      input.tick,
    );
    if (resistEvent) {
      const resistRoll = rng();
      if (resistRoll < RESIST_DOWNGRADE_CHANCE) {
        // critical_failure → failure, failure → success_at_cost
        if (outcome === 'critical_failure') {
          outcome = 'failure';
        } else if (outcome === 'failure') {
          outcome = 'success_at_cost';
        }
      }
      spendIntents.push(resistEvent);
    }
  }

  // `postResistOutcome` is captured before the rider remap so `resistSucceeded`
  // below still measures what the *resist* did. Without it, a rider that changed
  // the band would be reported as a successful resist on an action that never
  // resisted at all.
  const postResistOutcome = outcome;

  // THR-773: band riders applied LAST, after push/resist/floors — the rider is the
  // final word on the band the player paid to change, and it is applied to the
  // *outcome*, never to the roll. `applyRider` is a pure lookup over the six-value
  // domain and takes zero draws, so same seed + same nudges ⇒ same d100.
  if (input.bandRider) {
    outcome = applyRider(outcome, input.bandRider);
  }

  // THR-1030: the review pin, applied last of all. Everything above ran for real
  // and is traced for real — the roll, the probability, the floors and the rider
  // are all what actually happened. Only the band the reviewer asked to see is
  // substituted. Zero rng draws, so a pinned run and an unpinned run consume the
  // same stream (NFP #3).
  if (input.bandOverride) {
    outcome = input.bandOverride;
  }

  return {
    outcome,
    resolverOutcome: result.outcome,
    probability: result.probability,
    roll: result.roll,
    resistAttempted: resistEvent !== null,
    resistSucceeded: resistEvent !== null && postResistOutcome !== initialOutcome,
    resistCost: resistEvent ? Math.abs(resistEvent.delta) : 0,
    preResistOutcome: resistEvent ? initialOutcome : undefined,
    spendIntents,
    tracePayload: {
      capability: input.capability,
      difficulty: adjustedDifficulty,
      rawDifficulty,
      scaleOffsetApplied,
      sphereFactor,
      actionModifiers: input.actionModifiers,
      influenceNudge: 0,
      probability: flooredResult.probability,
      scaleFloorApplied,
      probabilityFloorApplied: probabilityFloorActive,
      roll: rawResult.roll,
      outcome: result.outcome,
      rawOutcome: preFloorOutcome,
      critClassification,
      floorUpgradeApplied,
      playerFloorApplied,
    },
  };
}
