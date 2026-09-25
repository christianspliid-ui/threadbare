/**
 * THR-1557 — Duels E2: the victor decides (plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` §5).
 *
 * Every case runs through the real dispatcher (`onFightEnded` with the shipped
 * branches) on a small graph, so what is asserted is what a duel in the world writes:
 * the victor's mercy fork over a beaten loser (spared / mauled / slain, through D1's
 * guards and the one death funnel), the yielded and routed faces on either side,
 * `fightState.opponentEnding`, the victor's standing and drifts, and the trace.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { onFightEnded, resetFightEndBranches, type FightEndContext } from '../fightOutcome';
import { decideBeatenDuellist } from '../fightEnding';
import { readLiveAxisLean } from '../../encounters/branchDecision';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import {
  FIGHT_CONCESSION_AXIS,
  FIGHT_DUEL_KILL_CHANCE_RUTHLESS,
  FIGHT_HUMILIATION_REPUTATION,
  FIGHT_MERCY_AXIS,
  FIGHT_SCARRED_TRAIT_ID,
} from '../../../data/fight-constants';
import { getReputationWith } from '../../reputation';
import { mulberry32 } from '../../factionAmbitions';
import type { GameState } from '../../../types/gameState';
import type { StepNudge, UnifiedAction } from '../../../types/unifiedAction';
import type { FightOpponentLoss, FightResult, FightState } from '../../../types/fight';
import type { RuleOverrideContext } from '../../effects/ruleOverrideConsumers';

const TICK = 200;
const SCAR_DEF = CONDITION_TRAIT_DEFINITIONS.find(d => d.id === FIGHT_SCARRED_TRAIT_ID)!;

function baseState(graph: WorldGraph): GameState {
  return {
    tick: TICK, seed: 42, graph, unifiedActions: [], tickEvents: [], recentEvents: [],
    effectStates: new Map(), archetypeDrift: [], ascendantId: 'asc',
    doomClock: { currentStage: 0, progress: 0.1, expired: false, ticks: 5, stageTransitions: [] },
    doomDefinition: { archetype: 'breach', stages: [] },
    worldSoul: { fundament: { sphereWeights: {} }, resonance: {} },
    pendingSpherePressures: [], emittedOmens: [], followedAgentIds: [], mutedAgentIds: [],
  } as unknown as GameState;
}

interface WorldOpts {
  /** `mercy_ruthlessness` baselines: + spares, − finishes, 0 is the coin. */
  readonly heroMercy?: number;
  readonly rivalMercy?: number;
  /** Thread the hero as The First. */
  readonly heroIsFirst?: boolean;
  readonly rivalIsFirst?: boolean;
}

/** Two mortals in a square: Oswen (the actor, home Dunmar) and Hesk (home Varrow). */
function world(opts: WorldOpts = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ ...SCAR_DEF, properties: { ...SCAR_DEF.properties } });
  graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Dunmar', properties: { hexCol: 3, hexRow: 3, locationSubtype: 'town' } });
  graph.addNode({ id: 'town-2', type: 'location', name: 'Varrow', properties: { hexCol: 3, hexRow: 3, locationSubtype: 'town' } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Oswen',
    properties: { actorType: 'individual', originLocationId: 'town-1', axiologicalProfile: { mercy_ruthlessness: opts.heroMercy ?? 0.5 } },
  });
  graph.addNode({
    id: 'rival', type: 'actor', name: 'Hesk',
    properties: { actorType: 'individual', originLocationId: 'town-2', axiologicalProfile: { mercy_ruthlessness: opts.rivalMercy ?? 0.5 } },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'town-1', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e.rival.at', source: 'rival', target: 'town-1', type: 'located_at', properties: {} });
  if (opts.heroIsFirst) {
    graph.addEdge({ id: 'e.thread.hero', source: 'asc', target: 'hero', type: 'thread', properties: { courtPosition: 'the_first' } });
  }
  if (opts.rivalIsFirst) {
    graph.addEdge({ id: 'e.thread.rival', source: 'asc', target: 'rival', type: 'thread', properties: { courtPosition: 'the_first' } });
  }
  return graph;
}

/** A resolved duel: Oswen (the actor) against Hesk, with the fighter's result and how Hesk lost. */
function duel(result: FightResult, opponentLoss?: FightOpponentLoss, extra: Partial<UnifiedAction> = {}): UnifiedAction {
  const fightState = {
    opponentId: 'rival', clockSize: 2, clockAtStart: 0, clockNow: 1, persistent: false,
    exchanges: 3, harmTaken: 0.04, wounds: 1, blowsLanded: 1, momentum: 0,
    temperFired: false, berserk: false, advantages: [], forks: [],
    conditionsApplied: [], storiedClimbs: [], result,
    fightMode: 'agent', fighterClockSize: 2, fighterClockNow: 1, opponentBands: [],
    ...(opponentLoss ? { opponentLoss } : {}),
  } as FightState;
  return {
    actionId: 'ua-duel', templateId: 'fight.duel.grudge', actorId: 'hero', targetId: 'rival',
    currentStep: 3, stepProgress: 0, stepResults: [], stepOutcomes: [], startedAtTick: TICK - 4,
    resolved: true, fightState, ...extra,
  } as unknown as UnifiedAction;
}

function countingRng(value: number): { rng: () => number; calls: () => number } {
  let n = 0;
  return { rng: () => { n += 1; return value; }, calls: () => n };
}

function ctxFor(state: GameState, rng: () => number, handNudges?: readonly StepNudge[]): FightEndContext {
  const overrideCtx: RuleOverrideContext = {
    graph: state.graph, effectStates: state.effectStates, persisted: state, tick: TICK,
  };
  return { tick: TICK, rng, runtime: createSimulationRuntime(), overrideCtx, ...(handNudges ? { handNudges } : {}) };
}

function end(state: GameState, action: UnifiedAction, rng: () => number, handNudges?: readonly StepNudge[]) {
  return onFightEnded(state, action, ctxFor(state, rng, handNudges));
}

function endingTrace() {
  const t = getTraces().filter(tr => tr.category === 'fight.ending');
  expect(t).toHaveLength(1);
  return t[0] as unknown as Record<string, unknown>;
}

const isDead = (graph: WorldGraph, id: string) => graph.getNode(id)?.properties.deceased === true;
const scarred = (graph: WorldGraph, id: string) =>
  graph.getOutgoingEdges(id, 'has_trait').some(e => e.target === FIGHT_SCARRED_TRAIT_ID);
const grudge = (graph: WorldGraph, a: string, b: string) =>
  graph.getOutgoingEdges(a, 'hostile_to').find(e => e.target === b);

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { resetFightEndBranches(); disableTracing(); clearTraces(); });

describe('the victor spares a beaten loser (mercy pole)', () => {
  it('a merciful opponent spares a struck-down fighter: scar + blood_drawn grudge, no kill draw', () => {
    const state = baseState(world({ rivalMercy: 0.5 }));
    const { rng, calls } = countingRng(0);
    const out = end(state, duel('struck_down'), rng);

    expect(out.fightState.ending?.face).toBe('spared');
    expect(out.fightState.ending?.mercy).toMatchObject({ victorId: 'rival', pole: 'positive', decidedBy: 'conviction' });
    expect(out.fightState.ending?.killRoll).toBeUndefined();
    expect(scarred(state.graph, 'hero')).toBe(true);
    expect(grudge(state.graph, 'hero', 'rival')?.properties.cause).toBe('blood_drawn');
    expect(isDead(state.graph, 'hero')).toBe(false);
    expect(calls()).toBe(0);
  });

  it('a merciful fighter spares a beaten opponent (clock), recorded on opponentEnding', () => {
    const state = baseState(world({ heroMercy: 0.5 }));
    const out = end(state, duel('overcome', 'clock'), countingRng(0).rng);

    expect(out.fightState.ending?.face).toBe('overcome_mortal');
    expect(out.fightState.opponentEnding?.face).toBe('spared');
    expect(out.fightState.opponentEnding?.mercy).toMatchObject({ victorId: 'hero', pole: 'positive' });
    expect(scarred(state.graph, 'rival')).toBe(true);
    expect(grudge(state.graph, 'rival', 'hero')?.properties.cause).toBe('blood_drawn');
  });
});

describe('the victor finishes a beaten loser (ruthlessness pole)', () => {
  it('a ruthless victor kills on a hit, through the funnel, with the victor as culprit', () => {
    const state = baseState(world({ heroMercy: -0.5 }));
    const out = end(state, duel('overcome', 'struck_down'), countingRng(0).rng);

    expect(out.fightState.opponentEnding?.face).toBe('slain');
    expect(out.fightState.opponentEnding?.killRoll).toEqual({ chance: FIGHT_DUEL_KILL_CHANCE_RUTHLESS, roll: 0 });
    expect(isDead(state.graph, 'rival')).toBe(true);
    expect(isDead(state.graph, 'hero')).toBe(false);
    const t = endingTrace();
    expect(t.opponentFace).toBe('slain');
    expect(t.opponentKillRoll).toEqual({ chance: FIGHT_DUEL_KILL_CHANCE_RUTHLESS, roll: 0 });
  });

  it('a missed kill draw mauls (scar + grudge) and the loser lives', () => {
    const state = baseState(world({ rivalMercy: -0.5 }));
    const out = end(state, duel('struck_down'), countingRng(0.99).rng);

    expect(out.fightState.ending?.face).toBe('mauled');
    expect(out.fightState.ending?.killRoll?.roll).toBe(0.99);
    expect(scarred(state.graph, 'hero')).toBe(true);
    expect(isDead(state.graph, 'hero')).toBe(false);
  });

  it("a ruthless victor's kill chance holds over 10k seeded draws (within ±1 point)", () => {
    const rng = mulberry32(1557);
    const N = 10_000;
    let kills = 0;
    for (let i = 0; i < N; i++) {
      const state = baseState(world({ heroMercy: -0.5 }));
      const action = duel('overcome', 'struck_down');
      const fate = decideBeatenDuellist(state, action, 'rival', 'hero', ctxFor(state, rng));
      if (fate.face === 'slain') kills += 1;
    }
    const rate = kills / N;
    expect(Math.abs(rate - FIGHT_DUEL_KILL_CHANCE_RUTHLESS)).toBeLessThanOrEqual(0.01);
  });
});

describe('a loser who yielded or fled is never finished, whichever side', () => {
  const cases: Array<{ name: string; result: FightResult; loss?: FightOpponentLoss; loser: 'hero' | 'rival'; face: string }> = [
    { name: 'the fighter yields', result: 'yielded', loser: 'hero', face: 'yielded_to_mortal' },
    { name: 'the fighter routs', result: 'routed', loser: 'hero', face: 'routed' },
    { name: 'the opponent yields', result: 'overcome', loss: 'yielded', loser: 'rival', face: 'yielded_to_mortal' },
    { name: 'the opponent routs', result: 'overcome', loss: 'routed', loser: 'rival', face: 'routed' },
  ];
  for (const c of cases) {
    it(`${c.name}: no mercy fork, no kill draw, alive`, () => {
      // Both sides as ruthless as they come, and an rng that would kill on any draw.
      const state = baseState(world({ heroMercy: -1, rivalMercy: -1 }));
      const { rng, calls } = countingRng(0);
      const out = end(state, duel(c.result, c.loss), rng);

      const loserRecord = c.loser === 'hero' ? out.fightState.ending : out.fightState.opponentEnding;
      expect(loserRecord?.face).toBe(c.face);
      expect(loserRecord?.killRoll).toBeUndefined();
      expect(loserRecord?.mercy).toBeUndefined();
      expect(isDead(state.graph, c.loser)).toBe(false);
      expect(scarred(state.graph, c.loser)).toBe(false);
      expect(calls()).toBe(0);
      expect(endingTrace().victorPole).toBeUndefined();
    });
  }
});

describe('the guards come first', () => {
  it('The First is never finished, and with a guard firing no kill draw is taken', () => {
    const state = baseState(world({ heroIsFirst: true, rivalMercy: -1 }));
    const { rng, calls } = countingRng(0);
    const out = end(state, duel('struck_down'), rng);

    expect(out.fightState.ending?.face).toBe('mauled');
    expect(out.fightState.ending?.guard).toBe('the_first');
    expect(out.fightState.ending?.killRoll).toBeUndefined();
    expect(isDead(state.graph, 'hero')).toBe(false);
    expect(calls()).toBe(0);
  });

  it('the guard holds on the opponent side too', () => {
    const state = baseState(world({ rivalIsFirst: true, heroMercy: -1 }));
    const { rng, calls } = countingRng(0);
    const out = end(state, duel('overcome', 'clock'), rng);

    expect(out.fightState.opponentEnding?.guard).toBe('the_first');
    expect(out.fightState.opponentEnding?.killRoll).toBeUndefined();
    expect(isDead(state.graph, 'rival')).toBe(false);
    expect(calls()).toBe(0);
  });
});

describe('the victor drifts, and gains standing', () => {
  it('a victor who spared drifts toward mercy; a victor who won drifts toward courage', () => {
    const state = baseState(world({ heroMercy: 0.3 }));
    const mercyBefore = readLiveAxisLean(state, 'hero', FIGHT_MERCY_AXIS);
    const courageBefore = readLiveAxisLean(state, 'hero', FIGHT_CONCESSION_AXIS);
    end(state, duel('overcome', 'clock'), countingRng(0).rng);
    expect(readLiveAxisLean(state, 'hero', FIGHT_MERCY_AXIS)).toBeGreaterThan(mercyBefore);
    expect(readLiveAxisLean(state, 'hero', FIGHT_CONCESSION_AXIS)).toBeGreaterThan(courageBefore);
  });

  it('the opponent who beat the fighter gains standing and drifts toward courage', () => {
    const state = baseState(world());
    const before = readLiveAxisLean(state, 'rival', FIGHT_CONCESSION_AXIS);
    const out = end(state, duel('routed'), countingRng(0).rng);

    expect(out.fightState.opponentEnding?.face).toBe('overcome_mortal');
    expect(out.fightState.opponentEnding?.reputation?.counterpartyId).toBe('town-1');
    expect(readLiveAxisLean(state, 'rival', FIGHT_CONCESSION_AXIS)).toBeGreaterThan(before);
  });

  it("a yield's victor standing is not written twice (D2's victorStanding is reused)", () => {
    const state = baseState(world());
    const out = end(state, duel('yielded'), countingRng(0).rng);
    expect(out.fightState.ending?.victorStanding).toBeDefined();
    expect(out.fightState.opponentEnding?.reputation).toEqual({
      counterpartyId: out.fightState.ending!.victorStanding!.counterpartyId,
      delta: out.fightState.ending!.victorStanding!.delta,
    });
  });
});

describe('a duellist who yields loses face at home', () => {
  it('an opponent who yields to the fighter is humiliated at their own home', () => {
    const state = baseState(world());
    const before = getReputationWith(state.graph, 'rival', 'town-2').score;
    const out = end(state, duel('overcome', 'yielded'), countingRng(0).rng);

    expect(out.fightState.opponentEnding?.humiliation).toEqual({ counterpartyId: 'town-2', delta: -FIGHT_HUMILIATION_REPUTATION });
    expect(getReputationWith(state.graph, 'rival', 'town-2').score).toBeLessThan(before);
  });

  it('a double yield humiliates nobody: nobody won', () => {
    const state = baseState(world());
    const out = end(state, duel('broke_off', 'yielded'), countingRng(0).rng);
    expect(out.fightState.ending?.face).toBe('broke_off');
    expect(out.fightState.opponentEnding?.face).toBe('broke_off');
    expect(out.fightState.opponentEnding?.humiliation).toBeUndefined();
  });
});

describe('the mercy fork is traced, naming its decider', () => {
  it('conviction: the victor pole, profile lean and card lean are on fight.ending', () => {
    const state = baseState(world({ rivalMercy: 0.4 }));
    end(state, duel('struck_down'), countingRng(0).rng);
    const t = endingTrace();
    expect(t).toMatchObject({ victorPole: 'positive', mercyDecidedBy: 'conviction', victorProfileLean: 0.4, victorCardLean: 0 });
    expect(t.opponentFace).toBe('overcome_mortal');
  });

  it('coin: a neutral victor is decided by the step rng', () => {
    const state = baseState(world({ rivalMercy: 0 }));
    const { rng, calls } = countingRng(0.9);
    end(state, duel('struck_down'), rng);
    expect(endingTrace()).toMatchObject({ mercyDecidedBy: 'coin' });
    expect(calls()).toBeGreaterThanOrEqual(1);
  });

  it("the god's hand leans the victor only when the victor is the god's own mortal (the actor)", () => {
    const nudges = [{ id: 'card.mercy', poleLean: { axis: FIGHT_MERCY_AXIS, toward: 'positive', weight: 0.5 } }] as unknown as StepNudge[];
    // The fighter is the victor and neutral: the hand tips them to mercy.
    const a = baseState(world({ heroMercy: 0 }));
    const outA = end(a, duel('overcome', 'clock', { activeNudges: ['card.mercy'] } as Partial<UnifiedAction>), countingRng(0).rng, nudges);
    expect(outA.fightState.opponentEnding?.mercy).toMatchObject({ pole: 'positive', decidedBy: 'conviction', cardLean: 0.5 });

    // The opponent is the victor: the same hand does not touch them.
    clearTraces();
    const b = baseState(world({ rivalMercy: 0 }));
    const outB = end(b, duel('struck_down', undefined, { activeNudges: ['card.mercy'] } as Partial<UnifiedAction>), countingRng(0.9).rng, nudges);
    expect(outB.fightState.ending?.mercy).toMatchObject({ cardLean: 0, decidedBy: 'coin' });
  });
});

describe('double knockout and the chronicle', () => {
  it('both struck down: each side is decided by its own victor, and both stories are told', () => {
    const state = baseState(world({ heroMercy: 0.5, rivalMercy: 0.5 }));
    const out = end(state, duel('struck_down', 'struck_down'), countingRng(0).rng);

    expect(out.fightState.ending?.face).toBe('spared');
    expect(out.fightState.opponentEnding?.face).toBe('spared');
    const t = endingTrace();
    expect(t.bothStruckDown).toBe(true);
    expect(t.opponentVictorPole).toBe('positive');
    expect(out.events.map(e => e.id)).toEqual(['fight_ended_ua-duel_200', 'fight_ended_ua-duel_200_opponent']);
  });

  it("a duel the fighter won tells the loser's story once", () => {
    const state = baseState(world({ heroMercy: -0.5 }));
    const out = end(state, duel('overcome', 'struck_down'), countingRng(0).rng);
    expect(out.events).toHaveLength(1);
    expect(out.events[0].actorId).toBe('rival');
    expect(out.events[0].message).toBe('Oswen killed Hesk at Dunmar.');
  });

  it('an NPC-mode fight writes no opponentEnding (shape unchanged)', () => {
    const state = baseState(world({ rivalMercy: -1 }));
    const action = duel('struck_down');
    const npc = { ...action, fightState: { ...action.fightState!, fightMode: undefined } } as UnifiedAction;
    const out = end(state, npc, countingRng(0).rng);
    expect(out.fightState.ending?.face).toBe('mauled');
    expect(out.fightState.opponentEnding).toBeUndefined();
    expect(out.fightState.ending?.killRoll).toBeUndefined();
  });
});
