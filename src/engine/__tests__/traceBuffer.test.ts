import { describe, it, expect, beforeEach } from 'vitest';
import {
  emitTrace,
  getTraces,
  getTracesForAgent,
  clearTraces,
  enableTracing,
  disableTracing,
  isTracingEnabled,
} from '../traceBuffer';
import type {
  TickSummaryTrace,
  ActionSelectionTrace,
} from '../../types/trace';

describe('traceBuffer', () => {
  beforeEach(() => {
    disableTracing();
    clearTraces();
    enableTracing();
  });

  it('emits and retrieves trace entries', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'Tick 1 done',
      phaseEventCounts: {},
      agentsProcessed: 3,
      doomStage: 0,
      essenceTotal: 50,
      mandateProgress: 0,
    } as TickSummaryTrace);

    const traces = getTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].summary).toBe('Tick 1 done');
    expect(traces[0].id).toBe(0);
    expect(traces[0].timestamp).toBeGreaterThan(0);
  });

  it('auto-increments id', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'A',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    emitTrace({
      tick: 2,
      category: 'tick_summary',
      summary: 'B',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    const traces = getTraces();
    expect(traces[0].id).toBe(0);
    expect(traces[1].id).toBe(1);
  });

  it('does nothing when tracing is disabled', () => {
    disableTracing();
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'X',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    enableTracing();
    expect(getTraces()).toHaveLength(0);
  });

  it('isTracingEnabled reflects state', () => {
    expect(isTracingEnabled()).toBe(true);
    disableTracing();
    expect(isTracingEnabled()).toBe(false);
    enableTracing();
    expect(isTracingEnabled()).toBe(true);
  });

  it('getTracesForAgent filters by agentId', () => {
    emitTrace({
      tick: 1,
      category: 'action_selection',
      agentId: 'a1',
      summary: 'A1',
      stages: [],
      finalPick: {
        actionId: 'act1',
        actionName: 'attack',
        score: 0.8,
        probability: 0.9,
        roll: 0.85,
      },
    } as ActionSelectionTrace);

    emitTrace({
      tick: 1,
      category: 'action_selection',
      agentId: 'a2',
      summary: 'A2',
      stages: [],
      finalPick: {
        actionId: 'act2',
        actionName: 'move',
        score: 0.7,
        probability: 0.8,
        roll: 0.75,
      },
    } as ActionSelectionTrace);

    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'Tick',
      phaseEventCounts: {},
      agentsProcessed: 2,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    const a1Traces = getTracesForAgent('a1');
    expect(a1Traces).toHaveLength(1);
    expect(a1Traces[0].summary).toBe('A1');
  });

  it('clearTraces empties the buffer', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'X',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    expect(getTraces()).toHaveLength(1);
    clearTraces();
    expect(getTraces()).toHaveLength(0);
  });

  it('buffer evicts oldest entries when exceeding BUFFER_SIZE', () => {
    for (let i = 0; i < 510; i++) {
      emitTrace({
        tick: i,
        category: 'tick_summary',
        summary: `Tick ${i}`,
        phaseEventCounts: {},
        agentsProcessed: 0,
        doomStage: 0,
        essenceTotal: 0,
        mandateProgress: 0,
      } as TickSummaryTrace);
    }

    const traces = getTraces();
    expect(traces.length).toBeLessThanOrEqual(500);
    // Oldest should have been evicted
    expect(traces[0].tick).toBeGreaterThan(0);
  });

  it('clearTraces also resets nextId counter', () => {
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'First',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    clearTraces();

    emitTrace({
      tick: 2,
      category: 'tick_summary',
      summary: 'Second',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as TickSummaryTrace);

    expect(getTraces()[0].id).toBe(0);
  });
});
