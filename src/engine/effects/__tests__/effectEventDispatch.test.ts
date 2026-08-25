/**
 * Effect event raising — the producers that did not exist (THR-1239).
 *
 * `getReactiveTrigger` has mapped `entered_hex` / `combat_started` to reactive
 * triggers since the primitive architecture landed, and `processEffectEvent`
 * has always known how to dispatch them. What was missing was any *producer*:
 * outside the single `encounter_outcome` raise in the orchestrator, no site in
 * the engine ever constructed an `EffectEvent`. The whole executor family was
 * therefore unreachable in normal play, while looking perfectly wired.
 *
 * These tests assert the end-to-end path a raise is supposed to complete:
 * event → reactive match → `executeEffect` → traces. Asserting only the return
 * count would pass against a dispatcher that never reached the executor, which
 * is the exact failure this ticket exists to end.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { raiseEffectEvent } from '../effectEventDispatch';
import { processEffectEvent } from '../effectEvents';
import { WorldGraph } from '../../graph';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';

let edgeCounter = 0;
function eid() { return `e.dispatch.${++edgeCounter}`; }

/**
 * A stand-in for the fields `raiseEffectEvent` actually reads: `graph`, `tick`,
 * `effectStates`. Every one of those is a real `GameState` member — nothing is
 * invented here, so the cast narrows the fixture rather than inventing a shape
 * the engine does not have.
 */
function makeState(graph: WorldGraph, tick = 5): GameState {
  return {
    graph,
    tick,
    seed: 42,
    effectStates: new Map<string, EffectRuntimeState>(),
  } as unknown as GameState;
}

function addBearerWithEffects(graph: WorldGraph, agentId: string, effects: AttachmentEffect[]) {
  graph.addNode({ id: agentId, type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'charm', type: 'artifact', name: 'Warding Charm', properties: { effects } });
  graph.addEdge({ id: eid(), type: 'possesses', source: agentId, target: 'charm', properties: {} });
}

/** A reactive whose nested effect has a real executor, so the executor's own trace proves it ran. */
const reactiveSpawnOnArrival: AttachmentEffect = {
  type: 'reactive',
  trigger: 'entered_hex',
  cooldown: 0,
  effect: { type: 'spawn', what: 'encounter', template: 'test.omen', onHex: 'self' },
} as AttachmentEffect;

beforeEach(() => {
  edgeCounter = 0;
  enableTracing();
  clearTraces();
});
afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('raiseEffectEvent — entered_hex', () => {
  it('fires a matching reactive and runs its nested effect through executeEffect', () => {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'a1', [reactiveSpawnOnArrival]);
    const state = makeState(graph);

    const { reactivesFired } = raiseEffectEvent(
      state,
      'a1',
      { type: 'entered_hex', hex: { col: 3, row: 4 } },
      { site: 'movement_arrival', rng: () => 0.5 },
    );

    expect(reactivesFired).toBe(1);

    // The executor's own trace — this is the half that proves the nested effect
    // reached executeEffect, not merely that processEffectEvent matched it.
    const executorTraces = getTraces().filter(
      (t) => (t as unknown as { effectType?: string }).effectType === 'spawn',
    );
    expect(executorTraces).toHaveLength(1);
  });

  it('emits an effect.event_raised trace naming the event, site and reactive count', () => {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'a1', [reactiveSpawnOnArrival]);
    const state = makeState(graph, 12);

    raiseEffectEvent(
      state,
      'a1',
      { type: 'entered_hex', hex: { col: 1, row: 1 } },
      { site: 'movement_arrival', rng: () => 0.5 },
    );

    const raised = getTraces().filter((t) => t.category === 'effect.event_raised');
    expect(raised).toHaveLength(1);
    expect(raised[0]).toMatchObject({
      event: 'entered_hex',
      agentId: 'a1',
      site: 'movement_arrival',
      reactivesFired: 1,
      tick: 12,
    });
  });

  it('still traces the raise when nothing was listening', () => {
    // The distinction the trace exists for: "the producer is live and no
    // attachment cared" must be readable apart from "the producer was never
    // wired". Without this, a dead raise site is invisible.
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Bare', properties: { actorType: 'individual' } });
    const state = makeState(graph);

    const { reactivesFired } = raiseEffectEvent(
      state,
      'a1',
      { type: 'entered_hex', hex: { col: 0, row: 0 } },
      { site: 'movement_arrival', rng: () => 0.5 },
    );

    expect(reactivesFired).toBe(0);
    const raised = getTraces().filter((t) => t.category === 'effect.event_raised');
    expect(raised).toHaveLength(1);
    expect(raised[0]).toMatchObject({ reactivesFired: 0 });
  });

  it('does not fire a reactive keyed on a different trigger', () => {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'a1', [
      { ...reactiveSpawnOnArrival, trigger: 'damaged' } as AttachmentEffect,
    ]);
    const state = makeState(graph);

    const { reactivesFired } = raiseEffectEvent(
      state,
      'a1',
      { type: 'entered_hex', hex: { col: 0, row: 0 } },
      { site: 'movement_arrival', rng: () => 0.5 },
    );

    expect(reactivesFired).toBe(0);
  });
});

describe('raiseEffectEvent — combat events', () => {
  it('fires a reactive keyed on encounter_started when combat_started is raised', () => {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'cmd', [
      { ...reactiveSpawnOnArrival, trigger: 'encounter_started' } as AttachmentEffect,
    ]);
    const state = makeState(graph);

    const { reactivesFired } = raiseEffectEvent(
      state,
      'cmd',
      { type: 'combat_started' },
      { site: 'battle_created', rng: () => 0.5 },
    );

    expect(reactivesFired).toBe(1);
  });

  it('expires an until_event attachment on combat_ended (leave_combat)', () => {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'cmd', [
      { type: 'until_event', event: 'leave_combat', reach: 'iron', value: 0.1, destroyOnEvent: true } as AttachmentEffect,
    ]);
    const state = makeState(graph);

    raiseEffectEvent(state, 'cmd', { type: 'combat_ended' }, { site: 'battle_resolved', rng: () => 0.5 });

    expect(graph.getNode('charm')).toBeUndefined();
  });
});

describe('raiseEffectEvent — fail-soft (NFP #4)', () => {
  it('is silent for a missing agent — no trace spam, no throw', () => {
    const graph = new WorldGraph();
    const state = makeState(graph);

    const { reactivesFired } = raiseEffectEvent(
      state,
      'ghost',
      { type: 'combat_ended' },
      { site: 'battle_resolved', rng: () => 0.5 },
    );

    expect(reactivesFired).toBe(0);
    expect(getTraces().filter((t) => t.category === 'effect.event_raised')).toHaveLength(0);
  });
});

describe('processEffectEvent — resource_manipulate one_shot', () => {
  const oneShot = (target: 'self' | 'other_agent', amount: number): AttachmentEffect =>
    ({ type: 'resource_manipulate', resource: 'essence', target, amount, mode: 'one_shot' }) as AttachmentEffect;

  function worldWithOneShot(target: 'self' | 'other_agent', amount = -0.2) {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'a1', [oneShot(target, amount)]);
    graph.updateNode('a1', { properties: { actorType: 'individual', essence: 1 } });
    graph.addNode({ id: 'a2', type: 'actor', name: 'Other', properties: { actorType: 'individual', essence: 1 } });
    return graph;
  }

  it('fires once on the first encounter_outcome and never again', () => {
    const graph = worldWithOneShot('self');
    let states: ReadonlyMap<string, EffectRuntimeState> = new Map();

    const first = processEffectEvent(
      graph, 'a1', { type: 'encounter_outcome', reach: 'iron', success: true }, states, 1,
    );
    states = first.updatedStates;
    expect(graph.getNode('a1')?.properties.essence).toBeCloseTo(0.8, 6);
    expect(states.get('charm')?.oneShotFired).toBe(true);

    const second = processEffectEvent(
      graph, 'a1', { type: 'encounter_outcome', reach: 'iron', success: true }, states, 2,
    );
    // Spent means spent — the second outcome must not drain again.
    expect(graph.getNode('a1')?.properties.essence).toBeCloseTo(0.8, 6);
    expect(second.updatedStates.get('charm')?.oneShotFired).toBe(true);
  });

  it('drains the counterpart when target is other_agent', () => {
    const graph = worldWithOneShot('other_agent');

    processEffectEvent(
      graph, 'a1', { type: 'encounter_outcome', reach: 'iron', success: true }, new Map(), 1, Math.random, 'a2',
    );

    expect(graph.getNode('a2')?.properties.essence).toBeCloseTo(0.8, 6);
    expect(graph.getNode('a1')?.properties.essence).toBe(1);
  });

  it('spends the shot even when other_agent has no counterpart, rather than retrying forever', () => {
    const graph = worldWithOneShot('other_agent');

    const result = processEffectEvent(
      graph, 'a1', { type: 'encounter_outcome', reach: 'iron', success: true }, new Map(), 1,
    );

    expect(result.updatedStates.get('charm')?.oneShotFired).toBe(true);
    expect(graph.getNode('a1')?.properties.essence).toBe(1);
  });

  it('does not fire on a non-encounter event', () => {
    const graph = worldWithOneShot('self');

    const result = processEffectEvent(graph, 'a1', { type: 'combat_started' }, new Map(), 1);

    expect(result.updatedStates.get('charm')?.oneShotFired).toBeUndefined();
    expect(graph.getNode('a1')?.properties.essence).toBe(1);
  });

  it('leaves per_tick mode alone — that path belongs to effectTick', () => {
    const graph = new WorldGraph();
    addBearerWithEffects(graph, 'a1', [
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: -0.2, mode: 'per_tick' } as AttachmentEffect,
    ]);
    graph.updateNode('a1', { properties: { actorType: 'individual', essence: 1 } });

    const result = processEffectEvent(
      graph, 'a1', { type: 'encounter_outcome', reach: 'iron', success: true }, new Map(), 1,
    );

    expect(graph.getNode('a1')?.properties.essence).toBe(1);
    expect(result.updatedStates.get('charm')?.oneShotFired).toBeUndefined();
  });
});
