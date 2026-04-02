/**
 * Balance Evaluator — compares a BalanceRunSummary against BalanceTargets
 * and produces a structured BalanceEvaluationResult.
 *
 * Pure functions — no side effects, no imports from SimulationRuntime.
 *
 * Phase 1: 2026-04-02-phase1-balance-eval-foundation-plan.md
 */

import type {
  BalanceRunSummary,
  BalanceAgentJourneySummary,
  BalanceTargets,
  BalanceMetricBand,
  BalanceMetricSeverity,
  BalanceEvaluationResult,
  BalanceEvaluationFinding,
  BalanceThreatBand,
} from '../types/balanceEval';

// ─── Severity helpers ─────────────────────────────────────────────

/**
 * Classify a single measured value against a target band.
 * Band semantics:
 *   - fail if actual < min OR actual > max
 *   - warning if in [min, warnBelow) OR (warnAbove, max]
 *   - pass if in [warnBelow, warnAbove] (or [min, max] if no warn thresholds)
 */
function classifySeverity(actual: number, band: BalanceMetricBand): BalanceMetricSeverity {
  if (actual < band.min || actual > band.max) return 'fail';
  const below = band.warnBelow ?? band.min;
  const above = band.warnAbove ?? band.max;
  if (actual < below || actual > above) return 'warning';
  return 'pass';
}

function buildFinding(
  band: BalanceMetricBand,
  actual: number | null,
): BalanceEvaluationFinding {
  const severity: BalanceMetricSeverity =
    actual === null ? 'warning' : classifySeverity(actual, band);

  let note = '';
  if (actual === null) {
    note = 'No data available for this metric.';
  } else if (severity === 'fail') {
    if (actual < band.min) note = `Below minimum (${fmt(actual)} < ${fmt(band.min)})`;
    else note = `Above maximum (${fmt(actual)} > ${fmt(band.max)})`;
  } else if (severity === 'warning') {
    if (band.warnBelow !== undefined && actual < band.warnBelow) {
      note = `Below ideal zone (${fmt(actual)} < ${fmt(band.warnBelow)}, min=${fmt(band.min)})`;
    } else if (band.warnAbove !== undefined && actual > band.warnAbove) {
      note = `Above ideal zone (${fmt(actual)} > ${fmt(band.warnAbove)}, max=${fmt(band.max)})`;
    } else {
      note = `In warning zone`;
    }
  } else {
    note = `In target zone (${fmt(actual)})`;
  }

  return {
    metricId: band.metricId,
    scope: band.scope,
    label: band.label,
    actual,
    expected: {
      min: band.min,
      max: band.max,
      warnBelow: band.warnBelow,
      warnAbove: band.warnAbove,
    },
    delta: actual !== null ? actual - ((band.warnBelow ?? band.min) + (band.warnAbove ?? band.max)) / 2 : undefined,
    severity,
    note,
  };
}

function fmt(n: number): string {
  // Display as percentage if 0-1 range, otherwise as integer
  if (n >= 0 && n <= 1 && Math.floor(n) !== n) return `${(n * 100).toFixed(1)}%`;
  return n.toFixed(0);
}

function worstSeverity(a: BalanceMetricSeverity, b: BalanceMetricSeverity): BalanceMetricSeverity {
  if (a === 'fail' || b === 'fail') return 'fail';
  if (a === 'warning' || b === 'warning') return 'warning';
  return 'pass';
}

// ─── Main evaluator ───────────────────────────────────────────────

/**
 * Evaluate a BalanceRunSummary against a set of target bands.
 * Returns a BalanceEvaluationResult with per-metric findings.
 *
 * Metrics without enough data produce severity='warning' findings (not 'fail').
 */
export function evaluateBalanceSummary(
  summary: BalanceRunSummary,
  targets: BalanceTargets,
): BalanceEvaluationResult {
  const findings: BalanceEvaluationFinding[] = [];

  for (const band of targets.bands) {
    const actual = extractMetric(summary, band.metricId, band.scope);
    findings.push(buildFinding(band, actual));
  }

  const counts: Record<BalanceMetricSeverity, number> = { pass: 0, warning: 0, fail: 0 };
  let overall: BalanceMetricSeverity = 'pass';
  for (const f of findings) {
    counts[f.severity]++;
    overall = worstSeverity(overall, f.severity);
  }

  return {
    overall,
    targetVersion: targets.version,
    findings,
    counts,
    evaluatedAt: Date.now(),
  };
}

/**
 * Extract a named metric from a run summary.
 * Returns null if the data is missing or insufficient (< 5 attempts for rate metrics).
 */
function extractMetric(
  summary: BalanceRunSummary,
  metricId: string,
  scope?: string,
): number | null {
  switch (metricId) {
    case 'step_success_rate': {
      if (!scope) return null;
      const band = summary.stepSuccessRates[scope as BalanceThreatBand];
      if (!band || band.attempts < 5) return null;
      return band.rate;
    }
    case 'completion_rate': {
      if (!scope) return null;
      const band = summary.completionRates[scope as BalanceThreatBand];
      if (!band || band.attempts < 5) return null;
      return band.rate;
    }
    case 'fail_forward_share':
      return summary.totals.encountersAttempted >= 5 ? summary.failForwardShare : null;
    case 'crit_failure_share': {
      if (!scope) return null;
      const val = summary.critFailShareByBand[scope as BalanceThreatBand];
      return val !== undefined ? val : null;
    }
    case 'quintessence_loss_per_encounter': {
      if (!scope) return null;
      // We don't have per-band quintessence loss in phase 1 — return null
      // Phase 2 will add this breakdown. Returning null produces a warning, not a fail.
      return null;
    }
    case 'quintessence_recovery_per_100_ticks': {
      // Approximate: positive quintessence delta / totalTicks * 100
      if (summary.totalTicks < 10) return null;
      return (summary.quintessence.totalDeltaFromEvents > 0
        ? summary.quintessence.totalDeltaFromEvents
        : 0) / summary.totalTicks * 100;
    }
    case 'durable_rewards_per_100_encounters': {
      if (summary.totals.encountersAttempted < 5) return null;
      return (summary.rewards.durable / summary.totals.encountersAttempted) * 100;
    }
    case 'consumable_rewards_per_100_encounters': {
      if (summary.totals.encountersAttempted < 5) return null;
      return (summary.rewards.consumable / summary.totals.encountersAttempted) * 100;
    }
    case 'conditions_per_100_encounters': {
      // Conditions not yet tracked separately in phase 1 — produce warning
      return null;
    }
    case 'time_to_first_reward':
      return summary.pacing.firstRewardTick !== null
        ? summary.pacing.firstRewardTick - summary.startTick
        : null;
    case 'time_to_first_setback':
      return summary.pacing.firstSetbackTick !== null
        ? summary.pacing.firstSetbackTick - summary.startTick
        : null;
    case 'time_to_first_growth_beat':
      return summary.pacing.firstGrowthBeatTick !== null
        ? summary.pacing.firstGrowthBeatTick - summary.startTick
        : null;
    default:
      return null;
  }
}

// ─── Agent journey evaluator ──────────────────────────────────────

/**
 * Lightweight evaluation of an agent journey.
 * Returns a summary string array suitable for CLI display.
 * Not currently tied to formal target bands — used for qualitative inspection.
 */
export function evaluateAgentJourney(journey: BalanceAgentJourneySummary): string[] {
  const lines: string[] = [];
  const name = journey.agentName ?? journey.agentId;

  lines.push(`Agent: ${name}`);
  lines.push(`  Encounters: ${journey.totalEncounters} attempted, completion rate: ${pct(journey.encounterCompletionRate)}`);
  lines.push(`  Steps: success rate ${pct(journey.stepSuccessRate)}`);
  lines.push(`  Rewards: ${journey.totalRewards} granted`);
  lines.push(`  Setbacks: ${journey.totalSetbacks} (longest streak: ${journey.longestSetbackStreak} failures)`);

  if (journey.firstRewardTick !== null) {
    lines.push(`  First reward at tick ${journey.firstRewardTick}`);
  } else {
    lines.push(`  No rewards received`);
  }
  if (journey.firstGrowthBeatTick !== null) {
    lines.push(`  First growth beat at tick ${journey.firstGrowthBeatTick}`);
  }
  if (journey.firstMajorSetbackTick !== null) {
    lines.push(`  First major setback at tick ${journey.firstMajorSetbackTick}`);
  }

  return lines;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

// ─── Text report ──────────────────────────────────────────────────

/**
 * Format an evaluation result as a human-readable text report.
 * Suitable for CLI output and baseline capture files.
 */
export function formatEvaluationReport(
  result: BalanceEvaluationResult,
  summary: BalanceRunSummary,
): string {
  const lines: string[] = [];
  const dateStr = new Date(result.evaluatedAt).toISOString();

  lines.push(`# Balance Evaluation Report`);
  lines.push(`Evaluated: ${dateStr}`);
  lines.push(`Target version: ${result.targetVersion}`);
  lines.push(`Run: seed=${summary.seed ?? 'n/a'}, ticks=${summary.totalTicks}, map=${summary.mapSize ?? 'n/a'}`);
  lines.push('');
  lines.push(`Overall: ${result.overall.toUpperCase()} (${result.counts.pass} pass, ${result.counts.warning} warning, ${result.counts.fail} fail)`);
  lines.push('');
  lines.push(`## Findings`);
  lines.push('');

  // Group by severity: fail first, then warning, then pass
  const fails = result.findings.filter(f => f.severity === 'fail');
  const warnings = result.findings.filter(f => f.severity === 'warning');
  const passes = result.findings.filter(f => f.severity === 'pass');

  for (const group of [fails, warnings, passes]) {
    for (const f of group) {
      const scope = f.scope ? ` [${f.scope}]` : '';
      const actual = f.actual !== null ? fmtVal(f.actual) : 'no data';
      lines.push(`[${f.severity.toUpperCase().padEnd(7)}] ${f.label}${scope}: ${actual} — ${f.note}`);
    }
  }

  lines.push('');
  lines.push(`## Run Totals`);
  lines.push(`  Actions attempted:    ${summary.totals.actionsAttempted}`);
  lines.push(`  Steps attempted:      ${summary.totals.stepsAttempted}`);
  lines.push(`  Encounters attempted: ${summary.totals.encountersAttempted}`);
  lines.push(`  Encounters completed: ${summary.totals.encountersCompleted}`);
  lines.push(`  Rewards granted:      ${summary.totals.rewardsGranted}`);
  lines.push(`  Rewards missed:       ${summary.totals.rewardsMissed}`);
  lines.push(`  Growth beats:         ${summary.totals.growthBeatsApplied}`);
  lines.push(`  Dissolutions:         ${summary.totals.dissolutions}`);

  return lines.join('\n');
}

function fmtVal(n: number): string {
  if (n >= 0 && n <= 1 && Math.floor(n) !== n) return `${(n * 100).toFixed(1)}%`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3);
}
