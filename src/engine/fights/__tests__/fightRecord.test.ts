/**
 * THR-1574 — Blood-soaked ground S2: a fight leaves a record on the ground (plan doc
 * `Docs/plans/2026-09-24-thr-1528-blood-soaked-ground.md` § Engine pillar › 2).
 *
 * The record arms run through the real dispatcher (`onFightEnded` with the shipped
 * branches), so what is asserted is what a fight in the world writes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import {
  DEFAULT_FIGHT_END_BRANCHES,
  FIGHT_END_BRANCHES,
  onFightEnded,
  resetFightEndBranches,
  type FightEndBranch,
  type FightEndContext,
} from '../fightOutcome';
import { fightRecordBranch, fightRecordId, fightRecordSummary, recordFightFought } from '../fightRecord';
import { FIGHT_FOUGHT_EVENT_TYPE, describeBattleRecords, latestBloodshedRecord } from '../../battleRecord';
import { LAST_FIGHT_TICK_PROPERTY, readBloodshed } from '../../phaseLocationTraits';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { FIGHT_SCARRED_TRAIT_ID } from '../../../data/fight-constants';
import {
  BLOOD_SOAKED_ENTER,
  BLOOD_SOAKED_FIGHT_WEIGHT,
  BLOOD_SOAKED_WINDOW_TICKS,
} from '../../../data/location-trait-constants';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { FightEndReason, FightResult, FightState } from '../../../types/fight';
import type { FightRecordedTrace } from '../../../types/trace';
import type { RuleOverrideContext } from '../../effects/ruleOverrideConsumers';

const TICK = 120;
const SCAR_DEF = CONDITION_TRAIT_DEFINITIONS.find(d => d.id === FIGHT_SCARRED_TRAIT_ID)!;

function baseState(graph: WorldGraph, tick = TICK): GameState {
  return {
    tick, seed: 42, graph, unifiedActions: [], tickEvents: [], recentEvents: [],
    effectStates: new Map(), archetypeDrift: [], ascendantId: 'asc',
    doomClock: { currentStage: 0, progress: 0.1, expired: false, ticks: 5, stageTransitions: [] },
    doomDefinition: { archetype: 'breach', stages: [] },
    worldSoul: { fundament: { sphereWeights: {} }, resonance: {} },
    pendingSpherePressures: [], emittedOmens: [], followedAgentIds: [], mutedAgentIds: [],
  } as unknown as GameState;
}

/** A hero standing in a Place inside a lair, the lair's beast, and a mortal rival. */
function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ ...SCAR_DEF, properties: { ...SCAR_DEF.properties } });
  graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Dunmar', properties: { hexCol: 3, hexRow: 3, locationSubtype: 'town' } });
  graph.addNode({
    id: 'lair-1', type: 'location', name: 'The Maw',
    properties: { hexCol: 3, hexRow: 3, locationSubtype: 'lair', lairTier: 'major', namedEliteId: 'beast' },
  });
  graph.addNode({
    id: 'den-1', type: 'location', name: 'The Inner Den',
    properties: { parentLocationId: 'lair-1', sublocationType: 'den' },
  });
  graph.addNode({ id: 'hero', type: 'actor', name: 'Oswen', properties: { actorType: 'individual', originLocationId: 'town-1' } });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'den-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'The Gnawer',
    properties: {
      actorType: 'individual', isMonsterElite: true, lairId: 'lair-1',
      monsterState: {
        family: 'beast', dread: 'steep', might: 'steep', clockSize: 4, clockFilled: 0,
        clockUpdatedTick: TICK, temper: 'cowardly', temperShown: false,
      },
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'lair-1', type: 'located_at', properties: {} });
  graph.addNode({ id: 'rival', type: 'actor', name: 'Hesk', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e.rival.at', source: 'rival', target: 'den-1', type: 'located_at', properties: {} });
  return graph;
}

interface ActionOpts {
  readonly result?: FightResult;
  readonly exchanges?: number;
  readonly opponentId?: string | null;
  readonly actionId?: string;
  readonly endReason?: FightEndReason;
  readonly duel?: boolean;
}

function fightAction(opts: ActionOpts = {}): UnifiedAction {
  const opponentId = opts.opponentId === undefined ? 'beast' : opts.opponentId;
  const fightState = {
    opponentId, clockSize: 4, clockAtStart: 0, clockNow: 1, persistent: opponentId === 'beast',
    exchanges: opts.exchanges ?? 2, harmTaken: 0.06, wounds: 1, blowsLanded: 1, momentum: 0,
    temperFired: false, berserk: false, advantages: [], forks: [],
    conditionsApplied: [], storiedClimbs: [], result: opts.result ?? 'driven_off',
    ...(opts.endReason ? { endReason: opts.endReason } : {}),
    ...(opts.duel ? { fightMode: 'agent', fighterClockSize: 4, fighterClockNow: 1 } : {}),
  } as FightState;
  return {
    actionId: opts.actionId ?? 'ua-1', templateId: 'fight.lair.confront', actorId: 'hero',
    targetId: opponentId ?? 'hero', currentStep: 2, stepProgress: 0, stepResults: [], stepOutcomes: [],
    startedAtTick: TICK - 3, resolved: true, fightState,
  } as unknown as UnifiedAction;
}

function ctxFor(state: GameState): FightEndContext {
  const overrideCtx: RuleOverrideContext = {
    graph: state.graph, effectStates: state.effectStates, persisted: state, tick: state.tick,
  };
  // An rng of 0.99 keeps every chance-gated D1/M3 write out of the way.
  return { tick: state.tick, rng: () => 0.99, runtime: createSimulationRuntime(), overrideCtx };
}

function fightRecords(graph: WorldGraph) {
  return graph.getNodesByType('event').filter(n => n.properties.eventType === FIGHT_FOUGHT_EVENT_TYPE);
}

function recordTraces(): FightRecordedTrace[] {
  return getTraces().filter((t): t is FightRecordedTrace => t.category === 'fight_recorded');
}

beforeEach(() => { enableTracing(); clearTraces(); resetFightEndBranches(); });
afterEach(() => { disableTracing(); resetFightEndBranches(); });

describe('fightRecordBranch — registration (THR-1574)', () => {
  it('is registered first in the shipped dispatcher list', () => {
    expect(DEFAULT_FIGHT_END_BRANCHES[0]).toBe(fightRecordBranch);
    expect(FIGHT_END_BRANCHES[0]).toBe(fightRecordBranch);
  });
});

describe('recordFightFought — a fight with an exchange writes one record', () => {
  it('writes one fight_fought record at the outer-tier Location, with its edges and stamp', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction(), ctxFor(state));

    const records = fightRecords(state.graph);
    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record.id).toBe(fightRecordId('ua-1'));
    expect(record.properties).toMatchObject({
      eventType: 'fight_fought', tick: TICK, result: 'driven_off', templateId: 'fight.lair.confront',
      locationId: 'lair-1', summary: 'Oswen fought The Gnawer here.',
    });
    // The hero stood in a Place inside the lair: remembered at the lair.
    const at = state.graph.getOutgoingEdges(record.id, 'occurred_at');
    expect(at.map(e => e.target)).toEqual(['lair-1']);
    expect(state.graph.getNode('lair-1')!.properties[LAST_FIGHT_TICK_PROPERTY]).toBe(TICK);
    expect(state.graph.getNode('den-1')!.properties[LAST_FIGHT_TICK_PROPERTY]).toBeUndefined();

    const parts = state.graph.getIncomingEdges(record.id, 'participated_in')
      .map(e => [e.source, e.properties.role, e.properties.outcome, e.properties.tick]);
    expect(parts).toEqual(expect.arrayContaining([
      ['hero', 'fighter', 'driven_off', TICK],
      ['beast', 'opponent', 'driven_off', TICK],
    ]));
    expect(parts).toHaveLength(2);

    const [t] = recordTraces();
    expect(t).toMatchObject({ eventId: record.id, locationId: 'lair-1', participants: 2 });
    expect(t.skipped).toBeUndefined();
  });

  it('a duel has two sides but writes one record, not two', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction({ opponentId: 'rival', result: 'overcome', duel: true, actionId: 'ua-duel' }), ctxFor(state));

    const records = fightRecords(state.graph);
    expect(records).toHaveLength(1);
    expect(records[0].properties.summary).toBe('Oswen and Hesk fought here.');
    expect(recordTraces().filter(t => t.eventId)).toHaveLength(1);
  });

  it('the readers see it: latestBloodshedRecord and the debug readout', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction(), ctxFor(state));
    expect(latestBloodshedRecord(state.graph, 'lair-1', TICK, BLOOD_SOAKED_WINDOW_TICKS)?.id).toBe(fightRecordId('ua-1'));
    const readout = describeBattleRecords(state.graph, 'The Maw');
    expect(readout).toHaveLength(1);
    expect(readout[0]).toMatchObject({ eventType: 'fight_fought', locationId: 'lair-1' });
  });
});

describe('recordFightFought — no exchange, no record', () => {
  it.each<[string, ActionOpts]>([
    ['no_opponent', { result: 'broke_off', endReason: 'no_opponent', exchanges: 0, opponentId: null }],
    ['opponent_gone', { result: 'broke_off', endReason: 'opponent_gone', exchanges: 0 }],
    ['a zero-clash rout', { result: 'routed', exchanges: 0 }],
  ])('%s writes no record and no stamp', (_label, opts) => {
    const state = baseState(world());
    onFightEnded(state, fightAction(opts), ctxFor(state));
    expect(fightRecords(state.graph)).toHaveLength(0);
    expect(state.graph.getNode('lair-1')!.properties[LAST_FIGHT_TICK_PROPERTY]).toBeUndefined();
    expect(recordTraces()).toEqual([expect.objectContaining({ skipped: 'no_exchanges' })]);
  });

  it('a rout after a real clash is still a fight and writes its record', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction({ result: 'routed', exchanges: 1 }), ctxFor(state));
    expect(fightRecords(state.graph)).toHaveLength(1);
  });

  it('no place: neither side stands on a Location — no record, traced no_place', () => {
    const graph = world();
    graph.removeEdge('e.hero.at');
    graph.removeEdge('e.beast.at');
    const state = baseState(graph);
    expect(recordFightFought(state, fightAction(), ctxFor(state))).toBeUndefined();
    expect(fightRecords(graph)).toHaveLength(0);
    expect(recordTraces()).toEqual([expect.objectContaining({ skipped: 'no_place' })]);
  });

  it('falls back to the opponent\'s ground when the fighter is unplaced', () => {
    const graph = world();
    graph.removeEdge('e.hero.at');
    const state = baseState(graph);
    recordFightFought(state, fightAction(), ctxFor(state));
    expect(fightRecords(graph)[0]?.properties.locationId).toBe('lair-1');
  });
});

describe('fightRecordBranch — never throws into the dispatcher', () => {
  it('a failed write is caught and traced, and the later branches still run', () => {
    const state = baseState(world());
    const addNode = state.graph.addNode.bind(state.graph);
    state.graph.addNode = ((node: Parameters<WorldGraph['addNode']>[0]) => {
      if (node.type === 'event' && node.properties?.eventType === FIGHT_FOUGHT_EVENT_TYPE) throw new Error('boom');
      return addNode(node);
    }) as WorldGraph['addNode'];

    let laterRan = false;
    const later: FightEndBranch = () => { laterRan = true; };
    expect(() => onFightEnded(state, fightAction(), ctxFor(state), [fightRecordBranch, later])).not.toThrow();
    expect(laterRan).toBe(true);
    expect(recordTraces()).toEqual([expect.objectContaining({ error: expect.stringContaining('boom') })]);
  });

  it('a fight with no fight state is a silent no-op', () => {
    const state = baseState(world());
    const bare = { ...fightAction(), fightState: undefined } as unknown as UnifiedAction;
    expect(() => fightRecordBranch(state, bare, ctxFor(state))).not.toThrow();
    expect(fightRecords(state.graph)).toHaveLength(0);
  });
});

describe('three fights soak the ground (BLOOD_SOAKED_FIGHT_WEIGHT)', () => {
  function fightsAt(count: number): { graph: WorldGraph; tick: number } {
    const graph = world();
    let tick = TICK;
    for (let i = 0; i < count; i += 1) {
      tick = TICK + i * 10;
      const state = baseState(graph, tick);
      recordFightFought(state, fightAction({ actionId: `ua-${i}` }), ctxFor(state));
    }
    return { graph, tick };
  }

  it('three fights inside the window reach the enter threshold; one does not', () => {
    expect(3 * BLOOD_SOAKED_FIGHT_WEIGHT).toBeGreaterThanOrEqual(BLOOD_SOAKED_ENTER);
    const three = fightsAt(3);
    expect(readBloodshed(three.graph, three.graph.getNode('lair-1')!, three.tick)).toBeGreaterThanOrEqual(BLOOD_SOAKED_ENTER);
    const one = fightsAt(1);
    expect(readBloodshed(one.graph, one.graph.getNode('lair-1')!, one.tick)).toBeLessThan(BLOOD_SOAKED_ENTER);
  });

  it('bloodshed falls to zero once the fights are older than the window', () => {
    const three = fightsAt(3);
    const later = three.tick + BLOOD_SOAKED_WINDOW_TICKS + 1;
    expect(readBloodshed(three.graph, three.graph.getNode('lair-1')!, later)).toBe(0);
  });
});

describe('fightRecordSummary', () => {
  it('tells a monster fight and a duel apart', () => {
    expect(fightRecordSummary('Oswen', 'The Gnawer', false)).toBe('Oswen fought The Gnawer here.');
    expect(fightRecordSummary('Oswen', 'Hesk', true)).toBe('Oswen and Hesk fought here.');
  });
});
