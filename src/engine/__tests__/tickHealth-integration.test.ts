import { describe, it, expect, beforeEach } from 'vitest';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { seedWorld } from '../worldSeed';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';
import { recalcVisibility, collectLOSSources } from '../visibility';
import {
  getHealthLog,
  getCrashLog,
  getLatestReport,
  _resetForTests as resetHealthMonitor,
} from '../tickHealthMonitor';
import { clearTraces } from '../traceBuffer';
import type { GameState, CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────────

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
        loyalty_ambition: 0.5,
        courage_prudence: 0.2,
        mercy_ruthlessness: 0.0,
        honesty_cunning: 0.0,
        sacrifice_survival: 0.4,
        tradition_novelty: 0.1,
        humility_pride: -0.2,
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

  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed + 1);
  const doomState = createDoomClockState('breach', 360);
  const fundament = createDefaultFundament();
  const resonance = createResonanceState();
  const chronicle = createGreatChronicle();

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
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: { fundament, resonance, currentCycle: 1 },
    echoDefinitions: [],
    echoStates: [],
    chronicle,
  };

  const losSources = collectLOSSources(state.graph, state.ascendantId, []);
  const gridSize = {
    cols: Math.max(...state.tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...state.tiles.map(t => t.coord.row)) + 1,
  };
  state.visibilityMap = recalcVisibility(new Map(), losSources, state.graph, state.tick, gridSize.cols, gridSize.rows);

  return state;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('tick health integration', () => {
  beforeEach(() => {
    resetDecisionCache();
    resetEventCounter();
    resetHealthMonitor();
    clearTraces();
  });

  it('200 ticks all report healthy with empty crash log', () => {
    let state = createTestGameState();

    for (let i = 0; i < 200; i++) {
      state = runTick(state);
    }

    expect(state.tick).toBe(200);

    // All health reports should be healthy
    const unhealthy = getHealthLog().filter(r => !r.healthy);
    expect(unhealthy).toHaveLength(0);

    // No crash log entries
    expect(getCrashLog()).toHaveLength(0);

    // Latest report should exist and be healthy
    const latest = getLatestReport();
    expect(latest).toBeTruthy();
    expect(latest!.healthy).toBe(true);
  });

  it('state cleanup: encounterNotifications are trimmed over time', () => {
    let state = createTestGameState();
    // Run a few ticks to establish state
    for (let i = 0; i < 10; i++) {
      state = runTick(state);
    }

    // Inject old notifications
    state = {
      ...state,
      encounterNotifications: [
        {
          id: 'old-notif', agentId: 'a1', agentName: 'A', courtPosition: null,
          encounterId: 'e1', encounterName: 'E', prose: '', choices: [],
          createdTick: 1, autoResolveTick: null, viewed: false, resolved: false,
        } as any,
        {
          id: 'recent-notif', agentId: 'a1', agentName: 'A', courtPosition: null,
          encounterId: 'e2', encounterName: 'E2', prose: '', choices: [],
          createdTick: state.tick, autoResolveTick: null, viewed: false, resolved: false,
        } as any,
      ],
    };

    // Run enough ticks so the old notification falls outside retention window
    for (let i = 0; i < 60; i++) {
      state = runTick(state);
    }

    // Old notification (createdTick=1) should be trimmed
    const notifs = state.encounterNotifications ?? [];
    expect(notifs.find(n => n.id === 'old-notif')).toBeUndefined();
  });

  it('state cleanup: resolved unifiedActions get completedAtTick stamped and pruned', () => {
    let state = createTestGameState();
    // Run a few ticks
    for (let i = 0; i < 10; i++) {
      state = runTick(state);
    }

    // Inject a resolved action without completedAtTick
    state = {
      ...state,
      unifiedActions: [
        ...state.unifiedActions,
        {
          actionId: 'test-resolved',
          actorId: 'actor-1',
          templateId: 't1',
          targetId: 'loc-1',
          scale: 'personal' as const,
          source: 'agent' as const,
          startTick: 1,
          currentStep: 0,
          stepProgress: 0,
          stepDuration: 1,
          resolved: true,
          outcome: 'success' as const,
          stepOutcomes: ['success' as const],
        },
      ],
    };

    // One tick should stamp completedAtTick
    state = runTick(state);
    const stamped = state.unifiedActions.find(a => a.actionId === 'test-resolved');
    expect(stamped?.completedAtTick).toBeDefined();

    // Run 110 more ticks — resolved action should be pruned
    for (let i = 0; i < 110; i++) {
      state = runTick(state);
    }
    const pruned = state.unifiedActions.find(a => a.actionId === 'test-resolved');
    expect(pruned).toBeUndefined();
  });
});
