import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedLocationResources } from '../resourceSeeding';
import { TERRAIN_RESOURCE_TABLE, RESOURCE_DEFINITIONS } from '../../data/resource-content';
import type { ResourceInstance } from '../../types/resource';
import type { CosmologyProfile, SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ─────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function balancedCosmology(): CosmologyProfile {
  const w = 1 / 8;
  return Object.fromEntries(SPHERE_NAMES.map(s => [s, w])) as CosmologyProfile;
}

function heavyCosmology(sphere: SphereName): CosmologyProfile {
  const cos = Object.fromEntries(SPHERE_NAMES.map(s => [s, 0.05])) as CosmologyProfile;
  cos[sphere] = 0.65;
  return cos;
}

function makeGraph(terrains: string[]): { graph: WorldGraph; locationIds: string[] } {
  const graph = new WorldGraph();
  const locationIds: string[] = [];
  for (let i = 0; i < terrains.length; i++) {
    const id = `loc_${i}`;
    graph.addNode({
      id,
      type: 'location',
      name: `Location ${i}`,
      properties: { terrain: terrains[i], locationSubtype: 'hamlet' },
    });
    locationIds.push(id);
  }
  return { graph, locationIds };
}

// ─── Tests ───────────────────────────────────────────────────────

describe('seedLocationResources', () => {
  it('populates resources on forest locations', () => {
    const { graph, locationIds } = makeGraph(['temperate_forest']);
    seedLocationResources(graph, locationIds, balancedCosmology(), mulberry32(42));
    const node = graph.getNode('loc_0')!;
    const resources = node.properties.resources as Record<string, ResourceInstance>;
    expect(resources).toBeDefined();
    expect(resources.timber).toBeDefined();
    expect(resources.timber.quantity).toBeGreaterThanOrEqual(55);
    expect(resources.timber.quantity).toBeLessThanOrEqual(100); // max + cosmology bonus
    expect(resources.timber.renewable).toBe(true);
  });

  it('populates resources on mountain locations', () => {
    const { graph, locationIds } = makeGraph(['mountains']);
    seedLocationResources(graph, locationIds, balancedCosmology(), mulberry32(42));
    const node = graph.getNode('loc_0')!;
    const resources = node.properties.resources as Record<string, ResourceInstance>;
    expect(resources.stone).toBeDefined();
    expect(resources.ore).toBeDefined();
    expect(resources.stone.renewable).toBe(false);
  });

  it('assigns empty resources for desert terrain', () => {
    const { graph, locationIds } = makeGraph(['desert']);
    seedLocationResources(graph, locationIds, balancedCosmology(), mulberry32(42));
    const node = graph.getNode('loc_0')!;
    const resources = node.properties.resources as Record<string, ResourceInstance>;
    expect(resources).toBeDefined();
    expect(Object.keys(resources)).toHaveLength(0);
  });

  it('is deterministic — same seed produces same resources', () => {
    const run = (seed: number) => {
      const { graph, locationIds } = makeGraph(['temperate_forest', 'mountains', 'farmland']);
      seedLocationResources(graph, locationIds, balancedCosmology(), mulberry32(seed));
      return locationIds.map(id => {
        const node = graph.getNode(id)!;
        return node.properties.resources as Record<string, ResourceInstance>;
      });
    };
    const a = run(42);
    const b = run(42);
    expect(a).toEqual(b);
  });

  it('produces different resources for different seeds', () => {
    const run = (seed: number) => {
      const { graph, locationIds } = makeGraph(['hills']);
      seedLocationResources(graph, locationIds, balancedCosmology(), mulberry32(seed));
      const node = graph.getNode('loc_0')!;
      return node.properties.resources as Record<string, ResourceInstance>;
    };
    const a = run(42);
    const b = run(999);
    // At least one quantity should differ
    const aQtys = Object.values(a).map(r => r.quantity);
    const bQtys = Object.values(b).map(r => r.quantity);
    expect(aQtys).not.toEqual(bQtys);
  });

  it('quantities stay in 0-100 range', () => {
    const terrains = Object.keys(TERRAIN_RESOURCE_TABLE);
    for (const terrain of terrains) {
      const { graph, locationIds } = makeGraph([terrain]);
      seedLocationResources(graph, locationIds, balancedCosmology(), mulberry32(42));
      const node = graph.getNode('loc_0')!;
      const resources = node.properties.resources as Record<string, ResourceInstance>;
      for (const [type, inst] of Object.entries(resources)) {
        expect(inst.quantity).toBeGreaterThanOrEqual(0);
        expect(inst.quantity).toBeLessThanOrEqual(100);
      }
    }
  });

  it('cosmology sphere affinity boosts resource quantities', () => {
    // Life-heavy cosmology should boost timber (life affinity)
    const { graph: gBalanced, locationIds: idsBalanced } = makeGraph(['temperate_forest']);
    seedLocationResources(gBalanced, idsBalanced, balancedCosmology(), mulberry32(42));
    const balancedTimber = (gBalanced.getNode('loc_0')!.properties.resources as Record<string, ResourceInstance>).timber.quantity;

    const { graph: gLife, locationIds: idsLife } = makeGraph(['temperate_forest']);
    seedLocationResources(gLife, idsLife, heavyCosmology('life'), mulberry32(42));
    const lifeTimber = (gLife.getNode('loc_0')!.properties.resources as Record<string, ResourceInstance>).timber.quantity;

    expect(lifeTimber).toBeGreaterThan(balancedTimber);
  });

  it('handles locations with no terrain property gracefully', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Nowhere', properties: {} });
    seedLocationResources(graph, ['loc_0'], balancedCosmology(), mulberry32(42));
    // Should not crash; node may or may not have resources property
    const node = graph.getNode('loc_0')!;
    // No resources added since terrain is missing
    expect(node.properties.resources).toBeUndefined();
  });

  it('every terrain in TERRAIN_RESOURCE_TABLE references valid RESOURCE_DEFINITIONS', () => {
    for (const [terrain, entries] of Object.entries(TERRAIN_RESOURCE_TABLE)) {
      for (const entry of entries) {
        expect(RESOURCE_DEFINITIONS[entry.type]).toBeDefined();
        expect(entry.min).toBeGreaterThanOrEqual(0);
        expect(entry.max).toBeLessThanOrEqual(100);
        expect(entry.min).toBeLessThanOrEqual(entry.max);
      }
    }
  });
});
