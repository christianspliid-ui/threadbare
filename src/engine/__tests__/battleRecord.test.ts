/**
 * THR-1528 — a battle leaves its record on the ground it was fought over.
 *
 * Driven through the real `resolveBattle` (not the writer alone) so the ordering the
 * plan cares about is exercised: the record is written after the aftermath and before
 * the battle node's removal, from commanders captured before the aftermath. The writer
 * is called directly only for the commander-presence arms, whose fixtures the random
 * commander fate would otherwise decide.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { ArmyState } from '../../types/army';
import type { BattleState, BattleResolutionType } from '../../types/battle';
import type { BattleRecordedTrace } from '../../types/trace';
import { resolveBattle } from '../battleResolution';
import {
  recordBattleFought,
  describeBattleRecords,
  battleRecordId,
  BATTLE_OUTCOME_BY_RESOLUTION,
} from '../battleRecord';
import { LAST_BATTLE_TICK_PROPERTY, phaseLocationTraits } from '../phaseLocationTraits';
import { captureBattleForNews } from '../armyNotifications';
import { generateDetailPage } from '../detailPageGenerator';
import { seedEncounterTraitDefinitions } from '../traitDefinitionSeeding';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { LOCATION_TRAIT_IDS, BLOOD_SOAKED_WINDOW_TICKS } from '../../data/location-trait-constants';

// ─── Fixture ────────────────────────────────────────────────────────────────

function makeState(graph: WorldGraph, tick: number): GameState {
  return { tick, seed: 42, graph, tickEvents: [] } as unknown as GameState;
}

function addLocation(graph: WorldGraph, id: string, name: string, props: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'location', name, properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1, ...props } });
}

function addFaction(graph: WorldGraph, id: string, name: string): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'faction' } });
}

function addCommander(graph: WorldGraph, id: string, name: string): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
}

function addArmy(graph: WorldGraph, id: string, factionId: string, at: string, commanderId?: string): void {
  const armyState: ArmyState = {
    size: 'warband', headcount: 100, objective: null, cohesion: 30, cohesionMax: 30,
    raisedTick: 0, maintenanceCost: 2, thresholdsFired: [],
  };
  graph.addNode({ id, type: 'actor', name: `Army ${id}`, properties: { actorType: 'group', armyState } });
  graph.addEdge({ id: `mo_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army', rank: 0, joinedTick: 0 } });
  graph.addEdge({ id: `la_${id}`, source: id, target: at, type: 'located_at', properties: {} });
  if (commanderId) {
    graph.addEdge({ id: `cb_${id}`, source: id, target: commanderId, type: 'commanded_by', properties: {} });
  }
}

function addBattle(
  graph: WorldGraph,
  id: string,
  at: string,
  bs: Partial<BattleState> & Pick<BattleState, 'attackerArmyId' | 'defenderArmyId'>,
): BattleState {
  const state: BattleState = {
    battleType: 'field_battle', momentum: 0, backgroundProse: '', spotlightHistory: [],
    ticksSinceLastSpotlight: 0, startedTick: 3, initialMomentumOffset: 0, thresholdsFired: [],
    ...bs,
  };
  graph.addNode({ id, type: 'actor', name: `Battle ${id}`, properties: { actorType: 'group', groupKind: 'battle', battleState: state } });
  graph.addEdge({ id: `la_${id}`, source: id, target: at, type: 'located_at', properties: {} });
  return state;
}

/** Two factions, two commanded armies on a field; returns the battle id. */
function fieldBattleWorld(graph: WorldGraph): string {
  addLocation(graph, 'loc.ford', 'Grey Ford');
  addFaction(graph, 'fac.red', 'the Red Banner');
  addFaction(graph, 'fac.blue', 'the Blue Crown');
  addCommander(graph, 'cmd.a', 'Ser Arrow');
  addCommander(graph, 'cmd.d', 'Dame Shield');
  addArmy(graph, 'army.a', 'fac.red', 'loc.ford', 'cmd.a');
  addArmy(graph, 'army.d', 'fac.blue', 'loc.ford', 'cmd.d');
  addBattle(graph, 'battle_3_x', 'loc.ford', { attackerArmyId: 'army.a', defenderArmyId: 'army.d' });
  return 'battle_3_x';
}

function records(graph: WorldGraph) {
  return graph.getNodesByType('event').filter(n => n.properties.eventType === 'battle_fought');
}

function recordedTraces(): BattleRecordedTrace[] {
  return getTraces().filter((t): t is BattleRecordedTrace => t.category === 'battle_recorded');
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('recordBattleFought — through resolveBattle (THR-1528)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  const RESOLUTIONS: BattleResolutionType[] = ['attacker_victory', 'defender_victory', 'stalemate', 'mutual_destruction'];

  for (const resolution of RESOLUTIONS) {
    it(`a field battle ending in ${resolution} writes one record at its ground, stamped, with outcomes from the table`, () => {
      const graph = new WorldGraph();
      const battleId = fieldBattleWorld(graph);
      resolveBattle(makeState(graph, 20), battleId, resolution);

      expect(graph.getNode(battleId)).toBeUndefined();
      const recs = records(graph);
      expect(recs).toHaveLength(1);
      const rec = recs[0];
      expect(rec.id).toBe(battleRecordId(battleId));
      expect(rec.properties).toMatchObject({
        eventType: 'battle_fought', tick: 20, startedTick: 3, battleType: 'field_battle',
        resolutionType: resolution, locationId: 'loc.ford',
      });
      expect(graph.getOutgoingEdges(rec.id, 'occurred_at').map(e => e.target)).toEqual(['loc.ford']);
      expect(graph.getNode('loc.ford')!.properties[LAST_BATTLE_TICK_PROPERTY]).toBe(20);

      // Every commander still present carries the outcome the resolution names.
      const expected = BATTLE_OUTCOME_BY_RESOLUTION[resolution];
      for (const e of graph.getIncomingEdges(rec.id, 'participated_in')) {
        const role = e.properties.role as 'attacker' | 'defender';
        expect(e.properties.outcome).toBe(expected[role]);
        expect(e.properties.tick).toBe(20);
      }
      expect(recordedTraces()).toHaveLength(1);
      expect(recordedTraces()[0]).toMatchObject({ battleId, eventId: rec.id, locationId: 'loc.ford', resolutionType: resolution });
    });
  }

  it('a mutual destruction names no victor — lost on both sides, and a summary that crowns nobody', () => {
    const graph = new WorldGraph();
    const battleId = fieldBattleWorld(graph);
    resolveBattle(makeState(graph, 20), battleId, 'mutual_destruction');
    const rec = records(graph)[0];
    const outcomes = graph.getIncomingEdges(rec.id, 'participated_in').map(e => e.properties.outcome);
    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes.every(o => o === 'lost')).toBe(true);
    expect(rec.properties.summary).toMatch(/destroyed each other/);
    expect(rec.properties.summary).not.toMatch(/broke/);
  });

  it('a field battle on a Place is remembered at the outer-tier Location', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.town', 'Ashwell');
    graph.addNode({ id: 'sub.gate', type: 'location', name: 'The Gate', properties: { parentLocationId: 'loc.town' } });
    addFaction(graph, 'fac.red', 'the Red Banner');
    addFaction(graph, 'fac.blue', 'the Blue Crown');
    addArmy(graph, 'army.a', 'fac.red', 'sub.gate');
    addArmy(graph, 'army.d', 'fac.blue', 'sub.gate');
    addBattle(graph, 'battle_4_y', 'sub.gate', { attackerArmyId: 'army.a', defenderArmyId: 'army.d' });
    resolveBattle(makeState(graph, 30), 'battle_4_y', 'stalemate');
    const rec = records(graph)[0];
    expect(graph.getOutgoingEdges(rec.id, 'occurred_at').map(e => e.target)).toEqual(['loc.town']);
    expect(graph.getNode('sub.gate')!.properties[LAST_BATTLE_TICK_PROPERTY]).toBeUndefined();
  });

  it('a siege records at its town even when the siege node sits on another node', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.camp', 'The Siege Lines');
    addLocation(graph, 'loc.keep', 'Crystalspire', { prosperity: 40 });
    addFaction(graph, 'fac.red', 'the Red Banner');
    addFaction(graph, 'fac.blue', 'the Blue Crown');
    graph.addEdge({ id: 'ctl', source: 'fac.blue', target: 'loc.keep', type: 'controls', properties: {} });
    addArmy(graph, 'army.a', 'fac.red', 'loc.camp');
    addBattle(graph, 'siege_5_z', 'loc.camp', {
      battleType: 'siege', attackerArmyId: 'army.a', defenderArmyId: 'loc.keep', settlementId: 'loc.keep',
    });
    resolveBattle(makeState(graph, 40), 'siege_5_z', 'defender_victory');
    const rec = records(graph)[0];
    expect(graph.getOutgoingEdges(rec.id, 'occurred_at').map(e => e.target)).toEqual(['loc.keep']);
    expect(graph.getNode('loc.keep')!.properties[LAST_BATTLE_TICK_PROPERTY]).toBe(40);
    expect(graph.getNode('loc.camp')!.properties[LAST_BATTLE_TICK_PROPERTY]).toBeUndefined();
    expect(rec.properties.summary).toBe('Crystalspire held against the Red Banner.');
  });

  it('a won siege that changed the town\'s hands is remembered as taken, and the town still stands', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.keep', 'Crystalspire', { prosperity: 40 });
    addFaction(graph, 'fac.red', 'the Red Banner');
    addFaction(graph, 'fac.blue', 'the Blue Crown');
    graph.addEdge({ id: 'ctl', source: 'fac.blue', target: 'loc.keep', type: 'controls', properties: {} });
    addArmy(graph, 'army.a', 'fac.red', 'loc.keep');
    addBattle(graph, 'siege_6_w', 'loc.keep', {
      battleType: 'siege', attackerArmyId: 'army.a', defenderArmyId: 'loc.keep', settlementId: 'loc.keep',
      momentum: 100,
    });
    const state = makeState(graph, 50);
    const capture = captureBattleForNews(state, 'siege_6_w');
    // Simulate the conquest the aftermath performs at its sack severity.
    graph.removeEdge('ctl');
    graph.addEdge({ id: 'ctl2', source: 'fac.red', target: 'loc.keep', type: 'controls', properties: {} });
    const bs = graph.getNode('siege_6_w')!.properties.battleState as BattleState;
    recordBattleFought(state, 'siege_6_w', bs, 'attacker_victory', { severity: 'total' }, capture);
    expect(graph.getNode('loc.keep')).toBeDefined();
    expect(records(graph)[0].properties.summary).toBe('The Red Banner took Crystalspire by siege.');
  });

  it('a commander the aftermath removed gets no edge; one kept as deceased does', () => {
    const graph = new WorldGraph();
    const battleId = fieldBattleWorld(graph);
    const state = makeState(graph, 20);
    const capture = captureBattleForNews(state, battleId);
    const bs = graph.getNode(battleId)!.properties.battleState as BattleState;
    // Attacker's commander gone from the graph; defender's kept, marked dead (THR-1566).
    graph.removeNode('cmd.a');
    graph.updateNode('cmd.d', { properties: { deceased: true } });
    recordBattleFought(state, battleId, bs, 'attacker_victory', { severity: 'major' }, capture);
    const edges = graph.getIncomingEdges(battleRecordId(battleId), 'participated_in');
    expect(edges.map(e => [e.source, e.properties.role, e.properties.outcome])).toEqual([['cmd.d', 'defender', 'lost']]);
  });

  it('with no place to name, the record is still written — without occurred_at or a stamp — and traced', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'fac.red', 'the Red Banner');
    graph.addNode({ id: 'hex.9', type: 'hex' as never, name: 'Hex', properties: {} });
    addArmy(graph, 'army.a', 'fac.red', 'hex.9');
    addArmy(graph, 'army.d', 'fac.red', 'hex.9');
    addBattle(graph, 'battle_7_v', 'hex.9', { attackerArmyId: 'army.a', defenderArmyId: 'army.d' });
    expect(() => resolveBattle(makeState(graph, 60), 'battle_7_v', 'stalemate')).not.toThrow();
    const rec = records(graph)[0];
    expect(graph.getOutgoingEdges(rec.id, 'occurred_at')).toEqual([]);
    expect(recordedTraces()[0]).toMatchObject({ error: 'no_place' });
  });

  it('never throws into resolveBattle: a failed write is traced and the battle still resolves', () => {
    const graph = new WorldGraph();
    const battleId = fieldBattleWorld(graph);
    // The record id already taken — addNode will refuse it.
    graph.addNode({ id: battleRecordId(battleId), type: 'event', name: 'squatter', properties: {} });
    expect(() => resolveBattle(makeState(graph, 20), battleId, 'stalemate')).not.toThrow();
    expect(graph.getNode(battleId)).toBeUndefined();
    const t = recordedTraces()[0];
    expect(t.error).toBeDefined();
    expect(t.eventId).toBeUndefined();
  });

  it('describeBattleRecords lists records newest first, filtered by place', () => {
    const graph = new WorldGraph();
    const battleId = fieldBattleWorld(graph);
    resolveBattle(makeState(graph, 20), battleId, 'attacker_victory');
    const all = describeBattleRecords(graph);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ locationId: 'loc.ford', locationName: 'Grey Ford', tick: 20, resolutionType: 'attacker_victory' });
    expect(describeBattleRecords(graph, 'grey')).toHaveLength(1);
    expect(describeBattleRecords(graph, 'elsewhere')).toHaveLength(0);
  });
});

describe('the ground remembers — trait and place MEMORY (THR-1528)', () => {
  it('a resolved battle mints Blood-soaked on its ground on the next traits pass', () => {
    const graph = new WorldGraph();
    seedEncounterTraitDefinitions(graph);
    const battleId = fieldBattleWorld(graph);
    resolveBattle(makeState(graph, 20), battleId, 'attacker_victory');
    phaseLocationTraits(makeState(graph, 20));
    const traits = graph.getOutgoingEdges('loc.ford', 'has_trait').map(e => e.target);
    expect(traits).toContain(LOCATION_TRAIT_IDS.bloodSoaked);
  });

  it('a sieged town\'s MEMORY carries the siege inside the window, and the ordinary line outside it', () => {
    const graph = new WorldGraph();
    addLocation(graph, 'loc.keep', 'Crystalspire', { prosperity: 40 });
    addFaction(graph, 'fac.red', 'the Red Banner');
    addFaction(graph, 'fac.blue', 'the Blue Crown');
    graph.addEdge({ id: 'ctl', source: 'fac.blue', target: 'loc.keep', type: 'controls', properties: {} });
    addArmy(graph, 'army.a', 'fac.red', 'loc.keep');
    addBattle(graph, 'siege_8_u', 'loc.keep', {
      battleType: 'siege', attackerArmyId: 'army.a', defenderArmyId: 'loc.keep', settlementId: 'loc.keep',
    });
    resolveBattle(makeState(graph, 100), 'siege_8_u', 'defender_victory');

    const memoryAt = (tick: number) => {
      const page = generateDetailPage({ nodeId: 'loc.keep', pageKind: 'place', graph, tick, seed: 42, protagonistId: 'none' });
      const m = page.sections.find(s => s.typeId === 'memory');
      return m?.kind === 'prose' ? m.prose : undefined;
    };
    expect(memoryAt(100)).toBe('Crystalspire held against the Red Banner. That was today.');
    expect(memoryAt(100 + 12 * 3)).toBe('Crystalspire held against the Red Banner. That was a few days ago.');
    const later = memoryAt(100 + BLOOD_SOAKED_WINDOW_TICKS);
    expect(later).toBeDefined();
    expect(later).not.toMatch(/held against/);
  });
});
