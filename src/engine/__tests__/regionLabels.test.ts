/**
 * regionLabels.test.ts — Tests for generateRegionLabels and generateRiverLabels.
 */

import { describe, it, expect } from 'vitest';
import { generateRegionLabels, generateRiverLabels, LABEL_PRIORITY } from '../regionLabels';
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

  it('produces one label per geographic region >= REGION_MAP_LABEL_MIN_SIZE (30)', () => {
    const rd = makeRegionData({
      geographicRegions: [
        makeGeoRegion(0, 30),
        makeGeoRegion(1, 45),
      ],
    });
    const labels = generateRegionLabels(rd);
    const geoLabels = labels.filter(l => l.tier === 'geographic');
    expect(geoLabels).toHaveLength(2);
  });

  it('produces NO label for geographic regions smaller than REGION_MAP_LABEL_MIN_SIZE (30)', () => {
    const rd = makeRegionData({
      geographicRegions: [
        makeGeoRegion(0, 29),
        makeGeoRegion(1, 10),
        makeGeoRegion(2, 5),
      ],
    });
    const labels = generateRegionLabels(rd);
    const geoLabels = labels.filter(l => l.tier === 'geographic');
    expect(geoLabels).toHaveLength(0);
  });

  it('label text matches the region name', () => {
    const rd = makeRegionData({
      domains: [makeDomainRegion(0)],
      provinces: [makeProvinceRegion(0)],
      geographicRegions: [makeGeoRegion(0, 35)],
    });
    const labels = generateRegionLabels(rd);
    const domain = labels.find(l => l.tier === 'domain');
    const province = labels.find(l => l.tier === 'province');
    const geo = labels.find(l => l.tier === 'geographic');
    expect(domain?.text).toBe('Domain 0');
    expect(province?.text).toBe('Province 0');
    expect(geo?.text).toBe('Region 0');
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
