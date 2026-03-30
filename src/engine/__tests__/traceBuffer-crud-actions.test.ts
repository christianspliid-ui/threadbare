import { describe, it, expect, beforeEach } from 'vitest';
import { emitTrace, getTraces, clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { ActionExecutionTrace } from '../../types/trace';

describe('action_execution trace', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  it('should accept action_execution trace entries', () => {
    const trace: ActionExecutionTrace = {
      id: 1,
      category: 'action_execution',
      tick: 10,
      timestamp: Date.now(),
      summary: 'Action resolved',
      agentId: 'agent.1',
      templateId: 'action.gold.trade',
      actorId: 'agent.1',
      outcome: 'success',
      opsApplied: 2,
      opsFailed: 0,
      duration: 3,
    };

    emitTrace(trace);

    const traces = getTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].category).toBe('action_execution');
    expect((traces[0] as ActionExecutionTrace).outcome).toBe('success');
    expect((traces[0] as ActionExecutionTrace).opsApplied).toBe(2);
  });
});
