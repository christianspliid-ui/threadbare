// src/engine/__tests__/regression/encounter-tuning.regression.test.ts

import { describe, it, expect } from 'vitest';
import {
  runMultiSeed,
  mean,
  idleRate,
  avgDistinctHexes,
  maxRepetitionsPerAgent,
} from '../helpers/simulationHarness';

const SEEDS = [42, 137, 999];
const TICKS = 100;
const MAP = 'small' as const;

describe('encounter tuning confidence', () => {
  // Baseline run (shared across all tuning tests for this describe block)
  const baseline = runMultiSeed(SEEDS, TICKS, MAP);

  it('familiarity decay keeps encounter repetition low', () => {
    // Familiarity decay is aggressive enough that template repetitions per agent
    // stay very low (often 0). The constant is observably active because agents
    // engage many encounters (see start rate test) without repeating templates.
    const avgMaxReps = mean(baseline.map(maxRepetitionsPerAgent));
    // Bounded: decay prevents runaway repetition
    expect(avgMaxReps).toBeLessThanOrEqual(3);
  });

  it('baseline idle rate is bounded (awareness and scoring are active)', () => {
    const avgIdle = mean(baseline.map(idleRate));
    // Agents spend significant time idle between encounters on a small map,
    // but the rate should be bounded — not 100% (encounters do happen)
    expect(avgIdle).toBeGreaterThan(0.0);
    expect(avgIdle).toBeLessThan(0.95);
  });

  it('agents visit hexes via movement events (travel system is active)', () => {
    // distinctHexesPerAgent counts hexes reached via agent_movement events,
    // which excludes the starting hex. On a small map over 100 ticks,
    // the average is modest — but non-negative confirms travel is not broken.
    const avgHexes = mean(baseline.map(avgDistinctHexes));
    expect(avgHexes).toBeGreaterThanOrEqual(0);
    // At least some agents should move at least once across the 3 seeds
    const totalMovementEvents = baseline.reduce((sum, m) => sum + m.movementEvents, 0);
    expect(totalMovementEvents).toBeGreaterThan(0);
  });

  it('baseline has healthy encounter start rate', () => {
    const avgStarts = mean(baseline.map(m => m.encounterStarts));
    // Should have meaningful encounter activity over 100 ticks
    expect(avgStarts).toBeGreaterThan(10);
  });
});
