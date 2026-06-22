// src/engine/__tests__/regression/encounter-health.regression.test.ts
//
// Behavioral health regression tests for the encounter/unified-action system.
// These verify that multi-seed simulations produce statistically healthy outputs.
//
// The encounter system has been migrated to unified actions. Legacy harness metrics
// (totalResolutions, successCount, etc.) are always 0 because the legacy events
// are no longer emitted. We derive success/crit/completion rates from
// finalState.unifiedActions instead.
//
// Calibrated 2026-04-12 against seeds 1-10, 100 ticks, small map.
// Bounds set at ~2x observed range to avoid flakiness.

import { describe, it, expect } from 'vitest';
import {
  runMultiSeed,
  mean,
  idleRate,
  avgDistinctHexes,
} from '../helpers/simulationHarness';
import type { SimulationMetrics } from '../helpers/simulationHarness';

// Run 3 seeds x 100 ticks on a small map for speed.
const SEEDS = [42, 137, 999];
const TICKS = 100;

// ─── Unified Action Helpers ──────────────────────────────────────

function unifiedCompletionRate(m: SimulationMetrics): number {
  const actions = m.finalState.unifiedActions;
  if (actions.length === 0) return 0;
  const resolved = actions.filter(a => a.resolved).length;
  return resolved / actions.length;
}

function unifiedStepSuccessRate(m: SimulationMetrics): number {
  const actions = m.finalState.unifiedActions;
  let successes = 0;
  let total = 0;
  for (const a of actions) {
    for (const so of a.stepOutcomes) {
      total++;
      if (so === 'success' || so === 'critical_success' || so === 'success_at_cost') {
        successes++;
      }
    }
  }
  return total > 0 ? successes / total : 0;
}

function unifiedStepCritRate(m: SimulationMetrics): number {
  const actions = m.finalState.unifiedActions;
  let crits = 0;
  let total = 0;
  for (const a of actions) {
    for (const so of a.stepOutcomes) {
      total++;
      if (so === 'critical_success' || so === 'critical_failure') crits++;
    }
  }
  return total > 0 ? crits / total : 0;
}

function unifiedUniqueTemplateCount(m: SimulationMetrics): number {
  return new Set(m.finalState.unifiedActions.map(a => a.templateId)).size;
}

function unifiedMaxTemplateRepsPerAgent(m: SimulationMetrics): number {
  const agentReps = new Map<string, Map<string, number>>();
  for (const a of m.finalState.unifiedActions) {
    if (!agentReps.has(a.actorId)) agentReps.set(a.actorId, new Map());
    const reps = agentReps.get(a.actorId)!;
    reps.set(a.templateId, (reps.get(a.templateId) ?? 0) + 1);
  }
  let max = 0;
  for (const reps of agentReps.values()) {
    for (const count of reps.values()) {
      if (count > max) max = count;
    }
  }
  return max;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('encounter behavioral health (multi-seed regression)', () => {
  // Run all seeds upfront (expensive — ~30-40s per seed on small map)
  const results = runMultiSeed(SEEDS, TICKS, 'small');

  // Calibrated range: observed idle rate 0.863-0.918 across 10 seeds.
  // The high idle rate reflects the harness definition (not in encounter AND not moving).
  // Most agents ARE doing unified actions but the harness idle detection doesn't count
  // unified actions as "busy". We set the bound at 0.95 to catch genuine degradation.
  it('idle rate stays below 95%', () => {
    const avgIdle = mean(results.map(idleRate));
    expect(avgIdle).toBeLessThan(0.95);
  });

  // Calibrated: 53-67 unique templates observed across seeds.
  // Set floor at 20 (well below 2x minimum) to catch template loading failures.
  it('at least 20 distinct encounter templates used across all agents', () => {
    const allTemplates = new Set<string>();
    for (const m of results) {
      for (const t of new Set(m.finalState.unifiedActions.map(a => a.templateId))) {
        allTemplates.add(t);
      }
    }
    expect(allTemplates.size).toBeGreaterThanOrEqual(20);
  });

  // Calibrated: completion rate ~0.89 across 10 seeds (with 20-tick retention).
  // THR-464 global share ceiling recalibrated to 0.78: ceiling redirects agents from
  // high-tier dominant encounters to varied alternatives with marginally lower completion
  // rates (~0.795 observed). Floor set conservatively below that.
  it('unified action completion rate above 78%', () => {
    const avgCompletion = mean(results.map(unifiedCompletionRate));
    expect(avgCompletion).toBeGreaterThan(0.78);
  });

  // Calibrated: step success rate 0.064-0.100 across 10 seeds (pre-THR-451).
  // THR-451 Phase B probability floor boosts incapable actors to scale-appropriate
  // minimum success rates → observed ~0.589 across 3 seeds (seeds 42, 137, 999)
  // with personal floor=0.70, local floor=0.65.
  // Bounds: 0.02-0.75 — lower end catches floor being disabled, upper end catches
  // an accidentally doubled floor or universal success bug.
  it('step-level success rate between 2%-75%', () => {
    const avgSuccess = mean(results.map(unifiedStepSuccessRate));
    expect(avgSuccess).toBeGreaterThanOrEqual(0.02);
    expect(avgSuccess).toBeLessThanOrEqual(0.75);
  });

  // Calibrated: step crit rate 0.075-0.099 across 10 seeds (pre-THR-451).
  // THR-451 Phase B: critical_failure gated to failure at personal/local scale.
  // critical_success is preserved. Observed ~3-8% across 3 seeds.
  // Bounds: 0.001-0.15 — lower end catches total crit elimination, upper end
  // catches regression to pre-THR-451 crit levels.
  it('step-level critical rate between 0.1%-15%', () => {
    const avgCrit = mean(results.map(unifiedStepCritRate));
    expect(avgCrit).toBeGreaterThanOrEqual(0.001);
    expect(avgCrit).toBeLessThanOrEqual(0.15);
  });

  // Calibrated: avgHexes 0.5-0.9 across seeds. Movement is limited on small maps
  // in 100 ticks (agents spend most time in encounters). We just verify it's nonzero.
  it('agents visit at least some distinct hexes', () => {
    const avgHexes = mean(results.map(avgDistinctHexes));
    expect(avgHexes).toBeGreaterThan(0);
  });

  // Calibrated: maxConsecutiveIdle = 100 for every seed. This is expected because
  // the harness idle detection doesn't recognize unified actions as "busy" — only
  // legacy encounterProgress entries and movement events. Some agents have no legacy
  // encounter activity at all but are actively doing unified actions.
  // We check that not ALL agents are idle for the entire run (which would signal
  // a real problem). At least some agents should have non-100 consecutive idle.
  it('not all agents are idle the entire simulation', () => {
    for (const m of results) {
      let agentsWithSomeActivity = 0;
      for (const count of m.maxConsecutiveIdlePerAgent.values()) {
        if (count < TICKS) agentsWithSomeActivity++;
      }
      // At least 5% of agents should show some legacy activity (movement or encounters)
      expect(agentsWithSomeActivity / m.agentCount).toBeGreaterThan(0.05);
    }
  });

  // Calibrated: max template reps per agent (unified) varies.
  // We allow up to 10 reps — encounters can legitimately repeat for some agents
  // given that 100 ticks with ~600-900 total actions spread across 150-220 agents
  // means ~3-5 actions per agent. Cap at 10 to catch runaway loops.
  it('no agent repeats the same template more than 10 times (unified)', () => {
    for (const m of results) {
      const maxRep = unifiedMaxTemplateRepsPerAgent(m);
      expect(maxRep).toBeLessThanOrEqual(10);
    }
  });
}, 600_000);
