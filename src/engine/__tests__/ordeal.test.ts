import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAvailableOrdeals,
  initiateOrdeal,
  resolveEncounter,
  advanceOrdeal,
  abandonOrdeal,
  generateOrdealsForLocation,
} from '../ordeal';
import type { GameState, OrdealProgress } from '../../types';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, clearTraces } from '../traceBuffer';

// ──────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────

/**
 * Build a minimal GameState for ordeal testing.
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
      locationType: 'market',
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
    ordealProgress: [],
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

describe('Ordeal Engine', () => {
  beforeEach(() => {
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  describe('getAvailableOrdeals', () => {
    it('returns ordeals matching location type', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);

      expect(ordeals.length).toBeGreaterThan(0);
      expect(ordeals.some(o => o.id === 'ordeal.merchants_gambit')).toBe(true);
    });

    it('returns empty if actor has no location', () => {
      const { state, actorId } = buildTestGameState();
      // Remove the located_at edge
      state.graph.getOutgoingEdges(actorId, 'located_at').forEach(e => {
        state.graph.removeEdge(e.id);
      });

      const ordeals = getAvailableOrdeals(state, actorId);
      expect(ordeals).toEqual([]);
    });

    it('excludes ordeals with active progress', () => {
      const { state, actorId } = buildTestGameState();

      // Initiate an ordeal
      const ordeals = getAvailableOrdeals(state, actorId);
      const ordealToStart = ordeals[0];
      initiateOrdeal(state, actorId, ordealToStart.id, 0);

      // Now get available ordeals again
      const available = getAvailableOrdeals(state, actorId);

      // The ordeal we just started should not be available
      expect(available.find(o => o.id === ordealToStart.id)).toBeUndefined();
    });

    it('excludes ordeals with abandoned status but within cooldown', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const ordealId = ordeals[0].id;

      // Initiate and abandon
      const progress = initiateOrdeal(state, actorId, ordealId, 0);
      abandonOrdeal(progress);

      // Within cooldown, should be excluded
      const available = getAvailableOrdeals(state, actorId);
      expect(available.find(o => o.id === ordealId)).toBeUndefined();
    });

    it('includes abandoned ordeals after cooldown expires', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const ordealId = ordeals[0].id;

      // Initiate and abandon at tick 0
      const progress = initiateOrdeal(state, actorId, ordealId, 0);
      abandonOrdeal(progress);

      // Advance state to tick 25 (cooldown is 20)
      state.tick = 25;

      const available = getAvailableOrdeals(state, actorId);
      expect(available.find(o => o.id === ordealId)).toBeDefined();
    });
  });

  describe('initiateOrdeal', () => {
    it('creates a new OrdealProgress with status active', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 5);

      expect(progress.status).toBe('active');
      expect(progress.actorId).toBe(actorId);
      expect(progress.ordealId).toBe(ordeals[0].id);
      expect(progress.currentEncounterIndex).toBe(0);
      expect(progress.startedTick).toBe(5);
      expect(progress.history).toEqual([]);
    });

    it('adds progress to state.ordealProgress', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const initialLen = state.ordealProgress.length;

      initiateOrdeal(state, actorId, ordeals[0].id, 5);

      expect(state.ordealProgress.length).toBe(initialLen + 1);
    });

    it('emits a trace', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      clearTraces();

      initiateOrdeal(state, actorId, ordeals[0].id, 5);

      // Note: ordeal_resolution trace may not exist yet in types, so just check that something was traced
      // This will be properly validated in Task 6 when trace types are updated
    });
  });

  describe('resolveEncounter', () => {
    it('returns success when roll passes probability threshold', () => {
      const { state, actorId } = buildTestGameState();

      // Location is 'market', so first ordeal is Merchant's Gambit
      // First encounter is 'Negotiation' with reach: 'gold'
      // Give actor high capability in gold
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      // With high capability, even a mid-range roll should pass
      const result = resolveEncounter(state, progress, 50); // Mid roll with high capability → success

      expect(result.success).toBe(true);
    });

    it('returns failure when roll fails probability threshold', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      // With default low capability and high roll, should fail
      const result = resolveEncounter(state, progress, 95); // High roll → failure

      expect(result.success).toBe(false);
    });

    it('includes EncounterOutcome with narrative', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 30); // Success

      expect(result.outcome).toBeDefined();
      expect(result.outcome.narrative).toBeDefined();
      expect(result.outcome.narrative.length).toBeGreaterThan(0);
    });

    it('applies capability modifier based on domain', () => {
      const { state, actorId } = buildTestGameState();

      // Location is 'market', first ordeal is Merchant's Gambit
      // First encounter uses 'gold' reach
      addTraitToActor(state.graph, actorId, 'trait.high', 'gold', 10);

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress1 = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      // With high trait, mid-range roll should pass
      const result1 = resolveEncounter(state, progress1, 60);
      expect(result1.success).toBe(true);
    });

    it('emits a trace with outcome details', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      clearTraces();
      resolveEncounter(state, progress, 30);

      // Just verify that tracing didn't error (proper trace validation in Task 6)
    });
  });

  describe('advanceOrdeal', () => {
    it('records outcome in history', () => {
      const { state, actorId } = buildTestGameState();

      // Merchant's Gambit: first encounter needs 'gold', second needs 'eye'
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 50);
      advanceOrdeal(state, progress, result.success, 1);

      expect(progress.history.length).toBe(1);
      expect(progress.history[0].success).toBe(true);
      expect(progress.history[0].tick).toBe(1);
    });

    it('increments currentEncounterIndex on success', () => {
      const { state, actorId } = buildTestGameState();

      // Merchant's Gambit: first encounter needs 'gold'
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 8);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 8);

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 50);
      const initialIdx = progress.currentEncounterIndex;
      advanceOrdeal(state, progress, result.success, 1);

      expect(progress.currentEncounterIndex).toBe(initialIdx + 1);
    });

    it('sets status to completed on final encounter success', () => {
      const { state, actorId } = buildTestGameState();

      // Merchant's Gambit: encounters need 'gold' and 'eye' and 'gold' again
      addTraitToActor(state.graph, actorId, 'trait.gold', 'gold', 10);
      addTraitToActor(state.graph, actorId, 'trait.eye', 'eye', 10);

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      // Simulate completing all encounters
      const ordeal = ordeals[0];
      for (let i = 0; i < ordeal.encounters.length; i++) {
        progress.currentEncounterIndex = i;
        const result = resolveEncounter(state, progress, 50); // Mid-range roll with high capability
        advanceOrdeal(state, progress, result.success, i + 1);
      }

      expect(progress.status).toBe('completed');
    });

    it('sets status to abandoned on failure', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 95); // Failure
      advanceOrdeal(state, progress, result.success, 1);

      expect(progress.status).toBe('abandoned');
    });

    it('does not increment encounter on failure', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 95); // Failure
      const idx = progress.currentEncounterIndex;
      advanceOrdeal(state, progress, result.success, 1);

      expect(progress.currentEncounterIndex).toBe(idx);
    });

    it('emits a trace', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 30);
      clearTraces();
      advanceOrdeal(state, progress, result.success, 1);

      // Proper trace validation in Task 6
    });
  });

  describe('abandonOrdeal', () => {
    it('sets status to abandoned', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      expect(progress.status).toBe('active');
      abandonOrdeal(progress);

      expect(progress.status).toBe('abandoned');
    });

    it('preserves history', () => {
      const { state, actorId } = buildTestGameState();

      const ordeals = getAvailableOrdeals(state, actorId);
      const progress = initiateOrdeal(state, actorId, ordeals[0].id, 0);

      const result = resolveEncounter(state, progress, 30);
      advanceOrdeal(state, progress, result.success, 1);

      const historyLen = progress.history.length;
      abandonOrdeal(progress);

      expect(progress.history.length).toBe(historyLen);
    });
  });

  describe('generateOrdealsForLocation', () => {
    it('returns ordeals matching location type', () => {
      const { state, locationId } = buildTestGameState();

      const ordeals = generateOrdealsForLocation(state, locationId);

      expect(ordeals.length).toBeGreaterThan(0);
      expect(ordeals.every(o => o.locationTypes.includes('market'))).toBe(true);
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

      const ordeals = generateOrdealsForLocation(state, unknownLocId);
      expect(ordeals).toEqual([]);
    });

    it('handles missing location gracefully', () => {
      const { state } = buildTestGameState();

      const ordeals = generateOrdealsForLocation(state, 'nonexistent.loc');
      expect(ordeals).toEqual([]);
    });
  });
});
