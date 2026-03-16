/**
 * Integration Test: Full Attachment Lifecycle
 *
 * End-to-end test: create agent → give possession → encounter → trigger fires
 * → condition applied → condition decays → removed.
 *
 * Also tests agreements and getByTag.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveOnUseTriggers, type TriggerContext } from '../attachmentTriggers';
import { decayConditions } from '../conditionDecay';
import { collectModifiers, getModifiedValue } from '../modifiers';
import type { OnUseTrigger } from '../../types/attachments';

describe('Attachment Lifecycle Integration', () => {
  describe('Test 1: possession → trigger → condition → decay → removed', () => {
    it('should complete full attachment lifecycle', () => {
      // 1. Create graph and actor node
      const graph = new WorldGraph();
      const agentId = 'agent.hero';
      const artifactId = 'artifact.sword';
      const conditionId = 'trait.cursed';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Hero',
        properties: { iron: 0.5 },
      });

      // 2. Create possession node with onUseTriggers
      const triggers: OnUseTrigger[] = [
        {
          triggerCondition: 'critical_failure',
          probability: 1.0,
          effect: {
            type: 'add_condition',
            targetId: conditionId,
            modifiers: { iron: -0.20 },
            ticksRemaining: 5,
          },
          narrativeTemplate: '{actor} is cursed by {item_name}.',
        },
      ];

      graph.addNode({
        id: artifactId,
        type: 'artifact',
        name: 'Cursed Sword',
        properties: {
          subcategory: 'arms',
          tier: 2,
          tags: ['iron', 'weapon'],
          mechanicalSummary: '+Iron, grants slash, cursed',
          lossCondition: 'cursed',
          onUseTriggers: triggers,
        },
      });

      // 3. Create condition trait node
      graph.addNode({
        id: conditionId,
        type: 'trait',
        name: 'Curse of Weakness',
        properties: {
          category: 'curse',
          tags: ['curse', 'iron'],
        },
      });

      // 4. Give possession to agent with possesses edge and modifiers
      const possessesEdgeId = 'edge.hero.possesses.sword';
      graph.addEdge({
        id: possessesEdgeId,
        source: agentId,
        target: artifactId,
        type: 'possesses',
        properties: {
          modifiers: { iron: 0.10 },
          grants: [],
          tags: ['iron', 'weapon'],
        },
      });

      // 5. Verify modifier engine picks up possession
      const modifiers1 = collectModifiers(graph, agentId, 'iron');
      expect(modifiers1).toHaveLength(1);
      expect(modifiers1[0]).toEqual({
        edgeId: possessesEdgeId,
        edgeType: 'possesses',
        sourceName: 'Cursed Sword',
        delta: 0.10,
      });

      // 6. Verify getModifiedValue picks up the modifier
      const modified1 = getModifiedValue(graph, agentId, 'iron', 0.5);
      expect(modified1).toBe(0.6);

      // 7. Resolve trigger with critical_failure outcome
      const triggerContext: TriggerContext = {
        actor: 'Hero',
        itemName: 'Cursed Sword',
        roll: 0.05, // roll 0.05 < probability 1.0 → fire
      };

      const firedTriggers = resolveOnUseTriggers(
        triggers,
        'critical_failure',
        triggerContext,
      );
      expect(firedTriggers).toHaveLength(1);
      expect(firedTriggers[0].effect.type).toBe('add_condition');

      // 8. Apply effect: add has_trait edge with modifiers and ticksRemaining
      const hasTraitEdgeId = 'edge.hero.has.cursed';
      const effect = firedTriggers[0].effect;
      graph.addEdge({
        id: hasTraitEdgeId,
        source: agentId,
        target: conditionId,
        type: 'has_trait',
        properties: {
          modifiers: effect.modifiers || {},
          ticksRemaining: effect.ticksRemaining ?? null,
        },
      });

      // 9. Verify condition modifiers active: collectModifiers should include -0.20
      const modifiers2 = collectModifiers(graph, agentId, 'iron');
      expect(modifiers2).toHaveLength(2); // possession + condition
      const conditionMod = modifiers2.find(m => m.edgeId === hasTraitEdgeId);
      expect(conditionMod).toEqual({
        edgeId: hasTraitEdgeId,
        edgeType: 'has_trait',
        sourceName: 'Curse of Weakness',
        delta: -0.20,
      });

      // 10. Verify combined modifier value
      const modified2 = getModifiedValue(graph, agentId, 'iron', 0.5);
      expect(modified2).toBe(0.4); // 0.5 + 0.10 - 0.20 = 0.4

      // 11. Run decayConditions 5 times (ticksRemaining = 5)
      let removedCount = 0;
      for (let tick = 1; tick <= 5; tick++) {
        const removed = decayConditions(graph, tick);
        if (removed.length > 0) {
          removedCount++;
        }
      }

      // The condition should have been removed on tick 5
      expect(removedCount).toBeGreaterThan(0);

      // 12. Condition edge should be removed
      const hasTraitEdge = graph.getEdge(hasTraitEdgeId);
      expect(hasTraitEdge).toBeUndefined();

      // 13. Iron modifiers from condition should be gone
      const modifiers3 = collectModifiers(graph, agentId, 'iron');
      expect(modifiers3).toHaveLength(1); // only possession remains
      expect(modifiers3[0].delta).toBe(0.10);

      // 14. Final value should be back to 0.6
      const modified3 = getModifiedValue(graph, agentId, 'iron', 0.5);
      expect(modified3).toBe(0.6);
    });
  });

  describe('Test 2: agreement modifiers feed into modifier engine', () => {
    it('should pick up modifiers from relates_to agreement edge', () => {
      // 1. Create two actor nodes
      const graph = new WorldGraph();
      const debtorId = 'actor.debtor';
      const merchantId = 'actor.merchant';

      graph.addNode({
        id: debtorId,
        type: 'actor',
        name: 'Debtor',
        properties: { gold: 1.0 },
      });

      graph.addNode({
        id: merchantId,
        type: 'actor',
        name: 'Merchant',
        properties: { gold: 2.0 },
      });

      // 2. Create relates_to edge from Debtor → Merchant with agreement and modifiers
      const relatesEdgeId = 'edge.debtor.relates.merchant';
      graph.addEdge({
        id: relatesEdgeId,
        source: debtorId,
        target: merchantId,
        type: 'relates_to',
        properties: {
          agreement: {
            type: 'debt',
            tier: 2,
            tags: ['debt', 'gold'],
            terms: 'Debtor owes merchant 10 gold',
            fulfillmentCondition: 'gold delivered',
            ticksRemaining: 10,
            modifiers: { gold: -0.10 },
          },
          modifiers: { gold: -0.10 },
        },
      });

      // 3. Verify collectModifiers picks up the -0.10
      const modifiers = collectModifiers(graph, debtorId, 'gold');
      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]).toEqual({
        edgeId: relatesEdgeId,
        edgeType: 'relates_to',
        sourceName: 'Merchant',
        delta: -0.10,
      });

      // Verify getModifiedValue applies it
      const modified = getModifiedValue(graph, debtorId, 'gold', 1.0);
      expect(modified).toBe(0.9);
    });
  });

  describe('Test 3: getByTag finds attachments by tag', () => {
    it('should find nodes by single tag', () => {
      const graph = new WorldGraph();

      // 1. Create sword, disease, blessing
      graph.addNode({
        id: 'artifact.sword',
        type: 'artifact',
        name: 'Iron Sword',
        properties: {
          tags: ['#iron', '#weapon'],
          tier: 1,
          subcategory: 'arms',
        },
      });

      graph.addNode({
        id: 'trait.plague',
        type: 'trait',
        name: 'Plague',
        properties: {
          tags: ['#disease', '#flesh'],
          category: 'scar',
        },
      });

      graph.addNode({
        id: 'trait.blessing_star',
        type: 'trait',
        name: 'Star Blessing',
        properties: {
          tags: ['#blessing', '#star'],
          category: 'blessing',
        },
      });

      // 2. getByTag(['#disease']) → 1 result (disease)
      const diseaseResults = graph.getByTag(['#disease']);
      expect(diseaseResults).toHaveLength(1);
      expect(diseaseResults[0].id).toBe('trait.plague');

      // 3. getByTag(['#blessing'], 'trait') → 1 result (blessing)
      const blessingResults = graph.getByTag(['#blessing'], 'trait');
      expect(blessingResults).toHaveLength(1);
      expect(blessingResults[0].id).toBe('trait.blessing_star');

      // 4. getByTag(['#iron']) → 1 result (sword)
      const ironResults = graph.getByTag(['#iron']);
      expect(ironResults).toHaveLength(1);
      expect(ironResults[0].id).toBe('artifact.sword');

      // 5. getByTag(['#iron', '#weapon']) → 1 result (all tags must match)
      const ironWeaponResults = graph.getByTag(['#iron', '#weapon']);
      expect(ironWeaponResults).toHaveLength(1);
      expect(ironWeaponResults[0].id).toBe('artifact.sword');

      // 6. getByTag(['#iron', '#weapon'], 'artifact') → 1 result
      const artifactResults = graph.getByTag(['#iron', '#weapon'], 'artifact');
      expect(artifactResults).toHaveLength(1);
      expect(artifactResults[0].id).toBe('artifact.sword');

      // 7. getByTag with non-existent tag → empty array
      const noResults = graph.getByTag(['#nonexistent']);
      expect(noResults).toHaveLength(0);

      // 8. getByTag with wrong node type filter → empty array
      const wrongTypeResults = graph.getByTag(['#disease'], 'artifact');
      expect(wrongTypeResults).toHaveLength(0);
    });

    it('should handle multiple tags correctly (all must match)', () => {
      const graph = new WorldGraph();

      graph.addNode({
        id: 'item.fire_sword',
        type: 'artifact',
        name: 'Fire Sword',
        properties: {
          tags: ['#fire', '#weapon', '#legendary'],
        },
      });

      graph.addNode({
        id: 'item.ice_staff',
        type: 'artifact',
        name: 'Ice Staff',
        properties: {
          tags: ['#ice', '#weapon', '#legendary'],
        },
      });

      // Both have #weapon and #legendary
      const weaponLegendary = graph.getByTag(['#weapon', '#legendary']);
      expect(weaponLegendary).toHaveLength(2);

      // Only fire sword has #fire and #weapon
      const fireWeapon = graph.getByTag(['#fire', '#weapon']);
      expect(fireWeapon).toHaveLength(1);
      expect(fireWeapon[0].id).toBe('item.fire_sword');

      // Neither has #fire and #ice
      const fireIce = graph.getByTag(['#fire', '#ice']);
      expect(fireIce).toHaveLength(0);
    });
  });
});
