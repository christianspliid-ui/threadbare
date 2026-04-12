import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeStrategicAction, advanceStrategicProjects } from '../strategicActionLifecycle';
import type { GameState } from '../../types/gameState';
import type { StrategicActionCandidate, StrategicRuntimeState } from '../../types/strategicAction';
import { mulberry32 } from '../../lib/prng';

function buildMinimalState(graph: WorldGraph): GameState {
  return {
    cycle: 1,
    tick: 10,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: { spheres: {} } as any,
    tiles: [],
    clock: { currentTick: 10 } as any,
    ascendantId: 'ascendant',
    ascendantIdentity: null,
    essencePool: {} as any,
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
    visibilityMap: new Map() as any,
    familiarityMap: new Map() as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

function buildTestGraph() {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'actor_1',
    name: 'Kael',
    type: 'actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: { gold: 0.6, eye: 0.4 },
    },
  });

  graph.addNode({
    id: 'loc_market',
    name: 'Market Square',
    type: 'location',
    properties: { locationSubtype: 'market', hexCol: 5, hexRow: 5 },
  });

  graph.addNode({
    id: 'loc_town',
    name: 'Millhaven',
    type: 'location',
    properties: { locationSubtype: 'town', hexCol: 7, hexRow: 5 },
  });

  graph.addEdge({
    id: 'located_actor_1',
    source: 'actor_1',
    target: 'loc_market',
    type: 'located_at',
    properties: {},
  });

  return graph;
}

function makeCandidate(overrides: Partial<StrategicActionCandidate> = {}): StrategicActionCandidate {
  return {
    candidateId: 'test_1',
    templateId: 'strategic_survey_market',
    ambitionId: 'ambition_dominate_trade',
    actorId: 'actor_1',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'merchant-expansion',
    displayName: 'Survey Market',
    targetNodeId: 'loc_market',
    scoreComponents: {
      ambitionAlignment: 0.8, blockerRelief: 0, worldImpact: 0.3,
      catalystValue: 0, roleFit: 0.6, controlPressure: 0,
      travelPenalty: 0, varietyPenalty: 0,
    },
    finalScore: 0.5,
    generationReason: 'ambition_progression',
    ...overrides,
  };
}

describe('strategicActionLifecycle', () => {
  describe('executeStrategicAction', () => {
    it('executes instant survey market mutation', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      const rng = mulberry32(42);

      const result = executeStrategicAction(state, graph, makeCandidate(), state.tick, rng);

      expect(result.strategicState.history.length).toBe(1);
      expect(result.strategicState.history[0].outcome).toBe('completed');
      expect(result.strategicState.history[0].templateId).toBe('strategic_survey_market');
    });

    it('creates a trade route via establish_trade_route', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      const rng = mulberry32(42);

      const candidate = makeCandidate({
        templateId: 'strategic_establish_trade_route',
        verb: 'create',
        executionMode: 'multi_tick_project',
        displayName: 'Establish Trade Route',
        targetNodeId: 'loc_town',
      });

      const result = executeStrategicAction(state, graph, candidate, state.tick, rng);

      // Multi-tick project should be started, not completed instantly
      expect(result.strategicState.projects.length).toBe(1);
      expect(result.strategicState.projects[0].status).toBe('active');
      expect(result.strategicState.projects[0].progress).toBe(0);
    });

    it('claims control for monopoly template', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      const rng = mulberry32(42);

      const candidate = makeCandidate({
        templateId: 'strategic_maintain_monopoly',
        verb: 'control',
        executionMode: 'claim_control',
        displayName: 'Maintain Monopoly',
        targetNodeId: 'loc_market',
      });

      const result = executeStrategicAction(state, graph, candidate, state.tick, rng);

      expect(result.strategicState.controls.length).toBe(1);
      expect(result.strategicState.controls[0].active).toBe(true);
      // Should have created a controls edge
      const controlEdges = graph.getOutgoingEdges('actor_1', 'controls');
      expect(controlEdges.length).toBe(1);
      expect(controlEdges[0].target).toBe('loc_market');
    });

    it('handles missing target gracefully for control claim', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      const rng = mulberry32(42);

      const candidate = makeCandidate({
        templateId: 'strategic_maintain_monopoly',
        verb: 'control',
        executionMode: 'claim_control',
        displayName: 'Maintain Monopoly',
        targetNodeId: undefined, // No target
      });

      const result = executeStrategicAction(state, graph, candidate, state.tick, rng);
      // Should return unchanged state without crashing
      expect(result.strategicState.controls.length).toBe(0);
    });
  });

  describe('advanceStrategicProjects', () => {
    it('advances active project progress', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      state.strategicState = {
        projects: [{
          projectId: 'proj_1',
          actorId: 'actor_1',
          templateId: 'strategic_build_warehouse',
          ambitionId: 'ambition_dominate_trade',
          verb: 'create',
          behaviorFamily: 'merchant-expansion',
          targetNodeId: 'loc_market',
          progress: 5,
          progressRequired: 8,
          startedTick: 2,
          lastProgressTick: 9,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const rng = mulberry32(42);
      const result = advanceStrategicProjects(state, graph, 10, rng);

      expect(result.strategicState.projects[0].progress).toBe(6);
      expect(result.strategicState.projects[0].status).toBe('active');
    });

    it('completes project when progress reaches required', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      state.strategicState = {
        projects: [{
          projectId: 'proj_1',
          actorId: 'actor_1',
          templateId: 'strategic_build_warehouse',
          ambitionId: 'ambition_dominate_trade',
          verb: 'create',
          behaviorFamily: 'merchant-expansion',
          targetNodeId: 'loc_market',
          progress: 7, // One more tick completes
          progressRequired: 8,
          startedTick: 2,
          lastProgressTick: 9,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const rng = mulberry32(42);
      const result = advanceStrategicProjects(state, graph, 10, rng);

      expect(result.strategicState.projects[0].status).toBe('completed');
      expect(result.strategicState.history.length).toBe(1);
      expect(result.events.length).toBeGreaterThan(0);
    });

    it('fails project on timeout', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      state.strategicState = {
        projects: [{
          projectId: 'proj_1',
          actorId: 'actor_1',
          templateId: 'strategic_build_warehouse',
          ambitionId: 'ambition_dominate_trade',
          verb: 'create',
          behaviorFamily: 'merchant-expansion',
          targetNodeId: 'loc_market',
          progress: 2,
          progressRequired: 8,
          startedTick: 1, // Started tick 1, now tick 25 → >18 tick timeout
          lastProgressTick: 3,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const rng = mulberry32(42);
      const result = advanceStrategicProjects(state, graph, 25, rng);

      expect(result.strategicState.projects[0].status).toBe('failed');
    });

    it('degrades neglected control after grace period', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      state.strategicState = {
        projects: [],
        controls: [{
          controlId: 'ctrl_1',
          actorId: 'actor_1',
          templateId: 'strategic_maintain_monopoly',
          ambitionId: 'ambition_dominate_trade',
          targetNodeId: 'loc_market',
          verb: 'control',
          behaviorFamily: 'merchant-expansion',
          establishedTick: 1,
          neglectTicks: 11, // Past grace period of 10
          active: true,
          degradation: 0,
        }],
        history: [],
      };

      const rng = mulberry32(42);
      const result = advanceStrategicProjects(state, graph, 20, rng);

      // Should have increased degradation
      expect(result.strategicState.controls[0].degradation).toBeGreaterThan(0);
      expect(result.strategicState.controls[0].active).toBe(true);
    });
  });
});
