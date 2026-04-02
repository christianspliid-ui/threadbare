/**
 * Tests for balanceSummary.ts and balanceEvaluator.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildBalanceRunSummary, buildBalanceAgentJourneySummary, buildBalanceCohortSummary } from '../balanceSummary';
import { evaluateBalanceSummary, evaluateAgentJourney, formatEvaluationReport } from '../balanceEvaluator';
import { createSimulationRuntime } from '../simulationRuntime';
import { recordBalanceEvent, setTrackedAgents } from '../balanceTelemetry';
import { getDefaultBalanceTargets } from '../balanceTargets';
import type { SimulationRuntime } from '../simulationRuntime';
import type { BalanceEvent } from '../../types/balanceEval';

function makeRuntime(): SimulationRuntime {
  return createSimulationRuntime();
}

function record(rt: SimulationRuntime, partial: Omit<BalanceEvent, 'seq'>): void {
  recordBalanceEvent(rt, partial);
}

// ─── buildBalanceRunSummary ───────────────────────────────────────

describe('buildBalanceRunSummary()', () => {
  it('returns null when balanceTelemetry is null', () => {
    const rt = makeRuntime();
    rt.balanceTelemetry = null;
    expect(buildBalanceRunSummary(rt, 100)).toBeNull();
  });

  it('returns a summary with correct endTick and totalTicks', () => {
    const rt = makeRuntime();
    const summary = buildBalanceRunSummary(rt, 200)!;
    expect(summary.endTick).toBe(200);
    expect(summary.totalTicks).toBe(200); // startTick defaults to 0
  });

  it('populates totals from counters', () => {
    const rt = makeRuntime();
    record(rt, { tick: 1, kind: 'step_resolved', agentId: 'a', sourceSystem: 'unified_action', result: 'success' });
    record(rt, { tick: 2, kind: 'encounter_resolved', agentId: 'a', sourceSystem: 'legacy_encounter', finalStatus: 'completed', threatBand: 'easy' });
    record(rt, { tick: 3, kind: 'reward_granted', agentId: 'a', sourceSystem: 'reward', rewardTemplateId: 'tmpl-1', rewardCategory: 'possession' });

    const summary = buildBalanceRunSummary(rt, 100)!;
    expect(summary.totals.stepsAttempted).toBe(1);
    expect(summary.totals.encountersAttempted).toBe(1);
    expect(summary.totals.encountersCompleted).toBe(1);
    expect(summary.totals.rewardsGranted).toBe(1);
  });

  it('computes step success rates with correct rate', () => {
    const rt = makeRuntime();
    record(rt, { tick: 1, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'moderate' });
    record(rt, { tick: 2, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'moderate' });
    record(rt, { tick: 3, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'moderate' });
    record(rt, { tick: 4, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'moderate' });

    const summary = buildBalanceRunSummary(rt, 100)!;
    const moderate = summary.stepSuccessRates['moderate']!;
    expect(moderate.attempts).toBe(4);
    expect(moderate.successes).toBe(3);
    expect(moderate.rate).toBeCloseTo(0.75);
  });

  it('computes failForwardShare as completion / attempted', () => {
    const rt = makeRuntime();
    record(rt, { tick: 1, kind: 'encounter_resolved', agentId: 'a', sourceSystem: 'test', finalStatus: 'completed', threatBand: 'easy' });
    record(rt, { tick: 2, kind: 'encounter_resolved', agentId: 'a', sourceSystem: 'test', finalStatus: 'abandoned', threatBand: 'easy' });

    const summary = buildBalanceRunSummary(rt, 100)!;
    expect(summary.failForwardShare).toBeCloseTo(0.5);
  });

  it('populates pacing milestones from telemetry', () => {
    const rt = makeRuntime();
    record(rt, { tick: 30, kind: 'reward_granted', agentId: 'a', sourceSystem: 'reward', rewardTemplateId: 'tmpl-1' });
    record(rt, { tick: 50, kind: 'growth_applied', agentId: 'a', sourceSystem: 'growth' });

    const summary = buildBalanceRunSummary(rt, 100)!;
    expect(summary.pacing.firstRewardTick).toBe(30);
    expect(summary.pacing.firstGrowthBeatTick).toBe(50);
  });

  it('computes crit failure share from recent events', () => {
    const rt = makeRuntime();
    record(rt, { tick: 1, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'critical_failure', threatBand: 'hard' });
    record(rt, { tick: 2, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'hard' });
    record(rt, { tick: 3, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'hard' });
    record(rt, { tick: 4, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'hard' });

    const summary = buildBalanceRunSummary(rt, 100)!;
    expect(summary.critFailShareByBand['hard']).toBeCloseTo(0.25);
  });
});

// ─── buildBalanceAgentJourneySummary ─────────────────────────────

describe('buildBalanceAgentJourneySummary()', () => {
  it('returns null when agent has no tracked events', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    expect(buildBalanceAgentJourneySummary(rt, 'agent-A')).toBeNull();
  });

  it('returns null when agent is not tracked', () => {
    const rt = makeRuntime();
    record(rt, { tick: 1, kind: 'step_resolved', agentId: 'agent-B', sourceSystem: 'test', result: 'success' });
    expect(buildBalanceAgentJourneySummary(rt, 'agent-B')).toBeNull();
  });

  it('counts step successes and computes rate', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    record(rt, { tick: 1, kind: 'step_resolved', agentId: 'agent-A', sourceSystem: 'test', result: 'success' });
    record(rt, { tick: 2, kind: 'step_resolved', agentId: 'agent-A', sourceSystem: 'test', result: 'failure' });
    record(rt, { tick: 3, kind: 'step_resolved', agentId: 'agent-A', sourceSystem: 'test', result: 'success' });

    const j = buildBalanceAgentJourneySummary(rt, 'agent-A')!;
    expect(j.stepSuccessRate).toBeCloseTo(2 / 3);
  });

  it('tracks longest failure streak', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    // success, fail, fail, fail, success, fail, fail
    const results: Array<BalanceEvent['result']> = ['success', 'failure', 'failure', 'failure', 'success', 'failure', 'failure'];
    for (let i = 0; i < results.length; i++) {
      record(rt, { tick: i + 1, kind: 'step_resolved', agentId: 'agent-A', sourceSystem: 'test', result: results[i] });
    }

    const j = buildBalanceAgentJourneySummary(rt, 'agent-A')!;
    expect(j.longestSetbackStreak).toBe(3);
  });

  it('sets milestone ticks correctly', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    record(rt, { tick: 5, kind: 'reward_granted', agentId: 'agent-A', sourceSystem: 'reward', rewardTemplateId: 'tmpl-1' });
    record(rt, { tick: 15, kind: 'growth_applied', agentId: 'agent-A', sourceSystem: 'growth' });
    record(rt, { tick: 20, kind: 'state_transition', agentId: 'agent-A', sourceSystem: 'lifecycle', transitionType: 'dissolved' });

    const j = buildBalanceAgentJourneySummary(rt, 'agent-A')!;
    expect(j.firstRewardTick).toBe(5);
    expect(j.firstGrowthBeatTick).toBe(15);
    expect(j.firstMajorSetbackTick).toBe(20);
  });

  it('counts encounter completions', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    record(rt, { tick: 1, kind: 'encounter_resolved', agentId: 'agent-A', sourceSystem: 'test', finalStatus: 'completed' });
    record(rt, { tick: 2, kind: 'encounter_resolved', agentId: 'agent-A', sourceSystem: 'test', finalStatus: 'abandoned' });
    record(rt, { tick: 3, kind: 'encounter_resolved', agentId: 'agent-A', sourceSystem: 'test', finalStatus: 'completed' });

    const j = buildBalanceAgentJourneySummary(rt, 'agent-A')!;
    expect(j.totalEncounters).toBe(3);
    expect(j.encounterCompletionRate).toBeCloseTo(2 / 3);
  });
});

// ─── buildBalanceCohortSummary ────────────────────────────────────

describe('buildBalanceCohortSummary()', () => {
  it('handles empty input', () => {
    const cohort = buildBalanceCohortSummary([]);
    expect(cohort.runCount).toBe(0);
    expect(cohort.seeds).toHaveLength(0);
  });

  it('aggregates totals across runs', () => {
    const rt1 = makeRuntime();
    record(rt1, { tick: 1, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success' });
    const s1 = buildBalanceRunSummary(rt1, 100)!;

    const rt2 = makeRuntime();
    record(rt2, { tick: 1, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure' });
    record(rt2, { tick: 2, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure' });
    const s2 = buildBalanceRunSummary(rt2, 100)!;

    const cohort = buildBalanceCohortSummary([s1, s2]);
    expect(cohort.runCount).toBe(2);
    expect(cohort.aggregated.totals.stepsAttempted).toBe(3);
  });

  it('averages step success rates across runs', () => {
    const rt1 = makeRuntime();
    // 3/4 success in moderate
    for (let i = 0; i < 3; i++) record(rt1, { tick: i, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'moderate' });
    record(rt1, { tick: 10, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'moderate' });
    const s1 = buildBalanceRunSummary(rt1, 100)!;

    const rt2 = makeRuntime();
    // 1/2 success in moderate
    record(rt2, { tick: 1, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'moderate' });
    record(rt2, { tick: 2, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'moderate' });
    const s2 = buildBalanceRunSummary(rt2, 100)!;

    const cohort = buildBalanceCohortSummary([s1, s2]);
    // Aggregated: 4 successes / 6 attempts = 0.667
    const moderate = cohort.aggregated.stepSuccessRates['moderate']!;
    expect(moderate.attempts).toBe(6);
    expect(moderate.successes).toBe(4);
    expect(moderate.rate).toBeCloseTo(4 / 6);
  });
});

// ─── evaluateBalanceSummary ───────────────────────────────────────

describe('evaluateBalanceSummary()', () => {
  it('returns a result with findings for every band in targets', () => {
    const rt = makeRuntime();
    const summary = buildBalanceRunSummary(rt, 100)!;
    const targets = getDefaultBalanceTargets();
    const result = evaluateBalanceSummary(summary, targets);

    expect(result.findings.length).toBe(targets.bands.length);
    expect(result.evaluatedAt).toBeGreaterThan(0);
    expect(result.targetVersion).toBe(targets.version);
  });

  it('marks step_success_rate as pass when within ideal zone', () => {
    const rt = makeRuntime();
    // 6 successes out of 8 = 0.75 — in [0.75, 0.85] for easy band
    for (let i = 0; i < 6; i++) {
      record(rt, { tick: i, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'easy' });
    }
    for (let i = 0; i < 2; i++) {
      record(rt, { tick: i + 10, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'easy' });
    }
    const summary = buildBalanceRunSummary(rt, 100)!;
    const targets = getDefaultBalanceTargets();
    const result = evaluateBalanceSummary(summary, targets);

    const easyStepFinding = result.findings.find(
      f => f.metricId === 'step_success_rate' && f.scope === 'easy'
    )!;
    expect(easyStepFinding.severity).toBe('pass');
  });

  it('marks step_success_rate as fail when below min', () => {
    const rt = makeRuntime();
    // 3/10 = 0.30 — below easy band min (0.72)
    for (let i = 0; i < 3; i++) {
      record(rt, { tick: i, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'success', threatBand: 'easy' });
    }
    for (let i = 0; i < 7; i++) {
      record(rt, { tick: i + 10, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'easy' });
    }
    const summary = buildBalanceRunSummary(rt, 100)!;
    const targets = getDefaultBalanceTargets();
    const result = evaluateBalanceSummary(summary, targets);

    const easyStepFinding = result.findings.find(
      f => f.metricId === 'step_success_rate' && f.scope === 'easy'
    )!;
    expect(easyStepFinding.severity).toBe('fail');
  });

  it('marks metrics with no data as warning, not fail', () => {
    const rt = makeRuntime();
    const summary = buildBalanceRunSummary(rt, 100)!;
    const targets = getDefaultBalanceTargets();
    const result = evaluateBalanceSummary(summary, targets);

    // No data available — all should be warning or pass but NOT fail due to missing data
    for (const finding of result.findings) {
      if (finding.actual === null) {
        expect(finding.severity).toBe('warning');
      }
    }
  });

  it('sets overall to fail when any finding fails', () => {
    const rt = makeRuntime();
    // Force a fail: 0/10 step success rate in moderate (below min 0.55)
    for (let i = 0; i < 10; i++) {
      record(rt, { tick: i, kind: 'step_resolved', agentId: 'a', sourceSystem: 'test', result: 'failure', threatBand: 'moderate' });
    }
    const summary = buildBalanceRunSummary(rt, 100)!;
    const result = evaluateBalanceSummary(summary, getDefaultBalanceTargets());
    expect(result.overall).toBe('fail');
  });

  it('counts findings by severity', () => {
    const rt = makeRuntime();
    const summary = buildBalanceRunSummary(rt, 100)!;
    const result = evaluateBalanceSummary(summary, getDefaultBalanceTargets());
    const total = result.counts.pass + result.counts.warning + result.counts.fail;
    expect(total).toBe(result.findings.length);
  });
});

// ─── evaluateAgentJourney ─────────────────────────────────────────

describe('evaluateAgentJourney()', () => {
  it('returns lines containing agent name and stats', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    record(rt, { tick: 1, kind: 'step_resolved', agentId: 'agent-A', sourceSystem: 'test', result: 'success' });
    record(rt, { tick: 2, kind: 'reward_granted', agentId: 'agent-A', sourceSystem: 'reward', rewardTemplateId: 'tmpl-1' });

    const j = buildBalanceAgentJourneySummary(rt, 'agent-A', 'Serafina')!;
    const lines = evaluateAgentJourney(j);
    expect(lines.some(l => l.includes('Serafina'))).toBe(true);
    expect(lines.some(l => l.includes('Rewards'))).toBe(true);
  });
});

// ─── formatEvaluationReport ───────────────────────────────────────

describe('formatEvaluationReport()', () => {
  it('returns a non-empty string with overall and run totals sections', () => {
    const rt = makeRuntime();
    const summary = buildBalanceRunSummary(rt, 100)!;
    const result = evaluateBalanceSummary(summary, getDefaultBalanceTargets());
    const report = formatEvaluationReport(result, summary);

    expect(report).toContain('Balance Evaluation Report');
    expect(report).toContain('Overall:');
    expect(report).toContain('Run Totals');
  });

  it('is JSON-safe (no circular refs)', () => {
    const rt = makeRuntime();
    const summary = buildBalanceRunSummary(rt, 100)!;
    const result = evaluateBalanceSummary(summary, getDefaultBalanceTargets());
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(() => JSON.stringify(summary)).not.toThrow();
  });
});
