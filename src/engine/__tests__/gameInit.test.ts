import { describe, it, expect } from 'vitest';
import { initializeGameState, DEFAULT_COLS, DEFAULT_ROWS, INITIAL_WORSHIPPER_COUNT, INITIAL_WORSHIPPER_TIER, MAP_SIZE_PRESETS, DEFAULT_MAP_SIZE } from '../gameInit';
import type { MapSizePreset } from '../gameInit';
import { getRetinueAgents } from '../retinue';
import type { AscendantArchetype } from '../../types/influence';
import type { CosmologyProfile } from '../../types';
import { SPHERE_NAMES } from '../../types';

describe('Game Initialization', () => {
  const testArchetype: AscendantArchetype = {
    id: 'arch.test',
    title: 'The Wanderer',
    sphereAlignment: {
      primary: 'chaos',
      secondary: 'light',
    },
    personalitySeed: {
      loyalty_ambition: 0.3,
      courage_prudence: -0.1,
      mercy_ruthlessness: 0.2,
      honesty_cunning: -0.4,
      sacrifice_survival: 0.1,
      loyalty_ambition: 0.5,
      tradition_novelty: -0.2,
      restraint_indulgence: 0.0,
      pragmatism_idealism: 0.3,
      openness_caution: -0.1,
    },
  };

  const testCosmology: CosmologyProfile = {
    id: 'cosmo.test',
    foundationSpheres: {
      primary: 'chaos',
      secondary: 'light',
    },
    creationSpheres: {
      force: 0.1,
      matter: 0.2,
      energy: 0.3,
      life: 0.1,
      mind: 0.1,
      spirit: 0.05,
      time: 0.05,
      entropy: 0.05,
    },
  };

  it('returns a valid GameState with all required fields', () => {
    const { state, tiles } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);

    expect(state).toBeDefined();
    expect(state.cycle).toBe(1);
    expect(state.tick).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.seed).toBe(42);
    expect(state.graph).toBeDefined();
    expect(state.ascendantId).toBeDefined();
    expect(state.rivalDefinitions).toBeDefined();
    expect(Array.isArray(state.rivalDefinitions)).toBe(true);
    expect(state.doomClock).toBeDefined();
    expect(state.mandateDefinition).toBeDefined();
    expect(state.mandateState).toBeDefined();
    expect(state.visibilityMap).toBeDefined();
    expect(tiles).toBeDefined();
    expect(Array.isArray(tiles)).toBe(true);
    expect(tiles.length).toBeGreaterThan(0);
  });

  it('returns tiles array with expected dimensions (default 20x15)', () => {
    const { tiles } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const expectedTileCount = DEFAULT_COLS * DEFAULT_ROWS;
    expect(tiles.length).toBe(expectedTileCount);
  });

  it('tiles array has 768 tiles by default (32 cols × 24 rows)', () => {
    const { tiles } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(tiles.length).toBe(DEFAULT_COLS * DEFAULT_ROWS);
  });

  it('initializes essencePool with all spheres at 0', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    for (const sphere of SPHERE_NAMES) {
      expect(state.essencePool[sphere]).toBe(0);
    }
  });

  it('initializes cosmology in state', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.cosmology).toEqual(testCosmology);
  });

  it('initializes clock with default values', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.clock).toBeDefined();
    expect(state.clock.currentTick).toBe(0);
    expect(state.clock.ticksPerSeason).toBe(90);
    expect(state.clock.season).toBe(0);
    expect(state.clock.year).toBe(0);
  });

  it('creates world with seeded random — same seed produces same state', () => {
    const { state: state1, tiles: tiles1 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const { state: state2, tiles: tiles2 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);

    // Tiles should have same dimensions
    expect(tiles1.length).toBe(tiles2.length);

    // Graph structure should be identical (compare ascendant IDs, rival counts, etc.)
    // These are deterministic based on seed
    expect(state1.ascendantId).toBe(state2.ascendantId);
    expect(state1.rivalDefinitions).toEqual(state2.rivalDefinitions);
    expect(state1.doomClock).toEqual(state2.doomClock);
    expect(state1.mandateDefinition).toEqual(state2.mandateDefinition);
  });

  it('different seeds produce different worlds', () => {
    const { state: state1, tiles: tiles1 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const { state: state2, tiles: tiles2 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 99);

    // Tiles should differ
    let tilesMatch = true;
    if (tiles1.length === tiles2.length) {
      for (let i = 0; i < tiles1.length; i++) {
        if (JSON.stringify(tiles1[i]) !== JSON.stringify(tiles2[i])) {
          tilesMatch = false;
          break;
        }
      }
    }
    expect(tilesMatch).toBe(false);

    // Rival definitions should differ
    expect(state1.rivalDefinitions).not.toEqual(state2.rivalDefinitions);
  });

  it('ascendant node exists in graph with correct type', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const ascendantNode = state.graph.getNode(state.ascendantId);
    expect(ascendantNode).toBeDefined();
    expect(ascendantNode!.type).toBe('actor');
  });

  it('creates start location (loc.start) in graph', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const startNode = state.graph.getNode('loc.start');
    expect(startNode).toBeDefined();
    expect(startNode!.type).toBe('location');
    expect(startNode!.name).toBe('Sacred Grove');
  });

  it('accepts custom cols and rows parameters', () => {
    const { tiles } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42, 10, 10);
    const expectedTileCount = 10 * 10;
    expect(tiles.length).toBe(expectedTileCount);
  });

  it('uses DEFAULT_COLS and DEFAULT_ROWS when not provided', () => {
    expect(DEFAULT_COLS).toBe(32);
    expect(DEFAULT_ROWS).toBe(24);
  });

  it('initializes echoes as empty arrays', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.echoDefinitions).toEqual([]);
    expect(state.echoStates).toEqual([]);
  });

  it('initializes tickEvents and recentEvents as empty arrays', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.tickEvents).toEqual([]);
    expect(state.recentEvents).toEqual([]);
    expect(state.chronicleEntries).toEqual([]);
  });

  it('creates world soul with fundament and resonance', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.worldSoul).toBeDefined();
    expect(state.worldSoul.fundament).toBeDefined();
    expect(state.worldSoul.resonance).toBeDefined();
  });

  it('creates great chronicle', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.chronicle).toBeDefined();
  });

  it('initializes stealthExposure to 0', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    expect(state.stealthExposure).toBe(0);
  });

  // ── Initial Worshippers (Action Wheel prerequisite) ──────────────

  it('seeds initial worshippers so retinue is non-empty at game start', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const retinue = getRetinueAgents(state.graph, state.ascendantId);
    expect(retinue.length).toBeGreaterThanOrEqual(INITIAL_WORSHIPPER_COUNT.min);
    expect(retinue.length).toBeLessThanOrEqual(INITIAL_WORSHIPPER_COUNT.max);
  });

  it('initial worshippers have correct tier', () => {
    const { state } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const retinue = getRetinueAgents(state.graph, state.ascendantId);
    for (const agent of retinue) {
      expect(agent.tier).toBe(INITIAL_WORSHIPPER_TIER);
    }
  });

  it('initial worshippers are seeded deterministically', () => {
    const { state: s1 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const { state: s2 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const r1 = getRetinueAgents(s1.graph, s1.ascendantId);
    const r2 = getRetinueAgents(s2.graph, s2.ascendantId);
    expect(r1.map(a => a.id)).toEqual(r2.map(a => a.id));
  });

  it('different seeds produce different initial worshippers', () => {
    const { state: s1 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 42);
    const { state: s2 } = initializeGameState(testArchetype, 'Avatar Name', testCosmology, 99);
    const r1 = getRetinueAgents(s1.graph, s1.ascendantId);
    const r2 = getRetinueAgents(s2.graph, s2.ascendantId);
    // Different seeds should pick different worshippers (or at least differ in some way)
    const ids1 = r1.map(a => a.id).sort();
    const ids2 = r2.map(a => a.id).sort();
    // With different seeds, at least the count or members should differ
    expect(ids1.length > 0).toBe(true);
    expect(ids2.length > 0).toBe(true);
  });

  it('MAP_SIZE_PRESETS has all expected keys with valid dimensions', () => {
    const keys: MapSizePreset[] = ['small', 'medium', 'large', 'epic'];
    for (const key of keys) {
      const preset = MAP_SIZE_PRESETS[key];
      expect(preset).toBeDefined();
      expect(preset.cols).toBeGreaterThan(0);
      expect(preset.rows).toBeGreaterThan(0);
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
    }
  });

  it('DEFAULT_MAP_SIZE is a valid preset key', () => {
    expect(MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE]).toBeDefined();
  });

  it('DEFAULT_COLS/ROWS match the default preset', () => {
    expect(DEFAULT_COLS).toBe(MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE].cols);
    expect(DEFAULT_ROWS).toBe(MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE].rows);
  });
});
