/**
 * Latent essence-source worldgen seeding tests (THR-611 — Divine Economy, Slice 4).
 *
 * Asserts: eligible-host filtering, latent/typed/uncontrolled invariants, the
 * count cap, and determinism (same seed → same placement).
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { seedLatentEssenceSources } from '../essenceSourceSeeding';
import { readEssenceSource } from '../essenceSources';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import type { SphereName } from '../../types';
import { mulberry32 } from '../../lib/prng';
import { LATENT_SOURCE_SEED_COUNT } from '../../data/essence-sources';

/** A location with a wild-interest subtype and a locale sphere affinity. */
function addWildLocation(graph: WorldGraph, id: string, subtype: string, sphere: SphereName): void {
  const affinity = createDefaultSphereAffinity();
  affinity.scores[sphere] = 5;
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: { locationType: subtype, hexCol: 1, hexRow: 1, sphereAffinity: affinity },
  });
}

function makeGraph(wildCount: number): WorldGraph {
  const graph = new WorldGraph();
  const subtypes = ['grove', 'cavern', 'hot_spring', 'monument', 'ancient_road'];
  for (let i = 0; i < wildCount; i++) {
    addWildLocation(graph, `wild.${i}`, subtypes[i % subtypes.length], 'force');
  }
  // Ineligible host: a settlement (wrong subtype). Note: mundane `controls` edges
  // on a wild host do NOT disqualify it — a divine source is orthogonal to mortal
  // control — so a controlled grove is intentionally still eligible.
  graph.addNode({ id: 'town', type: 'location', name: 'Town', properties: { locationType: 'city' } });
  return graph;
}

describe('seedLatentEssenceSources', () => {
  it('seeds up to the target count of latent, typed, uncontrolled placeOfPower sources', () => {
    const graph = makeGraph(20);
    const n = seedLatentEssenceSources(graph, mulberry32(42));
    expect(n).toBe(LATENT_SOURCE_SEED_COUNT);

    let seededOnWild = 0;
    for (let i = 0; i < 20; i++) {
      const src = readEssenceSource(graph.getNode(`wild.${i}`)?.properties);
      if (!src) continue;
      seededOnWild++;
      expect(src.kind).toBe('placeOfPower');
      expect(src.tier).toBe('dormant');
      expect(src.discoveredBy).toBeUndefined(); // latent — hidden until found
      expect(src.sphereAffinity).toBe('force'); // typed by locale
      // Uncontrolled: no incoming controls edge.
      expect(graph.getIncomingEdges(`wild.${i}`, 'controls')).toHaveLength(0);
    }
    expect(seededOnWild).toBe(LATENT_SOURCE_SEED_COUNT);
  });

  it('never seeds a settlement (wrong subtype)', () => {
    const graph = makeGraph(20);
    seedLatentEssenceSources(graph, mulberry32(42));
    expect(readEssenceSource(graph.getNode('town')?.properties)).toBeUndefined();
  });

  it('still seeds a wild host that already carries a mundane controls edge', () => {
    const graph = makeGraph(0);
    addWildLocation(graph, 'wild.owned', 'grove', 'life');
    graph.addNode({ id: 'duke', type: 'actor', name: 'Duke', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e1', source: 'duke', target: 'wild.owned', type: 'controls', properties: {} });
    const n = seedLatentEssenceSources(graph, mulberry32(3));
    expect(n).toBe(1);
    expect(readEssenceSource(graph.getNode('wild.owned')?.properties)?.kind).toBe('placeOfPower');
  });

  it('caps at the eligible-host count on a small map', () => {
    const graph = makeGraph(3); // fewer eligible than the target count
    const n = seedLatentEssenceSources(graph, mulberry32(7));
    expect(n).toBe(3);
  });

  it('is deterministic: same seed → same placement', () => {
    const pick = (): Set<string> => {
      const graph = makeGraph(20);
      seedLatentEssenceSources(graph, mulberry32(99));
      const s = new Set<string>();
      for (let i = 0; i < 20; i++) {
        if (readEssenceSource(graph.getNode(`wild.${i}`)?.properties)) s.add(`wild.${i}`);
      }
      return s;
    };
    expect([...pick()].sort()).toEqual([...pick()].sort());
  });

  it('returns 0 when there are no eligible hosts', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'city', type: 'location', name: 'City', properties: { locationType: 'city' } });
    expect(seedLatentEssenceSources(graph, mulberry32(1))).toBe(0);
  });
});
