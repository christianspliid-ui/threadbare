/**
 * THR-1625 — condition loss-guards guard something.
 *
 * `prevent_loss` with `channel: 'condition'` had no reader: the condition writer
 * checked `tag_immunity` and nothing else, so Sap-Blessed's `#wound` guard and The
 * Silent Testament's untagged guard ran no check at all. These tests bind to the
 * **real** catalog nodes (looked up by id), and every refusal has a control arm, so a
 * writer that refused everything could not pass as a guard that works.
 */
import { describe, it, expect } from 'vitest';

import { WorldGraph } from '../../graph';
import { applyConditionToActor } from '../conditionApplier';
import { REWARD_CONDITIONS, REWARD_POSSESSIONS } from '../../../data/reward-attachment-catalog';
import { ANOMALY_BESTOWED_POWERS } from '../../../data/anomaly-reward-catalog';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';

const WOUNDED = 'trait.condition.wounded';
const TERRIFIED = 'trait.condition.terrified';
const BLESSED = 'trait.condition.blessed';
const SAP_BLESSED = 'anomaly_sap_blessed';
const SILENT_TESTAMENT = 'reward_tomes_scrolls_the_silent_testament';

const CATALOG: ReadonlyMap<string, GraphNode> = new Map(
  [...REWARD_POSSESSIONS, ...REWARD_CONDITIONS, ...ANOMALY_BESTOWED_POWERS, ...CONDITION_TRAIT_DEFINITIONS]
    .map(n => [n.id, n]),
);

function catalogNode(id: string): GraphNode {
  const node = CATALOG.get(id);
  if (!node) throw new Error(`catalog node ${id} not found — the fixture no longer binds to shipped content`);
  return node;
}

function baseState(): GameState {
  const graph = new WorldGraph();
  for (const id of ['hero', 'other']) {
    graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
  }
  for (const id of [WOUNDED, TERRIFIED, BLESSED]) graph.addNode(catalogNode(id));
  return { tick: 5, seed: 42, phase: 'playing', graph, effectStates: new Map() } as unknown as GameState;
}

function give(state: GameState, bearer: string, attachment: GraphNode, edgeType: 'possesses' | 'has_trait'): void {
  if (!state.graph.getNode(attachment.id)) state.graph.addNode(attachment);
  state.graph.addEdge({ id: `e_${bearer}_${attachment.id}`, source: bearer, target: attachment.id, type: edgeType, properties: {} });
}

function inflict(state: GameState, conditionId: string, target = 'hero') {
  return applyConditionToActor(state, target, conditionId, { tick: state.tick });
}

function conditionsOn(state: GameState, id = 'hero'): string[] {
  return state.graph.getOutgoingEdges(id, 'has_trait').map(e => e.target);
}

describe('Sap-Blessed wards Wounded (THR-1625)', () => {
  it('a Sap-Blessed bearer does not take Wounded, and keeps the power', () => {
    const state = baseState();
    give(state, 'hero', catalogNode(SAP_BLESSED), 'has_trait');
    const result = inflict(state, WOUNDED);
    expect(result).toMatchObject({
      applied: false, reason: 'prevent_loss', guardAttachmentId: SAP_BLESSED, guardConsumed: false,
    });
    expect(conditionsOn(state)).not.toContain(WOUNDED);
    expect(conditionsOn(state)).toContain(SAP_BLESSED);
    // Non-consuming: it keeps guarding.
    expect(inflict(state, WOUNDED).applied).toBe(false);
  });

  it('control: an unguarded bearer takes Wounded', () => {
    const state = baseState();
    expect(inflict(state, WOUNDED).applied).toBe(true);
    expect(conditionsOn(state)).toContain(WOUNDED);
  });

  it('a #wound guard does not stop a condition without #wound (Terrified)', () => {
    const state = baseState();
    give(state, 'hero', catalogNode(SAP_BLESSED), 'has_trait');
    expect(inflict(state, TERRIFIED).applied).toBe(true);
  });
});

describe('untagged guards (THR-1625)', () => {
  it('The Silent Testament guards every harmful condition', () => {
    const state = baseState();
    give(state, 'hero', catalogNode(SILENT_TESTAMENT), 'possesses');
    expect(inflict(state, WOUNDED)).toMatchObject({ applied: false, reason: 'prevent_loss' });
    expect(inflict(state, TERRIFIED)).toMatchObject({ applied: false, reason: 'prevent_loss' });
  });

  it('a guard never stops a blessing — only #negative conditions are guarded', () => {
    const state = baseState();
    give(state, 'hero', catalogNode(SILENT_TESTAMENT), 'possesses');
    expect(inflict(state, BLESSED).applied).toBe(true);
    expect(conditionsOn(state)).toContain(BLESSED);
  });
});

describe('consuming guards are spent after one block (THR-1625)', () => {
  const charm: GraphNode = {
    id: 'test_ward_charm', type: 'artifact', name: 'Ward Charm',
    properties: { effects: [{ type: 'prevent_loss', channel: 'condition', tags: ['#wound'], consumeOnPrevent: true }] },
  } as unknown as GraphNode;

  it('an artifact guard blocks once, is removed, and the next wound lands', () => {
    const state = baseState();
    give(state, 'hero', charm, 'possesses');
    expect(inflict(state, WOUNDED)).toMatchObject({ applied: false, reason: 'prevent_loss', guardConsumed: true });
    expect(state.graph.getNode(charm.id)).toBeUndefined();
    expect(inflict(state, WOUNDED).applied).toBe(true);
  });

  it('a spent trait guard leaves the shared definition and other bearers untouched', () => {
    const blessing: GraphNode = { ...charm, id: 'test_ward_blessing', type: 'trait', name: 'Ward Blessing' } as GraphNode;
    const state = baseState();
    give(state, 'hero', blessing, 'has_trait');
    give(state, 'other', blessing, 'has_trait');
    expect(inflict(state, WOUNDED)).toMatchObject({ applied: false, guardConsumed: true });
    expect(state.graph.getNode(blessing.id)).toBeDefined();
    expect(conditionsOn(state, 'hero')).not.toContain(blessing.id);
    expect(inflict(state, WOUNDED).applied).toBe(true);
    // The other bearer still holds — and is still guarded by — the blessing.
    expect(inflict(state, WOUNDED, 'other')).toMatchObject({ applied: false, reason: 'prevent_loss' });
  });
});
