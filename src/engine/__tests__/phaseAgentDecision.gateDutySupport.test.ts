import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { phaseAgentDecision } from '../phaseAgentDecision';

vi.mock('../encounterFilterPipeline', () => ({
  runFilterPipeline: () => ({
    candidates: [{ templateId: 'cg.quest.gate_duty', locationId: 'loc_town' }],
    trace: { category: 'encounter_filter', summary: 'mock filter' },
  }),
}));

vi.mock('../socialEncounterGeneration', () => ({
  generateSocialCandidates: () => [],
}));

vi.mock('../factionQuestGeneration', () => ({
  generateFactionQuestCandidates: () => [],
  generateFactionLifecycleCandidates: () => [],
}));

vi.mock('../encounterScoring', () => ({
  scoreAndSelect: (candidates: Array<{ templateId: string; locationId: string }>) => {
    const entry = candidates[0];
    return {
      selected: entry ? {
        action: 'start_local',
        entry,
        completionProb: 0.72,
        pushBenefit: 0,
        resistBenefit: 0,
        expectedUtility: 1.1,
      } : null,
      topCandidates: entry ? [{
        entry,
        finalScore: 1.1,
        travelCost: 0,
        completionProb: 0.72,
        desireMultiplier: 1,
      }] : [],
      trace: { category: 'encounter_scoring', summary: 'mock scoring' },
    };
  },
}));

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 3,
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
  properties: Record<string, unknown>,
  locationId: string,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      spotlightTier: 'ambient',
      ...properties,
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

describe('phaseAgentDecision Gate Duty support bundle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts Gate Duty as a unified action and binds a reuse-first support bundle', () => {
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

    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Recruit',
      properties: {
        actorType: 'individual',
        spotlightTier: 'spotlight',
        axiologicalProfile: {
          courage_prudence: 0,
          loyalty_ambition: 0,
          mercy_justice: 0,
          tradition_innovation: 0,
          community_autonomy: 0,
          faith_reason: 0,
          creation_destruction: 0,
          order_chaos: 0,
          nature_civilization: 0,
          generosity_acquisitiveness: 0,
        },
      },
    });
    graph.addEdge({
      id: 'located_at_agent_1_loc_town',
      source: 'agent_1',
      target: 'loc_town',
      type: 'located_at',
      properties: {},
    });

    addIndividual(graph, 'guard_1', 'Town Guard', { npcRole: 'guard' }, 'loc_gatehouse');
    addIndividual(graph, 'captain_1', 'Gate Captain', { npcRole: 'guard_captain' }, 'loc_gatehouse');

    const state = makeState(graph);
    const encounterCache = {
      getAllEntries: () => [{ templateId: 'cg.quest.gate_duty', locationId: 'loc_town' }],
    } as never;

    const result = phaseAgentDecision(state, encounterCache, {} as never, () => 0.5);

    expect(result.unifiedActions).toHaveLength(1);
    expect(result.unifiedActions?.[0]?.templateId).toBe('cg.quest.gate_duty');
    expect(result.unifiedActions?.[0]?.supportBindings?.map(binding => binding.key)).toEqual([
      'gatehouse',
      'gate_guard',
      'gate_captain',
      'suspect_courier',
      'checkpoint_witness',
    ]);
    expect(result.unifiedActions?.[0]?.clearanceGateIds).toHaveLength(1);
    const gateId = result.unifiedActions?.[0]?.clearanceGateIds?.[0];
    expect(gateId).toBe('clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance');
    const gateState = gateId ? result.clearanceGateStates?.get(gateId) : undefined;
    expect(gateState?.state).toBe('pending');
    expect(gateState?.anchorLocationId).toBe('loc_town');
    expect(gateState?.subjectNodeId).toBe('enc_support_cg.quest.gate_duty_loc_town_suspect_courier');
    expect(gateState?.authorityNodeId).toBe('captain_1');
    expect(gateState?.revealedSignalKeys).toEqual(['witness_pressure']);
    expect(graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier')).toBeDefined();
    expect(graph.getNode('enc_support_cg.quest.gate_duty_loc_town_checkpoint_witness')).toBeDefined();
  });
});
