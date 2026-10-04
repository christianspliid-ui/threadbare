/**
 * THR-1722 regression — a planner decision that selects a template living ONLY in
 * the unified catalogue (every `encounter.town.*` expert encounter, the
 * `encounter.slice.*` set, `reputation.*`, …) must finish its bookkeeping: the
 * "X begins Y" `agent_encounter` news line and one `encounter_decision` balance
 * event. Before the fix the post-branch block read `template.name` off the legacy
 * lookup, which is `undefined` for these templates; the throw was swallowed by
 * the per-agent catch after the action had already been pushed, so the encounter
 * ran but was never announced or recorded.
 */
import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { phaseAgentDecision } from '../phaseAgentDecision';
import { createSimulationRuntime } from '../simulationRuntime';
import { getBalanceEvents } from '../balanceTelemetry';

const UNIFIED_ONLY_ID = 'encounter.slice.thr1722_unified_only';

vi.mock('../encounterFilterPipeline', () => ({
  runFilterPipeline: () => ({
    candidates: [{ templateId: 'encounter.slice.thr1722_unified_only', locationId: 'loc_town' }],
    trace: { category: 'encounter_filter', summary: 'mock filter' },
  }),
}));

vi.mock('../socialEncounterGeneration', () => ({
  generateSocialCandidates: () => [],
  collectBlessedHearthIds: () => new Set<string>(),
}));

vi.mock('../factionQuestGeneration', () => ({
  generateFactionQuestCandidates: () => [],
  generateFactionLifecycleCandidates: () => [],
}));

// Partial mock: the decision's novelty bookkeeping reads real constants from this
// module, and a missing export would throw into the same per-agent catch this
// test is watching.
vi.mock('../encounterScoring', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../encounterScoring')>()),
  scoreAndSelect: (candidates: Array<{ templateId: string; locationId: string }>) => {
    const entry = candidates[0];
    const candidate = entry ? {
      entry,
      action: 'start_local' as const,
      finalScore: 1.2,
      travelCost: 0,
      completionProb: 0.8,
      pushBenefit: 0,
      resistBenefit: 0,
      engagementForecast: 0.5,
      expectedUtility: 1.2,
      desireMultiplier: 1,
      totalCost: 0,
      valuePerTick: 1.2,
      axiologicalScore: 0,
      ambitionBoost: 0,
      familiarityPenalty: 0,
      explorationBonus: 0,
      chainBonus: 0,
      resonance: 0,
      globalResonance: 0,
      ruinsBonus: 0,
      attractionBonus: 0,
      hunchBonus: 0,
      rarityMultiplier: 1,
      roleAffinityMultiplier: 1,
    } : null;
    return {
      selected: candidate,
      topCandidates: candidate ? [candidate] : [],
      rankedCandidates: candidate ? [candidate] : [],
      trace: { category: 'encounter_scoring', summary: 'mock scoring' },
    };
  },
}));

// The legacy catalogue knows nothing about the template — that is the whole case.
vi.mock('../../data/encounter-content', async () => {
  const actual = await vi.importActual<typeof import('../../data/encounter-content')>('../../data/encounter-content');
  return {
    ...actual,
    getAnyEncounterById: () => undefined,
  };
});

vi.mock('../../data/unified-action-templates', () => ({
  getUnifiedTemplateById: (id: string) => id === 'encounter.slice.thr1722_unified_only'
    ? {
        id,
        name: 'The Unsafe Crossing',
        reach: 'gold',
        crudType: 'read',
        scale: 'local',
        steps: [{
          reach: 'gold',
          duration: { min: 1, max: 1 },
          difficulty: 0.1,
          onSuccess: [],
          onFailure: [],
          failBehavior: 'continue_weakened',
        }],
        apCost: 1,
        actorAffinities: ['individual'],
        motivations: ['asceticism_extravagance'],
        narrativeTemplates: {
          initiation: 'begins',
          success: 'succeeds',
          failure: 'fails',
        },
        rarityTier: 1,
      }
    : undefined,
}));

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_town',
    type: 'location',
    name: 'Mock Town',
    properties: { locationType: 'town' },
  });
  graph.addNode({
    id: 'agent_1',
    type: 'actor',
    name: 'Trader',
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
  return graph;
}

function makeTestState(graph: WorldGraph): GameState {
  return {
    tick: 1,
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
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  } as unknown as GameState;
}

describe('phaseAgentDecision — unified-only template bookkeeping (THR-1722)', () => {
  it('announces the start and records one encounter_decision for a template only the unified catalogue knows', () => {
    const state = makeTestState(makeWorld());
    const runtime = createSimulationRuntime();
    const encounterCache = {
      getAllEntries: () => [{ templateId: UNIFIED_ONLY_ID, locationId: 'loc_town' }],
    } as any;

    const result = phaseAgentDecision(state, encounterCache, {} as any, () => 0.5, runtime);

    // The action starts (it did before the fix too).
    expect(result.unifiedActions).toHaveLength(1);
    expect(result.unifiedActions?.[0]?.templateId).toBe(UNIFIED_ONLY_ID);

    // The "begins" news line reaches the feed, named from the unified template.
    const begins = (result.tickEvents ?? []).filter(e => e.type === 'agent_encounter');
    expect(begins).toHaveLength(1);
    expect(begins[0].message).toBe('Trader begins The Unsafe Crossing');

    // Exactly one planner decision is recorded for it.
    const decisions = getBalanceEvents(runtime).filter(
      e => e.kind === 'encounter_decision' && e.templateId === UNIFIED_ONLY_ID,
    );
    expect(decisions).toHaveLength(1);
    expect(decisions[0].decisionType).toBe('start_local');
    expect(decisions[0].sourceSystem).toBe('planner');
  });
});
