/**
 * Test trace instrumentation for dilemma resolution.
 * Verifies that resolveDilemma emits dilemma_resolution traces.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  enableTracing,
  disableTracing,
  clearTraces,
  getTraces,
  getTracesForAgent,
} from '../traceBuffer';
import { resolveDilemma } from '../disposition';
import type { DilemmaResolutionTrace } from '../../types/trace';

describe('traceBuffer-dilemma: Dilemma Resolution Instrumentation', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('should emit dilemma_resolution trace when resolving dilemma', () => {
    const result = resolveDilemma(
      'actor-1',
      'actor-2',
      'tit-for-tat',
      'always-cooperate',
      [],
      [],
      100,
      'test_conflict',
      0.5
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace).toBeDefined();
    expect(dilemmaTrace?.tick).toBe(100);
    expect(dilemmaTrace?.category).toBe('dilemma_resolution');
    expect(dilemmaTrace?.agentId).toBe('actor-1');
    expect(dilemmaTrace?.targetId).toBe('actor-2');
  });

  it('should include cooperation strategies in trace', () => {
    resolveDilemma(
      'actor-1',
      'actor-2',
      'grudger',
      'pavlov',
      [],
      [],
      200,
      'faction_dispute',
      0.7
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace?.actorStrategy).toBe('grudger');
    expect(dilemmaTrace?.targetStrategy).toBe('pavlov');
  });

  it('should include actor and target moves in trace', () => {
    resolveDilemma(
      'actor-1',
      'actor-2',
      'always-cooperate',
      'always-defect',
      [],
      [],
      300,
      'test',
      0.3
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace?.actorMove).toBeDefined();
    expect(['cooperate', 'defect']).toContain(dilemmaTrace?.actorMove);
    expect(dilemmaTrace?.targetMove).toBeDefined();
    expect(['cooperate', 'defect']).toContain(dilemmaTrace?.targetMove);
  });

  it('should include all four possible outcomes in trace', () => {
    const outcomes = new Set<string>();

    // mutual_trust: both cooperate (always-cooperate vs always-cooperate)
    resolveDilemma(
      'a1',
      'a2',
      'always-cooperate',
      'always-cooperate',
      [],
      [],
      400,
      'test',
      0.5
    );

    // betrayed: cooperate vs defect
    resolveDilemma(
      'a1',
      'a2',
      'always-cooperate',
      'always-defect',
      [],
      [],
      401,
      'test',
      0.5
    );

    // exploitation: defect vs cooperate
    resolveDilemma(
      'a1',
      'a2',
      'always-defect',
      'always-cooperate',
      [],
      [],
      402,
      'test',
      0.5
    );

    // mutual_distrust: both defect
    resolveDilemma(
      'a1',
      'a2',
      'always-defect',
      'always-defect',
      [],
      [],
      403,
      'test',
      0.5
    );

    const traces = getTraces().filter(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace[];

    traces.forEach((t) => {
      expect(['mutual_trust', 'betrayed', 'exploitation', 'mutual_distrust']).toContain(
        t.outcome
      );
      outcomes.add(t.outcome);
    });

    // All four outcomes should be present
    expect(outcomes.size).toBe(4);
  });

  it('should include stakes value in trace', () => {
    resolveDilemma(
      'actor-1',
      'actor-2',
      'tit-for-tat',
      'grudger',
      [],
      [],
      500,
      'test',
      0.75
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace?.stakes).toBe(0.75);
    expect(typeof dilemmaTrace?.stakes).toBe('number');
  });

  it('should include summary with actor and target info', () => {
    resolveDilemma(
      'Kael',
      'Mira',
      'tit-for-tat',
      'grudger',
      [],
      [],
      600,
      'test_context',
      0.5
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace?.summary).toBeDefined();
    expect(dilemmaTrace?.summary).toMatch(/Kael|actor/i);
    expect(dilemmaTrace?.summary).toMatch(/Mira|target/i);
  });

  it('should not emit trace when tracing disabled', () => {
    disableTracing();

    resolveDilemma(
      'actor-1',
      'actor-2',
      'tit-for-tat',
      'always-cooperate',
      [],
      [],
      700,
      'test',
      0.5
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find((t) => t.category === 'dilemma_resolution');

    expect(dilemmaTrace).toBeUndefined();
  });

  it('should filter traces by actor ID', () => {
    resolveDilemma(
      'actor-1',
      'actor-2',
      'tit-for-tat',
      'always-cooperate',
      [],
      [],
      800,
      'test',
      0.5
    );

    resolveDilemma(
      'actor-2',
      'actor-1',
      'grudger',
      'pavlov',
      [],
      [],
      801,
      'test',
      0.5
    );

    const actor1Traces = getTracesForAgent('actor-1');
    const actor2Traces = getTracesForAgent('actor-2');

    expect(actor1Traces.length).toBeGreaterThan(0);
    expect(actor2Traces.length).toBeGreaterThan(0);
    expect(actor1Traces.every((t) => t.agentId === 'actor-1')).toBe(true);
    expect(actor2Traces.every((t) => t.agentId === 'actor-2')).toBe(true);
  });

  it('should include sentiment delta in trace', () => {
    resolveDilemma(
      'actor-1',
      'actor-2',
      'tit-for-tat',
      'always-cooperate',
      [],
      [],
      900,
      'test',
      0.5
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace?.sentimentDelta).toBeDefined();
    expect(typeof dilemmaTrace?.sentimentDelta).toBe('number');
  });

  it('should include reputation deltas for both actors in trace', () => {
    resolveDilemma(
      'actor-1',
      'actor-2',
      'always-cooperate',
      'always-cooperate',
      [],
      [],
      1000,
      'test',
      0.5
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace?.reputationDeltas).toBeDefined();
    expect(dilemmaTrace?.reputationDeltas?.actor).toBeDefined();
    expect(dilemmaTrace?.reputationDeltas?.target).toBeDefined();
    expect(typeof dilemmaTrace?.reputationDeltas?.actor).toBe('number');
    expect(typeof dilemmaTrace?.reputationDeltas?.target).toBe('number');
  });

  it('should handle interaction history in dilemma resolution', () => {
    const actorHistory = [
      {
        tick: 90,
        actorMove: 'cooperate' as const,
        targetMove: 'cooperate' as const,
        context: 'prior_trade',
        stakes: 'low' as const,
      },
    ];

    const targetHistory = [
      {
        tick: 90,
        actorMove: 'cooperate' as const,
        targetMove: 'cooperate' as const,
        context: 'prior_trade',
        stakes: 'low' as const,
      },
    ];

    resolveDilemma(
      'actor-1',
      'actor-2',
      'tit-for-tat',
      'grudger',
      actorHistory,
      targetHistory,
      950,
      'follow_up',
      0.6
    );

    const traces = getTraces();
    const dilemmaTrace = traces.find(
      (t) => t.category === 'dilemma_resolution'
    ) as DilemmaResolutionTrace | undefined;

    expect(dilemmaTrace).toBeDefined();
    expect(dilemmaTrace?.actorMove).toBe('cooperate');
    expect(dilemmaTrace?.targetMove).toBe('cooperate');
    expect(dilemmaTrace?.outcome).toBe('mutual_trust');
  });
});
