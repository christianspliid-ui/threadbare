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
