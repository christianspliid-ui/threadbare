import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyTrustChange,
  decayAllTrust,
  getTrust,
  TRUST_COOPERATE_DELTA,
  TRUST_DEFECT_DELTA,
  TRUST_DECAY_PER_TICK,
} from '../trustMechanics';
import { WorldGraph } from '../graph';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent-a', type: 'actor', name: 'Agent A', properties: {} });
  g.addNode({ id: 'agent-b', type: 'actor', name: 'Agent B', properties: {} });
  return g;
}

function addRelatesTo(
  g: WorldGraph,
  source: string,
  target: string,
  trust: number,
): void {
  g.addEdge({
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'relates_to',
    properties: { trust, sentiment: 0, strength: 0.5 },
  });
}

describe('trustMechanics', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = makeGraph();
  });

  describe('getTrust', () => {
    it('returns 0 when no edge exists', () => {
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBe(0);
    });

    it('returns trust value from edge', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.5);
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBe(0.5);
    });

    it('finds trust on reverse edge (bidirectional)', () => {
      addRelatesTo(graph, 'agent-b', 'agent-a', 0.7);
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBe(0.7);
    });
  });

  describe('applyTrustChange', () => {
    it('increases trust on cooperative interaction', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0);
      const result = applyTrustChange(graph, 'agent-a', 'agent-b', true);
      expect(result.oldTrust).toBe(0);
      expect(result.newTrust).toBeCloseTo(TRUST_COOPERATE_DELTA);
    });

    it('decreases trust on defection', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0);
      const result = applyTrustChange(graph, 'agent-a', 'agent-b', false);
      expect(result.oldTrust).toBe(0);
      expect(result.newTrust).toBeCloseTo(TRUST_DEFECT_DELTA);
    });

    it('clamps trust to [-1, 1]', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.99);
      const result = applyTrustChange(graph, 'agent-a', 'agent-b', true);
      expect(result.newTrust).toBeLessThanOrEqual(1);

      // Reset with very negative trust
      graph.updateEdge('edge-agent-a-agent-b', {
        properties: { trust: -0.97 },
      });
      const result2 = applyTrustChange(graph, 'agent-a', 'agent-b', false);
      expect(result2.newTrust).toBeGreaterThanOrEqual(-1);
    });

    it('returns {oldTrust: 0, newTrust: 0} when no edge exists', () => {
      const result = applyTrustChange(graph, 'agent-a', 'agent-b', true);
      expect(result).toEqual({ oldTrust: 0, newTrust: 0 });
    });

    it('creates trust field if missing on edge', () => {
      // Edge without trust property
      graph.addEdge({
        id: 'edge-no-trust',
        source: 'agent-a',
        target: 'agent-b',
        type: 'relates_to',
        properties: { sentiment: 0.3 },
      });
      const result = applyTrustChange(graph, 'agent-a', 'agent-b', true);
      expect(result.oldTrust).toBe(0);
      expect(result.newTrust).toBeCloseTo(TRUST_COOPERATE_DELTA);
      // Verify the edge now has trust
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBeCloseTo(TRUST_COOPERATE_DELTA);
    });
  });

  describe('decayAllTrust', () => {
    it('moves positive trust toward 0', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.5);
      decayAllTrust(graph);
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBeCloseTo(
        0.5 - TRUST_DECAY_PER_TICK,
      );
    });

    it('moves negative trust toward 0', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', -0.5);
      decayAllTrust(graph);
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBeCloseTo(
        -0.5 + TRUST_DECAY_PER_TICK,
      );
    });

    it('does not overshoot zero (positive)', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.001);
      decayAllTrust(graph);
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBe(0);
    });

    it('does not overshoot zero (negative)', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', -0.001);
      decayAllTrust(graph);
      expect(getTrust(graph, 'agent-a', 'agent-b')).toBe(0);
    });

    it('returns count of edges decayed', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0.5);
      const count = decayAllTrust(graph);
      expect(count).toBe(1);
    });

    it('skips edges already at zero', () => {
      addRelatesTo(graph, 'agent-a', 'agent-b', 0);
      const count = decayAllTrust(graph);
      expect(count).toBe(0);
    });
  });
});
