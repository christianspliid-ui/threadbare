import { describe, it, expect, beforeEach } from 'vitest';
import {
  phaseDoom,
  phaseAgentActions,
  phaseRivalActions,
  phaseStealth,
  phaseNarrative,
  phaseEssence,
  phaseMandate,
  phaseDoomExpiry,
  runTick,
  resetEventCounter,
} from '../orchestrator';
import { startTwilight, runTwilightTick, computeHarvest, transitionToNewCycle } from '../cycleEnd';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
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

  // Generate rivals
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

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

describe('Orchestrator', () => {
  beforeEach(() => {
    resetEventCounter();
  });

  it('phaseDoom advances the doom clock', () => {
    const state = createTestGameState();
    const updates = phaseDoom(state);
    expect(updates.doomClock).toBeDefined();
    expect(updates.doomClock!.currentTick).toBeGreaterThan(0);
  });

  it('phaseDoom emits doom_escalation event on stage change', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, currentTick: 71, progress: 71 / 360, currentStage: 1 };
    const updates = phaseDoom(state);
    const events = updates.tickEvents ?? [];
    const escalation = events.find(e => e.type === 'doom_escalation');
    expect(escalation).toBeDefined();
  });

  it('phaseAgentActions produces some events over multiple ticks', () => {
    const state = createTestGameState();
    let totalEvents = 0;
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = { ...s, tick: i, tickEvents: [] };
      const updates = phaseAgentActions(s);
      totalEvents += (updates.tickEvents ?? []).length;
    }
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('phaseRivalActions fires rival events periodically', () => {
    const state = createTestGameState();
    let totalEvents = 0;
    let s = state;
    for (let i = 0; i < 20; i++) {
      s = { ...s, tick: i, tickEvents: [] };
      const updates = phaseRivalActions(s);
      s = { ...s, ...updates };
      totalEvents += (updates.tickEvents ?? []).length;
    }
    expect(totalEvents).toBeGreaterThan(0);
  });

  it('phaseStealth decays exposure', () => {
    const state = createTestGameState();
    state.stealthExposure = 0.5;
    const updates = phaseStealth(state);
    expect(updates.stealthExposure).toBeLessThan(0.5);
  });

  it('phaseStealth does not go below zero', () => {
    const state = createTestGameState();
    state.stealthExposure = 0.005;
    const updates = phaseStealth(state);
    expect(updates.stealthExposure).toBeGreaterThanOrEqual(0);
  });

  it('phaseDoomExpiry triggers twilight when doom expires', () => {
    const state = createTestGameState();
    state.doomClock = { ...state.doomClock, expired: true };
    const updates = phaseDoomExpiry(state);
    expect(updates.phase).toBe('twilight');
  });

  it('phaseDoomExpiry does nothing when doom is active', () => {
    const state = createTestGameState();
    const updates = phaseDoomExpiry(state);
    expect(updates.phase).toBeUndefined();
  });

  it('runTick advances tick counter', () => {
    const state = createTestGameState();
    const next = runTick(state);
    expect(next.tick).toBe(1);
  });

  it('runTick is deterministic', () => {
    const a = createTestGameState();
    const b = createTestGameState();
    const nextA = runTick(a);
    resetEventCounter();
    const nextB = runTick(b);
    expect(nextA.tick).toBe(nextB.tick);
    expect(nextA.doomClock.currentTick).toBe(nextB.doomClock.currentTick);
  });

  it('runTick accumulates recent events', () => {
    let state = createTestGameState();
    for (let i = 0; i < 30; i++) {
      resetEventCounter();
      state = runTick(state);
    }
    expect(state.recentEvents.length).toBeGreaterThan(0);
    expect(state.recentEvents.length).toBeLessThanOrEqual(100);
  });

  it('multi-tick simulation reaches doom expiry', () => {
    let state = createTestGameState();
    state.doomClock = { ...state.doomClock, totalTicks: 20 };
    for (let i = 0; i < 25; i++) {
      state = runTick(state);
    }
    expect(state.phase).toBe('twilight');
  });
});

describe('Full game loop integration', () => {
  it('runs a complete cycle: play → doom expires → twilight → harvest → transition → new cycle', () => {
    resetEventCounter();

    // Start with a short doom clock
    let state = createTestGameState();
    state.doomClock = { ...state.doomClock, totalTicks: 30 };

    // ── Playing phase ──
    let ticksPlayed = 0;
    while (state.phase === 'playing' && ticksPlayed < 50) {
      state = runTick(state);
      ticksPlayed++;
    }

    // Should have transitioned to twilight
    expect(state.phase).toBe('twilight');
    expect(ticksPlayed).toBeLessThanOrEqual(35); // doom should expire around tick 30

    // Verify some events were generated during play
    expect(state.recentEvents.length).toBeGreaterThan(0);

    // ── Twilight phase ──
    state = startTwilight(state);
    let twilightComplete = false;
    while (!twilightComplete) {
      const result = runTwilightTick(state);
      state = result.state;
      twilightComplete = result.complete;
    }
    expect(state.phase).toBe('harvest');

    // ── Harvest ──
    const harvest = computeHarvest(state);
    expect(harvest.cosmicEchoCandidates.length).toBeGreaterThan(0);
    expect(harvest.harvestType).toBeDefined();

    // ── Transition ──
    const cosmicEchoes = harvest.cosmicEchoCandidates.map(c => c.echoDefinition);
    state = transitionToNewCycle(state, cosmicEchoes, [], harvest.chronicleSummary);

    expect(state.cycle).toBe(2);
    expect(state.tick).toBe(0);
    expect(state.echoDefinitions.length).toBeGreaterThan(0);
    expect(state.chronicle.volumes.length).toBe(1);

    // ── New cycle: verify echoes persist ──
    expect(state.echoStates.length).toBeGreaterThan(0);
    expect(state.chronicleEntries).toHaveLength(0); // reset for new cycle
  });
});
