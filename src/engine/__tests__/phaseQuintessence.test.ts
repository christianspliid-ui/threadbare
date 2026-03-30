/**
 * Tests for phaseQuintessence engine module.
 *
 * Covers: erosion, recovery, clamping, passive regen, dissolution events,
 * fail-soft for missing quintessence, multi-event accumulation,
 * and encounter_failure source processing.
 */

import { describe, it, expect } from 'vitest';
import { phaseQuintessence } from '../phaseQuintessence';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import type { QuintessenceEvent } from '../../types/quintessence';
import { QUINTESSENCE_PASSIVE_REGEN } from '../../types/quintessence';

// ─── Test Helpers ─────────────────────────────────────────────────────

function buildTestState(overrides: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor.test',
    type: 'actor',
    name: 'TestActor',
    properties: { actorType: 'individual', quintessence: 1.0 },
  });

  return {
    cycle: 0,
    tick: 5,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: [] },
    tiles: [],
    clock: { year: 1, season: 'spring', dayOfMonth: 1 },
    ascendantId: 'asc.test',
    essencePool: { current: 100, max: 100, passiveTick: 0 },
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: { archetype: 'breach', customName: 'Test', color: '#ff0000', narrative: 'Test' },
    doomClock: { currentTick: 0, totalTicks: 120, stage: 'escalation' },
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
    worldSoul: {
      fundament: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 },
      resonance: [],
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: { entries: [] },
    ...overrides,
  } as GameState;
}

function makeEvent(overrides: Partial<QuintessenceEvent> = {}): QuintessenceEvent {
  return {
    targetNodeId: 'actor.test',
    delta: -0.1,
    source: 'overchannel',
    tick: 5,
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('phaseQuintessence', () => {
  describe('empty events', () => {
    it('returns empty object when no pending events and no entities below 1.0', () => {
      const state = buildTestState();
      const result = phaseQuintessence(state);
      // tickEvents stays the same (no dissolution), pendingQuintessenceEvents cleared
      expect(result.pendingQuintessenceEvents).toEqual([]);
    });
  });

  describe('erosion', () => {
    it('reduces quintessence by delta magnitude on erosion event', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent({ delta: -0.1 })],
      });
      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBeCloseTo(0.9);
    });

    it('clamps quintessence to 0.0 minimum (no negative values)', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent({ delta: -5.0 })],
      });
      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBe(0.0);
    });

    it('accumulates multiple erosion events for same target within one tick', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [
          makeEvent({ delta: -0.1 }),
          makeEvent({ delta: -0.2 }),
        ],
      });
      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      // 1.0 - 0.3 = 0.7
      expect(node?.properties.quintessence).toBeCloseTo(0.7);
    });
  });

  describe('recovery', () => {
    it('clamps quintessence to 1.0 maximum on recovery event', () => {
      // Start at 1.0, apply positive delta — should stay at 1.0
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent({ delta: 0.5 })],
      });
      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBe(1.0);
    });
  });

  describe('passive regeneration', () => {
    it('applies passive regen to entities with quintessence below 1.0', () => {
      // Set quintessence to 0.5 manually
      const state = buildTestState();
      state.graph.updateNode('actor.test', { properties: { quintessence: 0.5 } });

      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBeCloseTo(0.5 + QUINTESSENCE_PASSIVE_REGEN);
    });

    it('does not apply passive regen to entities already at 1.0', () => {
      // Quintessence is 1.0 — regen should not overshoot
      const state = buildTestState();
      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBe(1.0);
    });

    it('passive regen does not push quintessence above 1.0', () => {
      // Set to 0.999 — regen should cap at 1.0
      const state = buildTestState();
      state.graph.updateNode('actor.test', { properties: { quintessence: 0.999 } });

      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('dissolution', () => {
    it('emits dissolution_event when entity reaches 0.0', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent({ delta: -1.0 })],
      });
      const result = phaseQuintessence(state);
      const events = result.tickEvents ?? [];
      const dissolution = events.find(e => e.type === 'dissolution_event');
      expect(dissolution).toBeDefined();
      expect(dissolution?.tick).toBe(5);
    });

    it('does not emit dissolution_event when quintessence stays above 0', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent({ delta: -0.1 })],
      });
      const result = phaseQuintessence(state);
      const events = result.tickEvents ?? [];
      const dissolution = events.find(e => e.type === 'dissolution_event');
      expect(dissolution).toBeUndefined();
    });
  });

  describe('fail-soft', () => {
    it('treats missing quintessence property as 1.0 (default)', () => {
      // Node without quintessence property
      const state = buildTestState();
      state.graph.updateNode('actor.test', { properties: { quintessence: undefined } });

      // Apply small erosion — should be treated as starting from 1.0
      const stateWithEvent = { ...state, pendingQuintessenceEvents: [makeEvent({ delta: -0.1 })] };
      phaseQuintessence(stateWithEvent);
      const node = state.graph.getNode('actor.test');
      // After applying -0.1 to default 1.0: should be 0.9 (approximately)
      expect(node?.properties.quintessence).toBeCloseTo(0.9);
    });

    it('skips unknown node IDs gracefully', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent({ targetNodeId: 'nonexistent.node', delta: -0.5 })],
      });
      // Should not throw
      expect(() => phaseQuintessence(state)).not.toThrow();
    });
  });

  describe('encounter_failure source', () => {
    it('processes events with source encounter_failure correctly', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [
          makeEvent({ source: 'encounter_failure', delta: -0.03 }),
        ],
      });
      phaseQuintessence(state);
      const node = state.graph.getNode('actor.test');
      expect(node?.properties.quintessence).toBeCloseTo(0.97);
    });
  });

  describe('state management', () => {
    it('clears pendingQuintessenceEvents after processing', () => {
      const state = buildTestState({
        pendingQuintessenceEvents: [makeEvent()],
      });
      const result = phaseQuintessence(state);
      expect(result.pendingQuintessenceEvents).toEqual([]);
    });
  });
});
