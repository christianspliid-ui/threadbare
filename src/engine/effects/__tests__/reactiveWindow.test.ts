/**
 * Reaction windows — a reaction's timed modifier actually lands (THR-1568).
 *
 * Before THR-1568 a fired reaction handed its nested modifier to
 * `executeEffect`, which no-ops every modifier shape, and the resolver read 0
 * for `reactive` — so "when struck, Iron +0.03 for six ticks" was a promise
 * with no state behind it. These tests read the *resolver's* output, the value
 * an encounter roll actually sees, not the event's return count: a count
 * would pass against the old no-op path, which fired and applied nothing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { raiseEffectEvent } from '../effectEventDispatch';
import { processEffectEvent, type EffectEvent } from '../effectEvents';
import { reactiveWindowTicks, isReactiveWindowEffect } from '../reactiveWindow';
import { resolveEffectModifiers, buildPredicateContext } from '../../effectResolver';
import { tickEffects } from '../../effectTick';
import { WorldGraph } from '../../graph';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../../../data/reward-attachment-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../../../data/starter-attachments';
import {
  REACTIVE_UNTIMED_WINDOW_COOLDOWN_FRACTION,
  REACTIVE_WINDOW_MIN_TICKS,
} from '../../../data/effect-constants';
import type { GameState } from '../../../types/gameState';
import type { GraphNode } from '../../../types/graph';
import type {
  AttachmentEffect,
  EffectRuntimeState,
  ReactiveEffect,
  ReactiveTrigger,
} from '../../../types/effects';
import type { ReachDomain } from '../../../types/traits';

let edgeCounter = 0;
function eid() { return `e.window.${++edgeCounter}`; }

function makeState(graph: WorldGraph, tick = 10): GameState {
  return {
    graph,
    tick,
    seed: 42,
    effectStates: new Map<string, EffectRuntimeState>(),
  } as unknown as GameState;
}

function addBearer(graph: WorldGraph, agentId: string, attachmentId: string, effects: AttachmentEffect[]) {
  if (!graph.getNode(agentId)) {
    graph.addNode({ id: agentId, type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
  }
  graph.addNode({ id: attachmentId, type: 'artifact', name: 'Test Item', properties: { effects } });
  graph.addEdge({ id: eid(), type: 'possesses', source: agentId, target: attachmentId, properties: {} });
}

function modifier(graph: WorldGraph, agentId: string, reach: ReachDomain, states: ReadonlyMap<string, EffectRuntimeState>): number {
  const ctx = buildPredicateContext(graph, agentId, reach);
  return resolveEffectModifiers(graph, agentId, reach, ctx, states).reachModifiers[reach] ?? 0;
}

/** Advance the per-tick countdown `n` times, the way phaseEffectTick does. */
function advance(graph: WorldGraph, agentId: string, states: Map<string, EffectRuntimeState>, fromTick: number, n: number) {
  let s = states;
  for (let i = 1; i <= n; i++) s = tickEffects(graph, agentId, fromTick + i, s).updatedStates;
  return s;
}

const thornBurst: AttachmentEffect = {
  type: 'reactive',
  trigger: 'attacked',
  cooldown: 12,
  effect: { type: 'duration', ticks: 6, reach: 'iron', value: 0.03, destroyOnExpiry: true },
};

beforeEach(() => {
  edgeCounter = 0;
  enableTracing();
  clearTraces();
});
afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('reaction window — nested duration', () => {
  it('opens on `attacked`, holds +0.03 Iron for six ticks, then returns to 0', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'stave', [thornBurst]);
    const state = makeState(graph, 10);

    expect(modifier(graph, 'a1', 'iron', state.effectStates!)).toBe(0);

    raiseEffectEvent(state, 'a1', { type: 'attacked' }, { site: 'fight_clash', rng: () => 0.5 });
    let states = state.effectStates as Map<string, EffectRuntimeState>;
    expect(modifier(graph, 'a1', 'iron', states)).toBeCloseTo(0.03);

    // Five countdown ticks later the burst still holds…
    states = advance(graph, 'a1', states, 10, 5);
    expect(modifier(graph, 'a1', 'iron', states)).toBeCloseTo(0.03);
    // …and the sixth closes it.
    states = advance(graph, 'a1', states, 15, 1);
    expect(modifier(graph, 'a1', 'iron', states)).toBe(0);

    // destroyOnExpiry belongs to a standalone buff — the item itself survives.
    expect(graph.getNode('stave')).toBeDefined();
    const r = tickEffects(graph, 'a1', 17, states);
    expect(r.destroyedAttachments).not.toContain('stave');
  });

  it('respects the cooldown: a second raise inside it opens no new window', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'stave', [thornBurst]);
    const state = makeState(graph, 10);

    raiseEffectEvent(state, 'a1', { type: 'attacked' }, { site: 'fight_clash', rng: () => 0.5 });
    let states = advance(graph, 'a1', state.effectStates as Map<string, EffectRuntimeState>, 10, 6);
    expect(modifier(graph, 'a1', 'iron', states)).toBe(0);

    // Tick 16 is inside the 12-tick cooldown opened at tick 10.
    const second = processEffectEvent(graph, 'a1', { type: 'attacked' }, states, 16, () => 0.5);
    expect(second.reactivesFired).toHaveLength(0);
    states = second.updatedStates;
    expect(modifier(graph, 'a1', 'iron', states)).toBe(0);

    // At tick 22 the cooldown has run out and the reaction fires again.
    const third = processEffectEvent(graph, 'a1', { type: 'attacked' }, states, 22, () => 0.5);
    expect(third.reactivesFired).toHaveLength(1);
    expect(modifier(graph, 'a1', 'iron', third.updatedStates)).toBeCloseTo(0.03);
  });

  it('does not route the nested modifier to executeEffect', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'stave', [thornBurst]);
    const state = makeState(graph, 10);

    const { reactivesFired } = raiseEffectEvent(state, 'a1', { type: 'attacked' }, { site: 'fight_clash', rng: () => 0.5 });
    expect(reactivesFired).toBe(1);

    // modifierOnlyResult traces `effectType: 'duration'` — its absence proves the
    // executor was never called for the windowed reaction.
    const executorTraces = getTraces().filter(
      (t) => (t as unknown as { effectType?: string }).effectType === 'duration',
    );
    expect(executorTraces).toHaveLength(0);

    const direct = processEffectEvent(graph, 'a1', { type: 'attacked' }, new Map(), 40, () => 0.5);
    expect(direct.reactivesFired[0].mode).toBe('window');
    expect(direct.reactivesFired[0].windowTicks).toBe(6);
  });

  it('keeps its own countdown separate from a top-level duration on the same item', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'mixed', [
      { type: 'duration', ticks: 20, reach: 'stone', value: 0.05, destroyOnExpiry: false },
      thornBurst,
    ]);
    const state = makeState(graph, 10);
    raiseEffectEvent(state, 'a1', { type: 'attacked' }, { site: 'fight_clash', rng: () => 0.5 });
    const states = advance(graph, 'a1', state.effectStates as Map<string, EffectRuntimeState>, 10, 6);
    expect(modifier(graph, 'a1', 'iron', states)).toBe(0);
    expect(modifier(graph, 'a1', 'stone', states)).toBeCloseTo(0.05);
  });
});

describe('reaction window — other nested shapes', () => {
  it('a nested passive lasts for the cooldown × the named fraction', () => {
    const reactive: ReactiveEffect = {
      type: 'reactive', trigger: 'damaged', cooldown: 8,
      effect: { type: 'passive', reach: 'heart', value: 0.04 },
    };
    expect(reactiveWindowTicks(reactive, 8)).toBe(
      Math.max(REACTIVE_WINDOW_MIN_TICKS, Math.ceil(8 * REACTIVE_UNTIMED_WINDOW_COOLDOWN_FRACTION)),
    );
    // An authored reaction `duration` wins over the cooldown rule.
    expect(reactiveWindowTicks({ ...reactive, duration: 3 }, 8)).toBe(3);

    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'icon', [reactive]);
    const state = makeState(graph, 10);
    raiseEffectEvent(state, 'a1', { type: 'damaged', amount: 1 }, { site: 'fight_clash', rng: () => 0.5 });
    let states = state.effectStates as Map<string, EffectRuntimeState>;
    expect(modifier(graph, 'a1', 'heart', states)).toBeCloseTo(0.04);
    states = advance(graph, 'a1', states, 10, 8);
    expect(modifier(graph, 'a1', 'heart', states)).toBe(0);
  });

  it('a nested decay starts at startValue and fades toward its limit', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'fang', [{
      type: 'reactive', trigger: 'damaged', cooldown: 10,
      effect: { type: 'decay', reach: 'iron', startValue: 0.05, changePerTick: -0.01, limitValue: 0, destroyAtLimit: true },
    }]);
    const state = makeState(graph, 10);
    raiseEffectEvent(state, 'a1', { type: 'damaged', amount: 1 }, { site: 'fight_clash', rng: () => 0.5 });
    let states = state.effectStates as Map<string, EffectRuntimeState>;
    expect(modifier(graph, 'a1', 'iron', states)).toBeCloseTo(0.05);
    states = advance(graph, 'a1', states, 10, 2);
    expect(modifier(graph, 'a1', 'iron', states)).toBeCloseTo(0.03);
    states = advance(graph, 'a1', states, 12, 3);
    expect(modifier(graph, 'a1', 'iron', states)).toBe(0);
    expect(graph.getNode('fang')).toBeDefined();
  });
});

describe('reaction window — executor reactions are unchanged', () => {
  it('a reaction nesting resource_manipulate still goes to executeEffect', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'drainer', [{
      type: 'reactive', trigger: 'attacked', cooldown: 0,
      effect: { type: 'resource_manipulate', resource: 'essence', amount: -1, target: 'self', mode: 'one_shot' },
    } as AttachmentEffect]);
    const fired = processEffectEvent(graph, 'a1', { type: 'attacked' }, new Map(), 10, () => 0.5);
    expect(fired.reactivesFired).toHaveLength(1);
    expect(fired.reactivesFired[0].mode).toBe('execute');
    expect(fired.updatedStates.get('drainer')?.reactiveWindowTicksRemaining).toBeUndefined();
    // And the resolver still reads nothing from it.
    expect(modifier(graph, 'a1', 'iron', fired.updatedStates)).toBe(0);
  });

  it('a reaction nesting spawn still reaches its executor', () => {
    const graph = new WorldGraph();
    addBearer(graph, 'a1', 'charm', [{
      type: 'reactive', trigger: 'entered_hex', cooldown: 0,
      effect: { type: 'spawn', what: 'encounter', template: 'test.omen', onHex: 'self' },
    } as AttachmentEffect]);
    const state = makeState(graph);
    raiseEffectEvent(state, 'a1', { type: 'entered_hex', hex: { col: 1, row: 1 } }, { site: 'movement_arrival', rng: () => 0.5 });
    const spawnTraces = getTraces().filter(
      (t) => (t as unknown as { effectType?: string }).effectType === 'spawn',
    );
    expect(spawnTraces).toHaveLength(1);
  });
});

// ─── Census: every shipped reaction nesting a modifier ─────────────────

/** The event that raises each reactive trigger — `null` where no producer exists yet. */
const EVENT_FOR_TRIGGER: Record<ReactiveTrigger, EffectEvent | null> = {
  attacked: { type: 'attacked' },
  damaged: { type: 'damaged', amount: 1 },
  healed: { type: 'healed', amount: 1 },
  entered_hex: { type: 'entered_hex', hex: { col: 0, row: 0 } },
  encounter_started: { type: 'combat_started' },
  // No EffectEvent maps to these triggers (getReactiveTrigger). A reaction on
  // them opens its window correctly once raised; nothing raises it yet.
  blessed: null,
  cursed: null,
} as Record<ReactiveTrigger, EffectEvent | null>;

interface CensusRow { templateId: string; name: string; reactive: ReactiveEffect }

function censusRows(): CensusRow[] {
  const all: GraphNode[] = [
    ...REWARD_POSSESSIONS, ...REWARD_CONDITIONS, ...REWARD_BESTOWED_POWERS,
    ...STARTER_POSSESSIONS, ...STARTER_CONDITIONS,
  ];
  const rows: CensusRow[] = [];
  for (const node of all) {
    const effects = (node.properties.effects ?? []) as AttachmentEffect[];
    for (const e of effects) {
      if (e.type === 'reactive' && isReactiveWindowEffect(e.effect)) {
        rows.push({ templateId: node.id, name: node.name, reactive: e });
      }
    }
  }
  return rows;
}

describe('reaction window — census of shipped content', () => {
  const rows = censusRows();

  it('finds the shipped reactive-with-modifier entries (at least the fifteen THR-1568 named)', () => {
    expect(rows.length).toBeGreaterThanOrEqual(15);
  });

  it.each(rows.map((r) => [r.templateId, r] as const))(
    '%s resolves its burst through the window path',
    (_id, row) => {
      const event = EVENT_FOR_TRIGGER[row.reactive.trigger];
      const nested = row.reactive.effect as { reach: ReachDomain; type: string };
      const graph = new WorldGraph();
      addBearer(graph, 'a1', 'item', [row.reactive]);

      const fired = event
        ? processEffectEvent(graph, 'a1', event, new Map(), 100, () => 0.5)
        : null;
      if (!fired) {
        // Trigger with no producer: documented, not silently passed.
        expect(['blessed', 'cursed']).toContain(row.reactive.trigger);
        return;
      }
      expect(fired.reactivesFired).toHaveLength(1);
      expect(fired.reactivesFired[0].mode).toBe('window');
      const value = modifier(graph, 'a1', nested.reach, fired.updatedStates);
      expect(value).not.toBe(0);
    },
  );
});
