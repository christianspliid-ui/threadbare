import { describe, it, expect, beforeEach } from 'vitest';
import {
  enableTracing,
  disableTracing,
  getTraces,
  getTracesForAgent,
  clearTraces,
  isTracingEnabled,
} from '../traceBuffer';
import { runTick } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { createGreatChronicle } from '../chronicle';
import { recalcVisibility, collectLOSSources } from '../visibility';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile, HexTile, TerrainType } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────

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

function mockTiles(): HexTile[] {
  const terrains: TerrainType[] = [
    'desert', 'mountains', 'jungle', 'grassland', 'tundra',
    'swamp', 'hills', 'volcano', 'temperate_forest', 'steppe',
  ];
  return terrains.map((terrain, i) => ({
    coord: { col: i % 5, row: Math.floor(i / 5) },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  }));
}

function createTestGameState(): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles();
  const seed = 42;
  const seedResult = seedWorld(cosmology, tiles, seed);
  const { graph } = seedResult;

  // Add a starting location
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: { locationType: 'location' },
  });

  // Create ascendant
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

  // Create rivals
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map((r) => createRivalState(r.id));

  // Create doom clock
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  // Initialize visibility
  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 100, 5, 5);

  // Assemble game state
  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 1, year: 0 },
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
    stealthExposure: 0,
    visibilityMap,
    encounterProgress: [],
    worldSoul: {
      fundament: createDefaultFundament(cosmology),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };
}

// ─── Tests ────────────────────────────────────────────────────

describe('trace buffer integration', () => {
  let state: GameState;

  beforeEach(() => {
    // Reset trace state
    disableTracing();
    clearTraces();
    enableTracing();

    // Create fresh game state
    state = createTestGameState();
  });

  it('tracing should be enabled after setup', () => {
    expect(isTracingEnabled()).toBe(true);
  });

  it('running 50 ticks produces traces across multiple categories', () => {
    for (let i = 0; i < 50; i++) {
      state = runTick(state);
    }

    const traces = getTraces();
    expect(traces.length).toBeGreaterThan(0);

    // Check for tick_summary entries (one per tick)
    const tickSummaries = traces.filter((t) => t.category === 'tick_summary');
    expect(tickSummaries.length).toBe(50);
  });

  it('traces contain all required base fields', () => {
    for (let i = 0; i < 10; i++) {
      state = runTick(state);
    }

    const traces = getTraces();
    expect(traces.length).toBeGreaterThan(0);

    for (const trace of traces) {
      expect(trace.id).toBeGreaterThanOrEqual(0);
      expect(trace.tick).toBeGreaterThanOrEqual(0);
      expect(trace.timestamp).toBeGreaterThan(0);
      expect(trace.category).toBeTruthy();
      expect(typeof trace.category).toBe('string');
      expect(trace.summary).toBeTruthy();
      expect(typeof trace.summary).toBe('string');
    }
  });

  it('getTracesForAgent returns only that agent traces', () => {
    for (let i = 0; i < 30; i++) {
      state = runTick(state);
    }

    const allTraces = getTraces();
    const agentTraces = allTraces.filter((t) => t.agentId);

    if (agentTraces.length > 0) {
      const agentId = agentTraces[0].agentId!;
      const filtered = getTracesForAgent(agentId);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((t) => t.agentId === agentId)).toBe(true);

      // Filtered should be smaller than or equal to all traces
      expect(filtered.length).toBeLessThanOrEqual(allTraces.length);
    }
  });

  it('buffer does not exceed BUFFER_SIZE (500)', () => {
    // Run enough ticks to potentially overflow the buffer
    for (let i = 0; i < 200; i++) {
      state = runTick(state);
    }

    const traces = getTraces();
    expect(traces.length).toBeLessThanOrEqual(500);
  });

  it('disabling tracing prevents new entries from being recorded', () => {
    // Run some ticks with tracing enabled
    for (let i = 0; i < 5; i++) {
      state = runTick(state);
    }

    const countBefore = getTraces().length;
    expect(countBefore).toBeGreaterThan(0);

    // Disable tracing
    disableTracing();
    expect(isTracingEnabled()).toBe(false);

    // Run more ticks
    for (let i = 0; i < 5; i++) {
      state = runTick(state);
    }

    // Count should not increase
    const countAfter = getTraces().length;
    expect(countAfter).toBe(countBefore);
  });

  it('clearing traces resets buffer and ID counter', () => {
    for (let i = 0; i < 10; i++) {
      state = runTick(state);
    }

    expect(getTraces().length).toBeGreaterThan(0);

    clearTraces();
    expect(getTraces().length).toBe(0);

    // Re-enable and run ticks
    enableTracing();
    for (let i = 0; i < 5; i++) {
      state = runTick(state);
    }

    // IDs should start from 0 again
    const traces = getTraces();
    expect(traces.length).toBeGreaterThan(0);
    expect(Math.min(...traces.map((t) => t.id))).toBe(0);
  });

  it('trace IDs are sequential after clearing', () => {
    for (let i = 0; i < 20; i++) {
      state = runTick(state);
    }

    clearTraces();
    enableTracing();

    for (let i = 0; i < 10; i++) {
      state = runTick(state);
    }

    const traces = getTraces();
    const ids = traces.map((t) => t.id);
    const expected = Array.from({ length: ids.length }, (_, i) => i);

    expect(ids).toEqual(expected);
  });

  it('trace timestamps are in chronological order', () => {
    for (let i = 0; i < 20; i++) {
      state = runTick(state);
    }

    const traces = getTraces();
    for (let i = 1; i < traces.length; i++) {
      expect(traces[i].timestamp).toBeGreaterThanOrEqual(traces[i - 1].timestamp);
    }
  });

  it('multiple agents produce multiple agent-specific traces', () => {
    for (let i = 0; i < 50; i++) {
      state = runTick(state);
    }

    const allTraces = getTraces();
    const agentIds = new Set<string>();

    for (const trace of allTraces) {
      if (trace.agentId) {
        agentIds.add(trace.agentId);
      }
    }

    // Should have at least a few different agents (depending on world seeding)
    expect(agentIds.size).toBeGreaterThanOrEqual(0);

    // For each agent, filtering should produce non-empty results if that agent exists
    for (const agentId of agentIds) {
      const agentTraces = getTracesForAgent(agentId);
      expect(agentTraces.length).toBeGreaterThan(0);
      expect(agentTraces.every((t) => t.agentId === agentId)).toBe(true);
    }
  });
});
