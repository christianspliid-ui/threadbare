import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';

describe('executeGraphOps - apply_influence', () => {
  let graph: WorldGraph;
  let ctx: GraphOpContext;

  beforeEach(() => {
    resetOpCounter();
    graph = new WorldGraph();
    graph.addNode({ id: 'actor-1', type: 'actor', name: 'Test Actor', properties: {} });
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Test Location', properties: {} });
    ctx = { actorId: 'actor-1', targetId: 'actor-1', locationId: 'loc-1' };
  });

  it('applies influence entry to target actor node', () => {
    const ops: GraphOp[] = [{
      op: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'inspire_intervention',
        sphere: 'force',
        initialStrength: 1.0,
        decayRate: 0.92,
        minimumStrength: 0.05,
        maxDuration: 30,
        valueDrifts: { courage_prudence: 0.2 },
      },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor-1');
    const influences = actor?.properties?.divineInfluences ?? [];
    expect(influences).toHaveLength(1);
    expect((influences as any[])[0].interventionType).toBe('inspire_intervention');
    expect((influences as any[])[0].initialStrength).toBe(1.0);
  });

  it('appends to existing influences without replacing', () => {
    // Pre-populate one influence
    graph.updateNode('actor-1', {
      properties: {
        divineInfluences: [{
          id: 'existing-1',
          interventionType: 'dream',
          sphere: 'mind',
          tickApplied: 5,
          initialStrength: 0.8,
          decayRate: 0.90,
          minimumStrength: 0.05,
          maxDuration: 20,
        }],
      },
    });

    const ops: GraphOp[] = [{
      op: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'persuade',
        sphere: 'spirit',
        initialStrength: 1.0,
        decayRate: 0.92,
        minimumStrength: 0.05,
        maxDuration: 25,
      },
    }];

    const result = executeGraphOps(graph, ops, ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor-1');
    const influences = actor?.properties?.divineInfluences ?? [];
    expect((influences as any[]).length).toBe(2);
  });

  it('resolves symbolic ref for target', () => {
    graph.addNode({ id: 'other-actor', type: 'actor', name: 'Other', properties: {} });
    const ctxWithTarget = { ...ctx, targetId: 'other-actor' };

    const ops: GraphOp[] = [{
      op: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'omen',
        sphere: 'time',
        initialStrength: 0.6,
        decayRate: 0.88,
        minimumStrength: 0.05,
        maxDuration: 15,
      },
    }];

    const result = executeGraphOps(graph, ops, ctxWithTarget);
    expect(result.allSucceeded).toBe(true);

    const otherActor = graph.getNode('other-actor');
    expect((otherActor?.properties?.divineInfluences as any[])?.length).toBe(1);
  });

  it('fails soft when target node does not exist', () => {
    const ctxBadTarget = { ...ctx, targetId: 'nonexistent' };
    const ops: GraphOp[] = [{
      op: 'apply_influence',
      target: '$target',
      influence: {
        interventionType: 'dream',
        sphere: 'mind',
        initialStrength: 1.0,
        decayRate: 0.9,
        minimumStrength: 0.05,
        maxDuration: 20,
      },
    }];

    const result = executeGraphOps(graph, ops, ctxBadTarget);
    expect(result.allSucceeded).toBe(false);
    expect(result.results[0].error).toBeDefined();
  });
});
