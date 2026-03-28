import { describe, it, expect, beforeEach } from 'vitest';
import { moveAvatarToHex, getAvatarMovementState, clearAvatarMovement } from '../avatarMove';
import { WorldGraph } from '../graph';
import type { MovementState } from '../../types/movement';
import type { HexTile } from '../../types';
import { phaseMovement, resetMovementEventCounter } from '../phaseMovement';
import type { GameState } from '../../types/gameState';

/** Build a minimal tile array for a small grid (cols x rows). All grassland by default. */
function buildTiles(cols: number, rows: number, overrides?: Map<string, string>): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const terrain = overrides?.get(`${col},${row}`) ?? 'grassland';
      tiles.push({
        coord: { col, row },
        terrain: terrain as HexTile['terrain'],
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      });
    }
  }
  return tiles;
}

describe('moveAvatarToHex', () => {
  const COLS = 10;
  const ROWS = 10;

  function buildGraph() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 5, hexRow: 5, locationType: 'settlement', terrain: 'grassland' } });

    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.located_at', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });

    return graph;
  }

  it('returns true and sets MovementState when path is found', () => {
    const graph = buildGraph();
    const tiles = buildTiles(COLS, ROWS);
    const result = moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);

    expect(result).toBe(true);

    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    expect(ms).toBeDefined();
    expect(ms.movementQueue.length).toBeGreaterThan(0);
    expect(ms.lastDecisionTick).toBe(10);
  });

  it('does NOT change located_at edge (no teleporting)', () => {
    const graph = buildGraph();
    const tiles = buildTiles(COLS, ROWS);
    moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);

    const locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges.length).toBe(1);
    expect(locEdges[0].target).toBe('loc.start');
  });

  it('returns false when target hex is impassable (ocean)', () => {
    const graph = buildGraph();
    const overrides = new Map([['7,5', 'ocean']]);
    const tiles = buildTiles(COLS, ROWS, overrides);

    const result = moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);
    expect(result).toBe(false);

    const avatar = graph.getNode('avatar.1')!;
    expect(avatar.properties.movementState).toBeUndefined();
  });

  it('creates transient location nodes along the path', () => {
    const graph = buildGraph();
    const tiles = buildTiles(COLS, ROWS);

    // Count locations before
    const locsBefore = graph.getNodesByType('location').length;

    moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);

    // Locations should have increased (transients created for path hexes)
    const locsAfter = graph.getNodesByType('location').length;
    expect(locsAfter).toBeGreaterThan(locsBefore);

    // The movement queue should reference location node IDs
    const ms = getAvatarMovementState(graph, 'asc.1')!;
    for (const nodeId of ms.movementQueue) {
      const node = graph.getNode(nodeId);
      expect(node).toBeDefined();
      expect(node!.type).toBe('location');
      expect(node!.properties.terrain).toBe('grassland');
    }
  });

  it('returns false when avatar is already at the target hex', () => {
    const graph = buildGraph();
    const tiles = buildTiles(COLS, ROWS);
    const result = moveAvatarToHex(graph, 'asc.1', { col: 5, row: 5 }, 10, tiles, COLS, ROWS);

    expect(result).toBe(false);

    const avatar = graph.getNode('avatar.1')!;
    expect(avatar.properties.movementState).toBeUndefined();
  });

  it('returns false when no avatar exists for ascendant', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    const tiles = buildTiles(COLS, ROWS);

    const result = moveAvatarToHex(graph, 'asc.1', { col: 5, row: 5 }, 10, tiles, COLS, ROWS);
    expect(result).toBe(false);
  });

  it('sets a positive first edge cost', () => {
    const graph = buildGraph();
    const tiles = buildTiles(COLS, ROWS);
    moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);

    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    expect(ms.currentEdgeCost).toBeGreaterThan(0);
  });

  it('reuses existing location nodes instead of creating transients', () => {
    const graph = buildGraph();
    // Add a named location at the target hex
    graph.addNode({ id: 'loc.dest', type: 'location', name: 'Dest', properties: { hexCol: 7, hexRow: 5, locationType: 'settlement', terrain: 'grassland' } });

    const tiles = buildTiles(COLS, ROWS);
    const result = moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);
    expect(result).toBe(true);

    const avatar = graph.getNode('avatar.1')!;
    const ms = avatar.properties.movementState as MovementState;
    expect(ms.destinationId).toBe('loc.dest');
  });

  it('pathfinds around impassable terrain', () => {
    const graph = buildGraph();
    // Block several direct-path hexes with ocean to force a detour
    const overrides = new Map([['6,5', 'ocean'], ['6,4', 'ocean']]);
    const tiles = buildTiles(COLS, ROWS, overrides);

    const result = moveAvatarToHex(graph, 'asc.1', { col: 7, row: 5 }, 10, tiles, COLS, ROWS);
    expect(result).toBe(true);

    const ms = getAvatarMovementState(graph, 'asc.1')!;
    // Path should exist and avoid the ocean hexes
    expect(ms.movementQueue.length).toBeGreaterThanOrEqual(2);
    // Verify no movement queue node is at an ocean hex
    for (const nodeId of ms.movementQueue) {
      const node = graph.getNode(nodeId)!;
      expect(node.properties.terrain).not.toBe('ocean');
    }
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
  const COLS = 5;
  const ROWS = 3;

  beforeEach(() => {
    resetMovementEventCounter();
  });

  function buildGraph() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc.start', type: 'location', name: 'Start', properties: { hexCol: 0, hexRow: 0, locationType: 'wilderness', terrain: 'grassland' } });

    graph.addEdge({ id: 'e.avatar_of', source: 'avatar.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.located_at', source: 'avatar.1', target: 'loc.start', type: 'located_at', properties: {} });

    return graph;
  }

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
      agentKnowledge: new Map(),
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
    const tiles = buildTiles(COLS, ROWS);

    // Plan movement from (0,0) to (2,0) — a 2-step path
    const result = moveAvatarToHex(graph, 'asc.1', { col: 2, row: 0 }, 0, tiles, COLS, ROWS);
    expect(result).toBe(true);

    const ms0 = getAvatarMovementState(graph, 'asc.1');
    expect(ms0).not.toBeNull();
    expect(ms0!.movementQueue.length).toBe(2);

    const state = buildMinimalState(graph, 1);

    // 2-edge model: each hop costs 2 ticks on grassland
    // Tick 1: accumulate toward first hop
    phaseMovement(state);
    let locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges).toHaveLength(1);

    // Tick 2: avatar moves to first intermediate hex
    state.tick = 2;
    state.tickEvents = [];
    phaseMovement(state);
    locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).not.toBe('loc.start');

    // Tick 3: accumulate toward second hop
    state.tick = 3;
    state.tickEvents = [];
    phaseMovement(state);

    // Tick 4: avatar should arrive at destination
    state.tick = 4;
    state.tickEvents = [];
    phaseMovement(state);
    locEdges = graph.getOutgoingEdges('avatar.1', 'located_at');
    expect(locEdges).toHaveLength(1);

    // Movement state should show arrived (empty queue)
    const msFinal = getAvatarMovementState(graph, 'asc.1');
    expect(msFinal).not.toBeNull();
    expect(msFinal!.movementQueue).toEqual([]);
  });
});
