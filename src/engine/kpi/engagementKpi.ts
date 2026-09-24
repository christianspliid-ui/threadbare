/**
 * Engagement KPIs — the forecast-window gauge (THR-1578, plan
 * `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Slice S1).
 *
 * Measures, without changing behaviour, what the forecast-window design is
 * calibrated and guarded against:
 *
 * - **Per-proficiency-band success** and **mean attempted difficulty** — the
 *   level-success invariant (success level across bands, attempted difficulty
 *   rising with proficiency).
 * - **In-window share** — how many of a mortal's own choices it made at a
 *   forecast inside `[ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH]`.
 * - **Idle rate** — the share of agent decisions that reached the board and
 *   ended on the idle path (drift / trivial local / stay).
 * - **The two historical traps** (Christian, 2026-09-24): `retry_after_failure_rate`
 *   (retry loops) and `max_failure_streak` p95 (the stuck spiral), plus
 *   `attempted_difficulty_trend` (progression).
 *
 * Proficiency and forecast are stamped at **commit** into a runtime-side map
 * keyed by action id (`stampEngagementCommit`), so `UnifiedAction` gains no
 * field. The resolution-time hook (`recordEngagementResolution`) reads the stamp,
 * deletes it, and folds the outcome into lifetime band totals and a bounded log.
 * The band names are KPI-internal bucket labels — never rendered to a player and
 * not the Domain Capability tier words.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * | Failure                                   | Behaviour                                   |
 * |-------------------------------------------|---------------------------------------------|
 * | Stamp missing at resolution               | Counted in band `unknown`; excluded from the invariant and the log |
 * | Capability / difficulty NaN at commit     | Stamp skipped (the action resolves as `unknown`) |
 * | Log exceeds `ENGAGEMENT_LOG_MAX`          | Oldest entries dropped; band totals stay lifetime |
 * | Band with < `KPI_BAND_MIN_ENGAGEMENTS`    | Reported as a coverage gap, never asserted |
 * | No mortal with enough engagements (trend) | Trend reads `null` |
 *
 * Pure arithmetic, no PRNG (NFP #3).
 */

import {
  PROFICIENCY_BAND_EDGES,
  RETRY_WINDOW_TICKS,
  KPI_TREND_MIN_ENGAGEMENTS,
  KPI_BAND_MIN_ENGAGEMENTS,
  ENGAGEMENT_LOG_MAX,
} from './kpiConstants';
import { ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH } from '../../data/agent-behavior-constants';
import { SCALE_DIFFICULTY_OFFSETS } from '../resolutionScaleAdjust';
import type { ActionScale } from '../../types/unifiedAction';

// ─── Types ────────────────────────────────────────────────────────

/** KPI-internal proficiency bucket (never player-facing). */
export type ProficiencyBand = 'novice' | 'journeyman' | 'expert' | 'master';
/** A band plus the bucket for resolutions that carried no commit stamp. */
export type EngagementBandKey = ProficiencyBand | 'unknown';

export const PROFICIENCY_BANDS: readonly ProficiencyBand[] = ['novice', 'journeyman', 'expert', 'master'];

/** What the decision phase knew when a mortal committed to an engagement. */
export interface EngagementStamp {
  agentId: string;
  templateId: string;
  committedTick: number;
  /** The mortal's `computeCapability` on the template's primary reach at commit. */
  proficiency: number;
  band: ProficiencyBand;
  /** Mean authored step difficulty after the scale offset — the proficiency the steps demand. */
  attemptedDifficulty: number;
  /** The planner's forecast at commit (today: `completionProb`; S2 replaces it with `F`). */
  forecast: number;
  /** False when something other than the mortal's own choice picked the template (a god's compulsion). */
  freeChoice: boolean;
}

/** One resolved, stamped engagement. */
export interface EngagementLogEntry {
  agentId: string;
  templateId: string;
  committedTick: number;
  resolvedTick: number;
  band: ProficiencyBand;
  attemptedDifficulty: number;
  forecast: number;
  freeChoice: boolean;
  /** Final outcome in the success family (critical_success · success · success_at_cost). */
  success: boolean;
}

export interface EngagementBandTotals {
  engagements: number;
  successes: number;
  /** Sum of attempted difficulty; mean = difficultySum / engagements. */
  difficultySum: number;
}

/** Lifetime engagement ledger — owned by `SimulationRuntime`, one per session. */
export interface EngagementLedger {
  /** Commit stamps awaiting resolution, keyed by `UnifiedAction.actionId`. */
  stamps: Map<string, EngagementStamp>;
  /** Lifetime per-band totals over *free-choice* stamped engagements, plus `unknown`. */
  bandTotals: Record<EngagementBandKey, EngagementBandTotals>;
  /** Bounded chronological log of resolved stamped engagements (all, incl. non-free-choice). */
  log: EngagementLogEntry[];
  /** Free-choice commits whose forecast sat inside the window / all free-choice commits. */
  inWindowCommits: number;
  freeChoiceCommits: number;
  /** Agent decisions that reached the board / of those, how many took the idle path. */
  boardDecisions: number;
  idleDecisions: number;
}

export interface EngagementBandReport {
  band: EngagementBandKey;
  engagements: number;
  successRate: number;
  meanAttemptedDifficulty: number;
  /** False when `engagements < KPI_BAND_MIN_ENGAGEMENTS` — reported as a coverage gap. */
  covered: boolean;
}

export interface EngagementKpiReport {
  bands: EngagementBandReport[];
  /** Share of free-choice commits whose forecast sat inside the engagement window. */
  inWindowShare: number;
  freeChoiceCommits: number;
  /** Share of board-reaching decisions that ended on the idle path. */
  idleRate: number;
  boardDecisions: number;
  /** Share of failed free-choice engagements followed by the same mortal re-engaging the same template within `RETRY_WINDOW_TICKS`. */
  retryAfterFailureRate: number;
  failedFreeChoice: number;
  /** p95 over mortals of each mortal's longest run of consecutive failed free-choice engagements. */
  maxFailureStreakP95: number;
  /** Median per-mortal OLS slope of attempted difficulty over commit tick; null with no qualifying mortal. */
  attemptedDifficultyTrend: number | null;
  trendMortals: number;
}

// ─── Construction ─────────────────────────────────────────────────

function emptyTotals(): EngagementBandTotals {
  return { engagements: 0, successes: 0, difficultySum: 0 };
}

export function createEngagementLedger(): EngagementLedger {
  return {
    stamps: new Map(),
    bandTotals: {
      novice: emptyTotals(),
      journeyman: emptyTotals(),
      expert: emptyTotals(),
      master: emptyTotals(),
      unknown: emptyTotals(),
    },
    log: [],
    inWindowCommits: 0,
    freeChoiceCommits: 0,
    boardDecisions: 0,
    idleDecisions: 0,
  };
}

// ─── Classification ───────────────────────────────────────────────

/** Bucket a 0–1 capability by `PROFICIENCY_BAND_EDGES` (novice < 0.35 ≤ journeyman < 0.65 ≤ expert < 0.85 ≤ master). */
export function proficiencyBandFor(capability: number): ProficiencyBand {
  const [a, b, c] = PROFICIENCY_BAND_EDGES;
  if (capability < a) return 'novice';
  if (capability < b) return 'journeyman';
  if (capability < c) return 'expert';
  return 'master';
}

/**
 * The proficiency a template's steps demand: the mean authored step difficulty plus
 * the scale offset the roll applies. Branch nodes (no `difficulty`) are skipped; a
 * template with no rollable step reads NaN, which the stamp treats as "skip".
 */
export function demandedDifficultyOf(
  steps: ReadonlyArray<object>,
  scale: ActionScale | undefined,
): number {
  const difficulties: number[] = [];
  for (const st of steps) {
    const d = (st as { difficulty?: unknown }).difficulty;
    if (typeof d === 'number' && Number.isFinite(d)) difficulties.push(d);
  }
  if (difficulties.length === 0) return NaN;
  const offset = SCALE_DIFFICULTY_OFFSETS[scale ?? 'regional'] ?? 0;
  return difficulties.reduce((s, d) => s + d, 0) / difficulties.length + offset;
}

export function isInEngagementWindow(forecast: number): boolean {
  return forecast >= ENGAGE_WINDOW_LOW && forecast <= ENGAGE_WINDOW_HIGH;
}

const SUCCESS_FAMILY = new Set(['critical_success', 'success', 'success_at_cost']);

export function isSuccessFamily(outcome: string | undefined): boolean {
  return outcome !== undefined && SUCCESS_FAMILY.has(outcome);
}

// ─── Recording ────────────────────────────────────────────────────

/** Stamp a commit. Skips (fail-soft) when proficiency or difficulty is not a finite number. */
export function stampEngagementCommit(
  ledger: EngagementLedger,
  actionId: string,
  stamp: Omit<EngagementStamp, 'band'>,
): void {
  if (!Number.isFinite(stamp.proficiency) || !Number.isFinite(stamp.attemptedDifficulty)) return;
  const forecast = Number.isFinite(stamp.forecast) ? Math.max(0, Math.min(1, stamp.forecast)) : NaN;
  const full: EngagementStamp = { ...stamp, forecast, band: proficiencyBandFor(stamp.proficiency) };
  ledger.stamps.set(actionId, full);
  if (full.freeChoice) {
    ledger.freeChoiceCommits++;
    if (Number.isFinite(forecast) && isInEngagementWindow(forecast)) ledger.inWindowCommits++;
  }
}

/** Count one agent decision that reached the board (the idle rate's denominator). */
export function recordBoardDecision(ledger: EngagementLedger): void {
  ledger.boardDecisions++;
}

/** Count one of those decisions that ended on the idle path (drift / trivial local / stay). */
export function recordIdleDecision(ledger: EngagementLedger): void {
  ledger.idleDecisions++;
}

/** Fold a newly-resolved action in. Call once per action at the newly-resolved transition. */
export function recordEngagementResolution(
  ledger: EngagementLedger,
  actionId: string,
  outcome: string | undefined,
  resolvedTick: number,
): void {
  const stamp = ledger.stamps.get(actionId);
  const success = isSuccessFamily(outcome);
  if (!stamp) {
    const t = ledger.bandTotals.unknown;
    t.engagements++;
    if (success) t.successes++;
    return;
  }
  ledger.stamps.delete(actionId);
  if (stamp.freeChoice) {
    const t = ledger.bandTotals[stamp.band];
    t.engagements++;
    if (success) t.successes++;
    t.difficultySum += stamp.attemptedDifficulty;
  }
  ledger.log.push({
    agentId: stamp.agentId,
    templateId: stamp.templateId,
    committedTick: stamp.committedTick,
    resolvedTick,
    band: stamp.band,
    attemptedDifficulty: stamp.attemptedDifficulty,
    forecast: stamp.forecast,
    freeChoice: stamp.freeChoice,
    success,
  });
  if (ledger.log.length > ENGAGEMENT_LOG_MAX) {
    ledger.log.splice(0, ledger.log.length - ENGAGEMENT_LOG_MAX);
  }
}

// ─── Reporting ────────────────────────────────────────────────────

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

function olsSlope(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den > 0 ? num / den : 0;
}

/** Retry share: a failed free-choice engagement followed by the same mortal committing the same template within the window. */
export function computeRetryAfterFailureRate(log: readonly EngagementLogEntry[]): { rate: number; failed: number } {
  const byAgentTemplate = new Map<string, number[]>();
  for (const e of log) {
    const k = `${e.agentId}|${e.templateId}`;
    const list = byAgentTemplate.get(k);
    if (list) list.push(e.committedTick);
    else byAgentTemplate.set(k, [e.committedTick]);
  }
  let failed = 0;
  let retried = 0;
  for (const e of log) {
    if (!e.freeChoice || e.success) continue;
    failed++;
    const commits = byAgentTemplate.get(`${e.agentId}|${e.templateId}`) ?? [];
    if (commits.some(t => t > e.committedTick && t >= e.resolvedTick && t <= e.resolvedTick + RETRY_WINDOW_TICKS)) {
      retried++;
    }
  }
  return { rate: failed > 0 ? retried / failed : 0, failed };
}

/** p95 over mortals of the longest run of consecutive failed free-choice engagements. */
export function computeMaxFailureStreakP95(log: readonly EngagementLogEntry[]): number {
  const byAgent = new Map<string, EngagementLogEntry[]>();
  for (const e of log) {
    if (!e.freeChoice) continue;
    const list = byAgent.get(e.agentId);
    if (list) list.push(e);
    else byAgent.set(e.agentId, [e]);
  }
  const maxima: number[] = [];
  for (const entries of byAgent.values()) {
    const ordered = [...entries].sort((a, b) => a.resolvedTick - b.resolvedTick || a.committedTick - b.committedTick);
    let run = 0;
    let max = 0;
    for (const e of ordered) {
      run = e.success ? 0 : run + 1;
      if (run > max) max = run;
    }
    maxima.push(max);
  }
  maxima.sort((a, b) => a - b);
  return quantile(maxima, 0.95);
}

/** Median per-mortal slope of attempted difficulty over commit tick (mortals with ≥ `KPI_TREND_MIN_ENGAGEMENTS`). */
export function computeAttemptedDifficultyTrend(log: readonly EngagementLogEntry[]): { trend: number | null; mortals: number } {
  const byAgent = new Map<string, EngagementLogEntry[]>();
  for (const e of log) {
    if (!e.freeChoice) continue;
    const list = byAgent.get(e.agentId);
    if (list) list.push(e);
    else byAgent.set(e.agentId, [e]);
  }
  const slopes: number[] = [];
  for (const entries of byAgent.values()) {
    if (entries.length < KPI_TREND_MIN_ENGAGEMENTS) continue;
    slopes.push(olsSlope(entries.map(e => e.committedTick), entries.map(e => e.attemptedDifficulty)));
  }
  if (slopes.length === 0) return { trend: null, mortals: 0 };
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  const median = slopes.length % 2 === 1 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
  return { trend: median, mortals: slopes.length };
}

export function computeEngagementKpiReport(ledger: EngagementLedger): EngagementKpiReport {
  const keys: EngagementBandKey[] = [...PROFICIENCY_BANDS, 'unknown'];
  const bands: EngagementBandReport[] = keys.map(band => {
    const t = ledger.bandTotals[band];
    return {
      band,
      engagements: t.engagements,
      successRate: t.engagements > 0 ? t.successes / t.engagements : 0,
      meanAttemptedDifficulty: t.engagements > 0 ? t.difficultySum / t.engagements : 0,
      covered: band !== 'unknown' && t.engagements >= KPI_BAND_MIN_ENGAGEMENTS,
    };
  });
  const retry = computeRetryAfterFailureRate(ledger.log);
  const trend = computeAttemptedDifficultyTrend(ledger.log);
  return {
    bands,
    inWindowShare: ledger.freeChoiceCommits > 0 ? ledger.inWindowCommits / ledger.freeChoiceCommits : 0,
    freeChoiceCommits: ledger.freeChoiceCommits,
    idleRate: ledger.boardDecisions > 0 ? ledger.idleDecisions / ledger.boardDecisions : 0,
    boardDecisions: ledger.boardDecisions,
    retryAfterFailureRate: retry.rate,
    failedFreeChoice: retry.failed,
    maxFailureStreakP95: computeMaxFailureStreakP95(ledger.log),
    attemptedDifficultyTrend: trend.trend,
    trendMortals: trend.mortals,
  };
}
