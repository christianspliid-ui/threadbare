/**
 * armyVisibility.test.ts — TB-073 Phase 7 visual presence tests.
 *
 * Tests for:
 * 1. Army actor nodes included in graph query results (buildArmyRenderData)
 * 2. Battle node has correct located_at for hex positioning (buildBattleIndicatorData)
 * 3. Thread-based visibility: threaded battle → modal significance, unthreaded → chronicle
 * 4. Army notification tier mapping (phaseArmyNotifications)
 *
 * Visual verification of HexMapV2 layers requires Claude in Chrome — not tested here.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { buildArmyRenderData, factionColorFromId, ARMY_FALLBACK_COLOR } from '../../components/HexMapV2/scene/ArmyLayer';
import { buildBattleIndicatorData } from '../../components/HexMapV2/scene/BattleIndicatorLayer';
import { phaseArmyNotifications, ARMY_NOTIFICATION_SIGNIFICANCE_THREADED, ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED } from '../armyNotifications';
import { emitTrace, clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let counter = 0;
function nextEventId(): string {
  return `test_evt_${++counter}`;
}

function makeState(tick: number, graph: WorldGraph, ascendantId = 'ascendant1'): GameState {
  return {
    tick,
    seed: 42,
    graph,
    ascendantId,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
  } as unknown as GameState;
}

/**
 * Creates a location node with hexCol/hexRow properties.
 */
function addLocation(graph: WorldGraph, id: string, hexCol: number, hexRow: number): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Loc-${id}`,
    properties: { locationSubtype: 'town', hexCol, hexRow },
  });
}

/**
 * Creates a faction node.
 */
function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction-${id}`,
    properties: { actorType: 'faction' },
  });
}

/**
 * Creates an army actor node at a given location with given faction.
 */
function addArmy(
  graph: WorldGraph,
  armyId: string,
  locationId: string,
  factionId: string,
  size: 'warband' | 'regiment' | 'host' = 'warband',
): void {
  graph.addNode({
    id: armyId,
    type: 'actor',
    name: `Army-${armyId}`,
    properties: {
      actorType: 'group',
      armyState: {
        size,
        headcount: 100,
        quintessence: 30,
        quintessenceMax: 30,
        raisedTick: 1,
        maintenanceCost: 2,
        thresholdsFired: [],
        objective: null,
      },
    },
  });
  graph.addEdge({
    id: `e_loc_${armyId}`,
    source: armyId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
  graph.addEdge({
    id: `e_mem_${armyId}`,
    source: armyId,
    target: factionId,
    type: 'member_of',
    properties: { role: 'army', rank: 'army', joinedTick: 1 },
  });
}

/**
 * Creates a battle actor node at a given location.
 */
function addBattle(
  graph: WorldGraph,
  battleId: string,
  locationId: string,
  isSiege = false,
): void {
  graph.addNode({
    id: battleId,
    type: 'actor',
    name: `Battle-${battleId}`,
    properties: {
      actorType: 'group',
      battleState: {
        battleType: isSiege ? 'siege' : 'field_battle',
        momentum: 0,
        backgroundProse: '',
        spotlightHistory: [],
        ticksSinceLastSpotlight: 0,
        startedTick: 1,
        initialMomentumOffset: 0,
        attackerArmyId: 'army1',
        defenderArmyId: 'army2',
        thresholdsFired: [],
      },
    },
  });
  graph.addEdge({
    id: `e_loc_battle_${battleId}`,
    source: battleId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('buildArmyRenderData', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns army nodes with correct hex positions', () => {
    addLocation(graph, 'loc1', 5, 3);
    addFaction(graph, 'faction1');
    addArmy(graph, 'army1', 'loc1', 'faction1', 'regiment');

    const data = buildArmyRenderData(graph);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      id: 'army1',
      hexCol: 5,
      hexRow: 3,
      size: 'regiment',
    });
    expect(data[0].factionColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns empty array when no armies exist', () => {
    addLocation(graph, 'loc1', 0, 0);
    const data = buildArmyRenderData(graph);
    expect(data).toHaveLength(0);
  });

  it('skips armies with no located_at edge', () => {
    addFaction(graph, 'faction1');
    // Army with no location edge
    graph.addNode({
      id: 'army_no_loc',
      type: 'actor',
      name: 'Homeless Army',
      properties: {
        actorType: 'group',
        armyState: { size: 'warband', headcount: 100, quintessence: 30, quintessenceMax: 30, raisedTick: 1, maintenanceCost: 2, thresholdsFired: [], objective: null },
      },
    });
    const data = buildArmyRenderData(graph);
    expect(data).toHaveLength(0);
  });

  it('uses fallback color when army has no faction', () => {
    addLocation(graph, 'loc1', 0, 0);
    // Army with no member_of edge
    graph.addNode({
      id: 'army_no_faction',
      type: 'actor',
      name: 'Factionless Army',
      properties: {
        actorType: 'group',
        armyState: { size: 'warband', headcount: 100, quintessence: 30, quintessenceMax: 30, raisedTick: 1, maintenanceCost: 2, thresholdsFired: [], objective: null },
      },
    });
    graph.addEdge({
      id: 'e_loc_army_no_faction',
      source: 'army_no_faction',
      target: 'loc1',
      type: 'located_at',
      properties: {},
    });
    const data = buildArmyRenderData(graph);
    expect(data).toHaveLength(1);
    expect(data[0].factionColor).toBe(ARMY_FALLBACK_COLOR);
  });

  it('returns correct size for each category', () => {
    addFaction(graph, 'faction1');

    for (const [idx, size] of (['warband', 'regiment', 'host'] as const).entries()) {
      addLocation(graph, `loc${idx}`, idx, 0);
      addArmy(graph, `army_${size}`, `loc${idx}`, 'faction1', size);
    }

    const data = buildArmyRenderData(graph);
    const sizes = data.map(d => d.size).sort();
    expect(sizes).toEqual(['host', 'regiment', 'warband']);
  });
});

describe('buildBattleIndicatorData', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns field battle at correct hex position', () => {
    addLocation(graph, 'loc1', 10, 7);
    addBattle(graph, 'battle1', 'loc1', false);

    const data = buildBattleIndicatorData(graph);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      id: 'battle1',
      hexCol: 10,
      hexRow: 7,
      isSiege: false,
    });
  });

  it('returns siege with isSiege=true', () => {
    addLocation(graph, 'loc1', 2, 8);
    addBattle(graph, 'siege1', 'loc1', true);

    const data = buildBattleIndicatorData(graph);
    expect(data).toHaveLength(1);
    expect(data[0].isSiege).toBe(true);
  });

  it('returns empty array when no battles', () => {
    const data = buildBattleIndicatorData(graph);
    expect(data).toHaveLength(0);
  });

  it('skips battle nodes with no located_at edge', () => {
    graph.addNode({
      id: 'battle_no_loc',
      type: 'actor',
      name: 'Unlocated Battle',
      properties: {
        actorType: 'group',
        battleState: { battleType: 'field_battle', momentum: 0, backgroundProse: '', spotlightHistory: [], ticksSinceLastSpotlight: 0, startedTick: 1, initialMomentumOffset: 0, attackerArmyId: 'a1', defenderArmyId: 'a2', thresholdsFired: [] },
      },
    });
    const data = buildBattleIndicatorData(graph);
    expect(data).toHaveLength(0);
  });
});

describe('factionColorFromId', () => {
  it('returns a hex color string', () => {
    const color = factionColorFromId('faction_kingdom_1');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('is deterministic for the same faction ID', () => {
    const id = 'test_faction_stable';
    expect(factionColorFromId(id)).toBe(factionColorFromId(id));
  });

  it('returns different colors for different faction IDs (usually)', () => {
    // With 6 colors and ~random distribution, different IDs should map differently
    const colors = new Set([
      factionColorFromId('faction_a'),
      factionColorFromId('faction_b'),
      factionColorFromId('faction_c'),
      factionColorFromId('faction_d'),
    ]);
    // At least 2 distinct colors across 4 different factions
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe('phaseArmyNotifications — thread-based visibility', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    counter = 0;
    clearTraces();
    enableTracing();

    // Ascendant node
    graph.addNode({
      id: 'ascendant1',
      type: 'actor',
      name: 'Test Ascendant',
      properties: { actorType: 'ascendant' },
    });
  });

  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('army_raised → high significance when commander is threaded', () => {
    // Thread an agent
    graph.addNode({ id: 'agent1', type: 'actor', name: 'Commander', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_thread', source: 'ascendant1', target: 'agent1', type: 'thread', properties: {} });

    // Emit army_raised trace with commanderId = threaded agent
    emitTrace({
      tick: 1,
      category: 'faction_ambition',
      summary: 'Army raised by Commander',
      event: 'army_raised',
      armyId: 'army1',
      commanderId: 'agent1',
      factionId: 'faction1',
    });

    const state = makeState(1, graph);
    const update = phaseArmyNotifications(state, nextEventId);

    expect(update.tickEvents).toBeDefined();
    const armyEvent = update.tickEvents!.find(e => e.type === 'army_mobilization');
    expect(armyEvent).toBeDefined();
    expect(armyEvent!.significance).toBe(ARMY_NOTIFICATION_SIGNIFICANCE_THREADED);
  });

  it('army_raised → low significance when commander is not threaded', () => {
    // No thread from ascendant to any agent
    emitTrace({
      tick: 1,
      category: 'faction_ambition',
      summary: 'Foreign army raised',
      event: 'army_raised',
      armyId: 'army_foreign',
      commanderId: 'foreign_commander',
      factionId: 'foreign_faction',
    });

    const state = makeState(1, graph);
    const update = phaseArmyNotifications(state, nextEventId);

    expect(update.tickEvents).toBeDefined();
    const armyEvent = update.tickEvents!.find(e => e.type === 'army_mobilization');
    expect(armyEvent).toBeDefined();
    expect(armyEvent!.significance).toBe(ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED);
  });

  it('battle resolved → high significance when attacker army commander is threaded', () => {
    // Thread an agent who commands the attacker army
    graph.addNode({ id: 'commander1', type: 'actor', name: 'General', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_thread2', source: 'ascendant1', target: 'commander1', type: 'thread', properties: {} });

    // Emit battle resolved trace
    emitTrace({
      tick: 1,
      category: 'faction_ambition',
      summary: 'Battle resolved: attacker_victory',
      event: 'resolved',
      battleId: 'battle1',
      attackerArmyId: 'commander1', // Same ID as threaded agent (simplified for test)
      defenderArmyId: 'army_defender',
      resolutionType: 'attacker_victory',
    });

    const state = makeState(1, graph);
    const update = phaseArmyNotifications(state, nextEventId);

    expect(update.tickEvents).toBeDefined();
    const battleEvent = update.tickEvents!.find(e => e.type === 'battle_resolved');
    expect(battleEvent).toBeDefined();
    expect(battleEvent!.significance).toBe(ARMY_NOTIFICATION_SIGNIFICANCE_THREADED);
  });

  it('siege_established → low significance when no threads to participants', () => {
    addLocation(graph, 'loc1', 5, 5);

    // Build a real army node so getOutgoingEdges works
    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: { size: 'warband' } } });
    // No commanded_by edge → commander not found → not threaded

    emitTrace({
      tick: 1,
      category: 'faction_ambition',
      summary: 'Siege established at castle',
      event: 'siege_established',
      siegeId: 'siege1',
      attackerArmyId: 'army_attacker',
      settlementId: 'loc1',
    });

    const state = makeState(1, graph);
    const update = phaseArmyNotifications(state, nextEventId);

    expect(update.tickEvents).toBeDefined();
    const siegeEvent = update.tickEvents!.find(e => e.type === 'siege_established');
    expect(siegeEvent).toBeDefined();
    expect(siegeEvent!.significance).toBe(ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED);
  });

  it('army notification tier mapping — army_mobilization type is correct', () => {
    emitTrace({
      tick: 5,
      category: 'faction_ambition',
      summary: 'Test army raised',
      event: 'army_raised',
      armyId: 'army_test',
      commanderId: 'cmd_test',
      factionId: 'faction_test',
    });

    const state = makeState(5, graph);
    const update = phaseArmyNotifications(state, nextEventId);

    expect(update.tickEvents).toBeDefined();
    const e = update.tickEvents![0];
    expect(e.type).toBe('army_mobilization');
    expect(e.tick).toBe(5);
    expect(typeof e.significance).toBe('number');
    expect(typeof e.message).toBe('string');
    expect(e.message.length).toBeGreaterThan(0);
  });

  it('only processes traces from the current tick', () => {
    // Emit trace from a different tick
    emitTrace({
      tick: 3,
      category: 'faction_ambition',
      summary: 'Old army raised',
      event: 'army_raised',
      armyId: 'old_army',
      commanderId: 'old_cmd',
      factionId: 'old_faction',
    });

    // State is at tick 5, not 3
    const state = makeState(5, graph);
    const update = phaseArmyNotifications(state, nextEventId);

    // Should not produce events (trace is from tick 3, state is tick 5)
    expect(update.tickEvents ?? []).toHaveLength(0);
  });

  it('returns empty object when no traces', () => {
    const state = makeState(1, graph);
    const update = phaseArmyNotifications(state, nextEventId);
    expect(update).toEqual({});
  });
});
