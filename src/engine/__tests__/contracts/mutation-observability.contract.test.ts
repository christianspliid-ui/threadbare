/**
 * Contract tests for mutation observability (TB-086).
 *
 * These tests verify the core invariant: every meaningful graph mutation
 * participates in the version system. If these tests break, UI selectors
 * and engine caches will silently serve stale data.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSimulationRuntime,
  touchWorld,
  touchStructure,
  ensureEncounterCache,
  ensureDistanceMatrix,
  resetRuntimeCaches,
  applyEncounterCacheUpdate,
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

// ─── applyEncounterCacheUpdate Contracts (THR-187) ──────────────────────────

describe('Mutation Observability — applyEncounterCacheUpdate Contracts', () => {
  it('invokes callback with built cache, bumps both versions, syncs encounterCacheBuiltAt', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();

    // Build cache first
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    const svBefore = runtime.structuralCacheVersion;
    const wvBefore = runtime.worldVersion;
    const cache = runtime.encounterCache;

    const fn = vi.fn();
    applyEncounterCacheUpdate(runtime, fn);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(cache);
    expect(runtime.structuralCacheVersion).toBe(svBefore + 1);
    expect(runtime.worldVersion).toBe(wvBefore + 1);
    expect(runtime.encounterCacheBuiltAt).toBe(runtime.structuralCacheVersion);
  });

  it('skips callback when cache is null, still bumps versions', () => {
    const runtime = createSimulationRuntime();
    expect(runtime.encounterCache).toBeNull();
    const svBefore = runtime.structuralCacheVersion;
    const wvBefore = runtime.worldVersion;

    const fn = vi.fn();
    applyEncounterCacheUpdate(runtime, fn);

    expect(fn).not.toHaveBeenCalled();
    expect(runtime.structuralCacheVersion).toBe(svBefore + 1);
    expect(runtime.worldVersion).toBe(wvBefore + 1);
    // encounterCacheBuiltAt should NOT be synced (cache is null)
    expect(runtime.encounterCacheBuiltAt).toBe(-1);
  });

  it('invalidates cache and logs warning when callback throws, still bumps versions', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const svBefore = runtime.structuralCacheVersion;

    applyEncounterCacheUpdate(runtime, () => { throw new Error('test error'); });

    expect(runtime.encounterCache).toBeNull();
    expect(runtime.encounterCacheBuiltAt).toBe(-1);
    expect(runtime.structuralCacheVersion).toBe(svBefore + 1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('after applyEncounterCacheUpdate on built cache, ensureEncounterCache does NOT rebuild', () => {
    const runtime = createSimulationRuntime();
    const { state } = createTestWorld();
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    const rebuildCountBefore = runtime.encounterCacheRebuildCount;

    applyEncounterCacheUpdate(runtime, () => { /* no-op incremental update */ });

    // Should NOT trigger another rebuild
    ensureEncounterCache(runtime, state.graph, state.tick, state.tiles);
    expect(runtime.encounterCacheRebuildCount).toBe(rebuildCountBefore);
  });
});
