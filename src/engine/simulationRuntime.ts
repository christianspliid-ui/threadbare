/**
 * SimulationRuntime — per-session mutation observability and cache ownership.
 *
 * TB-086: Version counters (`worldVersion`, `structuralCacheVersion`) track
 * graph mutations so React selectors and engine caches can invalidate correctly.
 * The graph is mutated in place — object identity never changes — so all
 * change detection must go through these counters.
 *
 * TB-087: Caches (encounter cache, distance matrix) live here instead of as
 * module-global singletons, preventing cross-session bleed.
 *
 * Version semantics:
 * - worldVersion: bumps on ANY mutation the UI cares about (property edits,
 *   agent movement, encounter state, etc.). Bumps nearly every tick during
 *   active simulation — that's intentional; memos gate paused/idle states.
 * - structuralCacheVersion: bumps when node/edge structure or content-scoring
 *   inputs change (node add/remove, edge add/remove, locationSubtype changes
 *   that affect encounter matching via getLocationType() fallback). Intentionally
 *   coarse for v1 — over-invalidates the distance matrix on subtype changes.
 *   Split into finer-grained versions only if profiling shows unnecessary
 *   rebuilds are costly.
 *
 * touchStructure() implies touchWorld() — structural changes are always
 * world-visible.
 */

import { EncounterCacheManager, buildDangerMap } from './encounterCache';
import { buildDistanceMatrix } from './distanceMatrix';
import type { DistanceMatrix } from './distanceMatrix';
import type { WorldGraph } from './graph';
import type { HexTile } from '../types';
import { clearTimelines } from './encounterTimeline';

// ─── Types ────────────────────────────────────────────────────────

export interface SimulationRuntime {
  /** Bumps on any graph mutation the UI/renderers care about. */
  worldVersion: number;
  /** Bumps when structural caches (distance matrix, encounter cache) need rebuild. */
  structuralCacheVersion: number;

  // ── Caches (lazy-rebuilt from versions) ──
  encounterCache: EncounterCacheManager | null;
  distanceMatrix: DistanceMatrix | null;
  /** structuralCacheVersion at which the encounter cache was last built/rebuilt. */
  encounterCacheBuiltAt: number;
  /** structuralCacheVersion at which the distance matrix was last built/rebuilt. */
  distanceMatrixBuiltAt: number;
}

// ─── Factory ──────────────────────────────────────────────────────

/** Create a fresh runtime for a new game session. */
export function createSimulationRuntime(): SimulationRuntime {
  return {
    worldVersion: 0,
    structuralCacheVersion: 0,
    encounterCache: null,
    distanceMatrix: null,
    encounterCacheBuiltAt: -1,
    distanceMatrixBuiltAt: -1,
  };
}

// ─── Touch API ────────────────────────────────────────────────────

/**
 * Mark that a world-visible mutation occurred (property edits, agent movement,
 * encounter state changes, etc.). UI selectors should depend on worldVersion.
 */
export function touchWorld(runtime: SimulationRuntime): void {
  runtime.worldVersion++;
}

/**
 * Mark that a structural mutation occurred (node/edge add/remove, locationSubtype
 * changes that affect encounter scoring). Implies touchWorld().
 * Structural caches (distance matrix, encounter cache) will lazily rebuild.
 */
export function touchStructure(runtime: SimulationRuntime): void {
  runtime.structuralCacheVersion++;
  runtime.worldVersion++;
}

// ─── Cache Management ─────────────────────────────────────────────

/**
 * Ensure the encounter cache is up-to-date. Rebuilds if structuralCacheVersion
 * has advanced since the last build.
 */
export function ensureEncounterCache(
  runtime: SimulationRuntime,
  graph: WorldGraph,
  tick: number,
  tiles: HexTile[],
): EncounterCacheManager {
  if (
    !runtime.encounterCache ||
    runtime.encounterCacheBuiltAt < runtime.structuralCacheVersion
  ) {
    runtime.encounterCache = new EncounterCacheManager();
    const dangerMap = buildDangerMap(tiles);
    runtime.encounterCache.buildFullCache(graph, tick, dangerMap);
    runtime.encounterCacheBuiltAt = runtime.structuralCacheVersion;
  }
  return runtime.encounterCache;
}

/**
 * Ensure the distance matrix is up-to-date. Rebuilds if structuralCacheVersion
 * has advanced since the last build.
 */
export function ensureDistanceMatrix(
  runtime: SimulationRuntime,
  graph: WorldGraph,
): DistanceMatrix {
  if (
    !runtime.distanceMatrix ||
    runtime.distanceMatrixBuiltAt < runtime.structuralCacheVersion
  ) {
    runtime.distanceMatrix = buildDistanceMatrix(graph);
    runtime.distanceMatrixBuiltAt = runtime.structuralCacheVersion;
  }
  return runtime.distanceMatrix;
}

/**
 * Reset all runtime caches and timelines (e.g. for cycle transitions).
 * Does NOT reset version counters — those monotonically increase within a session.
 */
export function resetRuntimeCaches(runtime: SimulationRuntime): void {
  runtime.encounterCache = null;
  runtime.distanceMatrix = null;
  runtime.encounterCacheBuiltAt = -1;
  runtime.distanceMatrixBuiltAt = -1;
  clearTimelines();
}
