/**
 * Balance Evaluation Types — shared schema for telemetry, targets, summaries, and evaluation.
 *
 * Phase 1 of the agent success redesign — see:
 *   Docs/plans/2026-04-02-phase1-balance-eval-foundation-plan.md
 *
 * Design principles:
 * - Machine-readable first; human-readable labels are secondary.
 * - Additive schema — add optional fields, never remove.
 * - Do not reuse traceBuffer internals; this is a parallel system.
 */

// ─── Threat Bands ─────────────────────────────────────────────────

/** Maps to ThreatRating from encounter.ts, plus 'epic' (authored convention) and 'unknown' fallback. */
export type BalanceThreatBand =
  | 'trivial'
  | 'easy'
  | 'moderate'
  | 'hard'
  | 'deadly'
  | 'epic'
  | 'unknown';

// ─── Run Segments ─────────────────────────────────────────────────

/** Coarse pacing phase within a single run. */
export type BalanceRunSegment = 'opening' | 'early' | 'mid' | 'late';

// ─── Metric Severity ──────────────────────────────────────────────

export type BalanceMetricSeverity = 'pass' | 'warning' | 'fail';

// ─── Event Kinds ──────────────────────────────────────────────────

export type BalanceEventKind =
  | 'step_resolved'
  | 'action_resolved'
  | 'encounter_resolved'
  | 'quintessence_changed'
  | 'reward_granted'
  | 'attachment_changed'
  | 'growth_applied'
  | 'state_transition';

// ─── Balance Event ────────────────────────────────────────────────

/**
 * A structured balance telemetry event emitted during simulation.
 *
 * Use optional fields rather than one giant union payload.
 * All required fields are minimal; everything contextual is optional.
 */
export interface BalanceEvent {
  /** Monotonic sequence within the run — for ordering/diagnostics */
  seq: number;
  tick: number;
  kind: BalanceEventKind;
  agentId: string;
  /**
   * Source system tag.
   * Values: 'unified_action' | 'legacy_encounter' | 'quintessence' | 'reward' | 'attachment' | 'growth' | 'lifecycle'
   */
  sourceSystem: string;

  // ── Action / encounter context ──
  templateId?: string;
  encounterId?: string;
  reach?: string;
  threatBand?: BalanceThreatBand;
  stepIndex?: number;

  // ── Resolution context ──
  difficulty?: number;
  capability?: number;
  probability?: number;
  roll?: number;

  // ── Outcome ──
  result?: 'success' | 'failure' | 'critical_success' | 'critical_failure' | 'success_at_cost';
  /** For encounter_resolved / action_resolved: 'completed' | 'abandoned' */
  finalStatus?: string;

  // ── Quintessence context ──
  quintessenceBefore?: number;
  quintessenceAfter?: number;
  quintessenceDelta?: number;
  quintessenceReason?: string;

  // ── Reward context ──
  rewardCategory?: string;
  rewardTier?: number;
  rewardTemplateId?: string | null;
  isBadOutcome?: boolean;
  rewardPoolSize?: number;

  // ── Attachment context ──
  attachmentId?: string;
  attachmentCategory?: string;
  attachmentOperation?: 'added' | 'removed';

  // ── Growth context ──
  growthReach?: string;
  growthDelta?: number;
  newTier?: number;

  // ── State transition context ──
  transitionType?: string;
}

// ─── Metric Band (Target) ─────────────────────────────────────────

/**
 * Target band for a single metric.
 * Values are normalized: 0-1 for rates, ticks for timing metrics.
 */
export interface BalanceMetricBand {
  metricId: string;
  /** Human-readable label */
  label: string;
  /** Minimum acceptable value (inclusive) */
  min: number;
  /** Maximum acceptable value (inclusive) */
  max: number;
  /** Value below which severity becomes 'warning' (must be >= min) */
  warnBelow?: number;
  /** Value above which severity becomes 'warning' (must be <= max) */
  warnAbove?: number;
  /** Optional scope qualifier: e.g., threat band or run segment */
  scope?: string;
  /** Whether lower values are better (e.g., crit failure rate, dissolution count) */
  lowerIsBetter?: boolean;
}

// ─── Balance Targets ─────────────────────────────────────────────

export interface BalanceTargets {
  version: string;
  description: string;
  bands: BalanceMetricBand[];
}

// ─── Run Summary ──────────────────────────────────────────────────

export interface BalanceRunSummary {
  seed?: number;
  startTick: number;
  endTick: number;
  totalTicks: number;
  targetVersion: string;
  mapSize?: string;

  totals: {
    actionsAttempted: number;
    stepsAttempted: number;
    encountersAttempted: number;
    encountersCompleted: number;
    encountersAbandoned: number;
    rewardsGranted: number;
    rewardsMissed: number;
    growthBeatsApplied: number;
    dissolutions: number;
  };

  /** Step success rate per threat band: attempts + successes + computed rate */
  stepSuccessRates: Partial<Record<BalanceThreatBand, { attempts: number; successes: number; rate: number }>>;
  /** Encounter completion rate per threat band */
  completionRates: Partial<Record<BalanceThreatBand, { attempts: number; completions: number; rate: number }>>;
  /**
   * Fraction of failures that still produced a meaningful state change.
   * Currently tracked as the fraction of encounters that completed (as a proxy
   * until explicit fail-forward flags are added in phase 2).
   */
  failForwardShare: number;
  critFailShareByBand: Partial<Record<BalanceThreatBand, number>>;

  quintessence: {
    totalDeltaFromEvents: number;
    averageLossPerEncounter: number;
    dissolutions: number;
  };

  rewards: {
    byCategory: Record<string, number>;
    durable: number;
    consumable: number;
    badOutcomes: number;
  };

  pacing: {
    firstRewardTick: number | null;
    firstSetbackTick: number | null;
    firstGrowthBeatTick: number | null;
  };
}

// ─── Agent Journey Summary ────────────────────────────────────────

export interface BalanceAgentJourneySummary {
  agentId: string;
  agentName?: string;
  firstSeenTick: number | null;
  firstEncounterTick: number | null;
  firstRewardTick: number | null;
  firstMajorSetbackTick: number | null;
  firstGrowthBeatTick: number | null;

  totalActions: number;
  totalEncounters: number;
  totalRewards: number;
  totalSetbacks: number;
  longestSetbackStreak: number;
  durableAttachments: number;

  stepSuccessRate: number;
  encounterCompletionRate: number;
}

// ─── Cohort Summary ───────────────────────────────────────────────

export interface BalanceCohortSummary {
  runCount: number;
  seeds: number[];
  /** Aggregated metrics across all runs */
  aggregated: BalanceRunSummary;
  perRunSummaries: BalanceRunSummary[];
}

// ─── Evaluation Finding ───────────────────────────────────────────

export interface BalanceEvaluationFinding {
  metricId: string;
  scope?: string;
  label: string;
  actual: number | null;
  expected: { min: number; max: number; warnBelow?: number; warnAbove?: number };
  delta?: number;
  severity: BalanceMetricSeverity;
  note: string;
}

// ─── Evaluation Result ────────────────────────────────────────────

export interface BalanceEvaluationResult {
  overall: BalanceMetricSeverity;
  targetVersion: string;
  findings: BalanceEvaluationFinding[];
  /** Count per severity */
  counts: Record<BalanceMetricSeverity, number>;
  evaluatedAt: number;
}

// ─── Eval Profile ─────────────────────────────────────────────────

export interface BalanceEvalProfile {
  name: 'smoke' | 'cadence' | 'journey';
  description: string;
  seeds: number[];
  ticksPerRun: number;
  /** Whether to track a hero agent journey */
  trackAgent: boolean;
}
