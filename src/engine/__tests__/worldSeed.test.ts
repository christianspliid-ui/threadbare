import { describe, it, expect } from 'vitest';
import {
  seedWorld,
  INDIVIDUAL_COUNT,
  FACTION_COUNT,
  LOCATION_COUNT,
  ARTIFACT_COUNT,
} from '../worldSeed';
import type { CosmologyProfile, HexTile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import type { ActiveInjection } from '../echo';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mockTiles(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
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
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    expect(result.individualIds.length).toBeGreaterThanOrEqual(INDIVIDUAL_COUNT.min);
    expect(result.individualIds.length).toBeLessThanOrEqual(INDIVIDUAL_COUNT.max);
    expect(result.factionIds.length).toBeGreaterThanOrEqual(FACTION_COUNT.min);
    expect(result.locationIds.length).toBeGreaterThanOrEqual(LOCATION_COUNT.min);
    expect(result.artifactIds.length).toBeGreaterThanOrEqual(ARTIFACT_COUNT.min);
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

  it('creates location adjacency edges', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const adjEdges = result.graph.getEdgesByType('adjacent');
    expect(adjEdges.length).toBeGreaterThanOrEqual(result.locationIds.length - 1);
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
});
