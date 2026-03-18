/**
 * Integration Tests for Movement Pipeline
 *
 * @deprecated — Tests 1-5 tested the old destination-picking behavior
 * (generateMovementCandidates + computeBasePull) which has been replaced
 * by phaseAgentDecision. These tests are skipped until rewritten to test
 * queue execution with pre-set movement state from the new pipeline.
 *
 * The movement queue execution (Case 1 in phaseMovement) is still tested
 * by the unit tests in phaseMovement.test.ts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import type { GameState } from '../../types/gameState';
import type { AxiologicalProfile } from '../../types/agent';

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Create a minimal axiological profile with ambition=0.8 for testing.
 */
function createTestProfile(ambition: number = 0.8): AxiologicalProfile {
  return {
    loyalty_ambition: ambition,
    courage_prudence: 0.5,
    mercy_ruthlessness: 0,
    honesty_cunning: 0,
    sacrifice_survival: 0,
    loyalty_ambition: 0,
    tradition_novelty: 0,
    humility_pride: 0,
    mercy_ruthlessness: 0,
    asceticism_extravagance: 0,
  };
}

/**
 * Build a 3x1 hex grid: hex_a (grassland) — hex_b (temperate_forest) — hex_c (grassland)
 * All bidirectional 'adjacent' edges.
 * Agent starts at hex_a with given profile.
 */
function buildTestGraph(agentProfile: AxiologicalProfile): WorldGraph {
  const g = new WorldGraph();

  // --- Hex nodes ---
  g.addNode({
    id: 'hex_a',
    type: 'location',
    name: 'Hex A',
    properties: {
      terrain: 'grassland',
      locationType: 'hex_center',
      hexCol: 0,
      hexRow: 0,
    },
  });

  g.addNode({
    id: 'hex_b',
    type: 'location',
    name: 'Hex B',
    properties: {
      terrain: 'temperate_forest',
      locationType: 'hex_center',
      hexCol: 1,
      hexRow: 0,
    },
  });

  g.addNode({
    id: 'hex_c',
    type: 'location',
    name: 'Hex C',
    properties: {
      terrain: 'grassland',
      locationType: 'hex_center',
      hexCol: 2,
      hexRow: 0,
    },
  });

  // --- Bidirectional adjacent edges ---
  g.addEdge({ id: 'adj_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_bc', source: 'hex_b', target: 'hex_c', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_cb', source: 'hex_c', target: 'hex_b', type: 'adjacent', properties: {} });

  // --- Agent node ---
  g.addNode({
    id: 'agent_1',
    type: 'actor',
    name: 'Ambitious Agent',
    properties: {
      actorType: 'individual',
      axiologicalProfile: agentProfile,
    },
  });

  // --- Agent location: hex_a ---
  g.addEdge({
    id: 'agent_1_located_at_hex_a',
    source: 'agent_1',
    target: 'hex_a',
    type: 'located_at',
    properties: {},
  });

  return g;
}

/**
 * Create a minimal GameState cast for phaseMovement testing.
 */
function createGameState(graph: WorldGraph, tick: number, seed: number): GameState {
  return {
    tick,
    seed,
    graph,
    tickEvents: [],
  } as unknown as GameState;
}

/**
 * Run phaseMovement N times, advancing tick each time.
 */
function advanceTicks(state: GameState, count: number): void {
  for (let i = 0; i < count; i++) {
    const result = phaseMovement(state);
    state.tickEvents = result.tickEvents ?? [];
    state.tick += 1;
  }
}

/**
 * Get the agent's current location by following its located_at edge.
 */
function getAgentLocation(graph: WorldGraph, agentId: string): string | null {
  const locatedEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locatedEdges.length === 0) return null;
  return locatedEdges[0].target;
}

// ─── Test Suite ─────────────────────────────────────────────────────

describe.skip('Movement Pipeline Integration — deprecated (destination-picking replaced by phaseAgentDecision)', () => {
  beforeEach(() => {
    resetMovementEventCounter();
  });

  describe('Test 1: Agent evaluates, picks destination, and moves over multiple ticks', () => {
    it('agent initiates movement on tick 0 and arrives at destination', () => {
      const graph = buildTestGraph(createTestProfile(0.8));
      const state = createGameState(graph, 0, 42);

      // --- Tick 0: Evaluate and start movement ---
      const tick0Result = phaseMovement(state);
      state.tickEvents = tick0Result.tickEvents ?? [];

      const agent = graph.getNode('agent_1')!;
      const movementState = agent.properties.movementState as any;

      // Agent should have been evaluated and have a non-empty queue
      expect(movementState).toBeDefined();
      expect(movementState.movementQueue.length).toBeGreaterThan(0);
      expect(movementState.destinationId).toBeDefined();

      // Starting location should be hex_a
      expect(getAgentLocation(graph, 'agent_1')).toBe('hex_a');

      // Advance ticks until agent arrives (empty queue)
      let tickCount = 1;
      let currentMovementState = agent.properties.movementState as any;

      while (currentMovementState.movementQueue.length > 0 && tickCount <= 20) {
        state.tick = tickCount;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];

        const updatedAgent = graph.getNode('agent_1')!;
        currentMovementState = updatedAgent.properties.movementState as any;

        tickCount += 1;
      }

      // Verify agent has arrived
      expect(currentMovementState.movementQueue.length).toBe(0);
      expect(tickCount).toBeLessThanOrEqual(20); // Should arrive within 20 ticks

      // Verify agent is no longer at hex_a
      const finalLocation = getAgentLocation(graph, 'agent_1');
      expect(finalLocation).not.toBe('hex_a');
      expect(finalLocation).toBeDefined();
    });

    it('movement history is populated during traversal', () => {
      const graph = buildTestGraph(createTestProfile(0.8));
      const state = createGameState(graph, 0, 42);

      // Run ticks until agent arrives
      for (let tick = 0; tick <= 20; tick++) {
        state.tick = tick;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];

        const agent = graph.getNode('agent_1')!;
        const movementState = agent.properties.movementState as any;

        if (movementState?.movementQueue.length === 0) {
          break;
        }
      }

      const agent = graph.getNode('agent_1')!;
      const movementState = agent.properties.movementState as any;

      // Should have history entries (at least one movement)
      expect(movementState.movementHistory.length).toBeGreaterThan(0);

      // Each history entry should have nodeId and tick
      for (const entry of movementState.movementHistory) {
        expect(entry.nodeId).toBeDefined();
        expect(typeof entry.nodeId).toBe('string');
        expect(entry.tick).toBeDefined();
        expect(typeof entry.tick).toBe('number');
      }
    });
  });

  describe('Test 2: Movement is deterministic (same seed = same result)', () => {
    it('two agents with same seed reach same location', () => {
      const profile = createTestProfile(0.8);

      // --- Setup Agent 1 ---
      const graph1 = buildTestGraph(profile);
      const state1 = createGameState(graph1, 0, 42);

      // Run 5 ticks
      for (let tick = 0; tick < 5; tick++) {
        state1.tick = tick;
        const result = phaseMovement(state1);
        state1.tickEvents = result.tickEvents ?? [];
      }

      const finalLoc1 = getAgentLocation(graph1, 'agent_1');

      // --- Setup Agent 2 (identical setup, same seed) ---
      const graph2 = buildTestGraph(profile);
      const state2 = createGameState(graph2, 0, 42);

      // Run 5 ticks
      for (let tick = 0; tick < 5; tick++) {
        state2.tick = tick;
        const result = phaseMovement(state2);
        state2.tickEvents = result.tickEvents ?? [];
      }

      const finalLoc2 = getAgentLocation(graph2, 'agent_1');

      // Both should end at same location
      expect(finalLoc1).toBe(finalLoc2);
    });

    it('same seed produces same movement state values', () => {
      const profile = createTestProfile(0.8);

      // --- Agent 1 ---
      const graph1 = buildTestGraph(profile);
      const state1 = createGameState(graph1, 0, 42);

      for (let tick = 0; tick < 5; tick++) {
        state1.tick = tick;
        phaseMovement(state1);
      }

      const agent1 = graph1.getNode('agent_1')!;
      const movementState1 = agent1.properties.movementState as any;
      const path1 = movementState1.movementQueue;

      // --- Agent 2 ---
      const graph2 = buildTestGraph(profile);
      const state2 = createGameState(graph2, 0, 42);

      for (let tick = 0; tick < 5; tick++) {
        state2.tick = tick;
        phaseMovement(state2);
      }

      const agent2 = graph2.getNode('agent_1')!;
      const movementState2 = agent2.properties.movementState as any;
      const path2 = movementState2.movementQueue;

      // Both should have same path
      expect(path1).toEqual(path2);
    });
  });

  describe('Test 3: Movement history accumulates entries', () => {
    it('10 ticks produces multiple history entries with valid fields', () => {
      const graph = buildTestGraph(createTestProfile(0.8));
      const state = createGameState(graph, 0, 42);

      // Run 10 ticks
      for (let tick = 0; tick < 10; tick++) {
        state.tick = tick;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];
      }

      const agent = graph.getNode('agent_1')!;
      const movementState = agent.properties.movementState as any;
      const history = movementState.movementHistory;

      // Should have accumulated some history (at minimum, either has history or still in movement)
      // Agent may not have completed movement in 10 ticks depending on edge costs
      if (history.length > 0) {
        // Each entry should be valid
        for (const entry of history) {
          expect(entry.nodeId).toBeDefined();
          expect(typeof entry.nodeId).toBe('string');
          expect(entry.tick).toBeDefined();
          expect(typeof entry.tick).toBe('number');
          expect(entry.tick).toBeGreaterThanOrEqual(0);

          // Verify history entries correspond to valid nodes
          const node = graph.getNode(entry.nodeId);
          expect(node).toBeDefined();
        }
      } else {
        // If no history yet, agent should still have an active queue or have just started
        expect(movementState.movementQueue.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('history preserves order (newest first)', () => {
      const graph = buildTestGraph(createTestProfile(0.8));
      const state = createGameState(graph, 0, 42);

      // Run ticks until we have some history
      for (let tick = 0; tick < 50; tick++) {
        state.tick = tick;
        phaseMovement(state);
      }

      const agent = graph.getNode('agent_1')!;
      const movementState = agent.properties.movementState as any;
      const history = movementState.movementHistory;

      // Only test ordering if we have multiple history entries
      if (history.length > 1) {
        // History should be in descending tick order (newest first)
        for (let i = 0; i < history.length - 1; i++) {
          expect(history[i].tick).toBeGreaterThanOrEqual(history[i + 1].tick);
        }
      }
    });

    it('history is capped at TRAIL_HISTORY_TICKS entries', () => {
      const graph = buildTestGraph(createTestProfile(0.8));
      const state = createGameState(graph, 0, 42);

      // Run many ticks to accumulate history
      for (let tick = 0; tick < 50; tick++) {
        state.tick = tick;
        phaseMovement(state);
      }

      const agent = graph.getNode('agent_1')!;
      const movementState = agent.properties.movementState as any;
      const history = movementState.movementHistory;

      // Import the constant to verify capping
      // History is capped at TRAIL_HISTORY_TICKS (12)
      expect(history.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Additional: Edge cases and error handling', () => {
    it('agent with no movement candidates stays in place', () => {
      const graph = new WorldGraph();

      // Isolated hex with agent
      graph.addNode({
        id: 'hex_isolated',
        type: 'location',
        name: 'Isolated Hex',
        properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 },
      });

      graph.addNode({
        id: 'agent_isolated',
        type: 'actor',
        name: 'Isolated Agent',
        properties: {
          actorType: 'individual',
          axiologicalProfile: createTestProfile(0.8),
        },
      });

      graph.addEdge({
        id: 'agent_at_isolated',
        source: 'agent_isolated',
        target: 'hex_isolated',
        type: 'located_at',
        properties: {},
      });

      const state = createGameState(graph, 0, 42);

      // Run a few ticks
      for (let tick = 0; tick < 5; tick++) {
        state.tick = tick;
        phaseMovement(state);
      }

      // Agent should still be at hex_isolated
      expect(getAgentLocation(graph, 'agent_isolated')).toBe('hex_isolated');

      // Movement state should exist but queue should be empty
      const agent = graph.getNode('agent_isolated')!;
      const movementState = agent.properties.movementState as any;
      expect(movementState).toBeDefined();
      expect(movementState.movementQueue.length).toBe(0);
    });

    it('tick events are emitted on movement transitions', () => {
      const graph = buildTestGraph(createTestProfile(0.8));
      const state = createGameState(graph, 0, 42);

      let movementEventCount = 0;

      // Run ticks and count movement events
      for (let tick = 0; tick < 20; tick++) {
        state.tick = tick;
        const result = phaseMovement(state);
        state.tickEvents = result.tickEvents ?? [];

        for (const evt of state.tickEvents) {
          if (evt.type === 'agent_movement') {
            movementEventCount += 1;
          }
        }

        // Stop early if agent has arrived
        const agent = graph.getNode('agent_1')!;
        const ms = agent.properties.movementState as any;
        if (ms?.movementQueue.length === 0) {
          break;
        }
      }

      // Should have at least one movement event
      expect(movementEventCount).toBeGreaterThan(0);
    });

    it('agent with zero ambition still moves but slower', () => {
      const zeroProfile = createTestProfile(0);
      const graph = buildTestGraph(zeroProfile);
      const state = createGameState(graph, 0, 42);

      // Run tick 0
      state.tick = 0;
      phaseMovement(state);

      const agent = graph.getNode('agent_1')!;
      const movementState = agent.properties.movementState as any;

      // Even with zero ambition, agent may not move (base pull may be below threshold)
      // If agent does have a queue, verify it's valid
      if (movementState.movementQueue.length > 0) {
        expect(movementState.destinationId).toBeDefined();
        expect(movementState.currentEdgeCost).toBeGreaterThan(0);
      }
    });
  });
});
