/**
 * Unit tests for the KPI module (THR-457).
 * Tests pure math (entropy, thresholds) and report structure.
 */

import { describe, it, expect } from 'vitest';
import {
  computeGameplayKpiReport,
  createEligibilityFunnelCounters,
  type EligibilityFunnelCounters,
} from '../../engine/kpi/gameplayKpi';
import type { GameState } from '../../types/gameState';
import {
  KPI_FAILURE_RATE_MAX,
  KPI_CLEAN_SUCCESS_MIN,
  KPI_TEMPLATE_TOP_SHARE_MAX,
} from '../../engine/kpi/kpiConstants';

// ─── Minimal GameState stub ──────────────────────────────────────

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 120,
    seed: 42,
    unifiedActions: [],
    // Required fields — minimal stubs
    cycle: 1,
    phase: 'playing',
    graph: { getNode: () => null, getNodesByType: () => [], getOutgoingEdges: () => [], getIncomingEdges: () => [] } as any,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    ascendantIdentity: null,
    essencePool: {} as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    doomIdentityMatrix: null,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    ...overrides,
  } as GameState;
}

function makeResolvedAction(templateId: string, outcome: string) {
  return {
    actionId: `a-${templateId}`,
    actorId: 'agent-1',
    templateId,
    targetId: 'loc-1',
    scale: 'local' as const,
    source: 'agent' as const,
    startTick: 0,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: true,
    outcome: outcome as any,
    stepOutcomes: [],
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('computeGameplayKpiReport', () => {
  it('returns zeroed report for empty state', () => {
    const report = computeGameplayKpiReport(makeState());
    expect(report.tick).toBe(120);
    expect(report.seed).toBe(42);
    expect(report.outcomes.total).toBe(0);
    expect(report.outcomes.insufficientData).toBe(true);
    expect(report.branchingFire.totalFires).toBe(0);
    expect(report.templateConcentration.totalSelections).toBe(0);
  });

  it('correctly computes failure rate', () => {
    const actions = [
      ...Array(79).fill(null).map((_, i) => makeResolvedAction(`tmpl-${i % 10}`, 'failure')),
      ...Array(18).fill(null).map((_, i) => makeResolvedAction(`tmpl-${10 + i % 5}`, 'critical_failure')),
      ...Array(4).fill(null).map((_, i) => makeResolvedAction(`tmpl-${15 + i}`, 'success_at_cost')),
    ];
    const state = makeState({ unifiedActions: actions as any });
    const report = computeGameplayKpiReport(state);
    expect(report.outcomes.total).toBe(101);
    expect(report.outcomes.failureRate).toBeCloseTo((79 + 18) / 101, 3);
    expect(report.outcomes.critFailRate).toBeCloseTo(18 / 101, 3);
    expect(report.outcomes.cleanSuccessRate).toBeCloseTo(0 / 101, 3);
  });

  it('detects 89% failure scenario (reproduces 2026-06-11 finding)', () => {
    const actions = [
      ...Array(79).fill(null).map((_, i) => makeResolvedAction(`ambient-${i % 8}`, 'failure')),
      ...Array(18).fill(null).map((_, i) => makeResolvedAction(`ambient-${8 + i % 3}`, 'critical_failure')),
      ...Array(4).fill(null).map((_, i) => makeResolvedAction(`ambient-${11 + i}`, 'success_at_cost')),
    ];
    const state = makeState({ unifiedActions: actions as any });
    const report = computeGameplayKpiReport(state);
    // Should be ~89% failure
    expect(report.outcomes.failureRate).toBeGreaterThan(0.85);
    // Threshold evaluation: failure_rate should be RED
    const frt = report.thresholds.find(t => t.metric === 'failure_rate');
    expect(frt?.status).toBe('red');
    // 0 clean successes → red
    const cst = report.thresholds.find(t => t.metric === 'clean_success_rate');
    expect(cst?.status).toBe('red');
  });

  it('computes top template share correctly', () => {
    // 3 templates: A=60%, B=30%, C=10%
    const actions = [
      ...Array(60).fill(null).map(() => makeResolvedAction('tmpl-A', 'success')),
      ...Array(30).fill(null).map(() => makeResolvedAction('tmpl-B', 'success')),
      ...Array(10).fill(null).map(() => makeResolvedAction('tmpl-C', 'success')),
    ];
    const state = makeState({ unifiedActions: actions as any });
    const report = computeGameplayKpiReport(state);
    // tmpl-A has 60/100 = 60% share
    expect(report.templateConcentration.topShare).toBeCloseTo(0.6, 2);
    // With only 3 templates and this skew, entropy < max (not perfectly uniform)
    expect(report.templateConcentration.entropy).toBeLessThan(1.0);
    // Threshold: top share RED
    const tst = report.thresholds.find(t => t.metric === 'template_top_share');
    expect(tst?.status).toBe('red');
  });

  it('returns healthy thresholds when metrics look good', () => {
    const actions = Array(100).fill(null).map((_, i) =>
      makeResolvedAction(`tmpl-${i}`, 'success'),
    );
    const state = makeState({ unifiedActions: actions as any });
    const report = computeGameplayKpiReport(state);
    const frt = report.thresholds.find(t => t.metric === 'failure_rate');
    expect(frt?.status).toBe('green');
    const cst = report.thresholds.find(t => t.metric === 'clean_success_rate');
    expect(cst?.status).toBe('green');
  });

  it('uses funnel selected counts for template concentration when available', () => {
    const funnel = createEligibilityFunnelCounters(0);
    funnel.byTemplate['tmpl-A'] = { considered: 100, gatedBy: {}, scored: 80, selected: 60 };
    funnel.byTemplate['tmpl-B'] = { considered: 50, gatedBy: {}, scored: 30, selected: 10 };
    const state = makeState();
    const runtime = { eligibilityFunnel: funnel };
    const report = computeGameplayKpiReport(state, runtime);
    expect(report.templateConcentration.totalSelections).toBe(70);
    expect(report.templateConcentration.byTemplate[0].templateId).toBe('tmpl-A');
    expect(report.templateConcentration.byTemplate[0].share).toBeCloseTo(60 / 70, 3);
  });

  it('marks funnel as unavailable when runtime is absent', () => {
    const state = makeState();
    const report = computeGameplayKpiReport(state);
    expect(report.eligibilityFunnel.available).toBe(false);
  });

  it('marks funnel available when runtime has counters', () => {
    const funnel = createEligibilityFunnelCounters(5);
    funnel.byTemplate['tmpl-X'] = { considered: 10, gatedBy: { awareness: 3 }, scored: 5, selected: 2 };
    const report = computeGameplayKpiReport(makeState(), { eligibilityFunnel: funnel });
    expect(report.eligibilityFunnel.available).toBe(true);
    expect(report.eligibilityFunnel.topConsidered[0].templateId).toBe('tmpl-X');
    expect(report.eligibilityFunnel.topConsidered[0].conversionRate).toBeCloseTo(2 / 10, 3);
  });

  it('prefers the runtime lifetime branching-fire counter over the pruned action snapshot (THR-470)', () => {
    // unifiedActions is pruned after RESOLVED_ACTION_RETENTION_TICKS, so at tick 120 it may
    // hold only a handful of recently-resolved branching actions. The lifetime counter is the
    // honest numerator for the per-30t rate.
    const state = makeState({
      tick: 120,
      unifiedActions: [makeResolvedAction('reputation.star.the_star_pilgrim', 'success')] as any,
    });
    const report = computeGameplayKpiReport(state, { eligibilityFunnel: null, branchingFiresTotal: 20 });
    expect(report.branchingFire.totalFires).toBe(20);
    expect(report.branchingFire.firesPerChunk).toBeCloseTo((20 / 120) * 30, 3); // 5.0, not 0.25
  });

  it('falls back to the windowed action count when no lifetime counter is supplied (THR-470)', () => {
    const state = makeState({
      tick: 120,
      unifiedActions: [
        makeResolvedAction('reputation.star.the_star_pilgrim', 'success'),
        makeResolvedAction('reputation.heart.pilgrims_offering', 'success'),
      ] as any,
    });
    const report = computeGameplayKpiReport(state);
    expect(report.branchingFire.totalFires).toBe(2);
    expect(report.branchingFire.firesPerChunk).toBeCloseTo((2 / 120) * 30, 3); // 0.5
  });

  it('prefers the runtime lifetime threaded-beat counter over the pruned action snapshot (THR-541)', () => {
    // Same windowing artifact as branching fires: unifiedActions is pruned after
    // RESOLVED_ACTION_RETENTION_TICKS, so counting rich beats from it undercounts long runs.
    // The lifetime counter is the honest numerator for the per-10t rate.
    const state = makeState({
      tick: 120,
      unifiedActions: [makeResolvedAction('encounter.deep_descent', 'success')] as any,
    });
    const report = computeGameplayKpiReport(state, { eligibilityFunnel: null, threadedBeatsTotal: 24 });
    expect(report.threadedBeats.totalBeats).toBe(24);
    expect(report.threadedBeats.beatsPerChunk).toBeCloseTo((24 / 120) * 10, 3); // 2.0, not the windowed ~0.08
  });

  it('falls back to the windowed rich-beat count when no lifetime counter is supplied (THR-541)', () => {
    // encounter.deep_descent is a 3-step (rich) legacy template; a non-rich id must not count.
    const state = makeState({
      tick: 120,
      unifiedActions: [
        makeResolvedAction('encounter.deep_descent', 'success'),
        makeResolvedAction('encounter.deep_descent', 'success'),
        makeResolvedAction('tmpl-not-an-encounter', 'success'),
      ] as any,
    });
    const report = computeGameplayKpiReport(state);
    expect(report.threadedBeats.totalBeats).toBe(2);
    expect(report.threadedBeats.beatsPerChunk).toBeCloseTo((2 / 120) * 10, 3);
  });

  it('produces the base threshold suite including THR-571 outcome-ladder rows', () => {
    const report = computeGameplayKpiReport(makeState());
    // 13 rows without failure_story (skipped when C1 counters absent).
    expect(report.thresholds).toHaveLength(13);
    const metrics = report.thresholds.map(t => t.metric);
    expect(metrics).toContain('failure_rate');
    expect(metrics).toContain('critfail_rate');
    expect(metrics).toContain('clean_success_rate');
    expect(metrics).toContain('template_top_share');
    expect(metrics).toContain('template_entropy');
    expect(metrics).toContain('branching_fire_per_30t');
    expect(metrics).toContain('threaded_beats_per_10t');
    // THR-571 verdict rows
    expect(metrics).toContain('total_success_min');
    expect(metrics).toContain('total_success_max');
    expect(metrics).toContain('at_cost_min');
    expect(metrics).toContain('at_cost_max');
    expect(metrics).toContain('crit_success_rate');
    expect(metrics).toContain('crit_failure_rate');
    // failure_story_rate is skipped until the C1 counters exist
    expect(metrics).not.toContain('failure_story_rate');
  });

  it('THR-571: computes outcome-ladder rates (total success, at-cost, crit tails)', () => {
    const actions = [
      ...Array(20).fill(null).map((_, i) => makeResolvedAction(`t-${i}`, 'success')),
      ...Array(40).fill(null).map((_, i) => makeResolvedAction(`t-${20 + i}`, 'success_at_cost')),
      ...Array(3).fill(null).map((_, i) => makeResolvedAction(`t-${60 + i}`, 'critical_success')),
      ...Array(2).fill(null).map((_, i) => makeResolvedAction(`t-${63 + i}`, 'critical_failure')),
      ...Array(35).fill(null).map((_, i) => makeResolvedAction(`t-${65 + i}`, 'failure')),
    ];
    const report = computeGameplayKpiReport(makeState({ unifiedActions: actions as any }));
    const o = report.outcomes;
    expect(o.total).toBe(100);
    expect(o.totalSuccessRate).toBeCloseTo((20 + 40 + 3) / 100, 3);
    expect(o.atCostShare).toBeCloseTo(40 / 100, 3);
    expect(o.critSuccessRate).toBeCloseTo(3 / 100, 3);
    expect(o.critFailRate).toBeCloseTo(2 / 100, 3);
    // No C1 counters supplied → failure_story is null and its threshold is skipped.
    expect(o.failureStoryRate).toBeNull();
  });

  it('THR-571: failure_story_rate becomes a live threshold once the C1 counters are supplied', () => {
    const report = computeGameplayKpiReport(makeState(), {
      eligibilityFunnel: null,
      failureOutcomesTotal: 50,
      failureStoryArtifactsTotal: 48,
    });
    expect(report.outcomes.failureStoryRate).toBeCloseTo(48 / 50, 3);
    const fsr = report.thresholds.find(t => t.metric === 'failure_story_rate');
    expect(fsr).toBeDefined();
    expect(fsr?.status).toBe('green'); // 0.96 ≥ 0.90
  });
});

describe('createEligibilityFunnelCounters', () => {
  it('initializes to empty, not truncated', () => {
    const funnel = createEligibilityFunnelCounters(5);
    expect(funnel.byTemplate).toEqual({});
    expect(funnel.sinceTick).toBe(5);
    expect(funnel.truncated).toBe(false);
  });
});
