/**
 * THR-1548 — Fight endings D1: the defeat faces and the death gate (plan doc
 * `Docs/plans/2026-09-23-defeat-and-victory.md` §1–3).
 *
 * Every case runs through the real dispatcher (`onFightEnded` with the shipped
 * branches) against a small graph, so what is asserted is what a fight in the world
 * writes: Scarred through the condition applier, the `blood_drawn` grudge, the death
 * funnel, the reactive loop's outcome node, humiliation at home and the value drift.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import {
  DEFAULT_FIGHT_END_BRANCHES,
  finalizeFightEnd,
  onFightEnded,
  resetFightEndBranches,
  type FightEndContext,
} from '../fightOutcome';
import { fighterEndingBranch, fightDeathGuard } from '../fightEnding';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import {
  FIGHT_HUMILIATION_REPUTATION,
  FIGHT_KILL_CHANCE_BY_TEMPER,
  FIGHT_SCARRED_TRAIT_ID,
} from '../../../data/fight-constants';
import { getGrudgeCauseClause } from '../../../data/grievance-prose';
import { holdsMotive } from '../../undertakingMotive';
import { getReputationWith } from '../../reputation';
import { createUndertakingOutcomeNode } from '../../grievance/undertakingOutcomeNode';
import { castUndertakingPortent } from '../../phaseOmenAgenda';
import { mulberry32 } from '../../factionAmbitions';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { FightResult, FightState, FightTemper } from '../../../types/fight';
import type { StrategicProjectRuntime } from '../../../types/strategicAction';
import type { RuleOverrideContext } from '../../effects/ruleOverrideConsumers';

const TICK = 120;
const SCAR_DEF = CONDITION_TRAIT_DEFINITIONS.find(d => d.id === FIGHT_SCARRED_TRAIT_ID)!;

function baseState(graph: WorldGraph, extra: Partial<GameState> = {}): GameState {
  return {
    tick: TICK, seed: 42, graph, unifiedActions: [], tickEvents: [], recentEvents: [],
    effectStates: new Map(), archetypeDrift: [], ascendantId: 'asc',
    doomClock: { currentStage: 0, progress: 0.1, expired: false, ticks: 5, stageTransitions: [] },
    doomDefinition: { archetype: 'breach', stages: [] },
    worldSoul: { fundament: { sphereWeights: {} }, resonance: {} },
    pendingSpherePressures: [], emittedOmens: [], followedAgentIds: [], mutedAgentIds: [],
    ...extra,
  } as unknown as GameState;
}

interface WorldOpts {
  readonly temper?: FightTemper;
  readonly scarDefinition?: boolean;
  readonly home?: boolean;
}

/** A hero at a lair beside a town (their home), a lair beast, and a mortal rival. */
function world(opts: WorldOpts = {}): WorldGraph {
  const graph = new WorldGraph();
  if (opts.scarDefinition !== false) graph.addNode({ ...SCAR_DEF, properties: { ...SCAR_DEF.properties } });
  graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Dunmar', properties: { hexCol: 3, hexRow: 3, locationSubtype: 'town' } });
  graph.addNode({
    id: 'lair-1', type: 'location', name: 'The Maw',
    properties: { hexCol: 3, hexRow: 3, locationSubtype: 'lair', lairTier: 'major', namedEliteId: 'beast' },
  });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Oswen',
    properties: { actorType: 'individual', ...(opts.home !== false ? { originLocationId: 'town-1' } : {}) },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'lair-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'The Gnawer',
    properties: {
      actorType: 'individual', isMonsterElite: true, lairId: 'lair-1',
      monsterState: {
        family: 'beast', dread: 'steep', might: 'steep', clockSize: 4, clockFilled: 0,
        clockUpdatedTick: TICK, temper: opts.temper ?? 'berserk', temperShown: false,
      },
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'lair-1', type: 'located_at', properties: {} });
  graph.addNode({ id: 'rival', type: 'actor', name: 'Hesk', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e.rival.at', source: 'rival', target: 'lair-1', type: 'located_at', properties: {} });
  return graph;
}

function fightAction(result: FightResult, opponentId: string | null = 'beast', actionId = 'ua-1'): UnifiedAction {
  const fightState = {
    opponentId, clockSize: 4, clockAtStart: 0, clockNow: 1, persistent: opponentId === 'beast',
    exchanges: 2, harmTaken: 0.06, wounds: 2, blowsLanded: 1, momentum: 0,
    temperFired: false, berserk: false, advantages: [], forks: [],
    conditionsApplied: [], storiedClimbs: [], result,
  } as FightState;
  return {
    actionId, templateId: 'fight.lair.confront', actorId: 'hero', targetId: opponentId ?? 'hero',
    currentStep: 2, stepProgress: 0, stepResults: [], stepOutcomes: [], startedAtTick: TICK - 3,
    resolved: true, fightState,
  } as unknown as UnifiedAction;
}

/** A counting rng: every draw is recorded, so a test can prove no draw was taken. */
function countingRng(value: number): { rng: () => number; calls: () => number } {
  let n = 0;
  return { rng: () => { n += 1; return value; }, calls: () => n };
}

function ctxFor(state: GameState, rng: () => number): FightEndContext {
  const overrideCtx: RuleOverrideContext = {
    graph: state.graph, effectStates: state.effectStates, persisted: state, tick: TICK,
  };
  return { tick: TICK, rng, runtime: createSimulationRuntime(), overrideCtx };
}

function endingTraces() {
  return getTraces().filter(t => t.category === 'fight.ending') as unknown as Array<Record<string, unknown>>;
}

function scarEdges(graph: WorldGraph, id = 'hero') {
  return graph.getOutgoingEdges(id, 'has_trait').filter(e => e.target === FIGHT_SCARRED_TRAIT_ID);
}

function hostile(graph: WorldGraph, a: string, b: string) {
  return graph.getOutgoingEdges(a, 'hostile_to').find(e => e.target === b);
}

/** The D1 record without D2's chronicle significance (THR-1549 adds it to every ending). */
function withoutSignificance(ending: FightState['ending']) {
  if (!ending) return ending;
  const { eventSignificance: _sig, ...rest } = ending;
  void _sig;
  return rest;
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); resetFightEndBranches(); });

describe('THR-1548 — the fighter branch is registered', () => {
  it('ships first in the dispatcher\'s default branches', () => {
    expect(DEFAULT_FIGHT_END_BRANCHES[0]).toBe(fighterEndingBranch);
  });
});

describe('THR-1548 — struck down by a monster: mauled', () => {
  it('writes Scarred (inflictedBy, scarredTick, no expiry) and a blood_drawn grudge both ways', () => {
    const state = baseState(world());
    const { rng } = countingRng(0.99);
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, rng));

    const scars = scarEdges(state.graph);
    expect(scars).toHaveLength(1);
    expect(scars[0].properties).toMatchObject({ inflictedBy: 'beast', scarredTick: TICK });
    expect(scars[0].properties.ticksRemaining).toBeUndefined();
    expect(hostile(state.graph, 'hero', 'beast')?.properties).toMatchObject({ cause: 'blood_drawn', since: TICK });
    expect(hostile(state.graph, 'beast', 'hero')?.properties).toMatchObject({ cause: 'blood_drawn' });
    expect(state.graph.getNode('hero')!.properties.deceased).toBeUndefined();

    expect(withoutSignificance(out.fightState.ending)).toEqual({
      face: 'mauled', scarWritten: true, grudgeWritten: true,
      killRoll: { chance: FIGHT_KILL_CHANCE_BY_TEMPER.berserk, roll: 0.99 },
    });
  });

  it('a grudge toward a monster reads as a grudge, not a rivalry, and its clause renders', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.99).rng));
    expect(holdsMotive(state.graph, 'hero', 'beast', 'grudge')).toBe(true);
    expect(holdsMotive(state.graph, 'hero', 'beast', 'rivalry')).toBe(false);
    expect(getGrudgeCauseClause('blood_drawn')).toBe('one of them drew the other\'s blood');
  });

  it('a mauling on top of an old_quarrel upgrades it to blood_drawn', () => {
    const graph = world();
    for (const [s, t] of [['hero', 'beast'], ['beast', 'hero']]) {
      graph.addEdge({ id: `e_hostile_to_${s}_${t}`, source: s, target: t, type: 'hostile_to', properties: { since: 3, cause: 'old_quarrel' } });
    }
    const state = baseState(graph);
    expect(holdsMotive(graph, 'hero', 'beast', 'grudge')).toBe(false);
    onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.99).rng));
    expect(hostile(graph, 'hero', 'beast')?.properties).toMatchObject({ cause: 'blood_drawn', since: 3, causeUpgradedTick: TICK });
    expect(holdsMotive(graph, 'hero', 'beast', 'grudge')).toBe(true);
  });

  it('a second mauling adds no second scar; inflictedBy keeps the first victor; the new grudge is written', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.99).rng));
    clearTraces();
    const out = onFightEnded(state, fightAction('struck_down', 'rival', 'ua-2'), ctxFor(state, countingRng(0.99).rng));

    const scars = scarEdges(state.graph);
    expect(scars).toHaveLength(1);
    expect(scars[0].properties.inflictedBy).toBe('beast');
    expect(hostile(state.graph, 'hero', 'rival')?.properties.cause).toBe('blood_drawn');
    expect(out.fightState.ending).toMatchObject({ face: 'mauled', scarWritten: false, grudgeWritten: true });
    expect(endingTraces()[0]).toMatchObject({ scarSkipped: 'already_scarred' });
  });

  it('a tag-immune fighter\'s scar is refused and traced immune; the grudge still lands', () => {
    const graph = world();
    graph.addNode({ id: 'charm', type: 'artifact', name: 'Ward-knot', properties: { effects: [{ type: 'tag_immunity', tags: ['#scar'] }] } });
    graph.addEdge({ id: 'e.charm', source: 'hero', target: 'charm', type: 'possesses', properties: {} });
    const state = baseState(graph);
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.99).rng));
    expect(scarEdges(graph)).toEqual([]);
    expect(out.fightState.ending).toMatchObject({ scarWritten: false, grudgeWritten: true });
    expect(endingTraces()[0]).toMatchObject({ scarSkipped: 'immune' });
  });

  it('a missing Scarred definition skips the scar and still writes the grudge', () => {
    const state = baseState(world({ scarDefinition: false }));
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.99).rng));
    expect(out.fightState.ending).toMatchObject({ scarWritten: false, grudgeWritten: true });
    expect(endingTraces()[0]).toMatchObject({ scarSkipped: 'definition_missing' });
  });
});

describe('THR-1548 — the guards: no kill draw is taken', () => {
  it('The First is never killed: mauled, guard the_first, no draw', () => {
    const graph = world();
    graph.addEdge({ id: 'e.thread', source: 'asc', target: 'hero', type: 'thread', properties: { courtPosition: 'the_first' } });
    const state = baseState(graph);
    const r = countingRng(0);
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, r.rng));
    expect(r.calls()).toBe(0);
    expect(graph.getNode('hero')!.properties.deceased).toBeUndefined();
    expect(out.fightState.ending).toMatchObject({ face: 'mauled', guard: 'the_first', scarWritten: true });
    expect(out.fightState.ending!.killRoll).toBeUndefined();
    expect(fightDeathGuard(graph, 'hero')).toBe('the_first');
  });

  it('the god\'s avatar is never killed: mauled, guard avatar, no draw', () => {
    const graph = world();
    graph.addEdge({ id: 'e.avatar', source: 'hero', target: 'asc', type: 'avatar_of', properties: {} });
    const state = baseState(graph);
    const r = countingRng(0);
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, r.rng));
    expect(r.calls()).toBe(0);
    expect(graph.getNode('hero')!.properties.deceased).toBeUndefined();
    expect(out.fightState.ending).toMatchObject({ face: 'mauled', guard: 'avatar' });
    expect(out.fightState.ending!.killRoll).toBeUndefined();
  });

  it('a threaded mortal who is not The First has no guard', () => {
    const graph = world();
    graph.addEdge({ id: 'e.thread', source: 'asc', target: 'hero', type: 'thread', properties: { courtPosition: 'champion' } });
    expect(fightDeathGuard(graph, 'hero')).toBeUndefined();
  });

  it('a death_prevented ward yields mauled, guard warded, with the draw recorded', () => {
    const state = baseState(world(), {
      activeRuleOverrides: { hero: [{ rule: 'death_prevented', value: true } as never] },
    } as Partial<GameState>);
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0).rng));
    expect(state.graph.getNode('hero')!.properties.deceased).toBeUndefined();
    expect(out.fightState.ending).toMatchObject({ face: 'mauled', guard: 'warded', scarWritten: true, grudgeWritten: true, killRoll: { roll: 0 } });
  });

  it('a mortal victor (NPC mode) takes no kill draw: mauled, grudge toward the mortal', () => {
    const state = baseState(world());
    const r = countingRng(0);
    const out = onFightEnded(state, fightAction('struck_down', 'rival'), ctxFor(state, r.rng));
    expect(r.calls()).toBe(0);
    expect(out.fightState.ending).toMatchObject({ face: 'mauled', scarWritten: true, grudgeWritten: true });
    expect(hostile(state.graph, 'hero', 'rival')?.properties.cause).toBe('blood_drawn');
  });

  it('no opponent node: no draw, mauled with an unattributed scar, no grudge', () => {
    const state = baseState(world());
    const r = countingRng(0);
    const out = onFightEnded(state, fightAction('struck_down', null), ctxFor(state, r.rng));
    expect(r.calls()).toBe(0);
    expect(out.fightState.ending).toMatchObject({ face: 'mauled', scarWritten: true, grudgeWritten: false });
    expect(scarEdges(state.graph)[0].properties.inflictedBy).toBeUndefined();
  });
});

describe('THR-1548 — slain: the funnel and the reactive loop', () => {
  it('kills through the funnel (retained, cause fight, slainBy the beast) and writes the plot\'s shape', () => {
    const state = baseState(world());
    const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.01).rng));
    const graph = state.graph;

    expect(graph.getNode('hero')!.properties).toMatchObject({ deceased: true, deathCause: 'fight', slainBy: 'beast' });
    expect(withoutSignificance(out.fightState.ending)).toEqual({
      face: 'slain', scarWritten: false, grudgeWritten: false,
      killRoll: { chance: FIGHT_KILL_CHANCE_BY_TEMPER.berserk, roll: 0.01 },
    });
    expect(scarEdges(graph)).toEqual([]);

    const trace = endingTraces()[0];
    const nodeId = trace.outcomeNodeId as string;
    expect(nodeId).toBe(`evt_und_fight_ua-1_${TICK}`);
    const node = graph.getNode(nodeId)!;
    expect(node.properties).toMatchObject({
      eventType: 'undertaking_outcome', harmClass: 'named_death', source: 'fight',
      targetNodeId: 'hero', culpritAgentId: 'beast', victimAgentId: 'hero', verb: 'fight',
    });

    // The plot's shape: the same writer, the same class, a project-sourced death.
    graph.addNode({ id: 'victim2', type: 'actor', name: 'Maerin', properties: { actorType: 'individual' } });
    const plotId = createUndertakingOutcomeNode({
      graph,
      project: {
        projectId: 'proj_plot', actorId: 'rival', templateId: 'strategic_the_plot', verb: 'destroy',
        targetNodeId: 'victim2', originLocationId: 'town-1',
      } as unknown as StrategicProjectRuntime,
      harmClass: 'named_death', tick: TICK, culpritAgentId: 'rival', victimAgentId: 'victim2', ascendantId: 'asc',
    })!;
    const shapeOf = (id: string, culprit: string, victim: string) => ({
      eventType: graph.getNode(id)!.properties.eventType,
      harmClass: graph.getNode(id)!.properties.harmClass,
      culpritRole: graph.getOutgoingEdges(culprit, 'participated_in').find(e => e.target === id)?.properties.role,
      victimRole: graph.getOutgoingEdges(victim, 'participated_in').find(e => e.target === id)?.properties.role,
      targetIsVictim: graph.getNode(id)!.properties.targetNodeId === victim,
      sited: graph.getOutgoingEdges(id, 'occurred_at').length,
    });
    expect(shapeOf(nodeId, 'beast', 'hero')).toEqual(shapeOf(plotId, 'rival', 'victim2'));
    expect(shapeOf(nodeId, 'beast', 'hero')).toMatchObject({ culpritRole: 'primary', victimRole: 'target', targetIsVictim: true, sited: 1 });
    expect(graph.getOutgoingEdges(nodeId, 'occurred_at')[0].target).toBe('lair-1');
  });

  it('the omen deed names the victim', () => {
    const state = baseState(world());
    onFightEnded(state, fightAction('struck_down'), ctxFor(state, countingRng(0.01).rng));
    const portent = castUndertakingPortent(state, () => 0.5);
    expect(portent.omen?.provenance?.deed).toBe('the killing of Oswen — The Gnawer\'s work');
  });
});

describe('THR-1548 — the kill chance per temper (10k seeded rolls, ±1 point)', () => {
  const tempers: FightTemper[] = ['berserk', 'stubborn', 'skittish', 'bargainer'];
  for (const temper of tempers) {
    it(`${temper}: ${FIGHT_KILL_CHANCE_BY_TEMPER[temper]}`, () => {
      disableTracing();
      const rng = mulberry32(1548 + temper.length);
      const N = 10_000;
      let slain = 0;
      for (let i = 0; i < N; i++) {
        const state = baseState(world({ temper, scarDefinition: false, home: false }));
        const out = onFightEnded(state, fightAction('struck_down'), ctxFor(state, rng), [fighterEndingBranch]);
        if (out.fightState.ending!.face === 'slain') slain += 1;
      }
      expect(Math.abs(slain / N - FIGHT_KILL_CHANCE_BY_TEMPER[temper])).toBeLessThanOrEqual(0.01);
    }, 60_000);
  }
});

describe('THR-1548 — yields, routs and break-offs', () => {
  it('yielding to a mortal costs FIGHT_HUMILIATION_REPUTATION at home and drifts toward prudence', () => {
    const state = baseState(world());
    const before = getReputationWith(state.graph, 'hero', 'town-1').score;
    const out = onFightEnded(state, fightAction('yielded', 'rival'), ctxFor(state, countingRng(0.5).rng));
    const after = getReputationWith(state.graph, 'hero', 'town-1').score;
    expect(after).toBeCloseTo(before - FIGHT_HUMILIATION_REPUTATION, 10);
    expect(out.fightState.ending).toMatchObject({
      face: 'yielded_to_mortal',
      humiliation: { counterpartyId: 'town-1', delta: -FIGHT_HUMILIATION_REPUTATION },
      drift: { axis: 'courage_prudence', pole: 'negative' },
    });
    const drifted = state.archetypeDrift.find(d => d.agentId === 'hero');
    expect(drifted?.toPosition).toBeLessThan(0);
  });

  it('yielding with no settlement home writes no reputation', () => {
    const state = baseState(world({ home: false }));
    const out = onFightEnded(state, fightAction('yielded', 'rival'), ctxFor(state, countingRng(0.5).rng));
    expect(out.fightState.ending!.face).toBe('yielded_to_mortal');
    expect(out.fightState.ending!.humiliation).toBeUndefined();
  });

  it('yielding to a monster costs nothing', () => {
    const state = baseState(world());
    const before = getReputationWith(state.graph, 'hero', 'town-1').score;
    const out = onFightEnded(state, fightAction('yielded'), ctxFor(state, countingRng(0.5).rng));
    expect(getReputationWith(state.graph, 'hero', 'town-1').score).toBe(before);
    expect(withoutSignificance(out.fightState.ending)).toEqual({ face: 'yielded_to_monster', scarWritten: false, grudgeWritten: false });
    expect(state.archetypeDrift).toEqual([]);
  });

  it('a yield with no opponent node takes the monster face', () => {
    const state = baseState(world());
    const out = onFightEnded(state, fightAction('yielded', null), ctxFor(state, countingRng(0.5).rng));
    expect(out.fightState.ending!.face).toBe('yielded_to_monster');
  });

  it('a rout drifts toward prudence and humiliates nobody', () => {
    const state = baseState(world());
    const out = onFightEnded(state, fightAction('routed', 'rival'), ctxFor(state, countingRng(0.5).rng));
    expect(withoutSignificance(out.fightState.ending)).toEqual({
      face: 'routed', scarWritten: false, grudgeWritten: false,
      drift: { axis: 'courage_prudence', pole: 'negative' },
    });
  });

  it('a break-off writes nothing', () => {
    const state = baseState(world());
    const edgesBefore = state.graph.getAllEdges().length;
    const out = onFightEnded(state, fightAction('broke_off'), ctxFor(state, countingRng(0.5).rng));
    expect(withoutSignificance(out.fightState.ending)).toEqual({ face: 'broke_off', scarWritten: false, grudgeWritten: false });
    expect(state.graph.getAllEdges().length).toBe(edgesBefore);
  });

  it('victories record their face (the yields are D2)', () => {
    const faces = (['overcome', 'driven_off', 'bargained'] as const).map((result) => {
      const state = baseState(world());
      return onFightEnded(state, fightAction(result), ctxFor(state, countingRng(0.5).rng)).fightState.ending!.face;
    });
    expect(faces).toEqual(['overcome_monster', 'driven_off', 'bargained']);
    const state = baseState(world());
    expect(onFightEnded(state, fightAction('overcome', 'rival'), ctxFor(state, countingRng(0.5).rng)).fightState.ending!.face)
      .toBe('overcome_mortal');
  });
});

describe('THR-1548 — the record equals the trace', () => {
  it('fightState.ending face / scarWritten / grudgeWritten / killRoll / guard equal the fight.ending trace\'s', () => {
    for (const [result, roll, opponent] of [
      ['struck_down', 0.99, 'beast'], ['struck_down', 0.01, 'beast'], ['yielded', 0.5, 'rival'], ['routed', 0.5, 'beast'],
    ] as const) {
      clearTraces();
      const graph = world();
      const state = baseState(graph);
      const action = fightAction(result, opponent);
      const done = finalizeFightEnd(state, action, { id: 'fight.lair.confront', steps: [] } as never, ctxFor(state, countingRng(roll).rng), true);
      const ending = done.action.fightState!.ending!;
      const trace = endingTraces()[0];
      expect(trace).toBeDefined();
      for (const key of ['face', 'scarWritten', 'grudgeWritten', 'killRoll', 'guard'] as const) {
        expect(trace[key]).toEqual(ending[key]);
      }
    }
  });
});
