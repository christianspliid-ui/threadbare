import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { assignTrait, reinforceTrait } from '../traits';
import {
  computeRawScore,
  computeCapability,
  computeTier,
  getNarrativeLabel,
  computeFullProfile,
  getTopContributors,
} from '../domainCapability';

describe('Domain Capability', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    // Actor
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: { actorType: 'individual' } });

    // Origin trait: Mountainborn (Iron +3, Gold +3, Stone +4, Star +2, Flesh +2, Heart +1, Eye +1)
    graph.addNode({
      id: 'trait.origin.mountainborn', type: 'trait', name: 'Mountainborn',
      properties: {
        subcategory: 'innate', maxLevel: 1, importance: 1.0, visibility: 'public',
        domainContributions: { iron: 3, gold: 3, stone: 4, star: 2, veil: 2, heart: 1, eye: 1 },
        tags: [], flavorText: 'Born of the mountain.',
      },
    });
    assignTrait(graph, 'actor.thorin', 'trait.origin.mountainborn', { tick: 0, source: 'origin' });

    // Mastery trait: Battle-Hardened (Iron +2, Gold +1 per level)
    graph.addNode({
      id: 'trait.mastery.battle_hardened', type: 'trait', name: 'Battle-Hardened',
      properties: {
        subcategory: 'mastery', maxLevel: 3, importance: 0.7, visibility: 'public',
        domainContributions: { iron: 2, gold: 1 },
        decayPeriod: 90, tags: [], flavorText: 'Forged in battle.',
      },
    });
  });

  describe('computeRawScore', () => {
    it('sums trait contributions for a domain', () => {
      // Mountainborn contributes Iron +3
      const raw = computeRawScore(graph, 'actor.thorin', 'iron');
      expect(raw).toBe(3);
    });

    it('scales mastery trait contributions by level', () => {
      assignTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', 20);
      // Mountainborn Iron 3 + Battle-Hardened level 2 Iron 4 = 7
      const raw = computeRawScore(graph, 'actor.thorin', 'iron');
      expect(raw).toBe(7);
    });

    it('includes artifact contributions', () => {
      // Common artifact
      graph.addNode({
        id: 'artifact.war_axe', type: 'artifact', name: 'Fine War-Axe',
        properties: { domainContributions: { iron: 1 } },
      });
      graph.addEdge({
        id: 'e.possesses.axe', source: 'actor.thorin', target: 'artifact.war_axe',
        type: 'possesses', properties: {},
      });
      const raw = computeRawScore(graph, 'actor.thorin', 'iron');
      expect(raw).toBe(4); // 3 origin + 1 artifact
    });
  });

  describe('computeCapability', () => {
    it('returns a value between 0 and 1', () => {
      const cap = computeCapability(graph, 'actor.thorin', 'iron');
      expect(cap).toBeGreaterThan(0);
      expect(cap).toBeLessThan(1);
    });

    it('is higher for higher raw scores', () => {
      const baseCap = computeCapability(graph, 'actor.thorin', 'iron');
      assignTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', { tick: 10, source: 'combat' });
      const boostedCap = computeCapability(graph, 'actor.thorin', 'iron');
      expect(boostedCap).toBeGreaterThan(baseCap);
    });
  });

  describe('computeTier', () => {
    it('returns a tier 1-10 from capability 0-1', () => {
      const tier = computeTier(0.55);
      expect(tier).toBeGreaterThanOrEqual(1);
      expect(tier).toBeLessThanOrEqual(10);
      expect(tier).toBe(6); // 0.55 → range 0.5–0.6 → tier 6
    });

    it('floor is tier 1', () => {
      expect(computeTier(0.0)).toBe(1);
    });

    it('ceiling is tier 10', () => {
      expect(computeTier(1.0)).toBe(10);
    });
  });

  describe('getNarrativeLabel', () => {
    it('returns domain-specific label for tier', () => {
      expect(getNarrativeLabel('iron', 5)).toBe('Steeled');
      expect(getNarrativeLabel('gold', 3)).toBe('Thrifty');
      expect(getNarrativeLabel('veil', 10)).toBe('Mythic');
    });
  });

  describe('computeFullProfile', () => {
    it('returns a profile for all 8 domains', () => {
      const profile = computeFullProfile(graph, 'actor.thorin');
      expect(Object.keys(profile)).toHaveLength(8);
      expect(profile.iron.rawScore).toBe(3);
      expect(profile.stone.rawScore).toBe(4);
    });
  });

  describe('getTopContributors', () => {
    it('returns the top N contributing factors sorted by magnitude', () => {
      assignTrait(graph, 'actor.thorin', 'trait.mastery.battle_hardened', { tick: 10, source: 'combat' });
      const top = getTopContributors(graph, 'actor.thorin', 'iron', 3);
      expect(top.length).toBeLessThanOrEqual(3);
      expect(top[0].contribution).toBeGreaterThanOrEqual(top[1]?.contribution ?? 0);
    });
  });
});
