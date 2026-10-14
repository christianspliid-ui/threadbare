/**
 * THR-1822 § D3 / § D17 — the read path's contract: identity while valid, rebuild
 * on the counter its entry is keyed to, fallback + one trace on a throw, bounded
 * cache, no cache without a runtime.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { createSimulationRuntime, touchWorld, touchStructure, resetRuntimeCaches } from '../../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import type { GameState } from '../../../types/gameState';
import { readView, dropViewEntries, viewCacheStats, type ViewSelector } from '../readView';
import { VIEW_CACHE_MAX_ENTRIES } from '../viewConstants';

function stateOf(graph = new WorldGraph()): GameState {
  return { graph, ascendantId: 'asc', tick: 7, unifiedActions: [], encounterProgress: [] } as unknown as GameState;
}

function counting(invalidation: 'world' | 'structure') {
  let builds = 0;
  const sel: ViewSelector<{ k: string }, { k: string; n: number }> = {
    id: `test.${invalidation}`,
    invalidation,
    key: (a) => a.k,
    fallback: (a) => ({ k: a.k, n: -1 }),
    build: (_ctx, a) => ({ k: a.k, n: ++builds }),
  };
  return { sel, builds: () => builds };
}

describe('readView', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('returns the same object while the entry is valid', () => {
    const runtime = createSimulationRuntime();
    const state = stateOf();
    const { sel, builds } = counting('world');
    const a = readView(runtime, state, sel, { k: 'x' });
    const b = readView(runtime, state, sel, { k: 'x' });
    expect(b).toBe(a);
    expect(builds()).toBe(1);
  });

  it('a worldVersion bump rebuilds a world-keyed entry and keeps a structure-keyed one', () => {
    const runtime = createSimulationRuntime();
    const state = stateOf();
    const world = counting('world');
    const structure = counting('structure');
    const w1 = readView(runtime, state, world.sel, { k: 'x' });
    const s1 = readView(runtime, state, structure.sel, { k: 'x' });
    touchWorld(runtime);
    const w2 = readView(runtime, state, world.sel, { k: 'x' });
    const s2 = readView(runtime, state, structure.sel, { k: 'x' });
    expect(w2).not.toBe(w1);
    expect(s2).toBe(s1);
    touchStructure(runtime);
    expect(readView(runtime, state, structure.sel, { k: 'x' })).not.toBe(s1);
  });

  it('different args are different entries', () => {
    const runtime = createSimulationRuntime();
    const { sel } = counting('world');
    const a = readView(runtime, stateOf(), sel, { k: 'a' });
    const b = readView(runtime, stateOf(), sel, { k: 'b' });
    expect(a).not.toBe(b);
    expect(a.k).toBe('a');
    expect(b.k).toBe('b');
  });

  it('a throwing build returns the fallback and traces view_fallback once per key', () => {
    const runtime = createSimulationRuntime();
    const sel: ViewSelector<{ k: string }, { k: string; n: number }> = {
      id: 'test.throws',
      invalidation: 'world',
      key: (a) => a.k,
      fallback: (a) => ({ k: a.k, n: -1 }),
      build: () => { throw new Error('boom'); },
    };
    const first = readView(runtime, stateOf(), sel, { k: 'x' });
    const second = readView(runtime, stateOf(), sel, { k: 'x' });
    expect(first).toEqual({ k: 'x', n: -1 });
    expect(second).toEqual({ k: 'x', n: -1 });
    const traces = getTraces().filter(t => t.category === 'view_fallback');
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ selector: 'test.throws', key: 'x', reason: 'resolver_threw', detail: 'boom', tick: 7 });
    expect(viewCacheStats(runtime).bySelector['test.throws'].fallbacks).toBe(2);
  });

  it('a fallback that itself throws comes back as the unavailable marker', () => {
    const sel: ViewSelector<void, unknown> = {
      id: 'test.fallbackThrows',
      invalidation: 'world',
      key: () => '',
      fallback: () => { throw new Error('no'); },
      build: () => { throw new Error('boom'); },
    };
    expect(readView(createSimulationRuntime(), stateOf(), sel, undefined)).toEqual({ unavailable: true });
  });

  it('eviction past VIEW_CACHE_MAX_ENTRIES keeps reads correct and the cache bounded', () => {
    const runtime = createSimulationRuntime();
    const { sel } = counting('world');
    const first = readView(runtime, stateOf(), sel, { k: 'k0' });
    for (let i = 1; i <= VIEW_CACHE_MAX_ENTRIES + 10; i++) readView(runtime, stateOf(), sel, { k: `k${i}` });
    expect(viewCacheStats(runtime).entries).toBe(VIEW_CACHE_MAX_ENTRIES);
    const again = readView(runtime, stateOf(), sel, { k: 'k0' });
    expect(again.k).toBe('k0');
    expect(again).not.toBe(first); // evicted and rebuilt, still correct
  });

  it('without a runtime every read builds fresh and nothing is cached', () => {
    const { sel, builds } = counting('world');
    readView(null, stateOf(), sel, { k: 'x' });
    readView(null, stateOf(), sel, { k: 'x' });
    expect(builds()).toBe(2);
  });

  it('dropViewEntries forces the next read of that selector to rebuild', () => {
    const runtime = createSimulationRuntime();
    const { sel } = counting('world');
    const a = readView(runtime, stateOf(), sel, { k: 'x' });
    dropViewEntries(runtime, sel.id);
    expect(readView(runtime, stateOf(), sel, { k: 'x' })).not.toBe(a);
  });

  it('resetRuntimeCaches empties the view cache', () => {
    const runtime = createSimulationRuntime();
    const { sel } = counting('world');
    readView(runtime, stateOf(), sel, { k: 'x' });
    expect(viewCacheStats(runtime).entries).toBe(1);
    resetRuntimeCaches(runtime);
    expect(viewCacheStats(runtime).entries).toBe(0);
  });

  it('a hand-built runtime without a viewCache gets one on first read', () => {
    const runtime = createSimulationRuntime();
    delete runtime.viewCache;
    const { sel } = counting('world');
    const a = readView(runtime, stateOf(), sel, { k: 'x' });
    expect(readView(runtime, stateOf(), sel, { k: 'x' })).toBe(a);
  });
});
