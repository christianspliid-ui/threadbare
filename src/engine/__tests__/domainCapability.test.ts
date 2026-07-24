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

    it('includes stat_contribution effect from a possessed artifact (THR-718)', () => {
      graph.addNode({
        id: 'artifact.iron_blade', type: 'artifact', name: 'Ironbite Blade',
        properties: { effects: [{ type: 'stat_contribution', contributions: { iron: 2 } }] },
      });
      graph.addEdge({
        id: 'e.possesses.blade', source: 'actor.thorin', target: 'artifact.iron_blade',
        type: 'possesses', properties: {},
      });
      // 3 origin + 2 stat_contribution
      expect(computeRawScore(graph, 'actor.thorin', 'iron')).toBe(5);
    });

    it('reads stat_contribution across bonded_to edges too', () => {
      graph.addNode({
        id: 'artifact.star_relic', type: 'artifact_legendary', name: 'Star Relic',
        properties: { effects: [{ type: 'stat_contribution', contributions: { star: 1.5 } }] },
      });
      graph.addEdge({
        id: 'e.bonded.relic', source: 'actor.thorin', target: 'artifact.star_relic',
        type: 'bonded_to', properties: {},
      });
      // 2 origin star + 1.5 stat_contribution
      expect(computeRawScore(graph, 'actor.thorin', 'star')).toBeCloseTo(3.5, 5);
    });

    it('sums legacy domainContributions AND stat_contribution additively on one artifact', () => {
      graph.addNode({
        id: 'artifact.hybrid', type: 'artifact', name: 'Hybrid Relic',
        properties: {
          domainContributions: { iron: 1 },
          effects: [{ type: 'stat_contribution', contributions: { iron: 2 } }],
        },
      });
      graph.addEdge({
        id: 'e.possesses.hybrid', source: 'actor.thorin', target: 'artifact.hybrid',
        type: 'possesses', properties: {},
      });
      // 3 origin + 1 legacy + 2 effect = 6
      expect(computeRawScore(graph, 'actor.thorin', 'iron')).toBe(6);
    });

    it('a possessed artifact with no stat_contribution is a no-op (fail-soft)', () => {
      graph.addNode({
        id: 'artifact.torch', type: 'artifact', name: 'Torch',
        properties: { effects: [{ type: 'passive', reach: 'iron', value: 0.03 }] },
      });
      graph.addEdge({
        id: 'e.possesses.torch', source: 'actor.thorin', target: 'artifact.torch',
        type: 'possesses', properties: {},
      });
      // passive is a roll shaper, not a tier contribution — raw score unchanged
      expect(computeRawScore(graph, 'actor.thorin', 'iron')).toBe(3);
    });

    it('ignores traits that do not define domain contributions', () => {
      graph.addNode({
        id: 'trait.condition.deep_stab_wound',
        type: 'trait',
        name: 'Deep Stab Wound',
        properties: {
          subcategory: 'condition',
          description: 'A lingering wound.',
          importance: 0.5,
          maxLevel: 1,
          visibility: 'public',
          effects: [],
          tags: [],
          flavorText: 'It aches with every breath.',
        },
      });
      graph.addEdge({
        id: 'e.has_trait.deep_stab_wound',
        source: 'actor.thorin',
        target: 'trait.condition.deep_stab_wound',
        type: 'has_trait',
        properties: {
          level: 1,
          acquiredTick: 0,
          lastReinforcedTick: 0,
          source: 'test',
          visibility: 'public',
        },
      });

      expect(() => computeRawScore(graph, 'actor.thorin', 'iron')).not.toThrow();
      expect(computeRawScore(graph, 'actor.thorin', 'iron')).toBe(3);
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

    it('skips malformed traits without domain contributions', () => {
      graph.addNode({
        id: 'trait.condition.deep_stab_wound',
        type: 'trait',
        name: 'Deep Stab Wound',
        properties: {
          subcategory: 'condition',
          description: 'A lingering wound.',
          importance: 0.5,
          maxLevel: 1,
          visibility: 'public',
          effects: [],
          tags: [],
          flavorText: 'It aches with every breath.',
        },
      });
      graph.addEdge({
        id: 'e.has_trait.deep_stab_wound',
        source: 'actor.thorin',
        target: 'trait.condition.deep_stab_wound',
        type: 'has_trait',
        properties: {
          level: 1,
          acquiredTick: 0,
          lastReinforcedTick: 0,
          source: 'test',
          visibility: 'public',
        },
      });

      expect(() => getTopContributors(graph, 'actor.thorin', 'iron', 3)).not.toThrow();
      expect(getTopContributors(graph, 'actor.thorin', 'iron', 3).map((entry) => entry.sourceId)).not.toContain('trait.condition.deep_stab_wound');
    });
  });

  describe('has_trait edge with no level — fail-soft, no NaN poisoning (THR-613)', () => {
    it('a trait edge missing `level` does not make the raw score NaN', () => {
      const g = new WorldGraph();
      g.addNode({ id: 'god', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
      // A condition/clue-style trait: node has no domainContributions, edge omits level
      // (exactly how the dev-seeded ascendant's clue/condition traits are wired).
      g.addNode({
        id: 'trait.clue.whisper', type: 'trait', name: 'A Whisper',
        properties: { subcategory: 'clue', tags: [], flavorText: 'Half-remembered.' },
      });
      g.addEdge({ id: 'e1', source: 'god', target: 'trait.clue.whisper', type: 'has_trait', properties: {} });

      const raw = computeRawScore(g, 'god', 'eye');
      expect(Number.isNaN(raw)).toBe(false);
      expect(raw).toBe(0); // no contribution, but a real number

      const cap = computeCapability(g, 'god', 'eye');
      expect(Number.isFinite(cap)).toBe(true);
      const tier = computeTier(cap);
      expect(Number.isFinite(tier)).toBe(true);
      expect(getNarrativeLabel('eye', tier)).toMatch(/\w/);
    });

    it('an unleveled trait WITH domainContributions counts once (level defaults to 1)', () => {
      const g = new WorldGraph();
      g.addNode({ id: 'god', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
      g.addNode({
        id: 'trait.iron_gift', type: 'trait', name: 'Iron Gift',
        properties: { subcategory: 'innate', domainContributions: { iron: 4 }, tags: [] },
      });
      g.addEdge({ id: 'e1', source: 'god', target: 'trait.iron_gift', type: 'has_trait', properties: {} });

      // base 4 × default level 1 = 4 — not NaN, not dropped.
      expect(computeRawScore(g, 'god', 'iron')).toBe(4);
    });
  });
});
