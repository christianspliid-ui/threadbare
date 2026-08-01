import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { ensureDebugSpawnThread, prepareDebugEncounterContext, prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { phaseEncounterVisibility } from '../encounterVisibility';
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
      properties: { locationSubtype: template!.locationSubtypes![0] },
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

describe('debug spawn threads its target (THR-934)', () => {
  const GATE_DUTY = 'cg.quest.gate_duty';

  /**
   * The real `?spawn` shape: the ascendant has an avatar (what `@hero` resolves
   * to) and that avatar carries NO thread edge. Before THR-934 the spawn only
   * overrode the court position on its own notification, so every later tick
   * fell back to `collectThreadedAgents`' synthetic avatar entry — which stamps
   * `auto_resolve`, giving steps 2+ a notification that never auto-opened.
   */
  function makeUnthreadedAvatarState(): GameState {
    const state = makeGateDutyState();
    const graph = state.graph;
    graph.addNode({
      id: 'avatar_1',
      type: 'actor',
      name: 'Ashara',
      properties: { actorType: 'individual', spotlightTier: 'spotlight' },
    });
    graph.addEdge({ id: 'avatar_of_edge', source: 'avatar_1', target: 'asc_1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'avatar_1_loc', source: 'avatar_1', target: 'loc_town', type: 'located_at', properties: {} });
    return state;
  }

  function threadEdgeFor(state: GameState, agentId: string) {
    return state.graph.getOutgoingEdges('asc_1', 'thread').find(edge => edge.target === agentId);
  }

  it('writes a the_first/pause thread edge for an unthreaded spawn target', () => {
    const state = makeUnthreadedAvatarState();
    expect(threadEdgeFor(state, 'avatar_1')).toBeUndefined();

    const result = prepareDebugEncounterSpawn(state, '@hero', GATE_DUTY, { courtPosition: 'the_first' });

    expect(result.success).toBe(true);
    expect(result.agent?.id).toBe('avatar_1');
    expect(result.threadWrite?.created).toBe(true);

    const edge = threadEdgeFor(state, 'avatar_1');
    expect(edge).toBeDefined();
    expect(edge!.properties.courtPosition).toBe('the_first');
    expect(edge!.properties.attentionMode).toBe('pause');
  });

  it('retunes an existing auto_resolve thread rather than inheriting the setting that suppresses continuation', () => {
    const state = makeUnthreadedAvatarState();
    // `?seeded` writes exactly this shape for Kael — threaded, but auto_resolve.
    state.graph.addEdge({
      id: 'edge_thread_asc_1_avatar_1',
      source: 'asc_1',
      target: 'avatar_1',
      type: 'thread',
      properties: { courtPosition: 'the_first', attentionMode: 'auto_resolve', tier: 1 },
    });

    const result = prepareDebugEncounterSpawn(state, '@hero', GATE_DUTY, { courtPosition: 'the_first' });

    expect(result.success).toBe(true);
    expect(result.threadWrite?.created).toBe(false);
    expect(result.threadWrite?.retuned).toBe(true);
    expect(threadEdgeFor(state, 'avatar_1')!.properties.attentionMode).toBe('pause');
    // Merge semantics: untouched properties survive the retune.
    expect(threadEdgeFor(state, 'avatar_1')!.properties.tier).toBe(1);
  });

  it('leaves the graph alone when no court position is requested', () => {
    const state = makeUnthreadedAvatarState();
    const before = state.graph.getOutgoingEdges('asc_1', 'thread').length;

    const result = prepareDebugEncounterSpawn(state, '@hero', GATE_DUTY);

    expect(result.success).toBe(true);
    expect(result.threadWrite).toBeUndefined();
    expect(state.graph.getOutgoingEdges('asc_1', 'thread')).toHaveLength(before);
  });

  it('fails soft in a world with no ascendant', () => {
    const state = makeUnthreadedAvatarState();
    (state as { ascendantId: string | null }).ascendantId = null;

    const write = ensureDebugSpawnThread(state, 'avatar_1', 'the_first', 3);

    expect(write).toEqual({ threadEdgeId: null, created: false, retuned: false });
    expect(threadEdgeFor(state, 'avatar_1')).toBeUndefined();
  });

  /**
   * The defect itself, driven through the real harness: after the spawn commits
   * step 1, `phaseEncounterVisibility` must produce a step-2 notification that
   * *auto-opens*. `shouldAutoOpenEncounterNotification` treats a non-null
   * `autoResolveTick` as "do not open now", so a notification that merely exists
   * is not evidence — the null tick is the thing that pops the stage.
   */
  it('generates an auto-opening step-2 notification after the spawn advances', () => {
    const state = makeUnthreadedAvatarState();
    const prepared = prepareDebugEncounterSpawn(state, '@hero', GATE_DUTY, { courtPosition: 'the_first' });
    expect(prepared.success).toBe(true);
    expect(prepared.unifiedAction).toBeDefined();

    // Advance to step 2 the way phaseEncounterProgressionV2 would, then let the
    // visibility phase decide what the player sees.
    const action = { ...prepared.unifiedAction!, currentStep: 1 };
    state.unifiedActions = [action];
    state.encounterNotifications = [];

    const { notifications } = phaseEncounterVisibility(state);
    const stepTwo = notifications.find(
      n => n.agentId === 'avatar_1' && n.stepIndex === 1 && n.sourceSystem === 'unified_action',
    );

    expect(stepTwo).toBeDefined();
    expect(stepTwo!.courtPosition).toBe('the_first');
    expect(stepTwo!.autoResolveTick).toBeNull();
  });

  it('would not auto-open without the thread write — guard falsification', () => {
    const state = makeUnthreadedAvatarState();
    const prepared = prepareDebugEncounterSpawn(state, '@hero', GATE_DUTY, { courtPosition: 'the_first' });
    expect(prepared.success).toBe(true);

    // Drop the edge the spawn wrote: this reproduces the pre-THR-934 world, where
    // only `collectThreadedAgents`' synthetic auto_resolve avatar entry remains.
    state.graph.removeEdge(threadEdgeFor(state, 'avatar_1')!.id);

    const action = { ...prepared.unifiedAction!, currentStep: 1 };
    state.unifiedActions = [action];
    state.encounterNotifications = [];

    const { notifications } = phaseEncounterVisibility(state);
    const stepTwo = notifications.find(n => n.agentId === 'avatar_1' && n.stepIndex === 1);

    // The notification is still generated — it just never surfaces. That is
    // precisely why the bug read as "steps 2+ resolve silently".
    expect(stepTwo).toBeDefined();
    expect(stepTwo!.autoResolveTick).not.toBeNull();
  });
});
