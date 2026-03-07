import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  detectCulturalMismatch,
  detectConquestTension,
  detectDualCultureTension,
  detectCulturalFanaticism,
  computeCulturalTensionScore,
  type CulturalTension,
} from '../culturalTension';

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
});
