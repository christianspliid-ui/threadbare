// src/engine/__tests__/helpers/simulationHarness.test.ts

import { describe, it, expect } from 'vitest';
import { runSimulation } from './simulationHarness';
import { WORLD_SIM_TEST_TIMEOUT_MS } from '../../../testing/testTimeouts';

describe('simulationHarness', () => {
  // Drives a real world through 5 ticks, so the timeout is a hang detector, not a
  // speed budget (THR-1015). On vitest's 5000 ms default it timed out at 5703 ms
  // when `npm run gate` ran typecheck and build alongside the suite (THR-1717).
  it('runs 5 ticks without crashing and returns metrics', () => {
    const m = runSimulation({ seed: 42, ticks: 5, map: 'small' });
    expect(m.ticksRun).toBe(5);
    expect(m.agentCount).toBeGreaterThan(0);
    expect(m.totalAgentTicks).toBe(m.agentCount * 5);
  }, WORLD_SIM_TEST_TIMEOUT_MS);
});
