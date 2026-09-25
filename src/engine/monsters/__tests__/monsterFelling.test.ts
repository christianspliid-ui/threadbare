/**
 * THR-1546 — Monsters M3: what felling it does (plan doc
 * `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 5).
 *
 * Covers the slice's Done-when: overcome at major clears the lair (credited to the
 * victor's faction, structural cache bumped); at legendary progress rises by half the
 * resistance and the faction remains; a warded monster survives with no credit;
 * `not_a_mortal` credits nothing (two `overcome` dispatches credit the lair once);
 * driven off adds 1; `fightState.lairOutcome` matches what was written.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import {
  DEFAULT_FIGHT_END_BRANCHES,
  FIGHT_END_BRANCHES,
  finalizeFightEnd,
  onFightEnded,
  resetFightEndBranches,
  type FightEndContext,
} from '../../fights/fightOutcome';
import { monsterLairBranch } from '../monsterFelling';
import { LAIR_CLEARING_RESISTANCE } from '../../lairClearing';
import {
  MONSTER_DRIVEN_OFF_CLEARING_PROGRESS,
  MONSTER_FELLED_CLEARING_PRESSURE,
} from '../../../data/monster-families';
import type { GameState } from '../../../types/gameState';
import type { ActionStep, UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { FightResult, FightState } from '../../../types/fight';
import type { LairTier } from '../../../types/monster';
import type { RuleOverrideContext } from '../../effects/ruleOverrideConsumers';

const TICK = 120;
const midRng = () => 0.5;

function baseState(graph: WorldGraph, activeRuleOverrides?: GameState['activeRuleOverrides']): GameState {
  return {
    tick: TICK, seed: 42, graph, unifiedActions: [], tickEvents: [], recentEvents: [],
    effectStates: new Map(),
    ...(activeRuleOverrides ? { activeRuleOverrides } : {}),
  } as unknown as GameState;
}

/** A hero (member of `faction.wardens`), and a lair at `tier` held by `beast`. */
function lairWorld(tier: LairTier = 'major', opts: { heroFaction?: boolean; progress?: number } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'lair-1', type: 'location', name: 'The Maw',
    properties: {
      hexCol: 3, hexRow: 3, locationSubtype: 'lair', locationType: 'lair',
      lairTier: tier, monsterFactionId: 'monster.gnawers', namedEliteId: 'beast',
      ...(opts.progress !== undefined ? { clearingProgress: opts.progress } : {}),
    },
  });
  graph.addNode({ id: 'faction.wardens', type: 'actor', name: 'Wardens', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'lair-1', type: 'located_at', properties: {} });
  if (opts.heroFaction !== false) {
    graph.addEdge({ id: 'e.hero.member', source: 'hero', target: 'faction.wardens', type: 'member_of', properties: {} });
  }
  graph.addNode({
    id: 'beast', type: 'actor', name: 'The Gnawer',
    properties: {
      actorType: 'individual', isMonsterElite: true, lairId: 'lair-1',
      monsterState: { family: 'beast', dread: 'steep', might: 'steep', clockSize: 4, clockFilled: 4, clockUpdatedTick: TICK, temperShown: false },
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'lair-1', type: 'located_at', properties: {} });
  return graph;
}

function fightAction(result: FightResult, opponentId = 'beast'): UnifiedAction {
  const fightState = {
    opponentId, clockSize: 4, clockAtStart: 0, clockNow: 4, persistent: true,
    exchanges: 2, harmTaken: 0, wounds: 0, blowsLanded: 2, momentum: 0,
    temperFired: false, berserk: false, advantages: [], forks: [],
    conditionsApplied: [], storiedClimbs: [], result,
  } as FightState;
  return {
    actionId: 'ua-1', templateId: 'fight.lair.confront', actorId: 'hero', targetId: opponentId,
    currentStep: 2, stepProgress: 0, stepResults: [], startedAtTick: TICK - 3,
    resolved: true, fightState,
  } as unknown as UnifiedAction;
}

function ctxFor(state: GameState, runtime?: SimulationRuntime): FightEndContext {
  const overrideCtx: RuleOverrideContext = {
    graph: state.graph, effectStates: state.effectStates, persisted: state, tick: TICK,
  };
  return { tick: TICK, rng: midRng, runtime, overrideCtx };
}

function traces(category: string) {
  return getTraces().filter((t) => t.category === category) as unknown as Array<Record<string, unknown>>;
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); resetFightEndBranches(); });

describe('THR-1546 — the monster branch is registered', () => {
  it('ships in the dispatcher\'s default branches', () => {
    expect(DEFAULT_FIGHT_END_BRANCHES).toContain(monsterLairBranch);
    expect(FIGHT_END_BRANCHES).toContain(monsterLairBranch);
  });
});

describe('THR-1546 — overcome at major clears the lair', () => {
  it('fells the monster (retained, deceased, slainBy), clears the lair to the victor\'s faction, and bumps structuralCacheVersion', () => {
    const state = baseState(lairWorld('major'));
    const runtime = createSimulationRuntime();
    const before = runtime.structuralCacheVersion;

    const out = onFightEnded(state, fightAction('overcome'), ctxFor(state, runtime));

    const beast = state.graph.getNode('beast')!;
    expect(beast.properties).toMatchObject({ deceased: true, slainBy: 'hero', deathCause: 'fight' });
    const lair = state.graph.getNode('lair-1')!.properties;
    expect(lair).toMatchObject({ locationSubtype: 'cleared_lair', clearedAtTick: TICK, clearedByFactionId: 'faction.wardens' });
    expect(lair.namedEliteId).toBeUndefined();
    expect(lair.monsterFactionId).toBeUndefined();
    expect(runtime.structuralCacheVersion).toBe(before + 1);

    expect(out.fightState.lairOutcome).toEqual({ lairId: 'lair-1', felled: true, lairCleared: true, clearingProgressAfter: 0 });
    expect(traces('monster.felled')).toEqual([expect.objectContaining({
      monsterId: 'beast', lairId: 'lair-1', byActorId: 'hero', lairTier: 'major',
      funnel: 'died', lairCleared: true,
    })]);
  });

  it('an unaffiliated victor clears it with no faction credit', () => {
    const state = baseState(lairWorld('major', { heroFaction: false }));
    onFightEnded(state, fightAction('overcome'), ctxFor(state));
    const lair = state.graph.getNode('lair-1')!.properties;
    expect(lair.locationSubtype).toBe('cleared_lair');
    expect(lair.clearedByFactionId).toBeUndefined();
  });

  it('lands on the resolved action through finalizeFightEnd (the real call site)', () => {
    const state = baseState(lairWorld('major'));
    const step = (fightRole: 'nerve' | 'clash') => ({ reach: 'iron', fightRole } as unknown as ActionStep);
    const template = { id: 'fight.lair.confront', steps: [step('nerve'), step('clash')] } as Pick<UnifiedActionTemplate, 'id' | 'steps'>;
    const { action } = finalizeFightEnd(state, fightAction('overcome'), template, ctxFor(state), true);
    expect(action.fightState?.lairOutcome).toMatchObject({ lairId: 'lair-1', felled: true, lairCleared: true });
  });
});

describe('THR-1546 — overcome at legendary presses the lair, the faction remains', () => {
  it('progress rises by half the legendary resistance; the monster faction stays; namedEliteId is cleared', () => {
    const state = baseState(lairWorld('legendary', { progress: 2 }));
    const runtime = createSimulationRuntime();
    const before = runtime.structuralCacheVersion;

    const out = onFightEnded(state, fightAction('overcome'), ctxFor(state, runtime));

    const expected = 2 + MONSTER_FELLED_CLEARING_PRESSURE * LAIR_CLEARING_RESISTANCE.legendary;
    expect(expected).toBe(9);
    const lair = state.graph.getNode('lair-1')!.properties;
    expect(lair).toMatchObject({ locationSubtype: 'lair', lairTier: 'legendary', monsterFactionId: 'monster.gnawers', clearingProgress: expected });
    expect(lair.namedEliteId).toBeUndefined();
    expect(runtime.structuralCacheVersion).toBe(before);
    expect(state.graph.getNode('beast')!.properties.deceased).toBe(true);
    expect(out.fightState.lairOutcome).toEqual({ lairId: 'lair-1', felled: true, lairCleared: false, clearingProgressAfter: expected });
  });
});

describe('THR-1546 — no double or false credit', () => {
  it('a warded monster survives: no clearing credit, felled:false, traced funnel warded', () => {
    const state = baseState(lairWorld('major'), {
      beast: [{ rule: 'death_prevented', value: true } as never],
    });
    const out = onFightEnded(state, fightAction('overcome'), ctxFor(state));

    expect(state.graph.getNode('beast')!.properties.deceased).toBeUndefined();
    const lair = state.graph.getNode('lair-1')!.properties;
    expect(lair).toMatchObject({ locationSubtype: 'lair', namedEliteId: 'beast' });
    expect(lair.clearingProgress).toBeUndefined();
    expect(out.fightState.lairOutcome).toEqual({ lairId: 'lair-1', felled: false, lairCleared: false });
    expect(traces('monster.felled')).toEqual([expect.objectContaining({ funnel: 'warded', lairCleared: false })]);
  });

  it('two overcome dispatches against one monster credit the lair once; the second reads not_a_mortal', () => {
    const state = baseState(lairWorld('major'));
    const runtime = createSimulationRuntime();
    const before = runtime.structuralCacheVersion;

    onFightEnded(state, fightAction('overcome'), ctxFor(state, runtime));
    const clearedAt = state.graph.getNode('lair-1')!.properties.clearedAtTick;
    const second = onFightEnded(state, fightAction('overcome'), ctxFor(state, runtime));

    expect(runtime.structuralCacheVersion).toBe(before + 1);
    expect(state.graph.getNode('lair-1')!.properties.clearedAtTick).toBe(clearedAt);
    expect(second.fightState.lairOutcome).toEqual({ lairId: 'lair-1', felled: false, lairCleared: false });
    const felled = traces('monster.felled');
    expect(felled.map((t) => t.funnel)).toEqual(['died', 'not_a_mortal']);
    expect(felled.map((t) => t.lairCleared)).toEqual([true, false]);
  });

  it('at legendary, a second overcome adds no second pressure', () => {
    const state = baseState(lairWorld('legendary'));
    onFightEnded(state, fightAction('overcome'), ctxFor(state));
    onFightEnded(state, fightAction('overcome'), ctxFor(state));
    expect(state.graph.getNode('lair-1')!.properties.clearingProgress)
      .toBe(MONSTER_FELLED_CLEARING_PRESSURE * LAIR_CLEARING_RESISTANCE.legendary);
  });

  it('a lair already held by a different elite takes no credit from this monster\'s death', () => {
    const graph = lairWorld('major');
    graph.updateNode('lair-1', { properties: { namedEliteId: 'elite_other' } });
    const state = baseState(graph);
    const out = onFightEnded(state, fightAction('overcome'), ctxFor(state));
    expect(state.graph.getNode('beast')!.properties.deceased).toBe(true);
    expect(state.graph.getNode('lair-1')!.properties.locationSubtype).toBe('lair');
    expect(out.fightState.lairOutcome).toMatchObject({ felled: true, lairCleared: false });
    expect(traces('monster.felled')).toEqual([expect.objectContaining({ lairTier: 'none' })]);
  });
});

describe('THR-1546 — driven off, and what is not a monster fight', () => {
  it('driven off adds MONSTER_DRIVEN_OFF_CLEARING_PROGRESS; the monster lives and keeps the lair', () => {
    const state = baseState(lairWorld('major', { progress: 3 }));
    const out = onFightEnded(state, fightAction('driven_off'), ctxFor(state));
    const lair = state.graph.getNode('lair-1')!.properties;
    expect(MONSTER_DRIVEN_OFF_CLEARING_PROGRESS).toBe(1);
    expect(lair).toMatchObject({ locationSubtype: 'lair', namedEliteId: 'beast', clearingProgress: 4 });
    expect(state.graph.getNode('beast')!.properties.deceased).toBeUndefined();
    expect(out.fightState.lairOutcome).toEqual({ lairId: 'lair-1', felled: false, lairCleared: false, clearingProgressAfter: 4 });
    expect(traces('monster.driven_off')).toEqual([expect.objectContaining({ monsterId: 'beast', clearingProgressAfter: 4 })]);
  });

  it.each<FightResult>(['bargained', 'broke_off', 'yielded', 'routed', 'struck_down'])(
    '%s writes nothing to the lair and records no lairOutcome',
    (result) => {
      const state = baseState(lairWorld('major'));
      const out = onFightEnded(state, fightAction(result), ctxFor(state));
      expect(out.fightState.lairOutcome).toBeUndefined();
      expect(state.graph.getNode('lair-1')!.properties.clearingProgress).toBeUndefined();
      expect(state.graph.getNode('beast')!.properties.deceased).toBeUndefined();
    },
  );

  it('an overcome against a mortal (not a monster) is left to the other branches', () => {
    const graph = lairWorld('major');
    graph.addNode({ id: 'rival', type: 'actor', name: 'Rival', properties: { actorType: 'individual' } });
    const state = baseState(graph);
    const out = onFightEnded(state, fightAction('overcome', 'rival'), ctxFor(state));
    expect(out.fightState.lairOutcome).toBeUndefined();
    expect(state.graph.getNode('rival')!.properties.deceased).toBeUndefined();
    expect(traces('monster.felled')).toHaveLength(0);
  });
});
