/**
 * THR-1578 — the forecast-window gauge's arithmetic.
 *
 * Fixture-driven: every KPI is fed a hand-built ledger whose right answer is
 * countable by eye, so a wrong definition (off-by-one streak, a retry counted
 * before the failure resolved, a trend that ignores the minimum) fails here
 * rather than as a quietly different baseline in the PR body.
 */
import { describe, it, expect } from 'vitest';
import {
  createEngagementLedger,
  proficiencyBandFor,
  stampEngagementCommit,
  recordEngagementResolution,
  recordBoardDecision,
  recordIdleDecision,
  computeEngagementKpiReport,
  computeRetryAfterFailureRate,
  computeMaxFailureStreakP95,
  computeAttemptedDifficultyTrend,
  demandedDifficultyOf,
  type EngagementLogEntry,
} from '../engagementKpi';
import {
  PROFICIENCY_BAND_EDGES,
  RETRY_WINDOW_TICKS,
  KPI_BAND_MIN_ENGAGEMENTS,
  KPI_TREND_MIN_ENGAGEMENTS,
  ENGAGEMENT_LOG_MAX,
} from '../kpiConstants';
import { ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH } from '../../../data/agent-behavior-constants';
import { SCALE_DIFFICULTY_OFFSETS } from '../../resolutionScaleAdjust';

function entry(over: Partial<EngagementLogEntry>): EngagementLogEntry {
  return {
    agentId: 'a', templateId: 't', committedTick: 0, resolvedTick: 1,
    band: 'journeyman', attemptedDifficulty: 0.3, forecast: 0.6, freeChoice: true, success: true,
    ...over,
  };
}

function commit(
  ledger: ReturnType<typeof createEngagementLedger>,
  id: string,
  over: Partial<Parameters<typeof stampEngagementCommit>[2]> = {},
): void {
  stampEngagementCommit(ledger, id, {
    agentId: 'a', templateId: 't', committedTick: 0, proficiency: 0.5,
    attemptedDifficulty: 0.3, forecast: 0.6, freeChoice: true, ...over,
  });
}

describe('proficiencyBandFor', () => {
  it('buckets on the band edges, lower edge inclusive', () => {
    const [a, b, c] = PROFICIENCY_BAND_EDGES;
    expect(proficiencyBandFor(0)).toBe('novice');
    expect(proficiencyBandFor(a - 1e-9)).toBe('novice');
    expect(proficiencyBandFor(a)).toBe('journeyman');
    expect(proficiencyBandFor(b)).toBe('expert');
    expect(proficiencyBandFor(c)).toBe('master');
    expect(proficiencyBandFor(1)).toBe('master');
  });
});

describe('the engagement ledger', () => {
  it('folds a stamped free-choice resolution into its band and deletes the stamp', () => {
    const ledger = createEngagementLedger();
    commit(ledger, 'x1', { proficiency: 0.9, attemptedDifficulty: 0.4 });
    recordEngagementResolution(ledger, 'x1', 'success_at_cost', 5);
    expect(ledger.stamps.size).toBe(0);
    expect(ledger.bandTotals.master).toEqual({ engagements: 1, successes: 1, difficultySum: 0.4 });
    expect(ledger.log).toHaveLength(1);
    expect(ledger.log[0]).toMatchObject({ band: 'master', resolvedTick: 5, success: true });
  });

  it('counts an unstamped resolution as band unknown and keeps it out of the log', () => {
    const ledger = createEngagementLedger();
    recordEngagementResolution(ledger, 'never-stamped', 'failure', 3);
    expect(ledger.bandTotals.unknown.engagements).toBe(1);
    expect(ledger.log).toHaveLength(0);
    const report = computeEngagementKpiReport(ledger);
    expect(report.bands.find(b => b.band === 'unknown')?.covered).toBe(false);
  });

  it('keeps a compelled engagement out of the band totals but in the log', () => {
    const ledger = createEngagementLedger();
    commit(ledger, 'c1', { freeChoice: false });
    recordEngagementResolution(ledger, 'c1', 'failure', 2);
    expect(ledger.bandTotals.journeyman.engagements).toBe(0);
    expect(ledger.log[0].freeChoice).toBe(false);
    expect(ledger.freeChoiceCommits).toBe(0);
  });

  it('skips a stamp whose proficiency is not a number (fail-soft → unknown)', () => {
    const ledger = createEngagementLedger();
    commit(ledger, 'n1', { proficiency: NaN });
    expect(ledger.stamps.size).toBe(0);
    recordEngagementResolution(ledger, 'n1', 'success', 1);
    expect(ledger.bandTotals.unknown.engagements).toBe(1);
  });

  it('counts in-window commits against the engagement window, inclusive', () => {
    const ledger = createEngagementLedger();
    commit(ledger, 'w1', { forecast: ENGAGE_WINDOW_LOW });
    commit(ledger, 'w2', { forecast: ENGAGE_WINDOW_HIGH });
    commit(ledger, 'w3', { forecast: 0.9 });
    commit(ledger, 'w4', { forecast: 0.2 });
    expect(computeEngagementKpiReport(ledger).inWindowShare).toBeCloseTo(0.5, 10);
  });

  it('reads the idle rate off the board decisions', () => {
    const ledger = createEngagementLedger();
    for (let i = 0; i < 4; i++) recordBoardDecision(ledger);
    recordIdleDecision(ledger);
    expect(computeEngagementKpiReport(ledger).idleRate).toBeCloseTo(0.25, 10);
  });

  it('marks a band covered only at KPI_BAND_MIN_ENGAGEMENTS', () => {
    const ledger = createEngagementLedger();
    for (let i = 0; i < KPI_BAND_MIN_ENGAGEMENTS - 1; i++) {
      commit(ledger, `b${i}`, { proficiency: 0.1 });
      recordEngagementResolution(ledger, `b${i}`, i % 2 === 0 ? 'success' : 'failure', i + 1);
    }
    expect(computeEngagementKpiReport(ledger).bands.find(b => b.band === 'novice')?.covered).toBe(false);
    commit(ledger, 'last', { proficiency: 0.1 });
    recordEngagementResolution(ledger, 'last', 'success', 99);
    const novice = computeEngagementKpiReport(ledger).bands.find(b => b.band === 'novice')!;
    expect(novice.covered).toBe(true);
    expect(novice.engagements).toBe(KPI_BAND_MIN_ENGAGEMENTS);
  });

  it('bounds the log at ENGAGEMENT_LOG_MAX while band totals stay lifetime', () => {
    const ledger = createEngagementLedger();
    const n = ENGAGEMENT_LOG_MAX + 5;
    for (let i = 0; i < n; i++) {
      commit(ledger, `l${i}`);
      recordEngagementResolution(ledger, `l${i}`, 'success', i);
    }
    expect(ledger.log).toHaveLength(ENGAGEMENT_LOG_MAX);
    expect(ledger.log[0].resolvedTick).toBe(5);
    expect(ledger.bandTotals.journeyman.engagements).toBe(n);
  });
});

describe('retry_after_failure_rate', () => {
  it('counts a re-commit to the same template inside the window after the failure resolved', () => {
    const log = [
      entry({ committedTick: 0, resolvedTick: 3, success: false }),
      entry({ committedTick: 3 + RETRY_WINDOW_TICKS, resolvedTick: 30, success: true }),
    ];
    expect(computeRetryAfterFailureRate(log)).toEqual({ rate: 1, failed: 1 });
  });

  it('does not count a re-commit outside the window, a different template, or another mortal', () => {
    const log = [
      entry({ committedTick: 0, resolvedTick: 3, success: false }),
      entry({ committedTick: 4 + RETRY_WINDOW_TICKS, resolvedTick: 40 }),
      entry({ templateId: 'other', committedTick: 5, resolvedTick: 6 }),
      entry({ agentId: 'b', committedTick: 5, resolvedTick: 6 }),
    ];
    expect(computeRetryAfterFailureRate(log)).toEqual({ rate: 0, failed: 1 });
  });

  it('ignores compelled failures', () => {
    const log = [
      entry({ committedTick: 0, resolvedTick: 3, success: false, freeChoice: false }),
      entry({ committedTick: 4, resolvedTick: 6 }),
    ];
    expect(computeRetryAfterFailureRate(log)).toEqual({ rate: 0, failed: 0 });
  });
});

describe('max_failure_streak p95', () => {
  it('is the longest consecutive-failure run per mortal, a success resetting it', () => {
    // a: F F S F F F S → 3 ; b: F → 1
    const outcomes = [false, false, true, false, false, false, true];
    const log = outcomes.map((success, i) => entry({ resolvedTick: i, success }));
    log.push(entry({ agentId: 'b', resolvedTick: 0, success: false }));
    expect(computeMaxFailureStreakP95(log)).toBe(3);
  });

  it('reads 0 for an empty log', () => {
    expect(computeMaxFailureStreakP95([])).toBe(0);
  });
});

describe('attempted_difficulty_trend', () => {
  it('is the median per-mortal slope over commit tick, counting only mortals with enough engagements', () => {
    const rising = Array.from({ length: KPI_TREND_MIN_ENGAGEMENTS }, (_, i) =>
      entry({ agentId: 'up', committedTick: i * 10, attemptedDifficulty: 0.1 + i * 0.01 }));
    const flat = Array.from({ length: KPI_TREND_MIN_ENGAGEMENTS }, (_, i) =>
      entry({ agentId: 'flat', committedTick: i * 10, attemptedDifficulty: 0.3 }));
    const falling = Array.from({ length: KPI_TREND_MIN_ENGAGEMENTS }, (_, i) =>
      entry({ agentId: 'down', committedTick: i * 10, attemptedDifficulty: 0.5 - i * 0.02 }));
    const tooFew = [entry({ agentId: 'short', committedTick: 0 }), entry({ agentId: 'short', committedTick: 50, attemptedDifficulty: 0.9 })];
    const { trend, mortals } = computeAttemptedDifficultyTrend([...rising, ...flat, ...falling, ...tooFew]);
    expect(mortals).toBe(3);
    expect(trend).toBeCloseTo(0, 10); // median of {+0.001, 0, −0.002}
  });

  it('reads null when no mortal qualifies', () => {
    expect(computeAttemptedDifficultyTrend([entry({})])).toEqual({ trend: null, mortals: 0 });
  });
});

describe('demandedDifficultyOf', () => {
  it('is the mean step difficulty plus the scale offset, skipping branch nodes', () => {
    const steps = [{ difficulty: 0.2 }, { difficulty: 0.4 }, { branchOnStep: 0 }];
    expect(demandedDifficultyOf(steps, 'regional')).toBeCloseTo(0.3, 10);
    expect(demandedDifficultyOf(steps, 'local')).toBeCloseTo(0.3 + SCALE_DIFFICULTY_OFFSETS.local, 10);
    expect(demandedDifficultyOf(steps, undefined)).toBeCloseTo(0.3, 10);
  });

  it('reads NaN with no rollable step', () => {
    expect(demandedDifficultyOf([{ branchOnStep: 0 }], 'local')).toBeNaN();
  });
});
