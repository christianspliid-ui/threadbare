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
import {
  checkAndFireActionTriggers,
  type ActionTriggerContext,
} from '../effects/actionTrigger';
import { applyActionTriggerPayloads } from '../effects/actionTriggerPayloads';
import { decayConditions } from '../conditionDecay';
import { collectModifiers, getModifiedValue } from '../modifiers';
import type { ActionTriggerEffect, EffectRuntimeState } from '../../types/effects';
import type { AttachedEffect } from '../effects/effectWalker';

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

      // 2. Create possession node with an on-use action_trigger (THR-719)
      const trigger: ActionTriggerEffect = {
        type: 'action_trigger',
        on: 'encounter_critical_failure',
        payload: { kind: 'condition_grant', conditionTraitId: conditionId, durationTicks: 5 },
        probability: 1.0,
        narrativeTemplate: '{actor} is cursed by {item_name}.',
      };

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
          effects: [trigger],
        },
      });

      // 3. Create condition trait node. Its mechanical bite lives in effects[] —
      // the shape the real catalogs use — which collectAttachmentEffects picks up
      // by walking the has_trait edge the trigger is about to create.
      graph.addNode({
        id: conditionId,
        type: 'trait',
        name: 'Curse of Weakness',
        properties: {
          category: 'curse',
          tags: ['curse', 'iron'],
          effects: [{ type: 'passive', reach: 'iron', value: -0.20 }],
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

      // 7. Fire the trigger on a critical failure through the LIVE resolver
      const attachedEffects: AttachedEffect[] = [{
        attachmentId: artifactId,
        attachmentName: 'Cursed Sword',
        effect: trigger,
        sourceEdgeType: 'possesses',
      } as AttachedEffect];

      const triggerCtx: ActionTriggerContext = {
        agentId,
        tick: 0,
        agentResources: { essence: 0, quintessence: 0, doom: 0 },
        actorName: 'Hero',
        nextRoll: () => 0.05, // 0.05 < probability 1.0 → fire
      };
      const effectStates = new Map<string, EffectRuntimeState>();

      const fired = checkAndFireActionTriggers(
        attachedEffects,
        'encounter_critical_failure',
        triggerCtx,
        effectStates,
      );
      expect(fired.firedCount).toBe(1);
      expect(fired.payloadIntents).toHaveLength(1);
      expect(fired.payloadIntents[0].payload.kind).toBe('condition_grant');
      // Prose is substituted, not left as a raw template
      expect(fired.narratives).toEqual(['Hero is cursed by Cursed Sword.']);

      // 8. Apply the payload — this is what never happened before THR-719
      const applied = applyActionTriggerPayloads(graph, agentId, fired.payloadIntents, 0);
      expect(applied.conditionsGranted).toBe(1);
      expect(applied.touchedStructure).toBe(true);

      const hasTraitEdge0 = graph.getOutgoingEdges(agentId, 'has_trait')[0];
      expect(hasTraitEdge0).toBeDefined();
      expect(hasTraitEdge0.target).toBe(conditionId);
      const hasTraitEdgeId = hasTraitEdge0.id;

      // 9. The possession's own edge modifier is untouched by the condition grant
      const modifiers2 = collectModifiers(graph, agentId, 'iron');
      expect(modifiers2).toHaveLength(1);
      expect(modifiers2[0].edgeId).toBe(possessesEdgeId);

      // 10. The granted condition must carry the decay clock the tick loop reads.
      // `ticksRemaining` — not `durationTicks` — is what decayConditions counts down.
      expect(hasTraitEdge0.properties.ticksRemaining).toBe(5);

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
