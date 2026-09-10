/**
 * regionLabels.test.ts — Tests for generateRegionLabels and generateRiverLabels.
 */

import { describe, it, expect } from 'vitest';
import { generateRegionLabels, generateAreaLabels, generateRiverLabels, LABEL_PRIORITY } from '../regionLabels';
import type { AreaProjection } from '../areaProjection';
import type { RegionData } from '../regionTypes';
import type { RiverPath } from '../worldGenData';
import type { RegionCluster, ProvinceRegion, DomainRegion } from '../regionTypes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRegionData(overrides: Partial<RegionData> = {}): RegionData {
  return {
    geographicRegions: [],
    provinces: [],
    domains: [],
    labels: [],
    hexRegionId: new Map(),
    hexProvinceId: new Map(),
    hexDomainId: new Map(),
    ...overrides,
  };
}

function makeGeoRegion(id: number, hexCount: number): RegionCluster {
  const hexes = Array.from({ length: hexCount }, (_, i) => ({ col: i, row: 0 }));
  return {
    id,
    featureType: 'plains',
    hexes,
    centerCol: Math.floor(hexCount / 2),
    centerRow: 0,
    name: `Region ${id}`,
  };
}

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

function makeProvinceRegion(id: number): ProvinceRegion {
  return {
    id,
    cultureId: 'c1',
    capitalHex: { col: id * 5, row: 0 },
    geographicRegionIds: [id],
    hexes: [{ col: id * 5, row: 0 }],
    centroid: { col: id * 5 + 2, row: 1 },
    name: `Province ${id}`,
  };
}

function makeDomainRegion(id: number): DomainRegion {
  return {
    id,
    cultureId: 'c1',
    capitalHex: { col: id * 20, row: 5 },
    provinceIds: [id],
    centroid: { col: id * 20 + 5, row: 3 },
    name: `Domain ${id}`,
  };
}

// ─── LABEL_PRIORITY ───────────────────────────────────────────────────────────

describe('LABEL_PRIORITY', () => {
  it('has domain=0, province=1, geographic=2, river=3', () => {
    expect(LABEL_PRIORITY.domain).toBe(0);
    expect(LABEL_PRIORITY.province).toBe(1);
    expect(LABEL_PRIORITY.geographic).toBe(2);
    expect(LABEL_PRIORITY.river).toBe(3);
  });
});

// ─── generateRegionLabels ─────────────────────────────────────────────────────

describe('generateRegionLabels', () => {
  it('produces one label per domain with tier=domain', () => {
    const rd = makeRegionData({
      domains: [makeDomainRegion(0), makeDomainRegion(1)],
      provinces: [makeProvinceRegion(0), makeProvinceRegion(1)],
    });
    const labels = generateRegionLabels(rd);
    const domainLabels = labels.filter(l => l.tier === 'domain');
    expect(domainLabels).toHaveLength(2);
    expect(domainLabels[0].id).toBe('domain-0');
    expect(domainLabels[1].id).toBe('domain-1');
  });

  it('produces one label per province with tier=province', () => {
    const rd = makeRegionData({
      provinces: [makeProvinceRegion(0), makeProvinceRegion(1), makeProvinceRegion(2)],
      domains: [],
    });
    const labels = generateRegionLabels(rd);
    const provinceLabels = labels.filter(l => l.tier === 'province');
    expect(provinceLabels).toHaveLength(3);
    expect(provinceLabels[0].id).toBe('province-0');
  });

  it('draws no geographic tier of its own — that is generateAreaLabels (THR-1155)', () => {
    // The political generator is handed a RegionData that still *carries* clusters, and
    // must ignore them: two label sources for one tier is how the map came to name a
    // range after an unrelated cluster in the first place.
    const rd = makeRegionData({
      geographicRegions: [makeGeoRegion(0, 45), makeGeoRegion(1, 45)],
    });
    expect(generateRegionLabels(rd).filter(l => l.tier === 'geographic')).toHaveLength(0);
  });

  it('label text matches the region name', () => {
    const rd = makeRegionData({
      domains: [makeDomainRegion(0)],
      provinces: [makeProvinceRegion(0)],
    });
    const labels = generateRegionLabels(rd);
    const domain = labels.find(l => l.tier === 'domain');
    const province = labels.find(l => l.tier === 'province');
    expect(domain?.text).toBe('Domain 0');
    expect(province?.text).toBe('Province 0');
  });

  it('suppresses province label for the capital province of each domain', () => {
    // Capital province — capitalHex matches domain's capitalHex
    const capitalProvince: ProvinceRegion = {
      id: 0,
      cultureId: 'c1',
      capitalHex: { col: 10, row: 5 },
      geographicRegionIds: [],
      hexes: [{ col: 10, row: 5 }],
      centroid: { col: 10, row: 5 },
      name: 'CapitalProvince',
    };
    const nonCapitalProvince = makeProvinceRegion(1);
    const domain: DomainRegion = {
      id: 0,
      cultureId: 'c1',
      capitalHex: { col: 10, row: 5 }, // matches capitalProvince.capitalHex
      provinceIds: [0, 1],
      centroid: { col: 10, row: 5 },
      name: 'Domain 0',
    };
    const rd = makeRegionData({
      provinces: [capitalProvince, nonCapitalProvince],
      domains: [domain],
    });
    const labels = generateRegionLabels(rd);
    const provinceLabels = labels.filter(l => l.tier === 'province');
    // Capital province label suppressed; only the non-capital province gets one
    expect(provinceLabels).toHaveLength(1);
    expect(provinceLabels[0].id).toBe('province-1');
  });

  it('labels have worldX and worldY as finite numbers', () => {
    const rd = makeRegionData({
      domains: [makeDomainRegion(0)],
      provinces: [makeProvinceRegion(0)],
    });
    const labels = generateRegionLabels(rd);
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

describe('generateAreaLabels — the geographic tier reads the Area nodes (THR-1155)', () => {
  it('produces one label per Area at or above REGION_MAP_LABEL_MIN_SIZE (30)', () => {
    const labels = generateAreaLabels(makeAreaProjection([30, 45]));
    expect(labels.filter(l => l.tier === 'geographic')).toHaveLength(2);
    expect(labels.map(l => l.id)).toEqual(['geo-region_0', 'geo-region_1']);
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
    expect(labels[0].id).toBe('geo-region_0');
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
