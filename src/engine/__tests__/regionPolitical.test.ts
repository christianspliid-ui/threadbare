import { describe, it, expect } from 'vitest';
import type { HexTile, TerrainType } from '../../types';
import type { RegionCluster } from '../regionTypes';
import type { Province } from '../worldgen/types';
import { assignPoliticalRegions } from '../regionPolitical';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain: TerrainType = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  };
}

function makeCluster(id: number, hexes: Array<{ col: number; row: number }>): RegionCluster {
  const coords = hexes.map(h => ({ col: h.col, row: h.row }));
  const centerCol = Math.round(coords.reduce((s, h) => s + h.col, 0) / coords.length);
  const centerRow = Math.round(coords.reduce((s, h) => s + h.row, 0) / coords.length);
  return {
    id,
    featureType: 'plains',
    hexes: coords,
    centerCol,
    centerRow,
    name: '',
  };
}

function makeProvince(id: number, cultureId: string | null, capitalHex: { col: number; row: number }): Province {
  return {
    id,
    cultureId,
    isLost: false,
    seedHex: capitalHex,
    capitalHex,
    terrainIdentity: ['grassland'],
    maxHexes: 100,
  };
}

// Build a flat Int16Array for provinceIds: each hex maps to its province
function buildProvinceIds(
  cols: number,
  rows: number,
  assignments: Array<{ col: number; row: number; provinceId: number }>,
): Int16Array {
  const arr = new Int16Array(cols * rows).fill(-1);
  for (const a of assignments) {
    arr[a.row * cols + a.col] = a.provinceId;
  }
  return arr;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('assignPoliticalRegions', () => {
  it('creates one province per worldgen province', () => {
    const cols = 4;
    const rows = 4;

    const province0Hexes = [
      { col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }, { col: 0, row: 3 },
      { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 1, row: 2 }, { col: 1, row: 3 },
    ];
    const province1Hexes = [
      { col: 2, row: 0 }, { col: 2, row: 1 }, { col: 2, row: 2 }, { col: 2, row: 3 },
      { col: 3, row: 0 }, { col: 3, row: 1 }, { col: 3, row: 2 }, { col: 3, row: 3 },
    ];

    const cluster0 = makeCluster(0, province0Hexes);
    const cluster1 = makeCluster(1, province1Hexes);

    const hexRegionId = new Map<string, number>();
    for (const h of province0Hexes) hexRegionId.set(`${h.col},${h.row}`, 0);
    for (const h of province1Hexes) hexRegionId.set(`${h.col},${h.row}`, 1);

    const prov0 = makeProvince(0, 'culture-A', { col: 0, row: 0 });
    const prov1 = makeProvince(1, 'culture-B', { col: 2, row: 0 });

    const assignments: Array<{ col: number; row: number; provinceId: number }> = [
      ...province0Hexes.map(h => ({ ...h, provinceId: 0 })),
      ...province1Hexes.map(h => ({ ...h, provinceId: 1 })),
    ];
    const provinceIds = buildProvinceIds(cols, rows, assignments);

    const result = assignPoliticalRegions(
      [cluster0, cluster1],
      hexRegionId,
      [prov0, prov1],
      [prov0.capitalHex, prov1.capitalHex],
      provinceIds,
      cols,
      42,
    );

    expect(result.provinces.length).toBe(2);
    expect(result.provinces[0].capitalHex).toEqual({ col: 0, row: 0 });
    expect(result.provinces[1].capitalHex).toEqual({ col: 2, row: 0 });
  });

  it('groups provinces with same non-null cultureId into one domain', () => {
    const cols = 6;
    const rows = 2;

    const p0Hexes = [{ col: 0, row: 0 }, { col: 0, row: 1 }];
    const p1Hexes = [{ col: 2, row: 0 }, { col: 2, row: 1 }];
    const p2Hexes = [{ col: 4, row: 0 }, { col: 4, row: 1 }];

    const cluster0 = makeCluster(0, p0Hexes);
    const cluster1 = makeCluster(1, p1Hexes);
    const cluster2 = makeCluster(2, p2Hexes);

    const hexRegionId = new Map<string, number>();
    for (const h of p0Hexes) hexRegionId.set(`${h.col},${h.row}`, 0);
    for (const h of p1Hexes) hexRegionId.set(`${h.col},${h.row}`, 1);
    for (const h of p2Hexes) hexRegionId.set(`${h.col},${h.row}`, 2);

    // Province 0 and 1 share cultureId 'human', Province 2 is 'elven'
    const prov0 = makeProvince(0, 'human', { col: 0, row: 0 });
    const prov1 = makeProvince(1, 'human', { col: 2, row: 0 });
    const prov2 = makeProvince(2, 'elven', { col: 4, row: 0 });

    const assignments = [
      ...p0Hexes.map(h => ({ ...h, provinceId: 0 })),
      ...p1Hexes.map(h => ({ ...h, provinceId: 1 })),
      ...p2Hexes.map(h => ({ ...h, provinceId: 2 })),
    ];
    const provinceIds = buildProvinceIds(cols, rows, assignments);

    const result = assignPoliticalRegions(
      [cluster0, cluster1, cluster2],
      hexRegionId,
      [prov0, prov1, prov2],
      [prov0.capitalHex, prov1.capitalHex, prov2.capitalHex],
      provinceIds,
      cols,
      42,
    );

    expect(result.provinces.length).toBe(3);
    expect(result.domains.length).toBe(2);

    const humanDomain = result.domains.find(d => d.cultureId === 'human');
    const elvenDomain = result.domains.find(d => d.cultureId === 'elven');
    expect(humanDomain).toBeDefined();
    expect(humanDomain?.provinceIds.length).toBe(2);
    expect(elvenDomain).toBeDefined();
    expect(elvenDomain?.provinceIds.length).toBe(1);
  });

  it('wilderness provinces (cultureId=null) form independent provinces with no domain parent', () => {
    const cols = 4;
    const rows = 2;

    const p0Hexes = [{ col: 0, row: 0 }, { col: 0, row: 1 }];
    const p1Hexes = [{ col: 2, row: 0 }, { col: 2, row: 1 }];

    const cluster0 = makeCluster(0, p0Hexes);
    const cluster1 = makeCluster(1, p1Hexes);

    const hexRegionId = new Map<string, number>();
    for (const h of p0Hexes) hexRegionId.set(`${h.col},${h.row}`, 0);
    for (const h of p1Hexes) hexRegionId.set(`${h.col},${h.row}`, 1);

    const prov0 = makeProvince(0, null, { col: 0, row: 0 });
    const prov1 = makeProvince(1, null, { col: 2, row: 0 });

    const assignments = [
      ...p0Hexes.map(h => ({ ...h, provinceId: 0 })),
      ...p1Hexes.map(h => ({ ...h, provinceId: 1 })),
    ];
    const provinceIds = buildProvinceIds(cols, rows, assignments);

    const result = assignPoliticalRegions(
      [cluster0, cluster1],
      hexRegionId,
      [prov0, prov1],
      [prov0.capitalHex, prov1.capitalHex],
      provinceIds,
      cols,
      42,
    );

    expect(result.provinces.length).toBe(2);
    expect(result.provinces[0].cultureId).toBeNull();
    expect(result.provinces[1].cultureId).toBeNull();
    expect(result.domains.length).toBe(0);
  });

  it('every land hex in hexProvinceId map is assigned to exactly one province', () => {
    const cols = 4;
    const rows = 4;

    const province0Hexes = [
      { col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }, { col: 0, row: 3 },
      { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 1, row: 2 }, { col: 1, row: 3 },
    ];
    const province1Hexes = [
      { col: 2, row: 0 }, { col: 2, row: 1 }, { col: 2, row: 2 }, { col: 2, row: 3 },
      { col: 3, row: 0 }, { col: 3, row: 1 }, { col: 3, row: 2 }, { col: 3, row: 3 },
    ];

    const cluster0 = makeCluster(0, province0Hexes);
    const cluster1 = makeCluster(1, province1Hexes);

    const hexRegionId = new Map<string, number>();
    for (const h of province0Hexes) hexRegionId.set(`${h.col},${h.row}`, 0);
    for (const h of province1Hexes) hexRegionId.set(`${h.col},${h.row}`, 1);

    const prov0 = makeProvince(0, 'culture-A', { col: 0, row: 0 });
    const prov1 = makeProvince(1, 'culture-B', { col: 2, row: 0 });

    const assignments = [
      ...province0Hexes.map(h => ({ ...h, provinceId: 0 })),
      ...province1Hexes.map(h => ({ ...h, provinceId: 1 })),
    ];
    const provinceIds = buildProvinceIds(cols, rows, assignments);

    const result = assignPoliticalRegions(
      [cluster0, cluster1],
      hexRegionId,
      [prov0, prov1],
      [prov0.capitalHex, prov1.capitalHex],
      provinceIds,
      cols,
      42,
    );

    for (const [key] of hexRegionId) {
      expect(result.hexProvinceId.has(key),
        `Expected hex ${key} to be assigned to a province`).toBe(true);
    }

    const seen = new Set<string>();
    for (const province of result.provinces) {
      for (const hex of province.hexes) {
        const key = `${hex.col},${hex.row}`;
        expect(seen.has(key), `Hex ${key} in multiple provinces`).toBe(false);
        seen.add(key);
      }
    }
  });

  it('returns provinces with non-empty names (seeded PRNG generation)', () => {
    const cols = 4;
    const rows = 2;

    const p0Hexes = [{ col: 0, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 0 }, { col: 1, row: 1 }];
    const cluster0 = makeCluster(0, p0Hexes);
    const hexRegionId = new Map<string, number>();
    for (const h of p0Hexes) hexRegionId.set(`${h.col},${h.row}`, 0);
    const prov0 = makeProvince(0, 'culture-A', { col: 0, row: 0 });
    const assignments = p0Hexes.map(h => ({ ...h, provinceId: 0 }));
    const provinceIds = buildProvinceIds(cols, rows, assignments);

    const result = assignPoliticalRegions(
      [cluster0],
      hexRegionId,
      [prov0],
      [prov0.capitalHex],
      provinceIds,
      cols,
      42,
    );

    expect(result.provinces[0].name.length).toBeGreaterThan(0);
  });
});
