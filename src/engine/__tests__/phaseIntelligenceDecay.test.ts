/**
 * Unit tests for phaseIntelligenceDecay (THR-137).
 *
 * Covers: empty/undefined records, grace period, monotonic decay, floor,
 * determinism, threshold-cross event, per-changed-record trace, legacy data.
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { phaseIntelligenceDecay } from '../phaseIntelligenceDecay';
import {
  INTEL_RELIABILITY_DECAY_PER_TICK,
  INTEL_RELIABILITY_FLOOR,
  INTEL_RELIABILITY_GRACE_TICKS,
  INTEL_DECAY_EVENT_SIGNIFICANCE,
  RELIABILITY_THRESHOLD_RELIABLE,
  RELIABILITY_THRESHOLD_UNCERTAIN,
} from '../intelligence';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { IntelligenceRecord } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

// Minimal GameState stub sufficient for phaseIntelligenceDecay
function makeState(
  overrides: {
    tick?: number;
    records?: IntelligenceRecord[];
    tickEvents?: GameState['tickEvents'];
    recentEvents?: GameState['recentEvents'];
  } = {},
): GameState {
  return {
    tick: overrides.tick ?? 100,
    intelligenceRecords: overrides.records ?? [],
    tickEvents: overrides.tickEvents ?? [],
    recentEvents: overrides.recentEvents ?? [],
    graph: undefined as unknown as GameState['graph'],
  } as unknown as GameState;
}

function makeRecord(overrides: Partial<IntelligenceRecord> = {}): IntelligenceRecord {
  return {
    recordId: 'rec-1',
    agentId: 'agent-1',
    category: 'shrine_location',
    label: 'The Pale Shrine',
    detail: 'A hidden pilgrim route.',
    targetEntityId: 'loc-shrine',
    sourceEncounterId: 'encounter.quest',
    acquiredTick: 0,
    reliability: 0.85,
    ...overrides,
  };
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('phaseIntelligenceDecay', () => {
  it('returns {} when intelligenceRecords is undefined', () => {
    const state = makeState();
    (state as any).intelligenceRecords = undefined;
    expect(phaseIntelligenceDecay(state)).toEqual({});
  });

  it('returns {} when intelligenceRecords is empty', () => {
    const state = makeState({ records: [] });
    expect(phaseIntelligenceDecay(state)).toEqual({});
  });

  it('returns {} when all records are in grace period', () => {
    const tick = 10;
    const record = makeRecord({ acquiredTick: tick - 5 }); // age = 5 < GRACE_TICKS (20)
    const state = makeState({ tick, records: [record] });
    const result = phaseIntelligenceDecay(state);
    expect(result).toEqual({});
  });

  it('decays reliability for records past grace period', () => {
    const tick = INTEL_RELIABILITY_GRACE_TICKS + 1;
    const record = makeRecord({ acquiredTick: 0, reliability: 0.9 });
    const state = makeState({ tick, records: [record] });
    const result = phaseIntelligenceDecay(state);
    expect(result.intelligenceRecords).toBeDefined();
    const updated = result.intelligenceRecords![0];
    expect(updated.reliability).toBeCloseTo(0.9 - INTEL_RELIABILITY_DECAY_PER_TICK, 6);
  });

  it('decay is monotonic over N ticks', () => {
    let state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [makeRecord({ acquiredTick: 0, reliability: 0.9 })],
    });

    const reliabilities: number[] = [0.9];

    for (let i = 0; i < 10; i++) {
      const result = phaseIntelligenceDecay(state);
      const records = result.intelligenceRecords ?? state.intelligenceRecords!;
      reliabilities.push(records[0].reliability);
      state = { ...state, tick: state.tick + 1, intelligenceRecords: records } as GameState;
    }

    for (let i = 1; i < reliabilities.length; i++) {
      expect(reliabilities[i]).toBeLessThanOrEqual(reliabilities[i - 1]);
    }
  });

  it('respects floor — reliability never drops below INTEL_RELIABILITY_FLOOR', () => {
    // Start just above floor and run many ticks
    const record = makeRecord({
      acquiredTick: 0,
      reliability: INTEL_RELIABILITY_FLOOR + 0.002,
    });
    let state = makeState({ tick: INTEL_RELIABILITY_GRACE_TICKS + 1, records: [record] });

    for (let i = 0; i < 20; i++) {
      const result = phaseIntelligenceDecay(state);
      const records = result.intelligenceRecords ?? state.intelligenceRecords!;
      expect(records[0].reliability).toBeGreaterThanOrEqual(INTEL_RELIABILITY_FLOOR);
      state = { ...state, tick: state.tick + 1, intelligenceRecords: records } as GameState;
    }
  });

  it('returns {} when all records are already at floor', () => {
    const record = makeRecord({
      acquiredTick: 0,
      reliability: INTEL_RELIABILITY_FLOOR,
    });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 100,
      records: [record],
    });
    // At floor, decayedReliability === rawReliability → no change
    const result = phaseIntelligenceDecay(state);
    expect(result).toEqual({});
  });

  it('emits intelligence_decayed trace for each changed record', () => {
    const record = makeRecord({ acquiredTick: 0, reliability: 0.9 });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });
    phaseIntelligenceDecay(state);
    const traces = getTraces().filter(t => t.category === 'intelligence_decayed');
    expect(traces.length).toBe(1);
    expect((traces[0] as any).recordId).toBe('rec-1');
    expect((traces[0] as any).agentId).toBe('agent-1');
    expect((traces[0] as any).reliabilityBefore).toBeCloseTo(0.9, 6);
    expect((traces[0] as any).reliabilityAfter).toBeCloseTo(
      0.9 - INTEL_RELIABILITY_DECAY_PER_TICK,
      6,
    );
  });

  it('does not emit trace for records in grace period', () => {
    const record = makeRecord({ acquiredTick: 90, reliability: 0.9 });
    const state = makeState({ tick: 100, records: [record] }); // age = 10 < 20
    phaseIntelligenceDecay(state);
    const traces = getTraces().filter(t => t.category === 'intelligence_decayed');
    expect(traces).toHaveLength(0);
  });

  it('does not emit trace for records already at floor', () => {
    const record = makeRecord({ acquiredTick: 0, reliability: INTEL_RELIABILITY_FLOOR });
    const state = makeState({ tick: INTEL_RELIABILITY_GRACE_TICKS + 100, records: [record] });
    phaseIntelligenceDecay(state);
    const traces = getTraces().filter(t => t.category === 'intelligence_decayed');
    expect(traces).toHaveLength(0);
  });

  it('emits a chronicle event when reliability crosses reliable→uncertain threshold', () => {
    // Start just above RELIABILITY_THRESHOLD_RELIABLE so one tick crosses it
    const justAbove = RELIABILITY_THRESHOLD_RELIABLE + INTEL_RELIABILITY_DECAY_PER_TICK * 0.5;
    const record = makeRecord({ acquiredTick: 0, reliability: justAbove });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });
    const result = phaseIntelligenceDecay(state);
    // Should have emitted a TickEvent
    const newEvents = result.tickEvents ?? [];
    const decayEvent = newEvents.find(e => e.type === 'intelligence_decay');
    expect(decayEvent).toBeDefined();
    expect(decayEvent!.significance).toBe(INTEL_DECAY_EVENT_SIGNIFICANCE);
    expect(decayEvent!.actorId).toBe('agent-1');
  });

  it('emits a chronicle event when reliability crosses uncertain→dubious threshold', () => {
    const justAbove = RELIABILITY_THRESHOLD_UNCERTAIN + INTEL_RELIABILITY_DECAY_PER_TICK * 0.5;
    const record = makeRecord({ acquiredTick: 0, reliability: justAbove });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });
    const result = phaseIntelligenceDecay(state);
    const decayEvent = (result.tickEvents ?? []).find(e => e.type === 'intelligence_decay');
    expect(decayEvent).toBeDefined();
  });

  it('threshold-cross event fires exactly once per crossing', () => {
    const justAbove = RELIABILITY_THRESHOLD_RELIABLE + INTEL_RELIABILITY_DECAY_PER_TICK * 0.5;
    const record = makeRecord({ acquiredTick: 0, reliability: justAbove });
    let state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });

    let totalDecayEvents = 0;

    for (let i = 0; i < 3; i++) {
      const result = phaseIntelligenceDecay(state);
      const newRecords = result.intelligenceRecords ?? state.intelligenceRecords!;
      // Only count events emitted this tick (result.tickEvents extends state.tickEvents)
      if (result.tickEvents) {
        const newEvts = result.tickEvents.slice(state.tickEvents.length);
        totalDecayEvents += newEvts.filter(e => e.type === 'intelligence_decay').length;
      }
      const updatedEvents = result.tickEvents ?? state.tickEvents;
      state = { ...state, tick: state.tick + 1, intelligenceRecords: newRecords, tickEvents: updatedEvents } as GameState;
    }

    // Only the first tick should produce a crossing event (reliability crosses the boundary once)
    expect(totalDecayEvents).toBe(1);
  });

  it('is deterministic — same input → same output on repeated calls', () => {
    const record = makeRecord({ acquiredTick: 0, reliability: 0.75 });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });

    const results = Array.from({ length: 5 }, () => phaseIntelligenceDecay(state));
    const reliabilities = results.map(r => r.intelligenceRecords![0].reliability);
    expect(new Set(reliabilities).size).toBe(1);
  });

  it('handles legacy record missing acquiredTick without throwing', () => {
    const record = makeRecord({ acquiredTick: undefined as unknown as number });
    const state = makeState({ tick: INTEL_RELIABILITY_GRACE_TICKS + 1, records: [record] });
    // age = tick - 0 = past grace → graceful, not crashed
    expect(() => phaseIntelligenceDecay(state)).not.toThrow();
  });

  it('trace includes crossedThreshold when band changes', () => {
    const justAbove = RELIABILITY_THRESHOLD_RELIABLE + INTEL_RELIABILITY_DECAY_PER_TICK * 0.5;
    const record = makeRecord({ acquiredTick: 0, reliability: justAbove });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });
    phaseIntelligenceDecay(state);
    const trace = getTraces().find(t => t.category === 'intelligence_decayed') as any;
    expect(trace).toBeDefined();
    expect(trace.crossedThreshold).toBe('uncertain');
  });

  it('trace crossedThreshold is undefined when no band change', () => {
    // Reliability well within the reliable band — decay won't cross any threshold
    const record = makeRecord({ acquiredTick: 0, reliability: 0.95 });
    const state = makeState({
      tick: INTEL_RELIABILITY_GRACE_TICKS + 1,
      records: [record],
    });
    phaseIntelligenceDecay(state);
    const trace = getTraces().find(t => t.category === 'intelligence_decayed') as any;
    expect(trace).toBeDefined();
    expect(trace.crossedThreshold).toBeUndefined();
  });
});
