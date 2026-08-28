import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { DEFAULT_REPUTATION } from '../../types/disposition';
import { WorldGraph } from '../graph';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { GATE_DUTY_NUDGE_IDS } from '../../data/civic-guard-encounter-content';
import { prepareEncounterSupportBundle } from '../encounterSupportBundle';
import { initializeClearanceGates } from '../clearanceGate';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { executeStepResult } from '../unifiedActionResolution';
import { clearTraces } from '../traceBuffer';

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 21,
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

function makeGateDutyGraph(): WorldGraph {
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

  addIndividual(graph, 'agent_1', 'Recruit', { spotlightTier: 'spotlight' }, 'loc_town');
  addIndividual(graph, 'guard_1', 'Town Guard', { npcRole: 'guard' }, 'loc_gatehouse');
  addIndividual(graph, 'captain_1', 'Gate Captain', { npcRole: 'guard_captain' }, 'loc_gatehouse');

  return graph;
}

function makeGateDutyAction(
  state: GameState,
  template: UnifiedActionTemplate,
) {
  const supportBindings = prepareEncounterSupportBundle(state, template, 'loc_town');
  const gateInit = initializeClearanceGates(
    state.clearanceGateStates,
    template,
    supportBindings,
    'loc_town',
    state.tick,
  );
  state.clearanceGateStates = gateInit.clearanceGateStates;
  const action = createUnifiedAction({
    actorId: 'agent_1',
    templateId: template.id,
    targetId: 'loc_town',
    scale: template.scale,
    source: 'agent',
    tick: state.tick,
    template,
    rng: () => 0.5,
    supportBindings,
    clearanceGateIds: gateInit.gateIds,
  });
  return { action, gateId: gateInit.gateIds[0] };
}

/**
 * Commit one nudge card onto the action's current step (THR-1123).
 *
 * The branch arms below used to preload a three-entry `choiceHistory` once and
 * drive all three steps off it, because the consequence table keyed on the
 * remembered `interventionType`. It keys on the played card now, read from
 * `activeNudges` — which names the cards on the *current* step only — so the
 * hand has to be committed per step, exactly as the stage commits it.
 */
function withHand<T extends { activeNudges?: readonly string[] }>(action: T, nudgeId: string): T {
  return { ...action, activeNudges: [nudgeId] };
}

describe('clearanceGate Gate Duty proving slice', () => {
  it('initializes a persistent clearance shell for Gate Duty', () => {
    resetUnifiedActionCounter();
    clearTraces();

    const graph = makeGateDutyGraph();
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    expect(template).toBeDefined();
    const { gateId } = makeGateDutyAction(state, template!);
    const gateState = gateId ? state.clearanceGateStates?.get(gateId) : undefined;

    expect(gateId).toBe('clearance_gate_cg.quest.gate_duty_loc_town_checkpoint_clearance');
    expect(gateState?.state).toBe('pending');
    expect(gateState?.persistence).toBe('must-persist');
    expect(gateState?.revealedSignalKeys).toEqual(['witness_pressure']);
  });

  it('lets Gate Duty reveal, escalate, and clear checkpoint scrutiny across steps', () => {
    resetUnifiedActionCounter();
    clearTraces();

    const graph = makeGateDutyGraph();
    const state = makeState(graph);
    const template = getUnifiedTemplateById('cg.quest.gate_duty');

    expect(template).toBeDefined();
    const { action, gateId } = makeGateDutyAction(state, template!);

    const first = executeStepResult(
      action,
      template!,
      'success',
      template!.steps[0].onSuccess,
      state,
      () => 0.5,
      state.tick,
      { capability: 0.6, probability: 0.7, roll: 12 },
    );
    let gateState = gateId ? state.clearanceGateStates?.get(gateId) : undefined;
    expect(gateState?.state).toBe('flagged');
    expect(gateState?.revealedSignalKeys).toEqual(['witness_pressure', 'forged_papers']);
    expect(first.events[0]?.message).toContain('forged_papers revealed');
    expect(first.events[0]?.message).toContain('clearance flagged');

    const second = executeStepResult(
      first.updatedAction,
      template!,
      'success',
      template!.steps[1].onSuccess,
      state,
      () => 0.5,
      state.tick + 1,
      { capability: 0.7, probability: 0.75, roll: 11 },
    );
    gateState = gateId ? state.clearanceGateStates?.get(gateId) : undefined;
    expect(gateState?.state).toBe('exposed');
    expect(gateState?.revealedSignalKeys).toEqual(['witness_pressure', 'forged_papers', 'hidden_cargo']);
    expect(second.events[0]?.message).toContain('hidden_cargo revealed');
    expect(second.events[0]?.message).toContain('clearance exposed');

    executeStepResult(
      second.updatedAction,
      template!,
      'success',
      template!.steps[2].onSuccess,
      state,
      () => 0.5,
      state.tick + 2,
      { capability: 0.8, probability: 0.8, roll: 9 },
    );
    gateState = gateId ? state.clearanceGateStates?.get(gateId) : undefined;
    expect(gateState?.state).toBe('cleared');
  });

  it('lets different Gate Duty branches leave different reputation outcomes', () => {
    resetUnifiedActionCounter();
    clearTraces();

    const template = getUnifiedTemplateById('cg.quest.gate_duty');
    expect(template).toBeDefined();

    const supportiveGraph = makeGateDutyGraph();
    const supportiveState = makeState(supportiveGraph);
    const supportivePrep = makeGateDutyAction(supportiveState, template!);
    const supportiveAction = withHand(supportivePrep.action, GATE_DUTY_NUDGE_IDS[0].steady);

    const supportiveStep1 = executeStepResult(
      supportiveAction,
      template!,
      'success',
      template!.steps[0].onSuccess,
      supportiveState,
      () => 0.5,
      supportiveState.tick,
      { capability: 0.6, probability: 0.7, roll: 12 },
    );
    const supportiveStep2 = executeStepResult(
      withHand(supportiveStep1.updatedAction, GATE_DUTY_NUDGE_IDS[1].steady),
      template!,
      'success',
      template!.steps[1].onSuccess,
      supportiveState,
      () => 0.5,
      supportiveState.tick + 1,
      { capability: 0.7, probability: 0.75, roll: 11 },
    );
    executeStepResult(
      withHand(supportiveStep2.updatedAction, GATE_DUTY_NUDGE_IDS[2].steady),
      template!,
      'success',
      template!.steps[2].onSuccess,
      supportiveState,
      () => 0.5,
      supportiveState.tick + 2,
      { capability: 0.8, probability: 0.8, roll: 9 },
    );

    const supportiveGate = supportivePrep.gateId ? supportiveState.clearanceGateStates?.get(supportivePrep.gateId) : undefined;
    const supportiveRep = (supportiveState.graph.getNode('agent_1')?.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;

    const coerciveGraph = makeGateDutyGraph();
    const coerciveState = makeState(coerciveGraph);
    const coercivePrep = makeGateDutyAction(coerciveState, template!);
    const coerciveAction = withHand(coercivePrep.action, GATE_DUTY_NUDGE_IDS[0].force);

    const coerciveStep1 = executeStepResult(
      coerciveAction,
      template!,
      'success',
      template!.steps[0].onSuccess,
      coerciveState,
      () => 0.5,
      coerciveState.tick,
      { capability: 0.6, probability: 0.7, roll: 12 },
    );
    const coerciveStep2 = executeStepResult(
      withHand(coerciveStep1.updatedAction, GATE_DUTY_NUDGE_IDS[1].force),
      template!,
      'success',
      template!.steps[1].onSuccess,
      coerciveState,
      () => 0.5,
      coerciveState.tick + 1,
      { capability: 0.7, probability: 0.75, roll: 11 },
    );
    executeStepResult(
      withHand(coerciveStep2.updatedAction, GATE_DUTY_NUDGE_IDS[2].force),
      template!,
      'success',
      template!.steps[2].onSuccess,
      coerciveState,
      () => 0.5,
      coerciveState.tick + 2,
      { capability: 0.8, probability: 0.8, roll: 9 },
    );

    const coerciveGate = coercivePrep.gateId ? coerciveState.clearanceGateStates?.get(coercivePrep.gateId) : undefined;
    const coerciveRep = (coerciveState.graph.getNode('agent_1')?.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;

    // THR-1212 slice 6 — the branches used to diverge on two channels, follow-on
    // tags and reputation. The tag channel is retired (nothing ever read a tag
    // back), so reputation is the divergence that remains, and both branches
    // still resolve a real gate — asserted so this does not quietly become a
    // test of two `undefined`s.
    expect(supportiveGate).toBeDefined();
    expect(coerciveGate).toBeDefined();
    expect(supportiveRep).toBeGreaterThan(coerciveRep);
  });
});
