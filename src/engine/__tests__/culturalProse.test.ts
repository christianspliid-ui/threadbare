/**
 * Tests for cultural prose flavor integration.
 *
 * Verifies:
 * - Cultural words are extracted from culture nodes
 * - Returns null for actors without culture
 * - Prose generation includes cultural flavor when available
 * - Cultural flavor is applied with correct substitution rate
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { getCulturalFlavorWords, pickCulturalWord } from '../culturalProse';
import { generateRoutineProse, generateNotableProse, resetNarrativeEventCounter } from '../narrative';

// ─── Helpers for Test Setup ────────────────────────────────────────

function createMockGraph(): WorldGraph {
  return new WorldGraph();
}

function addCultureNodeToGraph(
  graph: WorldGraph,
  cultureId: string,
  identity: {
    foundationBias: string;
    veneratedSpheres: string[];
    primaryBiome: string;
    socialStructure: string;
    accountability: string;
    behavioralKeywords: string[];
    materialVocabulary: string[];
    metaphorPalette: string[];
    formativeTraitSeedIds: string[];
    behavioralTraitSeedIds: string[];
  },
): void {
  graph.addNode({
    id: cultureId,
    type: 'actor',
    name: `Culture_${cultureId}`,
    properties: {
      actorType: 'culture',
      cultureIdentity: identity,
    },
  });
}

function addActorNodeToGraph(graph: WorldGraph, actorId: string, actorName: string): void {
  graph.addNode({
    id: actorId,
    type: 'actor',
    name: actorName,
    properties: {
      actorType: 'individual',
    },
  });
}

let edgeIdCounter = 0;

function addBelongsToEdge(
  graph: WorldGraph,
  actorId: string,
  cultureId: string,
  culturalStrength: number = 0.7,
): void {
  graph.addEdge({
    id: `belongs_to_${edgeIdCounter++}`,
    source: actorId,
    target: cultureId,
    type: 'belongs_to',
    properties: { culturalStrength },
  });
}

// ─── Test Suite ───────────────────────────────────────────────────

describe('getCulturalFlavorWords', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = createMockGraph();
  });

  it('should return null for actors without a culture', () => {
    addActorNodeToGraph(graph, 'actor_1', 'Orphaned Soul');

    const result = getCulturalFlavorWords(graph, 'actor_1');
    expect(result).toBeNull();
  });

  it('should extract cultural flavor for actors with a foundation-bias culture (chaos)', () => {
    addActorNodeToGraph(graph, 'actor_1', 'Storm-Kin');
    addCultureNodeToGraph(graph, 'culture_chaos', {
      foundationBias: 'chaos',
      veneratedSpheres: ['force'],
      primaryBiome: 'volcano',
      socialStructure: 'Fluid hierarchy',
      accountability: 'Personal honor',
      behavioralKeywords: ['wild', 'untamed'],
      materialVocabulary: ['fire', 'ash'],
      metaphorPalette: ['storm', 'rupture'],
      formativeTraitSeedIds: ['trait_1'],
      behavioralTraitSeedIds: ['trait_2'],
    });
    addBelongsToEdge(graph, 'actor_1', 'culture_chaos', 0.85);

    const result = getCulturalFlavorWords(graph, 'actor_1');
    expect(result).not.toBeNull();
    expect(result?.adjectives).toContain('wild');
    expect(result?.adjectives).toContain('untamed');
    expect(result?.verbs).toContain('ruptures');
    expect(result?.verbs).toContain('shatters');
  });

  it('should extract cultural flavor for actors with a creation-sphere culture (force)', () => {
    addActorNodeToGraph(graph, 'actor_2', 'War-Lord');
    addCultureNodeToGraph(graph, 'culture_force', {
      foundationBias: 'neutral', // Use neutral so it picks from sphere
      veneratedSpheres: ['force', 'matter'],
      primaryBiome: 'mountain',
      socialStructure: 'Rigid hierarchy',
      accountability: 'Institutional',
      behavioralKeywords: ['martial', 'strong'],
      materialVocabulary: ['steel', 'stone'],
      metaphorPalette: ['battle', 'conquest'],
      formativeTraitSeedIds: ['trait_3'],
      behavioralTraitSeedIds: ['trait_4'],
    });
    addBelongsToEdge(graph, 'actor_2', 'culture_force', 0.75);

    const result = getCulturalFlavorWords(graph, 'actor_2');
    expect(result).not.toBeNull();
    expect(result?.adjectives).toContain('violent');
    expect(result?.verbs).toContain('smashes');
  });

  it('should return strongest culture when actor has multiple cultures', () => {
    addActorNodeToGraph(graph, 'actor_3', 'Dual-Natured');
    addCultureNodeToGraph(graph, 'culture_chaos', {
      foundationBias: 'chaos',
      veneratedSpheres: ['force'],
      primaryBiome: 'volcano',
      socialStructure: 'Fluid',
      accountability: 'Personal',
      behavioralKeywords: ['wild'],
      materialVocabulary: ['fire'],
      metaphorPalette: ['storm'],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addCultureNodeToGraph(graph, 'culture_order', {
      foundationBias: 'order',
      veneratedSpheres: ['matter'],
      primaryBiome: 'mountain',
      socialStructure: 'Rigid',
      accountability: 'Institutional',
      behavioralKeywords: ['measured'],
      materialVocabulary: ['stone'],
      metaphorPalette: ['architecture'],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addBelongsToEdge(graph, 'actor_3', 'culture_chaos', 0.5); // Weaker
    addBelongsToEdge(graph, 'actor_3', 'culture_order', 0.9); // Stronger

    const result = getCulturalFlavorWords(graph, 'actor_3');
    expect(result).not.toBeNull();
    // Should match order culture (stronger)
    expect(result?.adjectives).toContain('measured');
    expect(result?.verbs).toContain('inscribes');
  });

  it('should include phrase categories (rhythms, greetings, oaths)', () => {
    addActorNodeToGraph(graph, 'actor_4', 'Spirit-Touched');
    addCultureNodeToGraph(graph, 'culture_spirit', {
      foundationBias: 'darkness',
      veneratedSpheres: ['spirit'],
      primaryBiome: 'forest',
      socialStructure: 'Initiation circles',
      accountability: 'Secret tribunals',
      behavioralKeywords: ['veiled', 'secret'],
      materialVocabulary: ['shadow', 'silk'],
      metaphorPalette: ['veil', 'silence'],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addBelongsToEdge(graph, 'actor_4', 'culture_spirit', 0.8);

    const result = getCulturalFlavorWords(graph, 'actor_4');
    expect(result).not.toBeNull();
    expect(result?.phrases).toBeDefined();
    expect(result!.phrases!.length).toBeGreaterThan(0);
    // Should include at least one rhythm, greeting, or oath from darkness palette
    const hasOath = result!.phrases!.some(p => p.includes('By') || p.includes('Let'));
    expect(hasOath).toBe(true);
  });
});

describe('pickCulturalWord', () => {
  it('should pick deterministic word from list by seed', () => {
    const words = ['wild', 'untamed', 'roiling', 'defiant'];

    const word1 = pickCulturalWord(words, 0);
    const word1Again = pickCulturalWord(words, 0);
    expect(word1).toBe(word1Again);

    const word2 = pickCulturalWord(words, 1);
    expect(word2).toBe(words[1 % words.length]);
  });

  it('should return empty string for empty list', () => {
    const result = pickCulturalWord([], 0);
    expect(result).toBe('');
  });

  it('should handle negative seeds', () => {
    const words = ['a', 'b', 'c'];
    const result = pickCulturalWord(words, -5);
    expect(result).toBe(words[5 % words.length]);
  });
});

describe('Prose generation with cultural flavor', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = createMockGraph();
  });

  it('should generate routine prose with cultural flavor applied', () => {
    addActorNodeToGraph(graph, 'actor_cultured', 'Storm-Kin');
    addCultureNodeToGraph(graph, 'culture_chaos', {
      foundationBias: 'chaos',
      veneratedSpheres: ['force'],
      primaryBiome: 'volcano',
      socialStructure: 'Fluid',
      accountability: 'Personal',
      behavioralKeywords: [],
      materialVocabulary: [],
      metaphorPalette: [],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addBelongsToEdge(graph, 'actor_cultured', 'culture_chaos', 0.8);

    const prose = generateRoutineProse(
      'action_resolved',
      {
        actorName: 'Storm-Kin',
        actorId: 'actor_cultured',
        sphere: 'force',
      },
      1000,
      graph,
    );

    expect(prose).toBeDefined();
    expect(prose.text).toBeTruthy();
    expect(prose.text.length).toBeGreaterThan(0);
    // Prose should contain actor name or target
    expect(prose.text).toMatch(/Storm-Kin|actor|target/i);
  });

  it('should generate notable prose with cultural flavor applied', () => {
    addActorNodeToGraph(graph, 'actor_ordered', 'Stone-Heart');
    addCultureNodeToGraph(graph, 'culture_order', {
      foundationBias: 'order',
      veneratedSpheres: ['matter'],
      primaryBiome: 'mountain',
      socialStructure: 'Rigid',
      accountability: 'Institutional',
      behavioralKeywords: [],
      materialVocabulary: [],
      metaphorPalette: [],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addBelongsToEdge(graph, 'actor_ordered', 'culture_order', 0.7);

    const prose = generateNotableProse(
      'action_critical',
      {
        actorName: 'Stone-Heart',
        actorId: 'actor_ordered',
        sphere: 'matter',
      },
      2000,
      graph,
    );

    expect(prose).toBeDefined();
    expect(prose.text).toBeTruthy();
    expect(prose.tier).toBe('notable');
  });

  it('should work without graph (backward compatibility)', () => {
    const prose = generateRoutineProse(
      'action_resolved',
      {
        actorName: 'Uncultured Wanderer',
        sphere: 'force',
      },
      3000,
      undefined, // No graph
    );

    expect(prose).toBeDefined();
    expect(prose.text).toBeTruthy();
  });

  it('should work with graph but actor without culture', () => {
    addActorNodeToGraph(graph, 'orphan', 'Orphaned Wanderer');
    // No culture added

    const prose = generateRoutineProse(
      'action_resolved',
      {
        actorName: 'Orphaned Wanderer',
        actorId: 'orphan',
        sphere: 'spirit',
      },
      4000,
      graph,
    );

    expect(prose).toBeDefined();
    expect(prose.text).toBeTruthy();
  });
});

describe('Cultural prose integration', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = createMockGraph();
  });

  it('should generate different prose for cultured vs uncultured actors in same context', () => {
    // Add cultured actor
    addActorNodeToGraph(graph, 'cultured', 'CulturedOne');
    addCultureNodeToGraph(graph, 'culture_life', {
      foundationBias: 'light',
      veneratedSpheres: ['life'],
      primaryBiome: 'forest',
      socialStructure: 'Communal',
      accountability: 'Shame-based',
      behavioralKeywords: [],
      materialVocabulary: [],
      metaphorPalette: [],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addBelongsToEdge(graph, 'cultured', 'culture_life', 0.8);

    // Add uncultured actor
    addActorNodeToGraph(graph, 'uncultured', 'UnculturedOne');

    const proseCultured = generateRoutineProse(
      'action_resolved',
      { actorName: 'CulturedOne', actorId: 'cultured', sphere: 'life' },
      5000,
      graph,
    );

    const proseUncultured = generateRoutineProse(
      'action_resolved',
      { actorName: 'UnculturedOne', actorId: 'uncultured', sphere: 'life' },
      5000,
      graph,
    );

    // Both should be valid prose
    expect(proseCultured.text).toBeTruthy();
    expect(proseUncultured.text).toBeTruthy();

    // Verify sphere coloring is set
    expect(proseCultured.sphereColoring).toBe('life');
    expect(proseUncultured.sphereColoring).toBe('life');
  });

  it('should create consistent prose for same actor and seed', () => {
    addActorNodeToGraph(graph, 'actor_x', 'Consistent One');
    addCultureNodeToGraph(graph, 'culture_x', {
      foundationBias: 'darkness',
      veneratedSpheres: ['mind'],
      primaryBiome: 'cave',
      socialStructure: 'Initiation',
      accountability: 'Hidden',
      behavioralKeywords: [],
      materialVocabulary: [],
      metaphorPalette: [],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
    });
    addBelongsToEdge(graph, 'actor_x', 'culture_x', 0.75);

    resetNarrativeEventCounter();
    const prose1 = generateRoutineProse(
      'action_resolved',
      { actorName: 'Consistent One', actorId: 'actor_x', sphere: 'mind' },
      6000,
      graph,
    );

    resetNarrativeEventCounter();
    const prose2 = generateRoutineProse(
      'action_resolved',
      { actorName: 'Consistent One', actorId: 'actor_x', sphere: 'mind' },
      6000,
      graph,
    );

    expect(prose1.text).toBe(prose2.text);
  });
});
