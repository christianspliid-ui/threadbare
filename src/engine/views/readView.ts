/**
 * readView — the one read path from the engine to a screen (THR-1822 § D3).
 *
 * A `ViewSelector` is a pure build from the world to a plain view model. `readView`
 * caches each built view model on the session's runtime, keyed on the runtime's
 * counters — `worldVersion` or `structuralCacheVersion`, never graph identity — and
 * hands back the same object while the entry is valid, so React's change detection
 * sees a change only when the world moved. A build that throws returns the
 * selector's typed fallback and traces `view_fallback` once per (selector, reason,
 * key) per session. A tick never reads a view model, so a view model can never take
 * the tick loop down.
 *
 * The cache lives on `SimulationRuntime.viewCache` (owned per session, never a
 * module singleton). With no runtime (tests, the style guide) every read builds
 * fresh and caches nothing — the rule `generateDetailPage` already follows.
 */
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types';
import type { SimulationRuntime } from '../simulationRuntime';
import { emitTrace } from '../traceBuffer';
import { buildViewContext, type ViewContext } from './viewContext';
import { VIEW_CACHE_MAX_ENTRIES } from './viewConstants';

/** Which runtime counter keys a selector's entries. */
export type ViewInvalidation = 'world' | 'structure';

export type ViewFallbackReason = 'missing_node' | 'kind_mismatch' | 'no_hex' | 'resolver_threw';

export interface ViewSelector<A, VM> {
  /** The registry id: `map.agents`, `hexContents`, `lens`, … */
  readonly id: string;
  readonly invalidation: ViewInvalidation;
  /** A stable, primitive cache key for these args. */
  key(args: A): string;
  /** Pure: reads the world, never writes it. */
  build(ctx: ViewContext, args: A): VM;
  /**
   * What the surface shows when `build` throws or its subject is gone. A total
   * constant constructor from its args — no graph read, no lookup.
   */
  fallback(args: A, reason: ViewFallbackReason): VM;
}

interface ViewCacheEntry {
  vm: unknown;
  /** The counter value the entry was built at. */
  builtAt: number;
  /** Monotonic read stamp — the lowest is evicted first. */
  lastRead: number;
}

export interface ViewSelectorStats {
  hits: number;
  misses: number;
  rebuilds: number;
  fallbacks: number;
}

export interface ViewCache {
  entries: Map<string, ViewCacheEntry>;
  /** `${selector}|${reason}|${key}` already traced this session. */
  fallbacksSeen: Set<string>;
  stats: Map<string, ViewSelectorStats>;
  readClock: number;
}

export function createViewCache(): ViewCache {
  return { entries: new Map(), fallbacksSeen: new Set(), stats: new Map(), readClock: 0 };
}

export function clearViewCache(cache: ViewCache): void {
  cache.entries.clear();
  cache.fallbacksSeen.clear();
  cache.stats.clear();
  cache.readClock = 0;
}

/** Shown by a host as nothing, when even a selector's fallback threw. */
export interface ViewUnavailable {
  unavailable: true;
}

function statsFor(cache: ViewCache, id: string): ViewSelectorStats {
  let s = cache.stats.get(id);
  if (!s) {
    s = { hits: 0, misses: 0, rebuilds: 0, fallbacks: 0 };
    cache.stats.set(id, s);
  }
  return s;
}

function counterFor(runtime: SimulationRuntime, invalidation: ViewInvalidation): number {
  return invalidation === 'world' ? runtime.worldVersion : runtime.structuralCacheVersion;
}

function evictOldest(cache: ViewCache): void {
  let oldestKey: string | null = null;
  let oldest = Infinity;
  for (const [k, e] of cache.entries) {
    if (e.lastRead < oldest) {
      oldest = e.lastRead;
      oldestKey = k;
    }
  }
  if (oldestKey !== null) cache.entries.delete(oldestKey);
}

/** The runtime's view cache, created on first use for a runtime built without one. */
function cacheOf(runtime: SimulationRuntime): ViewCache {
  if (!runtime.viewCache) runtime.viewCache = createViewCache();
  return runtime.viewCache;
}

function fallbackOf<A, VM>(
  sel: ViewSelector<A, VM>,
  args: A,
  key: string,
  reason: ViewFallbackReason,
  tick: number,
  cache: ViewCache | null,
  detail?: string,
): VM | ViewUnavailable {
  const seenKey = `${sel.id}|${reason}|${key}`;
  if (!cache || !cache.fallbacksSeen.has(seenKey)) {
    cache?.fallbacksSeen.add(seenKey);
    emitTrace({
      tick,
      category: 'view_fallback',
      selector: sel.id,
      key,
      reason,
      ...(detail ? { detail } : {}),
      summary: `view_fallback: ${sel.id} ${key} — ${reason}`,
    });
  }
  if (cache) statsFor(cache, sel.id).fallbacks++;
  try {
    return sel.fallback(args, reason);
  } catch {
    return { unavailable: true };
  }
}

/**
 * Read one view model. Identity-stable while the entry is valid — do not clone
 * what comes back.
 */
export function readView<A, VM>(
  runtime: SimulationRuntime | null,
  state: GameState,
  sel: ViewSelector<A, VM>,
  args: A,
  tiles: readonly HexTile[] = [],
): VM {
  let key: string;
  try {
    key = sel.key(args);
  } catch {
    key = '?';
  }
  const cache = runtime ? cacheOf(runtime) : null;
  const entryKey = `${sel.id}|${key}`;

  if (runtime && cache) {
    const builtAt = counterFor(runtime, sel.invalidation);
    const entry = cache.entries.get(entryKey);
    const stats = statsFor(cache, sel.id);
    if (entry && entry.builtAt === builtAt) {
      stats.hits++;
      entry.lastRead = ++cache.readClock;
      return entry.vm as VM;
    }
    if (entry) stats.rebuilds++;
    else stats.misses++;
  }

  const ctx = buildViewContext(runtime, state, tiles);
  let vm: VM;
  try {
    vm = sel.build(ctx, args);
  } catch (err) {
    // Not cached: the next read retries the build, but the trace fires once.
    return fallbackOf(sel, args, key, 'resolver_threw', state.tick, cache,
      err instanceof Error ? err.message : String(err)) as VM;
  }

  if (runtime && cache) {
    cache.entries.delete(entryKey);
    if (cache.entries.size >= VIEW_CACHE_MAX_ENTRIES) evictOldest(cache);
    cache.entries.set(entryKey, {
      vm,
      builtAt: counterFor(runtime, sel.invalidation),
      lastRead: ++cache.readClock,
    });
  }
  return vm;
}

/**
 * Drop every cached entry of one selector. For a host whose selector reads state
 * that moves without a counter bump (the Dominion projection's lens-opened
 * refresh) — never a substitute for `touchWorld` after a graph write.
 */
export function dropViewEntries(runtime: SimulationRuntime | null, selectorId: string): void {
  const cache = runtime?.viewCache;
  if (!cache) return;
  const prefix = `${selectorId}|`;
  for (const k of [...cache.entries.keys()]) {
    if (k.startsWith(prefix)) cache.entries.delete(k);
  }
}

export interface ViewCacheStatsVM {
  entries: number;
  maxEntries: number;
  bySelector: Record<string, ViewSelectorStats>;
}

export function viewCacheStats(runtime: SimulationRuntime | null): ViewCacheStatsVM {
  const cache = runtime?.viewCache;
  const bySelector: Record<string, ViewSelectorStats> = {};
  if (cache) {
    for (const [id, s] of [...cache.stats.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      bySelector[id] = { ...s };
    }
  }
  return { entries: cache?.entries.size ?? 0, maxEntries: VIEW_CACHE_MAX_ENTRIES, bySelector };
}
