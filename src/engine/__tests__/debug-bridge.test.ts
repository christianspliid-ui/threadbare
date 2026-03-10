import { describe, it, expect, beforeEach } from 'vitest';

// We test the bridge by directly importing and calling the functions it exposes,
// since the bridge itself uses dynamic imports to the same modules.
import {
  enableTracing,
  disableTracing,
  isTracingEnabled,
  getTraces,
  clearTraces,
  emitTrace,
} from '../traceBuffer';

describe('debug-bridge contract', () => {
  beforeEach(() => {
    disableTracing();
    clearTraces();
  });

  it('getTraces returns readonly array of TraceEntry', () => {
    enableTracing();
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'test trace',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    const traces = getTraces();
    expect(traces.length).toBe(1);
    expect(traces[0].summary).toBe('test trace');
  });

  it('enableTracing/disableTracing toggle tracing state', () => {
    expect(isTracingEnabled()).toBe(false);
    enableTracing();
    expect(isTracingEnabled()).toBe(true);
    disableTracing();
    expect(isTracingEnabled()).toBe(false);
  });

  it('clearTraces empties the buffer', () => {
    enableTracing();
    emitTrace({
      tick: 1,
      category: 'tick_summary',
      summary: 'to be cleared',
      phaseEventCounts: {},
      agentsProcessed: 0,
      doomStage: 0,
      essenceTotal: 0,
      mandateProgress: 0,
    } as any);
    expect(getTraces().length).toBe(1);
    clearTraces();
    expect(getTraces().length).toBe(0);
  });
});
