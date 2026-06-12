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
import { clearRewardHistory } from './rewardHistory';
import type { BalanceTelemetry } from './balanceTelemetry';
import { createBalanceTelemetry } from './balanceTelemetry';
import { BALANCE_TARGETS_VERSION } from './balanceTargets';
import { emitTrace } from './traceBuffer';
import type { ForeshadowingResult } from '../types/foreshadowing';
import type { EligibilityFunnelCounters } from './kpi/gameplayKpi';
import { createEligibilityFunnelCounters } from './kpi/gameplayKpi';

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
  /** Total full-rebuild count this session. Exposed via debug bridge for profiling. */
  encounterCacheRebuildCount: number;

  // ── Balance Telemetry (phase 1 eval foundation) ──
  /** Session-owned balance telemetry. Owned here to prevent module-global bleed. */
  balanceTelemetry: BalanceTelemetry | null;
  /** Bumps on every balance event recorded. Allows UI/tooling memoization. */
  balanceTelemetryVersion: number;

  // ── Eligibility funnel counters (THR-457) ──
  /**
   * Per-template eligibility funnel counters accumulated by the filter pipeline and scoring hooks.
   * Null until `resetEligibilityFunnel()` is called or init overrides.
   * Initialized to active counters in `createSimulationRuntime()`.
   */
  eligibilityFunnel: EligibilityFunnelCounters | null;

  // ── Foreshadowing cache (THR-389) ──
  /**
   * Per-session cache of foreshadowing results keyed by
   * `${agentId}|${encounterId}|${intelVersion}|${interventionVersion}`.
   * Cleared by touchStructure() and resetRuntimeCaches().
   */
  foreshadowingCache: Map<string, ForeshadowingResult>;

  // ── Story-so-far Digest Cache (THR-455) ──
  /**
   * Per-session LRU cache of composed thread stories keyed by `${agentId}|${worldVersion}`.
   * Not cleared by touchStructure() — worldVersion keys auto-expire stale entries.
   */
  threadStoryCache: Map<string, import('../engine/threadDigest').ThreadStoryComposition>;
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
    encounterCacheRebuildCount: 0,
    balanceTelemetry: createBalanceTelemetry({ targetVersion: BALANCE_TARGETS_VERSION }),
    balanceTelemetryVersion: 0,
    eligibilityFunnel: createEligibilityFunnelCounters(0),
    foreshadowingCache: new Map(),
    threadStoryCache: new Map(),
  };
}

/**
 * Reset balance telemetry to a clean state, preserving tracked agent ids.
 * Call on game reset or cycle transition where stale telemetry would mislead evaluations.
 */
export function resetBalanceTelemetry(runtime: SimulationRuntime): void {
  const trackedIds = runtime.balanceTelemetry?.trackedAgentIds ?? [];
  const meta = runtime.balanceTelemetry?.meta;
  runtime.balanceTelemetry = createBalanceTelemetry({
    seed: meta?.seed,
    mapSize: meta?.mapSize,
    targetVersion: meta?.targetVersion ?? BALANCE_TARGETS_VERSION,
  });
  // Re-register tracked agents
  if (trackedIds.length > 0 && runtime.balanceTelemetry) {
    runtime.balanceTelemetry.trackedAgentIds = trackedIds;
    for (const id of trackedIds) {
      runtime.balanceTelemetry.trackedAgentEvents.set(id, []);
    }
  }
  runtime.balanceTelemetryVersion++;
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
  // Structural changes may invalidate agent encounter pools — clear foreshadowing cache.
  runtime.foreshadowingCache.clear();
}

// ─── Cache Management ─────────────────────────────────────────────

/**
 * Apply an incremental encounter-cache update without forcing a full rebuild
 * next tick. Bumps structuralCacheVersion (for UI memos and distance matrix)
 * and syncs encounterCacheBuiltAt so ensureEncounterCache reuses the cache.
 *
 * If the cache hasn't been built yet (null), the callback is skipped — the
 * lazy build path will produce a correct cache on demand.
 *
 * Fail-soft: if the callback throws, the cache is invalidated so the next
 * ensureEncounterCache triggers a full rebuild.
 */
export function applyEncounterCacheUpdate(
  runtime: SimulationRuntime,
  update: (cache: EncounterCacheManager) => void,
): void {
  const cache = runtime.encounterCache;
  if (cache) {
    try {
      update(cache);
    } catch (err) {
      console.warn(
        '[applyEncounterCacheUpdate] incremental update failed, falling back to full rebuild',
        err,
      );
      runtime.encounterCache = null;
      runtime.encounterCacheBuiltAt = -1;
    }
  }
  runtime.structuralCacheVersion++;
  runtime.worldVersion++;
  if (runtime.encounterCache) {
    runtime.encounterCacheBuiltAt = runtime.structuralCacheVersion;
  }
}

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
    const reason = !runtime.encounterCache ? 'initial' : 'structural_invalidation';
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    runtime.encounterCache = new EncounterCacheManager();
    const dangerMap = buildDangerMap(tiles);
    runtime.encounterCache.buildFullCache(graph, tick, dangerMap);
    runtime.encounterCacheBuiltAt = runtime.structuralCacheVersion;
    runtime.encounterCacheRebuildCount++;
    const durationMs = typeof performance !== 'undefined' ? performance.now() - t0 : undefined;
    emitTrace({
      category: 'encounter_cache_rebuild',
      tick,
      agentId: undefined,
      reason,
      locationCount: graph.getNodesByType('location').length + graph.getNodesByType('sublocation').length,
      totalRebuildsThisSession: runtime.encounterCacheRebuildCount,
      durationMs,
      summary: `encounter cache rebuilt (${reason}), rebuild #${runtime.encounterCacheRebuildCount}`,
    });
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
 * Does NOT reset balance telemetry — telemetry spans the full session by design.
 */
export function resetRuntimeCaches(runtime: SimulationRuntime): void {
  runtime.encounterCache = null;
  runtime.distanceMatrix = null;
  runtime.encounterCacheBuiltAt = -1;
  runtime.distanceMatrixBuiltAt = -1;
  runtime.foreshadowingCache.clear();
  clearTimelines();
  clearRewardHistory();
}
