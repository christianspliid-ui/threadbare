/**
 * Test trace instrumentation for encounter resolution.
 * Verifies that encounter functions emit encounter_resolution traces.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  enableTracing,
  disableTracing,
  clearTraces,
  getTraces,
  getTracesForAgent,
} from '../traceBuffer';
import { initiateEncounter, resolveEncounter, advanceEncounter } from '../encounter';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { recalcVisibility, collectLOSSources } from '../visibility';
import type { GameState, CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import type { EncounterResolutionTrace } from '../../types/trace';
import { CULTURE_COUNT } from '../../types/culture';

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

function createTestGameState(): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();
  const seed = 42;

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

  // Generate rivals
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  // Initialize visibility map
  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, 5, 5);

  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0.0,
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
    traceBuffer: [],
  };
}

describe('traceBuffer-encounter: Encounter Resolution Instrumentation', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('should emit encounter_resolution trace when initiating encounter', () => {
    const state = createTestGameState();
    const actors = state.graph.getNodesByType('actor');
    const actorId = actors[0]?.id ?? 'test-actor';

    initiateEncounter(state, actorId, 'encounter.deep_descent', 10);

    const traces = getTraces();
    const encounterTrace = traces.find(
      (t) => t.category === 'encounter_resolution'
    ) as EncounterResolutionTrace | undefined;

    expect(encounterTrace).toBeDefined();
    expect(encounterTrace?.category).toBe('encounter_resolution');
    expect(encounterTrace?.agentId).toBe(actorId);
    expect(encounterTrace?.status).toBe('initiated');
  });

  it('should emit encounter_resolution trace when resolving encounter', () => {
    const state = createTestGameState();
    const actors = state.graph.getNodesByType('actor');
    const actorId = actors[0]?.id ?? 'test-actor';

    const progress = initiateEncounter(state, actorId, 'encounter.deep_descent', 10);
    clearTraces(); // Clear initiate trace

    const { success } = resolveEncounter(state, progress, 0.5);

    const traces = getTraces();
    const encounterTrace = traces.find(
      (t) => t.category === 'encounter_resolution'
    ) as EncounterResolutionTrace | undefined;

    expect(encounterTrace).toBeDefined();
    expect(encounterTrace?.category).toBe('encounter_resolution');
    expect(encounterTrace?.roll).toBe(0.5);
    expect(typeof encounterTrace?.success).toBe('boolean');
  });

  it('should filter encounter_resolution traces by agent', () => {
    const state = createTestGameState();
    const actors = state.graph.getNodesByType('actor');
    const actor1 = actors[0]?.id ?? 'actor-1';
    const actor2 = actors[1]?.id ?? 'actor-2';

    initiateEncounter(state, actor1, 'encounter.deep_descent', 10);
    initiateEncounter(state, actor2, 'encounter.trial_of_flame', 11);

    const actor1Traces = getTracesForAgent(actor1);
    const filteredEncounterTraces = actor1Traces.filter(
      (t) => t.category === 'encounter_resolution'
    ) as EncounterResolutionTrace[];

    expect(filteredEncounterTraces.length).toBeGreaterThan(0);
    expect(filteredEncounterTraces.every(t => t.agentId === actor1)).toBe(true);
  });

  it('should have proper encounter_resolution trace structure', () => {
    const state = createTestGameState();
    const actors = state.graph.getNodesByType('actor');
    const actorId = actors[0]?.id ?? 'test-actor';

    initiateEncounter(state, actorId, 'encounter.deep_descent', 10);

    const traces = getTraces();
    const encounterTrace = traces.find(
      (t) => t.category === 'encounter_resolution'
    ) as EncounterResolutionTrace | undefined;

    // Check all required fields
    expect(encounterTrace?.id).toBeDefined();
    expect(encounterTrace?.tick).toBe(10);
    expect(encounterTrace?.timestamp).toBeDefined();
    expect(encounterTrace?.category).toBe('encounter_resolution');
    expect(encounterTrace?.agentId).toBe(actorId);
    expect(encounterTrace?.encounterId).toBe('encounter.deep_descent');
    expect(encounterTrace?.actorId).toBe(actorId);
    expect(encounterTrace?.encounterId).toBeDefined();
    expect(encounterTrace?.stepName).toBeDefined();
    expect(encounterTrace?.difficulty).toBeDefined();
    expect(encounterTrace?.capability).toBeDefined();
    expect(encounterTrace?.probability).toBeDefined();
    expect(encounterTrace?.roll).toBeDefined();
    expect(typeof encounterTrace?.success).toBe('boolean');
    expect(encounterTrace?.status).toBeDefined();
    expect(Array.isArray(encounterTrace?.traitChanges)).toBe(true);
    expect(encounterTrace?.summary).toBeDefined();
  });

  it('should emit encounter_resolution trace when advancing encounter', () => {
    const state = createTestGameState();
    const actors = state.graph.getNodesByType('actor');
    const actorId = actors[0]?.id ?? 'test-actor';

    const progress = initiateEncounter(state, actorId, 'encounter.deep_descent', 10);
    clearTraces();

    advanceEncounter(state, progress, true, 11);

    const traces = getTraces();
    const encounterTrace = traces.find(
      (t) => t.category === 'encounter_resolution'
    ) as EncounterResolutionTrace | undefined;

    expect(encounterTrace).toBeDefined();
    expect(encounterTrace?.tick).toBe(11);
    expect(encounterTrace?.success).toBe(true);
  });

  it('should include trait changes in encounter_resolution trace', () => {
    const state = createTestGameState();
    const actors = state.graph.getNodesByType('actor');
    const actorId = actors[0]?.id ?? 'test-actor';

    const progress = initiateEncounter(state, actorId, 'encounter.deep_descent', 10);
    clearTraces();

    // Resolve with a deterministic roll
    resolveEncounter(state, progress, 0.9);

    const traces = getTraces();
    const encounterTrace = traces.find(
      (t) => t.category === 'encounter_resolution'
    ) as EncounterResolutionTrace | undefined;

    expect(encounterTrace).toBeDefined();
    expect(Array.isArray(encounterTrace?.traitChanges)).toBe(true);
  });
});
