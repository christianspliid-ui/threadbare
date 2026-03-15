import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  detectCulturalMismatch,
  detectConquestTension,
  detectDualCultureTension,
  detectCulturalFanaticism,
  computeCulturalTensionScore,
  CULTURAL_TENSION_SCORES,
  type CulturalTension,
} from '../culturalTension';
import type { CultureIdentity } from '../../types/culture';
import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';

describe('culturalTension', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    // Two cultures
    graph.addNode({ id: 'culture_0', type: 'actor', name: 'Desert Warriors', properties: { actorType: 'culture' } });
    graph.addNode({ id: 'culture_1', type: 'actor', name: 'Forest Scholars', properties: { actorType: 'culture' } });
    // A location with culture_0 as current
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Oasis Town', properties: { terrain: 'desert' } });
    graph.addEdge({ id: 'e_loc_c0', source: 'loc_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 1.0, cultureLayer: 'current' } });
  });

  describe('detectCulturalMismatch', () => {
    it('returns mismatch when actor culture differs from location culture', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Scholar', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const result = detectCulturalMismatch(graph, 'actor_1');
      expect(result).toBeDefined();
      expect(result!.type).toBe('mismatch');
      expect(result!.cultureIds).toContain('culture_1');
    });

    it('returns undefined when actor shares location culture', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Local', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      expect(detectCulturalMismatch(graph, 'actor_1')).toBeUndefined();
    });
  });

  describe('detectConquestTension', () => {
    it('returns conquest when historical culture differs from current', () => {
      graph.addEdge({ id: 'e_loc_hist', source: 'loc_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.5, cultureLayer: 'historical' } });

      const result = detectConquestTension(graph, 'loc_1');
      expect(result).toBeDefined();
      expect(result!.type).toBe('conquest');
    });

    it('returns undefined when historical matches current', () => {
      graph.addEdge({ id: 'e_loc_hist', source: 'loc_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5, cultureLayer: 'historical' } });

      expect(detectConquestTension(graph, 'loc_1')).toBeUndefined();
    });
  });

  describe('detectDualCultureTension', () => {
    it('returns dual tension for balanced dual-culture actors', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Hybrid', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5 } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.4 } });

      const result = detectDualCultureTension(graph, 'actor_1');
      expect(result).toBeDefined();
      expect(result!.type).toBe('dual');
      expect(result!.cultureIds.length).toBe(2);
    });

    it('returns undefined for single-culture actors', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Mono', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.8 } });

      expect(detectDualCultureTension(graph, 'actor_1')).toBeUndefined();
    });
  });

  describe('detectCulturalFanaticism', () => {
    it('returns fanaticism for strength >= 0.8 encountering different culture', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Zealot', properties: { actorType: 'individual' } });
      graph.addNode({ id: 'actor_2', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.85 } });
      graph.addEdge({ id: 'e_a2_c1', source: 'actor_2', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

      const result = detectCulturalFanaticism(graph, 'actor_1', 'actor_2');
      expect(result).toBeDefined();
      expect(result!.type).toBe('fanaticism');
    });

    it('returns undefined when neither actor is fanatical', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Normal', properties: { actorType: 'individual' } });
      graph.addNode({ id: 'actor_2', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5 } });
      graph.addEdge({ id: 'e_a2_c1', source: 'actor_2', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.5 } });

      expect(detectCulturalFanaticism(graph, 'actor_1', 'actor_2')).toBeUndefined();
    });
  });

  describe('computeCulturalTensionScore', () => {
    it('returns combined score from all tension types', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Hybrid Zealot', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.5 } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.45 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const { score, tensions } = computeCulturalTensionScore(graph, 'actor_1');
      expect(score).toBeGreaterThan(0);
      expect(tensions.length).toBeGreaterThan(0);
    });

    it('returns 0 for cultureless actors', () => {
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Wanderer', properties: { actorType: 'individual' } });
      const { score, tensions } = computeCulturalTensionScore(graph, 'actor_1');
      expect(score).toBe(0);
      expect(tensions.length).toBe(0);
    });
  });

  describe('gravity modulation', () => {
    function makeReachPrefs(primary: ReachDomain, value = 0.8): Record<ReachDomain, number> {
      const prefs = Object.fromEntries(REACH_DOMAINS.map(d => [d, 0])) as Record<ReachDomain, number>;
      prefs[primary] = value;
      return prefs;
    }

    function makeIdentity(overrides: Partial<CultureIdentity>): CultureIdentity {
      return {
        foundationBias: 'Order',
        veneratedSpheres: ['life'],
        primaryBiome: 'grassland',
        socialStructure: 'tribal',
        accountability: 'communal',
        behavioralKeywords: [],
        materialVocabulary: [],
        metaphorPalette: [],
        formativeTraitSeedIds: [],
        behavioralTraitSeedIds: [],
        reachPreferences: makeReachPrefs('iron'),
        ...overrides,
      };
    }

    it('increases mismatch severity when cultures have opposing spheres (negative gravity)', () => {
      // Culture 0: life sphere, Order foundation, iron reach
      const identity0 = makeIdentity({
        veneratedSpheres: ['life'],
        foundationBias: 'Order',
        reachPreferences: makeReachPrefs('iron'),
      });
      // Culture 1: entropy sphere (opposes life), Chaos foundation (opposes Order), shadow reach (orthogonal)
      const identity1 = makeIdentity({
        veneratedSpheres: ['entropy'],
        foundationBias: 'Chaos',
        reachPreferences: makeReachPrefs('shadow'),
      });

      graph.getNode('culture_0')!.properties = { actorType: 'culture', identity: identity0 };
      graph.getNode('culture_1')!.properties = { actorType: 'culture', identity: identity1 };

      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Outsider', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const { tensions } = computeCulturalTensionScore(graph, 'actor_1');
      const mismatch = tensions.find(t => t.type === 'mismatch');
      expect(mismatch).toBeDefined();
      // Opposing cultures → negative gravity → severity should be higher than base
      expect(mismatch!.severity).toBeGreaterThan(CULTURAL_TENSION_SCORES.mismatch);
    });

    it('decreases mismatch severity when cultures have aligned spheres (positive gravity)', () => {
      // Both cultures share life sphere, Order foundation, similar reaches
      const identity0 = makeIdentity({
        veneratedSpheres: ['life', 'mind'],
        foundationBias: 'Order',
        reachPreferences: makeReachPrefs('iron'),
      });
      const identity1 = makeIdentity({
        veneratedSpheres: ['life', 'mind'],
        foundationBias: 'Order',
        reachPreferences: makeReachPrefs('iron'),
      });

      graph.getNode('culture_0')!.properties = { actorType: 'culture', identity: identity0 };
      graph.getNode('culture_1')!.properties = { actorType: 'culture', identity: identity1 };

      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Outsider', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const { tensions } = computeCulturalTensionScore(graph, 'actor_1');
      const mismatch = tensions.find(t => t.type === 'mismatch');
      expect(mismatch).toBeDefined();
      // Aligned cultures → positive gravity → severity should be lower than base
      expect(mismatch!.severity).toBeLessThan(CULTURAL_TENSION_SCORES.mismatch);
    });

    it('conquest severity is higher with opposing cultures', () => {
      const identity0 = makeIdentity({
        veneratedSpheres: ['life'],
        foundationBias: 'Order',
        reachPreferences: makeReachPrefs('iron'),
      });
      const identity1 = makeIdentity({
        veneratedSpheres: ['entropy'],
        foundationBias: 'Chaos',
        reachPreferences: makeReachPrefs('shadow'),
      });

      graph.getNode('culture_0')!.properties = { actorType: 'culture', identity: identity0 };
      graph.getNode('culture_1')!.properties = { actorType: 'culture', identity: identity1 };

      // Add historical culture layer that differs from current
      graph.addEdge({ id: 'e_loc_hist', source: 'loc_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.5, cultureLayer: 'historical' } });

      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Local', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const { tensions } = computeCulturalTensionScore(graph, 'actor_1');
      const conquest = tensions.find(t => t.type === 'conquest');
      expect(conquest).toBeDefined();
      expect(conquest!.severity).toBeGreaterThan(CULTURAL_TENSION_SCORES.conquest);
    });

    it('falls back to base severity when culture identity is missing', () => {
      // No identity on culture nodes (default setup from beforeEach)
      graph.addNode({ id: 'actor_1', type: 'actor', name: 'Outsider', properties: { actorType: 'individual' } });
      graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.7 } });
      graph.addEdge({ id: 'e_a1_loc', source: 'actor_1', target: 'loc_1', type: 'located_at', properties: {} });

      const { tensions } = computeCulturalTensionScore(graph, 'actor_1');
      const mismatch = tensions.find(t => t.type === 'mismatch');
      expect(mismatch).toBeDefined();
      expect(mismatch!.severity).toBe(CULTURAL_TENSION_SCORES.mismatch);
    });
  });
});
