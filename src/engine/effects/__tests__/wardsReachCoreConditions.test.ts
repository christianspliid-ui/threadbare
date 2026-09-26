/**
 * THR-1569 — the shipped wards and cures reach the three central conditions.
 *
 * Wards (`tag_immunity`) and cures (`condition_remove` by tag) find a condition by its
 * family tag, and Terrified, Wounded and Cursed did not carry theirs: every fear ward
 * blocked nothing on a mortal, every wound cure left the Wounded that fights give, and a
 * curse ward let Cursed through. The trace showed the check running each time.
 *
 * Every fixture here is a **real** catalog node, looked up by id, so a condition that
 * drops its family tag — or a ward retargeted away from it — fails these tests rather
 * than being papered over by a fixture that invents both sides of the assertion.
 * Each arm also runs a control with no ward, so a writer that refused everything could
 * not pass as a ward that works.
 */
import { describe, it, expect } from 'vitest';

import { WorldGraph } from '../../graph';
import { applyConditionToActor } from '../conditionApplier';
import { applyActionTriggerPayloads } from '../actionTriggerPayloads';
import { REWARD_CONDITIONS, REWARD_POSSESSIONS } from '../../../data/reward-attachment-catalog';
import { ANOMALY_BESTOWED_POWERS, ANOMALY_CONDITIONS, ANOMALY_SIGNATURE_ARTIFACTS } from '../../../data/anomaly-reward-catalog';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import type { AttachmentEffect } from '../../../types/effects';
import type { ActionTriggerPayloadIntent } from '../actionTrigger';

const TERRIFIED = 'trait.condition.terrified';
const WOUNDED = 'trait.condition.wounded';
const CURSED = 'trait.condition.cursed';

const CATALOG: ReadonlyMap<string, GraphNode> = new Map(
  [
    ...REWARD_POSSESSIONS,
    ...REWARD_CONDITIONS,
    ...ANOMALY_SIGNATURE_ARTIFACTS,
    ...ANOMALY_BESTOWED_POWERS,
    ...ANOMALY_CONDITIONS,
    ...CONDITION_TRAIT_DEFINITIONS,
  ].map(n => [n.id, n]),
);

function catalogNode(id: string): GraphNode {
  const node = CATALOG.get(id);
  if (!node) throw new Error(`catalog node ${id} not found — the fixture no longer binds to shipped content`);
  return node;
}

/** A person, the three central conditions, and optionally one ward on its real attachment edge. */
function stateWithBearer(wardId?: string, edgeType: 'possesses' | 'has_trait' = 'possesses'): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  for (const id of [TERRIFIED, WOUNDED, CURSED]) graph.addNode(catalogNode(id));
  if (wardId) {
    graph.addNode(catalogNode(wardId));
    graph.addEdge({ id: `e_hero_${wardId}`, source: 'hero', target: wardId, type: edgeType, properties: {} });
  }
  return { tick: 5, seed: 42, phase: 'playing', graph, effectStates: new Map() } as unknown as GameState;
}

function inflict(state: GameState, conditionId: string) {
  return applyConditionToActor(state, 'hero', conditionId, { tick: state.tick });
}

describe('fear wards block Terrified (THR-1569)', () => {
  it.each([
    ['reward_arms_the_quiet_blade', 'possesses'],
    ['reward_mounts_beasts_glimmermoth', 'possesses'],
    ['reward_condition_the_red_divide', 'has_trait'],
  ] as const)('%s blocks Terrified by #fear', (wardId, edge) => {
    const result = inflict(stateWithBearer(wardId, edge), TERRIFIED);
    expect(result).toMatchObject({ applied: false, reason: 'tag_immunity', immuneTag: '#fear' });
  });

  it('control: an unwarded bearer takes Terrified', () => {
    expect(inflict(stateWithBearer(), TERRIFIED).applied).toBe(true);
  });
});

describe('curse wards block Cursed (THR-1569)', () => {
  it('reward_vestments_the_woven_sky blocks Cursed by #curse', () => {
    const result = inflict(stateWithBearer('reward_vestments_the_woven_sky'), CURSED);
    expect(result).toMatchObject({ applied: false, reason: 'tag_immunity', immuneTag: '#curse' });
  });

  it('control: an unwarded bearer takes Cursed, and the curse ward does not block Wounded', () => {
    expect(inflict(stateWithBearer(), CURSED).applied).toBe(true);
    expect(inflict(stateWithBearer('reward_vestments_the_woven_sky'), WOUNDED).applied).toBe(true);
  });
});

describe('wound cures lift Wounded (THR-1569)', () => {
  /** The real `condition_remove` payload the cure ships, not a hand-built one. */
  function cureIntent(cureId: string): ActionTriggerPayloadIntent {
    const effects = (catalogNode(cureId).properties as { effects?: AttachmentEffect[] }).effects ?? [];
    const trigger = effects.find(
      (e): e is Extract<AttachmentEffect, { type: 'action_trigger' }> =>
        e.type === 'action_trigger' && e.payload.kind === 'condition_remove',
    );
    if (!trigger) throw new Error(`${cureId} ships no condition_remove trigger`);
    return { attachmentId: cureId, attachmentName: catalogNode(cureId).name, payload: trigger.payload } as ActionTriggerPayloadIntent;
  }

  it.each(['anomaly_amber_phial', 'anomaly_herb_bundle'])('%s removes Wounded', (cureId) => {
    const state = stateWithBearer();
    expect(inflict(state, WOUNDED).applied).toBe(true);
    const result = applyActionTriggerPayloads(state, 'hero', [cureIntent(cureId)], state.tick);
    expect(result.conditionsRemoved).toBe(1);
    expect(state.graph.getOutgoingEdges('hero', 'has_trait').map(e => e.target)).not.toContain(WOUNDED);
  });

  it('control: a wound cure leaves Terrified in place', () => {
    const state = stateWithBearer();
    inflict(state, TERRIFIED);
    const result = applyActionTriggerPayloads(state, 'hero', [cureIntent('anomaly_amber_phial')], state.tick);
    expect(result.conditionsRemoved).toBe(0);
    expect(state.graph.getOutgoingEdges('hero', 'has_trait').map(e => e.target)).toContain(TERRIFIED);
  });

  it('the Sap-Blessed wound ward now names a tag Wounded carries', () => {
    // Content half only: the `condition` channel of `prevent_loss` has no reader yet
    // (only `quintessence` is consumed), so this pins the tag match the reader will need.
    const effects = (catalogNode('anomaly_sap_blessed').properties as { effects?: AttachmentEffect[] }).effects ?? [];
    const ward = effects.find(e => e.type === 'prevent_loss' && e.channel === 'condition');
    const woundedTags = (catalogNode(WOUNDED).properties as { tags?: string[] }).tags ?? [];
    expect(ward && 'tags' in ward ? ward.tags : []).toEqual(expect.arrayContaining(['#wound']));
    expect(woundedTags).toContain('#wound');
  });
});
