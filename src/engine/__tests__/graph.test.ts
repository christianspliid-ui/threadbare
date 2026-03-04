import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';

describe('WorldGraph', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  describe('node operations', () => {
    it('adds and retrieves a node by ID', () => {
      const node: GraphNode = {
        id: 'actor.thorin',
        type: 'actor',
        name: 'Thorin',
        properties: { actorType: 'individual' },
      };
      graph.addNode(node);
      expect(graph.getNode('actor.thorin')).toEqual(node);
    });

    it('returns undefined for missing node', () => {
      expect(graph.getNode('nonexistent')).toBeUndefined();
    });

    it('removes a node and its connected edges', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
      graph.addEdge({
        id: 'e1', source: 'a', target: 'b',
        type: 'relates_to', properties: {},
      });
      graph.removeNode('a');
      expect(graph.getNode('a')).toBeUndefined();
      expect(graph.getEdge('e1')).toBeUndefined();
    });

    it('updates node properties immutably', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: { hp: 10 } });
      graph.updateNode('a', { properties: { hp: 5 } });
      expect(graph.getNode('a')!.properties.hp).toBe(5);
    });

    it('queries nodes by type', () => {
      graph.addNode({ id: 'a1', type: 'actor', name: 'A1', properties: {} });
      graph.addNode({ id: 'a2', type: 'actor', name: 'A2', properties: {} });
      graph.addNode({ id: 'loc1', type: 'location', name: 'L1', properties: {} });
      expect(graph.getNodesByType('actor')).toHaveLength(2);
      expect(graph.getNodesByType('location')).toHaveLength(1);
    });

    it('throws on duplicate node ID', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      expect(() =>
        graph.addNode({ id: 'a', type: 'actor', name: 'A2', properties: {} })
      ).toThrow();
    });
  });

  describe('edge operations', () => {
    beforeEach(() => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
    });

    it('adds and retrieves an edge by ID', () => {
      const edge: GraphEdge = {
        id: 'e1', source: 'a', target: 'b',
        type: 'relates_to', properties: { sentiment: 'feared' },
      };
      graph.addEdge(edge);
      expect(graph.getEdge('e1')).toEqual(edge);
    });

    it('returns undefined for missing edge', () => {
      expect(graph.getEdge('nonexistent')).toBeUndefined();
    });

    it('removes an edge', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      graph.removeEdge('e1');
      expect(graph.getEdge('e1')).toBeUndefined();
    });

    it('queries outgoing edges', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      expect(graph.getOutgoingEdges('a')).toHaveLength(1);
      expect(graph.getOutgoingEdges('b')).toHaveLength(0);
    });

    it('queries incoming edges', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      expect(graph.getIncomingEdges('b')).toHaveLength(1);
      expect(graph.getIncomingEdges('a')).toHaveLength(0);
    });

    it('queries edges by type', () => {
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      graph.addEdge({ id: 'e2', source: 'a', target: 'b', type: 'has_trait', properties: {} });
      expect(graph.getEdgesByType('relates_to')).toHaveLength(1);
    });

    it('throws when adding edge with missing source/target node', () => {
      expect(() =>
        graph.addEdge({ id: 'e1', source: 'a', target: 'missing', type: 'relates_to', properties: {} })
      ).toThrow();
    });
  });

  describe('neighborhood queries', () => {
    beforeEach(() => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
      graph.addNode({ id: 'c', type: 'actor', name: 'C', properties: {} });
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      graph.addEdge({ id: 'e2', source: 'a', target: 'c', type: 'member_of', properties: {} });
    });

    it('gets all edges for a node (incoming + outgoing)', () => {
      expect(graph.getAllEdgesForNode('a')).toHaveLength(2);
    });

    it('gets neighbors (connected node IDs)', () => {
      const neighbors = graph.getNeighborIds('a');
      expect(neighbors).toContain('b');
      expect(neighbors).toContain('c');
      expect(neighbors).toHaveLength(2);
    });

    it('gets outgoing neighbors filtered by edge type', () => {
      const members = graph.getOutgoingEdges('a', 'member_of');
      expect(members).toHaveLength(1);
      expect(members[0].target).toBe('c');
    });
  });

  describe('batch mutations', () => {
    it('applies a list of mutations atomically', () => {
      const mutations = [
        { type: 'add_node' as const, data: { id: 'x', type: 'actor' as const, name: 'X', properties: {} } },
        { type: 'add_node' as const, data: { id: 'y', type: 'actor' as const, name: 'Y', properties: {} } },
      ];
      graph.applyMutations(mutations);
      expect(graph.getNode('x')).toBeDefined();
      expect(graph.getNode('y')).toBeDefined();
    });
  });

  describe('stats', () => {
    it('reports node and edge counts', () => {
      graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: {} });
      graph.addNode({ id: 'b', type: 'actor', name: 'B', properties: {} });
      graph.addEdge({ id: 'e1', source: 'a', target: 'b', type: 'relates_to', properties: {} });
      const stats = graph.getStats();
      expect(stats.nodeCount).toBe(2);
      expect(stats.edgeCount).toBe(1);
    });
  });
});
