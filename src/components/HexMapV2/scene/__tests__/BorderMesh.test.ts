/**
 * The red border and the seat markers, read from the political projection (THR-1155).
 *
 * These assertions moved from `RegionData`'s per-hex political stamps to
 * `RealmProjection`. The shape of the suite is the same because the geometry is: what
 * changed is that the input can now differ between two ticks of one world, which is why
 * the last test here builds two projections and asserts the geometry differs — the
 * property the old layer could not have, since a domain stamp was written once at
 * worldgen and never again.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import type { HexTile, TerrainType } from '../../../../types';
import type { RealmProjection, RealmProjectionEntry } from '../../../../engine/realmProjection';
import { createBorderMesh } from '../BorderMesh';
import { createCapitalMarkers } from '../CapitalMarkers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain: TerrainType = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  };
}

/**
 * Build a projection from a `"col,row" → realmId` map, deriving the per-Realm entries
 * from it so the two halves cannot disagree — a fixture that let them would be
 * verifying its own fiction rather than the layer.
 */
function makeProjection(
  hexRealmId: Map<string, string>,
  seats: Record<string, { col: number; row: number }> = {},
): RealmProjection {
  const byRealm = new Map<string, RealmProjectionEntry>();
  for (const [key, realmId] of hexRealmId) {
    const [col, row] = key.split(',').map(Number);
    let entry = byRealm.get(realmId);
    if (!entry) {
      entry = {
        id: realmId,
        name: realmId,
        seatHex: seats[realmId],
        seatLocationId: seats[realmId] ? `loc_${realmId}` : null,
        heldLocationIds: [`loc_${realmId}`],
        hexes: [],
      };
      byRealm.set(realmId, entry);
    }
    entry.hexes.push({ col, row });
  }
  return {
    realms: [...byRealm.values()],
    hexRealmId,
    unclaimedHexes: 0,
  };
}

// ─── createBorderMesh Tests ───────────────────────────────────────────────────

describe('createBorderMesh', () => {
  it('returns one realmMesh as a THREE.Mesh instance', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const projection = makeProjection(new Map([['0,0', 'faction_0'], ['1,0', 'faction_1']]));

    const result = createBorderMesh(projection, tiles);

    expect(result.realmMesh).toBeInstanceOf(THREE.Mesh);
  });

  it('produces >0 vertices when two adjacent hexes are claimed by different Realms', () => {
    const cols = 3;
    const tiles: HexTile[] = [];
    const hexRealmId = new Map<string, string>();

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r));
        hexRealmId.set(`${c},${r}`, c < 2 ? 'faction_0' : 'faction_1');
      }
    }

    const result = createBorderMesh(makeProjection(hexRealmId), tiles);

    const pos = result.realmMesh.geometry.getAttribute('position');
    expect(pos).toBeDefined();
    expect(pos.count).toBeGreaterThan(0);
  });

  it('a claimed hex beside unclaimed ground carries a border — wilderness has an edge', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    // Only the first hex is claimed; the second is wilderness.
    const result = createBorderMesh(makeProjection(new Map([['0,0', 'faction_0']])), tiles);

    const pos = result.realmMesh.geometry.getAttribute('position');
    expect(pos.count).toBeGreaterThan(0);
  });

  it('one Realm holding every hex draws only its outer ring, never an internal line', () => {
    const cols = 3;
    const tiles: HexTile[] = [];
    const hexRealmId = new Map<string, string>();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r));
        hexRealmId.set(`${c},${r}`, 'faction_0');
      }
    }

    const all = createBorderMesh(makeProjection(hexRealmId), tiles);
    const allVertices = all.realmMesh.geometry.getAttribute('position').count;

    // Falsification arm: split the same ground between two Realms and the internal seam
    // appears. Without this the assertion above would pass on a layer that drew nothing.
    const split = new Map(hexRealmId);
    for (const [key] of split) if (key.startsWith('2,')) split.set(key, 'faction_1');
    const splitVertices = createBorderMesh(makeProjection(split), tiles)
      .realmMesh.geometry.getAttribute('position').count;

    expect(allVertices).toBeGreaterThan(0);          // the outer ring
    expect(splitVertices).toBeGreaterThan(allVertices); // plus the seam
  });

  it('uses MeshBasicMaterial', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0)];
    const result = createBorderMesh(
      makeProjection(new Map([['0,0', 'faction_0'], ['1,0', 'faction_0']])),
      tiles,
    );

    expect(result.realmMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
  });

  it('an empty projection draws nothing and does not throw (fail-soft)', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const empty: RealmProjection = { realms: [], hexRealmId: new Map(), unclaimedHexes: 3 };

    expect(() => createBorderMesh(empty, tiles)).not.toThrow();
    const pos = createBorderMesh(empty, tiles).realmMesh.geometry.getAttribute('position');
    expect(pos ? pos.count : 0).toBe(0);
  });

  it('the border moves when a hex changes hands — the property the stamp could not have', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];

    const before = new Map([['0,0', 'faction_0'], ['1,0', 'faction_0'], ['2,0', 'faction_1']]);
    const after = new Map([['0,0', 'faction_0'], ['1,0', 'faction_1'], ['2,0', 'faction_1']]);

    const posOf = (m: Map<string, string>): number[] => {
      const attr = createBorderMesh(makeProjection(m), tiles).realmMesh
        .geometry.getAttribute('position');
      return Array.from(attr.array as Float32Array);
    };

    // The seam sat between hexes 1 and 2; now it sits between 0 and 1, so the geometry
    // is different vertex data even though both worlds have exactly one seam.
    expect(posOf(before)).not.toEqual(posOf(after));
  });
});

// ─── createCapitalMarkers Tests ───────────────────────────────────────────────

describe('createCapitalMarkers', () => {
  it('returns a THREE.Group', () => {
    const result = createCapitalMarkers({ realms: [], hexRealmId: new Map(), unclaimedHexes: 0 });
    expect(result).toBeInstanceOf(THREE.Group);
  });

  it('returns an empty group when no Realm exists', () => {
    const result = createCapitalMarkers({ realms: [], hexRealmId: new Map(), unclaimedHexes: 0 });
    expect(result.children.length).toBe(0);
  });

  it('produces one point per seated Realm', () => {
    const projection = makeProjection(
      new Map([['0,0', 'faction_0'], ['2,0', 'faction_1']]),
      { faction_0: { col: 0, row: 0 }, faction_1: { col: 2, row: 0 } },
    );

    const result = createCapitalMarkers(projection);
    const pointChildren = result.children.filter(c => c instanceof THREE.Points) as THREE.Points[];
    expect(pointChildren.length).toBe(1);

    const count = pointChildren[0].geometry.getAttribute('position').count;
    expect(count).toBe(2);
  });

  it('a Realm with no seat contributes no dot — never one at the origin', () => {
    // faction_1 holds ground but has no seat; (0,0) is a real hex, so a fallback there
    // would be a marker in the wrong place rather than a missing one.
    const projection = makeProjection(
      new Map([['0,0', 'faction_0'], ['2,0', 'faction_1']]),
      { faction_0: { col: 0, row: 0 } },
    );

    const result = createCapitalMarkers(projection);
    const points = result.children.filter(c => c instanceof THREE.Points) as THREE.Points[];
    expect(points[0].geometry.getAttribute('position').count).toBe(1);
  });
});
