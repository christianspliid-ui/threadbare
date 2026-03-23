import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { initMovementState, tickMovement } from '../movementExecution';
import type { GraphNode } from '../../types/graph';
import type { MovementState } from '../../types/movement';

describe('Movement Execution', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  describe('initMovementState', () => {
    it('creates correct initial state with given parameters', () => {
      const destination = 'hex_b';
      const path = ['hex_b', 'hex_c', 'hex_d'];
      const firstEdgeCost = 1;
      const currentTick = 100;

      const state = initMovementState(destination, path, firstEdgeCost, currentTick);

      expect(state.destinationId).toBe(destination);
      expect(state.movementQueue).toEqual(['hex_b', 'hex_c', 'hex_d']);
      expect(state.ticksAccumulated).toBe(0);
      expect(state.currentEdgeCost).toBe(firstEdgeCost);
      expect(state.lastDecisionTick).toBe(currentTick);
      expect(state.movementHistory).toEqual([]);
    });

    it('path is copied (not referenced)', () => {
      const path = ['hex_b', 'hex_c'];
      const state = initMovementState('hex_b', path, 1, 0);

      // Mutate original
      path.push('hex_d');

      // State should be unaffected
      expect(state.movementQueue).toEqual(['hex_b', 'hex_c']);
    });
  });

  describe('tickMovement', () => {
    beforeEach(() => {
      // Setup basic test graph: hex_a (grassland) and hex_b (grassland)
      const hexA: GraphNode = {
        id: 'hex_a',
        type: 'location',
        name: 'Hex A',
        properties: { terrain: 'grassland', hexCol: 0, hexRow: 0 },
      };
      const hexB: GraphNode = {
        id: 'hex_b',
        type: 'location',
        name: 'Hex B',
        properties: { terrain: 'grassland', hexCol: 1, hexRow: 0 },
      };
      const agent: GraphNode = {
        id: 'agent_1',
        type: 'actor',
        name: 'Agent 1',
        properties: {},
      };

      graph.addNode(hexA);
      graph.addNode(hexB);
      graph.addNode(agent);

      // Add adjacent edge
      graph.addEdge({
        id: 'hex_a_to_hex_b',
        source: 'hex_a',
        target: 'hex_b',
        type: 'adjacent',
        properties: {},
      });

      // Add located_at edge: agent at hex_a
      graph.addEdge({
        id: 'agent_1_located_at_hex_a',
        source: 'agent_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });
    });

    it('returns {moved: false, arrivedAtDestination: true} when queue is empty', () => {
      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: [],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 1);

      expect(result.moved).toBe(false);
      expect(result.arrivedAtDestination).toBe(true);
      expect(result.updatedState).toEqual(state);
    });

    it('transitions when accumulated ticks >= edge cost (grassland, 1 tick)', () => {
      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: ['hex_b', 'hex_c'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 10);

      expect(result.moved).toBe(true);
      expect(result.arrivedAtDestination).toBe(false);
      expect(result.newLocationId).toBe('hex_b');
      expect(result.updatedState.ticksAccumulated).toBe(0); // Reset after transition
      expect(result.updatedState.movementQueue).toEqual(['hex_c']);
    });

    it('does not move when cost not yet paid (2.5 tick cost)', () => {
      // Update hex_b to have mountain terrain (higher cost)
      graph.updateNode('hex_b', {
        properties: { terrain: 'mountains' },
      });

      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 2.5,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 10);

      expect(result.moved).toBe(false);
      expect(result.arrivedAtDestination).toBe(false);
      expect(result.updatedState.ticksAccumulated).toBe(1);
      expect(result.updatedState.movementQueue).toEqual(['hex_b']);
    });

    it('records movement history on transition', () => {
      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0.5,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 50);

      expect(result.moved).toBe(true);
      expect(result.updatedState.movementHistory).toHaveLength(1);
      const entry = result.updatedState.movementHistory[0];
      expect(entry.nodeId).toBe('hex_b');
      expect(entry.tick).toBe(50);
      expect(entry.hexCol).toBe(1);
      expect(entry.hexRow).toBe(0);
    });

    it('caps movement history at TRAIL_HISTORY_TICKS', () => {
      // Build a history with 6 entries (newest first)
      // [hex_5, hex_4, ..., hex_0] in chronological order
      const history = Array.from({ length: 6 }, (_, i) => ({
        nodeId: `hex_${5 - i}`,
        tick: 5 - i,
      }));

      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: history,
      };

      const result = tickMovement(graph, 'agent_1', state, 6);

      expect(result.updatedState.movementHistory).toHaveLength(6);
      // Newest entry should be hex_b at tick 6 with hex coordinates
      expect(result.updatedState.movementHistory[0]).toEqual({
        nodeId: 'hex_b',
        tick: 6,
        hexCol: 1,
        hexRow: 0,
      });
      // Oldest entry (hex_0 at tick 0) should be removed from the back
      expect(result.updatedState.movementHistory).not.toContainEqual({
        nodeId: 'hex_0',
        tick: 0,
      });
      // But hex_1 should still be there
      expect(result.updatedState.movementHistory).toContainEqual({
        nodeId: 'hex_1',
        tick: 1,
      });
    });

    it('updates located_at edge on transition', () => {
      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 10);

      // Old edge should be gone
      expect(graph.getEdge('agent_1_located_at_hex_a')).toBeUndefined();

      // New edge should exist
      const newEdges = graph.getOutgoingEdges('agent_1', 'located_at');
      expect(newEdges).toHaveLength(1);
      expect(newEdges[0].target).toBe('hex_b');
    });

    it('empties queue when path complete', () => {
      const state: MovementState = {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 10);

      expect(result.arrivedAtDestination).toBe(true);
      expect(result.updatedState.movementQueue).toEqual([]);
    });

    it('omits hex coordinates when destination node lacks them', () => {
      // Add a sublocation node without hexCol/hexRow
      graph.addNode({
        id: 'subloc_1',
        type: 'location',
        name: 'Market',
        properties: { locationType: 'sublocation', terrain: 'grassland' },
      });
      graph.addEdge({
        id: 'hex_a_to_subloc_1',
        source: 'hex_a',
        target: 'subloc_1',
        type: 'contains',
        properties: {},
      });

      const state: MovementState = {
        destinationId: 'subloc_1',
        movementQueue: ['subloc_1'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 20);

      expect(result.moved).toBe(true);
      const entry = result.updatedState.movementHistory[0];
      expect(entry.nodeId).toBe('subloc_1');
      expect(entry.hexCol).toBeUndefined();
      expect(entry.hexRow).toBeUndefined();
    });

    it('computes next edge cost if more in queue', () => {
      // Add hex_c to the graph
      graph.addNode({
        id: 'hex_c',
        type: 'location',
        name: 'Hex C',
        properties: { terrain: 'grassland' },
      });

      // Add adjacent edges
      graph.addEdge({
        id: 'hex_b_to_hex_c',
        source: 'hex_b',
        target: 'hex_c',
        type: 'adjacent',
        properties: {},
      });

      const state: MovementState = {
        destinationId: 'hex_c',
        movementQueue: ['hex_b', 'hex_c'],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: 0,
        movementHistory: [],
      };

      const result = tickMovement(graph, 'agent_1', state, 10);

      expect(result.moved).toBe(true);
      expect(result.updatedState.movementQueue).toEqual(['hex_c']);
      // Next edge cost should be computed (grassland→grassland = 2 with 2-edge model)
      expect(result.updatedState.currentEdgeCost).toBe(2);
    });
  });
});
