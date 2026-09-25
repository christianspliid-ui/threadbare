/**
 * THR-1547 — Monsters M4: walking into the lair (plan doc
 * `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 6).
 *
 * Covers the slice's Done-when: arrival at a lair node or a place inside it spawns
 * `fight.lair.confront` against the monster; hex co-presence does not; the cooldown
 * holds and stores expiry ticks (the plan doc 5 amendment); no trigger for a dead
 * monster, a busy mortal or the god's avatar; a hunter arriving for the named-elite
 * hunt is skipped and never gets a back-to-back confront; the pair key is the sorted
 * join; expired entries are pruned on write.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { phaseMovement, resetMovementEventCounter } from '../../phaseMovement';
import {
  checkLairArrival,
  fightPairKey,
  isFightPairOnCooldown,
  writeFightCooldown,
} from '../lairArrivalTrigger';
import { resetUnifiedActionCounter } from '../../unifiedActionLifecycle';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { FIGHT_TRIGGER_COOLDOWN_TICKS } from '../../../data/fight-constants';
import { FIGHT_LAIR_CONFRONT_ID } from '../../../data/encounters/fight-lair-confront';
import type { GameState } from '../../../types/gameState';
import type { MovementState } from '../../../types/movement';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { FightTriggerTrace } from '../../../types/traces/monster-traces';

const TICK = 100;
const HUNT_ID = 'monster.hunt.named_elite';
const midRng = () => 0.5;

function baseState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    pendingEncounterSeeds: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    effectStates: new Map(),
    ...overrides,
  } as unknown as GameState;
}

/**
 * A major lair with its monster, a place inside the lair, a settlement on the lair's
 * own hex, a road stop one hex out, and a wanderer standing at the road stop.
 */
function lairWorld(opts: { elite?: boolean; eliteDeceased?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'lair', type: 'location', name: 'The Black Den',
    properties: {
      locationSubtype: 'lair', lairTier: 'major', hexCol: 3, hexRow: 3,
      ...(opts.elite === false ? {} : { namedEliteId: 'beast' }),
    },
  });
  graph.addNode({
    id: 'lair-cave', type: 'location', name: 'Inner Cave',
    properties: { parentLocationId: 'lair', hexCol: 3, hexRow: 3 },
  });
  graph.addNode({
    id: 'hamlet', type: 'location', name: 'Denside',
    properties: { locationSubtype: 'hamlet', hexCol: 3, hexRow: 3 },
  });
  graph.addNode({
    id: 'road', type: 'location', name: 'Waystone',
    properties: { locationSubtype: 'ruins', hexCol: 4, hexRow: 3 },
  });
  for (const dest of ['lair', 'hamlet']) {
    graph.addEdge({ id: `e.road.${dest}`, source: 'road', target: dest, type: 'adjacent', properties: {} });
  }
  graph.addNode({
    id: 'wanderer', type: 'actor', name: 'Wanderer',
    properties: { actorType: 'individual' },
  });
  graph.addEdge({ id: 'e.wanderer.at', source: 'wanderer', target: 'road', type: 'located_at', properties: {} });
  if (opts.elite !== false) {
    graph.addNode({
      id: 'beast', type: 'actor', name: 'Grakk the Hollow',
      properties: {
        actorType: 'individual', isMonsterElite: true,
        monsterState: { family: 'beast', dread: 'fair', might: 'steep', clockSize: 4, clockFilled: 0, clockUpdatedTick: 0, temperShown: false },
        ...(opts.eliteDeceased ? { deceased: true } : {}),
      },
    });
    graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'lair', type: 'located_at', properties: {} });
  }
  return graph;
}

/** Put the wanderer one step from `destinationId`, arriving this tick. */
function walkTo(graph: WorldGraph, destinationId: string, extra: Partial<MovementState> = {}): void {
  const node = graph.getNode('wanderer')!;
  node.properties.movementState = {
    destinationId,
    movementQueue: [destinationId],
    ticksAccumulated: 0,
    currentEdgeCost: 1,
    lastDecisionTick: TICK,
    movementHistory: [],
    ...extra,
  } as MovementState;
}

/** Move the wanderer to `locationId` directly (bypassing movement). */
function placeAt(graph: WorldGraph, locationId: string): void {
  for (const e of graph.getOutgoingEdges('wanderer', 'located_at')) graph.removeEdge(e.id);
  graph.addEdge({ id: `e.wanderer.at.${locationId}`, source: 'wanderer', target: locationId, type: 'located_at', properties: {} });
}

function triggerTraces(): FightTriggerTrace[] {
  return getTraces().filter(t => t.category === 'fight.trigger') as FightTriggerTrace[];
}

beforeEach(() => {
  resetMovementEventCounter();
  resetUnifiedActionCounter();
  clearTraces();
  enableTracing();
});
afterEach(() => {
  disableTracing();
  clearTraces();
});

// ─── The key and the cooldown map ───────────────────────────────

describe('fightPairKey', () => {
  it('is the sorted join, the same from either side', () => {
    expect(fightPairKey('wanderer', 'beast')).toBe('beast|wanderer');
    expect(fightPairKey('beast', 'wanderer')).toBe('beast|wanderer');
  });
});

describe('fight cooldowns store expiry ticks', () => {
  it('a pair is on cooldown while tick < expiry, and off from the expiry tick on', () => {
    const map = { 'a|b': 125 };
    expect(isFightPairOnCooldown(map, 'a|b', 124)).toBe(true);
    expect(isFightPairOnCooldown(map, 'a|b', 125)).toBe(false);
    expect(isFightPairOnCooldown(undefined, 'a|b', 0)).toBe(false);
  });

  it('prunes only expired entries on write — an 80-tick grudge cooldown survives a lair write 30 ticks later', () => {
    const grudge = { 'x|y': 100 + 80, 'old|pair': 110 };
    const next = writeFightCooldown(grudge, 'a|b', 130 + FIGHT_TRIGGER_COOLDOWN_TICKS, 130);
    expect(next['x|y']).toBe(180);
    expect(next['old|pair']).toBeUndefined();
    expect(next['a|b']).toBe(155);
    // Not mutated in place.
    expect(grudge['old|pair']).toBe(110);
  });
});

// ─── Through phaseMovement ──────────────────────────────────────

describe('walking into the lair (phaseMovement)', () => {
  it('arrival at the lair node spawns fight.lair.confront targeting its monster', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair');
    const state = baseState(graph);
    const delta = phaseMovement(state);

    const spawned = delta.unifiedActions ?? [];
    expect(spawned).toHaveLength(1);
    expect(spawned[0]).toMatchObject({
      actorId: 'wanderer', templateId: FIGHT_LAIR_CONFRONT_ID, targetId: 'beast', source: 'system', resolved: false,
    });
    expect(delta.fightCooldowns).toEqual({ 'beast|wanderer': TICK + FIGHT_TRIGGER_COOLDOWN_TICKS });
    const traces = triggerTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      source: 'lair_arrival', mortalId: 'wanderer', monsterId: 'beast', lairId: 'lair', actionId: spawned[0].actionId,
    });
    expect(traces[0].skipped).toBeUndefined();
  });

  it('arrival at a place inside the lair resolves to the lair and triggers', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair', { targetSublocationId: 'lair-cave' });
    const delta = phaseMovement(baseState(graph));
    expect(graph.getOutgoingEdges('wanderer', 'located_at')[0].target).toBe('lair-cave');
    expect(delta.unifiedActions?.map(a => a.targetId)).toEqual(['beast']);
    expect(triggerTraces()[0].lairId).toBe('lair');
  });

  it('hex co-presence does not trigger: arriving at a settlement on the lair hex', () => {
    const graph = lairWorld();
    walkTo(graph, 'hamlet');
    const delta = phaseMovement(baseState(graph));
    expect(delta.unifiedActions).toBeUndefined();
    expect(triggerTraces()).toHaveLength(0);
  });

  it('a mortal still on the road (not arrived) is not checked', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair', { currentEdgeCost: 10 });
    const delta = phaseMovement(baseState(graph));
    expect(delta.unifiedActions).toBeUndefined();
    expect(triggerTraces()).toHaveLength(0);
  });

  it('the cooldown holds: a pair confronted within the window is skipped', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair');
    const delta = phaseMovement(baseState(graph, { fightCooldowns: { 'beast|wanderer': TICK + 5 } }));
    expect(delta.unifiedActions).toBeUndefined();
    expect(triggerTraces()[0].skipped).toBe('cooldown');
  });

  it('an expired cooldown does not block, and is pruned when the new entry is written', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair');
    const delta = phaseMovement(baseState(graph, {
      fightCooldowns: { 'beast|wanderer': TICK, 'x|y': TICK + 60 },
    }));
    expect(delta.unifiedActions).toHaveLength(1);
    expect(delta.fightCooldowns).toEqual({ 'beast|wanderer': TICK + FIGHT_TRIGGER_COOLDOWN_TICKS, 'x|y': TICK + 60 });
  });

  it('a dead monster never triggers (skipped: monster_dead)', () => {
    const graph = lairWorld({ eliteDeceased: true });
    walkTo(graph, 'lair');
    const delta = phaseMovement(baseState(graph));
    expect(delta.unifiedActions).toBeUndefined();
    expect(triggerTraces()[0].skipped).toBe('monster_dead');
  });

  it('a lair with no named elite is silent', () => {
    const graph = lairWorld({ elite: false });
    walkTo(graph, 'lair');
    expect(phaseMovement(baseState(graph)).unifiedActions).toBeUndefined();
    expect(triggerTraces()).toHaveLength(0);
  });

  it('a busy mortal is not confronted (skipped: busy)', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair');
    const busy = { actionId: 'ua-x', actorId: 'wanderer', templateId: 'x', resolved: false } as UnifiedAction;
    const delta = phaseMovement(baseState(graph, { unifiedActions: [busy] }));
    expect(delta.unifiedActions).toBeUndefined();
    expect(triggerTraces()[0].skipped).toBe('busy');
  });

  it("the god's avatar is never confronted (skipped: avatar)", () => {
    const graph = lairWorld();
    graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
    graph.addEdge({ id: 'e.avatar', source: 'wanderer', target: 'asc-1', type: 'avatar_of', properties: {} });
    walkTo(graph, 'lair');
    const delta = phaseMovement(baseState(graph));
    expect(delta.unifiedActions).toBeUndefined();
    expect(triggerTraces()[0].skipped).toBe('avatar');
  });

  it('a hunter arriving for the named-elite hunt is skipped, and gets no confront on later ticks', () => {
    const graph = lairWorld();
    walkTo(graph, 'lair', { targetEncounterId: HUNT_ID });
    const first = phaseMovement(baseState(graph));
    expect(first.unifiedActions).toBeUndefined();
    expect(triggerTraces()[0].skipped).toBe('arriving_for_hunt');

    // The hunter stays in the lair, takes up the hunt and finishes it. Standing
    // there is not an arrival, so no confront follows the hunt.
    clearTraces();
    const hunt = { actionId: 'ua-hunt', actorId: 'wanderer', templateId: HUNT_ID, targetId: 'lair', resolved: true } as UnifiedAction;
    for (let t = 1; t <= 3; t++) {
      const later = phaseMovement(baseState(graph, { tick: TICK + t, unifiedActions: [hunt] }));
      expect(later.unifiedActions).toBeUndefined();
    }
    expect(triggerTraces()).toHaveLength(0);
  });

  it('a monster walking home is not a candidate', () => {
    const graph = lairWorld();
    const beast = graph.getNode('beast')!;
    for (const e of graph.getOutgoingEdges('beast', 'located_at')) graph.removeEdge(e.id);
    graph.addEdge({ id: 'e.beast.road', source: 'beast', target: 'road', type: 'located_at', properties: {} });
    beast.properties.movementState = {
      destinationId: 'lair', movementQueue: ['lair'], ticksAccumulated: 0, currentEdgeCost: 1, lastDecisionTick: TICK, movementHistory: [],
    } as MovementState;
    expect(phaseMovement(baseState(graph)).unifiedActions).toBeUndefined();
    expect(triggerTraces()).toHaveLength(0);
  });
});

// ─── The check directly ─────────────────────────────────────────

describe('checkLairArrival', () => {
  it('reads the actions it is handed, so a confront spawned earlier this phase makes the mortal busy', () => {
    const graph = lairWorld();
    placeAt(graph, 'lair');
    const state = baseState(graph);
    const first = checkLairArrival(state, 'wanderer', { actions: [], fightCooldowns: undefined, rng: midRng });
    expect(first.action).toBeDefined();
    const second = checkLairArrival(state, 'wanderer', {
      actions: [first.action!], fightCooldowns: undefined, rng: midRng,
    });
    expect(second.skipped).toBe('busy');
  });

  it('a non-hunt encounter target does not count as hunting', () => {
    const graph = lairWorld();
    placeAt(graph, 'lair');
    const result = checkLairArrival(baseState(graph), 'wanderer', {
      actions: [], fightCooldowns: undefined, rng: midRng, targetEncounterId: 'monster.hunt.minor',
    });
    expect(result.action?.templateId).toBe(FIGHT_LAIR_CONFRONT_ID);
  });
});
