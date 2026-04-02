import type { ReachDomain } from './traits';

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
  actionModifiers: number;     // capped at ±0.20
  influenceNudge?: number;     // ±0.05 to ±0.20 from player
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
  total: number;               // sum, capped at ±0.20
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
  /** Phase 2: which system produced this result */
  sourceSystem?: 'unified_action' | 'encounter' | 'forecast' | 'contested';
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
