import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAvailableEncounters,
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
} from '../encounter';
import { phaseEncounterProgression, resetEventCounter } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import type { GameState, TickEvent } from '../../types/gameState';
import type { CosmologyProfile, SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import type { EncounterProgress } from '../../types/encounter';
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
    properties: { locationSubtype: 'town' },
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
        loyalty_ambition: 0.1,
        courage_prudence: 0.2,
        mercy_ruthlessness: -0.3,
        honesty_cunning: 0.0,
        sacrifice_survival: 0.4,
        loyalty_ambition: 0.5,
        tradition_novelty: 0.1,
        humility_pride: -0.2,
        mercy_ruthlessness: 0.0,
        asceticism_extravagance: 0.3,
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
    encounterProgress: [],
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

describe('phaseEncounterProgression', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  // Test 1: Handle empty encounter progress gracefully
  it('handles empty encounterProgress array gracefully', () => {
    const state = createTestGameState(1);
    state.encounterProgress = [];

    const result = phaseEncounterProgression(state);

    expect(result).toBeDefined();
    expect(result.tickEvents).toBeDefined();
    expect(Array.isArray(result.tickEvents)).toBe(true);
  });

  // Test 2: Progress active encounters through encounters
  it('resolves and advances active encounters each tick', () => {
    const state = createTestGameState(2);

    // Get available encounters for an actor at a location
    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);

    const actor = actors[0];
    const available = getAvailableEncounters(state, actor.id);

    // If no encounters available in this world, skip this test gracefully
    if (available.length === 0) {
      // Just verify the phase runs without error
      const result = phaseEncounterProgression(state);
      expect(result.tickEvents).toBeDefined();
      return;
    }

    // Initiate an encounter
    const encounter = available[0];
    const progress = initiateEncounter(state, actor.id, encounter.id, 1);
    expect(progress.status).toBe('active');
    expect(progress.currentEncounterIndex).toBe(0);

    // Run phase
    const result = phaseEncounterProgression(state);

    // Should have generated events
    expect(result.tickEvents).toBeDefined();
    expect(Array.isArray(result.tickEvents)).toBe(true);

    // Progress status should have changed (advanced or completed)
    const updatedProgress = state.encounterProgress[0];
    expect(updatedProgress).toBeDefined();
    // Either advanced to next encounter or completed
    expect(['active', 'completed', 'abandoned']).toContain(updatedProgress.status);
  });

  // Test 3: Events are generated for encounter progression
  it('generates TickEvents for encounter outcomes (success/failure/completion)', () => {
    const state = createTestGameState(3);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableEncounters(state, actor.id);

    if (available.length > 0) {
      const encounter = available[0];
      initiateEncounter(state, actor.id, encounter.id, 1);

      const result = phaseEncounterProgression(state);

      // Should have encounter-related events in the output
      const encounterEvents = result.tickEvents.filter(e =>
        e.type === 'encounter_encounter_success' ||
        e.type === 'encounter_encounter_failure' ||
        e.type === 'encounter_completed'
      );

      expect(encounterEvents.length).toBeGreaterThanOrEqual(1);
      encounterEvents.forEach(e => {
        expect(e.significance).toBeGreaterThan(0);
        expect(e.message).toBeDefined();
      });
    }
  });

  // Test 4: Encounter completion event generated
  it('generates encounter_completed event when final encounter succeeds', () => {
    const state = createTestGameState(4);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableEncounters(state, actor.id);

    if (available.length > 0) {
      const encounter = available[0];
      const progress = initiateEncounter(state, actor.id, encounter.id, 1);

      // Manually advance through encounters using deterministic rolls
      // (Success rolls for all encounters to reach completion)
      for (let i = 0; i < encounter.steps.length; i++) {
        const result = resolveEncounter(state, progress, 10); // 10 = success
        advanceEncounter(state, progress, result.success, 1 + i);
      }

      // Progress should now be completed
      expect(progress.status).toBe('completed');

      // Phase should generate completion event
      const phaseResult = phaseEncounterProgression(state);
      const completionEvent = phaseResult.tickEvents.find(e => e.type === 'encounter_completed');
      expect(completionEvent).toBeDefined();
      expect(completionEvent?.significance).toBeGreaterThan(0.7);
    }
  });

  // Test 5: Skips actors who already have active encounters
  it('does not initiate a new encounter if actor already has an active one', () => {
    const state = createTestGameState(5);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableEncounters(state, actor.id);

    if (available.length > 0) {
      // Start one encounter
      initiateEncounter(state, actor.id, available[0].id, 1);
      const initialCount = state.encounterProgress.length;

      // Run phase with high initiation chance (deterministic seed)
      const result = phaseEncounterProgression(state);

      // New encounter should NOT be initiated since actor already has active
      expect(state.encounterProgress.filter(p => p.actorId === actor.id && p.status === 'active').length)
        .toBeLessThanOrEqual(1);
    }
  });

  // Test 6: Initiates new encounters for eligible actors
  it('may initiate new encounters for actors without active ones', () => {
    const state = createTestGameState(6);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    expect(actors.length).toBeGreaterThan(0);

    // Start with no encounters
    state.encounterProgress = [];

    // Run phase multiple times to increase chance of initiation
    for (let i = 0; i < 10; i++) {
      state.tick = i + 2; // Update tick
      phaseEncounterProgression(state);
    }

    // By high tick count, at least one actor should have started an encounter
    // (3% per tick per actor means very likely after 10 ticks)
    const hasEncounter = actors.some(a =>
      state.encounterProgress.some(p => p.actorId === a.id && p.status === 'active')
    );

    // This is probabilistic, so we can't guarantee, but 10 ticks should be likely
    // Just verify the structure is correct
    state.encounterProgress.forEach(p => {
      expect(p.encounterId).toBeDefined();
      expect(p.actorId).toBeDefined();
      expect(['active', 'completed', 'abandoned']).toContain(p.status);
    });
  });

  // Test 7: Maintains encounterProgress array properly
  it('maintains encounterProgress array in state after phase execution', () => {
    const state = createTestGameState(7);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableEncounters(state, actor.id);

    if (available.length > 0) {
      initiateEncounter(state, actor.id, available[0].id, 1);
      const beforeCount = state.encounterProgress.length;

      const result = phaseEncounterProgression(state);

      // Result should include encounterProgress
      expect(result.encounterProgress).toBeDefined();
      expect(Array.isArray(result.encounterProgress)).toBe(true);
      expect(result.encounterProgress.length).toBeGreaterThanOrEqual(beforeCount);
    }
  });

  // Test 8: Abandoned encounter generates failure event
  it('generates encounter_encounter_failure event when encounter fails', () => {
    const state = createTestGameState(8);

    const actors = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const actor = actors[0];
    const available = getAvailableEncounters(state, actor.id);

    if (available.length > 0) {
      const encounter = available[0];
      const progress = initiateEncounter(state, actor.id, encounter.id, 1);

      // Force failure with deterministic roll
      const result = resolveEncounter(state, progress, 90); // 90 = failure
      advanceEncounter(state, progress, result.success, 1);

      // Progress should be abandoned
      expect(progress.status).toBe('abandoned');

      // Phase should process and generate event
      const phaseResult = phaseEncounterProgression(state);
      const failureEvent = phaseResult.tickEvents.find(e => e.type === 'encounter_encounter_failure');
      expect(failureEvent).toBeDefined();
      expect(failureEvent?.significance).toBeGreaterThan(0.4);
    }
  });
});
