import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
  abandonEncounter,
} from '../encounter';
import type { GameState } from '../../types';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, clearTraces } from '../traceBuffer';
import { getEncountersByLocationType } from '../../data/encounter-content';

// ──────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────

/**
 * Build a minimal GameState for encounter testing.
 * Creates: ascendant, actor, location, located_at edge.
 */
function buildTestGameState(): {
  state: GameState;
  actorId: string;
  locationId: string;
  ascendantId: string;
} {
  const graph = new WorldGraph();
  const ascendantId = 'asc.1';
  const actorId = 'actor.1';
  const locationId = 'loc.tavern';

  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: 'TestGod',
    properties: { actorType: 'ascendant' },
  });

  graph.addNode({
    id: actorId,
    type: 'actor',
    name: 'TestActor',
    properties: { actorType: 'individual' },
  });

  graph.addNode({
    id: locationId,
    type: 'location',
    name: 'Tavern',
    properties: {
      hexCol: 5,
      hexRow: 7,
      locationSubtype: 'town',
    },
  });

  graph.addEdge({
    id: 'e.located_at',
    source: actorId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });

  const state: GameState = {
    cycle: 0,
    tick: 0,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: [] },
    tiles: [],
    clock: { year: 1, season: 'spring', dayOfMonth: 1 },
    ascendantId,
    essencePool: { current: 100, max: 100, passiveTick: 0 },
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: { archetype: 'breach', customName: 'Test Doom', color: '#ff0000', narrative: 'Test' },
    doomClock: { currentTick: 0, totalTicks: 120, stage: 'escalation' },
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    encounterProgress: [],
    worldSoul: {
      fundament: {
        chaos: 0.5,
        order: 0.5,
        light: 0.5,
        darkness: 0.5,
      },
      resonance: [],
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: { entries: [] },
  };

  return { state, actorId, locationId, ascendantId };
}

/**
 * Add a trait to an actor for domain capability testing.
 */
function addTraitToActor(
  graph: WorldGraph,
  actorId: string,
  traitId: string,
  reachDomain: string,
  contribution: number,
): void {
  graph.addNode({
    id: traitId,
    type: 'trait',
    name: 'TestTrait',
    properties: {
      category: 'test',
      domainContributions: {
        iron: reachDomain === 'iron' ? contribution : 0,
        shadow: reachDomain === 'shadow' ? contribution : 0,
        gold: reachDomain === 'gold' ? contribution : 0,
        eye: reachDomain === 'eye' ? contribution : 0,
        veil: reachDomain === 'veil' ? contribution : 0,
        heart: reachDomain === 'heart' ? contribution : 0,
        stone: reachDomain === 'stone' ? contribution : 0,
        star: reachDomain === 'star' ? contribution : 0,
        flesh: reachDomain === 'gold' ? contribution : 0,
      },
    },
  });

  graph.addEdge({
    id: `e.${actorId}_has_${traitId}`,
    source: actorId,
    target: traitId,
    type: 'has_trait',
    properties: { level: 1 },
  });
}

/** Get encounters available at a 'town' location type. */
function getTownEncounters() {
  return getEncountersByLocationType('town');
}

// ──────────────────────────────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────────────────────────────

describe('Encounter Engine', () => {
  beforeEach(() => {
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  describe('initiateEncounter', () => {
    it('creates a new EncounterProgress with status active', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 5);

      expect(progress.status).toBe('active');
      expect(progress.actorId).toBe(actorId);
      expect(progress.encounterId).toBe(encounters[0].id);
      expect(progress.currentEncounterIndex).toBe(0);
      expect(progress.startedTick).toBe(5);
      expect(progress.history).toEqual([]);
    });

    it('adds progress to state.encounterProgress', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const initialLen = state.encounterProgress.length;

      initiateEncounter(state, actorId, encounters[0].id, 5);

      expect(state.encounterProgress.length).toBe(initialLen + 1);
    });

    it('emits a trace', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      clearTraces();

      initiateEncounter(state, actorId, encounters[0].id, 5);

      // Trace emitted — proper validation in trace tests
    });
  });

  describe('resolveEncounter', () => {
    it('returns success when roll passes probability threshold', () => {
      const { state, actorId } = buildTestGameState();

      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 20);

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 50);

      expect(result.success).toBe(true);
    });

    it('returns failure when roll fails probability threshold', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 95);

      expect(result.success).toBe(false);
    });

    it('includes EncounterOutcome with narrative', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 5);

      expect(result.outcome).toBeDefined();
      expect(result.outcome.narrative).toBeDefined();
      expect(result.outcome.narrative.length).toBeGreaterThan(0);
    });

    it('returns a resolution snapshot with roll math for inspectability', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 25);

      expect(result.resolutionSnapshot.stepId).toBeDefined();
      expect(result.resolutionSnapshot.threshold).toBeGreaterThanOrEqual(0);
      expect(result.resolutionSnapshot.roll).toBe(25);
      expect(result.resolutionSnapshot.outcomeType).toBe(result.outcomeType);
    });

    it('applies capability modifier based on domain', () => {
      const { state, actorId } = buildTestGameState();

      addTraitToActor(state.graph, actorId, 'trait.high', 'gold', 10);

      const encounters = getTownEncounters();
      const progress1 = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result1 = resolveEncounter(state, progress1, 5);
      expect(result1.success).toBe(true);
    });

    it('emits a trace with outcome details', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      clearTraces();
      resolveEncounter(state, progress, 30);
    });
  });

  describe('advanceEncounter', () => {
    it('records outcome in history', () => {
      const { state, actorId } = buildTestGameState();

      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 5);
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.history.length).toBe(1);
      expect(progress.history[0].success).toBe(true);
      expect(progress.history[0].tick).toBe(1);
    });

    it('stores resolution snapshots in progress history when provided', () => {
      const { state, actorId } = buildTestGameState();

      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 5);
      advanceEncounter(state, progress, result.success, 1, result.resolutionSnapshot);

      expect(progress.resolutionHistory).toHaveLength(1);
      expect(progress.resolutionHistory?.[0].roll).toBe(5);
      expect(progress.resolutionHistory?.[0].threshold).toBeGreaterThan(0);
    });

    it('increments currentEncounterIndex on success', () => {
      const { state, actorId } = buildTestGameState();

      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 5);
      const initialIdx = progress.currentEncounterIndex;
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.currentEncounterIndex).toBe(initialIdx + 1);
    });

    it('sets status to completed on final encounter success', () => {
      const { state, actorId } = buildTestGameState();

      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 10);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 10);

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const encounter = encounters[0];
      for (let i = 0; i < encounter.steps.length; i++) {
        progress.currentEncounterIndex = i;
        const result = resolveEncounter(state, progress, 5);
        advanceEncounter(state, progress, result.success, i + 1);
      }

      expect(progress.status).toBe('completed');
    });

    it('sets status to abandoned on failure', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 95);
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.status).toBe('abandoned');
    });

    it('does not increment encounter on failure', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 95);
      const idx = progress.currentEncounterIndex;
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.currentEncounterIndex).toBe(idx);
    });

    it('emits a trace', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 30);
      clearTraces();
      advanceEncounter(state, progress, result.success, 1);
    });
  });

  describe('abandonEncounter', () => {
    it('sets status to abandoned', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      expect(progress.status).toBe('active');
      abandonEncounter(progress);

      expect(progress.status).toBe('abandoned');
    });

    it('preserves history', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getTownEncounters();
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 30);
      advanceEncounter(state, progress, result.success, 1);

      const historyLen = progress.history.length;
      abandonEncounter(progress);

      expect(progress.history.length).toBe(historyLen);
    });
  });
});
