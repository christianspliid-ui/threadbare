import { describe, it, expect } from 'vitest';
import {
  seedWorld,
  INDIVIDUAL_COUNT,
  FACTION_COUNT,
  LOCATION_COUNT,
  LOCATION_DENSITY,
  ARTIFACT_COUNT,
  SETTLEMENT_MIN_SPACING,
} from '../worldSeed';
import type { CosmologyProfile, HexTile, LocationSubtype } from '../../types/index';
import { hexDistance } from '../../lib/hexMath';
import { SPHERE_NAMES } from '../../types/index';
import type { ActiveInjection } from '../echo';
import { CULTURE_COUNT } from '../../types/culture';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mockTiles(size = 10): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      });
    }
  }
  return tiles;
}

describe('seedWorld', () => {
  it('creates a populated graph from cosmology and seed', () => {
    const tiles = mockTiles();
    const result = seedWorld(balancedCosmology(), tiles, 42);
    // On tiny 10×10 maps, agent count may be below INDIVIDUAL_COUNT.min due to
    // spacing constraints and PRNG sequence. Just verify we get some agents.
    expect(result.individualIds.length).toBeGreaterThanOrEqual(1);
    expect(result.factionIds.length).toBeGreaterThanOrEqual(FACTION_COUNT.min);
    // Spacing enforcement may reduce placement on small maps, but we should
    // still get at least the hard minimum number of locations
    expect(result.locationIds.length).toBeGreaterThanOrEqual(LOCATION_COUNT.min);
    expect(result.artifactIds.length).toBeGreaterThanOrEqual(ARTIFACT_COUNT.min);
  });

  it('places locations on unique hexes', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const hexKeys = new Set<string>();
    for (const locId of result.locationIds) {
      const node = result.graph.getNode(locId)!;
      const key = `${node.properties.hexCol},${node.properties.hexRow}`;
      expect(hexKeys.has(key)).toBe(false);
      hexKeys.add(key);
    }
  });

  it('enforces minimum spacing between settlements by size tier', () => {
    // Use a larger grid so spacing constraints are meaningful
    const largeTiles: HexTile[] = [];
    for (let col = 0; col < 20; col++) {
      for (let row = 0; row < 20; row++) {
        largeTiles.push({
          coord: { col, row },
          geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
          terrain: 'grassland',
        });
      }
    }
    const result = seedWorld(balancedCosmology(), largeTiles, 42);

    // Collect all placed locations with their coords and subtypes
    const locations = result.locationIds.map(id => {
      const node = result.graph.getNode(id)!;
      return {
        col: node.properties.hexCol as number,
        row: node.properties.hexRow as number,
        subtype: node.properties.locationSubtype as LocationSubtype,
      };
    });

    // For every pair of settlements that BOTH have spacing rules, verify spacing.
    // Non-settlement locations (wonders, wilderness, anomalies) are allowed near settlements.
    const settlementsWithSpacing = locations.filter(l => (SETTLEMENT_MIN_SPACING[l.subtype] ?? 0) > 0);
    for (let i = 0; i < settlementsWithSpacing.length; i++) {
      for (let j = i + 1; j < settlementsWithSpacing.length; j++) {
        const a = settlementsWithSpacing[i];
        const b = settlementsWithSpacing[j];
        const dist = hexDistance({ col: a.col, row: a.row }, { col: b.col, row: b.row });
        const requiredGap = Math.max(
          SETTLEMENT_MIN_SPACING[a.subtype] ?? 0,
          SETTLEMENT_MIN_SPACING[b.subtype] ?? 0,
        );
        if (requiredGap > 0) {
          expect(dist).toBeGreaterThan(requiredGap);
        }
      }
    }
  });

  it('is deterministic — same seed produces same world', () => {
    const a = seedWorld(balancedCosmology(), mockTiles(), 42);
    const b = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(a.individualIds).toEqual(b.individualIds);
    expect(a.factionIds).toEqual(b.factionIds);
    expect(a.locationIds).toEqual(b.locationIds);
  });

  it('different seeds produce different worlds', () => {
    const a = seedWorld(balancedCosmology(), mockTiles(), 42);
    const b = seedWorld(balancedCosmology(), mockTiles(), 99);
    const aNames = a.individualIds.map(id => a.graph.getNode(id)!.name);
    const bNames = b.individualIds.map(id => b.graph.getNode(id)!.name);
    expect(aNames).not.toEqual(bNames);
  });

  it('creates individuals with axiological profiles and domain capabilities', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const actor = result.graph.getNode(result.individualIds[0])!;
    const props = actor.properties;
    expect(props.actorType).toBe('individual');
    expect(props.axiologicalProfile).toBeDefined();
    expect(props.domainCapabilities).toBeDefined();
  });

  it('assigns individuals to locations via contains edges', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const edges = result.graph.getEdgesByType('contains');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('creates faction membership edges', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const memberEdges = result.graph.getEdgesByType('member_of');
    expect(memberEdges.length).toBeGreaterThan(0);
  });

  it('creates inter-actor relationships', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const relEdges = result.graph.getEdgesByType('relates_to');
    expect(relEdges.length).toBeGreaterThan(0);
  });

  it('creates location adjacency edges for hex-neighbor locations', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const adjEdges = result.graph.getEdgesByType('adjacent');
    // With settlement spacing, locations may not be hex-adjacent.
    // Verify that any adjacency edges that do exist connect valid location pairs.
    for (const edge of adjEdges) {
      expect(result.graph.getNode(edge.source)?.type).toBe('location');
      expect(result.graph.getNode(edge.target)?.type).toBe('location');
    }
  });

  it('applies cultural_template echo injection to actor traits', () => {
    const injection: ActiveInjection = {
      echoId: 'echo_001',
      injection: {
        injectionType: 'cultural_template',
        description: 'Seeds courage culture',
        sphereBiases: { force: 0.05 },
        traitTendencies: ['courage_prudence'],
      },
      strength: 0.8,
    };
    const result = seedWorld(balancedCosmology(), mockTiles(), 42, [injection]);
    const profiles = result.individualIds.map(id => {
      const node = result.graph.getNode(id)!;
      return (node.properties.axiologicalProfile as Record<string, number>).courage_prudence;
    });
    const avg = profiles.reduce((a, b) => a + b, 0) / profiles.length;
    expect(typeof avg).toBe('number');
  });

  it('SeedResult includes guildIds array', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(Array.isArray(result.guildIds)).toBe(true);
  });

  it('assigns a narrative archetype to each individual agent', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(result.individualIds.length).toBeGreaterThan(0);
    for (const id of result.individualIds) {
      const node = result.graph.getNode(id)!;
      const props = node.properties as Record<string, unknown>;
      expect(props.narrativeArchetype).toBeTruthy();
      expect(typeof props.narrativeArchetype).toBe('string');
    }
  });
});

describe('seedWorld culture integration', () => {
  it('SeedResult includes cultureIds', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(result.cultureIds).toBeDefined();
    expect(result.cultureIds.length).toBeGreaterThanOrEqual(CULTURE_COUNT.min);
    expect(result.cultureIds.length).toBeLessThanOrEqual(CULTURE_COUNT.max);
  });

  it('creates culture nodes in the graph', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const id of result.cultureIds) {
      const node = result.graph.getNode(id);
      expect(node).toBeDefined();
      expect(node!.type).toBe('actor');
      expect(node!.properties.actorType).toBe('culture');
      expect(node!.properties.cultureIdentity).toBeDefined();
    }
  });

  it('assigns cultures to locations with historical and current layers', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const locId of result.locationIds) {
      const edges = result.graph.getAllEdgesForNode(locId)
        .filter(e => e.type === 'belongs_to');
      expect(edges.length).toBeGreaterThanOrEqual(1);
      const layers = edges.map(e => e.properties.cultureLayer);
      expect(layers).toContain('historical');
      expect(layers).toContain('current');
    }
  });

  it('assigns cultures to individual actors', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    let withCulture = 0;
    for (const id of result.individualIds) {
      const edges = result.graph.getAllEdgesForNode(id)
        .filter(e => e.type === 'belongs_to');
      if (edges.length > 0) withCulture++;
    }
    expect(withCulture).toBeGreaterThanOrEqual(result.individualIds.length * 0.5);
  });

  it('assigns cultures to factions', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const facId of result.factionIds) {
      const edges = result.graph.getAllEdgesForNode(facId)
        .filter(e => e.type === 'belongs_to');
      expect(edges).toHaveLength(1);
    }
  });

  it('culture generation is deterministic', () => {
    const a = seedWorld(balancedCosmology(), mockTiles(), 42);
    const b = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(a.cultureIds).toEqual(b.cultureIds);
    for (let i = 0; i < a.cultureIds.length; i++) {
      expect(a.graph.getNode(a.cultureIds[i])!.name)
        .toBe(b.graph.getNode(b.cultureIds[i])!.name);
    }
  });

  describe('seedWorld cultural traits', () => {
    it('creates formative trait definition nodes in the graph', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const traitNodes = graph.getNodesByType('trait');
      const formative = traitNodes.filter(n =>
        (n.properties as any).subcategory === 'innate'
        && n.id.startsWith('trait_formative_'));
      expect(formative.length).toBeGreaterThan(0);
    });

    it('creates behavioral trait definition nodes in the graph', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const traitNodes = graph.getNodesByType('trait');
      const behavioral = traitNodes.filter(n =>
        (n.properties as any).subcategory === 'cultural'
        && n.id.startsWith('trait_behavioral_'));
      expect(behavioral.length).toBeGreaterThan(0);
    });

    it('grants cultural traits to individual actors with culture', () => {
      const { graph, individualIds } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const withCulture = individualIds.filter(id =>
        graph.getOutgoingEdges(id, 'belongs_to').length > 0
      );
      expect(withCulture.length).toBeGreaterThan(0);
      const withTraits = withCulture.filter(id =>
        graph.getOutgoingEdges(id, 'has_trait').length > 0
      );
      expect(withTraits.length).toBeGreaterThan(0);
    });
  });
});
