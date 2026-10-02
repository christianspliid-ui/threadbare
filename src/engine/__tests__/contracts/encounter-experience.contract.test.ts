import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState, ArchetypeDrift } from '../../../types/gameState';
import type { UnifiedAction, EncounterAftermathReaction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { phaseDetectionPressure, recordDetectionCrossings } from '../../orchestrator/phaseDetectionPressure';
import { applyEncounterAftermathReaction } from '../../encounterAftermath';
import { createSimulationRuntime } from '../../simulationRuntime';
import { isTemplateUnlocked } from '../../encounters/encounterTemplateGraph';
import { filterAscendantHand } from '../../encounters/handFilter';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { WORLD_SIM_TEST_TIMEOUT_MS } from '../../../testing/testTimeouts';

const AGENT_ID = 'actor.contract';

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua.contract',
    actorId: AGENT_ID,
    templateId: 'enc.contract',
    targetId: AGENT_ID,
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
    ...overrides,
  };
}

function createAftermathState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: 'Contract Agent',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc.contract',
    type: 'location',
    name: 'Contract Location',
    properties: { locationSubtype: 'town', regionId: 'region.contract' },
  });
  graph.addEdge({
    id: 'edge.located.contract',
    source: AGENT_ID,
    target: 'loc.contract',
    type: 'located_at',
    properties: {},
  });

  return {
    tick: 20,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc.contract',
    ascendantIdentity: {
      sphereAlignment: { primary: 'force', secondary: 'spirit' },
    } as never,
    essencePool: {} as never,
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
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    archetypeDrift: [],
    regionalDetectionPressure: [],
    regionDetection: [],
    pendingEncounterSeeds: [],
    clearanceGateStates: new Map(),
  } as GameState;
}

function makeTemplate(id: string, overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 1,
    intrinsicTier: 'background',
    name: id,
    reach: 'iron',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.2,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 1,
    actorAffinities: ['ascendant'],
    targetCategories: ['actor'],
    motivations: ['mercy_ruthlessness'],
    narrativeTemplates: {
      initiation: 'init',
      success: 'success',
      failure: 'fail',
    },
    ...overrides,
  };
}

describe('encounter-experience contract', { timeout: WORLD_SIM_TEST_TIMEOUT_MS }, () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('4.2 drift threshold crossing can trigger archetype drift registration', () => {
    const runtime = createSimulationRuntime();
    const state = createAftermathState();

    // THR-559: drift is keyed by the canonical axis id (`iron_axis`). The register
    // effect below authors the bare reach `'iron'` on purpose — the handler
    // canonicalizes it to match. (THR-964: the position past SOFT is seeded directly;
    // the retired choice-commit phase used to accumulate it.)
    state.archetypeDrift = [{
      agentId: AGENT_ID,
      axisId: 'iron_axis',
      fromPosition: 0.29,
      toPosition: 0.34,
      lastUpdatedTick: 19,
    } as ArchetypeDrift];

    const reaction: EncounterAftermathReaction = {
      id: 'reaction.drift',
      label: 'Drift register',
      effects: [{ kind: 'archetype_drift_register', axisId: 'iron', threshold: 'soft' }],
      closeAfterSelection: true,
    };

    applyEncounterAftermathReaction(state, makeAction(), reaction, state.tick, runtime);

    const driftEffect = getTraces().find((trace) =>
      trace.category === 'encounter_aftermath_effect'
      && (trace as { effectKind?: string }).effectKind === 'archetype_drift_register',
    ) as { success?: boolean } | undefined;

    expect(driftEffect).toBeDefined();
    expect(driftEffect?.success).toBe(true);
  });

  it('4.3 detection threshold crossing queues exactly one rival-detection seed', () => {
    const state = createAftermathState();
    // THR-964: a pressure writer reports its delta through the extracted helper;
    // the phase that follows only decays, so it must not re-cross or re-seed.
    // LEAKED until THR-1690: the helper is called by hand here — the live nudge
    // writer does not call it yet.
    const firstSeeds = recordDetectionCrossings(state.tick, 'region.contract', 0.9, 1, AGENT_ID, []);
    const firstPass = {
      regionalDetectionPressure: [{ regionId: 'region.contract', pressure: 1, lastUpdatedTick: state.tick }],
      regionDetection: [{ regionId: 'region.contract', pressure: 1, lastUpdatedTick: state.tick }],
      pendingEncounterSeeds: [...firstSeeds],
    };
    const firstEncounterCrossings = getTraces().filter((trace) =>
      trace.category === 'detection_threshold_crossed'
      && (trace as { thresholdCrossed?: string }).thresholdCrossed === 'encounter',
    );

    expect(firstEncounterCrossings).toHaveLength(1);
    expect(firstPass.pendingEncounterSeeds).toHaveLength(1);

    clearTraces();

    const secondState = createAftermathState();
    secondState.tick = state.tick + 1;
    secondState.regionalDetectionPressure = firstPass.regionalDetectionPressure;
    secondState.regionDetection = firstPass.regionDetection;
    secondState.pendingEncounterSeeds = firstPass.pendingEncounterSeeds;

    const secondPass = phaseDetectionPressure(secondState);
    const secondEncounterCrossings = getTraces().filter((trace) =>
      trace.category === 'detection_threshold_crossed'
      && (trace as { thresholdCrossed?: string }).thresholdCrossed === 'encounter',
    );

    expect(secondPass.pendingEncounterSeeds).toHaveLength(1);
    expect(secondEncounterCrossings).toHaveLength(0);
  });

  it('4.5 gates_to hard-unlock respects per-agent completed-template sets', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'enc.template.a',
      type: 'encounter_template',
      properties: { template_id: 'template.a' },
    });
    graph.addNode({
      id: 'enc.template.b',
      type: 'encounter_template',
      properties: { template_id: 'template.b' },
    });
    graph.addEdge({
      id: 'edge.gates.a.b',
      source: 'enc.template.a',
      target: 'enc.template.b',
      type: 'gates_to',
      properties: {},
    });

    const completedForAgentA = new Set(['template.a']);
    const completedForAgentB = new Set<string>();

    expect(isTemplateUnlocked(graph, 'enc.template.b', completedForAgentA)).toBe(true);
    expect(isTemplateUnlocked(graph, 'enc.template.b', completedForAgentB)).toBe(false);
  });

  it('4.6 hand filter cascade on realistic scene keeps valid cards and excludes place-mismatched cards', () => {
    const deck = [
      makeTemplate('playable.force', { sphereAffinity: 'force', targetCategories: ['actor'] }),
      makeTemplate('loc.consecrate.temple', { sphereAffinity: 'spirit', targetCategories: ['location'] }),
      makeTemplate('hidden.artifact', { targetCategories: ['artifact'] }),
    ];

    const hand = filterAscendantHand(deck, {
      sceneTargetCategories: ['actor', 'location'],
      essencePool: { force: 3, spirit: 3 },
      accessibleSpheres: ['force', 'spirit'],
      targetBondTier: 2,
      placeContext: { placeSphere: 'force' },
    });

    expect(hand.playable.map((entry) => entry.template.id)).toContain('playable.force');
    expect(hand.playable.map((entry) => entry.template.id)).not.toContain('loc.consecrate.temple');
    expect(hand.dimmed.some((entry) => entry.template.id === 'loc.consecrate.temple' && entry.prereq.code === 'place_gated')).toBe(true);
    expect(hand.hidden.some((entry) => entry.template.id === 'hidden.artifact')).toBe(true);
  });

  it('4.7 smoke: 30 ticks run without throws and produce encounter activity on seed 42 medium map', () => {
    resetDecisionCache();
    resetEventCounter();

    const archetype = generateArchetypes(4, 42)[0];
    const cosmology = createBalancedCosmology();
    const preset = MAP_SIZE_PRESETS.medium;
    const runtime = createSimulationRuntime();
    const { state: initial } = initializeGameState(
      archetype,
      'Contract-Smoke',
      cosmology,
      42,
      preset.cols,
      preset.rows,
    );

    let state = initial;
    let encounterStarts = 0;

    for (let step = 0; step < 30; step += 1) {
      state = runTick(state, [], runtime);
      encounterStarts += state.tickEvents.filter((event) => event.type === 'agent_encounter').length;
    }

    expect(state.tick).toBeGreaterThanOrEqual(initial.tick + 30);
    expect(encounterStarts).toBeGreaterThan(0);
    expect(state.graph.getNodesByType('actor').length).toBeGreaterThan(0);
  });
});
