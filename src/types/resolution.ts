import type { ReachDomain } from './traits';
import type { TestShaperTrigger } from './effects';

// ─── Outcome Types ──────────────────────────────────────────────────

export type ForecastTier = 'doomed' | 'perilous' | 'uncertain' | 'favorable' | 'fated';

/**
 * Canonical outcome ladder (Phase 2).
 * `success_at_cost` exists in the contract for Phase 3 expansion;
 * callers that cannot yet distinguish it may collapse to `success` or `failure`.
 */
export type OutcomeType = 'critical_success' | 'success' | 'success_at_cost' | 'failure' | 'critical_failure';

/** Whether the resolution is live (tick pipeline) or forecast (planner/preview). */
export type ResolutionMode = 'live' | 'forecast';

// ─── Resolution Inputs ──────────────────────────────────────────────

export interface ResolutionInput {
  actorId: string;
  domain: ReachDomain;
  capability: number;          // 0.0–1.0 (domain capability from sigmoid)
  difficulty: number;          // 0.0–1.0 (canonical normalized range)
  sphereFactor: number;        // 0.0–0.2
  /**
   * Caller-composed additive modifier term. **Not clamped** — not here, not in
   * `computeResolutionThreshold`, not in any caller (verdict recorded THR-827;
   * this field previously claimed "capped at ±0.20", which was never enforced
   * and never true).
   *
   * Bounds live at the *source*, per contributor, in `resolutionModifiers.ts`:
   * sphere ±0.10, equipment ≤0.15, terrain ±0.10, traits ≤0.10, effects ≤0.30
   * (`EFFECT_MODIFIER_CAP`) — summing to 0.75 on the bounded sources alone,
   * before the unbounded divine-intervention and `modify_rules` terms. A
   * committed nudge hand adds on top of that total (`useNudgeHand.ts`).
   *
   * Only the *result* is clamped, to [PROBABILITY_FLOOR, PROBABILITY_CEILING].
   * Authoring-time hand strength is bounded by the rubric in
   * `data/content-eval/nudgeAuthoringConstants.ts`, not by runtime math.
   */
  actionModifiers: number;
  influenceNudge?: number;     // ±0.05 to ±0.20 from player
  testShapers?: ResolutionTestShaper[];
}

export interface ResolutionTestShaper {
  sourceAttachmentId: string;
  sourceAttachmentName: string;
  trigger: TestShaperTrigger;
  steps: number;
  maxMargin?: number;
}

/**
 * Structured modifier breakdown for future expansion.
 * Phase 2: captures the same data as `actionModifiers` in decomposed form.
 */
export interface ResolutionModifiers {
  terrainModifier: number;
  traitModifier: number;
  effectModifier: number;
  divineInfluence: number;
  /** Plain sum of the fields above — not clamped. See `ResolutionInput.actionModifiers`. */
  total: number;
}

// ─── Resolution Results ─────────────────────────────────────────────

export interface FateForecast {
  probability: number;         // 0.05–0.95
  forecastTier: ForecastTier;
  topContributors: Array<{ name: string; contribution: number }>;
}

/**
 * Structured roll decomposition for inspectability.
 * Captures how the roll was classified into an outcome.
 */
export interface ResolutionRollBreakdown {
  threshold: number;           // 1–95 (probability * 100, floored)
  roll: number;                // 1–100
  isDoubles: boolean;          // roll tens == roll ones
  margin: number;              // roll - threshold
  critClassification: 'critical_success' | 'critical_failure' | 'none';
  nearMiss: boolean;           // |margin| <= 5
}

export interface ResolutionResult {
  outcome: OutcomeType;
  roll: number;                // 1–100
  probability: number;         // what was needed
  margin: number;              // how close (roll - threshold)
  marginalFactor?: string;     // narrative attribution for close outcomes
  forecast: FateForecast;
  /** Phase 2: structured roll breakdown for inspectability */
  rollBreakdown?: ResolutionRollBreakdown;
  /** Tactical test-shaper that altered the post-roll outcome, if any */
  appliedShaper?: AppliedResolutionShaper;
  /**
   * Phase 2: which system produced this result.
   *
   * `'undertaking'` is the second caller of the shared step-resolution core
   * (THR-1292 §2) — checkpoint dice in the strategic runtime. It is a distinct
   * member rather than a reuse of `'unified_action'` so a resolution log can tell
   * an encounter step from a checkpoint without inferring it from the actor.
   */
  sourceSystem?: 'unified_action' | 'encounter' | 'forecast' | 'contested' | 'undertaking';
}

export interface AppliedResolutionShaper {
  sourceAttachmentId: string;
  sourceAttachmentName: string;
  trigger: TestShaperTrigger;
  steps: number;
  maxMargin?: number;
  outcomeBefore: OutcomeType;
  outcomeAfter: OutcomeType;
}

/** For contested actions: two independent rolls */
export interface ContestedResolutionResult {
  attacker: ResolutionResult;
  defender: ResolutionResult;
  contestOutcome: 'attacker_wins' | 'defender_wins' | 'stalemate' | 'mutual_failure';
}

// ─── Forecast Surface ───────────────────────────────────────────────

/**
 * Probability summary for planners and content previews.
 * Derived from the same threshold/crit rules as live resolution.
 */
export interface ResolutionProbabilitySummary {
  successProbability: number;          // P(success | critical_success)
  critSuccessProbability: number;      // P(critical_success)
  critFailureProbability: number;      // P(critical_failure)
  failureProbability: number;          // P(failure | critical_failure)
  threshold: number;                   // computed threshold (1–95)
  forecastTier: ForecastTier;
}

// ─── Quintessence Spend Types ───────────────────────────────────────

/** Canonical spend kinds for quintessence interactions. */
export type QuintessenceSpendKind = 'push' | 'resist' | 'overreach';

/**
 * Threshold states for actor quintessence level (Phase 2).
 * Derived from quintessence / quintessenceMax ratio.
 */
export type QuintessenceThresholdState = 'healthy' | 'strained' | 'weakened' | 'critical' | 'broken';
