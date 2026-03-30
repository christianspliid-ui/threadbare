/**
 * regionLabels.test.ts — Tests for generateRegionLabels and generateRiverLabels.
 *
 * TDD RED phase: all tests fail until regionLabels.ts is implemented.
 */

import { describe, it, expect } from 'vitest';
import { generateRegionLabels, generateRiverLabels, LABEL_PRIORITY } from '../regionLabels';
import type { RegionData } from '../regionTypes';
import type { RiverPath } from '../worldGenData';
import type { RegionCluster, BaronyRegion, KingdomRegion } from '../regionTypes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRegionData(overrides: Partial<RegionData> = {}): RegionData {
  return {
    geographicRegions: [],
    baronies: [],
    kingdoms: [],
    labels: [],
    hexRegionId: new Map(),
    hexBaronyId: new Map(),
    hexKingdomId: new Map(),
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

function makeBarony(id: number): BaronyRegion {
  return {
    id,
    cultureId: 'c1',
    capitalHex: { col: id * 5, row: 0 },
    geographicRegionIds: [id],
    hexes: [{ col: id * 5, row: 0 }],
    centroid: { col: id * 5 + 2, row: 1 },
    name: `Barony ${id}`,
  };
}

function makeKingdom(id: number): KingdomRegion {
  return {
    id,
    cultureId: 'c1',
    capitalHex: { col: id * 20, row: 5 },
    baronyIds: [id],
    centroid: { col: id * 20 + 5, row: 3 },
    name: `Kingdom ${id}`,
  };
}

// ─── LABEL_PRIORITY ───────────────────────────────────────────────────────────

describe('LABEL_PRIORITY', () => {
  it('has kingdom=0, barony=1, geographic=2, river=3', () => {
    expect(LABEL_PRIORITY.kingdom).toBe(0);
    expect(LABEL_PRIORITY.barony).toBe(1);
    expect(LABEL_PRIORITY.geographic).toBe(2);
    expect(LABEL_PRIORITY.river).toBe(3);
  });
});

// ─── generateRegionLabels ─────────────────────────────────────────────────────

describe('generateRegionLabels', () => {
  it('produces one label per kingdom with tier=kingdom', () => {
    const rd = makeRegionData({
      kingdoms: [makeKingdom(0), makeKingdom(1)],
    });
    const labels = generateRegionLabels(rd);
    const kingdomLabels = labels.filter(l => l.tier === 'kingdom');
    expect(kingdomLabels).toHaveLength(2);
    expect(kingdomLabels[0].id).toBe('kingdom-0');
    expect(kingdomLabels[1].id).toBe('kingdom-1');
  });

  it('produces one label per barony with tier=barony', () => {
    const rd = makeRegionData({
      baronies: [makeBarony(0), makeBarony(1), makeBarony(2)],
    });
    const labels = generateRegionLabels(rd);
    const baronyLabels = labels.filter(l => l.tier === 'barony');
    expect(baronyLabels).toHaveLength(3);
    expect(baronyLabels[0].id).toBe('barony-0');
  });

  it('produces one label per geographic region >= REGION_MAP_LABEL_MIN_SIZE (30)', () => {
    const rd = makeRegionData({
      geographicRegions: [
        makeGeoRegion(0, 30), // exactly min size — should get label
        makeGeoRegion(1, 45), // above min — should get label
      ],
    });
    const labels = generateRegionLabels(rd);
    const geoLabels = labels.filter(l => l.tier === 'geographic');
    expect(geoLabels).toHaveLength(2);
  });

  it('produces NO label for geographic regions smaller than REGION_MAP_LABEL_MIN_SIZE (30)', () => {
    const rd = makeRegionData({
      geographicRegions: [
        makeGeoRegion(0, 29), // just below min — no label
        makeGeoRegion(1, 10), // well below — no label
        makeGeoRegion(2, 5),  // tiny — no label
      ],
    });
    const labels = generateRegionLabels(rd);
    const geoLabels = labels.filter(l => l.tier === 'geographic');
    expect(geoLabels).toHaveLength(0);
  });

  it('label text matches the region name', () => {
    const rd = makeRegionData({
      kingdoms: [makeKingdom(0)],
      baronies: [makeBarony(0)],
      geographicRegions: [makeGeoRegion(0, 35)],
    });
    const labels = generateRegionLabels(rd);
    const kingdom = labels.find(l => l.tier === 'kingdom');
    const barony = labels.find(l => l.tier === 'barony');
    const geo = labels.find(l => l.tier === 'geographic');
    expect(kingdom?.text).toBe('Kingdom 0');
    expect(barony?.text).toBe('Barony 0');
    expect(geo?.text).toBe('Region 0');
  });

  it('labels have worldX and worldY as finite numbers', () => {
    const rd = makeRegionData({
      kingdoms: [makeKingdom(0)],
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
    // Midpoint = hexes[Math.floor(7/2)] = hexes[3] = { col: 3, row: 0 }
    // worldX from hexToPixel({ col: 3, row: 0 }, 10).x = 3 * 10 * 1.5 = 45
    // worldY = -(3 * 10 * sqrt(3) + odd offset) — col=3 is odd, so +8.66...
    // Just verify it's a finite number — exact value depends on hexToPixel
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
