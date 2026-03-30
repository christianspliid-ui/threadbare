/**
 * Contract tests for mutation observability (TB-086).
 *
 * These tests verify the core invariant: every meaningful graph mutation
 * participates in the version system. If these tests break, UI selectors
 * and engine caches will silently serve stale data.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSimulationRuntime,
  touchWorld,
  touchStructure,
  ensureEncounterCache,
  ensureDistanceMatrix,
  resetRuntimeCaches,
} from '../../simulationRuntime';
import type { SimulationRuntime } from '../../simulationRuntime';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';

// ─── Test Helpers ──────────────────────────────────────────────────

function createTestWorld() {
  const cosmology = createBalancedCosmology();
  const archetype = generateArchetypes(1, 42)[0];
  const { cols, rows } = MAP_SIZE_PRESETS['small'];
  resetDecisionCache();
  resetEventCounter();
  const { state, tiles } = initializeGameState(archetype, 'Test', cosmology, 42, cols, rows);
  return { state, tiles, cosmology, archetype };
}

// ─── Version Bump Contracts ────────────────────────────────────────

describe('Mutation Observability — Version Bump Contracts', () => {
  let runtime: SimulationRuntime;

  beforeEach(() => {
    runtime = createSimulationRuntime();
  });

  it('touchWorld() increments worldVersion but not structuralCacheVersion', () => {
    const wv = runtime.worldVersion;
    const sv = runtime.structuralCacheVersion;

    touchWorld(runtime);

    expect(runtime.worldVersion).toBe(wv + 1);
    expect(runtime.structuralCacheVersion).toBe(sv);
  });

  it('touchStructure() increments both versions', () => {
    const wv = runtime.worldVersion;
    const sv = runtime.structuralCacheVersion;

    touchStructure(runtime);

    expect(runtime.worldVersion).toBe(wv + 1);
    expect(runtime.structuralCacheVersion).toBe(sv + 1);
  });

  it('version counters monotonically increase across multiple touches', () => {
    touchWorld(runtime);
    touchWorld(runtime);
    touchStructure(runtime);
    touchWorld(runtime);

    expect(runtime.worldVersion).toBe(4);
    expect(runtime.structuralCacheVersion).toBe(1);
  });
});

// ─── Cache Invalidation Contracts ──────────────────────────────────

describe('Mutation Observability — Cache Invalidation Contracts', () => {
  it('ensureEncounterCache rebuilds when structuralCacheVersion advances', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();

    // First build
    const cache1 = ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    expect(cache1).toBeDefined();
    expect(runtime.encounterCacheBuiltAt).toBe(0);

    // Same version — should return same instance
    const cache2 = ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    expect(cache2).toBe(cache1);

    // Bump structural version → should rebuild
    touchStructure(runtime);
    const cache3 = ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    expect(cache3).not.toBe(cache1);
    expect(runtime.encounterCacheBuiltAt).toBe(runtime.structuralCacheVersion);
  });

  it('ensureDistanceMatrix rebuilds when structuralCacheVersion advances', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();

    // First build
    const matrix1 = ensureDistanceMatrix(runtime, state.graph);
    expect(matrix1).toBeDefined();
    expect(matrix1.locationCount).toBeGreaterThan(0);

    // Same version — should return same instance
    const matrix2 = ensureDistanceMatrix(runtime, state.graph);
    expect(matrix2).toBe(matrix1);

    // Bump structural version → should rebuild
    touchStructure(runtime);
    const matrix3 = ensureDistanceMatrix(runtime, state.graph);
    expect(matrix3).not.toBe(matrix1);
  });

  it('resetRuntimeCaches clears caches but preserves version counters', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();

    // Build caches and bump versions
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    ensureDistanceMatrix(runtime, state.graph);
    touchWorld(runtime);
    touchStructure(runtime);
    const wv = runtime.worldVersion;
    const sv = runtime.structuralCacheVersion;

    // Reset
    resetRuntimeCaches(runtime);

    // Caches cleared
    expect(runtime.encounterCache).toBeNull();
    expect(runtime.distanceMatrix).toBeNull();

    // Versions preserved
    expect(runtime.worldVersion).toBe(wv);
    expect(runtime.structuralCacheVersion).toBe(sv);
  });
});

// ─── runTick Integration Contract ──────────────────────────────────

describe('Mutation Observability — runTick Version Bumps', () => {
  it('runTick with runtime bumps worldVersion on every tick', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();
    const wvBefore = runtime.worldVersion;

    runTick(state, [], runtime);

    expect(runtime.worldVersion).toBeGreaterThan(wvBefore);
  });

  it('runTick lazily initializes caches via runtime', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();

    expect(runtime.encounterCache).toBeNull();
    expect(runtime.distanceMatrix).toBeNull();

    runTick(state, [], runtime);

    expect(runtime.encounterCache).not.toBeNull();
    expect(runtime.distanceMatrix).not.toBeNull();
  });

  it('runTick without runtime still works (backward compatibility)', () => {
    resetDecisionCache();
    resetEventCounter();
    const { state } = createTestWorld();

    // Should not throw — legacy path with module globals
    const next = runTick(state);
    expect(next.tick).toBe(state.tick + 1);
  });
});
