/**
 * Tests: Siege regional encounter generation.
 *
 * Plan 12-05 — generateRegionalEncounters dispatches trace events for actors
 * within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes of the siege based on their
 * factional alignment and capability profile.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { createSiegeNode, generateRegionalEncounters } from '../siegeResolution';
import { getTraces, clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { SIEGE_REGIONAL_ENCOUNTER_RANGE } from '../../types/battle';
import type { ArmyState } from '../../types/army';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph } as unknown as GameState;
}

/** Add a hex node at a specific offset position */
function addHex(graph: WorldGraph, id: string, col: number, row: number, subtype?: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Hex ${id}`,
    properties: {
      terrain: 'plains',
      hexCol: col,
      hexRow: row,
      ...(subtype ? { locationSubtype: subtype } : {}),
    },
  });
}

function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'actor', name: `Faction ${id}`, properties: { actorType: 'faction' } });
}

function addArmy(graph: WorldGraph, id: string, factionId: string, locationId: string, headcount: number = 200): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Army ${id}`,
    properties: {
      actorType: 'group',
      armyState: {
        size: 'warband',
        headcount,
        objective: null,
        quintessence: 30,
        quintessenceMax: 30,
        raisedTick: 0,
        maintenanceCost: 2,
        thresholdsFired: [],
      } as ArmyState,
    },
  });
  graph.addEdge({ id: `e_member_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

function addActor(graph: WorldGraph, id: string, factionId: string, locationId: string, extraProps?: Record<string, unknown>): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Actor ${id}`,
    properties: {
      actorType: 'agent',
      ...extraProps,
    },
  });
  graph.addEdge({ id: `e_member_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'member', rank: 'agent', joinedTick: 0 } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

function addSettlement(graph: WorldGraph, id: string, hexId: string, subtype: string, factionId?: string): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Settlement ${id}`,
    properties: { terrain: 'plains', locationSubtype: subtype },
  });
  graph.addEdge({ id: `e_settloc_${id}`, source: id, target: hexId, type: 'located_at', properties: {} });
  if (factionId) {
    graph.addEdge({ id: `e_ctrl_${id}`, source: id, target: factionId, type: 'controlled_by', properties: {} });
  }
}

function getSiegeRegionalTraces(_tick: number) {
  return getTraces().filter(
    t => (t as Record<string, unknown>).event === 'siege_regional_encounter',
  );
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('generateRegionalEncounters', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('finds no eligible actors when no actors are within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes', () => {
    // Siege at hex (0,0), actor at hex (10,10) — well beyond range
    addHex(graph, 'hex_siege', 0, 0, 'town');
    addHex(graph, 'hex_far', 10, 10);
    addFaction(graph, 'f1');
    addFaction(graph, 'f2');
    addArmy(graph, 'army1', 'f1', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f2');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;
    clearTraces();

    // Add an actor far away
    addActor(graph, 'actor_far', 'f2', 'hex_far');

    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces = getSiegeRegionalTraces(1);
    expect(traces).toHaveLength(0);
  });

  it('spawns siege.regional.call_for_aid for allied faction actors within range', () => {
    addHex(graph, 'hex_siege', 0, 0, 'town');
    addHex(graph, 'hex_near', 1, 0); // 1 hex away
    addFaction(graph, 'f_attacker');
    addFaction(graph, 'f_defender');
    addArmy(graph, 'army1', 'f_attacker', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f_defender');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;
    clearTraces();

    // Allied defender actor nearby
    addActor(graph, 'defender_agent', 'f_defender', 'hex_near');

    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces = getSiegeRegionalTraces(1) as Array<Record<string, unknown>>;
    const callForAid = traces.find(t => t.encounterType === 'siege.regional.call_for_aid');
    expect(callForAid).toBeDefined();
    expect(callForAid?.actorId).toBe('defender_agent');
  });

  it('spawns siege.regional.smuggle_supplies for Shadow-capable agents within range', () => {
    addHex(graph, 'hex_siege', 0, 0, 'town');
    addHex(graph, 'hex_near', 2, 0); // within range
    addFaction(graph, 'f_attacker');
    addFaction(graph, 'f_defender');
    addFaction(graph, 'f_neutral');
    addArmy(graph, 'army1', 'f_attacker', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f_defender');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;
    clearTraces();

    // Neutral Shadow-capable agent near siege
    addActor(graph, 'shadow_agent', 'f_neutral', 'hex_near', {
      domainCapabilities: { Shadow: 3 },
    });

    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces = getSiegeRegionalTraces(1) as Array<Record<string, unknown>>;
    const smuggle = traces.find(t => t.encounterType === 'siege.regional.smuggle_supplies');
    expect(smuggle).toBeDefined();
    expect(smuggle?.actorId).toBe('shadow_agent');
  });

  it('spawns siege.regional.negotiate_terms for Heart-capable agents within range', () => {
    addHex(graph, 'hex_siege', 0, 0, 'town');
    addHex(graph, 'hex_near', 0, 1); // 1 hex away
    addFaction(graph, 'f_attacker');
    addFaction(graph, 'f_defender');
    addFaction(graph, 'f_neutral');
    addArmy(graph, 'army1', 'f_attacker', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f_defender');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;
    clearTraces();

    // Neutral Heart-capable agent nearby
    addActor(graph, 'heart_agent', 'f_neutral', 'hex_near', {
      domainCapabilities: { Heart: 4 },
    });

    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces = getSiegeRegionalTraces(1) as Array<Record<string, unknown>>;
    const negotiate = traces.find(t => t.encounterType === 'siege.regional.negotiate_terms');
    expect(negotiate).toBeDefined();
    expect(negotiate?.actorId).toBe('heart_agent');
  });

  it('does not spawn duplicate regional encounters for the same actor in the same siege', () => {
    addHex(graph, 'hex_siege', 0, 0, 'town');
    addHex(graph, 'hex_near', 1, 0);
    addFaction(graph, 'f_attacker');
    addFaction(graph, 'f_defender');
    addArmy(graph, 'army1', 'f_attacker', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f_defender');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;

    // Add defender-allied agent
    addActor(graph, 'defender_agent', 'f_defender', 'hex_near');

    clearTraces();
    // Tick 1: encounter generated
    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces1 = getSiegeRegionalTraces(1).length;
    expect(traces1).toBe(1);

    clearTraces();
    // Tick 2: same actor — should NOT get another encounter
    generateRegionalEncounters(makeState(2, graph), siegeId);
    const traces2 = getSiegeRegionalTraces(2).length;
    expect(traces2).toBe(0);
  });

  it('does not spawn encounters for actors already participating in a battle', () => {
    addHex(graph, 'hex_siege', 0, 0, 'town');
    addHex(graph, 'hex_near', 1, 0);
    addFaction(graph, 'f_attacker');
    addFaction(graph, 'f_defender');
    addFaction(graph, 'f_neutral');
    addArmy(graph, 'army1', 'f_attacker', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f_defender');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;

    // Add agent already in a battle
    addActor(graph, 'busy_agent', 'f_neutral', 'hex_near', { domainCapabilities: { Heart: 3 } });
    // Give it a participates_in edge to simulate battle participation
    graph.addNode({ id: 'fake_battle', type: 'actor', name: 'Fake Battle', properties: { actorType: 'group', battleState: { battleType: 'field_battle', momentum: 0 } } });
    graph.addEdge({ id: 'e_busy_participates', source: 'busy_agent', target: 'fake_battle', type: 'participates_in', properties: {} });

    clearTraces();
    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces = getSiegeRegionalTraces(1) as Array<Record<string, unknown>>;
    const busyAgentTrace = traces.find(t => t.actorId === 'busy_agent');
    expect(busyAgentTrace).toBeUndefined();
  });

  it('only generates encounters for actors within range boundary', () => {
    addHex(graph, 'hex_siege', 0, 0, 'town');
    // Exactly at range boundary
    addHex(graph, 'hex_boundary', SIEGE_REGIONAL_ENCOUNTER_RANGE, 0);
    // One beyond range
    addHex(graph, 'hex_beyond', SIEGE_REGIONAL_ENCOUNTER_RANGE + 1, 0);
    addFaction(graph, 'f_attacker');
    addFaction(graph, 'f_defender');
    addFaction(graph, 'f_neutral');
    addArmy(graph, 'army1', 'f_attacker', 'hex_siege', 200);
    addSettlement(graph, 'settle1', 'hex_siege', 'town', 'f_defender');

    const siegeId = createSiegeNode(makeState(0, graph), 'army1', 'settle1', 'hex_siege')!;
    clearTraces();

    addActor(graph, 'actor_boundary', 'f_neutral', 'hex_boundary', { domainCapabilities: { Heart: 3 } });
    addActor(graph, 'actor_beyond', 'f_neutral', 'hex_beyond', { domainCapabilities: { Heart: 3 } });

    generateRegionalEncounters(makeState(1, graph), siegeId);
    const traces = getSiegeRegionalTraces(1) as Array<Record<string, unknown>>;

    const boundaryTrace = traces.find(t => t.actorId === 'actor_boundary');
    const beyondTrace = traces.find(t => t.actorId === 'actor_beyond');

    expect(boundaryTrace).toBeDefined(); // At boundary = included
    expect(beyondTrace).toBeUndefined(); // Beyond = excluded
  });
});
