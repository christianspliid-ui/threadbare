/**
 * locationTraitResolver (THR-1522) — a place's minted traits reach its prose.
 *
 * A `#haunted` place says the word; an unmarked place does not. Reads the same
 * `has_trait` edges `phaseLocationTraits` writes and the location sheet reads.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { locationTraitResolver } from '../proseResolvers';
import { generateEntityProse } from '../proseGenerator';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import {
  LOCATION_TRAIT_PROSE,
  LOCATION_TRAIT_PROSE_MAX,
  LOCATION_TRAIT_PROSE_PRIORITY,
} from '../../data/prose-layer-content';

const SEED = 42;

function makePlace(traits: string[]): { graph: WorldGraph; id: string } {
  const graph = new WorldGraph();
  const id = 'loc_trait_test';
  graph.addNode({
    id,
    type: 'location',
    name: 'Greywater',
    properties: { locationSubtype: 'town', prosperity: 30 },
  });
  for (const traitId of traits) {
    graph.addNode({ id: traitId, type: 'trait', name: traitId, properties: { subcategory: 'condition' } });
    graph.addEdge({
      id: `e.has_trait.${id}.${traitId}`,
      type: 'has_trait',
      source: id,
      target: traitId,
      properties: { acquiredTick: 0, source: 'location_trait' },
    });
  }
  return { graph, id };
}

describe('locationTraitResolver', () => {
  it('a haunted place says haunted', () => {
    const { graph, id } = makePlace([LOCATION_TRAIT_IDS.haunted]);
    const layers = locationTraitResolver(id, graph, SEED);
    expect(layers).toHaveLength(1);
    expect(layers[0].text.toLowerCase()).toContain('haunted');
    expect(layers[0].text).toContain('Greywater');
    expect(layers[0].priority).toBe(LOCATION_TRAIT_PROSE_PRIORITY);
    expect(layers[0].category).toBe('tension');
    expect(layers[0].source).toBe('locationTraitResolver');
  });

  it('an unmarked place says nothing', () => {
    const { graph, id } = makePlace([]);
    expect(locationTraitResolver(id, graph, SEED)).toEqual([]);
  });

  it('the composed location prose carries the trait line, and only when the trait is held', () => {
    const marked = makePlace([LOCATION_TRAIT_IDS.haunted]);
    const unmarked = makePlace([]);
    const markedProse = generateEntityProse(marked.id, marked.graph, SEED, 'full').toLowerCase();
    const unmarkedProse = generateEntityProse(unmarked.id, unmarked.graph, SEED, 'full').toLowerCase();
    expect(markedProse).toContain('haunted');
    expect(unmarkedProse).not.toContain('haunted');
  });

  it('caps at LOCATION_TRAIT_PROSE_MAX layers, in declaration order', () => {
    const all = Object.values(LOCATION_TRAIT_IDS);
    const { graph, id } = makePlace([...all].reverse());
    const layers = locationTraitResolver(id, graph, SEED);
    expect(layers).toHaveLength(LOCATION_TRAIT_PROSE_MAX);
    expect(layers[0].text.toLowerCase()).toContain('welcoming');
    expect(layers[1].text.toLowerCase()).toContain('lawless');
  });

  it('ignores traits that are not location traits, and a missing node', () => {
    const { graph, id } = makePlace(['trait.condition.plague']);
    expect(locationTraitResolver(id, graph, SEED)).toEqual([]);
    expect(locationTraitResolver('nope', graph, SEED)).toEqual([]);
  });

  it('every location trait has a prose row that says its word', () => {
    const words: Record<string, string> = {
      welcoming: 'welcoming',
      lawless: 'lawless',
      veilThin: 'veil',
      haunted: 'haunted',
      bloodSoaked: 'blood',
    };
    for (const [key, traitId] of Object.entries(LOCATION_TRAIT_IDS)) {
      const rows = LOCATION_TRAIT_PROSE[traitId];
      expect(rows, traitId).toBeDefined();
      expect(rows.length).toBeGreaterThanOrEqual(2);
      for (const row of rows) {
        expect(row).toContain('{name}');
        expect(row.toLowerCase()).toContain(words[key]);
      }
    }
  });

  it('is deterministic for a seed', () => {
    const { graph, id } = makePlace([LOCATION_TRAIT_IDS.lawless]);
    expect(locationTraitResolver(id, graph, 7)).toEqual(locationTraitResolver(id, graph, 7));
  });
});
