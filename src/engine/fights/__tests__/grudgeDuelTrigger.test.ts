/**
 * THR-1558 — Duels E3: grudges boil over (plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` §6).
 *
 * The slice's Done-when, one `it` each: an injury-class grudge pair spawns at the
 * expected rate; `old_quarrel` never spawns; the cooldown holds; a threaded mortal is
 * always the actor; existing `agent_encounter` detections are identical with the
 * trigger on and off; a duel's opponent is busy from the spawn, before `fightState`
 * exists; a company march does not move a duellist; no mortal is picked for two duels
 * in one pass; the avatar never duels; a grudge pair's cooldown survives a lair write
 * and another pair's write 26–79 ticks later; a mortal already in a fight, as actor or
 * opponent, is never picked. Plus: skip traces are bounded to once per window.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { phaseColocationDetection, resetColocationEventCounter } from '../../phaseColocationDetection';
import {
  grudgeEscalationChance,
  grudgeEscalationRng,
  isGrudgeSkipTraceTick,
  pickDuelActor,
  runGrudgeDuels,
} from '../grudgeDuelTrigger';
import { anyInFight, fightParticipantIds } from '../fightParticipants';
import { fightPairKey, isFightPairOnCooldown, writeFightCooldown } from '../../monsters/lairArrivalTrigger';
import { runGroupMovement } from '../../groups/groupMovement';
import { resetUnifiedActionCounter } from '../../unifiedActionLifecycle';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import {
  FIGHT_TRIGGER_COOLDOWN_TICKS,
  GRUDGE_DUEL_COOLDOWN_TICKS,
  GRUDGE_ESCALATION_BASE,
  GRUDGE_ESCALATION_MAX,
} from '../../../data/fight-constants';
import { FIGHT_DUEL_GRUDGE_ID } from '../../../data/encounters/fight-duel-grudge';
import type { GameState } from '../../../types/gameState';
import type { MovementState } from '../../../types/movement';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { FightTriggerGrudgeTrace } from '../../../types/traces/fight-traces';

const ASC = 'asc-1';

function baseState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 100, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: ASC, essencePool: {} as never,
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

function addMortal(graph: WorldGraph, id: string, at = 'square', courage = 0): void {
  graph.addNode({
    id, type: 'actor', name: id.toUpperCase(),
    properties: {
      actorType: 'individual',
      axiologicalProfile: { courage_prudence: courage },
      domainCapabilities: { eye: 20, shadow: 5 },
    },
  });
  graph.addEdge({ id: `e.${id}.at`, source: id, target: at, type: 'located_at', properties: {} });
}

/** A two-way grudge, as `writeGrudge` writes it. */
function grudge(graph: WorldGraph, a: string, b: string, cause = 'attempted_killing', oneWay = false): void {
  graph.addEdge({ id: `h.${a}.${b}`, source: a, target: b, type: 'hostile_to', properties: { cause } });
  if (!oneWay) graph.addEdge({ id: `h.${b}.${a}`, source: b, target: a, type: 'hostile_to', properties: { cause } });
}

/** A square with two co-located feuding mortals `a` and `b`. */
function feudWorld(opts: { cause?: string; courageA?: number; courageB?: number } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'square', type: 'location', name: 'Market Square', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  addMortal(graph, 'a', 'square', opts.courageA ?? 0);
  addMortal(graph, 'b', 'square', opts.courageB ?? 0);
  grudge(graph, 'a', 'b', opts.cause ?? 'attempted_killing');
  return graph;
}

function colocated(graph: WorldGraph): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of graph.getNodesByType('actor')) {
    if (n.properties.actorType !== 'individual') continue;
    const loc = graph.getOutgoingEdges(n.id, 'located_at')[0]?.target;
    if (!loc) continue;
    if (!out.has(loc)) out.set(loc, []);
    out.get(loc)!.push(n.id);
  }
  return out;
}

/** Fraction of `n` independent ticks on which the pair spawns (cooldowns reset each tick). */
function spawnRate(graph: WorldGraph, n: number): number {
  let hits = 0;
  for (let t = 1; t <= n; t++) {
    const res = runGrudgeDuels(baseState(graph, { tick: t }), colocated(graph));
    hits += res.spawned.length;
  }
  return hits / n;
}

function grudgeTraces(): FightTriggerGrudgeTrace[] {
  return getTraces().filter(
    (t) => t.category === 'fight.trigger' && (t as { source?: string }).source === 'grudge',
  ) as FightTriggerGrudgeTrace[];
}

/** The first tick ≥ `from` on which the pair's own stream rolls under `chance`. */
function firstHitTick(pairKey: string, chance: number, from = 1, seed = 42): number {
  for (let t = from; t < from + 10_000; t++) {
    if (grudgeEscalationRng(seed, t, pairKey)() < chance) return t;
  }
  throw new Error('no hit tick found');
}

beforeEach(() => {
  resetUnifiedActionCounter();
  resetColocationEventCounter();
  clearTraces();
  enableTracing();
});
afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('THR-1558 — the escalation chance', () => {
  it('scales with the braver side and clamps at GRUDGE_ESCALATION_MAX', () => {
    expect(grudgeEscalationChance(0)).toBeCloseTo(GRUDGE_ESCALATION_BASE);
    expect(grudgeEscalationChance(1)).toBeCloseTo(GRUDGE_ESCALATION_MAX);
    expect(grudgeEscalationChance(-1)).toBe(0);
    expect(grudgeEscalationChance(5)).toBeCloseTo(GRUDGE_ESCALATION_MAX);
  });

  it('an injury-class grudge pair spawns at the expected rate (4000 ticks, neutral and bold)', () => {
    const neutral = spawnRate(feudWorld(), 4000);
    expect(Math.abs(neutral - GRUDGE_ESCALATION_BASE)).toBeLessThan(0.012);
    // pairCourage is the HIGHER lean — one bold side is enough, whichever it is.
    const bold = spawnRate(feudWorld({ courageA: -0.2, courageB: 1 }), 4000);
    expect(Math.abs(bold - GRUDGE_ESCALATION_MAX)).toBeLessThan(0.015);
  });

  it('every injury provenance licenses a duel, and blood_drawn does too', () => {
    for (const cause of ['attempted_killing', 'mentorship_break', 'command_seized', 'usurpation_failed', 'grievance_cooled', 'blood_drawn']) {
      expect(spawnRate(feudWorld({ cause, courageA: 1 }), 400), cause).toBeGreaterThan(0);
    }
  });

  it('old_quarrel never spawns — it licenses rivalry, not blood', () => {
    expect(spawnRate(feudWorld({ cause: 'old_quarrel', courageA: 1 }), 4000)).toBe(0);
    expect(grudgeTraces()).toHaveLength(0);
  });

  it('a one-way grudge still licenses the duel (the faction_war plot survivor)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'square', type: 'location', name: 'Square', properties: { locationSubtype: 'town' } });
    addMortal(graph, 'a');
    addMortal(graph, 'b');
    grudge(graph, 'b', 'a', 'attempted_killing', true);
    expect(spawnRate(graph, 2000)).toBeGreaterThan(0);
  });
});

describe('THR-1558 — the spawn', () => {
  it('spawns fight.duel.grudge with a spawn trace, writes the expiry and returns the actions', () => {
    const graph = feudWorld();
    const key = fightPairKey('a', 'b');
    const t = firstHitTick(key, grudgeEscalationChance(0));
    const out = phaseColocationDetection(baseState(graph, { tick: t }));
    const actions = out.unifiedActions as UnifiedAction[];
    expect(actions).toHaveLength(1);
    expect(actions[0].templateId).toBe(FIGHT_DUEL_GRUDGE_ID);
    expect(actions[0].source).toBe('system');
    expect(new Set([actions[0].actorId, actions[0].targetId])).toEqual(new Set(['a', 'b']));
    expect(out.fightCooldowns?.[key]).toBe(t + GRUDGE_DUEL_COOLDOWN_TICKS);
    const [trace] = grudgeTraces();
    expect(trace).toMatchObject({ aggressorId: actions[0].actorId, grudgeCause: 'attempted_killing', actionId: actions[0].actionId });
    expect(trace.skipped).toBeUndefined();
    expect(trace.roll).toBeLessThan(trace.chance);
  });

  it('the cooldown holds for GRUDGE_DUEL_COOLDOWN_TICKS, then the pair can duel again', () => {
    const graph = feudWorld({ courageA: 1 });
    const key = fightPairKey('a', 'b');
    const t0 = firstHitTick(key, GRUDGE_ESCALATION_MAX);
    const first = runGrudgeDuels(baseState(graph, { tick: t0 }), colocated(graph));
    expect(first.spawned).toHaveLength(1);
    // The duel is over (resolved), so only the cooldown can hold the pair.
    const done = first.spawned.map((a) => ({ ...a, resolved: true }));
    let cooldowns = first.fightCooldowns;
    for (let t = t0 + 1; t < t0 + GRUDGE_DUEL_COOLDOWN_TICKS; t++) {
      const r = runGrudgeDuels(baseState(graph, { tick: t, unifiedActions: done, fightCooldowns: { ...cooldowns } }), colocated(graph));
      expect(r.spawned, `tick ${t}`).toHaveLength(0);
      cooldowns = r.fightCooldowns;
    }
    const next = firstHitTick(key, GRUDGE_ESCALATION_MAX, t0 + GRUDGE_DUEL_COOLDOWN_TICKS);
    const again = runGrudgeDuels(baseState(graph, { tick: next, unifiedActions: done, fightCooldowns: { ...cooldowns } }), colocated(graph));
    expect(again.spawned).toHaveLength(1);
  });

  it("a grudge pair's cooldown survives a lair write and another pair's write 26–79 ticks later", () => {
    const key = fightPairKey('a', 'b');
    const t0 = 100;
    let map = writeFightCooldown(undefined, key, t0 + GRUDGE_DUEL_COOLDOWN_TICKS, t0);
    for (const dt of [26, 50, 79]) {
      const t = t0 + dt;
      map = writeFightCooldown(map, fightPairKey('m', `beast${dt}`), t + FIGHT_TRIGGER_COOLDOWN_TICKS, t);
      map = writeFightCooldown(map, fightPairKey('c', `d${dt}`), t + GRUDGE_DUEL_COOLDOWN_TICKS, t);
      expect(isFightPairOnCooldown(map, key, t), `+${dt}`).toBe(true);
      expect(map[key]).toBe(t0 + GRUDGE_DUEL_COOLDOWN_TICKS);
    }
    expect(isFightPairOnCooldown(map, key, t0 + GRUDGE_DUEL_COOLDOWN_TICKS)).toBe(false);
  });
});

describe('THR-1558 — who is the actor', () => {
  it('a threaded mortal is always the actor, whatever the courage and ids say', () => {
    const graph = feudWorld({ courageA: 1, courageB: -1 });
    graph.addEdge({ id: 't.b', source: ASC, target: 'b', type: 'thread', properties: { courtPosition: 'watched' } });
    const state = baseState(graph);
    expect(pickDuelActor(state, 'a', 'b')).toEqual(['b', 'a']);
    expect(pickDuelActor(state, 'b', 'a')).toEqual(['b', 'a']);
    // And on every spawn the trigger makes, over many ticks.
    let spawns = 0;
    for (let t = 1; t <= 1500; t++) {
      for (const a of runGrudgeDuels(baseState(graph, { tick: t }), colocated(graph)).spawned) {
        expect(a.actorId).toBe('b');
        spawns++;
      }
    }
    expect(spawns).toBeGreaterThan(0);
  });

  it('both threaded: the higher court position; a dormant thread does not count', () => {
    const graph = feudWorld();
    graph.addEdge({ id: 't.a', source: ASC, target: 'a', type: 'thread', properties: { courtPosition: 'retinue' } });
    graph.addEdge({ id: 't.b', source: ASC, target: 'b', type: 'thread', properties: { courtPosition: 'the_first' } });
    expect(pickDuelActor(baseState(graph), 'a', 'b')).toEqual(['b', 'a']);

    const g2 = feudWorld({ courageA: 0.5 });
    g2.addEdge({ id: 't.b', source: ASC, target: 'b', type: 'thread', properties: { courtPosition: 'dormant' } });
    expect(pickDuelActor(baseState(g2), 'a', 'b')).toEqual(['a', 'b']);
  });

  it('unthreaded: the braver side, then the lower id', () => {
    expect(pickDuelActor(baseState(feudWorld({ courageB: 0.4 })), 'a', 'b')).toEqual(['b', 'a']);
    expect(pickDuelActor(baseState(feudWorld()), 'b', 'a')).toEqual(['a', 'b']);
  });
});

describe('THR-1558 — who never duels', () => {
  it('the avatar never duels', () => {
    const graph = feudWorld({ courageA: 1 });
    graph.addEdge({ id: 'av', source: 'a', target: ASC, type: 'avatar_of', properties: {} });
    expect(spawnRate(graph, 3000)).toBe(0);
  });

  it('a monster or a dead mortal never duels', () => {
    const g1 = feudWorld({ courageA: 1 });
    g1.getNode('b')!.properties.isMonsterElite = true;
    g1.getNode('b')!.properties.monsterState = { family: 'beast' };
    expect(spawnRate(g1, 2000)).toBe(0);
    const g2 = feudWorld({ courageA: 1 });
    g2.getNode('b')!.properties.deceased = true;
    expect(spawnRate(g2, 2000)).toBe(0);
  });

  it('a mortal with a movement queue is busy — they would walk off the hex', () => {
    const graph = feudWorld({ courageA: 1 });
    graph.getNode('a')!.properties.movementState = {
      destinationId: 'far', movementQueue: ['far'], ticksAccumulated: 0, currentEdgeCost: 1,
      lastDecisionTick: 0, movementHistory: [],
    } as MovementState;
    expect(spawnRate(graph, 2000)).toBe(0);
  });

  it('a mortal already in a fight, as actor or opponent, is never picked', () => {
    const graph = feudWorld({ courageA: 1 });
    addMortal(graph, 'c');
    grudge(graph, 'c', 'a');
    grudge(graph, 'c', 'b');
    // `c` is the OPPONENT of a freshly spawned duel with an outsider: no fightState yet.
    const asOpponent = { actionId: 'ua_x', actorId: 'z', targetId: 'c', templateId: FIGHT_DUEL_GRUDGE_ID, resolved: false } as unknown as UnifiedAction;
    // `a` is the ACTOR of a lair confront (a fight template by its steps).
    const asActor = { actionId: 'ua_y', actorId: 'a', targetId: 'beast', templateId: 'fight.lair.confront', resolved: false } as unknown as UnifiedAction;
    for (let t = 1; t <= 2000; t++) {
      const r = runGrudgeDuels(baseState(graph, { tick: t, unifiedActions: [asOpponent, asActor] }), colocated(graph));
      for (const s of r.spawned) {
        expect(s.actorId === 'a' || s.targetId === 'a', `tick ${t}`).toBe(false);
        expect(s.actorId === 'c' || s.targetId === 'c', `tick ${t}`).toBe(false);
      }
    }
  });

  it('no mortal is picked for two duels in one pass', () => {
    const graph = feudWorld({ courageA: 1 });
    addMortal(graph, 'c');
    grudge(graph, 'a', 'c');
    const kab = fightPairKey('a', 'b');
    const kac = fightPairKey('a', 'c');
    let t = 1;
    while (!(grudgeEscalationRng(42, t, kab)() < GRUDGE_ESCALATION_MAX && grudgeEscalationRng(42, t, kac)() < GRUDGE_ESCALATION_MAX)) t++;
    const r = runGrudgeDuels(baseState(graph, { tick: t }), colocated(graph));
    expect(r.spawned).toHaveLength(1);
    // Non-vacuity: with the first pair's spawn gone, the second one does hit this tick.
    graph.removeEdge('h.a.b');
    graph.removeEdge('h.b.a');
    expect(runGrudgeDuels(baseState(graph, { tick: t }), colocated(graph)).spawned).toHaveLength(1);
  });
});

describe('THR-1558 — one live fight per mortal (the busy set and the company hold)', () => {
  it("a duel's opponent is busy from the spawn, before fightState exists", () => {
    const graph = feudWorld();
    const t = firstHitTick(fightPairKey('a', 'b'), grudgeEscalationChance(0));
    const [duel] = runGrudgeDuels(baseState(graph, { tick: t }), colocated(graph)).spawned;
    expect(duel.fightState).toBeUndefined();
    const ids = fightParticipantIds([duel]);
    expect(ids.has(duel.actorId)).toBe(true);
    expect(ids.has(duel.targetId)).toBe(true);
    // Once the fight has run a step, `fightState.opponentId` is the key.
    const started = { ...duel, targetId: 'someone-else', fightState: { opponentId: duel.targetId } } as unknown as UnifiedAction;
    expect(fightParticipantIds([started]).has(duel.targetId)).toBe(true);
    // Resolved fights and non-fight actions hold nobody.
    expect(fightParticipantIds([{ ...duel, resolved: true }]).size).toBe(0);
    const chat = { ...duel, templateId: 'social.gossip.no_such_template' } as UnifiedAction;
    expect(fightParticipantIds([chat]).size).toBe(0);
  });

  it('a company march does not move a duellist — the company holds', () => {
    const build = (): WorldGraph => {
      const graph = new WorldGraph();
      for (const [id, col] of [['home', 1], ['far', 2]] as const) {
        graph.addNode({ id, type: 'location', name: id, properties: { locationSubtype: 'town', hexCol: col, hexRow: 1 } });
      }
      graph.addEdge({ id: 'adj1', source: 'home', target: 'far', type: 'adjacent', properties: { distance: 1 } });
      graph.addEdge({ id: 'adj2', source: 'far', target: 'home', type: 'adjacent', properties: { distance: 1 } });
      addMortal(graph, 'lead', 'home');
      addMortal(graph, 'duellist', 'home');
      graph.addNode({ id: 'co', type: 'actor', name: 'The Company', properties: { actorType: 'group', groupType: 'party', groupDestinationId: 'far' } });
      graph.addEdge({ id: 'cmd', source: 'co', target: 'lead', type: 'commanded_by', properties: {} });
      for (const m of ['lead', 'duellist']) {
        graph.addEdge({ id: `mo.${m}`, source: m, target: 'co', type: 'member_of', properties: { joinedTick: 0, role: 'member', rank: 0.5 } });
      }
      return graph;
    };
    const duel = { actionId: 'ua_d', actorId: 'rival', targetId: 'duellist', templateId: FIGHT_DUEL_GRUDGE_ID, resolved: false } as unknown as UnifiedAction;

    // Non-vacuity: with no duel, the en-route company re-snaps the duellist onto its path.
    const free = build();
    runGroupMovement(baseState(free), free.getNode('co')!);
    expect((free.getNode('duellist')!.properties.movementState as MovementState | undefined)?.movementQueue?.length ?? 0).toBeGreaterThan(0);

    const held = build();
    const res = runGroupMovement(baseState(held, { unifiedActions: [duel] }), held.getNode('co')!);
    expect(res.moved).toBe(false);
    expect(held.getNode('duellist')!.properties.movementState).toBeUndefined();
    expect(held.getNode('lead')!.properties.movementState).toBeUndefined();
    expect(anyInFight([duel], new Set(['duellist']))).toBe(true);
    expect(anyInFight([duel], new Set(['lead']))).toBe(false);
  });
});

describe('THR-1558 — determinism and the detection stream', () => {
  it('existing agent_encounter detections are identical with the trigger on and off', () => {
    const graph = feudWorld({ courageA: 1 });
    addMortal(graph, 'c');
    addMortal(graph, 'd');
    const t = firstHitTick(fightPairKey('a', 'b'), GRUDGE_ESCALATION_MAX);
    resetColocationEventCounter();
    const on = phaseColocationDetection(baseState(graph, { tick: t }));
    resetColocationEventCounter();
    const off = phaseColocationDetection(baseState(graph, { tick: t }), { grudgeDuels: false });
    expect((on.unifiedActions ?? []).length).toBe(1); // the trigger really rolled and spawned this tick
    expect(off.unifiedActions).toBeUndefined();
    expect(on.tickEvents).toEqual(off.tickEvents);
    expect((on.tickEvents ?? []).length).toBeGreaterThan(0);
  });

  it('the same seed and tick give the same spawn', () => {
    const t = firstHitTick(fightPairKey('a', 'b'), GRUDGE_ESCALATION_MAX);
    resetUnifiedActionCounter();
    const g1 = feudWorld({ courageA: 1 });
    const r1 = runGrudgeDuels(baseState(g1, { tick: t }), colocated(g1));
    resetUnifiedActionCounter();
    const g2 = feudWorld({ courageA: 1 });
    const r2 = runGrudgeDuels(baseState(g2, { tick: t }), colocated(g2));
    expect(r2.spawned).toEqual(r1.spawned);
  });

  it('skip traces are bounded to once per pair per cooldown window', () => {
    const graph = feudWorld({ courageA: 1 });
    const busyAction = { actionId: 'ua_busy', actorId: 'a', targetId: 'x', templateId: 'no.such.template', resolved: false } as unknown as UnifiedAction;
    for (let t = 1; t <= GRUDGE_DUEL_COOLDOWN_TICKS * 3; t++) {
      runGrudgeDuels(baseState(graph, { tick: t, unifiedActions: [busyAction] }), colocated(graph));
    }
    const skips = grudgeTraces().filter((tr) => tr.skipped === 'busy');
    expect(skips).toHaveLength(3);
    const key = fightPairKey('a', 'b');
    for (const s of skips) expect(isGrudgeSkipTraceTick(s.tick, key)).toBe(true);
  });
});
