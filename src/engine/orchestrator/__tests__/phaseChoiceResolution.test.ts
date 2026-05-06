import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { phaseChoiceResolution } from '../phaseChoiceResolution';
import { WorldGraph } from '../../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import type { GameState, PendingChoiceCommit, ArchetypeDrift } from '../../../types/gameState';

function makeState(
  commits: PendingChoiceCommit[],
  drift: ArchetypeDrift[] = [],
  graph?: WorldGraph,
): GameState {
  return {
    tick: 20,
    seed: 1,
    archetypeDrift: drift,
    pendingChoiceCommits: commits,
    graph: graph ?? new WorldGraph(),
  } as unknown as GameState;
}

function makeCommit(overrides: Partial<PendingChoiceCommit> = {}): PendingChoiceCommit {
  return {
    agentId: 'agt',
    encounterId: 'enc-1',
    beatIndex: 0,
    reach: 'iron',
    cost: 'small_breath',
    moralAxisPole: 'virtue',
    effectiveProbability: 0.8,
    driftMagnitude: 0.05,
    ...overrides,
  };
}

function constantPrng(value: number): () => number {
  return () => value;
}

describe('phaseChoiceResolution', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  describe('empty commits', () => {
    it('returns unchanged drift and zero resolvedCount for no commits', () => {
      const initialDrift: ArchetypeDrift[] = [
        { agentId: 'agt', axisId: 'iron', fromPosition: 0.3, toPosition: 0.3, lastUpdatedTick: 1 },
      ];
      const result = phaseChoiceResolution(makeState([], initialDrift), constantPrng(0.5));
      expect(result.resolvedCount).toBe(0);
      expect(result.archetypeDrift).toBe(initialDrift);
      expect(result.pendingChoiceCommits).toHaveLength(0);
    });

    it('handles undefined pendingChoiceCommits gracefully', () => {
      const state = makeState([]);
      (state as unknown as { pendingChoiceCommits: undefined }).pendingChoiceCommits = undefined;
      expect(() => phaseChoiceResolution(state, constantPrng(0.5))).not.toThrow();
    });
  });

  describe('single commit round-trip', () => {
    it('resolves one commit and increments resolvedCount', () => {
      const result = phaseChoiceResolution(
        makeState([makeCommit()]),
        constantPrng(0.3), // success roll
      );
      expect(result.resolvedCount).toBe(1);
    });

    it('clears pendingChoiceCommits after resolution', () => {
      const result = phaseChoiceResolution(
        makeState([makeCommit(), makeCommit({ agentId: 'agt-b' })]),
        constantPrng(0.5),
      );
      expect(result.pendingChoiceCommits).toHaveLength(0);
    });

    it('applies positive drift for virtue pole', () => {
      const result = phaseChoiceResolution(
        makeState([makeCommit({ moralAxisPole: 'virtue', driftMagnitude: 0.05, reach: 'iron' })]),
        constantPrng(0.3),
      );
      const entry = result.archetypeDrift.find(d => d.agentId === 'agt' && d.axisId === 'iron');
      expect(entry?.toPosition).toBeCloseTo(0.05, 10);
    });

    it('applies negative drift for flaw pole', () => {
      const result = phaseChoiceResolution(
        makeState([makeCommit({ moralAxisPole: 'flaw', driftMagnitude: 0.05, reach: 'iron' })]),
        constantPrng(0.3),
      );
      const entry = result.archetypeDrift.find(d => d.agentId === 'agt' && d.axisId === 'iron');
      expect(entry?.toPosition).toBeCloseTo(-0.05, 10);
    });
  });

  describe('trace emission', () => {
    it('emits a choice_resolved trace for each commit', () => {
      phaseChoiceResolution(makeState([makeCommit(), makeCommit({ agentId: 'agt-b' })]), constantPrng(0.5));
      const traces = getTraces();
      const resolved = traces.filter(t => t.category === 'choice_resolved');
      expect(resolved).toHaveLength(2);
    });

    it('choice_resolved trace carries correct encounterId and agentId', () => {
      phaseChoiceResolution(
        makeState([makeCommit({ encounterId: 'enc-99', agentId: 'specific-agt' })]),
        constantPrng(0.2),
      );
      const trace = getTraces().find(t => t.category === 'choice_resolved') as Record<string, unknown>;
      expect(trace).toBeDefined();
      expect(trace['encounterId']).toBe('enc-99');
      expect(trace['agentId']).toBe('specific-agt');
    });

    it('emits drift_threshold_crossed traces when crossing a band', () => {
      // magnitude 0.90 from 0 crosses soft, banner, becoming thresholds
      phaseChoiceResolution(
        makeState([makeCommit({ driftMagnitude: 0.90, moralAxisPole: 'virtue' })]),
        constantPrng(0.2), // success roll
      );
      const traces = getTraces();
      const thresholdTraces = traces.filter(t => t.category === 'drift_threshold_crossed');
      expect(thresholdTraces.length).toBeGreaterThanOrEqual(3);
    });

    it('emits no drift threshold traces when drift stays in a single band', () => {
      // small magnitude starting at 0 — stays below 0.30
      phaseChoiceResolution(
        makeState([makeCommit({ driftMagnitude: 0.05, moralAxisPole: 'virtue' })]),
        constantPrng(0.2),
      );
      const thresholdTraces = getTraces().filter(t => t.category === 'drift_threshold_crossed');
      expect(thresholdTraces).toHaveLength(0);
    });
  });

  describe('item consumption', () => {
    it('removes the possesses edge when consumesItemId is set and item is present', () => {
      const graph = new WorldGraph();
      graph.addNode({ id: 'agt', type: 'actor', properties: {} });
      graph.addNode({ id: 'item-1', type: 'artifact', properties: {} });
      graph.addEdge({ id: 'edge-1', type: 'possesses', source: 'agt', target: 'item-1', properties: {} });

      phaseChoiceResolution(
        makeState([makeCommit({ consumesItemId: 'item-1' })], [], graph),
        constantPrng(0.2),
      );

      expect(graph.getOutgoingEdges('agt', 'possesses')).toHaveLength(0);
    });

    it('does not throw when consumesItemId references a missing item (fail-soft)', () => {
      const graph = new WorldGraph();
      graph.addNode({ id: 'agt', type: 'actor', properties: {} });
      expect(() =>
        phaseChoiceResolution(
          makeState([makeCommit({ consumesItemId: 'ghost-item' })], [], graph),
          constantPrng(0.2),
        ),
      ).not.toThrow();
    });
  });

  describe('multiple commits accumulate drift correctly', () => {
    it('accumulates drift from two virtue commits on the same axis', () => {
      const commits: PendingChoiceCommit[] = [
        makeCommit({ agentId: 'agt', reach: 'iron', driftMagnitude: 0.05, moralAxisPole: 'virtue' }),
        makeCommit({ agentId: 'agt', reach: 'iron', driftMagnitude: 0.03, moralAxisPole: 'virtue' }),
      ];
      const result = phaseChoiceResolution(makeState(commits), constantPrng(0.2));
      const entry = result.archetypeDrift.find(d => d.agentId === 'agt' && d.axisId === 'iron');
      expect(entry?.toPosition).toBeCloseTo(0.08, 10);
    });

    it('keeps axes for different agents independent', () => {
      const commits: PendingChoiceCommit[] = [
        makeCommit({ agentId: 'agt-a', reach: 'iron', driftMagnitude: 0.1, moralAxisPole: 'virtue' }),
        makeCommit({ agentId: 'agt-b', reach: 'iron', driftMagnitude: 0.2, moralAxisPole: 'flaw' }),
      ];
      const result = phaseChoiceResolution(makeState(commits), constantPrng(0.2));
      expect(result.archetypeDrift.find(d => d.agentId === 'agt-a')?.toPosition).toBeCloseTo(0.1, 10);
      expect(result.archetypeDrift.find(d => d.agentId === 'agt-b')?.toPosition).toBeCloseTo(-0.2, 10);
    });
  });
});
