import { describe, it, expect, beforeEach } from 'vitest';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { WorldGraph } from '../graph';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'loc_1', type: 'location', name: 'Test Village', properties: { unrest: 30, magicalSaturation: 0.1 } });
  return g;
}

beforeEach(() => {
  resetOpCounter();
});

describe('graphOpExecutor — relative update_node changes', () => {
  it('adds positive delta to numeric property (+20)', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [
      { op: 'update_node', nodeId: 'loc_1', changes: { unrest: '+20' } },
    ], { actorId: 'actor_0', targetId: 'loc_1', locationId: 'loc_1', tick: 1 });

    const node = graph.getNode('loc_1');
    expect(node?.properties.unrest).toBe(50);
  });

  it('subtracts negative delta from numeric property (-10)', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [
      { op: 'update_node', nodeId: 'loc_1', changes: { unrest: '-10' } },
    ], { actorId: 'actor_0', targetId: 'loc_1', locationId: 'loc_1', tick: 1 });

    const node = graph.getNode('loc_1');
    expect(node?.properties.unrest).toBe(20);
  });

  it('adds float delta to float property (+0.15)', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [
      { op: 'update_node', nodeId: 'loc_1', changes: { magicalSaturation: '+0.15' } },
    ], { actorId: 'actor_0', targetId: 'loc_1', locationId: 'loc_1', tick: 1 });

    const node = graph.getNode('loc_1');
    expect(node?.properties.magicalSaturation).toBeCloseTo(0.25, 5);
  });

  it('initializes missing property from 0 when adding delta', () => {
    const graph = makeGraph();
    // magicLevel not present initially
    executeGraphOps(graph, [
      { op: 'update_node', nodeId: 'loc_1', changes: { magicLevel: '+5' } },
    ], { actorId: 'actor_0', targetId: 'loc_1', locationId: 'loc_1', tick: 1 });

    const node = graph.getNode('loc_1');
    expect(node?.properties.magicLevel).toBe(5);
  });

  it('direct replacement still works for non-relative values', () => {
    const graph = makeGraph();
    executeGraphOps(graph, [
      { op: 'update_node', nodeId: 'loc_1', changes: { unrest: 99 } },
    ], { actorId: 'actor_0', targetId: 'loc_1', locationId: 'loc_1', tick: 1 });

    const node = graph.getNode('loc_1');
    expect(node?.properties.unrest).toBe(99);
  });

  it('skips non-numeric relative string (fail-soft, no crash)', () => {
    const graph = makeGraph();
    // This should not throw — just skip the bad value
    expect(() => {
      executeGraphOps(graph, [
        { op: 'update_node', nodeId: 'loc_1', changes: { unrest: '+abc' } },
      ], { actorId: 'actor_0', targetId: 'loc_1', locationId: 'loc_1', tick: 1 });
    }).not.toThrow();

    // unrest should remain unchanged
    const node = graph.getNode('loc_1');
    expect(node?.properties.unrest).toBe(30);
  });
});
