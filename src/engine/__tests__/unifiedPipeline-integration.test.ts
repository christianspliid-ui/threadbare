/**
 * End-to-end integration test for the unified action pipeline.
 *
 * Runs phaseUnifiedActionProgress + phaseIdleSelection over multiple ticks
 * with real UNIFIED_ACTION_TEMPLATES and verifies the full lifecycle:
 * - Idle agents pick actions
 * - Actions progress tick-by-tick
 * - Actions resolve with outcomes
 * - GraphOps execute on resolution
 * - Events are generated throughout
 * - No crashes (fail-soft)
 *
 * Sprint 3F — Task 3F.1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { phaseIdleSelection, resetPhaseEventCounter } from '../unifiedActionPhases';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';

// ─── Helpers ────────────────────────────────────────────────────

/** Seeded PRNG matching orchestrator's mulberry32 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createIntegrationState(): GameState {
  const graph = new WorldGraph();

  // Location — 'town' matches real UNIFIED_ACTION_TEMPLATES
  graph.addNode({
    id: 'loc-town', type: 'location', name: 'Thornwall',
    properties: {
      locationType: 'town',
      locationSubtype: 'town',
      sphereInfluence: {},
    },
  });

  // 4 actors with axiological profiles
  const profiles = [
    { courage_prudence: 0.4, ambition_contentment: 0.3, mercy_justice: -0.2, tradition_innovation: 0.1, autonomy_community: 0.0 },
    { courage_prudence: -0.3, ambition_contentment: 0.5, mercy_justice: 0.4, tradition_innovation: -0.1, autonomy_community: 0.2 },
    { courage_prudence: 0.1, ambition_contentment: -0.2, mercy_justice: 0.0, tradition_innovation: 0.5, autonomy_community: -0.3 },
    { courage_prudence: 0.0, ambition_contentment: 0.0, mercy_justice: 0.1, tradition_innovation: 0.0, autonomy_community: 0.4 },
  ];
  const names = ['Alice', 'Bob', 'Carol', 'Dave'];

  for (let i = 0; i < 4; i++) {
    graph.addNode({
      id: `actor-${i}`, type: 'actor', name: names[i],
      properties: {
        actorType: 'individual',
        axiologicalProfile: profiles[i],
        cooperationStrategy: 'tit_for_tat',
      },
    });
    graph.addEdge({
      id: `e-loc-${i}`, source: `actor-${i}`, target: 'loc-town',
      type: 'located_at', properties: {},
    });
  }

  return {
    tick: 0,
    seed: 12345,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
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
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

/**
 * Run one tick of the unified pipeline: progress existing, then idle selection.
 */
function runUnifiedTick(state: GameState): GameState {
  const progressRng = mulberry32(state.seed + state.tick * 31);
  const idleRng = mulberry32(state.seed + state.tick * 37);

  let s = { ...state, tickEvents: [] as any[] };

  // Phase 1-6: progress existing
  s = { ...s, ...phaseUnifiedActionProgress(s, UNIFIED_ACTION_TEMPLATES, progressRng) };

  // Phase 7: idle selection
  s = { ...s, ...phaseIdleSelection(s, idleRng) };

  return { ...s, tick: s.tick + 1 };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('Unified Pipeline End-to-End', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetPhaseEventCounter();
    resetOpCounter();
    clearTraces();
  });

  it('runs 10 ticks without crashing', () => {
    let state = createIntegrationState();

    for (let i = 0; i < 10; i++) {
      state = runUnifiedTick(state);
    }

    // Should not have crashed
    expect(state.tick).toBe(10);
    expect(state.unifiedActions).toBeDefined();
    expect(Array.isArray(state.unifiedActions)).toBe(true);
  });

  it('idle agents pick up actions over multiple ticks', () => {
    let state = createIntegrationState();

    // Run enough ticks that at least some agents should have picked up actions
    for (let i = 0; i < 20; i++) {
      state = runUnifiedTick(state);
    }

    // At least one action should have been created
    expect(state.unifiedActions.length).toBeGreaterThan(0);

    // All actions should have valid structure
    for (const action of state.unifiedActions) {
      expect(action.actionId).toBeDefined();
      expect(action.templateId).toBeDefined();
      expect(action.actorId).toBeDefined();
      expect(action.targetId).toBeDefined();
      expect(action.source).toBe('agent');
      expect(typeof action.startTick).toBe('number');
      expect(Array.isArray(action.stepOutcomes)).toBe(true);
    }
  });

  it('actions resolve over time', () => {
    let state = createIntegrationState();

    // Run 30 ticks — enough for single-step actions (duration 2-4) to resolve
    for (let i = 0; i < 30; i++) {
      state = runUnifiedTick(state);
    }

    // Some actions should have resolved
    const resolved = state.unifiedActions.filter(a => a.resolved);
    expect(resolved.length).toBeGreaterThan(0);

    // Resolved actions should have outcomes
    for (const action of resolved) {
      expect(['success', 'failure']).toContain(action.outcome);
      expect(action.stepOutcomes.length).toBeGreaterThan(0);
    }
  });

  it('events are generated during the run', () => {
    let state = createIntegrationState();
    const allEvents: any[] = [];

    for (let i = 0; i < 10; i++) {
      state = runUnifiedTick(state);
      allEvents.push(...state.tickEvents);
    }

    // Should have generated some events
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it('state.unifiedActions accumulates actions across ticks', () => {
    let state = createIntegrationState();
    let maxActions = 0;

    for (let i = 0; i < 15; i++) {
      state = runUnifiedTick(state);
      maxActions = Math.max(maxActions, state.unifiedActions.length);
    }

    // Actions should accumulate (idle agents keep picking new ones)
    expect(maxActions).toBeGreaterThan(1);
  });

  it('deterministic: same seed produces same results', () => {
    // Run 1
    let state1 = createIntegrationState();
    for (let i = 0; i < 10; i++) {
      state1 = runUnifiedTick(state1);
    }

    // Run 2 (same seed)
    resetUnifiedActionCounter();
    resetPhaseEventCounter();
    resetOpCounter();
    clearTraces();

    let state2 = createIntegrationState();
    for (let i = 0; i < 10; i++) {
      state2 = runUnifiedTick(state2);
    }

    // Same number of actions
    expect(state1.unifiedActions.length).toBe(state2.unifiedActions.length);

    // Same action IDs (deterministic counter)
    expect(state1.unifiedActions.map(a => a.actionId)).toEqual(
      state2.unifiedActions.map(a => a.actionId),
    );
  });
});
