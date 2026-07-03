/**
 * Gameplay KPI Harness (THR-457).
 *
 * Pure computation over GameState + optional funnel counters.
 * No PRNG, no mutations. Same seed + same tick = identical report.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * | Failure                          | Behaviour                           |
 * |----------------------------------|-------------------------------------|
 * | unifiedActions empty/missing     | Zeroed sections + insufficientData  |
 * | Template registry lookup miss    | Bucket as 'unknown' category        |
 * | Funnel unavailable               | Report omits funnel (funnelAvailable=false) |
 * | Any section throws               | Return zeroed section, continue     |
 */

import type { GameState } from '../../types/gameState';
import { getAnyEncounterById } from '../../data/encounter-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  KPI_FAILURE_RATE_MAX,
  KPI_CRITFAIL_RATE_MAX,
  KPI_CLEAN_SUCCESS_MIN,
  KPI_TEMPLATE_TOP_SHARE_MAX,
  KPI_TEMPLATE_ENTROPY_MIN,
  KPI_BRANCHING_FIRE_MIN_PER_30T,
  KPI_THREADED_BEAT_MIN_PER_10T,
  KPI_AMBER_BAND,
  KPI_FUNNEL_MAX_TEMPLATES,
  KPI_TOTAL_SUCCESS_MIN,
  KPI_TOTAL_SUCCESS_MAX,
  KPI_AT_COST_SHARE_MIN,
  KPI_AT_COST_SHARE_MAX,
  KPI_CRIT_TAIL_MIN,
  KPI_FAILURE_STORY_MIN,
} from './kpiConstants';

// ─── Types ────────────────────────────────────────────────────────

/** Per-template funnel counters accumulated by the filter pipeline and scoring hooks. */
export interface EligibilityFunnelCounters {
  byTemplate: Record<string, {
    considered: number;
    /** First failing gate per evaluation — e.g. { awareness: 12, threat: 3 } */
    gatedBy: Record<string, number>;
    scored: number;
    selected: number;
  }>;
  sinceTick: number;
  /** Set to true when byTemplate exceeds KPI_FUNNEL_MAX_TEMPLATES */
  truncated: boolean;
}

export interface OutcomeDistribution {
  total: number;
  byOutcome: Record<string, number>;
  failureRate: number;
  critFailRate: number;
  cleanSuccessRate: number;
  // ─── THR-571: outcome-ladder rows ───
  /** success + success_at_cost + critical_success, over total. The verdict's headline metric. */
  totalSuccessRate: number;
  /** success_at_cost / total — the texture band. */
  atCostShare: number;
  /** critical_success / total — the top tail (must fire). */
  critSuccessRate: number;
  /**
   * Share of failure/critical_failure outcomes that left ≥1 story artifact.
   * null when the C1 counters are absent (old runs / pre-C1 builds) — the threshold
   * is then skipped rather than falsely reddened (fail-soft, plan §Fail-soft table).
   */
  failureStoryRate: number | null;
  /** True when total resolved < 10 — stats unreliable */
  insufficientData: boolean;
}

export interface TemplateEntry {
  templateId: string;
  count: number;
  share: number;
}

export interface TemplateConcentration {
  totalSelections: number;
  byTemplate: TemplateEntry[];
  topShare: number;
  /** Normalized Shannon entropy — 0 = monoculture, 1 = perfectly uniform */
  entropy: number;
  insufficientData: boolean;
}

export interface BranchingFireStats {
  totalFires: number;
  /** Fires per 30-tick chunk */
  firesPerChunk: number;
  topBranchingTemplates: Array<{ templateId: string; count: number }>;
}

export interface ThreadedBeatStats {
  totalBeats: number;
  beatsPerChunk: number;
}

export interface FunnelTemplateRow {
  templateId: string;
  considered: number;
  selected: number;
  /** selected / considered */
  conversionRate: number;
  topGate: string | null;
}

export interface EligibilityFunnelSummary {
  available: boolean;
  sinceTick: number;
  topConsidered: FunnelTemplateRow[];
  /** Handcrafted branching templates with lowest conversion rates */
  mostGatedBranching: FunnelTemplateRow[];
  truncated: boolean;
}

export interface ResolutionGapStats {
  meanCapabilityMargin: number;
  stepCount: number;
  insufficientData: boolean;
}

export type KpiStatus = 'green' | 'amber' | 'red';

export interface KpiThresholdEvaluation {
  metric: string;
  label: string;
  value: number;
  threshold: number;
  direction: 'below_is_bad' | 'above_is_bad';
  status: KpiStatus;
}

export interface GameplayKpiReport {
  tick: number;
  seed: number;
  outcomes: OutcomeDistribution;
  templateConcentration: TemplateConcentration;
  branchingFire: BranchingFireStats;
  threadedBeats: ThreadedBeatStats;
  eligibilityFunnel: EligibilityFunnelSummary;
  resolutionGap: ResolutionGapStats;
  thresholds: KpiThresholdEvaluation[];
}

/** Minimal runtime view needed by the KPI report — avoids circular import with simulationRuntime.ts */
export interface KpiRuntimeView {
  eligibilityFunnel: EligibilityFunnelCounters | null;
  /** Cumulative branching-fire count for the session (THR-470). Survives unifiedActions pruning. */
  branchingFiresTotal?: number;
  /** Cumulative threaded-beat count for the session (THR-541). Survives unifiedActions pruning. */
  threadedBeatsTotal?: number;
  /**
   * THR-571 C1: cumulative count of resolved actions whose final outcome was
   * failure/critical_failure. Survives unifiedActions pruning — the honest denominator
   * for failure_story_rate over a full run. Absent on pre-C1 builds → rate is null.
   */
  failureOutcomesTotal?: number;
  /** THR-571 C1: cumulative count of those failures that left ≥1 story artifact. Numerator for failure_story_rate. */
  failureStoryArtifactsTotal?: number;
}

/** Create a fresh set of funnel counters for a new session. */
export function createEligibilityFunnelCounters(sinceTick = 0): EligibilityFunnelCounters {
  return { byTemplate: {}, sinceTick, truncated: false };
}

// ─── Helpers ──────────────────────────────────────────────────────

function normalizedEntropy(counts: number[]): number {
  const total = counts.reduce((s, c) => s + c, 0);
  if (total === 0) return 0;
  const k = counts.filter(c => c > 0).length;
  if (k <= 1) return 0;
  let entropy = 0;
  for (const c of counts) {
    if (c <= 0) continue;
    const p = c / total;
    entropy -= p * Math.log2(p);
  }
  return entropy / Math.log2(k);
}

function evalThreshold(
  metric: string,
  label: string,
  value: number,
  threshold: number,
  direction: 'below_is_bad' | 'above_is_bad',
): KpiThresholdEvaluation {
  let status: KpiStatus;
  const amber = threshold * KPI_AMBER_BAND;
  if (direction === 'below_is_bad') {
    if (value >= threshold) status = 'green';
    else if (value >= threshold - amber) status = 'amber';
    else status = 'red';
  } else {
    if (value <= threshold) status = 'green';
    else if (value <= threshold + amber) status = 'amber';
    else status = 'red';
  }
  return { metric, label, value, threshold, direction, status };
}

// THR-577: These two template caches are intentionally left at module scope (unlike
// the detail-page / prose caches migrated to SimulationRuntime). Their value is a pure
// function of the compile-time template registry (getUnifiedTemplateById / getAnyEncounterById
// read immutable module constants): a given templateId always classifies identically
// regardless of session. There is therefore no cross-session bleed to prevent — the cache is
// provably static across sessions, so per-session ownership would add threading cost with zero
// correctness benefit. Keys are template ids (bounded by the static template count), so the
// cache cannot grow unboundedly either.
const BRANCHING_TEMPLATE_CACHE = new Map<string, boolean>();

export function isBranchingTemplate(templateId: string): boolean {
  const cached = BRANCHING_TEMPLATE_CACHE.get(templateId);
  if (cached !== undefined) return cached;
  // Use getUnifiedTemplateById: checks UNIFIED_ACTION_TEMPLATES (includes src/data/encounters/
  // branching templates) before falling back to getAnyEncounterById for legacy templates.
  const tmpl = getUnifiedTemplateById(templateId) ?? getAnyEncounterById(templateId);
  const result = tmpl ? tmpl.steps.some(s => 'branchOnStep' in s) : false;
  BRANCHING_TEMPLATE_CACHE.set(templateId, result);
  return result;
}

// THR-577: provably static across sessions — see the BRANCHING_TEMPLATE_CACHE note above.
const RICH_TEMPLATE_CACHE = new Map<string, boolean>();

/**
 * A resolved encounter counts as a "threaded beat" when its template is rich enough to
 * read as a story beat: multi-step (steps ≥ 3) or branching. Shared by buildThreadedBeats
 * (windowed fallback) and the orchestrator's cumulative counter so both classify identically.
 */
export function isRichTemplate(templateId: string): boolean {
  const cached = RICH_TEMPLATE_CACHE.get(templateId);
  if (cached !== undefined) return cached;
  const tmpl = getAnyEncounterById(templateId);
  const result = tmpl ? (tmpl.steps.length >= 3 || tmpl.steps.some(s => 'branchOnStep' in s)) : false;
  RICH_TEMPLATE_CACHE.set(templateId, result);
  return result;
}

// ─── Section builders ─────────────────────────────────────────────

function buildOutcomes(
  actions: readonly { resolved: boolean; outcome?: string }[],
  runtime?: KpiRuntimeView | null,
): OutcomeDistribution {
  const resolved = actions.filter(a => a.resolved);
  const total = resolved.length;
  const byOutcome: Record<string, number> = {};
  for (const a of resolved) {
    const o = a.outcome ?? 'unknown';
    byOutcome[o] = (byOutcome[o] ?? 0) + 1;
  }
  const failureCount = (byOutcome['failure'] ?? 0) + (byOutcome['critical_failure'] ?? 0);
  const critFailCount = byOutcome['critical_failure'] ?? 0;
  const cleanSuccessCount = byOutcome['success'] ?? 0;
  const atCostCount = byOutcome['success_at_cost'] ?? 0;
  const critSuccessCount = byOutcome['critical_success'] ?? 0;
  const totalSuccessCount = cleanSuccessCount + atCostCount + critSuccessCount;

  // THR-571: failure_story_rate uses cumulative runtime counters (survives pruning);
  // null when the C1 counters are absent so the threshold is skipped, not falsely red.
  const failureOutcomesTotal = runtime?.failureOutcomesTotal;
  const failureStoryArtifactsTotal = runtime?.failureStoryArtifactsTotal;
  const failureStoryRate =
    failureOutcomesTotal !== undefined && failureStoryArtifactsTotal !== undefined
      ? (failureOutcomesTotal > 0 ? failureStoryArtifactsTotal / failureOutcomesTotal : 1)
      : null;

  return {
    total,
    byOutcome,
    failureRate: total > 0 ? failureCount / total : 0,
    critFailRate: total > 0 ? critFailCount / total : 0,
    cleanSuccessRate: total > 0 ? cleanSuccessCount / total : 0,
    totalSuccessRate: total > 0 ? totalSuccessCount / total : 0,
    atCostShare: total > 0 ? atCostCount / total : 0,
    critSuccessRate: total > 0 ? critSuccessCount / total : 0,
    failureStoryRate,
    insufficientData: total < 10,
  };
}

function buildTemplateConcentration(
  actions: readonly { resolved: boolean; templateId: string }[],
  funnel: EligibilityFunnelCounters | null,
): TemplateConcentration {
  // Prefer funnel selected counts (longitudinal) over resolved-action counts (current snapshot)
  const countMap = new Map<string, number>();
  if (funnel && Object.keys(funnel.byTemplate).length > 0) {
    for (const [id, rec] of Object.entries(funnel.byTemplate)) {
      if (rec.selected > 0) countMap.set(id, rec.selected);
    }
  } else {
    for (const a of actions) {
      if (!a.resolved) continue;
      countMap.set(a.templateId, (countMap.get(a.templateId) ?? 0) + 1);
    }
  }

  const total = [...countMap.values()].reduce((s, c) => s + c, 0);
  const sorted: TemplateEntry[] = [...countMap.entries()]
    .map(([templateId, count]) => ({ templateId, count, share: total > 0 ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSelections: total,
    byTemplate: sorted,
    topShare: sorted[0]?.share ?? 0,
    entropy: normalizedEntropy([...countMap.values()]),
    insufficientData: total < 10,
  };
}

function buildBranchingFire(
  actions: readonly { resolved: boolean; templateId: string }[],
  tick: number,
  cumulativeFires?: number,
): BranchingFireStats {
  const fireCounts = new Map<string, number>();
  for (const a of actions) {
    if (!a.resolved) continue;
    if (isBranchingTemplate(a.templateId)) {
      fireCounts.set(a.templateId, (fireCounts.get(a.templateId) ?? 0) + 1);
    }
  }
  // THR-470: prefer the runtime's lifetime counter for the rate. `actions`
  // (state.unifiedActions) is pruned after RESOLVED_ACTION_RETENTION_TICKS, so counting
  // fires from it windows the numerator while `tick` is the full run length — the rate
  // then undercounts long runs (~9× at 180t with a 20t window). The cumulative counter
  // is incremented once per fire at the resolved transition, before pruning. Falls back
  // to the windowed count when no runtime is supplied (e.g. pure-state unit tests).
  const windowedFires = [...fireCounts.values()].reduce((s, c) => s + c, 0);
  const totalFires = cumulativeFires ?? windowedFires;
  const topBranchingTemplates = [...fireCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([templateId, count]) => ({ templateId, count }));
  return {
    totalFires,
    firesPerChunk: tick > 0 ? (totalFires / tick) * 30 : 0,
    topBranchingTemplates,
  };
}

function buildThreadedBeats(
  actions: readonly { resolved: boolean; templateId: string; actorId: string }[],
  tick: number,
  cumulativeBeats?: number,
): ThreadedBeatStats {
  // A "threaded beat" is a resolved rich encounter (multi-step or branching) — see isRichTemplate.
  const windowedBeats = actions.reduce(
    (n, a) => (a.resolved && isRichTemplate(a.templateId) ? n + 1 : n),
    0,
  );
  // THR-541: prefer the runtime's lifetime counter for the rate. `actions`
  // (state.unifiedActions) is pruned after RESOLVED_ACTION_RETENTION_TICKS, so counting
  // beats from it windows the numerator while `tick` is the full run length — the rate
  // then undercounts long runs (the same artifact THR-470 fixed for branching fires). The
  // cumulative counter is incremented once per beat at the resolved transition, before
  // pruning. Falls back to the windowed count when no runtime is supplied (pure-state unit tests).
  const total = cumulativeBeats ?? windowedBeats;
  return {
    totalBeats: total,
    beatsPerChunk: tick > 0 ? (total / tick) * 10 : 0,
  };
}

function buildFunnelSummary(funnel: EligibilityFunnelCounters | null): EligibilityFunnelSummary {
  if (!funnel) {
    return {
      available: false,
      sinceTick: 0,
      topConsidered: [],
      mostGatedBranching: [],
      truncated: false,
    };
  }

  const rows: FunnelTemplateRow[] = Object.entries(funnel.byTemplate)
    .map(([templateId, rec]) => {
      const topGateEntry = Object.entries(rec.gatedBy).sort((a, b) => b[1] - a[1])[0];
      return {
        templateId,
        considered: rec.considered,
        selected: rec.selected,
        conversionRate: rec.considered > 0 ? rec.selected / rec.considered : 0,
        topGate: topGateEntry ? topGateEntry[0] : null,
      };
    });

  const topConsidered = rows
    .sort((a, b) => b.considered - a.considered)
    .slice(0, 10);

  const mostGatedBranching = rows
    .filter(r => isBranchingTemplate(r.templateId))
    .sort((a, b) => a.conversionRate - b.conversionRate)
    .slice(0, 5);

  return {
    available: true,
    sinceTick: funnel.sinceTick,
    topConsidered,
    mostGatedBranching,
    truncated: funnel.truncated,
  };
}

function buildResolutionGap(
  actions: readonly { resolved: boolean; stepOutcomes: readonly string[] }[],
): ResolutionGapStats {
  // V1: count step outcomes as a proxy for resolution gap
  let stepCount = 0;
  let successCount = 0;
  for (const a of actions) {
    if (!a.resolved) continue;
    for (const so of a.stepOutcomes) {
      stepCount++;
      if (so === 'success' || so === 'critical_success' || so === 'success_at_cost') {
        successCount++;
      }
    }
  }
  return {
    meanCapabilityMargin: stepCount > 0 ? successCount / stepCount - 0.5 : 0,
    stepCount,
    insufficientData: stepCount < 10,
  };
}

function buildThresholds(
  outcomes: OutcomeDistribution,
  concentration: TemplateConcentration,
  branching: BranchingFireStats,
  threaded: ThreadedBeatStats,
): KpiThresholdEvaluation[] {
  const rows: KpiThresholdEvaluation[] = [
    evalThreshold('failure_rate', 'Failure Rate', outcomes.failureRate, KPI_FAILURE_RATE_MAX, 'above_is_bad'),
    evalThreshold('critfail_rate', 'Crit-Fail Rate (ceiling)', outcomes.critFailRate, KPI_CRITFAIL_RATE_MAX, 'above_is_bad'),
    evalThreshold('clean_success_rate', 'Clean Success Rate', outcomes.cleanSuccessRate, KPI_CLEAN_SUCCESS_MIN, 'below_is_bad'),
    // THR-571 outcome-ladder verdict rows. Bands are expressed as min/max pairs so the
    // existing single-threshold evaluator + debug UI render them with no schema change.
    evalThreshold('total_success_min', 'Total Success ≥', outcomes.totalSuccessRate, KPI_TOTAL_SUCCESS_MIN, 'below_is_bad'),
    evalThreshold('total_success_max', 'Total Success ≤', outcomes.totalSuccessRate, KPI_TOTAL_SUCCESS_MAX, 'above_is_bad'),
    evalThreshold('at_cost_min', 'At-Cost Share ≥', outcomes.atCostShare, KPI_AT_COST_SHARE_MIN, 'below_is_bad'),
    evalThreshold('at_cost_max', 'At-Cost Share ≤', outcomes.atCostShare, KPI_AT_COST_SHARE_MAX, 'above_is_bad'),
    evalThreshold('crit_success_rate', 'Crit-Success Tail', outcomes.critSuccessRate, KPI_CRIT_TAIL_MIN, 'below_is_bad'),
    evalThreshold('crit_failure_rate', 'Crit-Failure Tail', outcomes.critFailRate, KPI_CRIT_TAIL_MIN, 'below_is_bad'),
    evalThreshold('template_top_share', 'Top Template Share', concentration.topShare, KPI_TEMPLATE_TOP_SHARE_MAX, 'above_is_bad'),
    evalThreshold('template_entropy', 'Template Entropy', concentration.entropy, KPI_TEMPLATE_ENTROPY_MIN, 'below_is_bad'),
    evalThreshold('branching_fire_per_30t', 'Branching Fires/30t', branching.firesPerChunk, KPI_BRANCHING_FIRE_MIN_PER_30T, 'below_is_bad'),
    evalThreshold('threaded_beats_per_10t', 'Threaded Beats/10t', threaded.beatsPerChunk, KPI_THREADED_BEAT_MIN_PER_10T, 'below_is_bad'),
  ];
  // failure_story_rate is skipped (not falsely red) until the C1 counters exist.
  if (outcomes.failureStoryRate !== null) {
    rows.push(evalThreshold('failure_story_rate', 'Failure→Story Rate', outcomes.failureStoryRate, KPI_FAILURE_STORY_MIN, 'below_is_bad'));
  }
  return rows;
}

// ─── Main export ──────────────────────────────────────────────────

/**
 * Compute a GameplayKpiReport from the current game state and optional runtime counters.
 * Pure function — no mutations, no PRNG.
 */
export function computeGameplayKpiReport(
  state: GameState,
  runtime?: KpiRuntimeView | null,
): GameplayKpiReport {
  const actions = state.unifiedActions ?? [];
  const tick = state.tick ?? 0;
  const seed = state.seed ?? 0;

  const outcomes = buildOutcomes(actions, runtime);
  const funnel = runtime?.eligibilityFunnel ?? null;
  const concentration = buildTemplateConcentration(actions, funnel);
  const branchingFire = buildBranchingFire(actions, tick, runtime?.branchingFiresTotal);
  const threadedBeats = buildThreadedBeats(actions, tick, runtime?.threadedBeatsTotal);
  const eligibilityFunnel = buildFunnelSummary(funnel);
  const resolutionGap = buildResolutionGap(actions);
  const thresholds = buildThresholds(outcomes, concentration, branchingFire, threadedBeats);

  return {
    tick,
    seed,
    outcomes,
    templateConcentration: concentration,
    branchingFire,
    threadedBeats,
    eligibilityFunnel,
    resolutionGap,
    thresholds,
  };
}
