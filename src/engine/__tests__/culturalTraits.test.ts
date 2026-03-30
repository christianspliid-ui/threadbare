import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  instantiateFormativeTraits,
  instantiateBehavioralTraits,
  grantFormativeTraits,
  grantBehavioralTraits,
  getEffectiveCulturalContributions,
} from '../culturalTraits';
import type { CultureIdentity } from '../../types/culture';

const TEST_IDENTITY: CultureIdentity = {
  foundationBias: 'chaos',
  veneratedSpheres: ['force'],
  primaryBiome: 'grassland',
  socialStructure: 'Fluid hierarchy',
  accountability: 'Personal honor',
  behavioralKeywords: ['storm-born'],
  materialVocabulary: ['horsehair'],
  metaphorPalette: ['the sea of grass'],
  formativeTraitSeedIds: ['weapon_mastery', 'battle_tactics'],
  behavioralTraitSeedIds: ['challenge_compulsion', 'glory_seeking'],
};

describe('culturalTraits', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  describe('instantiateFormativeTraits', () => {
    it('creates trait definition nodes from seed IDs', () => {
      const ids = instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      expect(ids.length).toBe(2);
      for (const id of ids) {
        const node = graph.getNode(id);
        expect(node).toBeDefined();
        expect(node!.type).toBe('trait');
        const props = node!.properties as any;
        expect(props.subcategory).toBe('innate');
      }
    });

    it('is idempotent — does not duplicate nodes', () => {
      instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      const nodes = graph.getNodesByType('trait');
      const formative = nodes.filter(n => (n.properties as any).subcategory === 'innate'
        && (n.properties as any).culturalOrigin === true);
      expect(formative.length).toBe(2);
    });
  });

  describe('instantiateBehavioralTraits', () => {
    it('creates trait definition nodes with cultural category', () => {
      const ids = instantiateBehavioralTraits(graph, TEST_IDENTITY.behavioralTraitSeedIds);
      expect(ids.length).toBe(2);
      for (const id of ids) {
        const node = graph.getNode(id);
        expect(node).toBeDefined();
        const props = node!.properties as any;
        expect(props.subcategory).toBe('cultural');
        expect(props.strengthThresholds).toBeDefined();
      }
    });
  });

  describe('grantFormativeTraits', () => {
    it('assigns formative traits to an actor via has_trait edges', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      const traitIds = instantiateFormativeTraits(graph, TEST_IDENTITY.formativeTraitSeedIds);
      grantFormativeTraits(graph, 'actor_1', traitIds, 0);
      const edges = graph.getOutgoingEdges('actor_1', 'has_trait');
      expect(edges.length).toBe(2);
      expect(edges.every(e => (e.properties as any).source === 'cultural_formative')).toBe(true);
    });
  });

  describe('grantBehavioralTraits', () => {
    it('assigns behavioral traits to an actor', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      const traitIds = instantiateBehavioralTraits(graph, TEST_IDENTITY.behavioralTraitSeedIds);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const edges = graph.getOutgoingEdges('actor_1', 'has_trait');
      expect(edges.length).toBe(2);
      expect(edges.every(e => (e.properties as any).source === 'cultural_behavioral')).toBe(true);
    });
  });

  describe('getEffectiveCulturalContributions', () => {
    it('scales behavioral trait contributions by cultural strength', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      graph.addNode({ id: 'culture_0', type: 'actor', name: 'Test Culture', properties: { actorType: 'culture' } });
      graph.addEdge({
        id: 'e_belongs', source: 'actor_1', target: 'culture_0',
        type: 'belongs_to', properties: { culturalStrength: 0.5 },
      });
      const traitIds = instantiateBehavioralTraits(graph, ['challenge_compulsion']);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const contributions = getEffectiveCulturalContributions(graph, 'actor_1');
      // challenge_compulsion has iron: 1 — at strength 0.5, effective = 0.5
      expect(contributions.iron).toBeCloseTo(0.5, 1);
    });

    it('returns full contributions at strength 1.0', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      graph.addNode({ id: 'culture_0', type: 'actor', name: 'Test Culture', properties: { actorType: 'culture' } });
      graph.addEdge({
        id: 'e_belongs', source: 'actor_1', target: 'culture_0',
        type: 'belongs_to', properties: { culturalStrength: 1.0 },
      });
      const traitIds = instantiateBehavioralTraits(graph, ['challenge_compulsion']);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const contributions = getEffectiveCulturalContributions(graph, 'actor_1');
      expect(contributions.iron).toBeCloseTo(1.0, 1);
    });

    it('returns zero contributions below silent threshold', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Test', properties: {} });
      graph.addNode({ id: 'culture_0', type: 'actor', name: 'Test Culture', properties: { actorType: 'culture' } });
      graph.addEdge({
        id: 'e_belongs', source: 'actor_1', target: 'culture_0',
        type: 'belongs_to', properties: { culturalStrength: 0.1 },
      });
      const traitIds = instantiateBehavioralTraits(graph, ['challenge_compulsion']);
      grantBehavioralTraits(graph, 'actor_1', traitIds, 0);
      const contributions = getEffectiveCulturalContributions(graph, 'actor_1');
      // Below 0.3 = silent = zero
      expect(contributions.iron ?? 0).toBe(0);
    });
  });
});
