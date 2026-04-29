import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { prepareDebugEncounterContext, prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { ENCOUNTER_TEMPLATES } from '../../data/encounter-content';
import * as unifiedActionTemplates from '../../data/unified-action-templates';

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 9,
    cycle: 0,
    seed: 77,
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

function makeGateDutyState(): GameState {
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
    id: 'asc_1',
    type: 'actor',
    name: 'The Ascendant',
    properties: { actorType: 'ascendant' },
  });

  addIndividual(graph, 'agent_1', 'Recruit', { spotlightTier: 'spotlight' }, 'loc_town');
  addIndividual(graph, 'guard_1', 'Town Guard', { npcRole: 'guard' }, 'loc_gatehouse');
  addIndividual(graph, 'captain_1', 'Gate Captain', { npcRole: 'guard_captain' }, 'loc_gatehouse');

  graph.addEdge({
    id: 'asc_1_threads_agent_1',
    source: 'asc_1',
    target: 'agent_1',
    type: 'thread',
    properties: {
      courtPosition: 'retinue',
      attentionMode: 'pause',
      tier: 2,
    },
  });

  return makeState(graph);
}

describe('prepareDebugEncounterSpawn', () => {
  it('prepares encounter context by creating a valid anchor and filling missing support bundle pieces', () => {
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
      properties: { actorType: 'individual', spotlightTier: 'spotlight' },
    });
    graph.addNode({
      id: 'origin_loc',
      type: 'location',
      name: 'Origin',
      properties: { hexCol: 1, hexRow: 1, locationSubtype: 'hamlet' },
    });
    graph.addEdge({
      id: 'agent_1_loc_origin',
      source: 'agent_1',
      target: 'origin_loc',
      type: 'located_at',
      properties: {},
    });
    graph.addNode({
      id: 'faction_cg',
      type: 'actor',
      name: 'Civic Guard',
      properties: { actorType: 'faction', factionDefId: 'civic_guard' },
    });

    const state = makeState(graph);
    const result = prepareDebugEncounterContext(state, 'cg.quest.gate_duty', {
      agentQuery: 'Recruit',
      col: 10,
      row: 10,
    });

    expect(result.success).toBe(true);
    expect(result.anchorLocationName).toContain('Gate Duty Test');
    expect(result.bindings?.map(binding => binding.key)).toEqual([
      'gatehouse',
      'gate_guard',
      'gate_captain',
      'suspect_courier',
      'checkpoint_witness',
    ]);
    expect(result.createdAnchor).toBe(true);
    expect(result.movedAgent).toBe(true);
    expect(state.graph.getOutgoingEdges('agent_1', 'located_at')[0]?.target).toBe(result.anchorLocationId);
  });

  it('creates the full Gate Duty unified encounter payload for debug spawning', () => {
    const state = makeGateDutyState();

    const result = prepareDebugEncounterSpawn(
      state,
      'Recruit',
      'cg.quest.gate_duty',
      { courtPosition: 'the_first' },
    );

    expect(result.success).toBe(true);
    expect(result.mode).toBe('unified');
    expect(result.template?.id).toBe('cg.quest.gate_duty');
    expect(result.unifiedAction?.supportBindings?.map(binding => binding.key)).toEqual([
      'gatehouse',
      'gate_guard',
      'gate_captain',
      'suspect_courier',
      'checkpoint_witness',
    ]);
    expect(result.notification?.courtPosition).toBe('the_first');
    expect(result.encounterProgress).toBeUndefined();
    expect(result.clearanceGateStates?.get('clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance')?.state).toBe('pending');
    expect(state.graph.getNode('enc_support_cg.quest.gate_duty_loc_town_suspect_courier')).toBeDefined();
  });

  it('falls back to a legacy encounter progress payload for non-migrated templates', () => {
    const template = ENCOUNTER_TEMPLATES[0];
    expect(template).toBeDefined();

    const graph = new WorldGraph();
    graph.addNode({
      id: 'asc_1',
      type: 'actor',
      name: 'The Ascendant',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'loc_1',
      type: 'location',
      name: 'Test Location',
      properties: { locationSubtype: template!.locationTypes[0] },
    });
    addIndividual(graph, 'agent_1', 'Scout', { spotlightTier: 'spotlight' }, 'loc_1');

    const state = makeState(graph);
    const unifiedLookupSpy = vi
      .spyOn(unifiedActionTemplates, 'getUnifiedTemplateById')
      .mockReturnValue(undefined);

    try {
      const result = prepareDebugEncounterSpawn(state, 'Scout', template!.id);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('legacy');
      expect(result.encounterProgress?.encounterId).toBe(template!.id);
      expect(result.unifiedAction).toBeUndefined();
      expect(result.notification?.courtPosition).toBe('retinue');
    } finally {
      unifiedLookupSpy.mockRestore();
    }
  });
});

describe('alias resolution and output clarity', () => {
  function makeStateWithAvatar(): GameState {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc_1', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avatar_1', type: 'actor', name: 'Ashara', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    graph.addNode({ id: 'other_ind', type: 'actor', name: 'Alpha Guard', properties: { actorType: 'individual', spotlightTier: 'ambient' } });
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Village', properties: { locationSubtype: 'hamlet', hexCol: 1, hexRow: 1 } });
    graph.addEdge({ id: 'avatar_of_edge', source: 'avatar_1', target: 'asc_1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'avatar_1_loc', source: 'avatar_1', target: 'loc_1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'other_ind_loc', source: 'other_ind', target: 'loc_1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'thread_avatar', source: 'asc_1', target: 'avatar_1', type: 'thread', properties: { courtPosition: 'the_first', attentionMode: 'pause', tier: 5 } });
    return makeState(graph);
  }

  it('@hero resolves to the avatar, not an alphabetically-earlier individual', () => {
    const state = makeStateWithAvatar();
    const template = ENCOUNTER_TEMPLATES[0];
    if (!template) return; // skip if no templates available
    const result = prepareDebugEncounterSpawn(state, '@hero', template.id);
    expect(result.success).toBe(true);
    expect(result.agent?.id).toBe('avatar_1');
    expect(result.agent?.name).toBe('Ashara');
  });

  it('@avatar resolves to the avatar via avatar_of edge', () => {
    const state = makeStateWithAvatar();
    const template = ENCOUNTER_TEMPLATES[0];
    if (!template) return;
    const result = prepareDebugEncounterSpawn(state, '@avatar', template.id);
    expect(result.success).toBe(true);
    expect(result.agent?.id).toBe('avatar_1');
  });

  it('resolution echo appears in message when query is an alias', () => {
    const state = makeStateWithAvatar();
    const template = ENCOUNTER_TEMPLATES[0];
    if (!template) return;
    const result = prepareDebugEncounterSpawn(state, '@hero', template.id);
    expect(result.success).toBe(true);
    // The message should show what @hero resolved to
    expect(result.message).toContain('resolved');
    expect(result.message).toContain('Ashara');
    expect(result.message).toContain('avatar_1');
  });

  it('no resolution echo when agent name matches exactly', () => {
    const state = makeStateWithAvatar();
    const template = ENCOUNTER_TEMPLATES[0];
    if (!template) return;
    const result = prepareDebugEncounterSpawn(state, 'Ashara', template.id);
    expect(result.success).toBe(true);
    // Exact name match — no resolution note needed
    expect(result.message).not.toContain('resolved');
  });
});
