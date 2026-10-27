/**
 * THR-2077 — a sealed mill lease gives the town's mill to a guild. Binds the plan's
 * Done-when (Docs/plans/2026-10-27-thr-2077-mill-lease-guild.md): `guild_hold_place`
 * raises / takes up / leaves alone the mill by branch, `pickTownGuild` ranks affinity
 * before members before id and never picks a realm, the purse pays a held mill its dues
 * (stamped or not, zero in a ruin) under the phrase "the mill at <town>", and only the
 * sealed sequel carries the effect.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { WorldGraph } from '../graph';
import { grantHolding } from '../holdings';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { pickTownGuild } from '../factionPurse/townGuild';
import { computePurseIncome, heldBuildingDuesOf, type PurseWorldContext } from '../factionPurse/income';
import { sourcePhrase } from '../factionPurse/purseSentences';
import { readBuildings, IS_BUILDING_PROP } from '../settlementEconomy/building';
import { HELD_BUILDING_DUES, TOWN_TAX_PROSPERITY_PIVOT } from '../../data/faction-purse-constants';
import { REALM_FACTION_CLASS } from '../../data/realm-content';
import { MILL_LEASE_SEALED, MILL_LEASE_FORFEIT } from '../../data/encounters/mill-lease-sequels';
import { MILL_LEASE_AUCTION_TEMPLATE } from '../../data/encounters/mill-lease-auction';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const TICK = 10;
const MILL = 'sublocation-type.mill';
const HOLD_MILL: EncounterAftermathReactionEffect = { kind: 'guild_hold_place', buildingId: 'mill' };

function addFaction(graph: WorldGraph, id: string, guildType: string, extra: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'faction', guildType, homeLocationId: 'town-1', ...extra } });
}

function addMember(graph: WorldGraph, agentId: string, factionId: string, at = 'town-1'): void {
  graph.addNode({ id: agentId, type: 'actor', name: agentId, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `mo-${agentId}`, source: agentId, target: factionId, type: 'member_of', properties: {} });
  graph.addEdge({ id: `at-${agentId}`, source: agentId, target: at, type: 'located_at', properties: {} });
}

function addPlace(graph: WorldGraph, id: string, typeId: string, extra: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'location', name: id, properties: { parentLocationId: 'town-1', sublocationTypeId: typeId, persistence: { type: 'permanent' }, ...extra } });
  graph.addEdge({ id: `contains-${id}`, source: 'town-1', target: id, type: 'contains', properties: {} });
}

/** Ashford, a town (3 slots), with Wren standing in its market. No faction yet. */
function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Wren Callow', properties: { actorType: 'individual', wealth: 30 } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', prosperity: TOWN_TAX_PROSPERITY_PIVOT, hexCol: 1, hexRow: 1 } });
  addPlace(graph, 'square-1', 'sublocation-type.market');
  graph.addEdge({ id: 'at-1', source: 'actor-1', target: 'square-1', type: 'located_at', properties: {} });
  return graph;
}

function buildState(graph: WorldGraph): GameState {
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
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_mill', actorId: 'actor-1', templateId: 'town.mill_lease_sealed', targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

function run(graph: WorldGraph, runtime: SimulationRuntime, tick = TICK) {
  const reaction: EncounterAftermathReaction = { id: 'r-mill', label: 'Outcome', effects: [HOLD_MILL] };
  return applyEncounterAftermathReaction(buildState(graph), makeAction(), reaction, tick, runtime, { outcomeBand: 'success' });
}

function mills(graph: WorldGraph): GraphNode[] {
  return graph.getOutgoingEdges('town-1', 'contains')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n?.properties.sublocationTypeId === MILL);
}

function guildHeld() {
  return getTraces().filter(t => t.category === 'encounter.place.guild_held') as unknown as {
    result: string; guildId: string | null; affinity: string | null; placeId: string | null; heldBy?: string;
  }[];
}

const edgeCount = (g: WorldGraph) => g.getAllEdges().length;

describe('THR-2077 — guild_hold_place', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('raises one mill in a town with an artisans guild and none standing, held by the guild (raised)', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    const { state, mutationSummary } = run(graph, runtime);
    const all = mills(state.graph);
    expect(all).toHaveLength(1);
    const mill = all[0]!;
    expect(mill.properties[IS_BUILDING_PROP]).toBe(true);
    // Stamped by markMortalBuilding: reads as adopted, not the economy's own.
    expect(mill.properties.builtBy).toBeUndefined();
    expect(readBuildings(state.graph, 'town-1').map(b => b.def.id)).toEqual(['mill']);
    const controls = state.graph.getIncomingEdges(mill.id, 'controls');
    expect(controls).toHaveLength(1);
    expect(controls[0]).toMatchObject({ source: 'guild-carvers', properties: { role: 'guild_holding', via: 'encounter' } });
    expect(mutationSummary.touchedStructure).toBe(true);
    expect(guildHeld()).toEqual([expect.objectContaining({ result: 'raised', guildId: 'guild-carvers', affinity: 'artisans', placeId: mill.id })]);
  });

  it('a second run writes no new edge and no second mill (already_theirs)', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    run(graph, runtime);
    const before = edgeCount(graph);
    run(graph, runtime, TICK + 5);
    expect(mills(graph)).toHaveLength(1);
    expect(edgeCount(graph)).toBe(before);
    expect(guildHeld().map(t => t.result)).toEqual(['raised', 'already_theirs']);
  });

  it('a mill another faction holds stays theirs (held_elsewhere)', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    addFaction(graph, 'guild-other', 'thieves');
    addPlace(graph, 'mill-1', MILL);
    graph.addEdge({ id: 'ctl-other', source: 'guild-other', target: 'mill-1', type: 'controls', properties: {} });
    const before = edgeCount(graph);
    run(graph, runtime);
    expect(edgeCount(graph)).toBe(before);
    expect(graph.getIncomingEdges('mill-1', 'controls').map(e => e.source)).toEqual(['guild-other']);
    expect(guildHeld()[0]).toMatchObject({ result: 'held_elsewhere', placeId: 'mill-1', heldBy: 'guild-other' });
  });

  it('a mill a mortal holds as a freehold stays theirs (held_elsewhere)', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    addPlace(graph, 'mill-1', MILL, { [IS_BUILDING_PROP]: true, buildingId: 'mill' });
    grantHolding(graph, 'actor-1', 'mill-1', { tick: 1 }, 'creation');
    run(graph, runtime);
    expect(graph.getIncomingEdges('mill-1', 'controls')).toHaveLength(0);
    expect(guildHeld()[0]).toMatchObject({ result: 'held_elsewhere', placeId: 'mill-1', heldBy: 'actor-1' });
  });

  it('no guild present writes nothing (no_fellowship)', () => {
    const graph = buildGraph();
    const nodes = graph.getAllNodes().length;
    const before = edgeCount(graph);
    run(graph, runtime);
    expect(graph.getAllNodes()).toHaveLength(nodes);
    expect(edgeCount(graph)).toBe(before);
    expect(guildHeld()[0]).toMatchObject({ result: 'no_fellowship', guildId: null, placeId: null });
  });

  it('a temple or thieves guild alone is no fellowship', () => {
    const graph = buildGraph();
    addFaction(graph, 'temple-1', 'temples');
    addFaction(graph, 'thieves-1', 'thieves');
    const before = edgeCount(graph);
    run(graph, runtime);
    expect(edgeCount(graph)).toBe(before);
    expect(mills(graph)).toHaveLength(0);
    expect(guildHeld()[0]).toMatchObject({ result: 'no_fellowship' });
  });

  it('a full town with no mill raises nothing (no_room)', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    for (const [id, type, bid] of [
      ['b-1', 'sublocation-type.warehouse', 'storehouse'],
      ['b-2', 'sublocation-type.wharf', 'fishery'],
      ['b-3', 'sublocation-type.shrine', 'shrine'],
    ] as const) addPlace(graph, id, type, { [IS_BUILDING_PROP]: true, buildingId: bid });
    expect(readBuildings(graph, 'town-1')).toHaveLength(3);
    const nodes = graph.getAllNodes().length;
    const before = edgeCount(graph);
    run(graph, runtime);
    expect(graph.getAllNodes()).toHaveLength(nodes);
    expect(edgeCount(graph)).toBe(before);
    expect(guildHeld()[0]).toMatchObject({ result: 'no_room', guildId: 'guild-carvers', placeId: null });
  });

  it('an unheld standing mill is taken up and made a building when a slot is free (taken_up)', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    addPlace(graph, 'mill-old', MILL);
    run(graph, runtime);
    expect(mills(graph)).toHaveLength(1);
    expect(graph.getNode('mill-old')?.properties[IS_BUILDING_PROP]).toBe(true);
    expect(graph.getIncomingEdges('mill-old', 'controls')[0]).toMatchObject({ source: 'guild-carvers', properties: { role: 'guild_holding' } });
    expect(guildHeld()[0]).toMatchObject({ result: 'taken_up', placeId: 'mill-old' });
  });

  it('with no actor site, writes nothing and traces aftermath_target_invalid', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-carvers', 'artisans');
    graph.removeEdge('at-1');
    run(graph, runtime);
    expect(mills(graph)).toHaveLength(0);
    expect(guildHeld()).toHaveLength(0);
    expect(getTraces().some(t => t.category === 'aftermath_target_invalid'
      && (t as unknown as { effectKind: string }).effectKind === 'guild_hold_place')).toBe(true);
  });
});

describe('THR-2077 — pickTownGuild', () => {
  it('affinity order wins over member count', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-merchants', 'merchants');
    addMember(graph, 'm-1', 'guild-merchants');
    addMember(graph, 'm-2', 'guild-merchants');
    addFaction(graph, 'guild-carvers', 'artisans');
    expect(pickTownGuild(graph, 'town-1')).toEqual({ guildId: 'guild-carvers', affinity: 'artisans' });
  });

  it('member count wins within an affinity, then the lowest id', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-a', 'artisans');
    addFaction(graph, 'guild-b', 'artisans');
    addMember(graph, 'b-1', 'guild-b');
    expect(pickTownGuild(graph, 'town-1')?.guildId).toBe('guild-b');
    addMember(graph, 'a-1', 'guild-a');
    expect(pickTownGuild(graph, 'town-1')?.guildId).toBe('guild-a');
  });

  it('a realm never holds', () => {
    const graph = buildGraph();
    addFaction(graph, 'realm-1', 'artisans', { factionClass: REALM_FACTION_CLASS });
    expect(pickTownGuild(graph, 'town-1')).toBeNull();
  });

  it('a guild with no hall or member in the town is not present', () => {
    const graph = buildGraph();
    addFaction(graph, 'guild-far', 'artisans', { homeLocationId: 'elsewhere' });
    expect(pickTownGuild(graph, 'town-1')).toBeNull();
  });
});

describe('THR-2077 — a held mill pays its guild dues', () => {
  const ctx: PurseWorldContext = { hexRealmId: new Map(), realmHexes: new Map(), tileTerrain: new Map() };

  function heldMill(stamped: boolean, prosperity = TOWN_TAX_PROSPERITY_PIVOT): { graph: WorldGraph; guild: GraphNode } {
    const graph = buildGraph();
    graph.getNode('town-1')!.properties.prosperity = prosperity;
    addFaction(graph, 'guild-carvers', 'artisans', { homeLocationId: 'elsewhere' });
    addPlace(graph, 'mill-1', MILL, stamped ? { [IS_BUILDING_PROP]: true, buildingId: 'mill' } : {});
    graph.addEdge({ id: 'ctl', source: 'guild-carvers', target: 'mill-1', type: 'controls', properties: { role: 'guild_holding' } });
    return { graph, guild: graph.getNode('guild-carvers')! };
  }

  it.each([true, false])('at the prosperity pivot it pays HELD_BUILDING_DUES.mill as a place source (stamped: %s)', stamped => {
    const { graph, guild } = heldMill(stamped);
    const day = computePurseIncome(graph, [guild], ctx).get('guild-carvers')!;
    expect(day.income.placeYield).toBeCloseTo(HELD_BUILDING_DUES.mill, 10);
    expect(day.sources).toEqual([{ kind: 'place', nodeId: 'mill-1', amount: expect.closeTo(HELD_BUILDING_DUES.mill, 10) }]);
    const words = sourcePhrase(graph, 'place', 'mill-1');
    expect(words).toEqual(['the mill at ', { text: 'Ashford', ref: { kind: 'location', id: 'town-1' } }]);
  });

  it('in a ruined town it pays nothing', () => {
    const { graph, guild } = heldMill(true, 0);
    expect(heldBuildingDuesOf(graph, graph.getNode('mill-1')!)).toBe(0);
    expect(computePurseIncome(graph, [guild], ctx).get('guild-carvers')!.income.placeYield).toBe(0);
  });

  it('a Place with no dues row pays nothing', () => {
    const graph = buildGraph();
    expect(heldBuildingDuesOf(graph, graph.getNode('square-1')!)).toBe(0);
  });
});

describe('THR-2077 — the mill lease tables', () => {
  const kindsOf = (t: UnifiedActionTemplate): string[] => JSON.stringify(t).match(/"kind":"guild_hold_place"/g) ?? [];

  it('the sealed lease success carries guild_hold_place for the mill', () => {
    const step = MILL_LEASE_SEALED.steps[0] as { successMetadata?: { effects?: readonly unknown[] } };
    const effects = step.successMetadata?.effects ?? [];
    expect(effects).toContainEqual({ kind: 'guild_hold_place', buildingId: 'mill' });
    expect(kindsOf(MILL_LEASE_SEALED)).toHaveLength(1);
  });

  it('the forfeit and the auction carry none', () => {
    expect(kindsOf(MILL_LEASE_FORFEIT)).toHaveLength(0);
    expect(kindsOf(MILL_LEASE_AUCTION_TEMPLATE)).toHaveLength(0);
  });
});
