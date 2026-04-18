import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  PORTFOLIO_MAX_PINNED,
  isPortfolioPinned,
  getPortfolioPinnedAgents,
  pinAgent,
  unpinAgent,
} from '../portfolioManager';

function makeActor(graph: WorldGraph, id: string, name: string) {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
  return id;
}

describe('portfolioManager', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('isPortfolioPinned returns false by default', () => {
    const id = makeActor(graph, 'a1', 'Alice');
    const node = graph.getNode(id)!;
    expect(isPortfolioPinned(node)).toBe(false);
  });

  it('pinAgent marks agent as pinned', () => {
    const id = makeActor(graph, 'a1', 'Alice');
    const result = pinAgent(graph, id, 0);
    expect(result.success).toBe(true);
    expect(isPortfolioPinned(graph.getNode(id)!)).toBe(true);
  });

  it('unpinAgent clears the pin flag', () => {
    const id = makeActor(graph, 'a1', 'Alice');
    pinAgent(graph, id, 0);
    const result = unpinAgent(graph, id, 0);
    expect(result.success).toBe(true);
    expect(isPortfolioPinned(graph.getNode(id)!)).toBe(false);
  });

  it('pinAgent is idempotent — second pin returns failure with count unchanged', () => {
    const id = makeActor(graph, 'a1', 'Alice');
    pinAgent(graph, id, 0);
    const second = pinAgent(graph, id, 0);
    expect(second.success).toBe(false);
    expect(getPortfolioPinnedAgents(graph)).toHaveLength(1);
  });

  it('unpinAgent on non-pinned agent returns failure', () => {
    const id = makeActor(graph, 'a1', 'Alice');
    const result = unpinAgent(graph, id, 0);
    expect(result.success).toBe(false);
  });

  it('pinAgent returns failure for unknown agentId', () => {
    const result = pinAgent(graph, 'nonexistent', 0);
    expect(result.success).toBe(false);
  });

  it('getPortfolioPinnedAgents returns only pinned agents', () => {
    makeActor(graph, 'a1', 'Alice');
    const id2 = makeActor(graph, 'a2', 'Bob');
    makeActor(graph, 'a3', 'Carol');
    pinAgent(graph, id2, 0);
    const pinned = getPortfolioPinnedAgents(graph);
    expect(pinned).toHaveLength(1);
    expect(pinned[0].id).toBe('a2');
  });

  it('enforces PORTFOLIO_MAX_PINNED cap', () => {
    for (let i = 0; i < PORTFOLIO_MAX_PINNED; i++) {
      const id = makeActor(graph, `a${i}`, `Agent ${i}`);
      const result = pinAgent(graph, id, 0);
      expect(result.success).toBe(true);
    }
    const overflow = makeActor(graph, 'overflow', 'Overflow Agent');
    const result = pinAgent(graph, overflow, 0);
    expect(result.success).toBe(false);
    expect(result.pinnedCount).toBe(PORTFOLIO_MAX_PINNED);
  });

  it('unpinning frees a slot for a new pin', () => {
    for (let i = 0; i < PORTFOLIO_MAX_PINNED; i++) {
      makeActor(graph, `a${i}`, `Agent ${i}`);
      pinAgent(graph, `a${i}`, 0);
    }
    unpinAgent(graph, 'a0', 0);
    const overflow = makeActor(graph, 'new', 'New Agent');
    const result = pinAgent(graph, overflow, 0);
    expect(result.success).toBe(true);
  });

  it('pin count in result reflects actual pinned count', () => {
    const id1 = makeActor(graph, 'a1', 'Alice');
    const id2 = makeActor(graph, 'a2', 'Bob');
    const r1 = pinAgent(graph, id1, 0);
    expect(r1.pinnedCount).toBe(1);
    const r2 = pinAgent(graph, id2, 0);
    expect(r2.pinnedCount).toBe(2);
    const r3 = unpinAgent(graph, id1, 0);
    expect(r3.pinnedCount).toBe(1);
  });
});
