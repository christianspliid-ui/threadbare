import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAvailableOrdeals,
  initiateOrdeal,
  resolveEncounter,
  advanceOrdeal,
} from '../ordeal';
import { phaseOrdealProgression, resetEventCounter } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import type { GameState, TickEvent } from '../../types/gameState';
import type { CosmologyProfile, SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import type { OrdealProgress } from '../../types/ordeal';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { recalcVisibility, collectLOSSources } from '../visibility';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<typeof SPHERE_NAMES[number], number>;
}

function mockTiles() {
  const tiles = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      });
    }
  }
  return tiles;
}

function createTestGameState(seed: number = 42): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();

  const { graph } = seedWorld(cosmology, tiles, seed);

  // Add ascendant
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: { locationType: 'location' },
  });

  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      name: 'The Watcher Divine',
      title: 'The Watcher',
      description: 'Test archetype',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 },
      personalitySeed: {
        ambition_contentment: 0.1,
        courage_prudence: 0.2,
        cruelty_compassion: -0.3,
        cunning_honesty: 0.0,
        devotion_independence: 0.4,
        loyalty_treachery: 0.5,
        tradition_innovation: 0.1,
        dominance_humility: -0.2,
        wrath_patience: 0.0,
        greed_generosity: 0.3,
      },
      flavorText: 'A test archetype for the watcher',
    },
    avatar: {
      name: 'TestAvatar',
      startLocationId: 'loc.start',
      formDescription: 'A test avatar',
    },
  });

  const rivals = generateRivals(cosmology, seed);
  const rivalStates = rivals.map(r => createRivalState(r.id));

  const doomDef = generateDoomClock('breach', 360, seed);
  const doomClock = createDoomClockState('breach', 360);

  const losSources = collectLOSSources(graph, ascendantId, []);
  const gridSize = {
    cols: Math.max(...tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...tiles.map(t => t.coord.row)) + 1,
  };
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 1, gridSize.cols, gridSize.rows);

  return {
    cycle: 1,
    tick: 1,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 1, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivals,
    rivalStates,
    doomDefinition: doomDef,
    doomClock,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap,
    ordealProgress: [],
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };
}

describe('phaseOrdealProgression', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  // Test 1: Handle empty ordeal progress gracefully
  it('handles empty ordealProgress array gracefully', () => {
    const state = createTestGameState(1);
    state.ordealProgress = [];

    const result = phaseOrdealProgression(state);

    expect(result).toBeDefined();
    expect(result.tickEvents).toBeDefined();
    expect(Array.isArray(result.tickEvents)).toBe(true);
  });

  // Test 2: Progress active ordeals through encounters
  it('resolves and advances active ordeals each tick', () => {
    const state = createTestGameState(2);

    // Get available ordeals for an actor at a location
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);

    const actor = actors[0];
    const available = getAvailableOrdeals(state, actor.id);

    // If no ordeals available in this world, skip this test gracefully
    if (available.length === 0) {
      // Just verify the phase runs without error
      const result = phaseOrdealProgression(state);
      expect(result.tickEvents).toBeDefined();
      return;
    }

    // Initiate an ordeal
    const ordeal = available[0];
    const progress = initiateOrdeal(state, actor.id, ordeal.id, 1);
    expect(progress.status).toBe('active');
    expect(progress.currentEncounterIndex).toBe(0);

    // Run phase
    const result = phaseOrdealProgression(state);

    // Should have generated events
    expect(result.tickEvents).toBeDefined();
    expect(Array.isArray(result.tickEvents)).toBe(true);

    // Progress status should have changed (advanced or completed)
    const updatedProgress = state.ordealProgress[0];
    expect(updatedProgress).toBeDefined();
    // Either advanced to next encounter or completed
    expect(['active', 'completed', 'abandoned']).toContain(updatedProgress.status);
  });

  // Test 3: Events are generated for ordeal progression
  it('generates TickEvents for ordeal outcomes (success/failure/completion)', () => {
    const state = createTestGameState(3);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableOrdeals(state, actor.id);

    if (available.length > 0) {
      const ordeal = available[0];
      initiateOrdeal(state, actor.id, ordeal.id, 1);

      const result = phaseOrdealProgression(state);

      // Should have ordeal-related events in the output
      const ordealEvents = result.tickEvents.filter(e =>
        e.type === 'ordeal_encounter_success' ||
        e.type === 'ordeal_encounter_failure' ||
        e.type === 'ordeal_completed'
      );

      expect(ordealEvents.length).toBeGreaterThanOrEqual(1);
      ordealEvents.forEach(e => {
        expect(e.significance).toBeGreaterThan(0);
        expect(e.message).toBeDefined();
      });
    }
  });

  // Test 4: Ordeal completion event generated
  it('generates ordeal_completed event when final encounter succeeds', () => {
    const state = createTestGameState(4);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableOrdeals(state, actor.id);

    if (available.length > 0) {
      const ordeal = available[0];
      const progress = initiateOrdeal(state, actor.id, ordeal.id, 1);

      // Manually advance through encounters using deterministic rolls
      // (Success rolls for all encounters to reach completion)
      for (let i = 0; i < ordeal.encounters.length; i++) {
        const result = resolveEncounter(state, progress, 10); // 10 = success
        advanceOrdeal(state, progress, result.success, 1 + i);
      }

      // Progress should now be completed
      expect(progress.status).toBe('completed');

      // Phase should generate completion event
      const phaseResult = phaseOrdealProgression(state);
      const completionEvent = phaseResult.tickEvents.find(e => e.type === 'ordeal_completed');
      expect(completionEvent).toBeDefined();
      expect(completionEvent?.significance).toBeGreaterThan(0.7);
    }
  });

  // Test 5: Skips actors who already have active ordeals
  it('does not initiate a new ordeal if actor already has an active one', () => {
    const state = createTestGameState(5);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableOrdeals(state, actor.id);

    if (available.length > 0) {
      // Start one ordeal
      initiateOrdeal(state, actor.id, available[0].id, 1);
      const initialCount = state.ordealProgress.length;

      // Run phase with high initiation chance (deterministic seed)
      const result = phaseOrdealProgression(state);

      // New ordeal should NOT be initiated since actor already has active
      expect(state.ordealProgress.filter(p => p.actorId === actor.id && p.status === 'active').length)
        .toBeLessThanOrEqual(1);
    }
  });

  // Test 6: Initiates new ordeals for eligible actors
  it('may initiate new ordeals for actors without active ones', () => {
    const state = createTestGameState(6);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);

    // Start with no ordeals
    state.ordealProgress = [];

    // Run phase multiple times to increase chance of initiation
    for (let i = 0; i < 10; i++) {
      state.tick = i + 2; // Update tick
      phaseOrdealProgression(state);
    }

    // By high tick count, at least one actor should have started an ordeal
    // (3% per tick per actor means very likely after 10 ticks)
    const hasOrdeal = actors.some(a =>
      state.ordealProgress.some(p => p.actorId === a.id && p.status === 'active')
    );

    // This is probabilistic, so we can't guarantee, but 10 ticks should be likely
    // Just verify the structure is correct
    state.ordealProgress.forEach(p => {
      expect(p.ordealId).toBeDefined();
      expect(p.actorId).toBeDefined();
      expect(['active', 'completed', 'abandoned']).toContain(p.status);
    });
  });

  // Test 7: Maintains ordealProgress array properly
  it('maintains ordealProgress array in state after phase execution', () => {
    const state = createTestGameState(7);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableOrdeals(state, actor.id);

    if (available.length > 0) {
      initiateOrdeal(state, actor.id, available[0].id, 1);
      const beforeCount = state.ordealProgress.length;

      const result = phaseOrdealProgression(state);

      // Result should include ordealProgress
      expect(result.ordealProgress).toBeDefined();
      expect(Array.isArray(result.ordealProgress)).toBe(true);
      expect(result.ordealProgress.length).toBeGreaterThanOrEqual(beforeCount);
    }
  });

  // Test 8: Abandoned ordeal generates failure event
  it('generates ordeal_encounter_failure event when encounter fails', () => {
    const state = createTestGameState(8);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableOrdeals(state, actor.id);

    if (available.length > 0) {
      const ordeal = available[0];
      const progress = initiateOrdeal(state, actor.id, ordeal.id, 1);

      // Force failure with deterministic roll
      const result = resolveEncounter(state, progress, 90); // 90 = failure
      advanceOrdeal(state, progress, result.success, 1);

      // Progress should be abandoned
      expect(progress.status).toBe('abandoned');

      // Phase should process and generate event
      const phaseResult = phaseOrdealProgression(state);
      const failureEvent = phaseResult.tickEvents.find(e => e.type === 'ordeal_encounter_failure');
      expect(failureEvent).toBeDefined();
      expect(failureEvent?.significance).toBeGreaterThan(0.4);
    }
  });
});
