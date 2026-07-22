/**
 * Synchronous tick batch tests (THR-689).
 *
 * Covers the two guard rails the ticket names — the per-call cap and the
 * one-trace-per-call rule — plus the core claim that a batch advances the tick
 * counter by exactly the number of ticks it reports running.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { runTickBatch, DEBUG_TICK_MAX } from '../debugTickBatch';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';

function freshState(): GameState {
  resetDecisionCache();
  resetEventCounter();
  const archetype = generateArchetypes(4, 42)[0];
  const preset = MAP_SIZE_PRESETS.small;
  const { state } = initializeGameState(
    archetype,
    'Test-Runner',
    createBalancedCosmology(),
    42,
    preset.cols,
    preset.rows,
  );
  return state;
}

const noTargets = () => [];

describe('runTickBatch', () => {
  beforeEach(() => {
    clearTraces();
  });

  it('advances the tick counter by exactly the number of ticks run', () => {
    const state = freshState();
    const startTick = state.tick;

    const result = runTickBatch(state, 5, createSimulationRuntime(), noTargets);

    expect(result.ticksRun).toBe(5);
    expect(result.tick).toBe(startTick + 5);
    expect(result.state.tick).toBe(startTick + 5);
    expect(result.stoppedReason).toBe('completed');
    expect(result.capped).toBe(false);
    expect(result.error).toBeUndefined();
  });

  // Runs real ticks up to the cap, so it needs headroom over vitest's 5s default.
  it('clamps a request above DEBUG_TICK_MAX instead of rejecting it', () => {
    const state = freshState();
    const startTick = state.tick;
    // The resolver fires once per attempted tick, so its call count is an independent
    // witness that the loop is bounded — not just that the result object says so.
    let resolverCalls = 0;
    const counting = () => { resolverCalls++; return []; };

    const result = runTickBatch(state, 10_000, createSimulationRuntime(), counting);

    expect(result.requested).toBe(10_000);
    expect(result.capped).toBe(true);
    expect(resolverCalls).toBeLessThanOrEqual(DEBUG_TICK_MAX);
    // Upper bound, not equality: the cap guarantees we never run MORE than the max,
    // but the sim can legitimately stop sooner by leaving the playing phase (on this
    // seed/map the doom clock ends the run around tick 185). Asserting equality would
    // couple this guard-rail test to doom-clock pacing.
    expect(result.ticksRun).toBeLessThanOrEqual(DEBUG_TICK_MAX);
    expect(result.tick).toBe(startTick + result.ticksRun);
    expect(['capped', 'phase_left_playing']).toContain(result.stoppedReason);
  }, 60_000);

  it('has a cap that is a named constant, not a literal', () => {
    expect(DEBUG_TICK_MAX).toBe(200);
  });

  it('emits exactly one aggregate trace per call, never one per tick', () => {
    // The ring buffer holds 2000 entries; a per-tick trace from a long batch would
    // evict most of the run's real traces. This is the regression that guards it.
    enableTracing();
    clearTraces();
    try {
      const state = freshState();
      runTickBatch(state, 10, createSimulationRuntime(), noTargets);

      const batchTraces = getTraces().filter(t => t.category === 'debug_tick_batch');
      expect(batchTraces).toHaveLength(1);

      const trace = batchTraces[0] as unknown as {
        ticksRun: number;
        requested: number;
        capped: boolean;
        stoppedReason: string;
        summary: string;
      };
      expect(trace.ticksRun).toBe(10);
      expect(trace.requested).toBe(10);
      expect(trace.capped).toBe(false);
      expect(trace.stoppedReason).toBe('completed');
      expect(trace.summary).toContain('10/10');
    } finally {
      disableTracing();
      clearTraces();
    }
  });

  it('runs zero ticks for a non-positive request and still reports cleanly', () => {
    const state = freshState();
    const startTick = state.tick;

    const result = runTickBatch(state, 0, createSimulationRuntime(), noTargets);

    expect(result.ticksRun).toBe(0);
    expect(result.tick).toBe(startTick);
    expect(result.state).toBe(state);
  });

  it('stops early when the game leaves the playing phase', () => {
    const state = { ...freshState(), phase: 'harvest' as GameState['phase'] };

    const result = runTickBatch(state, 5, createSimulationRuntime(), noTargets);

    expect(result.ticksRun).toBe(0);
    expect(result.stoppedReason).toBe('phase_left_playing');
  });

  it('returns partial progress instead of throwing when a tick fails (fail-soft)', () => {
    const state = freshState();
    const startTick = state.tick;
    let calls = 0;
    // Fail on the 3rd tick via the targets resolver, which runTickBatch calls per tick.
    const explodingTargets = () => {
      calls++;
      if (calls === 3) throw new Error('boom');
      return [];
    };

    const result = runTickBatch(state, 5, createSimulationRuntime(), explodingTargets);

    expect(result.ticksRun).toBe(2);
    expect(result.tick).toBe(startTick + 2);
    expect(result.stoppedReason).toBe('error');
    expect(result.error).toContain('boom');
  });
});
