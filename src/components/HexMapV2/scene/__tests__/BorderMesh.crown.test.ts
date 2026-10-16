/**
 * The crown's outline (THR-1932): one outer line around a Crown's own hexes and its
 * sworn realms', drawn as a child of the realm border; nothing when no realm is sworn.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { HexTile, TerrainType } from '../../../../types';
import type { RealmProjection } from '../../../../engine/realmProjection';
import { createBorderMesh, createCrownOutlineMesh, CROWN_OUTLINE_OPACITY } from '../BorderMesh';

function makeTile(col: number, row: number, terrain: TerrainType = 'grassland'): HexTile {
  return { coord: { col, row }, geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 }, terrain };
}

const TILES = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0), makeTile(3, 0)];

function projection(crownOf?: Map<string, string>): RealmProjection {
  return {
    realms: [
      { id: 'faction_0', name: 'A', seatHex: undefined, seatLocationId: null, heldLocationIds: ['a'], hexes: [{ col: 0, row: 0 }, { col: 1, row: 0 }] },
      { id: 'faction_1', name: 'B', seatHex: undefined, seatLocationId: null, heldLocationIds: ['b'], hexes: [{ col: 2, row: 0 }] },
    ],
    hexRealmId: new Map([['0,0', 'faction_0'], ['1,0', 'faction_0'], ['2,0', 'faction_1']]),
    unclaimedHexes: 1,
    crownOf,
  };
}

function vertexCount(mesh: THREE.Mesh): number {
  return (mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined)?.count ?? 0;
}

describe('the crown outline', () => {
  it('draws nothing when no realm is sworn (a guild-only crown, or no crown at all)', () => {
    expect(createCrownOutlineMesh(projection(), TILES)).toBeNull();
    expect(createCrownOutlineMesh(projection(new Map()), TILES)).toBeNull();
    const { realmMesh, crownMesh } = createBorderMesh(projection(), TILES);
    expect(crownMesh).toBeNull();
    expect(realmMesh.children).toHaveLength(0);
  });

  it('wraps the union of the Crown and its sworn realm, as a child of the realm border', () => {
    const { realmMesh, crownMesh } = createBorderMesh(projection(new Map([['faction_1', 'faction_0']])), TILES);
    expect(crownMesh).toBeInstanceOf(THREE.Mesh);
    expect(realmMesh.children).toContain(crownMesh);
    expect((crownMesh!.material as THREE.MeshBasicMaterial).opacity).toBe(CROWN_OUTLINE_OPACITY);
    // The union is three hexes in a row: every edge of each hex that does not face
    // another union hex is drawn — 6+6+6 minus the two shared edges counted from both
    // sides (4) = 14 strips of 6 vertices. The internal realm border between faction_0
    // and faction_1 is not part of the outline.
    expect(vertexCount(crownMesh!)).toBe(14 * 6);
  });
});
