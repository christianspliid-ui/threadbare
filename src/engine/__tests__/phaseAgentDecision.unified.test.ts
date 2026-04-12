import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { phaseAgentDecision } from '../phaseAgentDecision';

vi.mock('../encounterFilterPipeline', () => ({
  runFilterPipeline: () => ({
    candidates: [{ templateId: 'encounter.market_haggle', locationId: 'loc_town' }],
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
    const candidate = entry ? {
      entry,
      action: 'start_local' as const,
      finalScore: 1.2,
      travelCost: 0,
      completionProb: 0.8,
      pushBenefit: 0,
      resistBenefit: 0,
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

vi.mock('../../data/encounter-content', async () => {
  const actual = await vi.importActual<typeof import('../../data/encounter-content')>('../../data/encounter-content');
  return {
    ...actual,
    getAnyEncounterById: (id: string) => id === 'encounter.market_haggle'
      ? {
          id,
          name: 'The Market Haggle',
          locationTypes: ['town'],
          reachPrimary: 'gold',
          reachSecondary: 'heart',
          encounterType: 'acquire',
          threatRating: 'easy',
          motivations: ['asceticism_extravagance'],
          steps: [{
            id: 'market_haggle.entrance',
            name: 'The Entrance',
            reach: 'gold',
            difficulty: 10,
            duration: 1,
            narrative: 'Test narrative',
            onSuccess: { narrative: 'ok' },
            onFailure: { narrative: 'fail' },
          }],
        }
      : undefined,
  };
});

vi.mock('../../data/unified-action-templates', () => ({
  getUnifiedTemplateById: (id: string) => id === 'encounter.market_haggle'
    ? {
        id,
        name: 'The Market Haggle',
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

describe('phaseAgentDecision unified encounter routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts migrated encounter templates as unified actions instead of legacy encounter progress', () => {
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

    const state = makeTestState(graph);
    const encounterCache = {
      getAllEntries: () => [{ templateId: 'encounter.market_haggle', locationId: 'loc_town' }],
    } as any;

    const result = phaseAgentDecision(state, encounterCache, {} as any, () => 0.5);

    expect(result.unifiedActions).toHaveLength(1);
    expect(result.unifiedActions?.[0]?.templateId).toBe('encounter.market_haggle');
    expect(result.encounterProgress).toHaveLength(0);
  });

  it('treats recently completed unified actions as cooldown history for the same template', () => {
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

    const state = {
      ...makeTestState(graph),
      tick: 3,
      unifiedActions: [{
        actionId: 'ua_1',
        actorId: 'agent_1',
        templateId: 'encounter.market_haggle',
        targetId: 'loc_town',
        scale: 'local',
        source: 'agent',
        startTick: 1,
        currentStep: 0,
        stepProgress: 1,
        stepDuration: 1,
        resolved: true,
        outcome: 'success',
        completedAtTick: 2,
        stepOutcomes: ['success'],
      }],
    } as GameState;

    const encounterCache = {
      getAllEntries: () => [{ templateId: 'encounter.market_haggle', locationId: 'loc_town' }],
    } as any;

    const result = phaseAgentDecision(state, encounterCache, {} as any, () => 0.5);

    expect(result.unifiedActions).toHaveLength(1);
    expect(result.unifiedActions?.[0]?.templateId).toBe('encounter.market_haggle');
    expect(result.encounterProgress).toHaveLength(0);
    expect(result.tickEvents).toHaveLength(0);
  });
});
