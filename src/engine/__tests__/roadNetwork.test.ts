/**
 * roadNetwork.test.ts — Tests for MST-based road network generation.
 *
 * Tests the worldgen road generation algorithm:
 * - MST per province for major roads
 * - Trail stubs connecting hamlets to nearest road node
 * - Determinism, fail-soft, and extractRoadPaths round-trip
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HexCoord, HexTile } from '../../types';
import { WorldGraph } from '../graph';
import { generateRoadEdges, extractRoadPaths, ROAD_NETWORK_CONSTANTS } from '../roadNetwork';

// Mock findHexPath so tests don't depend on real A* over real terrain
vi.mock('../pathfinding', () => ({
  findHexPath: vi.fn(),
}));

import { findHexPath } from '../pathfinding';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain = 'grassland'): HexTile {
  return {
    coord: { col, row },
    terrain: terrain as HexTile['terrain'],
    elevation: 0.5,
    moisture: 0.5,
  } as HexTile;
}

function makeGrid(cols: number, rows: number): HexTile[] {
  const tiles: HexTile[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      tiles.push(makeTile(c, r));
    }
  }
  return tiles;
}

/**
 * Build a minimal graph with regions and locations.
 * All locations placed in the same region unless regionMap is provided.
 */
function buildTestGraph(
  locations: Array<{ id: string; col: number; row: number; type: string }>,
  regionAssignments?: Record<string, string>, // locId → regionId
): WorldGraph {
  const graph = new WorldGraph();

  // Create a default region
  const regionIds = new Set<string>();
  if (regionAssignments) {
    for (const rid of Object.values(regionAssignments)) regionIds.add(rid);
  } else {
    regionIds.add('region_0');
  }

  for (const rid of regionIds) {
    graph.addNode({
      id: rid,
      type: 'region',
      name: `Region ${rid}`,
      properties: {},
    });
  }

  // Create location nodes
  for (const loc of locations) {
    graph.addNode({
      id: loc.id,
      type: 'location',
      name: `Location ${loc.id}`,
      properties: {
        hexCol: loc.col,
        hexRow: loc.row,
        locationType: loc.type,
        locationSubtype: loc.type,
      },
    });

    // Add contains edge from region to location
    const regionId = regionAssignments?.[loc.id] ?? 'region_0';
    graph.addEdge({
      id: `contains_${regionId}_${loc.id}`,
      source: regionId,
      target: loc.id,
      type: 'contains',
      properties: {},
    });
  }

  return graph;
}

/** Setup findHexPath mock to return simple linear path */
function mockLinearPath() {
  vi.mocked(findHexPath).mockImplementation((_tiles, from, to) => {
    if (from.col === to.col && from.row === to.row) return { path: [], totalCost: 0 };
    // Simple path: just return the destination
    const path: HexCoord[] = [to];
    const cost = Math.abs(to.col - from.col) + Math.abs(to.row - from.row);
    return { path, totalCost: cost };
  });
}

const COLS = 10;
const ROWS = 10;

// ─── Constants ────────────────────────────────────────────────────────────────

describe('ROAD_NETWORK_CONSTANTS', () => {
  it('ROAD_WORTHY_TYPES includes capital, city, town, fort, castle', () => {
    const types = ROAD_NETWORK_CONSTANTS.ROAD_WORTHY_TYPES;
    expect(types).toContain('capital');
    expect(types).toContain('city');
    expect(types).toContain('town');
    expect(types).toContain('fort');
    expect(types).toContain('castle');
  });

  it('TRAIL_WORTHY_TYPES includes hamlet', () => {
    expect(ROAD_NETWORK_CONSTANTS.TRAIL_WORTHY_TYPES).toContain('hamlet');
  });
});

// ─── generateRoadEdges ────────────────────────────────────────────────────────

describe('generateRoadEdges', () => {
  const tiles = makeGrid(COLS, ROWS);

  beforeEach(() => {
    vi.mocked(findHexPath).mockReset();
    mockLinearPath();
  });

  it('does nothing with empty graph', () => {
    const graph = new WorldGraph();
    generateRoadEdges(graph, tiles, COLS, ROWS);
    expect(graph.getEdgesByType('road')).toEqual([]);
  });

  it('does nothing with 1 location', () => {
    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);
    expect(graph.getEdgesByType('road')).toEqual([]);
  });

  it('creates major road between 2 road-worthy settlements in same region', () => {
    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
      { id: 'loc_1', col: 5, row: 0, type: 'town' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const roads = graph.getEdgesByType('road');
    expect(roads.length).toBe(1);
    expect(roads[0].properties.roadType).toBe('major');
    expect(roads[0].type).toBe('road');
  });

  it('creates MST with N-1 edges for N road-worthy settlements', () => {
    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'capital' },
      { id: 'loc_1', col: 3, row: 0, type: 'city' },
      { id: 'loc_2', col: 6, row: 0, type: 'town' },
      { id: 'loc_3', col: 9, row: 0, type: 'fort' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const roads = graph.getEdgesByType('road').filter(e => e.properties.roadType === 'major');
    // MST of 4 settlements = 3 edges
    expect(roads.length).toBe(3);
  });

  it('creates trail from hamlet to nearest road-worthy settlement', () => {
    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
      { id: 'loc_1', col: 5, row: 0, type: 'town' },
      { id: 'loc_2', col: 1, row: 1, type: 'hamlet' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const trails = graph.getEdgesByType('road').filter(e => e.properties.roadType === 'trail');
    expect(trails.length).toBe(1);
    // Hamlet should connect to nearest road-worthy (loc_0 at 0,0 is closer than loc_1 at 5,0)
  });

  it('does not create roads between different regions', () => {
    const graph = buildTestGraph(
      [
        { id: 'loc_0', col: 0, row: 0, type: 'city' },
        { id: 'loc_1', col: 5, row: 0, type: 'city' },
      ],
      { loc_0: 'region_0', loc_1: 'region_1' },
    );
    generateRoadEdges(graph, tiles, COLS, ROWS);

    // Each region has only 1 settlement → no roads possible
    expect(graph.getEdgesByType('road')).toEqual([]);
  });

  it('edge properties include hexPath, totalCost, pathLength', () => {
    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
      { id: 'loc_1', col: 3, row: 0, type: 'town' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const road = graph.getEdgesByType('road')[0];
    expect(road.properties.hexPath).toBeDefined();
    expect(road.properties.totalCost).toBeDefined();
    expect(road.properties.pathLength).toBeDefined();
    expect(typeof road.properties.totalCost).toBe('number');
    expect(typeof road.properties.pathLength).toBe('number');
    expect(Array.isArray(road.properties.hexPath)).toBe(true);
  });

  it('edge IDs use canonical ordering (lower ID first)', () => {
    const graph = buildTestGraph([
      { id: 'loc_1', col: 5, row: 0, type: 'city' },
      { id: 'loc_0', col: 0, row: 0, type: 'town' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const road = graph.getEdgesByType('road')[0];
    expect(road.id).toBe('road_loc_0_loc_1');
  });

  it('is deterministic — same inputs produce same edges', () => {
    const makeGraph = () => buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'capital' },
      { id: 'loc_1', col: 3, row: 0, type: 'city' },
      { id: 'loc_2', col: 6, row: 3, type: 'town' },
      { id: 'loc_3', col: 1, row: 4, type: 'hamlet' },
    ]);

    const graph1 = makeGraph();
    generateRoadEdges(graph1, tiles, COLS, ROWS);
    const roads1 = graph1.getEdgesByType('road').map(e => e.id).sort();

    const graph2 = makeGraph();
    generateRoadEdges(graph2, tiles, COLS, ROWS);
    const roads2 = graph2.getEdgesByType('road').map(e => e.id).sort();

    expect(roads1).toEqual(roads2);
  });

  it('handles null A* results gracefully (water-blocked)', () => {
    vi.mocked(findHexPath).mockReturnValue(null);

    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
      { id: 'loc_1', col: 5, row: 0, type: 'town' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    expect(graph.getEdgesByType('road')).toEqual([]);
  });

  it('hamlet with no reachable road-worthy settlement produces no trail', () => {
    // Only return null for hamlet→city path (water blocked)
    vi.mocked(findHexPath).mockImplementation((_tiles, from, to) => {
      // Let city-city path work, but block hamlet paths
      if (from.col === 9 && from.row === 9) return null;
      return { path: [to], totalCost: 5 };
    });

    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
      { id: 'loc_1', col: 3, row: 0, type: 'city' },
      { id: 'loc_2', col: 9, row: 9, type: 'hamlet' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const trails = graph.getEdgesByType('road').filter(e => e.properties.roadType === 'trail');
    expect(trails.length).toBe(0);
  });
});

// ─── extractRoadPaths ─────────────────────────────────────────────────────────

describe('extractRoadPaths', () => {
  const tiles = makeGrid(COLS, ROWS);

  beforeEach(() => {
    vi.mocked(findHexPath).mockReset();
    mockLinearPath();
  });

  it('returns empty array for graph with no road edges', () => {
    const graph = new WorldGraph();
    expect(extractRoadPaths(graph)).toEqual([]);
  });

  it('round-trips: generateRoadEdges → extractRoadPaths returns correct RoadPath[]', () => {
    const graph = buildTestGraph([
      { id: 'loc_0', col: 0, row: 0, type: 'city' },
      { id: 'loc_1', col: 5, row: 0, type: 'town' },
      { id: 'loc_2', col: 2, row: 2, type: 'hamlet' },
    ]);
    generateRoadEdges(graph, tiles, COLS, ROWS);

    const roadPaths = extractRoadPaths(graph);
    // Should have 1 major (city-town MST) + 1 trail (hamlet to nearest)
    expect(roadPaths.length).toBe(2);

    const majors = roadPaths.filter(p => p.roadType === 'major');
    const trails = roadPaths.filter(p => p.roadType === 'trail');
    expect(majors.length).toBe(1);
    expect(trails.length).toBe(1);

    // Each path should have valid hex coordinates
    for (const rp of roadPaths) {
      expect(rp.path.length).toBeGreaterThanOrEqual(2);
      for (const coord of rp.path) {
        expect(typeof coord.col).toBe('number');
        expect(typeof coord.row).toBe('number');
      }
    }
  });
});
