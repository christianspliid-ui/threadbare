import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { CultureIdentity, CultureEdgeProperties } from '../../types/culture';
import {
  CULTURE_COUNT,
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
} from '../../types/culture';
import { composeCultureIdentity, generateCultureName } from '../cultureGenerator';

describe('culture graph edges', () => {
  it('supports belongs_to edge type for culture assignment', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
    graph.addNode({ id: 'culture_1', type: 'actor', name: 'Culture', properties: { actorType: 'culture' } });
    graph.addEdge({
      id: 'edge_bt_1',
      source: 'actor_1',
      target: 'culture_1',
      type: 'belongs_to',
      properties: { culturalStrength: 0.7 },
    });
    const edges = graph.getEdgesByType('belongs_to');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.culturalStrength).toBe(0.7);
  });
});

describe('culture types', () => {
  it('CultureIdentity has all required fields', () => {
    const identity: CultureIdentity = {
      foundationBias: 'chaos',
      veneratedSpheres: ['force'],
      primaryBiome: 'desert',
      socialStructure: 'Fluid hierarchy',
      accountability: 'Personal honor',
      behavioralKeywords: ['storm-born'],
      materialVocabulary: ['heavy metals'],
      metaphorPalette: ['the unbroken wave'],
      formativeTraitSeedIds: ['weapon_mastery'],
      behavioralTraitSeedIds: ['challenge_compulsion'],
    };
    expect(identity.foundationBias).toBe('chaos');
    expect(identity.veneratedSpheres).toHaveLength(1);
  });

  it('CultureEdgeProperties has strength and optional layer', () => {
    const edge: CultureEdgeProperties = {
      culturalStrength: 0.7,
      cultureLayer: 'historical',
    };
    expect(edge.culturalStrength).toBe(0.7);
    expect(edge.cultureLayer).toBe('historical');
  });

  it('constants have expected ranges', () => {
    expect(CULTURE_COUNT.min).toBe(2);
    expect(CULTURE_COUNT.max).toBe(4);
    expect(CULTURE_STRENGTH_INDIVIDUAL.min).toBeGreaterThan(0);
    expect(CULTURE_STRENGTH_INDIVIDUAL.max).toBeLessThanOrEqual(1);
    expect(CULTURE_STRENGTH_FACTION.min).toBeGreaterThan(0);
    expect(CULTURE_STRENGTH_FACTION.max).toBeLessThanOrEqual(1);
    expect(DUAL_CULTURE_PROBABILITY).toBeGreaterThan(0);
    expect(DUAL_CULTURE_PROBABILITY).toBeLessThan(1);
    expect(CULTURELESS_PROBABILITY).toBeGreaterThan(0);
    expect(CULTURELESS_PROBABILITY).toBeLessThan(1);
  });
});

describe('composeCultureIdentity', () => {
  it('merges foundation + sphere + biome into a CultureIdentity', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'desert');
    expect(identity.foundationBias).toBe('chaos');
    expect(identity.veneratedSpheres).toEqual(['force']);
    expect(identity.primaryBiome).toBe('desert');
    expect(identity.socialStructure).toBeTruthy();
    expect(identity.accountability).toBeTruthy();
    expect(identity.behavioralKeywords.length).toBeGreaterThan(0);
    expect(identity.materialVocabulary.length).toBeGreaterThan(0);
    expect(identity.metaphorPalette.length).toBeGreaterThan(0);
    expect(identity.formativeTraitSeedIds.length).toBeGreaterThan(0);
    expect(identity.behavioralTraitSeedIds.length).toBeGreaterThan(0);
  });

  it('merges keywords from all three layers without duplicates', () => {
    const identity = composeCultureIdentity('order', ['matter', 'mind'], 'mountains');
    const uniqueKeywords = new Set(identity.behavioralKeywords);
    expect(uniqueKeywords.size).toBe(identity.behavioralKeywords.length);
  });

  it('supports 2 venerated spheres', () => {
    const identity = composeCultureIdentity('light', ['life', 'spirit'], 'jungle');
    expect(identity.veneratedSpheres).toEqual(['life', 'spirit']);
    expect(identity.formativeTraitSeedIds.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back gracefully for unknown foundation', () => {
    const identity = composeCultureIdentity('unknown_foundation', ['force'], 'desert');
    expect(identity.veneratedSpheres).toEqual(['force']);
    expect(identity.primaryBiome).toBe('desert');
    expect(identity.socialStructure).toBeTruthy();
  });

  it('falls back gracefully for unknown biome', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'ocean' as any);
    expect(identity.foundationBias).toBe('chaos');
    expect(identity.materialVocabulary.length).toBeGreaterThan(0);
  });
});

describe('generateCultureName', () => {
  it('generates a non-empty string', () => {
    const rng = (() => { let i = 0; return () => (i++ % 10) / 10; })();
    const identity = composeCultureIdentity('chaos', ['force'], 'desert');
    const name = generateCultureName(identity, rng);
    expect(name.length).toBeGreaterThan(0);
  });

  it('is deterministic with same rng sequence', () => {
    const rng1 = (() => { let i = 0; return () => (i++ % 10) / 10; })();
    const rng2 = (() => { let i = 0; return () => (i++ % 10) / 10; })();
    const identity = composeCultureIdentity('order', ['matter'], 'mountains');
    expect(generateCultureName(identity, rng1)).toBe(generateCultureName(identity, rng2));
  });

  it('handles unknown biome gracefully', () => {
    const rng = (() => { let i = 0; return () => (i++ % 10) / 10; })();
    const identity = composeCultureIdentity('chaos', ['force'], 'ocean' as any);
    const name = generateCultureName(identity, rng);
    expect(name.length).toBeGreaterThan(0);
  });
});
