import { describe, it, expect } from 'vitest';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
  TWILIGHT_TICKS,
} from '../cycleEnd';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { recalcVisibility, collectLOSSources } from '../visibility';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

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

  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  // Initialize visibility map
  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 100, 5, 5);

  return {
    cycle: 1,
    tick: 100,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 100, ticksPerSeason: 90, season: 1, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: { ...doomState, expired: true, progress: 1.0, currentTick: 360 },
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

describe('Cycle End Flow', () => {
  it('startTwilight sets phase to twilight', () => {
    const state = createTestGameState();
    const result = startTwilight(state);
    expect(result.phase).toBe('twilight');
  });

  it('runTwilightTick advances ticks until complete', () => {
    let state = startTwilight(createTestGameState());
    let complete = false;
    let tickCount = 0;

    while (!complete) {
      const result = runTwilightTick(state);
      state = result.state;
      complete = result.complete;
      tickCount++;
    }

    expect(tickCount).toBe(TWILIGHT_TICKS);
    expect(state.phase).toBe('harvest');
  });

  it('computeHarvest returns candidates and harvest type', () => {
    const state = createTestGameState();
    const result = computeHarvest(state);
    expect(['triumphant', 'somber', 'bittersweet']).toContain(result.harvestType);
    expect(result.cosmicEchoCandidates.length).toBeGreaterThan(0);
    expect(result.divineEchoSlots).toBeGreaterThan(0);
    expect(result.chronicleSummary.length).toBeGreaterThan(0);
  });

  it('computeHarvest returns somber when doom fully expired without mandate', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, progress: 0.95 };
    const result = computeHarvest(state);
    expect(result.harvestType).toBe('somber');
  });

  it('computeHarvest returns triumphant when mandate completed', () => {
    const state = createTestGameState();
    state.mandateState = {
      mandateId: 'm1',
      currentStage: 'culmination',
      progress: 1.0,
      completed: true,
      failed: false,
    };
    const result = computeHarvest(state);
    expect(result.harvestType).toBe('triumphant');
  });

  it('transitionToNewCycle increments cycle and resets state', () => {
    const state = createTestGameState();
    const harvest = computeHarvest(state);
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);
    const divineEchoes: typeof cosmicEchoes = [];

    const next = transitionToNewCycle(state, cosmicEchoes, divineEchoes, harvest.chronicleSummary);
    expect(next.cycle).toBe(2);
    expect(next.tick).toBe(0);
    expect(next.phase).toBe('transition');
    expect(next.echoDefinitions.length).toBeGreaterThan(0);
    expect(next.echoStates.length).toBeGreaterThan(0);
    expect(next.chronicle.volumes.length).toBe(1);
    expect(next.chronicleEntries).toHaveLength(0);
  });

  it('transitionToNewCycle preserves surviving echoes from previous cycles', () => {
    const state = createTestGameState();
    // Add a pre-existing echo from cycle 0
    state.echoDefinitions = [{
      id: 'old_echo',
      echoType: 'legacy',
      source: 'cosmic',
      originNodeId: 'ind_0',
      originCycle: 0,
      name: 'Old Echo',
      summary: 'From a past age',
      sphereAffinities: ['force'],
      significance: 0.5,
      injection: { injectionType: 'cultural_template', description: 'test', sphereBiases: {} },
    }];
    state.echoStates = [{ id: 'old_echo', degradation: 0.3, cyclesActive: 2, faded: false }];

    const harvest = computeHarvest(state);
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);

    const next = transitionToNewCycle(state, cosmicEchoes, [], harvest.chronicleSummary);
    // Old echo should survive (degradation increases but stays under threshold)
    const oldEcho = next.echoStates.find(e => e.id === 'old_echo');
    expect(oldEcho).toBeDefined();
    // degradeAllEchoes increases degradation by DEGRADATION_PER_CYCLE (check actual value)
    expect(oldEcho!.faded).toBe(false);
  });
});
