import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import {
  moveDebugAgent,
  spawnDebugAttachment,
  spawnDebugCompanion,
  spawnDebugLocationAtHex,
  spawnDebugNpc,
  spawnDebugSublocation,
} from '../debugWorldSpawnTools';
import { getCompanions } from '../companions';
import { computeRawScore } from '../domainCapability';

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 1,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1',
    essencePool: { [Symbol.iterator]: function* () { yield ['default', 0]; } },
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    clearanceGateStates: new Map(),
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

describe('debugWorldSpawnTools', () => {
  it('spawns a top-level location at a hex and copies current culture', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_existing',
      type: 'location',
      name: 'Old Town',
      properties: { hexCol: 4, hexRow: 6, locationSubtype: 'town' },
    });
    graph.addNode({
      id: 'culture_1',
      type: 'actor',
      name: 'River Culture',
      properties: { actorType: 'culture' },
    });
    graph.addEdge({
      id: 'loc_existing_belongs_to_culture_1',
      source: 'loc_existing',
      target: 'culture_1',
      type: 'belongs_to',
      properties: { cultureLayer: 'current', culturalStrength: 1.0 },
    });

    const state = makeState(graph);
    const result = spawnDebugLocationAtHex(state, 'city', 4, 6, { name: 'Debug City' });

    expect(result.success).toBe(true);
    expect(result.nodeName).toBe('Debug City');
    const node = state.graph.getNode(result.nodeId!);
    expect(node?.properties.locationSubtype).toBe('city');
    const cultureEdge = state.graph.getOutgoingEdges(result.nodeId!, 'belongs_to')[0];
    expect(cultureEdge?.target).toBe('culture_1');
  });

  it('spawns a sublocation under the hero anchor parent location', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_town',
      type: 'location',
      name: 'Debug Town',
      properties: { hexCol: 4, hexRow: 6, locationSubtype: 'town' },
    });
    graph.addNode({
      id: 'asc_1',
      type: 'actor',
      name: 'The Ascendant',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Recruit',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'agent_1_loc',
      source: 'agent_1',
      target: 'loc_town',
      type: 'located_at',
      properties: {},
    });

    const state = makeState(graph);
    const result = spawnDebugSublocation(state, 'sublocation-type.gatehouse', { locationQuery: '@hero' }, { name: 'South Gatehouse' });

    expect(result.success).toBe(true);
    expect(result.locationId).toBe('loc_town');
    const sublocation = state.graph.getNode(result.nodeId!);
    expect(sublocation?.properties.parentLocationId).toBe('loc_town');
    expect(state.graph.getOutgoingEdges('loc_town', 'contains').some(edge => edge.target === result.nodeId)).toBe(true);
  });

  it('spawns a guard captain into the preferred gatehouse sublocation and joins the requested faction', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_town',
      type: 'location',
      name: 'Debug Town',
      properties: { hexCol: 4, hexRow: 6, locationSubtype: 'town' },
    });
    graph.addNode({
      id: 'loc_gatehouse',
      type: 'location',
      name: 'South Gatehouse',
      properties: {
        parentLocationId: 'loc_town',
        sublocationTypeId: 'sublocation-type.gatehouse',
      },
    });
    graph.addEdge({
      id: 'loc_town_contains_gatehouse',
      source: 'loc_town',
      target: 'loc_gatehouse',
      type: 'contains',
      properties: {},
    });
    graph.addNode({
      id: 'culture_1',
      type: 'actor',
      name: 'River Culture',
      properties: { actorType: 'culture' },
    });
    graph.addEdge({
      id: 'loc_town_belongs_to_culture_1',
      source: 'loc_town',
      target: 'culture_1',
      type: 'belongs_to',
      properties: { cultureLayer: 'current', culturalStrength: 1.0 },
    });
    graph.addNode({
      id: 'faction_cg',
      type: 'actor',
      name: 'Civic Guard',
      properties: { actorType: 'faction', factionDefId: 'civic_guard' },
    });

    const state = makeState(graph);
    const result = spawnDebugNpc(state, 'guard_captain', { locationQuery: 'Debug Town' }, {
      name: 'Captain Merrow',
      factionDefId: 'civic_guard',
      spotlightTier: 'notable',
    });

    expect(result.success).toBe(true);
    expect(result.locationId).toBe('loc_gatehouse');
    const npc = state.graph.getNode(result.nodeId!);
    expect(npc?.properties.spotlightTier).toBe('notable');
    expect(state.graph.getOutgoingEdges(result.nodeId!, 'belongs_to')[0]?.target).toBe('culture_1');
    expect(state.graph.getOutgoingEdges(result.nodeId!, 'member_of')[0]?.target).toBe('faction_cg');
  });

  it('moves the hero to the best location at a target hex', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_origin',
      type: 'location',
      name: 'Origin',
      properties: { hexCol: 1, hexRow: 1, locationSubtype: 'hamlet' },
    });
    graph.addNode({
      id: 'loc_target',
      type: 'location',
      name: 'Target Town',
      properties: { hexCol: 8, hexRow: 9, locationSubtype: 'town' },
    });
    graph.addNode({
      id: 'asc_1',
      type: 'actor',
      name: 'The Ascendant',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Recruit',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'agent_1_loc',
      source: 'agent_1',
      target: 'loc_origin',
      type: 'located_at',
      properties: {},
    });

    const state = makeState(graph);
    const result = moveDebugAgent(state, '@hero', { col: 8, row: 9 });

    expect(result.success).toBe(true);
    expect(result.locationId).toBe('loc_target');
    expect(state.graph.getOutgoingEdges('agent_1', 'located_at')[0]?.target).toBe('loc_target');
  });

  it('spawns a possession attachment onto an agent using reward instantiation', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc_1',
      type: 'actor',
      name: 'The Ascendant',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Recruit',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'reward_tools_instruments_gate_seal_case',
      type: 'artifact',
      name: 'Gate Seal Case',
      properties: {
        subcategory: 'tools_instruments',
        tier: 1,
        tags: ['#checkpoint'],
        mechanicalSummary: '+0.03 Eye reach',
        reachBonus: { eye: 0.03 },
        lossCondition: 'stealable',
      },
    });

    const state = makeState(graph);
    const result = spawnDebugAttachment(state, '@hero', 'Gate Seal Case', { tick: 7 });

    expect(result.success).toBe(true);
    expect(result.kind).toBe('attachment');
    expect(result.nodeName).toBe('Gate Seal Case');
    const instanceId = result.nodeId!;
    expect(state.graph.getNode(instanceId)?.properties.acquiredTick).toBe(7);
    expect(state.graph.getOutgoingEdges('agent_1', 'possesses').some(edge => edge.target === instanceId)).toBe(true);
  });

  it('spawns a condition attachment onto an agent using reward instantiation', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc_1',
      type: 'actor',
      name: 'The Ascendant',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Recruit',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'starter_plague_touched',
      type: 'trait',
      name: 'Plague-Touched',
      properties: {
        subcategory: 'condition',
        tier: 2,
        tags: ['#disease'],
        visibility: 'discoverable',
      },
    });

    const state = makeState(graph);
    const result = spawnDebugAttachment(state, '@hero', 'starter_plague_touched');

    expect(result.success).toBe(true);
    const instanceId = result.nodeId!;
    expect(state.graph.getOutgoingEdges('agent_1', 'has_trait').some(edge => edge.target === instanceId)).toBe(true);
  });
});

/**
 * THR-1413 — the mint route that did not exist.
 *
 * `spawn attachment companion.wayfarer` answered "no attachment template matching"
 * because `resolveAttachmentTemplate` searches artifact/trait *nodes* and
 * `COMPANION_TEMPLATES` are a data array that never becomes nodes. These pin the
 * new verb, including the ascendant bearer whose capability the walk already reads.
 */
describe('spawnDebugCompanion (THR-1413)', () => {
  function makeCompanionWorld(): GameState {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc_1',
      type: 'actor',
      name: 'The Ascendant',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Kael Thornweaver',
      properties: { actorType: 'individual' },
    });
    return makeState(graph);
  }

  it('mints a companion onto a named mortal and joins them by an accompanies edge', () => {
    const state = makeCompanionWorld();

    const result = spawnDebugCompanion(state, 'Kael', 'companion.wayfarer');

    expect(result.success).toBe(true);
    expect(result.kind).toBe('companion');
    const companions = getCompanions(state.graph, 'agent_1');
    expect(companions).toHaveLength(1);
    expect(companions[0].templateId).toBe('companion.wayfarer');
    expect(companions[0].id).toBe(result.nodeId);
    // The generated personal name is what the row shows — not the profession.
    expect(result.nodeName).toBe(companions[0].name);
    expect(result.message).toContain('Kael Thornweaver');
  });

  it('resolves a template by profession as well as by exact id', () => {
    const state = makeCompanionWorld();
    const byProfession = spawnDebugCompanion(state, 'agent_1', 'Guild Scribe');

    expect(byProfession.success).toBe(true);
    expect(getCompanions(state.graph, 'agent_1')[0].templateId).toBe('companion.guild-scribe');
  });

  it('mints twice on one bearer instead of silently no-opping on the tick collision', () => {
    const state = makeCompanionWorld();

    const first = spawnDebugCompanion(state, 'agent_1', 'companion.wayfarer');
    const second = spawnDebugCompanion(state, 'agent_1', 'companion.wayfarer');

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(second.nodeId).not.toBe(first.nodeId);
    expect(getCompanions(state.graph, 'agent_1')).toHaveLength(2);
  });

  it('refuses an unknown template and an unknown actor without throwing', () => {
    const state = makeCompanionWorld();

    const badTemplate = spawnDebugCompanion(state, 'agent_1', 'companion.does-not-exist');
    expect(badTemplate.success).toBe(false);
    expect(badTemplate.message).toContain('No companion template matching');

    const badActor = spawnDebugCompanion(state, 'Nobody At All', 'companion.wayfarer');
    expect(badActor.success).toBe(false);
    expect(badActor.message).toContain('No actor matching');
    expect(getCompanions(state.graph, 'agent_1')).toHaveLength(0);
  });

  it('mints onto the ascendant, and that companion raises the ascendant capability the walk reads', () => {
    const state = makeCompanionWorld();
    const before = computeRawScore(state.graph, 'asc_1', 'iron');

    const result = spawnDebugCompanion(state, '@ascendant', 'companion.sellsword-band');

    expect(result.success).toBe(true);
    const companions = getCompanions(state.graph, 'asc_1');
    expect(companions).toHaveLength(1);
    // Decision 2 (THR-1413): the grant is NOT refused, because the contribution is
    // already live — `computeRawScore` walks `accompanies` on any node, so refusing
    // would delete a working capability term. `AscendantSheet` renders it instead.
    const contribution = companions[0].domainContributions.iron ?? 0;
    expect(contribution).toBeGreaterThan(0);
    expect(computeRawScore(state.graph, 'asc_1', 'iron')).toBeCloseTo(before + contribution, 5);
  });
});
