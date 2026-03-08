import { describe, it, expect, beforeEach } from 'vitest';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import { runTick, resetEventCounter } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { recalcVisibility, collectLOSSources } from '../visibility';
import type { TickSummaryTrace } from '../../types/trace';
import type { GameState, CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
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

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<typeof SPHERE_NAMES[number], number>;
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

  // Generate doom
  const doomDef = generateDoomClock('breach', 360, seed + 1);
  const doomState = createDoomClockState('breach', 360);

  // World soul
  const fundament = createDefaultFundament();
  const resonance = createResonanceState();

  // Chronicle
  const chronicle = createGreatChronicle();

  // Build game state
  const state: GameState = {
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
    stealthExposure: 0,
    visibilityMap: {},
    ordealProgress: [],
    worldSoul: { fundament, resonance, currentCycle: 1 },
    echoDefinitions: [],
    echoStates: [],
    chronicle,
  };

  // Recalc visibility
  const losSources = collectLOSSources(state.graph, state.ascendantId, []);
  const gridSize = {
    cols: Math.max(...state.tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...state.tiles.map(t => t.coord.row)) + 1,
  };
  state.visibilityMap = recalcVisibility(new Map(), losSources, state.graph, state.tick, gridSize.cols, gridSize.rows);

  return state;
}

describe('orchestrator tick_summary trace', () => {
  beforeEach(() => {
    disableTracing();
    clearTraces();
    enableTracing();
    resetEventCounter();
  });

  it('emits tick_summary trace after each tick', () => {
    let state = createTestGameState();
    state = runTick(state);

    const traces = getTraces().filter(t => t.category === 'tick_summary') as TickSummaryTrace[];
    expect(traces).toHaveLength(1);
    expect(traces[0].tick).toBe(state.tick);
    expect(traces[0].agentsProcessed).toBeGreaterThanOrEqual(0);
    expect(traces[0].doomStage).toBeGreaterThanOrEqual(0);
    expect(traces[0].summary).toBeTruthy();
  });

  it('tick_summary has human-readable summary', () => {
    let state = createTestGameState();
    state = runTick(state);

    const trace = getTraces().find(t => t.category === 'tick_summary') as TickSummaryTrace;
    // Summary should mention tick number and event count, not just raw data
    expect(trace.summary).toMatch(/tick|events|agents/i);
  });

  it('does not emit tick_summary when tracing is disabled', () => {
    disableTracing();
    let state = createTestGameState();
    state = runTick(state);
    enableTracing();

    expect(getTraces().filter(t => t.category === 'tick_summary')).toHaveLength(0);
  });

  it('tick_summary includes event counts per phase', () => {
    let state = createTestGameState();
    state = runTick(state);

    const trace = getTraces().find(t => t.category === 'tick_summary') as TickSummaryTrace;
    expect(trace.phaseEventCounts).toBeDefined();
    expect(typeof trace.phaseEventCounts).toBe('object');
  });

  it('tick_summary includes essence and mandate data', () => {
    let state = createTestGameState();
    state = runTick(state);

    const trace = getTraces().find(t => t.category === 'tick_summary') as TickSummaryTrace;
    expect(trace.essenceTotal).toBeGreaterThanOrEqual(0);
    expect(trace.mandateProgress).toBeGreaterThanOrEqual(0);
  });
});
