import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  assignTrait,
  removeTrait,
  getTraitsForNode,
  reinforceTrait,
  processTraitDecay,
  getEffectiveDomainContributions,
} from '../traits';
import type { TraitDefinitionProperties, TraitAssignmentProperties } from '../../types/traits';

function makeTraitNode(id: string, overrides: Partial<TraitDefinitionProperties> = {}) {
  return {
    id,
    type: 'trait' as const,
    name: id,
    properties: {
      subcategory: 'mastery',
      description: 'test trait',
      importance: 0.5,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { iron: 2, flesh: 1 },
      decayPeriod: 90,
      tags: [],
      flavorText: 'test',
      ...overrides,
    } satisfies TraitDefinitionProperties,
  };
}

describe('Trait System', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({ id: 'actor.thorin', type: 'actor', name: 'Thorin', properties: { actorType: 'individual' } });
    graph.addNode(makeTraitNode('trait.battle_hardened'));
    graph.addNode(makeTraitNode('trait.lorekeeper', {
      subcategory: 'mastery',
      domainContributions: { eye: 2, veil: 1 },
      decayPeriod: 120,
    }));
    graph.addNode(makeTraitNode('trait.dragon_slayer', {
      subcategory: 'scar',
      maxLevel: 1,
      domainContributions: { iron: 2, star: 1 },
    }));
  });

  describe('assignTrait', () => {
    it('creates a has_trait edge with correct properties', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(1);
      expect(traits[0].target).toBe('trait.battle_hardened');
      const props = traits[0].properties as TraitAssignmentProperties;
      expect(props.level).toBe(1);
      expect(props.acquiredTick).toBe(10);
    });

    it('does not create duplicate trait assignment', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 20, source: 'combat' });
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(1);
    });
  });

  describe('reinforceTrait', () => {
    it('increases level up to maxLevel', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 50);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect((traits[0].properties as TraitAssignmentProperties).level).toBe(2);
    });

    it('does not exceed maxLevel', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 50);
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 60);
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 70); // should not exceed 3
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect((traits[0].properties as TraitAssignmentProperties).level).toBe(3);
    });
  });

  describe('processTraitDecay', () => {
    it('decays mastery traits that have not been reinforced', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 10); // level 2
      // Decay at tick 110 (100 ticks later, decayPeriod = 90)
      processTraitDecay(graph, 'actor.thorin', 110);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect((traits[0].properties as TraitAssignmentProperties).level).toBe(1);
    });

    it('removes trait when level decays to 0', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      processTraitDecay(graph, 'actor.thorin', 110);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(0);
    });

    it('does not decay scar traits', () => {
      assignTrait(graph, 'actor.thorin', 'trait.dragon_slayer', { tick: 10, source: 'event' });
      processTraitDecay(graph, 'actor.thorin', 500);
      const traits = getTraitsForNode(graph, 'actor.thorin');
      expect(traits).toHaveLength(1);
    });
  });

  describe('getEffectiveDomainContributions', () => {
    it('scales contributions by trait level', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      reinforceTrait(graph, 'actor.thorin', 'trait.battle_hardened', 20); // level 2
      const contributions = getEffectiveDomainContributions(graph, 'actor.thorin');
      expect(contributions.iron).toBe(4); // 2 per level × 2
      expect(contributions.flesh).toBe(2); // 1 per level × 2
    });

    it('stacks contributions from multiple traits', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      assignTrait(graph, 'actor.thorin', 'trait.dragon_slayer', { tick: 15, source: 'event' });
      const contributions = getEffectiveDomainContributions(graph, 'actor.thorin');
      expect(contributions.iron).toBe(4); // 2 + 2
      expect(contributions.flesh).toBe(1); // 1 + 0
      expect(contributions.star).toBe(1); // 0 + 1
    });
  });

  describe('removeTrait', () => {
    it('removes the has_trait edge', () => {
      assignTrait(graph, 'actor.thorin', 'trait.battle_hardened', { tick: 10, source: 'combat' });
      removeTrait(graph, 'actor.thorin', 'trait.battle_hardened');
      expect(getTraitsForNode(graph, 'actor.thorin')).toHaveLength(0);
    });
  });
});
