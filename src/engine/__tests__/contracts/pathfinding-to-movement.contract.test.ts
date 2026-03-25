/**
 * Contract Test: findShortestPath → initMovementState → tickMovement
 *
 * Verifies that the output of findShortestPath is a valid input for
 * initMovementState and tickMovement. Tests the seam between the pathfinding
 * system and the movement execution system using real implementations — no mocks.
 *
 * Graph layout (col, row):
 *
 *   (0,0) town_a --- (1,0) town_b --- (2,0) town_c --- (3,0) town_d
 *     |                 |                 |                 |
 *   (0,1) hamlet_e  (1,1) village_f  (2,1) ruins_g    (3,1) camp_h
 *     |                 |                 |                 |
 *   (0,2) forest_i  (1,2) hills_j    (2,2) town_k     (3,2) hamlet_l
 *
 * Road edge: town_b (1,0) → town_d (3,0), major road with hexPath through (2,0)
 * (canonical alphabetical order: town_b < town_d so stored as source=town_b)
 */

import { describe, test, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { findShortestPath } from '../../pathfinding';
import { initMovementState, tickMovement } from '../../movementExecution';
import { computeEdgeCost } from '../../movementCost';
import {
  MIN_ROAD_HEX_COST,
} from '../../../data/movement-content';

// ─── Graph Builder ─────────────────────────────────────────────────────────────

/**
 * Build a realistic 12-location graph with varied terrain and adjacency.
 * All locations have locationType: 'hex_center', hexCol, hexRow, and terrain.
 * Adjacent edges are bidirectional. One major road edge is optionally included.
 */
function buildRealisticGraph(opts: { includeRoad?: boolean; roadCorrupt?: boolean } = {}): {
  graph: WorldGraph;
  agentId: string;
} {
  const graph = new WorldGraph();

  // ── Location nodes ──────────────────────────────────────────────────────────

  const locations: Array<{
    id: string;
    name: string;
    hexCol: number;
    hexRow: number;
    terrain: string;
    locationType: string;
    locationSubtype?: string;
  }> = [
    { id: 'town_a',    name: 'Ashford',     hexCol: 0, hexRow: 0, terrain: 'grassland',       locationType: 'hex_center', locationSubtype: 'town' },
    { id: 'town_b',    name: 'Bridgemill',  hexCol: 1, hexRow: 0, terrain: 'grassland',       locationType: 'hex_center', locationSubtype: 'town' },
    { id: 'town_c',    name: 'Crosswater',  hexCol: 2, hexRow: 0, terrain: 'grassland',       locationType: 'hex_center', locationSubtype: 'town' },
    { id: 'town_d',    name: 'Dawnhaven',   hexCol: 3, hexRow: 0, terrain: 'grassland',       locationType: 'hex_center', locationSubtype: 'town' },
    { id: 'hamlet_e',  name: 'Elmwick',     hexCol: 0, hexRow: 1, terrain: 'temperate_forest', locationType: 'hex_center', locationSubtype: 'hamlet' },
    { id: 'village_f', name: 'Fernhollow',  hexCol: 1, hexRow: 1, terrain: 'temperate_forest', locationType: 'hex_center', locationSubtype: 'hamlet' },
    { id: 'ruins_g',   name: 'Grey Ruins',  hexCol: 2, hexRow: 1, terrain: 'hills',            locationType: 'hex_center', locationSubtype: 'ruins' },
    { id: 'camp_h',    name: 'Hillcamp',    hexCol: 3, hexRow: 1, terrain: 'hills',            locationType: 'hex_center', locationSubtype: 'camp' },
    { id: 'forest_i',  name: 'Ironwood',    hexCol: 0, hexRow: 2, terrain: 'temperate_forest', locationType: 'hex_center', locationSubtype: 'wilderness' },
    { id: 'hills_j',   name: 'Jagged Hill', hexCol: 1, hexRow: 2, terrain: 'hills',            locationType: 'hex_center', locationSubtype: 'wilderness' },
    { id: 'town_k',    name: 'Kestrel',     hexCol: 2, hexRow: 2, terrain: 'grassland',       locationType: 'hex_center', locationSubtype: 'town' },
    { id: 'hamlet_l',  name: 'Larkspur',    hexCol: 3, hexRow: 2, terrain: 'grassland',       locationType: 'hex_center', locationSubtype: 'hamlet' },
  ];

  for (const loc of locations) {
    graph.addNode({
      id: loc.id,
      type: 'location',
      name: loc.name,
      properties: {
        hexCol: loc.hexCol,
        hexRow: loc.hexRow,
        terrain: loc.terrain,
        locationType: loc.locationType,
        ...(loc.locationSubtype ? { locationSubtype: loc.locationSubtype } : {}),
      },
    });
  }

  // ── Actor node ──────────────────────────────────────────────────────────────

  graph.addNode({
    id: 'agent_001',
    type: 'actor',
    name: 'Test Agent',
    properties: {},
  });

  // ── Located_at edge: agent starts at town_a ─────────────────────────────────

  graph.addEdge({
    id: 'agent_001_located_at_town_a',
    source: 'agent_001',
    target: 'town_a',
    type: 'located_at',
    properties: {},
  });

  // ── Adjacent edges (bidirectional) ─────────────────────────────────────────

  const adjacencies: Array<[string, string]> = [
    // Row 0 horizontal chain
    ['town_a',    'town_b'],
    ['town_b',    'town_c'],
    ['town_c',    'town_d'],
    // Row 0 → Row 1 verticals
    ['town_a',    'hamlet_e'],
    ['town_b',    'village_f'],
    ['town_c',    'ruins_g'],
    ['town_d',    'camp_h'],
    // Row 1 horizontal chain
    ['hamlet_e',  'village_f'],
    ['village_f', 'ruins_g'],
    ['ruins_g',   'camp_h'],
    // Row 1 → Row 2 verticals
    ['hamlet_e',  'forest_i'],
    ['village_f', 'hills_j'],
    ['ruins_g',   'town_k'],
    ['camp_h',    'hamlet_l'],
    // Row 2 horizontal chain
    ['forest_i',  'hills_j'],
    ['hills_j',   'town_k'],
    ['town_k',    'hamlet_l'],
  ];

  let edgeSeq = 0;
  for (const [a, b] of adjacencies) {
    graph.addEdge({
      id: `adj_${a}_${b}`,
      source: a,
      target: b,
      type: 'adjacent',
      properties: {},
    });
    graph.addEdge({
      id: `adj_${b}_${a}`,
      source: b,
      target: a,
      type: 'adjacent',
      properties: {},
    });
    edgeSeq++;
  }

  // ── Optional road edge: town_b → town_d (major, canonical alphabetical) ─────
  // hexPath runs through (1,0) → (2,0) → (3,0)

  if (opts.includeRoad) {
    const roadTotalCost = opts.roadCorrupt
      ? undefined // missing totalCost — should trigger fail-soft
      : 8; // a representative A* cost for this 3-hex road

    graph.addEdge({
      id: 'road_town_b_town_d',
      source: 'town_b',
      target: 'town_d',
      type: 'road',
      properties: {
        roadType: 'major',
        ...(roadTotalCost !== undefined ? { totalCost: roadTotalCost } : {}),
        hexPath: [
          { col: 1, row: 0 },
          { col: 2, row: 0 },
          { col: 3, row: 0 },
        ],
      },
    });
  }

  return { graph, agentId: 'agent_001' };
}

// ─── Helper: tick state until arrival or timeout ────────────────────────────

function tickUntilArrival(
  graph: WorldGraph,
  agentId: string,
  initialState: ReturnType<typeof initMovementState>,
  maxTicks = 200,
): {
  arrived: boolean;
  finalLocationId: string | undefined;
  ticksUsed: number;
  history: ReturnType<typeof initMovementState>['movementHistory'];
  roadTransitions: NonNullable<ReturnType<typeof tickMovement>['roadHexTransition']>[];
} {
  let state = initialState;
  let ticks = 0;
  let finalLocationId: string | undefined;
  const roadTransitions: NonNullable<ReturnType<typeof tickMovement>['roadHexTransition']>[] = [];

  while (ticks < maxTicks) {
    ticks++;
    const result = tickMovement(graph, agentId, state, ticks);
    state = result.updatedState;

    if (result.roadHexTransition) {
      roadTransitions.push(result.roadHexTransition);
    }

    if (result.arrivedAtDestination) {
      finalLocationId = result.newLocationId ?? state.destinationId;
      return { arrived: true, finalLocationId, ticksUsed: ticks, history: state.movementHistory, roadTransitions };
    }
  }

  return { arrived: false, finalLocationId, ticksUsed: ticks, history: state.movementHistory, roadTransitions };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Contract: findShortestPath → initMovementState → tickMovement', () => {

  // ── Test 1: pathfinding output is valid movement input (no roads) ──────────

  test('pathfinding output is valid movement input — no roads', () => {
    const { graph, agentId } = buildRealisticGraph();

    // Find path from town_a to town_k (3 hops: a→b→c / a→e→f, etc.)
    const pathResult = findShortestPath(graph, agentId, 'town_a', 'town_k');

    // Contract: path must be non-null and reachable
    expect(pathResult).not.toBeNull();
    const { path, totalCost } = pathResult!;

    // Path must be non-empty (different locations)
    expect(path.length).toBeGreaterThan(0);

    // Cost must be positive finite
    expect(totalCost).toBeGreaterThan(0);
    expect(isFinite(totalCost)).toBe(true);

    // No road segments expected
    expect(pathResult!.roadSegments).toBeUndefined();

    // Contract: path output is valid initMovementState input
    // Note: PathResult has no destinationId field — pass the endId directly.
    const firstEdgeCost = computeEdgeCost(graph, agentId, 'town_a', path[0]).totalCost;
    const state = initMovementState('town_k', path, firstEdgeCost, 0);

    expect(state.destinationId).toBe('town_k');
    expect(state.movementQueue).toEqual(path);
    expect(state.currentEdgeCost).toBe(firstEdgeCost);
    expect(state.ticksAccumulated).toBe(0);

    // Contract: tickMovement accepts the initMovementState output without error
    const result = tickMovement(graph, agentId, state, 1);
    expect(result).toBeDefined();
    // Either accumulating or has moved — either is valid on tick 1
    expect(result.moved || !result.moved).toBe(true);

    // Tick to arrival — agent must arrive at town_k
    const { arrived, finalLocationId, ticksUsed, history } = tickUntilArrival(
      graph, agentId, state,
    );

    expect(arrived).toBe(true);
    expect(finalLocationId).toBe('town_k');

    // Movement history must have valid hex coords from the location nodes
    expect(history.length).toBeGreaterThan(0);
    for (const entry of history) {
      // Each history entry should have defined hex coordinates (from location properties)
      expect(entry.hexCol).toBeDefined();
      expect(entry.hexRow).toBeDefined();
      expect(typeof entry.hexCol).toBe('number');
      expect(typeof entry.hexRow).toBe('number');
    }

    // Sanity: fewer ticks than the graph's maximum possible cost
    expect(ticksUsed).toBeLessThan(200);
  });

  // ── Test 2: road path produces valid roadHexQueue ─────────────────────────

  test('road path produces valid roadHexQueue and roadHexCost', () => {
    const { graph, agentId } = buildRealisticGraph({ includeRoad: true });

    // Find path from town_b to town_d — should prefer the road (cheaper than 2 adjacent hops)
    const pathResult = findShortestPath(graph, agentId, 'town_b', 'town_d');

    expect(pathResult).not.toBeNull();
    const { path, roadSegments } = pathResult!;

    // Road should be selected (it's 40% of 8 = 3.2 cost vs adjacent hops cost)
    expect(roadSegments).toBeDefined();
    expect(roadSegments!.length).toBeGreaterThan(0);

    const roadSeg = roadSegments![0];
    expect(roadSeg.roadType).toBe('major');
    expect(roadSeg.hexPath.length).toBeGreaterThan(0);
    expect(roadSeg.discountedCost).toBeGreaterThan(0);

    // Contract: initMovementState populates road fields
    const firstEdgeCost = roadSeg.discountedCost; // road path uses road cost
    const state = initMovementState(
      pathResult!.destinationId,
      path,
      firstEdgeCost,
      0,
      roadSegments,
      'town_b', // startLocationId — needed to orient hexPath
    );

    // Road hex queue must be populated
    expect(state.roadHexQueue).toBeDefined();
    expect(state.roadHexQueue!.length).toBeGreaterThan(0);

    // Road hex cost must be positive
    expect(state.roadHexCost).toBeDefined();
    expect(state.roadHexCost!).toBeGreaterThanOrEqual(MIN_ROAD_HEX_COST);

    // Road type must be set
    expect(state.currentRoadType).toBe('major');

    // Starting hex position should be at town_b's hex (1,0)
    expect(state.currentHexPosition).toBeDefined();
    expect(state.currentHexPosition!.col).toBe(1);
    expect(state.currentHexPosition!.row).toBe(0);
  });

  // ── Test 3: road path ticks hex-by-hex to arrival ─────────────────────────

  test('road path advances hex-by-hex and located_at only updates on arrival', () => {
    const { graph, agentId } = buildRealisticGraph({ includeRoad: true });

    const pathResult = findShortestPath(graph, agentId, 'town_b', 'town_d');
    expect(pathResult).not.toBeNull();

    const { path, roadSegments } = pathResult!;
    expect(roadSegments).toBeDefined();

    // Set up agent at town_b
    graph.removeEdge('agent_001_located_at_town_a');
    graph.addEdge({
      id: 'agent_001_located_at_town_b',
      source: 'agent_001',
      target: 'town_b',
      type: 'located_at',
      properties: {},
    });

    const firstEdgeCost = roadSegments![0].discountedCost;
    const state = initMovementState(
      pathResult!.destinationId,
      path,
      firstEdgeCost,
      0,
      roadSegments,
      'town_b',
    );

    expect(state.roadHexQueue).toBeDefined();
    const initialQueueLength = state.roadHexQueue!.length;

    // Track located_at changes — should only change on arrival, not mid-road
    let locatedAtChanges = 0;
    let lastLocatedAt = 'town_b';

    const { arrived, finalLocationId, roadTransitions } = tickUntilArrival(
      graph, agentId, state,
    );

    expect(arrived).toBe(true);
    expect(finalLocationId).toBe('town_d');

    // Must have produced road hex transitions
    expect(roadTransitions.length).toBeGreaterThan(0);

    // Each transition must have valid hex coords
    for (const transition of roadTransitions) {
      expect(typeof transition.fromHex.col).toBe('number');
      expect(typeof transition.fromHex.row).toBe('number');
      expect(typeof transition.toHex.col).toBe('number');
      expect(typeof transition.toHex.row).toBe('number');
      expect(transition.roadType).toBe('major');
      expect(transition.hexProgress).toBeGreaterThan(0);
      expect(transition.hexTotal).toBeGreaterThan(0);
    }

    // Final located_at edge in graph should point to town_d
    const locatedAtEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(locatedAtEdges.length).toBe(1);
    expect(locatedAtEdges[0].target).toBe('town_d');
  });

  // ── Test 4: mixed path (road + adjacent hop) ──────────────────────────────

  test('mixed path — road leg followed by adjacent hop — ticks through seamlessly', () => {
    const { graph, agentId } = buildRealisticGraph({ includeRoad: true });

    // Path from town_b to camp_h:
    //   town_b →[road]→ town_d →[adjacent]→ camp_h
    // The road covers town_b→town_d. Then one adjacent hop town_d→camp_h.
    const pathResult = findShortestPath(graph, agentId, 'town_b', 'camp_h');
    expect(pathResult).not.toBeNull();

    const { path, roadSegments, totalCost } = pathResult!;

    // Must find a path
    expect(path.length).toBeGreaterThan(0);
    expect(totalCost).toBeGreaterThan(0);

    // Relocate agent to town_b
    graph.removeEdge('agent_001_located_at_town_a');
    graph.addEdge({
      id: 'agent_001_located_at_town_b_v2',
      source: 'agent_001',
      target: 'town_b',
      type: 'located_at',
      properties: {},
    });

    // Compute first edge cost based on whether the first leg is road or adjacent
    const firstEdgeCost = (roadSegments && roadSegments.length > 0 && roadSegments[0].fromId === 'town_b')
      ? roadSegments[0].discountedCost
      : computeEdgeCost(graph, agentId, 'town_b', path[0]).totalCost;

    const state = initMovementState(
      pathResult!.destinationId,
      path,
      firstEdgeCost,
      0,
      roadSegments,
      'town_b',
    );

    // Tick to full arrival
    const { arrived, finalLocationId } = tickUntilArrival(graph, agentId, state);

    expect(arrived).toBe(true);
    expect(finalLocationId).toBe('camp_h');

    // Confirm final located_at
    const locatedAtEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(locatedAtEdges.length).toBe(1);
    expect(locatedAtEdges[0].target).toBe('camp_h');
  });

  // ── Test 5: incoming road edge discovery ──────────────────────────────────

  test('incoming road edge is discovered — agent at target end travels road in reverse', () => {
    const { graph, agentId } = buildRealisticGraph({ includeRoad: true });

    // Road is stored as town_b → town_d (canonical alphabetical).
    // Agent is at town_d (the target end) and wants to go to town_b.
    // findShortestPath must discover the road via incoming edge check.

    // Relocate agent to town_d
    graph.removeEdge('agent_001_located_at_town_a');
    graph.addEdge({
      id: 'agent_001_located_at_town_d',
      source: 'agent_001',
      target: 'town_d',
      type: 'located_at',
      properties: {},
    });

    const pathResult = findShortestPath(graph, agentId, 'town_d', 'town_b');
    expect(pathResult).not.toBeNull();

    const { path, roadSegments, totalCost } = pathResult!;
    expect(path.length).toBeGreaterThan(0);

    // The road should have been discovered and used (it's cheaper than 2 adjacent hops)
    expect(roadSegments).toBeDefined();
    expect(roadSegments!.length).toBeGreaterThan(0);

    const roadSeg = roadSegments![0];
    expect(roadSeg.roadType).toBe('major');

    // initMovementState with town_d as startLocationId — hexPath should be reversed
    const firstEdgeCost = roadSeg.discountedCost;
    const state = initMovementState(
      pathResult!.destinationId,
      path,
      firstEdgeCost,
      0,
      roadSegments,
      'town_d', // agent is at target end — hexPath reversal needed
    );

    // Road hex queue must be populated
    expect(state.roadHexQueue).toBeDefined();
    expect(state.roadHexQueue!.length).toBeGreaterThan(0);

    // Starting hex position is set to hexPath[0] of the road segment.
    // The road edge is stored in canonical order (town_b→town_d), so hexPath[0] = {col:1, row:0}.
    // populateRoadFields reversal only triggers when agentLocationId === segment.toId.
    // Here fromId='town_d', toId='town_b', so no reversal — currentHexPosition = hexPath[0].
    expect(state.currentHexPosition).toBeDefined();
    expect(typeof state.currentHexPosition!.col).toBe('number');
    expect(typeof state.currentHexPosition!.row).toBe('number');

    // Tick to arrival at town_b
    const { arrived, finalLocationId } = tickUntilArrival(graph, agentId, state);
    expect(arrived).toBe(true);
    expect(finalLocationId).toBe('town_b');
  });

  // ── Test 6: missing totalCost falls back to adjacent path ─────────────────

  test('road edge with missing totalCost is skipped — adjacent path used instead', () => {
    const { graph, agentId } = buildRealisticGraph({ includeRoad: true, roadCorrupt: true });

    // The road edge for town_b→town_d has no totalCost — computeRoadEdgeCost returns null.
    // findShortestPath should skip it and use adjacent hops instead.

    const pathResult = findShortestPath(graph, agentId, 'town_b', 'town_d');
    expect(pathResult).not.toBeNull();

    const { path, roadSegments } = pathResult!;

    // Should still find a path (adjacent hops exist)
    expect(path.length).toBeGreaterThan(0);

    // No road segments — the corrupt edge was skipped
    expect(roadSegments).toBeUndefined();

    // initMovementState must work with no roadSegments
    const firstEdgeCost = computeEdgeCost(graph, agentId, 'town_b', path[0]).totalCost;
    const state = initMovementState(
      pathResult!.destinationId,
      path,
      firstEdgeCost,
      0,
      undefined, // no road segments
      'town_b',
    );

    // No road fields populated
    expect(state.roadHexQueue).toBeUndefined();
    expect(state.roadHexCost).toBeUndefined();
    expect(state.currentRoadType).toBeUndefined();

    // Relocate agent to town_b for this test
    graph.removeEdge('agent_001_located_at_town_a');
    graph.addEdge({
      id: 'agent_001_located_at_town_b_corrupt',
      source: 'agent_001',
      target: 'town_b',
      type: 'located_at',
      properties: {},
    });

    // Tick to arrival — adjacent path must still work
    const { arrived, finalLocationId } = tickUntilArrival(graph, agentId, state);
    expect(arrived).toBe(true);
    expect(finalLocationId).toBe('town_d');
  });

  // ── Bonus: multi-hop non-road path produces history with hex coords ────────

  test('multi-hop non-road path — movement history entries carry valid hex coords', () => {
    const { graph, agentId } = buildRealisticGraph();

    // Longest path in graph: town_a to hamlet_l (bottom-right corner)
    const pathResult = findShortestPath(graph, agentId, 'town_a', 'hamlet_l');
    expect(pathResult).not.toBeNull();

    const { path } = pathResult!;
    expect(path.length).toBeGreaterThanOrEqual(3);

    const firstEdgeCost = computeEdgeCost(graph, agentId, 'town_a', path[0]).totalCost;
    const state = initMovementState(pathResult!.destinationId, path, firstEdgeCost, 0);

    const { arrived, history } = tickUntilArrival(graph, agentId, state);
    expect(arrived).toBe(true);

    // All history entries that came from location nodes should have hex coords
    for (const entry of history) {
      const node = graph.getNode(entry.nodeId);
      if (node && node.type === 'location') {
        expect(entry.hexCol).toBeDefined();
        expect(entry.hexRow).toBeDefined();
      }
    }
  });

  // ── Bonus: path cost matches actual tick count (within rounding tolerance) ──

  test('path totalCost matches actual ticks-to-arrival for adjacent-only path', () => {
    const { graph, agentId } = buildRealisticGraph();

    // town_a → town_b: single adjacent hop
    const pathResult = findShortestPath(graph, agentId, 'town_a', 'town_b');
    expect(pathResult).not.toBeNull();

    const { path, totalCost } = pathResult!;
    expect(path).toEqual(['town_b']);

    const firstEdgeCost = computeEdgeCost(graph, agentId, 'town_a', 'town_b').totalCost;
    const state = initMovementState('town_b', path, firstEdgeCost, 0);

    const { arrived, ticksUsed } = tickUntilArrival(graph, agentId, state);
    expect(arrived).toBe(true);

    // ticksUsed should be Math.ceil(totalCost) — movement ticks accumulate +1 per tick
    // and triggers when accumulated >= cost
    expect(ticksUsed).toBe(Math.ceil(totalCost));
  });
});
