/**
 * RoadMesh.test.ts — Unit tests for road mesh logic.
 *
 * TDD RED: Tests written before implementation.
 * Mocks findHexPath to return predetermined paths.
 * Three.js geometry tests verify group children and renderOrder.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HexCoord, HexTile } from '../../../../types';
import type { LocationNode } from '../LocationIconMesh';

// Mock findHexPath before importing RoadMesh
vi.mock('../../../../engine/pathfinding', () => ({
  findHexPath: vi.fn(),
}));

// Mock Three.js
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return actual;
});

import { findHexPath } from '../../../../engine/pathfinding';
import {
  ROAD_CONSTANTS,
  generateRoadPaths,
  classifyRoad,
  createRoadMesh,
} from '../RoadMesh';
import { RENDER_ORDER } from '../RenderLayers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain = 'grassland'): HexTile {
  return {
    coord: { col, row },
    terrain: terrain as HexTile['terrain'],
    elevation: 0.5,
    moisture: 0.5,
  } as HexTile;
}

function makeLocation(
  col: number,
  row: number,
  locationType = 'town',
  name = 'Test Town',
): LocationNode {
  return { hexCol: col, hexRow: row, locationType, name };
}

const COLS = 10;
const ROWS = 10;

// ─── ROAD_CONSTANTS tests ─────────────────────────────────────────────────────

describe('ROAD_CONSTANTS', () => {
  it('MAJOR_COLOR is correct warm earth brown', () => {
    expect(ROAD_CONSTANTS.MAJOR_COLOR).toBe('#6b5a40');
  });

  it('TRAIL_COLOR is correct darker earth brown', () => {
    expect(ROAD_CONSTANTS.TRAIL_COLOR).toBe('#4a3d2c');
  });

  it('MAJOR_HALF_WIDTH is 0.4', () => {
    expect(ROAD_CONSTANTS.MAJOR_HALF_WIDTH).toBe(0.4);
  });

  it('TRAIL_HALF_WIDTH is 0.1', () => {
    expect(ROAD_CONSTANTS.TRAIL_HALF_WIDTH).toBe(0.1);
  });

  it('Z_OFFSET is 0.025', () => {
    expect(ROAD_CONSTANTS.Z_OFFSET).toBe(0.025);
  });
});

// ─── classifyRoad tests ───────────────────────────────────────────────────────

describe('classifyRoad', () => {
  it('returns major for capital-to-city', () => {
    expect(classifyRoad('capital', 'city')).toBe('major');
  });

  it('returns major for town-to-town', () => {
    expect(classifyRoad('town', 'town')).toBe('major');
  });

  it('returns major for castle-to-fort', () => {
    expect(classifyRoad('castle', 'fort')).toBe('major');
  });

  it('returns trail for hamlet-to-town', () => {
    // hamlet is not in MAJOR_ROAD_TYPES
    expect(classifyRoad('hamlet', 'town')).toBe('trail');
  });

  it('returns trail for camp-to-hamlet', () => {
    expect(classifyRoad('camp', 'hamlet')).toBe('trail');
  });

  it('returns trail when one side is hamlet', () => {
    expect(classifyRoad('city', 'hamlet')).toBe('trail');
  });
});

// ─── generateRoadPaths tests ──────────────────────────────────────────────────

describe('generateRoadPaths', () => {
  const tiles = [
    makeTile(0, 0), makeTile(1, 0), makeTile(2, 0),
    makeTile(0, 1), makeTile(1, 1), makeTile(2, 1),
    makeTile(0, 2), makeTile(1, 2), makeTile(2, 2),
    makeTile(3, 3),
  ];

  beforeEach(() => {
    vi.mocked(findHexPath).mockReset();
  });

  it('returns empty array with 0 settlements', () => {
    const result = generateRoadPaths([], tiles, COLS, ROWS);
    expect(result).toEqual([]);
  });

  it('returns empty array with 1 settlement', () => {
    const locations = [makeLocation(0, 0, 'town')];
    const result = generateRoadPaths(locations, tiles, COLS, ROWS);
    expect(result).toEqual([]);
  });

  it('returns 1 path for 2 settlements on land (bidirectional dedup)', () => {
    // findHexPath returns path excluding start coord; implementation prepends start
    const pathFromFinder: HexCoord[] = [{ col: 1, row: 0 }, { col: 2, row: 0 }];
    vi.mocked(findHexPath).mockReturnValue({ path: pathFromFinder, totalCost: 10 });

    const locations = [
      makeLocation(0, 0, 'town'),
      makeLocation(2, 0, 'city'),
    ];
    const result = generateRoadPaths(locations, tiles, COLS, ROWS);
    // Should deduplicate so only 1 path (not 2 for both directions)
    expect(result.length).toBe(1);
    // Full path includes start coord prepended
    expect(result[0].path[0]).toEqual({ col: 0, row: 0 });
    expect(result[0].path[result[0].path.length - 1]).toEqual({ col: 2, row: 0 });
    // Both endpoints are major road types → major road
    expect(result[0].roadType).toBe('major');
  });

  it('does NOT route through ocean hexes', () => {
    // If findHexPath returns null (ocean blocked), no path generated
    vi.mocked(findHexPath).mockReturnValue(null);
    const locations = [
      makeLocation(0, 0, 'town'),
      makeLocation(9, 9, 'city'),
    ];
    const result = generateRoadPaths(locations, tiles, COLS, ROWS);
    expect(result).toEqual([]);
  });

  it('generates paths connecting nearest neighbors for 3 settlements', () => {
    const path1: HexCoord[] = [{ col: 1, row: 0 }];
    const path2: HexCoord[] = [{ col: 1, row: 1 }];
    vi.mocked(findHexPath).mockReturnValue({ path: path1, totalCost: 5 });

    const locations = [
      makeLocation(0, 0, 'city'),
      makeLocation(2, 0, 'city'),
      makeLocation(2, 2, 'city'),
    ];
    const result = generateRoadPaths(locations, tiles, COLS, ROWS);
    // Expect at least 1 path (K-nearest ensures some connections)
    expect(result.length).toBeGreaterThan(0);
  });

  it('ignores non-settlement location types', () => {
    const locations = [
      makeLocation(0, 0, 'ruin'),
      makeLocation(2, 0, 'dungeon'),
    ];
    const result = generateRoadPaths(locations, tiles, COLS, ROWS);
    expect(result).toEqual([]);
  });
});

// ─── createRoadMesh tests ─────────────────────────────────────────────────────

describe('createRoadMesh', () => {
  beforeEach(() => {
    vi.mocked(findHexPath).mockReset();
  });

  it('returns THREE.Group with renderOrder === RENDER_ORDER.ROADS (5) for 0 settlements', () => {
    const group = createRoadMesh([], [], COLS, ROWS);
    expect(group.renderOrder).toBe(RENDER_ORDER.ROADS);
    expect(group.renderOrder).toBe(5);
  });

  it('returns group with road geometry children for 2 settlements', () => {
    const path: HexCoord[] = [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }];
    vi.mocked(findHexPath).mockReturnValue({ path, totalCost: 20 });

    const tiles = [
      makeTile(0, 0), makeTile(1, 0), makeTile(2, 0),
    ];
    const locations = [
      makeLocation(0, 0, 'city'),
      makeLocation(2, 0, 'town'),
    ];
    const group = createRoadMesh(locations, tiles, COLS, ROWS);
    // Group should have children (road mesh)
    expect(group.children.length).toBeGreaterThan(0);
    expect(group.renderOrder).toBe(RENDER_ORDER.ROADS);
  });

  it('group is initially hidden (visible = false)', () => {
    const group = createRoadMesh([], [], COLS, ROWS);
    expect(group.visible).toBe(false);
  });
});
