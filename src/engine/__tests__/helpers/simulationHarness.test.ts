// src/engine/__tests__/helpers/simulationHarness.test.ts

import { describe, it, expect } from 'vitest';
import { runSimulation } from './simulationHarness';

describe('simulationHarness', () => {
  it('runs 5 ticks without crashing and returns metrics', () => {
    const m = runSimulation({ seed: 42, ticks: 5, map: 'small' });
    expect(m.ticksRun).toBe(5);
    expect(m.agentCount).toBeGreaterThan(0);
    expect(m.totalAgentTicks).toBe(m.agentCount * 5);
  });
});
