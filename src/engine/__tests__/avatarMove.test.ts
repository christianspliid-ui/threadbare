import { describe, it, expect, beforeEach } from 'vitest';
import { moveAvatarToHex, getAvatarMovementState, clearAvatarMovement } from '../avatarMove';
import { WorldGraph } from '../graph';
import type { MovementState } from '../../types/movement';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import type { GameState } from '../../types/gameState';

describe('moveAvatarToHex', () => {
  /**
   * Build a minimal graph with:
   * - An ascendant node
   * - An avatar node linked via avatar_of edge
   * - A start location with avatar located_at it
   * - Adjacent locations forming a simple path
   */
  function buildGraph() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 5, hexRow: 7, locationType: 'settlement' } });
    graph.addNode({ id: 'loc.mid', type: 'location', name: 'Mid', properties: { hexCol: 6, hexRow: 7, locationType: 'wilderness' } });
    graph.addNode({ id: 'loc.dest', type: 'location', name: 'Dest', properties: { hexCol: 7, hexRow: 7, locationType: 'settlement' } });

    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.located_at', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });

    // Create adjacency edges for pathfinding
    graph.addEdge({ id: 'e.adj.start.mid', source: 'loc.start', target: 'loc.mid', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.mid.start', source: 'loc.mid', target: 'loc.start', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.mid.dest', source: 'loc.mid', target: 'loc.dest', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.dest.mid', source: 'loc.dest', target: 'loc.mid', type: 'adjacent', properties: {} });

    return graph;
  }

  it('returns true and sets MovementState when path is found', () => {
    const graph = buildGraph();
    const result = moveAvatarToHex(graph, 'asc.1', { col: 7, row: 7 }, 10);

    expect(result).toBe(true);

    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    expect(ms).toBeDefined();
    expect(ms.destinationId).toBe('loc.dest');
    expect(ms.movementQueue.length).toBeGreaterThan(0);
    expect(ms.lastDecisionTick).toBe(10);
  });

  it('does NOT change located_at edge (no teleporting)', () => {
    const graph = buildGraph();
    moveAvatarToHex(graph, 'asc.1', { col: 7, row: 7 }, 10);

    // Avatar should still be at the start location
    const locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges.length).toBe(1);
    expect(locEdges[0].target).toBe('loc.start');
  });

  it('returns false when target hex is unreachable', () => {
    const graph = buildGraph();
    // Add an isolated location with no adjacency edges
    graph.addNode({ id: 'loc.island', type: 'location', name: 'Island', properties: { hexCol: 99, hexRow: 99, locationType: 'wilderness' } });

    const result = moveAvatarToHex(graph, 'asc.1', { col: 99, row: 99 }, 10);

    expect(result).toBe(false);

    // No movement state should be set
    const avatar = graph.getNode('avatar.1')!;
    expect(avatar.properties.movementState).toBeUndefined();
  });

  it('creates transient location and pathfinds to it when adjacency edges exist', () => {
    const graph = buildGraph();
    // Simulate a two-step process: first call creates the transient (pathfinding fails
    // due to no adjacency edges), then we add adjacency edges, then second call succeeds.
    // This exercises the "create" path of findOrCreateLocationAtHex with a successful pathfind.

    // First call: creates transient node but pathfinding fails (no adjacency)
    const firstResult = moveAvatarToHex(graph, 'asc.1', { col: 8, row: 7 }, 10);
    expect(firstResult).toBe(false);

    // Transient node was created by the first call
    const transient = graph.getNode('loc.transient.8.7');
    expect(transient).toBeDefined();

    // Now add adjacency edges (simulating map setup connecting the new hex)
    graph.addEdge({ id: 'e.adj.dest.trans', source: 'loc.dest', target: 'loc.transient.8.7', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.trans.dest', source: 'loc.transient.8.7', target: 'loc.dest', type: 'adjacent', properties: {} });

    // Second call: finds existing transient, pathfinding succeeds
    const secondResult = moveAvatarToHex(graph, 'asc.1', { col: 8, row: 7 }, 20);
    expect(secondResult).toBe(true);

    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    expect(ms.destinationId).toBe('loc.transient.8.7');
    expect(ms.movementQueue.length).toBeGreaterThan(0);
    expect(ms.lastDecisionTick).toBe(20);
  });

  it('creates transient location node when none exists at target hex', () => {
    const graph = buildGraph();
    // Target hex (8,7) has no location. The function should create a transient.
    // But we also need adjacency for pathfinding to reach it.
    // We'll manually add adjacency after creation — actually, the function creates the
    // transient first, then pathfinds. So we need pre-existing adjacency edges.
    // For this test, let's just verify the transient node is created even if path fails.

    const result = moveAvatarToHex(graph, 'asc.1', { col: 8, row: 7 }, 10);

    // Path won't exist (no adjacency to the transient), so result is false
    expect(result).toBe(false);

    // But the transient location should have been created
    const transient = graph.getNode('loc.transient.8.7');
    expect(transient).toBeDefined();
    expect(transient!.properties.hexCol).toBe(8);
    expect(transient!.properties.hexRow).toBe(7);
    expect(transient!.properties.locationType).toBe('wilderness');
  });

  it('returns false when avatar is already at the target hex', () => {
    const graph = buildGraph();
    const result = moveAvatarToHex(graph, 'asc.1', { col: 5, row: 7 }, 10);

    // Already at (5,7) — no movement planned
    expect(result).toBe(false);

    // No movement state should be set
    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState | undefined;
    expect(ms).toBeUndefined();
  });

  it('returns false when no avatar exists for ascendant', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });

    const result = moveAvatarToHex(graph, 'asc.1', { col: 5, row: 7 }, 10);
    expect(result).toBe(false);
  });

  it('sets the correct first edge cost from computeEdgeCost', () => {
    const graph = buildGraph();
    moveAvatarToHex(graph, 'asc.1', { col: 7, row: 7 }, 10);

    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    // currentEdgeCost should be a positive number (at least MIN_EDGE_COST)
    expect(ms.currentEdgeCost).toBeGreaterThan(0);
  });
});

describe('getAvatarMovementState', () => {
  it('returns MovementState when avatar is moving', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'avatar.1', type: 'actor', name: 'Avatar',
      properties: {
        actorType: 'individual',
        movementState: {
          destinationId: 'loc.dest',
          movementQueue: ['loc.mid', 'loc.dest'],
          ticksAccumulated: 0,
          currentEdgeCost: 2,
          lastDecisionTick: 5,
          movementHistory: [],
        } as MovementState,
      },
    });
    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });

    const ms = getAvatarMovementState(graph, 'asc.1');
    expect(ms).not.toBeNull();
    expect(ms!.destinationId).toBe('loc.dest');
    expect(ms!.movementQueue).toEqual(['loc.mid', 'loc.dest']);
  });

  it('returns null when avatar has no movement state', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });

    const ms = getAvatarMovementState(graph, 'asc.1');
    expect(ms).toBeNull();
  });

  it('returns null when no avatar exists', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });

    const ms = getAvatarMovementState(graph, 'asc.1');
    expect(ms).toBeNull();
  });
});

describe('clearAvatarMovement', () => {
  it('removes movementState from avatar node', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'avatar.1', type: 'actor', name: 'Avatar',
      properties: {
        actorType: 'individual',
        movementState: {
          destinationId: 'loc.dest',
          movementQueue: ['loc.dest'],
          ticksAccumulated: 0,
          currentEdgeCost: 2,
          lastDecisionTick: 5,
          movementHistory: [],
        } as MovementState,
      },
    });
    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });

    clearAvatarMovement(graph, 'asc.1');

    const avatar = graph.getNode('avatar.1')!;
    expect(avatar.properties.movementState).toBeUndefined();
  });

  it('is a no-op when no avatar exists', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });

    // Should not throw
    expect(() => clearAvatarMovement(graph, 'asc.1')).not.toThrow();
  });

  it('is a no-op when avatar has no movement state', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });

    expect(() => clearAvatarMovement(graph, 'asc.1')).not.toThrow();
  });
});

// ─── Integration: moveAvatarToHex + phaseMovement ─────────────────────

describe('integration: moveAvatarToHex + phaseMovement', () => {
  beforeEach(() => {
    resetMovementEventCounter();
  });

  function buildGraph() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 0, hexRow: 0, locationType: 'wilderness' } });
    graph.addNode({ id: 'loc.mid', type: 'location', name: 'Mid', properties: { hexCol: 1, hexRow: 0, locationType: 'wilderness' } });
    graph.addNode({ id: 'loc.end', type: 'location', name: 'End', properties: { hexCol: 2, hexRow: 0, locationType: 'wilderness' } });

    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.located_at', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });

    // Adjacency edges for pathfinding
    graph.addEdge({ id: 'e.adj.start.mid', source: 'loc.start', target: 'loc.mid', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.mid.start', source: 'loc.mid', target: 'loc.start', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.mid.end', source: 'loc.mid', target: 'loc.end', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'e.adj.end.mid', source: 'loc.end', target: 'loc.mid', type: 'adjacent', properties: {} });

    return graph;
  }

  /** Build a minimal GameState with sensible defaults for fields phaseMovement doesn't touch. */
  function buildMinimalState(graph: WorldGraph, tick: number): GameState {
    return {
      cycle: 1,
      tick,
      phase: 'playing',
      seed: 42,
      graph,
      cosmology: { spheres: [] } as unknown as GameState['cosmology'],
      tiles: [],
      clock: { tick: 0, maxTick: 200, paused: false } as unknown as GameState['clock'],
      ascendantId: 'asc.1',
      essencePool: { current: 0, max: 100, regenRate: 0 } as unknown as GameState['essencePool'],
      mandateDefinition: null,
      mandateState: null,
      rivalDefinitions: [],
      rivalStates: [],
      doomDefinition: { archetype: 'breach', name: 'Doom', totalTicks: 200, stages: [] } as unknown as GameState['doomDefinition'],
      doomClock: { currentTick: 0, stage: 0, escalations: [] } as unknown as GameState['doomClock'],
      tickEvents: [],
      recentEvents: [],
      chronicleEntries: [],
      stealthExposure: 0,
      visibilityMap: new Map() as unknown as GameState['visibilityMap'],
      familiarityMap: new Map() as unknown as GameState['familiarityMap'],
      culturalInsightMap: new Map(),
      encounterProgress: [],
      actionsInProgress: [],
      unifiedActions: [],
      worldSoul: { themes: [], pressure: 0 } as unknown as GameState['worldSoul'],
      echoDefinitions: [],
      echoStates: [],
      chronicle: { volumes: [], echoThreads: [] },
    };
  }

  it('avatar moves one step per tick along planned path', () => {
    const graph = buildGraph();

    // Plan movement from start (0,0) to end (2,0) — a 2-step path
    const result = moveAvatarToHex(graph, 'asc.1', { col: 2, row: 0 }, 0);
    expect(result).toBe(true);

    // Verify the planned path: queue should be [loc.mid, loc.end]
    const ms0 = getAvatarMovementState(graph, 'asc.1');
    expect(ms0).not.toBeNull();
    expect(ms0!.movementQueue).toEqual(['loc.mid', 'loc.end']);

    // Build minimal GameState
    const state = buildMinimalState(graph, 1);

    // Tick 1: avatar should move to loc.mid
    // Base cost is 1 tick (no terrain tax on wilderness-without-terrain-property)
    phaseMovement(state);
    let locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe('loc.mid');

    // Tick 2: avatar should arrive at loc.end
    state.tick = 2;
    state.tickEvents = [];
    phaseMovement(state);
    locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe('loc.end');

    // Movement state should show arrived (empty queue)
    const msFinal = getAvatarMovementState(graph, 'asc.1');
    expect(msFinal).not.toBeNull();
    expect(msFinal!.movementQueue).toEqual([]);
  });
});
