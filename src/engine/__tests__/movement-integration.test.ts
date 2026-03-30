/**
 * Movement Pipeline Integration Tests
 *
 * Tests queue execution behavior: phaseMovement ticks agents with pre-set
 * movement queues through to arrival. Destination-picking is handled by
 * phaseAgentDecision (tested separately). These tests focus on:
 * - Queue execution with real graph, real edge costs
 * - Movement history accumulation during traversal
 * - Road mode hex-by-hex advancement
 * - Mixed road + adjacent hop paths
 * - Deterministic outcomes with same seed
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import { initMovementState } from '../movementExecution';
import { computeEdgeCost } from '../movementCost';
import { findShortestPath } from '../pathfinding';
import type { GameState } from '../../types/gameState';
import type { MovementState } from '../../types/movement';
import { TRAIL_HISTORY_TICKS } from '../../types/movement';

// ─── Helper Functions ───────────────────────────────────────────────

function buildTestGraph(): WorldGraph {
  const g = new WorldGraph();

  // 4-location chain: A — B — C — D
  const locs = [
    { id: 'loc_a', terrain: 'grassland', col: 0, row: 0 },
    { id: 'loc_b', terrain: 'temperate_forest', col: 1, row: 0 },
    { id: 'loc_c', terrain: 'grassland', col: 2, row: 0 },
    { id: 'loc_d', terrain: 'hills', col: 3, row: 0 },
  ];

  for (const loc of locs) {
    g.addNode({
      id: loc.id,
      type: 'location',
      name: loc.id,
      properties: {
        terrain: loc.terrain,
        locationType: 'hex_center',
        hexCol: loc.col,
        hexRow: loc.row,
      },
    });
  }

  // Bidirectional adjacent edges
  const pairs = [['loc_a', 'loc_b'], ['loc_b', 'loc_c'], ['loc_c', 'loc_d']];
  for (const [a, b] of pairs) {
    g.addEdge({ id: `adj_${a}_${b}`, source: a, target: b, type: 'adjacent', properties: {} });
    g.addEdge({ id: `adj_${b}_${a}`, source: b, target: a, type: 'adjacent', properties: {} });
  }

  // Agent at loc_a
  g.addNode({
    id: 'agent_1',
    type: 'actor',
    name: 'Test Agent',
    properties: { actorType: 'individual' },
  });
  g.addEdge({
    id: 'agent_1_located_at',
    source: 'agent_1',
    target: 'loc_a',
    type: 'located_at',
    properties: {},
  });

  return g;
}

function createGameState(graph: WorldGraph, tick: number): GameState {
  return {
    tick,
    seed: 42,
    graph,
    tickEvents: [],
    tiles: [],
    encounterProgress: [],
  } as unknown as GameState;
}

function getAgentLocation(graph: WorldGraph, agentId: string): string | null {
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  return edges.length > 0 ? edges[0].target : null;
}

// ─── Test Suite ─────────────────────────────────────────────────────

describe('Movement Pipeline Integration', () => {
  beforeEach(() => {
    resetMovementEventCounter();
  });

  describe('Queue execution with pre-set movement state', () => {
    it('agent with movement queue advances and arrives at destination', () => {
      const graph = buildTestGraph();
      const state = createGameState(graph, 0);

      // Set up movement: agent_1 at loc_a, going to loc_c via loc_b
      const edgeCost = computeEdgeCost(graph, 'agent_1', 'loc_a', 'loc_b').totalCost;
      const movState = initMovementState('loc_c', ['loc_b', 'loc_c'], edgeCost, 0);
      graph.updateNode('agent_1', {
        properties: { ...graph.getNode('agent_1')!.properties, movementState: movState },
      });

      // Tick until arrival (max 50 safety)
      let s = state;
      for (let tick = 0; tick < 50; tick++) {
        s.tick = tick;
        const result = phaseMovement(s);
        s.tickEvents = result.tickEvents ?? [];

        const agent = graph.getNode('agent_1')!;
        const ms = agent.properties.movementState as MovementState;
        if (ms.movementQueue.length === 0) break;
      }

      // Agent should have arrived at loc_c
      expect(getAgentLocation(graph, 'agent_1')).toBe('loc_c');
      const finalMs = (graph.getNode('agent_1')!.properties.movementState as MovementState);
      expect(finalMs.movementQueue).toHaveLength(0);
    });

    it('movement history accumulates entries with hex coords', () => {
      const graph = buildTestGraph();
      const state = createGameState(graph, 0);

      const edgeCost = computeEdgeCost(graph, 'agent_1', 'loc_a', 'loc_b').totalCost;
      const movState = initMovementState('loc_d', ['loc_b', 'loc_c', 'loc_d'], edgeCost, 0);
      graph.updateNode('agent_1', {
        properties: { ...graph.getNode('agent_1')!.properties, movementState: movState },
      });

      for (let tick = 0; tick < 50; tick++) {
        state.tick = tick;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];

        const ms = (graph.getNode('agent_1')!.properties.movementState as MovementState);
        if (ms.movementQueue.length === 0) break;
      }

      const finalMs = (graph.getNode('agent_1')!.properties.movementState as MovementState);
      expect(finalMs.movementHistory.length).toBeGreaterThan(0);

      // Each entry should have valid fields
      for (const entry of finalMs.movementHistory) {
        expect(entry.nodeId).toBeDefined();
        expect(typeof entry.tick).toBe('number');
      }

      // History is newest-first
      if (finalMs.movementHistory.length > 1) {
        for (let i = 0; i < finalMs.movementHistory.length - 1; i++) {
          expect(finalMs.movementHistory[i].tick).toBeGreaterThanOrEqual(
            finalMs.movementHistory[i + 1].tick,
          );
        }
      }
    });

    it('history is capped at TRAIL_HISTORY_TICKS entries', () => {
      const graph = buildTestGraph();
      const state = createGameState(graph, 0);

      // Create a longer path so many history entries accumulate
      const edgeCost = computeEdgeCost(graph, 'agent_1', 'loc_a', 'loc_b').totalCost;
      const movState = initMovementState('loc_d', ['loc_b', 'loc_c', 'loc_d'], edgeCost, 0);
      graph.updateNode('agent_1', {
        properties: { ...graph.getNode('agent_1')!.properties, movementState: movState },
      });

      for (let tick = 0; tick < 50; tick++) {
        state.tick = tick;
        phaseMovement(state);
      }

      const finalMs = (graph.getNode('agent_1')!.properties.movementState as MovementState);
      expect(finalMs.movementHistory.length).toBeLessThanOrEqual(TRAIL_HISTORY_TICKS);
    });

    it('tick events are emitted on movement transitions', () => {
      const graph = buildTestGraph();
      const state = createGameState(graph, 0);

      const edgeCost = computeEdgeCost(graph, 'agent_1', 'loc_a', 'loc_b').totalCost;
      const movState = initMovementState('loc_b', ['loc_b'], edgeCost, 0);
      graph.updateNode('agent_1', {
        properties: { ...graph.getNode('agent_1')!.properties, movementState: movState },
      });

      let movementEventCount = 0;
      for (let tick = 0; tick < 20; tick++) {
        state.tick = tick;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];
        movementEventCount += state.tickEvents.filter(e => e.type === 'agent_movement').length;

        const ms = (graph.getNode('agent_1')!.properties.movementState as MovementState);
        if (ms.movementQueue.length === 0) break;
      }

      expect(movementEventCount).toBeGreaterThan(0);
    });
  });

  describe('Road-aware movement via phaseMovement', () => {
    it('road movement advances hex-by-hex and emits events', () => {
      const graph = buildTestGraph();

      // Add a road edge from loc_a to loc_c with a hex path
      graph.addEdge({
        id: 'road_a_c',
        source: 'loc_a',
        target: 'loc_c',
        type: 'road',
        properties: {
          roadType: 'major',
          totalCost: 4,
          hexPath: [
            { col: 0, row: 0 },
            { col: 1, row: 0 },
            { col: 2, row: 0 },
          ],
        },
      });

      // Use pathfinding to get road-aware path
      const pathResult = findShortestPath(graph, 'agent_1', 'loc_a', 'loc_c');
      expect(pathResult).not.toBeNull();

      // Init movement state with road segments
      const firstEdgeCost = pathResult!.roadSegments?.[0]
        ? pathResult!.roadSegments[0].discountedCost / Math.max(1, pathResult!.roadSegments[0].hexPath.length)
        : computeEdgeCost(graph, 'agent_1', 'loc_a', pathResult!.path[0]).totalCost;

      const movState = initMovementState(
        'loc_c',
        pathResult!.path,
        firstEdgeCost,
        0,
        pathResult!.roadSegments,
        'loc_a',
      );

      graph.updateNode('agent_1', {
        properties: { ...graph.getNode('agent_1')!.properties, movementState: movState },
      });

      const state = createGameState(graph, 0);

      // Tick until arrival
      for (let tick = 0; tick < 50; tick++) {
        state.tick = tick;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];

        const ms = (graph.getNode('agent_1')!.properties.movementState as MovementState);
        if (ms.movementQueue.length === 0) break;
      }

      // Agent arrived at loc_c
      expect(getAgentLocation(graph, 'agent_1')).toBe('loc_c');
    });
  });

  describe('Deterministic movement', () => {
    it('same setup produces same final location', () => {
      function runSetup() {
        const g = buildTestGraph();
        const edgeCost = computeEdgeCost(g, 'agent_1', 'loc_a', 'loc_b').totalCost;
        const ms = initMovementState('loc_c', ['loc_b', 'loc_c'], edgeCost, 0);
        g.updateNode('agent_1', {
          properties: { ...g.getNode('agent_1')!.properties, movementState: ms },
        });

        const s = createGameState(g, 0);
        for (let tick = 0; tick < 50; tick++) {
          s.tick = tick;
          phaseMovement(s);
          const finalMs = (g.getNode('agent_1')!.properties.movementState as MovementState);
          if (finalMs.movementQueue.length === 0) break;
        }

        return getAgentLocation(g, 'agent_1');
      }

      resetMovementEventCounter();
      const loc1 = runSetup();
      resetMovementEventCounter();
      const loc2 = runSetup();

      expect(loc1).toBe(loc2);
      expect(loc1).toBe('loc_c');
    });
  });
});
