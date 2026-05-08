import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { CultureIdentity, CultureEdgeProperties } from '../../types/culture';
import { REACH_DOMAINS } from '../../types/traits';
import {
  CULTURE_COUNT,
  CULTURE_STRENGTH_INDIVIDUAL,
  CULTURE_STRENGTH_FACTION,
  DUAL_CULTURE_PROBABILITY,
  CULTURELESS_PROBABILITY,
} from '../../types/culture';
import type { CosmologyProfile, TerrainType } from '../../types/index';
import {
  composeCultureIdentity,
  generateCultureName,
  generateCultures,
  generateCultureIdentities,
  assignCultureToActor,
  assignCultureToLocation,
  assignCulturesToActors,
  registerPregenCultures,
} from '../cultureGenerator';

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
      reachPreferences: { iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0, eye: 0, stone: 0, star: 0 },
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

// ─── Reusable mock identity ────────────────────────────────────────

const mockIdentity: CultureIdentity = {
  foundationBias: 'order',
  veneratedSpheres: ['force'],
  primaryBiome: 'grassland',
  preferredBiomes: ['grassland'],
  toleratedBiomes: [],
  archetypeLabel: 'The Protector Plains Folk',
  demonym: 'Daru',
  homePlaceName: 'Daruheim',
  socialStructure: 'Council of elders',
  accountability: 'Community consensus',
  behavioralKeywords: ['structured'],
  materialVocabulary: ['stone'],
  metaphorPalette: ['the steady river'],
  formativeTraitSeedIds: ['discipline'],
  behavioralTraitSeedIds: ['loyalty'],
  reachPreferences: { iron: 0, gold: 0, shadow: 0, veil: 0, heart: 0, eye: 0, stone: 0, star: 0 },
};

// ─── Helper for tests ──────────────────────────────────────────────

function balancedCosmology(): CosmologyProfile {
  return {
    force: 0.125,
    matter: 0.125,
    energy: 0.125,
    life: 0.125,
    mind: 0.125,
    spirit: 0.125,
    time: 0.125,
    entropy: 0.125,
  };
}

function mockLocationNodes(graph: WorldGraph, terrains: TerrainType[]): string[] {
  const ids: string[] = [];
  for (let i = 0; i < terrains.length; i++) {
    const id = `loc_${i}`;
    graph.addNode({
      id,
      type: 'location',
      name: `Location ${i}`,
      properties: { terrain: terrains[i] },
    });
    ids.push(id);
  }
  return ids;
}

// ─── Test Suites for New Functions ──────────────────────────────────

describe('generateCultures', () => {
  it('creates between CULTURE_COUNT.min and CULTURE_COUNT.max culture nodes', () => {
    const graph = new WorldGraph();
    const locIds = mockLocationNodes(graph, ['desert', 'mountains', 'jungle', 'grassland']);
    const rng = (() => {
      let i = 0;
      return () => (i++ * 0.1) % 1;
    })();
    const cultureIds = generateCultures(graph, balancedCosmology(), locIds, rng);
    expect(cultureIds.length).toBeGreaterThanOrEqual(CULTURE_COUNT.min);
    expect(cultureIds.length).toBeLessThanOrEqual(CULTURE_COUNT.max);
  });

  it('creates culture nodes with type actor and actorType culture', () => {
    const graph = new WorldGraph();
    const locIds = mockLocationNodes(graph, ['desert', 'mountains', 'jungle']);
    const rng = (() => {
      let i = 0;
      return () => (i++ * 0.17) % 1;
    })();
    const cultureIds = generateCultures(graph, balancedCosmology(), locIds, rng);
    for (const id of cultureIds) {
      const node = graph.getNode(id);
      expect(node).toBeDefined();
      expect(node!.type).toBe('actor');
      expect(node!.properties.actorType).toBe('culture');
      expect(node!.properties.cultureIdentity).toBeDefined();
    }
  });

  it('assigns location culture edges (historical + current)', () => {
    const graph = new WorldGraph();
    const locIds = mockLocationNodes(graph, ['desert', 'mountains', 'jungle', 'grassland']);
    const rng = (() => {
      let i = 0;
      return () => (i++ * 0.13) % 1;
    })();
    generateCultures(graph, balancedCosmology(), locIds, rng);
    for (const locId of locIds) {
      const edges = graph.getAllEdgesForNode(locId).filter(e => e.type === 'belongs_to');
      expect(edges.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('is deterministic with same rng', () => {
    const makeGraph = () => {
      const g = new WorldGraph();
      mockLocationNodes(g, ['desert', 'mountains', 'jungle']);
      return g;
    };
    const locIds = ['loc_0', 'loc_1', 'loc_2'];
    const rng1 = (() => {
      let i = 0;
      return () => (i++ * 0.13) % 1;
    })();
    const rng2 = (() => {
      let i = 0;
      return () => (i++ * 0.13) % 1;
    })();
    const g1 = makeGraph();
    const g2 = makeGraph();
    const ids1 = generateCultures(g1, balancedCosmology(), locIds, rng1);
    const ids2 = generateCultures(g2, balancedCosmology(), locIds, rng2);
    expect(ids1).toEqual(ids2);
  });
});

describe('assignCultureToActor', () => {
  it('creates a belongs_to edge with culturalStrength', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'ind_0',
      type: 'actor',
      name: 'Kael',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'culture_0',
      type: 'actor',
      name: 'Culture',
      properties: { actorType: 'culture' },
    });
    assignCultureToActor(graph, 'ind_0', 'culture_0', 0.7);
    const edges = graph.getEdgesByType('belongs_to');
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('ind_0');
    expect(edges[0].target).toBe('culture_0');
    expect(edges[0].properties.culturalStrength).toBe(0.7);
  });
});

describe('assignCultureToLocation', () => {
  it('creates a belongs_to edge with cultureLayer', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_0',
      type: 'location',
      name: 'Place',
      properties: {},
    });
    graph.addNode({
      id: 'culture_0',
      type: 'actor',
      name: 'Culture',
      properties: { actorType: 'culture' },
    });
    assignCultureToLocation(graph, 'loc_0', 'culture_0', 'historical');
    const edges = graph.getEdgesByType('belongs_to');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.cultureLayer).toBe('historical');
  });
});

describe('assignCulturesToActors', () => {
  it('assigns cultures to individuals following budget model', () => {
    const graph = new WorldGraph();
    const cultureIds = ['culture_0', 'culture_1'];
    for (const id of cultureIds) {
      graph.addNode({
        id,
        type: 'actor',
        name: id,
        properties: { actorType: 'culture' },
      });
    }
    const indIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const id = `ind_${i}`;
      graph.addNode({
        id,
        type: 'actor',
        name: id,
        properties: { actorType: 'individual' },
      });
      indIds.push(id);
    }
    graph.addNode({
      id: 'fac_0',
      type: 'actor',
      name: 'Faction',
      properties: { actorType: 'faction' },
    });

    const rng = (() => {
      let i = 0;
      return () => (i++ * 0.07) % 1;
    })();
    assignCulturesToActors(graph, indIds, ['fac_0'], cultureIds, rng);

    // All factions should have exactly 1 culture
    const facEdges = graph.getAllEdgesForNode('fac_0').filter(e => e.type === 'belongs_to');
    expect(facEdges).toHaveLength(1);
    expect(facEdges[0].properties.culturalStrength).toBeGreaterThanOrEqual(
      CULTURE_STRENGTH_FACTION.min
    );
    expect(facEdges[0].properties.culturalStrength).toBeLessThanOrEqual(
      CULTURE_STRENGTH_FACTION.max
    );

    let singleCulture = 0;
    let dualCulture = 0;
    let cultureless = 0;
    for (const id of indIds) {
      const edges = graph.getAllEdgesForNode(id).filter(e => e.type === 'belongs_to');
      if (edges.length === 0) cultureless++;
      else if (edges.length === 1) singleCulture++;
      else dualCulture++;
    }
    expect(singleCulture + dualCulture + cultureless).toBe(20);

    for (const id of indIds) {
      const edges = graph.getAllEdgesForNode(id).filter(e => e.type === 'belongs_to');
      for (const e of edges) {
        // Strengths should be positive
        expect(e.properties.culturalStrength).toBeGreaterThan(0);
        // Strengths should not exceed max (dual culture gets reduced to 0.6*max)
        expect(e.properties.culturalStrength).toBeLessThanOrEqual(CULTURE_STRENGTH_INDIVIDUAL.max);
      }
    }
  });
});

describe('generateCultureIdentities demonym and homePlaceName', () => {
  it('generates demonym and homePlaceName on each culture identity', () => {
    const rng = (() => { let i = 0; return () => (i++ * 0.13) % 1; })();
    const cultures = generateCultureIdentities(balancedCosmology(), rng);
    for (const c of cultures) {
      expect(c.identity.demonym).toBeTruthy();
      expect(c.identity.homePlaceName).toBeTruthy();
      // Both names should be non-empty strings (THR-15: phonetic generator produces
      // culturally distinct names; no longer guarantees prefix relationship)
      expect(typeof c.identity.demonym).toBe('string');
      expect(typeof c.identity.homePlaceName).toBe('string');
    }
  });
});

describe('culture trait nodes', () => {
  it('registerPregenCultures creates a trait node per culture', () => {
    const graph = new WorldGraph();
    const cultures = [{
      id: 'culture_0',
      name: 'The Daru',
      identity: { ...mockIdentity, demonym: 'Daru' },
      flagSvg: '',
    }];
    registerPregenCultures(graph, cultures);
    const traitNode = graph.getNode('trait.culture.culture_0');
    expect(traitNode).toBeTruthy();
    expect(traitNode!.type).toBe('trait');
    expect(traitNode!.name).toBe('Daru');
    expect(traitNode!.properties.subcategory).toBe('cultural');
    expect(traitNode!.properties.tags).toContain('Daru');
  });

  it('uses culture name as fallback when demonym is absent', () => {
    const graph = new WorldGraph();
    const identityWithoutDemonym = { ...mockIdentity };
    delete identityWithoutDemonym.demonym;
    const cultures = [{
      id: 'culture_1',
      name: 'The Unnamed',
      identity: identityWithoutDemonym,
      flagSvg: '',
    }];
    registerPregenCultures(graph, cultures);
    const traitNode = graph.getNode('trait.culture.culture_1');
    expect(traitNode).toBeTruthy();
    expect(traitNode!.name).toBe('The Unnamed');
  });
});

describe('culture trait assignment', () => {
  it('assignCultureToLocation creates has_trait edge to culture trait node', () => {
    const graph = new WorldGraph();
    const cultures = [{
      id: 'culture_0',
      name: 'The Daru',
      identity: { ...mockIdentity, demonym: 'Daru' },
      flagSvg: '',
    }];
    registerPregenCultures(graph, cultures);
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Test Town', properties: {} });
    assignCultureToLocation(graph, 'loc_1', 'culture_0', 'current');
    const traitEdges = graph.getOutgoingEdges('loc_1', 'has_trait');
    const cultureTrait = traitEdges.find(e => e.target === 'trait.culture.culture_0');
    expect(cultureTrait).toBeTruthy();
  });

  it('assignCultureToLocation does not create has_trait edge when trait node absent', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'culture_0', type: 'actor', name: 'Orphan', properties: { actorType: 'culture' } });
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Test Town', properties: {} });
    // No trait node created — no registerPregenCultures call
    assignCultureToLocation(graph, 'loc_1', 'culture_0', 'current');
    const traitEdges = graph.getOutgoingEdges('loc_1', 'has_trait');
    expect(traitEdges).toHaveLength(0);
  });

  it('assignCultureToActor creates has_trait edge to culture trait node', () => {
    const graph = new WorldGraph();
    const cultures = [{
      id: 'culture_0',
      name: 'The Daru',
      identity: { ...mockIdentity, demonym: 'Daru' },
      flagSvg: '',
    }];
    registerPregenCultures(graph, cultures);
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test Agent', properties: {} });
    assignCultureToActor(graph, 'actor_1', 'culture_0', 0.8);
    const traitEdges = graph.getOutgoingEdges('actor_1', 'has_trait');
    const cultureTrait = traitEdges.find(e => e.target === 'trait.culture.culture_0');
    expect(cultureTrait).toBeTruthy();
  });

  it('assignCultureToActor does not create has_trait edge when trait node absent', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'culture_0', type: 'actor', name: 'Orphan', properties: { actorType: 'culture' } });
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test Agent', properties: {} });
    // No trait node created
    assignCultureToActor(graph, 'actor_1', 'culture_0', 0.8);
    const traitEdges = graph.getOutgoingEdges('actor_1', 'has_trait');
    expect(traitEdges).toHaveLength(0);
  });
});

describe('composeCultureIdentity reachPreferences', () => {
  it('produces reachPreferences from modifier weights', () => {
    const identity = composeCultureIdentity('chaos', ['force'], 'mountains');
    expect(identity.reachPreferences).toBeDefined();
    // Should have all 9 reach domains
    for (const domain of REACH_DOMAINS) {
      expect(typeof identity.reachPreferences[domain]).toBe('number');
    }
    // Iron should be high (chaos +0.1, force +0.6, mountains +0.3 = 1.0, clamped)
    expect(identity.reachPreferences.iron).toBeGreaterThan(0.5);
    // Heart should be low (chaos -0.2)
    expect(identity.reachPreferences.heart).toBeLessThan(0);
  });

  it('clamps reachPreferences to [-1, 1]', () => {
    const identity = composeCultureIdentity('order', ['matter', 'force'], 'mountains');
    for (const domain of REACH_DOMAINS) {
      expect(identity.reachPreferences[domain]).toBeGreaterThanOrEqual(-1);
      expect(identity.reachPreferences[domain]).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic — same inputs produce same reachPreferences', () => {
    const a = composeCultureIdentity('light', ['spirit'], 'grassland');
    const b = composeCultureIdentity('light', ['spirit'], 'grassland');
    expect(a.reachPreferences).toEqual(b.reachPreferences);
  });
});
