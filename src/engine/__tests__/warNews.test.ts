/**
 * War news from state — THR-1564.
 *
 * The war used to reach the player through a phase that read the trace buffer, and
 * tracing is off unless the debug panel is open — so in normal play no line was ever
 * written. These arms run with tracing **disabled** (the state the player is in) and
 * drive the real war writers: `spawnArmy`, `disbandArmy`, `phaseArmyAttrition`,
 * `createBattleNode`, `createSiegeNode`, `resolveBattle`, `applyConquestOrVacuum`.
 * Nothing is hand-fed a trace.
 *
 * Plan doc: Docs/plans/2026-09-24-thr-1564-war-news-from-state.md § Done when.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { spawnArmy } from '../armySpawning';
import { disbandArmy, phaseArmyAttrition, COHESION_THRESHOLDS } from '../armyAttrition';
import { createBattleNode, resolveBattle } from '../battleResolution';
import { createSiegeNode } from '../siegeResolution';
import { applyConquestOrVacuum } from '../battleAftermath';
import {
  WAR_NEWS_CHRONICLE_SIGNIFICANCE,
  WAR_NEWS_QUIET_SIGNIFICANCE,
  WAR_NEWS_ATTRITION_SIGNIFICANCE,
  WAR_NEWS_STRANGERS_ENDINGS_IN_CHRONICLE,
  getWarNewsEvents,
  battleOutcomeSentence,
  reportWar,
} from '../armyNotifications';
import { enableTracing, disableTracing, clearTraces, getTraces, isTracingEnabled } from '../traceBuffer';
import { REALM_TERRITORY_EVENT_SIGNIFICANCE } from '../../data/realm-content';
import type { GameState, TickEvent } from '../../types/gameState';
import type { ArmyState } from '../../types/army';
import type { BattleState, BattleResolutionType } from '../../types/battle';

const TICK = 10;

/** Every war line any arm produced — the Law 13 sweep reads these. */
const allMessages: string[] = [];

interface WarWorld {
  state: GameState;
  graph: WorldGraph;
}

/**
 * Two factions, two commanders at a field, and a town the second faction holds.
 * `threadCommanderA` threads the ascendant to the first commander *only* — the
 * commander is deliberately not a member of their faction, so the thread reaches the
 * line through the commander alone. That is what makes "judged before the aftermath"
 * observable: kill the commander and the thread is gone.
 */
function buildWorld(opts: { threadCommanderA?: boolean; seed?: number } = {}): WarWorld {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'f_a', type: 'actor', name: 'the hold of Amber', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'f_b', type: 'actor', name: 'Brightwater', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'loc_field', type: 'location', name: 'Greyfield', properties: { locationSubtype: 'village', hexCol: 1, hexRow: 1 } });
  graph.addNode({ id: 'loc_town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 1, prosperity: 0.6 } });
  graph.addEdge({ id: 'e_controls_town', source: 'f_b', target: 'loc_town', type: 'controls', properties: { role: 'seat' } });
  for (const [id, name] of [['cmd_a', 'Kael'], ['cmd_b', 'Mira']] as const) {
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `e_loc_${id}`, source: id, target: 'loc_field', type: 'located_at', properties: {} });
  }
  graph.addEdge({ id: 'e_mem_cmd_b', source: 'cmd_b', target: 'f_b', type: 'member_of', properties: { role: 'member', rank: 0.5, joinedTick: 0 } });
  for (const id of ['amb_a', 'amb_b']) {
    graph.addNode({ id, type: 'ambition', name: id, properties: { ambitionType: 'territorial_expansion' } });
  }
  if (opts.threadCommanderA) {
    graph.addEdge({ id: 'e_thread_a', source: 'asc', target: 'cmd_a', type: 'thread', properties: {} });
  }
  const state = {
    tick: TICK,
    seed: opts.seed ?? 42,
    graph,
    ascendantId: 'asc',
    tickEvents: [] as TickEvent[],
    recentEvents: [],
    chronicleEntries: [],
  } as unknown as GameState;
  return { state, graph };
}

function raiseBoth(w: WarWorld): { armyA: string; armyB: string } {
  const armyA = spawnArmy(w.state, 'f_a', 'cmd_a', 'amb_a');
  const armyB = spawnArmy(w.state, 'f_b', 'cmd_b', 'amb_b');
  expect(armyA).toBeTruthy();
  expect(armyB).toBeTruthy();
  return { armyA: armyA!, armyB: armyB! };
}

function setBattle(w: WarWorld, battleId: string, patch: Partial<BattleState>): void {
  const node = w.graph.getNode(battleId)!;
  w.graph.updateNode(battleId, {
    properties: { battleState: { ...(node.properties.battleState as BattleState), ...patch } },
  });
}

function setCohesion(w: WarWorld, armyId: string, fraction: number): void {
  const node = w.graph.getNode(armyId)!;
  const as = node.properties.armyState as ArmyState;
  w.graph.updateNode(armyId, {
    properties: { armyState: { ...as, cohesion: as.cohesionMax * fraction } },
  });
}

function news(w: WarWorld, type?: TickEvent['type']): TickEvent[] {
  const events = getWarNewsEvents(w.state).filter(e => !type || e.type === type);
  allMessages.push(...events.map(e => e.message));
  return events;
}

beforeEach(() => { clearTraces(); disableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('war news is written with tracing off (THR-1564)', () => {
  it('runs with tracing disabled — the precondition every arm below relies on', () => {
    expect(isTracingEnabled()).toBe(false);
  });

  it('an army raised: chronicle when threaded, quiet for strangers', () => {
    const w = buildWorld({ threadCommanderA: true });
    raiseBoth(w);
    const raised = news(w, 'army_mobilization');
    expect(raised).toHaveLength(2);
    expect(raised[0].message).toBe('The hold of Amber raises an army under Kael.');
    expect(raised[0].significance).toBe(WAR_NEWS_CHRONICLE_SIGNIFICANCE);
    expect(raised[0].tick).toBe(TICK);
    expect(raised[1].message).toBe('Brightwater raises an army under Mira.');
    expect(raised[1].significance).toBe(WAR_NEWS_QUIET_SIGNIFICANCE);
    // Law 2: the producer declares what the line is about.
    expect(raised[0].refs?.map(r => r.id)).toEqual(['loc_field', 'f_a', 'cmd_a']);
    expect(raised[0].id).toMatch(/^evt_war_army_raised_/);
  });

  it('a faction threaded through a member reads as threaded', () => {
    const w = buildWorld();
    w.graph.addEdge({ id: 'e_thread_b', source: 'asc', target: 'cmd_b', type: 'thread', properties: {} });
    spawnArmy(w.state, 'f_b', 'cmd_b', 'amb_b');
    expect(news(w, 'army_mobilization')[0].significance).toBe(WAR_NEWS_CHRONICLE_SIGNIFICANCE);
  });

  it('battle joined, in the same tick, at the place', () => {
    const w = buildWorld({ threadCommanderA: true });
    const { armyA, armyB } = raiseBoth(w);
    const battleId = createBattleNode(w.state, armyA, armyB, 'loc_field');
    expect(battleId).toBeTruthy();
    const joined = news(w, 'battle_started');
    expect(joined).toHaveLength(1);
    expect(joined[0].message).toBe('The hold of Amber and Brightwater meet in battle at Greyfield.');
    expect(joined[0].significance).toBe(WAR_NEWS_CHRONICLE_SIGNIFICANCE);
    expect(joined[0].hexCoords).toEqual({ col: 1, row: 1 });
  });

  it('a strangers\' battle joined stays quiet', () => {
    const w = buildWorld();
    const { armyA, armyB } = raiseBoth(w);
    createBattleNode(w.state, armyA, armyB, 'loc_field');
    expect(news(w, 'battle_started')[0].significance).toBe(WAR_NEWS_QUIET_SIGNIFICANCE);
  });

  it.each<[BattleResolutionType, string]>([
    ['attacker_victory', 'The hold of Amber broke Brightwater at Greyfield.'],
    ['defender_victory', 'Brightwater broke the hold of Amber at Greyfield.'],
    ['stalemate', 'The hold of Amber and Brightwater fought to a standstill at Greyfield.'],
    ['mutual_destruction', 'The hold of Amber and Brightwater destroyed each other at Greyfield.'],
  ])('a field battle ends (%s)', (resolution, line) => {
    const w = buildWorld();
    const { armyA, armyB } = raiseBoth(w);
    const battleId = createBattleNode(w.state, armyA, armyB, 'loc_field')!;
    resolveBattle(w.state, battleId, resolution);
    const ended = news(w, 'battle_resolved');
    expect(ended).toHaveLength(1);
    expect(ended[0].message).toBe(line);
    // Strangers' endings reach the chronicle (the loudness lever).
    expect(ended[0].significance).toBe(WAR_NEWS_STRANGERS_ENDINGS_IN_CHRONICLE
      ? WAR_NEWS_CHRONICLE_SIGNIFICANCE : WAR_NEWS_QUIET_SIGNIFICANCE);
    // The aftermath's disbanding of the loser is told by the ending, not again.
    expect(news(w, 'army_disbanded')).toHaveLength(0);
  });

  it('a siege laid, and each way a siege that does not take its town ends', () => {
    const cases: Array<[BattleResolutionType, number, string]> = [
      ['defender_victory', -3, 'Ashford held against the hold of Amber.'],
      ['attacker_victory', 7, 'The hold of Amber broke into Ashford but could not hold it.'],
      ['stalemate', 0, 'The siege of Ashford by the hold of Amber ends in a standstill.'],
    ];
    for (const [resolution, momentum, line] of cases) {
      const w = buildWorld();
      const { armyA } = raiseBoth(w);
      const siegeId = createSiegeNode(w.state, armyA, 'loc_town', 'loc_town')!;
      expect(siegeId).toBeTruthy();
      const laid = news(w, 'siege_established');
      expect(laid).toHaveLength(1);
      expect(laid[0].message).toBe('The hold of Amber lays siege to Ashford.');
      expect(laid[0].significance).toBe(WAR_NEWS_QUIET_SIGNIFICANCE);

      setBattle(w, siegeId, { momentum });
      resolveBattle(w.state, siegeId, resolution);
      const ended = news(w, 'battle_resolved');
      expect(ended.map(e => e.message)).toEqual([line]);
    }
  });

  it('one line per event: a siege that takes its town is told by the territory line alone', () => {
    const w = buildWorld();
    const { armyA } = raiseBoth(w);
    const siegeId = createSiegeNode(w.state, armyA, 'loc_town', 'loc_town')!;
    // Total severity — the sack threshold at which the town changes hands.
    setBattle(w, siegeId, { momentum: 12 });
    resolveBattle(w.state, siegeId, 'attacker_victory');

    // Non-vacuity: the town really did change hands.
    const holder = w.graph.getIncomingEdges('loc_town', 'controls')[0]?.source;
    expect(holder).toBe('f_a');

    expect(news(w, 'battle_resolved')).toHaveLength(0);
    const territory = news(w, 'realm_territory_change');
    expect(territory).toHaveLength(1);
    expect(territory[0].message).toBe('The hold of Amber takes Ashford from Brightwater.');
    expect(territory[0].significance).toBe(REALM_TERRITORY_EVENT_SIGNIFICANCE);
    expect(REALM_TERRITORY_EVENT_SIGNIFICANCE).toBeGreaterThanOrEqual(0.8);
  });

  it('a town claimed and a town lost each read as a line', () => {
    const w = buildWorld();
    const { armyA } = raiseBoth(w);
    w.graph.removeEdge('e_controls_town');
    applyConquestOrVacuum(w.state, 'loc_town', armyA);
    expect(news(w, 'realm_territory_change').map(e => e.message)).toEqual(['The hold of Amber takes Ashford.']);

    const v = buildWorld();
    v.graph.addNode({ id: 'horde', type: 'actor', name: 'Horde', properties: { actorType: 'group', groupKind: 'army' } });
    applyConquestOrVacuum(v.state, 'loc_town', 'horde');
    expect(news(v, 'realm_territory_change').map(e => e.message)).toEqual(['Brightwater loses Ashford.']);
  });

  it('an army broken apart by attrition: a line, chronicle when threaded', () => {
    const w = buildWorld({ threadCommanderA: true });
    const { armyA } = raiseBoth(w);
    disbandArmy(w.state, armyA, 'attrition');
    const broken = news(w, 'army_disbanded');
    expect(broken).toHaveLength(1);
    expect(broken[0].message).toBe('The hold of Amber\'s army under Kael breaks apart.');
    expect(broken[0].significance).toBe(WAR_NEWS_CHRONICLE_SIGNIFICANCE);
    expect(w.graph.getNode(armyA)).toBeUndefined();
  });

  it('an army fraying is recorded at the threshold crossing, never shown', () => {
    const w = buildWorld({ threadCommanderA: true });
    const { armyA } = raiseBoth(w);
    setCohesion(w, armyA, COHESION_THRESHOLDS.strained + 0.001);
    phaseArmyAttrition(w.state);
    const fraying = news(w, 'army_attrition');
    expect(fraying).toHaveLength(1);
    expect(fraying[0].message).toBe('The hold of Amber\'s army under Kael is starting to fray.');
    expect(fraying[0].significance).toBe(WAR_NEWS_ATTRITION_SIGNIFICANCE);
    expect(fraying[0].significance).toBeLessThan(0.8);
  });
});

describe('visibility is judged before the aftermath (THR-1564)', () => {
  /**
   * The thread reaches the line only through the losing commander (see buildWorld).
   * A total defeat kills that commander 30% of the time. The seed is searched, not
   * guessed, so the arm is deterministic and cannot pass on a surviving commander.
   */
  it('a threaded mortal\'s army that loses — and whose commander dies — still reads as threaded', () => {
    let found = false;
    for (let seed = 1; seed <= 60 && !found; seed++) {
      const w = buildWorld({ threadCommanderA: true, seed });
      const { armyA, armyB } = raiseBoth(w);
      const battleId = createBattleNode(w.state, armyA, armyB, 'loc_field')!;
      setBattle(w, battleId, { momentum: -12 });
      setCohesion(w, armyA, 0.05);
      w.state.tickEvents.length = 0;

      enableTracing();
      clearTraces();
      resolveBattle(w.state, battleId, 'defender_victory');
      const reported = getTraces().filter(t => t.category === 'war.reported') as unknown as Array<Record<string, unknown>>;
      disableTracing();

      // Commander survived — not the case under test. A killed commander is retained as
      // deceased since THR-1566, so death reads off the mark, not off node absence.
      if (w.graph.getNode('cmd_a')?.properties.deceased !== true) continue;
      found = true;
      const ended = reported.filter(t => t.kind === 'battle_ended');
      expect(ended).toHaveLength(1);
      expect(ended[0].threaded).toBe(true);
      expect(news(w, 'battle_resolved')).toHaveLength(1);
    }
    expect(found).toBe(true);
  });
});

describe('fail-soft and determinism (THR-1564)', () => {
  it('spawnArmy on a bare worldgen state writes nothing and does not throw', () => {
    const w = buildWorld();
    const bare = { graph: w.graph, tick: 0 } as unknown as GameState;
    expect(() => spawnArmy(bare, 'f_a', 'cmd_a', 'amb_a')).not.toThrow();
    expect((bare as unknown as { tickEvents?: unknown }).tickEvents).toBeUndefined();
  });

  it('a report that cannot read its names still writes a line in generic words', () => {
    const w = buildWorld();
    reportWar(w.state, { kind: 'army_raised', side: { armyId: 'ghost' } });
    expect(news(w, 'army_mobilization').map(e => e.message)).toEqual(['A nameless host raises an army.']);
  });

  it('tracing on and tracing off write identical war lines', () => {
    const run = (tracing: boolean): string[] => {
      if (tracing) enableTracing(); else disableTracing();
      const w = buildWorld({ threadCommanderA: true });
      const { armyA, armyB } = raiseBoth(w);
      const battleId = createBattleNode(w.state, armyA, armyB, 'loc_field')!;
      resolveBattle(w.state, battleId, 'attacker_victory');
      const siegeId = createSiegeNode(w.state, armyA, 'loc_town', 'loc_town')!;
      setBattle(w, siegeId, { momentum: 12 });
      resolveBattle(w.state, siegeId, 'attacker_victory');
      disableTracing();
      return w.state.tickEvents.map(e => `${e.id}|${e.type}|${e.significance}|${e.message}`);
    };
    const off = run(false);
    const on = run(true);
    expect(off.length).toBeGreaterThanOrEqual(5);
    expect(on).toEqual(off);
  });
});

describe('Law 13 — no war line carries a number (THR-1564)', () => {
  it('no line any arm above produced contains a digit', () => {
    expect(allMessages.length).toBeGreaterThan(10);
    for (const m of allMessages) expect(m).not.toMatch(/\d/);
  });

  it('no ending sentence contains a digit, across every type and outcome', () => {
    const resolutions: BattleResolutionType[] = ['attacker_victory', 'defender_victory', 'stalemate', 'mutual_destruction'];
    for (const battleType of ['field_battle', 'siege'] as const) {
      for (const resolution of resolutions) {
        const named = battleOutcomeSentence({ battleType, resolution, attackerName: 'A', defenderName: 'B', placeName: 'P', townName: 'T' });
        const bare = battleOutcomeSentence({ battleType, resolution });
        expect(named).not.toMatch(/\d/);
        expect(bare).not.toMatch(/\d/);
        expect(bare.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('a siege whose besiegers broke apart first (THR-1564)', () => {
  it('is told without them, never as a nameless host', () => {
    const w = buildWorld();
    const { armyA } = raiseBoth(w);
    const siegeId = createSiegeNode(w.state, armyA, 'loc_town', 'loc_town')!;
    disbandArmy(w.state, armyA, 'attrition');
    w.state.tickEvents.length = 0;
    resolveBattle(w.state, siegeId, 'defender_victory');
    const lines = news(w, 'battle_resolved').map(e => e.message);
    expect(lines).toEqual(['The siege of Ashford is lifted.']);
    expect(lines[0]).not.toMatch(/nameless/);
  });
});
