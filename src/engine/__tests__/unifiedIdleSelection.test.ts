/**
 * Tests for phaseIdleSelection — Phase 7 of the unified pipeline.
 *
 * Sprint 3E — Task 3E.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  phaseIdleSelection,
  resetPhaseEventCounter,
  NOTABLE_EVENT_INTERVAL,
} from '../unifiedActionPhases';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { clearTraces } from '../traceBuffer';

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Create a minimal GameState with actors that have axiological profiles
 * (required for the selection pipeline to work).
 */
function createTestState(): GameState {
  const graph = new WorldGraph();

  // Location with a subtype
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Market',
    properties: {
      locationType: 'town',
      locationSubtype: 'town',
      sphereInfluence: {},
    },
  });

  // Actor 1 with axiological profile (selection pipeline needs this)
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Alice',
    properties: {
      actorType: 'individual',
      axiologicalProfile: {
        courage_prudence: 0.1,
        ambition_contentment: 0.2,
        mercy_justice: -0.1,
        tradition_innovation: 0.0,
        autonomy_community: 0.3,
      },
      cooperationStrategy: 'tit_for_tat',
    },
  });
  graph.addEdge({
    id: 'e-1', source: 'actor-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });

  // Actor 2 with profile
  graph.addNode({
    id: 'actor-2', type: 'actor', name: 'Bob',
    properties: {
      actorType: 'individual',
      axiologicalProfile: {
        courage_prudence: -0.2,
        ambition_contentment: 0.5,
        mercy_justice: 0.3,
        tradition_innovation: -0.1,
        autonomy_community: 0.0,
      },
      cooperationStrategy: 'tit_for_tat',
    },
  });
  graph.addEdge({
    id: 'e-2', source: 'actor-2', target: 'loc-1',
    type: 'located_at', properties: {},
  });

  return {
    tick: 10,
    seed: 42,
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

/** Fixed RNG that always returns the same value */
function fixedRng(val: number): () => number {
  return () => val;
}

/** Sequence RNG: returns values in order, then wraps */
function sequenceRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('phaseIdleSelection', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetPhaseEventCounter();
    resetOpCounter();
    clearTraces();
  });

  it('creates unified actions for idle actors when roll < ACTION_ATTEMPT_CHANCE', () => {
    const state = createTestState();

    // Use a sequence RNG:
    // - First two calls are per-actor roll checks (< 0.55 triggers action)
    // - Subsequent calls are for selection pipeline (deterministicRoll, duration, etc.)
    // Using 0.1 for rolls and 0.5 for everything else
    let callCount = 0;
    const rng = () => {
      callCount++;
      return 0.1; // Always 0.1 — low enough for action attempt, and valid for selection
    };

    const result = phaseIdleSelection(state, rng);

    // Should have created at least one unified action
    // (May not create for ALL actors if selection pipeline fails for some)
    expect(result.unifiedActions!.length).toBeGreaterThan(0);

    // Actions should be for actors in the state
    const actionActorIds = result.unifiedActions!.map(a => a.actorId);
    expect(actionActorIds.every(id => ['actor-1', 'actor-2'].includes(id))).toBe(true);

    // Should have generated events
    expect(result.tickEvents!.length).toBeGreaterThan(0);
    expect(result.tickEvents!.some(e => e.message.includes('begins'))).toBe(true);
  });

  it('skips actors that already have active unified actions', () => {
    const state = createTestState();

    // Pre-populate: actor-1 already has an active action
    state.unifiedActions = [{
      actionId: 'existing-1',
      templateId: 'some.template',
      actorId: 'actor-1',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 8,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 2,
      resolved: false,
      stepOutcomes: [],
    }];

    const result = phaseIdleSelection(state, fixedRng(0.1));

    // Only actor-2 should get a new action (actor-1 is busy)
    const newActions = result.unifiedActions!.filter(a => a.actionId !== 'existing-1');
    if (newActions.length > 0) {
      expect(newActions.every(a => a.actorId === 'actor-2')).toBe(true);
    }
  });

  it('generates routine events for mid-range rolls', () => {
    const state = createTestState();

    // Roll between 0.55 and 0.65 triggers routine event
    const result = phaseIdleSelection(state, fixedRng(0.60));

    // Should have routine events but no new actions
    const newActions = result.unifiedActions!;
    expect(newActions).toHaveLength(0);

    // Routine events should exist
    const routineEvents = result.tickEvents!.filter(e => e.significance < 0.8);
    expect(routineEvents.length).toBeGreaterThan(0);
  });

  it('does nothing for high rolls', () => {
    const state = createTestState();

    // Very high roll (> 0.65) — neither action nor routine
    // But notable events may still fire if tick % NOTABLE_EVENT_INTERVAL === 0
    state.tick = 13; // Not divisible by 5

    const result = phaseIdleSelection(state, fixedRng(0.90));

    expect(result.unifiedActions!).toHaveLength(0);
    // No events from actors (but check there's no notable)
    expect(result.tickEvents!).toHaveLength(0);
  });

  it('generates notable event at NOTABLE_EVENT_INTERVAL', () => {
    const state = createTestState();
    state.tick = NOTABLE_EVENT_INTERVAL * 2; // divisible by interval

    // High roll so no actor actions/routine, but notable fires
    const result = phaseIdleSelection(state, fixedRng(0.90));

    const notable = result.tickEvents!.filter(e => e.significance >= 0.85);
    expect(notable).toHaveLength(1);
  });

  it('created actions have correct structure', () => {
    const state = createTestState();

    const result = phaseIdleSelection(state, fixedRng(0.1));

    if (result.unifiedActions!.length > 0) {
      const action = result.unifiedActions![0];
      expect(action.actionId).toBeDefined();
      expect(action.templateId).toBeDefined();
      expect(action.actorId).toBeDefined();
      expect(action.targetId).toBe('loc-1');
      expect(action.source).toBe('agent');
      expect(action.startTick).toBe(state.tick);
      expect(action.resolved).toBe(false);
      expect(action.stepProgress).toBe(0);
      expect(action.stepOutcomes).toEqual([]);
    }
  });

  it('handles actors without locations gracefully', () => {
    const state = createTestState();

    // Add an actor with no located_at edge
    state.graph.addNode({
      id: 'actor-lost', type: 'actor', name: 'Lost',
      properties: { actorType: 'individual' },
    });

    // Should not crash
    const result = phaseIdleSelection(state, fixedRng(0.1));
    expect(result.unifiedActions).toBeDefined();
  });

  it('handles actors without axiological profiles gracefully', () => {
    const state = createTestState();

    // Add an actor with no profile (selection pipeline will throw → caught)
    state.graph.addNode({
      id: 'actor-noprofile', type: 'actor', name: 'NoProfile',
      properties: { actorType: 'individual' },
    });
    state.graph.addEdge({
      id: 'e-np', source: 'actor-noprofile', target: 'loc-1',
      type: 'located_at', properties: {},
    });

    // Should not crash — selection pipeline failure is caught
    const result = phaseIdleSelection(state, fixedRng(0.1));
    expect(result.unifiedActions).toBeDefined();
  });

  it('preserves existing tick events', () => {
    const state = createTestState();
    state.tickEvents = [{ id: 'existing', tick: 9, type: 'test', message: 'existing', significance: 0.5 }];

    const result = phaseIdleSelection(state, fixedRng(0.1));

    // Existing event should still be there
    expect(result.tickEvents!.some(e => e.id === 'existing')).toBe(true);
  });
});
