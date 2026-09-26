import { describe, it, expect } from 'vitest';
import type { WorldGraph } from '../graph';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { getLocationNodes } from '../sublocationShape';
import { cultureResolver, agentCultureResolver } from '../proseResolvers';
import { getCultureFoundationPairKey } from '../cultureFoundationPair';
import { CULTURE_LOCATION_PROSE } from '../../data/prose-layer-content';

/**
 * The THR-1623 defect was invisible to every fixture test: fixtures wrote the
 * `foundationPair` field the resolvers read, and no worldgen writer ever did. Only a
 * generated world can falsify "place pages and mortal cards describe culture".
 * Measured before the fix (THR-1599 prototype, medium, t0): 0 of 40 / 0 of 235 on seed
 * 42, 0 of 60 / 0 of 326 on seed 99. After: 40/40 · 235/235 and 60/60 · 325/325. Fast lane —
 * one medium world builds in ~100 ms.
 */
const MIN_COVERAGE = 0.9;
const SEEDS = [42, 99];

function generate(seed: number): WorldGraph {
  const archetype = generateArchetypes(4, seed)[0];
  const { cols, rows } = MAP_SIZE_PRESETS.medium;
  const { state } = initializeGameState(
    archetype,
    'CultureProseProbe',
    createBalancedCosmology(),
    seed,
    cols,
    rows,
  );
  return state.graph;
}

function bearsCulture(graph: WorldGraph, nodeId: string): boolean {
  return graph
    .getOutgoingEdges(nodeId, 'belongs_to')
    .some(e => graph.getNode(e.target)?.properties?.cultureIdentity != null);
}

describe('culture prose on a generated medium world (THR-1623)', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: both culture resolvers speak for ≥ 90% of culture-bearing Locations and mortals`, () => {
      const graph = generate(seed);

      const places = getLocationNodes(graph).filter(n => bearsCulture(graph, n.id));
      const placeHits = places.filter(n => cultureResolver(n.id, graph, seed).length > 0);

      const mortals = graph
        .getNodesByType('actor')
        .filter(n => n.properties?.actorType === 'individual' && bearsCulture(graph, n.id));
      const mortalHits = mortals.filter(n => agentCultureResolver(n.id, graph, seed).length > 0);

      // Non-vacuous: the world must actually carry culture-bearing nodes to measure.
      expect(places.length).toBeGreaterThan(0);
      expect(mortals.length).toBeGreaterThan(0);

      expect(placeHits.length / places.length).toBeGreaterThanOrEqual(MIN_COVERAGE);
      expect(mortalHits.length / mortals.length).toBeGreaterThanOrEqual(MIN_COVERAGE);
    });

    it(`seed ${seed}: every culture in the world resolves to an authored prose key`, () => {
      const graph = generate(seed);
      const cultures = graph
        .getNodesByType('actor')
        .filter(n => n.properties?.cultureIdentity != null);
      expect(cultures.length).toBeGreaterThan(0);
      for (const c of cultures) {
        const identity = c.properties.cultureIdentity as { foundationBias?: string };
        const key = getCultureFoundationPairKey(identity);
        expect(key, `${c.id} (${identity.foundationBias})`).not.toBeNull();
        expect(CULTURE_LOCATION_PROSE[key!], `${c.id} → ${key}`).toBeDefined();
      }
    });
  }
});
