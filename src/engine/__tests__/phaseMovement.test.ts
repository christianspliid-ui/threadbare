import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { MovementState } from '../../types/movement';

describe('Phase Movement', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetMovementEventCounter();
    graph = new WorldGraph();
  });

  /**
   * Create a minimal GameState for testing
   */
  function createTestState(overrides?: Partial<GameState>): GameState {
    return {
      tick: 0,
      cycle: 0,
      seed: 1234,
      graph,
      phase: 'playing',
      cosmology: { reachDomains: [], spheres: [] },
      tiles: [],
      clock: { dayOfCycle: 0, ticksOfDay: 0 },
      ascendantId: 'ascendant_1',
      essencePool: { [Symbol.iterator]: function* () { yield ['default', 0]; } },
      mandateDefinition: null,
      mandateState: null,
      rivalDefinitions: [],
      rivalStates: [],
      doomDefinition: {} as any,
      doomClock: {} as any,
      tickEvents: [],
      recentEvents: [],
      chronicleEntries: [],
      stealthExposure: 0,
      visibilityMap: new Map(),
      familiarityMap: new Map(),
      culturalInsightMap: new Map(),
      encounterProgress: [],
      actionsInProgress: [],
      worldSoul: {} as any,
      echoDefinitions: [],
      echoStates: [],
      chronicle: { cycles: [], totalEntries: 0 },
      ...overrides,
    };
  }

  describe('Agents with existing movementQueue', () => {
    it('advances agents along their movement path', () => {
      // Setup: two locations and an agent
      const hexA: GraphNode = {
        id: 'hex_a',
        type: 'location',
        name: 'Hex A',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      };
      const hexB: GraphNode = {
        id: 'hex_b',
        type: 'location',
        name: 'Hex B',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      };
      const agent: GraphNode = {
        id: 'agent_1',
        type: 'actor',
        name: 'Test Agent',
        properties: {
          actorType: 'individual',
          locationId: 'hex_a',
          movementState: {
            destinationId: 'hex_b',
            movementQueue: ['hex_b'],
            ticksAccumulated: 0,
            currentEdgeCost: 1,
            lastDecisionTick: 0,
            movementHistory: [],
          } as MovementState,
        },
      };

      graph.addNode(hexA);
      graph.addNode(hexB);
      graph.addNode(agent);

      // Add located_at edge
      graph.addEdge({
        id: 'agent_1_located_at_hex_a',
        source: 'agent_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      // Add adjacent edge between hex locations
      graph.addEdge({
        id: 'hex_a_adj_hex_b',
        source: 'hex_a',
        target: 'hex_b',
        type: 'adjacent',
        properties: {},
      });

      const state = createTestState({ tick: 1 });

      const result = phaseMovement(state);

      // Agent should have moved (movementQueue should be empty after reaching destination)
      const updatedAgent = graph.getNode('agent_1');
      const updatedMovement = updatedAgent?.properties?.movementState as MovementState;
      expect(updatedMovement.movementQueue.length).toBe(0);
      expect(updatedMovement.arrivedAtDestination).toBeUndefined(); // Not a property, determined by empty queue
    });
  });

  describe('TickEvent emission', () => {
    it('emits agent_movement event on successful transition', () => {
      // Setup: agent with movement queue
      const hexA: GraphNode = {
        id: 'hex_a',
        type: 'location',
        name: 'Hex A',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      };
      const hexB: GraphNode = {
        id: 'hex_b',
        type: 'location',
        name: 'Hex B',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      };
      const agent: GraphNode = {
        id: 'agent_1',
        type: 'actor',
        name: 'Wanderer',
        properties: {
          actorType: 'individual',
          locationId: 'hex_a',
          movementState: {
            destinationId: 'hex_b',
            movementQueue: ['hex_b'],
            ticksAccumulated: 0,
            currentEdgeCost: 1,
            lastDecisionTick: 0,
            movementHistory: [],
          } as MovementState,
        },
      };

      graph.addNode(hexA);
      graph.addNode(hexB);
      graph.addNode(agent);

      graph.addEdge({
        id: 'agent_1_located_at_hex_a',
        source: 'agent_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      graph.addEdge({
        id: 'hex_a_adj_hex_b',
        source: 'hex_a',
        target: 'hex_b',
        type: 'adjacent',
        properties: {},
      });

      const state = createTestState({ tick: 1, tickEvents: [] });

      const result = phaseMovement(state);

      // Check for agent_movement event
      const movementEvents = result.tickEvents?.filter(e => e.type === 'agent_movement') ?? [];
      expect(movementEvents.length).toBeGreaterThan(0);
      expect(movementEvents[0].message).toContain('Wanderer');
      expect(movementEvents[0].message).toContain('Hex B');
    });
  });

  describe('Non-individual actors', () => {
    it('does not move gods or ascendants', () => {
      // Setup: a god actor
      const god: GraphNode = {
        id: 'god_1',
        type: 'actor',
        name: 'Divine Being',
        properties: {
          actorType: 'god',
          movementState: {
            destinationId: 'somewhere',
            movementQueue: ['hex_a'],
            ticksAccumulated: 0,
            currentEdgeCost: 1,
            lastDecisionTick: 0,
            movementHistory: [],
          } as MovementState,
        },
      };

      graph.addNode(god);

      const state = createTestState({ tick: 1, tickEvents: [] });

      const result = phaseMovement(state);

      // God's movementState should remain unchanged
      const updatedGod = graph.getNode('god_1');
      const godMovement = updatedGod?.properties?.movementState as MovementState;
      expect(godMovement.movementQueue).toEqual(['hex_a']); // Unchanged
    });
  });
});
