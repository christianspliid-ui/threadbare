/**
 * GeoBorderMesh draws the Area partition (THR-1155).
 *
 * The dotted geographic borders used to come from a region detector run inside the
 * renderer, keyed by cluster index; they come from `areaProjection` now, keyed by the
 * Area's own node id. This asserts the geometry that change produces, because
 * Playwright cannot see WebGL canvas content and a screenshot of this layer proves
 * less than the vertex count does: a border either has segments on the boundary
 * between two Areas or it does not.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { HexTile, TerrainType, HexCoord } from '../../../../types';
import type { AreaProjection } from '../../../../engine/areaProjection';
import { createGeoBorderMesh } from '../GeoBorderMesh';
import { hexKey } from '../../../../lib/hexKey';

function makeTile(col: number, row: number, terrain: TerrainType = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  };
}

/** A 4×4 grid. */
function grid(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) tiles.push(makeTile(col, row));
  return tiles;
}

/** Assign each hex to an Area by a predicate, and build the projection over it. */
function projectionBy(areaOf: (h: HexCoord) => string): AreaProjection {
  const hexAreaId = new Map<string, string>();
  const hexesByArea = new Map<string, HexCoord[]>();
  for (const tile of grid()) {
    const id = areaOf(tile.coord);
    hexAreaId.set(hexKey(tile.coord.col, tile.coord.row), id);
    if (!hexesByArea.has(id)) hexesByArea.set(id, []);
    hexesByArea.get(id)!.push(tile.coord);
  }
  return {
    areas: [...hexesByArea].map(([id, hexes]) => ({
      id, name: id, featureType: 'plains' as const, hexes, center: hexes[0],
    })),
    hexAreaId,
  };
}

/** Vertices in the returned LineSegments, or 0 when it drew nothing. */
function vertexCount(mesh: THREE.LineSegments): number {
  const position = mesh.geometry.getAttribute('position');
  return position ? position.count : 0;
}

describe('createGeoBorderMesh — borders follow Area membership', () => {
  it('draws segments where two Areas meet', () => {
    // Split the grid down the middle: cols 0–1 one Area, cols 2–3 another.
    const mesh = createGeoBorderMesh(
      projectionBy(h => (h.col < 2 ? 'region_0' : 'region_1')),
      new Map(),
      grid(),
    );
    expect(mesh).toBeInstanceOf(THREE.LineSegments);
    expect(vertexCount(mesh)).toBeGreaterThan(0);
  });

  it('draws nothing when the whole grid is one Area — the arm that makes the above mean something', () => {
    // Same tiles, same call, one membership: if this also produced geometry, the test
    // above would be measuring "the mesh emits vertices", not "it follows membership".
    const mesh = createGeoBorderMesh(
      projectionBy(() => 'region_0'),
      new Map(),
      grid(),
    );
    expect(vertexCount(mesh)).toBe(0);
  });

  it('draws nothing on an empty partition', () => {
    const mesh = createGeoBorderMesh({ areas: [], hexAreaId: new Map() }, new Map(), grid());
    expect(vertexCount(mesh)).toBe(0);
  });

  it('more Areas means more border — the geometry tracks the partition, not the tile count', () => {
    const tiles = grid();
    const twoWay = createGeoBorderMesh(projectionBy(h => (h.col < 2 ? 'a' : 'b')), new Map(), tiles);
    const fourWay = createGeoBorderMesh(projectionBy(h => `a${h.col}`), new Map(), tiles);
    expect(vertexCount(fourWay)).toBeGreaterThan(vertexCount(twoWay));
  });

  it('suppresses an Area edge that a political border already draws', () => {
    // The clutter rule this layer has always had, preserved across the source swap:
    // where two hexes differ in *both* Area and province, the red political border
    // carries the line and the dotted one stands down.
    const projection = projectionBy(h => (h.col < 2 ? 'region_0' : 'region_1'));
    const hexProvinceId = new Map<string, number>();
    for (const tile of grid()) {
      hexProvinceId.set(hexKey(tile.coord.col, tile.coord.row), tile.coord.col < 2 ? 0 : 1);
    }
    const suppressed = createGeoBorderMesh(projection, hexProvinceId, grid());
    const unsuppressed = createGeoBorderMesh(projection, new Map(), grid());
    expect(vertexCount(unsuppressed)).toBeGreaterThan(0);
    expect(vertexCount(suppressed)).toBe(0);
  });

  it('keys on the Area node id, so two Areas can never collide by list position', () => {
    // The defect the projection replaced: the renderer keyed on a cluster *index* from
    // its own detector and the graph keyed on a node id, and `gameInit` joined the two
    // by position. Ids are strings here and come from the nodes themselves, so the
    // border between `region_10` and `region_2` is drawn on their identity, not on an
    // ordering either side could disagree about.
    const mesh = createGeoBorderMesh(
      projectionBy(h => (h.col < 2 ? 'region_10' : 'region_2')),
      new Map(),
      grid(),
    );
    expect(vertexCount(mesh)).toBeGreaterThan(0);
  });
});
