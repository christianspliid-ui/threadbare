/**
 * RoadMesh.test.ts — Unit tests for road mesh rendering.
 *
 * Road generation logic is tested in src/engine/__tests__/roadNetwork.test.ts.
 * These tests verify the renderer accepts RoadPath[] and produces correct geometry.
 */

import { describe, it, expect } from 'vitest';
import type { HexTile } from '../../../../types';
import type { RoadPath } from '../../../../engine/roadNetwork';

import {
  ROAD_CONSTANTS,
  createRoadMesh,
} from '../RoadMesh';
import { RENDER_ORDER, LAYER_Z } from '../RenderLayers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain = 'grassland'): HexTile {
  return {
    coord: { col, row },
    terrain: terrain as HexTile['terrain'],
    elevation: 0.5,
    moisture: 0.5,
  } as HexTile;
}

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

  it('Z_OFFSET matches LAYER_Z.ROADS', () => {
    expect(ROAD_CONSTANTS.Z_OFFSET).toBe(LAYER_Z.ROADS);
  });
});

// ─── createRoadMesh tests ─────────────────────────────────────────────────────

describe('createRoadMesh', () => {
  const tiles = [
    makeTile(0, 0), makeTile(1, 0), makeTile(2, 0),
    makeTile(0, 1), makeTile(1, 1), makeTile(2, 1),
  ];

  it('returns THREE.Group with renderOrder === RENDER_ORDER.ROADS for empty paths', () => {
    const group = createRoadMesh([], tiles);
    expect(group.renderOrder).toBe(RENDER_ORDER.ROADS);
    expect(group.renderOrder).toBe(5);
  });

  it('group is initially hidden (visible = false)', () => {
    const group = createRoadMesh([], tiles);
    expect(group.visible).toBe(false);
  });

  it('returns empty group for empty road paths', () => {
    const group = createRoadMesh([], tiles);
    expect(group.children.length).toBe(0);
  });

  it('creates geometry for a major road path', () => {
    const roadPaths: RoadPath[] = [{
      path: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }],
      roadType: 'major',
    }];
    const group = createRoadMesh(roadPaths, tiles);
    expect(group.children.length).toBeGreaterThan(0);
    expect(group.renderOrder).toBe(RENDER_ORDER.ROADS);
  });

  it('creates geometry for a trail road path', () => {
    const roadPaths: RoadPath[] = [{
      path: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }],
      roadType: 'trail',
    }];
    const group = createRoadMesh(roadPaths, tiles);
    expect(group.children.length).toBeGreaterThan(0);
  });

  it('creates separate meshes for major and trail roads', () => {
    const roadPaths: RoadPath[] = [
      {
        path: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }],
        roadType: 'major',
      },
      {
        path: [{ col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }],
        roadType: 'trail',
      },
    ];
    const group = createRoadMesh(roadPaths, tiles);
    // Should have 2 children: one for major, one for trail
    expect(group.children.length).toBe(2);
  });

  it('handles single-hex path gracefully (no geometry)', () => {
    const roadPaths: RoadPath[] = [{
      path: [{ col: 0, row: 0 }],
      roadType: 'major',
    }];
    const group = createRoadMesh(roadPaths, tiles);
    // Single-hex path can't produce a quad strip
    expect(group.children.length).toBe(0);
  });
});
