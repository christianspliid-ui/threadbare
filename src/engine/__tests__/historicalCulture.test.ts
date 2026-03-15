import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateHistoricalCultures, assignHistoricalTerritories } from '../historicalCulture';
import type { CosmologyProfile, HexTile, TerrainType } from '../../types';
import { SPHERE_NAMES } from '../../types';
import type { RegionCluster } from '../regionDetection';

function makeCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('generateHistoricalCultures', () => {
  it('creates culture nodes with cultureEra: historical', () => {
    const graph = new WorldGraph();
    const rng = mulberry32(42);
    const ids = generateHistoricalCultures(graph, makeCosmology(), rng);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) {
      const node = graph.getNode(id);
      expect(node).toBeDefined();
      expect(node!.type).toBe('actor');
      expect(node!.properties.actorType).toBe('culture');
      expect(node!.properties.cultureEra).toBe('historical');
    }
  });

  it('generates full CultureIdentity on each node', () => {
    const graph = new WorldGraph();
    const rng = mulberry32(42);
    const ids = generateHistoricalCultures(graph, makeCosmology(), rng);
    for (const id of ids) {
      const node = graph.getNode(id)!;
      const identity = node.properties.cultureIdentity as Record<string, unknown>;
      expect(identity.foundationBias).toBeTruthy();
      expect(identity.veneratedSpheres).toBeDefined();
      expect(identity.primaryBiome).toBeDefined();
      expect(identity.behavioralKeywords).toBeDefined();
      expect(identity.materialVocabulary).toBeDefined();
    }
  });

  it('is deterministic — same seed produces same cultures', () => {
    const g1 = new WorldGraph();
    const g2 = new WorldGraph();
    const ids1 = generateHistoricalCultures(g1, makeCosmology(), mulberry32(99));
    const ids2 = generateHistoricalCultures(g2, makeCosmology(), mulberry32(99));
    expect(ids1).toEqual(ids2);
    for (let i = 0; i < ids1.length; i++) {
      expect(g1.getNode(ids1[i])!.name).toBe(g2.getNode(ids2[i])!.name);
    }
  });

  it('stores the template data on the node', () => {
    const graph = new WorldGraph();
    const rng = mulberry32(42);
    const ids = generateHistoricalCultures(graph, makeCosmology(), rng);
    for (const id of ids) {
      const node = graph.getNode(id)!;
      expect(node.properties.ruinDescriptors).toBeDefined();
      expect(node.properties.legacyFlavor).toBeTruthy();
    }
  });
});

describe('assignHistoricalTerritories', () => {
  it('assigns belongs_to edges with cultureLayer: historical', () => {
    const graph = new WorldGraph();
    const rng = mulberry32(42);
    const cultureIds = generateHistoricalCultures(graph, makeCosmology(), rng);

    for (let i = 0; i < 5; i++) {
      graph.addNode({
        id: `region_${i}`,
        type: 'region',
        name: `Region ${i}`,
        properties: { featureType: 'plains', hexCount: 10, centerCol: i * 3, centerRow: 0 },
      });
    }

    const clusters: RegionCluster[] = Array.from({ length: 5 }, (_, i) => ({
      featureType: 'plains' as const,
      hexes: [{ col: i * 3, row: 0 }],
      centerCol: i * 3,
      centerRow: 0,
    }));

    assignHistoricalTerritories(graph, cultureIds, clusters, rng);

    const belongsEdges = graph.getEdgesByType('belongs_to')
      .filter(e => e.properties.cultureLayer === 'historical');
    expect(belongsEdges.length).toBeGreaterThanOrEqual(3);
    for (const edge of belongsEdges) {
      expect(cultureIds).toContain(edge.target);
    }
  });

  it('leaves some regions unclaimed as wilderness', () => {
    const graph = new WorldGraph();
    const rng = mulberry32(42);
    const cultureIds = generateHistoricalCultures(graph, makeCosmology(), rng);

    for (let i = 0; i < 20; i++) {
      graph.addNode({
        id: `region_${i}`,
        type: 'region',
        name: `Region ${i}`,
        properties: { featureType: 'plains', hexCount: 10, centerCol: i % 5, centerRow: Math.floor(i / 5) },
      });
    }

    const clusters: RegionCluster[] = Array.from({ length: 20 }, (_, i) => ({
      featureType: 'plains' as const,
      hexes: [{ col: i % 5, row: Math.floor(i / 5) }],
      centerCol: i % 5,
      centerRow: Math.floor(i / 5),
    }));

    assignHistoricalTerritories(graph, cultureIds, clusters, rng);

    const belongsEdges = graph.getEdgesByType('belongs_to')
      .filter(e => e.properties.cultureLayer === 'historical');
    const claimedRegionIds = new Set(belongsEdges.map(e => e.source));
    expect(claimedRegionIds.size).toBeLessThan(20);
    expect(claimedRegionIds.size).toBeGreaterThanOrEqual(15);
  });
});
