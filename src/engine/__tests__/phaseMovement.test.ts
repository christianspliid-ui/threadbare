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

  describe('Avatar exclusion from autonomous re-evaluation', () => {
    /**
     * Helper: set up an avatar actor with avatar_of edge to ascendant.
     */
    function setupAvatar(
      g: WorldGraph,
      movementState?: MovementState,
    ): { avatarId: string; ascendantId: string } {
      const avatar: GraphNode = {
        id: 'avatar_1',
        type: 'actor',
        name: 'Player Avatar',
        properties: {
          actorType: 'individual',
          locationId: 'hex_a',
          ...(movementState ? { movementState } : {}),
        },
      };
      g.addNode(avatar);

      // Ascendant node
      g.addNode({
        id: 'ascendant_1',
        type: 'actor',
        name: 'The Ascendant',
        properties: { actorType: 'god' },
      });

      // avatar_of edge: avatar -> ascendant
      g.addEdge({
        id: 'avatar_1_avatar_of_ascendant_1',
        source: 'avatar_1',
        target: 'ascendant_1',
        type: 'avatar_of',
        properties: {},
      });

      return { avatarId: 'avatar_1', ascendantId: 'ascendant_1' };
    }

    function setupHexPair(g: WorldGraph): void {
      g.addNode({
        id: 'hex_a',
        type: 'location',
        name: 'Hex A',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      });
      g.addNode({
        id: 'hex_b',
        type: 'location',
        name: 'Hex B',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      });
      g.addEdge({
        id: 'hex_a_adj_hex_b',
        source: 'hex_a',
        target: 'hex_b',
        type: 'adjacent',
        properties: {},
      });
      g.addEdge({
        id: 'hex_b_adj_hex_a',
        source: 'hex_b',
        target: 'hex_a',
        type: 'adjacent',
        properties: {},
      });
    }

    it('ticks avatar movement queue (ticksAccumulated increments)', () => {
      setupHexPair(graph);
      setupAvatar(graph, {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 5, // high cost so we don't arrive in one tick
        lastDecisionTick: 0,
        movementHistory: [],
      });

      graph.addEdge({
        id: 'avatar_1_located_at_hex_a',
        source: 'avatar_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      const state = createTestState({ tick: 1 });
      phaseMovement(state);

      const updated = graph.getNode('avatar_1');
      const ms = updated?.properties?.movementState as MovementState;
      // Movement was ticked — ticksAccumulated should have incremented
      expect(ms.ticksAccumulated).toBeGreaterThan(0);
      // Queue should still have items (cost is high)
      expect(ms.movementQueue.length).toBe(1);
    });

    it('does NOT autonomously re-evaluate avatar destination mid-path', () => {
      setupHexPair(graph);
      // Add a third hex that might be a "better" candidate
      graph.addNode({
        id: 'hex_c',
        type: 'location',
        name: 'Hex C',
        properties: { terrain: 'grassland', locationType: 'hex_center' },
      });
      graph.addEdge({
        id: 'hex_a_adj_hex_c',
        source: 'hex_a',
        target: 'hex_c',
        type: 'adjacent',
        properties: {},
      });

      setupAvatar(graph, {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 10,
        lastDecisionTick: 0, // long ago relative to tick
        movementHistory: [],
      });

      graph.addEdge({
        id: 'avatar_1_located_at_hex_a',
        source: 'avatar_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      // Run at a tick far past DECISION_REEVALUATION_TICKS to trigger re-eval for NPCs
      const state = createTestState({ tick: 100 });
      phaseMovement(state);

      const updated = graph.getNode('avatar_1');
      const ms = updated?.properties?.movementState as MovementState;
      // Destination should remain hex_b — no autonomous switching
      expect(ms.destinationId).toBe('hex_b');
    });

    it('does NOT emit agent_movement event for avatar transitions', () => {
      setupHexPair(graph);
      setupAvatar(graph, {
        destinationId: 'hex_b',
        movementQueue: ['hex_b'],
        ticksAccumulated: 0,
        currentEdgeCost: 1, // arrives this tick
        lastDecisionTick: 0,
        movementHistory: [],
      });

      graph.addEdge({
        id: 'avatar_1_located_at_hex_a',
        source: 'avatar_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      const state = createTestState({ tick: 1, tickEvents: [] });
      const result = phaseMovement(state);

      const movementEvents = result.tickEvents?.filter(e => e.type === 'agent_movement') ?? [];
      expect(movementEvents.length).toBe(0);
    });

    it('does NOT set movementState when avatar has empty queue / no movement', () => {
      setupHexPair(graph);
      setupAvatar(graph); // No movementState at all

      graph.addEdge({
        id: 'avatar_1_located_at_hex_a',
        source: 'avatar_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      const state = createTestState({ tick: 0 }); // tick 0 normally triggers evaluation
      phaseMovement(state);

      const updated = graph.getNode('avatar_1');
      // Avatar should NOT have had movementState set by phaseMovement
      expect(updated?.properties?.movementState).toBeUndefined();
    });

    it('leaves avatar alone when it has arrived (empty queue)', () => {
      setupHexPair(graph);
      const arrivedState: MovementState = {
        destinationId: 'hex_a',
        movementQueue: [],
        ticksAccumulated: 0,
        currentEdgeCost: 0,
        lastDecisionTick: 0,
        movementHistory: [],
      };
      setupAvatar(graph, arrivedState);

      graph.addEdge({
        id: 'avatar_1_located_at_hex_a',
        source: 'avatar_1',
        target: 'hex_a',
        type: 'located_at',
        properties: {},
      });

      const state = createTestState({ tick: 0 });
      phaseMovement(state);

      const updated = graph.getNode('avatar_1');
      const ms = updated?.properties?.movementState as MovementState;
      // Should remain as-is — no new destination set
      expect(ms.destinationId).toBe('hex_a');
      expect(ms.movementQueue).toEqual([]);
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
