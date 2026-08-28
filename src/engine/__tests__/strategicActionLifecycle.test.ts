import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeStrategicAction, advanceStrategicProjects } from '../strategicActionLifecycle';
import type { GameState } from '../../types/gameState';
import type { StrategicActionCandidate, StrategicRuntimeState } from '../../types/strategicAction';
import { mulberry32 } from '../../lib/prng';
import {
  UNDERTAKING_PROGRESS_PER_ADVANCE,
  UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
  UNDERTAKING_TIMEOUT_TICKS,
} from '../../data/strategic-action-constants';

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
    // THR-1292 §2: progress is no longer a function of elapsed ticks. These tests
    // assert the *checkpoint* contract — a due checkpoint advances by a full step
    // or halts, and an un-due one leaves the record alone. The pre-checkpoint
    // "+1 every tick" assertion is gone because the behaviour is gone; keeping it
    // green would have meant keeping the old cadence alive somewhere.

    it('leaves an un-due project untouched, and stamps its schedule once', () => {
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
          progressRequired: 18,
          // Started at 9, so the first checkpoint is due at 15 — not at tick 10.
          startedTick: 9,
          lastProgressTick: 9,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const result = advanceStrategicProjects(state, graph, 10, mulberry32(42));
      const project = result.strategicState.projects[0];

      expect(project.progress).toBe(5);
      expect(project.status).toBe('active');
      // Stamped rather than recomputed every tick.
      expect(project.nextCheckpointTick).toBe(15);
    });

    it('advances by a full step or halts when a checkpoint is due — never by a partial tick', () => {
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
          progress: 0,
          progressRequired: 18,
          startedTick: 2, // due at 8
          lastProgressTick: 2,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const result = advanceStrategicProjects(state, graph, 10, mulberry32(42));
      const project = result.strategicState.projects[0];

      // The band is the roll's business; the *contract* is that a resolved
      // checkpoint moves progress by a whole step (possibly doubled on a crit) or
      // by nothing at all while taking a ratchet point. Asserting the disjunction
      // rather than one band keeps this test about the cadence instead of
      // silently pinning whatever `mulberry32(42)` happens to produce.
      const advanced = project.progress > 0;
      if (advanced) {
        expect([
          UNDERTAKING_PROGRESS_PER_ADVANCE,
          UNDERTAKING_PROGRESS_PER_ADVANCE * 2,
        ]).toContain(project.progress);
        expect(project.halts ?? 0).toBe(0);
      } else {
        expect(project.halts ?? 0).toBeGreaterThan(0);
      }
      expect(project.checkpointIndex).toBe(1);
      expect(project.nextCheckpointTick).toBe(10 + UNDERTAKING_CHECKPOINT_INTERVAL_TICKS);
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
          // The timeout is now UNDERTAKING_TIMEOUT_TICKS (60), not the old flat 18:
          // halts legitimately extend an undertaking and the ratchet is the designed
          // exit, so a timeout tuned to the old passive cadence would fire on healthy
          // work. This one is the fail-safe backstop (THR-1292 §2).
          startedTick: 1,
          lastProgressTick: 3,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const rng = mulberry32(42);
      const result = advanceStrategicProjects(state, graph, 1 + UNDERTAKING_TIMEOUT_TICKS + 1, rng);

      expect(result.strategicState.projects[0].status).toBe('failed');
      expect(result.strategicState.projects[0].failureReason).toBe('timeout');
    });

    it('does not time out at the old 18-tick mark — the backstop moved, deliberately', () => {
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
          progressRequired: 18,
          startedTick: 1,
          lastProgressTick: 3,
          status: 'active',
        }],
        controls: [],
        history: [],
      };

      const result = advanceStrategicProjects(state, graph, 25, mulberry32(42));
      expect(result.strategicState.projects[0].status).not.toBe('failed');
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

  // ─── The phase return carries the binder's state (THR-1321) ──────────
  //
  // `advanceStrategicProjects` used to build its returned `strategicState` as a
  // literal naming only `projects`, `controls` and `history`. Every *other* field on
  // `StrategicRuntimeState` was therefore dropped once per tick — `mintQueue` and
  // `bindings`, the two the binder owns and the only two that are optional.
  //
  // The cost was total and silent. The bind pass enqueues a birth during the
  // `strategic_projects` phase; `phaseAgentLifecycle` drains that queue later in the
  // same tick. But the object holding the queue was discarded before the valve ran,
  // so the drain always found an empty queue, no mint was ever born, and any slot
  // that needed one deferred on `awaiting_mint` until the undertaking timed out —
  // `strategic_recruit_warband` measured 0 completions against a no-cast baseline of
  // 15. The dropped `bindings` is why the two persistence modes measured identically:
  // the ledger was wiped every tick, so `must-persist` and `scene-only` were the same
  // thing.
  //
  // Asserted on the phase return rather than through a full tick because that return
  // *is* the seam that broke, and a tick-level test would pass the moment any other
  // phase happened to rewrite the field.
  describe('binder state survives the phase return (THR-1321)', () => {
    it('carries mintQueue and bindings through a tick that changes neither', () => {
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);

      const queued = {
        projectId: 'proj_x', castKey: 'recruit', stepIndex: 0, role: 'mercenary',
        placementNodeId: 'loc_town', persistence: 'must-persist' as const,
        requestedAtTick: 9,
      };
      const ledgerRow = {
        recordId: 'rec_1', projectId: 'proj_x', castKey: 'recruit', nodeId: 'actor_1',
        kind: 'actor' as const, persistence: 'must-persist' as const,
        boundAtTick: 9, stepIndex: 0, status: 'live' as const,
      };

      state.strategicState = {
        projects: [],
        controls: [],
        history: [],
        mintQueue: [queued],
        bindings: [ledgerRow],
      } as StrategicRuntimeState;

      const result = advanceStrategicProjects(state, graph, 10, mulberry32(42));

      // The regression: both of these read `undefined` before the fix.
      expect(result.strategicState.mintQueue).toBeDefined();
      expect(result.strategicState.bindings).toBeDefined();
      expect(result.strategicState.mintQueue).toHaveLength(1);
      expect(result.strategicState.bindings).toHaveLength(1);
      // Identity, not just shape — a queue rebuilt empty-then-refilled would still
      // strand the request the valve was about to drain.
      expect(result.strategicState.mintQueue![0].projectId).toBe('proj_x');
      expect(result.strategicState.bindings![0].nodeId).toBe('actor_1');
    });

    it('does not resurrect fields the caller never set', () => {
      // The complement, so the guard above cannot be satisfied by a writer that
      // manufactures empty collections: absent stays absent. This is what makes the
      // assertion above evidence of a *spread* rather than of a default.
      const graph = buildTestGraph();
      const state = buildMinimalState(graph);
      state.strategicState = { projects: [], controls: [], history: [] };

      const result = advanceStrategicProjects(state, graph, 10, mulberry32(42));

      expect(result.strategicState.mintQueue).toBeUndefined();
      expect(result.strategicState.bindings).toBeUndefined();
    });
  });
});
