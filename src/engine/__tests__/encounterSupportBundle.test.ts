import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { prepareEncounterSupportBundle } from '../encounterSupportBundle';

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 12,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: null,
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
    pendingQuintessenceEvents: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

function addIndividual(
  graph: WorldGraph,
  id: string,
  name: string,
  npcRole: string,
  locationId: string,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      npcRole,
      importance: 0,
      sphereAffinity: null,
    },
  });
  graph.addEdge({
    id: `${id}_located_at_${locationId}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function makeGateDutyGraph(withWitnessMerchant = false): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'loc_town',
    type: 'location',
    name: 'Mock Town',
    properties: { locationSubtype: 'town' },
  });
  graph.addNode({
    id: 'loc_gatehouse',
    type: 'location',
    name: 'North Gatehouse',
    properties: {
      locationSubtype: 'encounter_support',
      sublocationTypeId: 'sublocation-type.gatehouse',
      parentLocationId: 'loc_town',
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
    name: 'Town Culture',
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

  addIndividual(graph, 'guard_1', 'Town Guard', 'guard', 'loc_gatehouse');
  addIndividual(graph, 'captain_1', 'Gate Captain', 'guard_captain', 'loc_gatehouse');

  graph.addEdge({
    id: 'guard_1_member_of_faction_cg',
    source: 'guard_1',
    target: 'faction_cg',
    type: 'member_of',
    properties: { role: 'guard', rank: 0.2, joinedTick: 0 },
  });
  graph.addEdge({
    id: 'captain_1_member_of_faction_cg',
    source: 'captain_1',
    target: 'faction_cg',
    type: 'member_of',
    properties: { role: 'guard_captain', rank: 0.4, joinedTick: 0 },
  });

  if (withWitnessMerchant) {
    addIndividual(graph, 'merchant_1', 'Line Merchant', 'merchant', 'loc_gatehouse');
  }

  return graph;
}

describe('prepareEncounterSupportBundle', () => {
  it('reuses seeded gate support and materializes persistent missing cast for Gate Duty', () => {
    const graph = makeGateDutyGraph(false);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    expect(template).toBeDefined();
    const bindings = prepareEncounterSupportBundle(state, template!, 'loc_town');

    expect(bindings.map(binding => binding.key)).toEqual([
      'gatehouse',
      'gate_guard',
      'gate_captain',
      'suspect_courier',
      'checkpoint_witness',
    ]);

    expect(bindings.find(binding => binding.key === 'gatehouse')?.nodeId).toBe('loc_gatehouse');
    expect(bindings.find(binding => binding.key === 'gate_guard')?.nodeId).toBe('guard_1');
    expect(bindings.find(binding => binding.key === 'gate_captain')?.nodeId).toBe('captain_1');
    expect(bindings.find(binding => binding.key === 'suspect_courier')?.reused).toBe(false);
    expect(bindings.find(binding => binding.key === 'checkpoint_witness')?.reused).toBe(false);

    const courier = graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier');
    const witness = graph.getNode('enc_support_cg.quest.gate_duty_loc_town_checkpoint_witness');
    expect(courier?.properties.encounterSupportRole).toBe('checkpoint_courier');
    expect(witness?.properties.encounterSupportRole).toBe('checkpoint_witness');

    expect(graph.getOutgoingEdges(courier!.id, 'located_at')[0]?.target).toBe('loc_gatehouse');
    expect(graph.getOutgoingEdges(witness!.id, 'located_at')[0]?.target).toBe('loc_gatehouse');
    expect(graph.getOutgoingEdges(courier!.id, 'belongs_to')[0]?.target).toBe('culture_1');
  });

  it('is reuse-first and idempotent when suitable support already exists', () => {
    const graph = makeGateDutyGraph(true);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    const firstBindings = prepareEncounterSupportBundle(state, template!, 'loc_town');
    const secondBindings = prepareEncounterSupportBundle(state, template!, 'loc_town');

    expect(firstBindings.find(binding => binding.key === 'checkpoint_witness')?.nodeId).toBe('merchant_1');
    expect(firstBindings.find(binding => binding.key === 'checkpoint_witness')?.reused).toBe(true);
    expect(secondBindings.find(binding => binding.key === 'suspect_courier')?.nodeId)
      .toBe('enc_support_cg.quest.gate_duty_loc_town_suspect_courier');
    expect(secondBindings.find(binding => binding.key === 'suspect_courier')?.reused).toBe(true);

    const checkpointCouriers = graph.getNodesByType('actor')
      .filter(node => node.properties.encounterSupportRole === 'checkpoint_courier');
    expect(checkpointCouriers).toHaveLength(1);
  });

  it('anchors support to the parent settlement when triggered from an actor target', () => {
    const graph = makeGateDutyGraph(true);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    const bindings = prepareEncounterSupportBundle(state, template!, 'guard_1');

    expect(bindings.find(binding => binding.key === 'gatehouse')?.nodeId).toBe('loc_gatehouse');
    expect(bindings.find(binding => binding.key === 'gate_guard')?.nodeId).toBe('guard_1');
    expect(bindings.find(binding => binding.key === 'gate_captain')?.nodeId).toBe('captain_1');
    expect(graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier')).toBeDefined();
    expect(graph.getNode('enc_support_cg.quest.gate_duty_guard_1_suspect_courier')).toBeUndefined();
  });

  it('uses the selected encounter location as a fallback anchor for non-spatial targets like factions', () => {
    const graph = makeGateDutyGraph(false);
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    const bindings = prepareEncounterSupportBundle(state, template!, 'faction_cg', 'loc_town');

    expect(bindings.find(binding => binding.key === 'gatehouse')?.nodeId).toBe('loc_gatehouse');
    expect(bindings.find(binding => binding.key === 'gate_guard')?.nodeId).toBe('guard_1');
    expect(bindings.find(binding => binding.key === 'gate_captain')?.nodeId).toBe('captain_1');
    expect(graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier')).toBeDefined();
    expect(graph.getNode('enc_support_cg.quest.gate_duty_faction_cg_suspect_courier')).toBeUndefined();
  });
});
