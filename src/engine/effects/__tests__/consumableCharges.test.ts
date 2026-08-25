/**
 * Consumable charges — the decrement that did not exist (THR-1239).
 *
 * The guard these tests exist for: before this ticket `chargesRemaining` was
 * initialised and never lowered, so `destroyOnEmpty` was unreachable and every
 * charged item in the reward catalogs was unlimited in play. A regression here
 * is silent — the item keeps working, it just never runs out — so each test
 * asserts the *number*, not merely that the call succeeded.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { spendConsumableCharges } from '../consumableCharges';
import { WorldGraph } from '../../graph';
import { CONSUMABLE_CHARGE_SPEND_PER_STEP } from '../../../data/effect-constants';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';

let edgeCounter = 0;
function eid() { return `e.charge.${++edgeCounter}`; }

function makeWorld(effects: AttachmentEffect[], itemId = 'item1'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'a1', type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
  graph.addNode({ id: itemId, type: 'artifact', name: 'Charged Thing', properties: { effects } });
  graph.addEdge({ id: eid(), type: 'possesses', source: 'a1', target: itemId, properties: {} });
  return graph;
}

const charge = (over: Partial<Extract<AttachmentEffect, { type: 'consumable_charge' }>> = {}) =>
  ({
    type: 'consumable_charge',
    charges: 3,
    onUse: { reach: 'iron', value: 0.05 },
    destroyOnEmpty: true,
    ...over,
  }) as AttachmentEffect;

beforeEach(() => { edgeCounter = 0; });

describe('spendConsumableCharges — matching reach', () => {
  it('decrements by exactly CONSUMABLE_CHARGE_SPEND_PER_STEP on a matching step', () => {
    const graph = makeWorld([charge()]);
    const states = new Map<string, EffectRuntimeState>([['item1', { chargesRemaining: 3 }]]);

    const result = spendConsumableCharges(graph, 'a1', 'iron', states, 1);

    expect(result.spent).toBe(1);
    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(3 - CONSUMABLE_CHARGE_SPEND_PER_STEP);
  });

  it('does not spend on a step of a different reach', () => {
    const graph = makeWorld([charge({ onUse: { reach: 'iron', value: 0.05 } })]);
    const states = new Map<string, EffectRuntimeState>([['item1', { chargesRemaining: 3 }]]);

    const result = spendConsumableCharges(graph, 'a1', 'heart', states, 1);

    expect(result.spent).toBe(0);
    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(3);
  });

  it('reads through an unset chargesRemaining to the declared charge count', () => {
    // A step can resolve before the attachment's first effect tick, which is
    // where chargesRemaining is otherwise initialised. Treating undefined as 0
    // would make a brand-new item inert on its very first use.
    const graph = makeWorld([charge({ charges: 2 })]);

    const result = spendConsumableCharges(graph, 'a1', 'iron', new Map(), 1);

    expect(result.spent).toBe(1);
    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(1);
  });

  it('skips a suppressed attachment — a suppressed item is not being used', () => {
    const graph = makeWorld([charge()]);
    const states = new Map<string, EffectRuntimeState>([
      ['item1', { chargesRemaining: 3, suppressed: true }],
    ]);

    const result = spendConsumableCharges(graph, 'a1', 'iron', states, 1);

    expect(result.spent).toBe(0);
    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(3);
  });
});

describe('spendConsumableCharges — emptying', () => {
  it('destroys the attachment when the last charge is spent and destroyOnEmpty is set', () => {
    const graph = makeWorld([charge({ charges: 1, destroyOnEmpty: true })]);
    const states = new Map<string, EffectRuntimeState>([['item1', { chargesRemaining: 1 }]]);

    const result = spendConsumableCharges(graph, 'a1', 'iron', states, 1);

    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(0);
    expect(result.destroyedAttachments).toEqual(['item1']);
    expect(graph.getNode('item1')).toBeUndefined();
    // The possesses edge goes with it — a dangling edge would keep the walker
    // finding an attachment that no longer exists.
    expect(graph.getOutgoingEdges('a1', 'possesses')).toHaveLength(0);
  });

  it('keeps an emptied attachment when destroyOnEmpty is false', () => {
    const graph = makeWorld([charge({ charges: 1, destroyOnEmpty: false })]);
    const states = new Map<string, EffectRuntimeState>([['item1', { chargesRemaining: 1 }]]);

    const result = spendConsumableCharges(graph, 'a1', 'iron', states, 1);

    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(0);
    expect(result.destroyedAttachments).toEqual([]);
    expect(graph.getNode('item1')).toBeDefined();
  });

  it('clamps at 0 and never spends again once empty', () => {
    const graph = makeWorld([charge({ charges: 3, destroyOnEmpty: false })]);
    let states: ReadonlyMap<string, EffectRuntimeState> = new Map([['item1', { chargesRemaining: 1 }]]);

    // Three matching steps against a one-charge item: one spend, then nothing.
    const spends: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = spendConsumableCharges(graph, 'a1', 'iron', states, i + 1);
      spends.push(r.spent);
      states = r.updatedStates;
    }

    expect(spends).toEqual([1, 0, 0]);
    expect(states.get('item1')?.chargesRemaining).toBe(0);
  });
});

describe('spendConsumableCharges — fail-soft (NFP #4)', () => {
  it('returns unchanged states for a missing bearer rather than throwing', () => {
    const graph = new WorldGraph();
    const states = new Map<string, EffectRuntimeState>([['item1', { chargesRemaining: 3 }]]);

    const result = spendConsumableCharges(graph, 'ghost', 'iron', states, 1);

    expect(result.spent).toBe(0);
    expect(result.updatedStates.get('item1')?.chargesRemaining).toBe(3);
  });

  it('does not mutate the map it was handed (copy-then-assign)', () => {
    const graph = makeWorld([charge()]);
    const states = new Map<string, EffectRuntimeState>([['item1', { chargesRemaining: 3 }]]);

    spendConsumableCharges(graph, 'a1', 'iron', states, 1);

    expect(states.get('item1')?.chargesRemaining).toBe(3);
  });
});
