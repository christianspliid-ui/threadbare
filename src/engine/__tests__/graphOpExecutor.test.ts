import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

describe('executeGraphOps', () => {
  let graph: WorldGraph;
  const ctx: GraphOpContext = {
    actorId: 'agent.1',
    targetId: 'loc.market',
    locationId: 'hex.5',
  };

  beforeEach(() => {
    graph = new WorldGraph();
    resetOpCounter();
    clearTraces();
    graph.addNode({ id: 'agent.1', type: 'actor', name: 'Alice', properties: {} });
    graph.addNode({ id: 'loc.market', type: 'location', name: 'Market', properties: {} });
    graph.addNode({ id: 'hex.5', type: 'location', name: 'Hex 5', properties: {} });
  });

  afterEach(() => {
    clearTraces();
  });

  describe('add_edge operation', () => {
    it('should execute add_edge op with symbolic refs', () => {
      const ops: GraphOp[] = [
        {
          op: 'add_edge',
          edgeType: 'controls',
          source: '$actor',
          target: '$target',
          properties: { strength: 1 },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].createdId).toBeDefined();

      const edges = graph.getOutgoingEdges('agent.1', 'controls');
      expect(edges).toHaveLength(1);
      expect(edges[0].target).toBe('loc.market');
      expect(edges[0].properties.strength).toBe(1);
    });

    it('should generate unique edge IDs', () => {
      const ops: GraphOp[] = [
        {
          op: 'add_edge',
          edgeType: 'controls',
          source: '$actor',
          target: '$target',
          properties: {},
        },
        {
          op: 'add_edge',
          edgeType: 'located_at',
          source: '$actor',
          target: '$location',
          properties: {},
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].createdId).not.toBe(result.results[1].createdId);
    });
  });

  describe('add_node operation', () => {
    it('should execute add_node op', () => {
      const ops: GraphOp[] = [
        {
          op: 'add_node',
          nodeType: 'actor',
          nodeName: 'Bob',
          properties: { tier: 2 },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].createdId).toBeDefined();

      const createdId = result.results[0].createdId!;
      const node = graph.getNode(createdId);
      expect(node).toBeDefined();
      expect(node?.name).toBe('Bob');
      expect(node?.properties.tier).toBe(2);
    });

    it('should generate unique node IDs', () => {
      const ops: GraphOp[] = [
        { op: 'add_node', nodeType: 'actor', nodeName: 'A', properties: {} },
        { op: 'add_node', nodeType: 'actor', nodeName: 'B', properties: {} },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].createdId).not.toBe(result.results[1].createdId);
    });
  });

  describe('update_node operation', () => {
    it('should execute update_node op with changes field', () => {
      const ops: GraphOp[] = [
        {
          op: 'update_node',
          nodeId: '$actor',
          changes: { reputationScore: 0.8 },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].success).toBe(true);

      const node = graph.getNode('agent.1');
      expect(node?.properties.reputationScore).toBe(0.8);
    });

    it('should execute update_node op with properties field fallback', () => {
      const ops: GraphOp[] = [
        {
          op: 'update_node',
          nodeId: '$actor',
          properties: { touched: true },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      const node = graph.getNode('agent.1');
      expect(node?.properties.touched).toBe(true);
    });

    it('should fail-soft on invalid node reference', () => {
      const ops: GraphOp[] = [
        {
          op: 'update_node',
          nodeId: 'nonexistent.node',
          changes: { foo: 1 },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(false);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
      expect(result.results[0].error).toContain('Node not found');
    });
  });

  describe('remove_node operation', () => {
    it('should execute remove_node op', () => {
      const ops: GraphOp[] = [
        {
          op: 'remove_node',
          nodeId: '$target',
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].success).toBe(true);

      const node = graph.getNode('loc.market');
      expect(node).toBeUndefined();
    });

    it('should fail-soft when removing nonexistent node', () => {
      const ops: GraphOp[] = [
        {
          op: 'remove_node',
          nodeId: 'nonexistent',
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(false);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });
  });

  describe('remove_edge operation', () => {
    it('should execute remove_edge op', () => {
      // First, add an edge
      graph.addEdge({
        id: 'test_edge',
        source: 'agent.1',
        target: 'loc.market',
        type: 'controls',
        properties: {},
      });

      const ops: GraphOp[] = [
        {
          op: 'remove_edge',
          edgeId: 'test_edge',
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].success).toBe(true);

      const edge = graph.getEdge('test_edge');
      expect(edge).toBeUndefined();
    });

    it('should succeed when removing nonexistent edge (graceful)', () => {
      const ops: GraphOp[] = [
        {
          op: 'remove_edge',
          edgeId: 'nonexistent_edge',
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
    });
  });

  describe('update_edge operation', () => {
    it('should execute update_edge op', () => {
      // First, add an edge
      graph.addEdge({
        id: 'test_edge',
        source: 'agent.1',
        target: 'loc.market',
        type: 'controls',
        properties: { strength: 1 },
      });

      const ops: GraphOp[] = [
        {
          op: 'update_edge',
          edgeId: 'test_edge',
          properties: { strength: 2 },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results[0].success).toBe(true);

      const edge = graph.getEdge('test_edge');
      expect(edge?.properties.strength).toBe(2);
    });

    it('should fail-soft when updating nonexistent edge', () => {
      const ops: GraphOp[] = [
        {
          op: 'update_edge',
          edgeId: 'nonexistent_edge',
          properties: { strength: 2 },
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(false);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });
  });

  describe('batch execution', () => {
    it('should execute multiple ops in sequence', () => {
      const ops: GraphOp[] = [
        { op: 'update_node', nodeId: '$actor', changes: { reputationScore: 0.9 } },
        {
          op: 'add_edge',
          edgeType: 'controls',
          source: '$actor',
          target: '$target',
          properties: {},
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
    });

    it('should continue executing after a failed op (fail-soft)', () => {
      const ops: GraphOp[] = [
        { op: 'update_node', nodeId: 'bad.id', changes: {} },
        { op: 'update_node', nodeId: '$actor', changes: { touched: true } },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(false);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);

      const node = graph.getNode('agent.1');
      expect(node?.properties.touched).toBe(true);
    });

    it('should track mixed success/failure results', () => {
      const ops: GraphOp[] = [
        {
          op: 'add_edge',
          edgeType: 'controls',
          source: '$actor',
          target: '$target',
          properties: {},
        },
        { op: 'update_node', nodeId: 'bad.node', changes: {} },
        { op: 'update_node', nodeId: '$actor', changes: { modified: true } },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(false);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[2].success).toBe(true);
    });
  });

  describe('tracing', () => {
    it('should emit a trace when requested', () => {
      enableTracing();
      const ops: GraphOp[] = [
        { op: 'update_node', nodeId: '$actor', changes: { foo: 1 } },
      ];

      const result = executeGraphOps(graph, ops, ctx, { tick: 10, emitTrace: true });
      expect(result.allSucceeded).toBe(true);

      const traces = getTraces();
      const graphOpTrace = traces.find((t) => t.category === 'graph_op_execution');
      expect(graphOpTrace).toBeDefined();
      expect(graphOpTrace?.tick).toBe(10);
    });

    it('should not emit trace when emitTrace is false', () => {
      enableTracing();
      const ops: GraphOp[] = [
        { op: 'update_node', nodeId: '$actor', changes: { foo: 1 } },
      ];

      const beforeCount = getTraces().length;
      executeGraphOps(graph, ops, ctx, { tick: 10, emitTrace: false });
      const afterCount = getTraces().length;

      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('symbolic ref resolution', () => {
    it('should resolve $actor, $target, $location refs', () => {
      const ops: GraphOp[] = [
        {
          op: 'add_edge',
          edgeType: 'controls',
          source: '$actor',
          target: '$target',
          properties: {},
        },
        {
          op: 'add_edge',
          edgeType: 'located_at',
          source: '$actor',
          target: '$location',
          properties: {},
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);

      const controlsEdges = graph.getOutgoingEdges('agent.1', 'controls');
      expect(controlsEdges[0].target).toBe('loc.market');

      const locatedEdges = graph.getOutgoingEdges('agent.1', 'located_at');
      expect(locatedEdges[0].target).toBe('hex.5');
    });

    it('should resolve refs in update_node operations', () => {
      const ops: GraphOp[] = [
        { op: 'update_node', nodeId: '$actor', changes: { foo: 1 } },
        { op: 'update_node', nodeId: '$target', changes: { bar: 2 } },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(true);

      expect(graph.getNode('agent.1')?.properties.foo).toBe(1);
      expect(graph.getNode('loc.market')?.properties.bar).toBe(2);
    });

    it('should support extra refs via context', () => {
      const ctxWithExtras: GraphOpContext = {
        ...ctx,
        extras: { $villain: 'villain.1' },
      };

      graph.addNode({ id: 'villain.1', type: 'actor', name: 'Villain', properties: {} });

      const ops: GraphOp[] = [
        {
          op: 'add_edge',
          edgeType: 'opposes',
          source: '$actor',
          target: '$villain',
          properties: {},
        },
      ];

      const result = executeGraphOps(graph, ops, ctxWithExtras);
      expect(result.allSucceeded).toBe(true);

      const edges = graph.getOutgoingEdges('agent.1', 'opposes');
      expect(edges[0].target).toBe('villain.1');
    });
  });

  describe('edge case handling', () => {
    it('should handle add_edge with source/target mismatch gracefully', () => {
      const ops: GraphOp[] = [
        {
          op: 'add_edge',
          edgeType: 'controls',
          source: 'nonexistent.source',
          target: '$target',
          properties: {},
        },
      ];

      const result = executeGraphOps(graph, ops, ctx);
      expect(result.allSucceeded).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });

    it('should handle unknown op types gracefully', () => {
      const badOp = {
        op: 'unknown_op',
      } as unknown as GraphOp;

      const ops: GraphOp[] = [badOp];
      const result = executeGraphOps(graph, ops, ctx);

      expect(result.allSucceeded).toBe(false);
      expect(result.results[0].error).toContain('Unknown op type');
    });

    it('should handle empty op list', () => {
      const result = executeGraphOps(graph, [], ctx);
      expect(result.allSucceeded).toBe(true);
      expect(result.results).toHaveLength(0);
    });
  });
});
