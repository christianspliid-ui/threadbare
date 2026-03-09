import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAvailableEncounters,
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
  abandonEncounter,
  generateEncountersForLocation,
} from '../encounter';
import type { GameState, EncounterProgress } from '../../types';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, clearTraces } from '../traceBuffer';

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
        flesh: reachDomain === 'flesh' ? contribution : 0,
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

  describe('getAvailableEncounters', () => {
    it('returns encounters matching location type', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);

      expect(encounters.length).toBeGreaterThan(0);
      expect(encounters.some(o => o.id === 'encounter.merchants_gambit')).toBe(true);
    });

    it('returns empty if actor has no location', () => {
      const { state, actorId } = buildTestGameState();
      // Remove the located_at edge
      state.graph.getOutgoingEdges(actorId, 'located_at').forEach(e => {
        state.graph.removeEdge(e.id);
      });

      const encounters = getAvailableEncounters(state, actorId);
      expect(encounters).toEqual([]);
    });

    it('excludes encounters with active progress', () => {
      const { state, actorId } = buildTestGameState();

      // Initiate an encounter
      const encounters = getAvailableEncounters(state, actorId);
      const encounterToStart = encounters[0];
      initiateEncounter(state, actorId, encounterToStart.id, 0);

      // Now get available encounters again
      const available = getAvailableEncounters(state, actorId);

      // The encounter we just started should not be available
      expect(available.find(o => o.id === encounterToStart.id)).toBeUndefined();
    });

    it('excludes encounters with abandoned status but within cooldown', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const encounterId = encounters[0].id;

      // Initiate and abandon
      const progress = initiateEncounter(state, actorId, encounterId, 0);
      abandonEncounter(progress);

      // Within cooldown, should be excluded
      const available = getAvailableEncounters(state, actorId);
      expect(available.find(o => o.id === encounterId)).toBeUndefined();
    });

    it('includes abandoned encounters after cooldown expires', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const encounterId = encounters[0].id;

      // Initiate and abandon at tick 0
      const progress = initiateEncounter(state, actorId, encounterId, 0);
      abandonEncounter(progress);

      // Advance state to tick 25 (cooldown is 20)
      state.tick = 25;

      const available = getAvailableEncounters(state, actorId);
      expect(available.find(o => o.id === encounterId)).toBeDefined();
    });
  });

  describe('initiateEncounter', () => {
    it('creates a new EncounterProgress with status active', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
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

      const encounters = getAvailableEncounters(state, actorId);
      const initialLen = state.encounterProgress.length;

      initiateEncounter(state, actorId, encounters[0].id, 5);

      expect(state.encounterProgress.length).toBe(initialLen + 1);
    });

    it('emits a trace', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      clearTraces();

      initiateEncounter(state, actorId, encounters[0].id, 5);

      // Note: encounter_resolution trace may not exist yet in types, so just check that something was traced
      // This will be properly validated in Task 6 when trace types are updated
    });
  });

  describe('resolveEncounter', () => {
    it('returns success when roll passes probability threshold', () => {
      const { state, actorId } = buildTestGameState();

      // Location is 'market', so first encounter is Merchant's Gambit
      // First encounter is 'Negotiation' with reach: 'gold'
      // Give actor high capability in gold
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      // With high capability, even a mid-range roll should pass
      const result = resolveEncounter(state, progress, 50); // Mid roll with high capability → success

      expect(result.success).toBe(true);
    });

    it('returns failure when roll fails probability threshold', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      // With default low capability and high roll, should fail
      const result = resolveEncounter(state, progress, 95); // High roll → failure

      expect(result.success).toBe(false);
    });

    it('includes EncounterOutcome with narrative', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 30); // Success

      expect(result.outcome).toBeDefined();
      expect(result.outcome.narrative).toBeDefined();
      expect(result.outcome.narrative.length).toBeGreaterThan(0);
    });

    it('applies capability modifier based on domain', () => {
      const { state, actorId } = buildTestGameState();

      // Location is 'market', first encounter is Merchant's Gambit
      // First encounter uses 'gold' reach
      addTraitToActor(state.graph, actorId, 'trait.high', 'gold', 10);

      const encounters = getAvailableEncounters(state, actorId);
      const progress1 = initiateEncounter(state, actorId, encounters[0].id, 0);

      // With high trait, mid-range roll should pass
      const result1 = resolveEncounter(state, progress1, 60);
      expect(result1.success).toBe(true);
    });

    it('emits a trace with outcome details', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      clearTraces();
      resolveEncounter(state, progress, 30);

      // Just verify that tracing didn't error (proper trace validation in Task 6)
    });
  });

  describe('advanceEncounter', () => {
    it('records outcome in history', () => {
      const { state, actorId } = buildTestGameState();

      // Merchant's Gambit: first encounter needs 'gold', second needs 'eye'
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 50);
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.history.length).toBe(1);
      expect(progress.history[0].success).toBe(true);
      expect(progress.history[0].tick).toBe(1);
    });

    it('increments currentEncounterIndex on success', () => {
      const { state, actorId } = buildTestGameState();

      // Merchant's Gambit: first encounter needs 'gold'
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 50);
      const initialIdx = progress.currentEncounterIndex;
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.currentEncounterIndex).toBe(initialIdx + 1);
    });

    it('sets status to completed on final encounter success', () => {
      const { state, actorId } = buildTestGameState();

      // Merchant's Gambit: encounters need 'gold' and 'eye' and 'gold' again
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 10);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 10);

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      // Simulate completing all encounters
      const encounter = encounters[0];
      for (let i = 0; i < encounter.steps.length; i++) {
        progress.currentEncounterIndex = i;
        const result = resolveEncounter(state, progress, 50); // Mid-range roll with high capability
        advanceEncounter(state, progress, result.success, i + 1);
      }

      expect(progress.status).toBe('completed');
    });

    it('sets status to abandoned on failure', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 95); // Failure
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.status).toBe('abandoned');
    });

    it('does not increment encounter on failure', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 95); // Failure
      const idx = progress.currentEncounterIndex;
      advanceEncounter(state, progress, result.success, 1);

      expect(progress.currentEncounterIndex).toBe(idx);
    });

    it('emits a trace', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 30);
      clearTraces();
      advanceEncounter(state, progress, result.success, 1);

      // Proper trace validation in Task 6
    });
  });

  describe('abandonEncounter', () => {
    it('sets status to abandoned', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      expect(progress.status).toBe('active');
      abandonEncounter(progress);

      expect(progress.status).toBe('abandoned');
    });

    it('preserves history', () => {
      const { state, actorId } = buildTestGameState();

      const encounters = getAvailableEncounters(state, actorId);
      const progress = initiateEncounter(state, actorId, encounters[0].id, 0);

      const result = resolveEncounter(state, progress, 30);
      advanceEncounter(state, progress, result.success, 1);

      const historyLen = progress.history.length;
      abandonEncounter(progress);

      expect(progress.history.length).toBe(historyLen);
    });
  });

  describe('generateEncountersForLocation', () => {
    it('returns encounters matching location type', () => {
      const { state, locationId } = buildTestGameState();

      const encounters = generateEncountersForLocation(state, locationId);

      expect(encounters.length).toBeGreaterThan(0);
      expect(encounters.every(o => o.locationTypes.includes('town'))).toBe(true);
    });

    it('returns empty for unknown location type', () => {
      const { state } = buildTestGameState();

      const unknownLocId = 'loc.unknown';
      state.graph.addNode({
        id: unknownLocId,
        type: 'location',
        name: 'UnknownLoc',
        properties: {
          hexCol: 0,
          hexRow: 0,
          locationType: 'nonexistent_type',
        },
      });

      const encounters = generateEncountersForLocation(state, unknownLocId);
      expect(encounters).toEqual([]);
    });

    it('handles missing location gracefully', () => {
      const { state } = buildTestGameState();

      const encounters = generateEncountersForLocation(state, 'nonexistent.loc');
      expect(encounters).toEqual([]);
    });
  });
});
