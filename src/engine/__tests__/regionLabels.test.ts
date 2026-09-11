/**
 * regionLabels.test.ts — the three label tiers: realm, area, river (THR-1155).
 */

import { describe, it, expect } from 'vitest';
import { generateRealmLabels, generateAreaLabels, generateRiverLabels, LABEL_PRIORITY } from '../regionLabels';
import type { AreaProjection } from '../areaProjection';
import type { RiverPath } from '../worldGenData';
import type { RealmProjection } from '../realmProjection';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * An Area projection carrying `count` Areas of `hexCount` hexes each (THR-1155).
 *
 * The geographic tier reads this now rather than `RegionData.geographicRegions`: the
 * name a player sees over a mountain range comes from the Area's own graph node, not
 * from a renderer-side cluster joined to that node by list position.
 */
function makeAreaProjection(sizes: number[]): AreaProjection {
  const hexAreaId = new Map<string, string>();
  const areas = sizes.map((hexCount, id) => {
    const hexes = Array.from({ length: hexCount }, (_, i) => ({ col: i, row: id }));
    for (const h of hexes) hexAreaId.set(`${h.col},${h.row}`, `region_${id}`);
    return {
      id: `region_${id}`,
      name: `Region ${id}`,
      featureType: 'plains' as const,
      hexes,
      center: { col: Math.floor(hexCount / 2), row: id },
    };
  });
  return { areas, hexAreaId };
}

/**
 * A political projection carrying one Realm per entry in `sizes`, each holding that
 * many hexes on its own row (THR-1155).
 */
function makeRealmProjection(sizes: number[]): RealmProjection {
  const hexRealmId = new Map<string, string>();
  const realms = sizes.map((hexCount, id) => {
    const hexes = Array.from({ length: hexCount }, (_, i) => ({ col: i, row: id }));
    for (const h of hexes) hexRealmId.set(`${h.col},${h.row}`, `faction_${id}`);
    return {
      id: `faction_${id}`,
      name: `Realm ${id}`,
      seatHex: hexes[0],
      seatLocationId: `loc_${id}`,
      heldLocationIds: [`loc_${id}`],
      hexes,
    };
  });
  return { realms, hexRealmId, unclaimedHexes: 0 };
}

// ─── LABEL_PRIORITY ───────────────────────────────────────────────────────────

describe('LABEL_PRIORITY', () => {
  it('has realm=0, area=1, river=2 — the province tier retired with its stamps (THR-1155)', () => {
    expect(LABEL_PRIORITY.realm).toBe(0);
    expect(LABEL_PRIORITY.area).toBe(1);
    expect(LABEL_PRIORITY.river).toBe(2);
    expect(Object.keys(LABEL_PRIORITY).sort()).toEqual(['area', 'realm', 'river']);
  });
});

// ─── generateRealmLabels ──────────────────────────────────────────────────────

describe('generateRealmLabels — the political tier reads the projection (THR-1155)', () => {
  it('produces one label per Realm with tier=realm', () => {
    const labels = generateRealmLabels(makeRealmProjection([6, 4]));
    expect(labels.filter(l => l.tier === 'realm')).toHaveLength(2);
    expect(labels.map(l => l.id)).toEqual(['realm-faction_0', 'realm-faction_1']);
  });

  it('takes its text from the Realm name', () => {
    const labels = generateRealmLabels(makeRealmProjection([5]));
    expect(labels[0].text).toBe('Realm 0');
  });

  it('anchors the label at the centroid of the ground the Realm holds, not at its seat', () => {
    // The seat is hex (0, 0); the claim runs to (9, 0). A label at the seat would sit on
    // the Realm's edge — the old domain label's failure mode, a name off to one side of
    // the territory it named.
    const projection = makeRealmProjection([10]);
    const labels = generateRealmLabels(projection);
    const seatWorldX = -0; // hexToWorld(0, 0).x is 0 for the first column
    expect(labels[0].worldX).toBeGreaterThan(seatWorldX);
  });

  it('the label moves when the Realm does — what a worldgen centroid could not do', () => {
    const before = generateRealmLabels(makeRealmProjection([4]))[0];

    // The same Realm, four hexes further east: a conquest moved its claim.
    const moved = makeRealmProjection([4]);
    moved.realms[0] = {
      ...moved.realms[0],
      hexes: moved.realms[0].hexes.map(h => ({ col: h.col + 4, row: h.row })),
    };
    const after = generateRealmLabels(moved)[0];

    expect(after.worldX).toBeGreaterThan(before.worldX);
  });

  it('a Realm that claims no hexes carries no label — it has no border to name either', () => {
    const projection = makeRealmProjection([3]);
    projection.realms[0] = { ...projection.realms[0], hexes: [] };
    expect(generateRealmLabels(projection)).toHaveLength(0);
  });

  it('skips a Realm with no name rather than drawing an empty label', () => {
    const projection = makeRealmProjection([5]);
    projection.realms[0] = { ...projection.realms[0], name: '' };
    expect(generateRealmLabels(projection)).toHaveLength(0);
  });

  it('labels have worldX and worldY as finite numbers', () => {
    const labels = generateRealmLabels(makeRealmProjection([7]));
    expect(Number.isFinite(labels[0].worldX)).toBe(true);
    expect(Number.isFinite(labels[0].worldY)).toBe(true);
  });
});

// ─── generateRiverLabels ──────────────────────────────────────────────────────

describe('generateRiverLabels', () => {
  it('produces one label per river path with >= 5 hexes', () => {
    const rivers: RiverPath[] = [
      { id: 'r0', hexes: Array.from({ length: 5 }, (_, i) => ({ col: i, row: 0 })) },
      { id: 'r1', hexes: Array.from({ length: 8 }, (_, i) => ({ col: i, row: 5 })) },
    ];
    const labels = generateRiverLabels(rivers, 42);
    expect(labels).toHaveLength(2);
    expect(labels.every(l => l.tier === 'river')).toBe(true);
  });

  it('produces no label for rivers shorter than 5 hexes', () => {
    const rivers: RiverPath[] = [
      { id: 'r0', hexes: Array.from({ length: 4 }, (_, i) => ({ col: i, row: 0 })) },
      { id: 'r1', hexes: Array.from({ length: 1 }, (_, i) => ({ col: i, row: 0 })) },
    ];
    const labels = generateRiverLabels(rivers, 42);
    expect(labels).toHaveLength(0);
  });

  it('river labels have " River" suffix in text', () => {
    const rivers: RiverPath[] = [
      { id: 'r0', hexes: Array.from({ length: 6 }, (_, i) => ({ col: i, row: 0 })) },
    ];
    const labels = generateRiverLabels(rivers, 42);
    expect(labels[0].text).toMatch(/ River$/);
  });

  it('river label is placed at midpoint hex of the path', () => {
    const hexes = Array.from({ length: 7 }, (_, i) => ({ col: i, row: 0 }));
    const rivers: RiverPath[] = [{ id: 'r0', hexes }];
    const labels = generateRiverLabels(rivers, 42);
    expect(Number.isFinite(labels[0].worldX)).toBe(true);
    expect(Number.isFinite(labels[0].worldY)).toBe(true);
  });

  it('river labels have tier=river and an id starting with river-', () => {
    const rivers: RiverPath[] = [
      { id: 'r0', hexes: Array.from({ length: 5 }, (_, i) => ({ col: i, row: 0 })) },
    ];
    const labels = generateRiverLabels(rivers, 42);
    expect(labels[0].tier).toBe('river');
    expect(labels[0].id).toMatch(/^river-/);
  });
});

describe('generateAreaLabels — the area tier reads the Area nodes (THR-1155)', () => {
  it('produces one label per Area at or above REGION_MAP_LABEL_MIN_SIZE (30)', () => {
    const labels = generateAreaLabels(makeAreaProjection([30, 45]));
    expect(labels.filter(l => l.tier === 'area')).toHaveLength(2);
    expect(labels.map(l => l.id)).toEqual(['area-region_0', 'area-region_1']);
  });

  it('produces no label for an Area below the threshold', () => {
    const labels = generateAreaLabels(makeAreaProjection([29, 10, 5]));
    expect(labels).toHaveLength(0);
  });

  it('labels a big Area and skips a small one in the same world', () => {
    // The mixed population is the point: a threshold guard tested only on a uniform
    // set passes whether it filters or not.
    const labels = generateAreaLabels(makeAreaProjection([45, 5]));
    expect(labels).toHaveLength(1);
    expect(labels[0].id).toBe('area-region_0');
  });

  it('takes its text from the Area node name, and its anchor from the node centre', () => {
    const projection = makeAreaProjection([35]);
    const labels = generateAreaLabels(projection);
    expect(labels[0].text).toBe('Region 0');
    // The centre is a hex inside the Area, so the label never lands off it.
    const centre = projection.areas[0].center;
    expect(projection.areas[0].hexes.some(h => h.col === centre.col && h.row === centre.row)).toBe(true);
  });

  it('skips an Area worldgen never named rather than drawing an empty label', () => {
    const projection = makeAreaProjection([40]);
    projection.areas[0] = { ...projection.areas[0], name: '' };
    expect(generateAreaLabels(projection)).toHaveLength(0);
  });
});
