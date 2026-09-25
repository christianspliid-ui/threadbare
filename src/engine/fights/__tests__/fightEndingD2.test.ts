/**
 * THR-1549 — Fight endings D2: victory yields and the chronicle (plan doc
 * `Docs/plans/2026-09-23-defeat-and-victory.md` §4–5).
 *
 * Every case runs through the real dispatcher (`onFightEnded` with the shipped
 * branches) against a small graph, so what is asserted is what a fight in the world
 * writes: the trophy through `drawSeededReward`, gratitude and standing through the
 * reputation writer, the value drift, and the `fight_ended` event `phaseNarrative`
 * turns into a chronicle row.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime } from '../../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { onFightEnded, resetFightEndBranches, type FightEndContext } from '../fightOutcome';
import { fighterEndingBranch, fightChronicleLine, nearestGratefulSettlement } from '../fightEnding';
import { phaseNarrative } from '../../orchestrator';
import { getReputationWith } from '../../reputation';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { REWARD_POSSESSIONS } from '../../../data/reward-attachment-catalog';
import {
  FIGHT_EVENT_SIGNIFICANCE,
  FIGHT_EVENT_TIER_BY_FACE,
  FIGHT_SCARRED_TRAIT_ID,
  FIGHT_VICTORY_REPUTATION_DRIVEN_OFF,
  FIGHT_VICTORY_REPUTATION_DUEL,
  FIGHT_VICTORY_REPUTATION_OVERCOME,
} from '../../../data/fight-constants';
import { FIGHT_CHRONICLE_LINES, FIGHT_TROPHY_RECIPE } from '../../../data/fight-ending-content';
import type { GameState, TickEvent } from '../../../types/gameState';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { FightResult, FightState } from '../../../types/fight';
import type { AttachmentEffect } from '../../../types/effects';
import type { RuleOverrideContext } from '../../effects/ruleOverrideConsumers';

const TICK = 120;
const SCAR_DEF = CONDITION_TRAIT_DEFINITIONS.find(d => d.id === FIGHT_SCARRED_TRAIT_ID)!;

function baseState(graph: WorldGraph, tick = TICK): GameState {
  return {
    tick, seed: 42, graph, unifiedActions: [], tickEvents: [], recentEvents: [], chronicleEntries: [],
    effectStates: new Map(), archetypeDrift: [], ascendantId: 'asc',
    doomClock: { currentStage: 0, progress: 0.1, expired: false, ticks: 5, stageTransitions: [] },
    doomDefinition: { archetype: 'breach', stages: [] },
    worldSoul: { fundament: { sphereWeights: {} }, resonance: {} },
    pendingSpherePressures: [], emittedOmens: [], followedAgentIds: [], mutedAgentIds: [],
  } as unknown as GameState;
}

interface WorldOpts {
  readonly lairTier?: 'minor' | 'major' | 'legendary' | 'none';
  /** Settlements to place, as [id, subtype, col, row]. Default: one town on the lair's hex. */
  readonly settlements?: ReadonlyArray<readonly [string, string, number, number]>;
  readonly possessions?: boolean;
  readonly rivalFaction?: boolean;
  readonly heroFaction?: boolean;
  readonly scarred?: boolean;
}

/** A hero at a lair (3,3), its beast, a mortal rival, and the settlements asked for. */
function world(opts: WorldOpts = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ ...SCAR_DEF, properties: { ...SCAR_DEF.properties } });
  if (opts.possessions !== false) for (const node of REWARD_POSSESSIONS) graph.addNode({ ...node, properties: { ...node.properties } });
  graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  for (const [id, subtype, col, row] of opts.settlements ?? [['town-1', 'town', 3, 3] as const]) {
    graph.addNode({ id, type: 'location', name: id.toUpperCase(), properties: { hexCol: col, hexRow: row, locationSubtype: subtype } });
  }
  const tier = opts.lairTier ?? 'major';
  graph.addNode({
    id: 'lair-1', type: 'location', name: 'The Maw',
    properties: { hexCol: 3, hexRow: 3, locationSubtype: 'lair', ...(tier !== 'none' ? { lairTier: tier } : {}), namedEliteId: 'beast' },
  });
  graph.addNode({ id: 'hero', type: 'actor', name: 'Oswen', properties: { actorType: 'individual', originLocationId: 'town-1' } });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'lair-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'The Gnawer',
    properties: {
      actorType: 'individual', isMonsterElite: true, ...(tier !== 'none' ? { lairId: 'lair-1' } : {}),
      monsterState: {
        family: 'beast', dread: 'steep', might: 'steep', clockSize: 4, clockFilled: 0,
        clockUpdatedTick: TICK, temper: 'stubborn', temperShown: false,
      },
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'lair-1', type: 'located_at', properties: {} });
  graph.addNode({ id: 'rival', type: 'actor', name: 'Hesk', properties: { actorType: 'individual', originLocationId: 'town-1' } });
  graph.addEdge({ id: 'e.rival.at', source: 'rival', target: 'lair-1', type: 'located_at', properties: {} });
  if (opts.rivalFaction || opts.heroFaction) {
    graph.addNode({ id: 'fac-1', type: 'actor', name: 'The Ash Guild', properties: { actorType: 'faction', actorStatus: 'active', factionDefId: 'guild.ash' } });
  }
  if (opts.rivalFaction) {
    graph.addEdge({ id: 'e.rival.mem', source: 'rival', target: 'fac-1', type: 'member_of', properties: { factionDefId: 'guild.ash', rank: 0.3 } });
  }
  if (opts.heroFaction) {
    graph.addEdge({ id: 'e.hero.mem', source: 'hero', target: 'fac-1', type: 'member_of', properties: { factionDefId: 'guild.ash', rank: 0.3 } });
  }
  if (opts.scarred) {
    graph.addEdge({ id: 'e.hero.scar', source: 'hero', target: FIGHT_SCARRED_TRAIT_ID, type: 'has_trait', properties: {} });
  }
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

function ctxFor(state: GameState, tick = TICK): FightEndContext {
  const overrideCtx: RuleOverrideContext = {
    graph: state.graph, effectStates: state.effectStates, persisted: state, tick,
  };
  return { tick, rng: () => 0.99, runtime: createSimulationRuntime(), overrideCtx };
}

function end(state: GameState, result: FightResult, opponentId: string | null = 'beast', tick = TICK) {
  return onFightEnded(state, fightAction(result, opponentId), ctxFor(state, tick));
}

function trophyQueryTraces() {
  return (getTraces() as unknown as Array<Record<string, unknown>>)
    .filter(t => String(t.category).startsWith('content.query') && t.site === 'fight_trophy');
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); resetFightEndBranches(); });

describe('THR-1549 — the trophy', () => {
  it('overcoming a lair\'s monster draws through drawSeededReward, traced under site fight_trophy', () => {
    const state = baseState(world());
    const out = end(state, 'overcome');
    const reward = out.fightState.ending!.reward;
    expect(reward).toBeDefined();
    // The prize landed on the fighter through the pool's own instantiation.
    expect(state.graph.getNode(reward!.instanceId)).toBeDefined();
    expect(state.graph.getOutgoingEdges('hero').some(e => e.target === reward!.instanceId)).toBe(true);
    const traces = trophyQueryTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].pickedId).toBe(reward!.templateId);
  });

  it('keys the recipe\'s categoryWeights by the possession category', () => {
    expect(FIGHT_TROPHY_RECIPE.categoryWeights).toEqual({ possession: 1 });
    const state = baseState(world());
    end(state, 'overcome');
    const query = trophyQueryTraces()[0].query as { kind: string[] };
    expect(query.kind).toHaveLength(1);
  });

  it('a reward_tier_bonus on the fighter shifts the trophy\'s tier curve upward', () => {
    disableTracing();
    const meanTier = (blessed: boolean): number => {
      let sum = 0;
      let n = 0;
      for (let t = 1; t <= 120; t++) {
        const graph = world();
        if (blessed) {
          graph.addNode({
            id: 'charm.hero', type: 'artifact', name: 'Charm',
            // No tier: a tier-1 candidate, so a shifted curve (tier 1 → 0) can never deal
            // the charm itself — the rise is the curve's, not the fixture's.
            properties: {
              effects: [{ type: 'modify_rules', rule: 'reward_tier_bonus', value: 2, scope: { scope: 'self' }, ticks: 'permanent' } as unknown as AttachmentEffect],
            },
          });
          graph.addEdge({ id: 'e.hero.charm', type: 'possesses', source: 'hero', target: 'charm.hero', properties: {} });
        }
        const state = baseState(graph, t);
        const reward = end(state, 'overcome', 'beast', t).fightState.ending!.reward;
        if (reward) { sum += reward.tier; n += 1; }
      }
      return sum / n;
    };
    expect(meanTier(true)).toBeGreaterThan(meanTier(false) + 0.5);
  });

  it('a minor lair, or none, holds no trophy', () => {
    for (const lairTier of ['minor', 'none'] as const) {
      const state = baseState(world({ lairTier }));
      const out = end(state, 'overcome');
      expect(out.fightState.ending!.reward).toBeUndefined();
      const trace = (getTraces() as unknown as Array<Record<string, unknown>>).filter(t => t.category === 'fight.ending').pop()!;
      expect(trace.rewardSkipped).toBe(lairTier === 'minor' ? 'minor_lair' : 'no_lair');
    }
  });
});

describe('THR-1549 — gratitude', () => {
  it('overcoming a monster earns gratitude from the settlement on the lair\'s hex', () => {
    const state = baseState(world());
    const before = getReputationWith(state.graph, 'hero', 'town-1').score;
    const out = end(state, 'overcome');
    expect(getReputationWith(state.graph, 'hero', 'town-1').score).toBeCloseTo(before + FIGHT_VICTORY_REPUTATION_OVERCOME, 10);
    expect(out.fightState.ending!.reputation).toEqual({ counterpartyId: 'town-1', delta: FIGHT_VICTORY_REPUTATION_OVERCOME });
  });

  it('goes to the nearest settlement within the radius, never beyond it', () => {
    const near = world({ settlements: [['town-far', 'town', 3, 6], ['city-near', 'city', 3, 4], ['town-out', 'town', 3, 9]] });
    const state = baseState(near);
    const out = end(state, 'driven_off');
    expect(out.fightState.ending!.reputation).toEqual({ counterpartyId: 'city-near', delta: FIGHT_VICTORY_REPUTATION_DRIVEN_OFF });

    const far = baseState(world({ settlements: [['town-out', 'town', 3, 9]] }));
    expect(end(far, 'driven_off').fightState.ending!.reputation).toBeUndefined();
  });

  it('breaks ties between equally near settlements by node id', () => {
    const graph = world({ settlements: [['town-b', 'town', 3, 4], ['town-a', 'hamlet', 3, 2]] });
    expect(nearestGratefulSettlement(graph, { col: 3, row: 3 })?.id).toBe('town-a');
    const state = baseState(graph);
    expect(end(state, 'overcome').fightState.ending!.reputation?.counterpartyId).toBe('town-a');
  });

  it('a lair is never the grateful settlement', () => {
    const graph = world({ settlements: [] });
    expect(nearestGratefulSettlement(graph, { col: 3, row: 3 })).toBeUndefined();
  });
});

describe('THR-1549 — mortals: standing and drift', () => {
  it('beating a mortal drifts toward courage and writes standing with the loser\'s faction', () => {
    const state = baseState(world({ rivalFaction: true }));
    const out = end(state, 'overcome', 'rival');
    expect(out.fightState.ending).toMatchObject({
      face: 'overcome_mortal',
      reputation: { counterpartyId: 'fac-1', delta: FIGHT_VICTORY_REPUTATION_DUEL },
      drift: { axis: 'courage_prudence', pole: 'positive' },
    });
    expect(state.archetypeDrift.find(d => d.agentId === 'hero')?.toPosition).toBeGreaterThan(0);
    // No trophy from a person.
    expect(out.fightState.ending!.reward).toBeUndefined();
  });

  it('falls back to the loser\'s home settlement when they have no faction', () => {
    const state = baseState(world());
    const out = end(state, 'overcome', 'rival');
    expect(out.fightState.ending!.reputation).toEqual({ counterpartyId: 'town-1', delta: FIGHT_VICTORY_REPUTATION_DUEL });
  });

  it('the victor of a yield gains standing with the yielder\'s faction (the other side of humiliation)', () => {
    const state = baseState(world({ heroFaction: true }));
    const before = getReputationWith(state.graph, 'rival', 'fac-1').score;
    const out = end(state, 'yielded', 'rival');
    expect(out.fightState.ending!.victorStanding).toEqual({ victorId: 'rival', counterpartyId: 'fac-1', delta: FIGHT_VICTORY_REPUTATION_DUEL });
    expect(getReputationWith(state.graph, 'rival', 'fac-1').score).toBeCloseTo(before + FIGHT_VICTORY_REPUTATION_DUEL, 10);
  });

  it('a bargain drifts toward mercy and takes the hoard', () => {
    const state = baseState(world());
    const out = end(state, 'bargained');
    expect(out.fightState.ending).toMatchObject({ face: 'bargained', drift: { axis: 'mercy_ruthlessness', pole: 'positive' } });
    expect(state.archetypeDrift.find(d => d.agentId === 'hero')).toBeDefined();
    expect(out.fightState.ending!.reward).toBeDefined();
  });
});

describe('THR-1549 — the chronicle', () => {
  function chronicle(result: FightResult, opts: WorldOpts = {}, opponentId: string | null = 'beast') {
    const state = baseState(world(opts));
    const out = end(state, result, opponentId);
    const tickEvents = out.events as TickEvent[];
    const { chronicleEntries } = phaseNarrative({ ...state, tickEvents });
    return { out, tickEvents, chronicleEntries: chronicleEntries ?? [] };
  }

  it('every ending emits exactly one fight_ended event, significance by its face\'s tier', () => {
    for (const [result, opp] of [['overcome', 'beast'], ['routed', 'beast'], ['broke_off', 'beast'], ['yielded', 'rival']] as const) {
      const { out, tickEvents } = chronicle(result, {}, opp);
      expect(tickEvents).toHaveLength(1);
      const face = out.fightState.ending!.face;
      expect(tickEvents[0]).toMatchObject({
        type: 'fight_ended', actorId: 'hero', hexCoords: { col: 3, row: 3 },
        significance: FIGHT_EVENT_SIGNIFICANCE[FIGHT_EVENT_TIER_BY_FACE[face]],
      });
      expect(out.fightState.ending!.eventSignificance).toBe(tickEvents[0].significance);
    }
  });

  it('a notable ending adds a chronicleEntries row; a routine one does not', () => {
    const notable = chronicle('overcome');
    expect(notable.chronicleEntries).toHaveLength(1);
    expect(notable.chronicleEntries[0].id).toBe(notable.tickEvents[0].id);
    expect(notable.chronicleEntries[0].prose).toBe('Oswen felled The Gnawer at The Maw.');

    expect(chronicle('routed').chronicleEntries).toHaveLength(0);
    expect(chronicle('broke_off').chronicleEntries).toHaveLength(0);
  });

  it('yielding to a mortal is notable; yielding to a monster is routine', () => {
    const toMortal = chronicle('yielded', {}, 'rival');
    expect(toMortal.out.fightState.ending!.face).toBe('yielded_to_mortal');
    expect(toMortal.chronicleEntries).toHaveLength(1);
    expect(chronicle('yielded').chronicleEntries).toHaveLength(0);
  });

  it('a bargain with no prize and a mauling with no scar use the plain lines', () => {
    const bargainNoPrize = chronicle('bargained', { lairTier: 'minor' });
    expect(bargainNoPrize.out.fightState.ending!.reward).toBeUndefined();
    expect(bargainNoPrize.tickEvents[0].message).toBe('Oswen let The Gnawer live at The Maw.');

    const bargainPrize = chronicle('bargained');
    expect(bargainPrize.tickEvents[0].message).toBe('Oswen let The Gnawer live at The Maw, and walked away with something.');

    const mauledAgain = chronicle('struck_down', { scarred: true });
    expect(mauledAgain.out.fightState.ending).toMatchObject({ face: 'mauled', scarWritten: false });
    expect(mauledAgain.tickEvents[0].message).toBe('The Gnawer struck Oswen down at The Maw.');

    const mauled = chronicle('struck_down');
    expect(mauled.tickEvents[0].message).toBe('The Gnawer struck Oswen down at The Maw; Oswen will carry the scar.');
  });

  it('a foe with no node is named as its foe', () => {
    const { tickEvents } = chronicle('yielded', {}, null);
    expect(tickEvents[0].message).toBe('Oswen gave ground to its foe at The Maw.');
  });

  it('every face has a line, and the line fills all three slots', () => {
    for (const face of Object.keys(FIGHT_CHRONICLE_LINES) as Array<keyof typeof FIGHT_CHRONICLE_LINES>) {
      const line = fightChronicleLine(face, { scarWritten: true, reward: { templateId: 't', instanceId: 'i', tier: 1 } }, { fighter: 'A', opponent: 'B', place: 'C' });
      expect(line).not.toMatch(/\{|\}/);
    }
  });

  it('the fighter branch is the only one that emits the event', () => {
    const state = baseState(world());
    const out = onFightEnded(state, fightAction('overcome'), ctxFor(state), [fighterEndingBranch]);
    expect(out.events.map(e => e.type)).toEqual(['fight_ended']);
  });
});

describe('THR-1549 — the record equals the trace', () => {
  it('reward, reputation, drift and significance on the record match the fight.ending trace', () => {
    const state = baseState(world());
    const out = end(state, 'bargained');
    const trace = (getTraces() as unknown as Array<Record<string, unknown>>).filter(t => t.category === 'fight.ending').pop()!;
    const ending = out.fightState.ending!;
    expect(trace.reward).toEqual(ending.reward);
    expect(trace.drift).toEqual(ending.drift);
    expect(trace.eventSignificance).toBe(ending.eventSignificance);
  });
});
