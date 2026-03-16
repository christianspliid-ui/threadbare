import { describe, it, expect } from 'vitest';
import { moveAvatarToHex, getAvatarMovementState, clearAvatarMovement } from '../avatarMove';
import { WorldGraph } from '../graph';
import type { MovementState } from '../../types/movement';

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
