/**
 * THR-1921 — one tick runs once, and a replayed tick names itself.
 *
 * `evt_141_10` ×25 in a browser run could only come from tick 141 running twice from a
 * stale state: the tick-event id format (`evt_${tick}_${n}`) is deterministic, so a second
 * pass over the same tick number re-mints the same ids. The ids are right to repeat (NFP #3);
 * what is wrong is the second pass, which also steps the in-place graph twice. These tests pin
 * the detection: the runtime records the last tick it ran on a graph, and a call that brings
 * the same graph object back at a tick it already ran emits one `tick_replayed` trace — and
 * still runs (fail-soft). The hook-side fix (the pass never happens) is pinned in
 * `src/components/Game/hooks/__tests__/doTickAdvancesRef.thr1921.test.tsx`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createSimulationRuntime } from '../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import type { GameState } from '../../types/gameState';

const SEED = 42;

function freshWorld(): GameState {
  const { cols, rows } = MAP_SIZE_PRESETS.small;
  return initializeGameState(
    generateArchetypes(4, SEED)[0],
    'replay',
    createBalancedCosmology(),
    SEED,
    cols,
    rows,
  ).state;
}

function replayTraces() {
  return getTraces().filter(t => t.category === 'tick_replayed') as unknown as Array<{
    tick: number;
    lastTick: number;
  }>;
}

describe('runTick names a replayed tick (THR-1921)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('starts with no record and records the tick it ran', () => {
    const runtime = createSimulationRuntime();
    expect(runtime.lastTickRun).toBeNull();
    const s0 = freshWorld();
    const s1 = runTick(s0, [], runtime);
    expect(s1.tick).toBe(s0.tick + 1);
    expect(runtime.lastTickRun).toEqual({ tick: s1.tick, graph: s0.graph });
  });

  it('a second pass from the same state is traced once, and still runs', () => {
    const runtime = createSimulationRuntime();
    const s0 = freshWorld();
    const first = runTick(s0, [], runtime);
    expect(replayTraces()).toHaveLength(0);

    const again = runTick(s0, [], runtime);
    const traces = replayTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].tick).toBe(s0.tick + 1);
    expect(traces[0].lastTick).toBe(first.tick);
    // Fail-soft: the replay is detected, never refused.
    expect(again.tick).toBe(first.tick);
    // The two passes mint from the same tick-scoped id space — the collision the browser saw.
    const prefix = `evt_${first.tick}_`;
    for (const e of [...first.tickEvents, ...again.tickEvents]) {
      if (/^evt_\d+_\d+$/.test(e.id)) expect(e.id.startsWith(prefix)).toBe(true);
    }
  });

  it('a straight run is never a replay', () => {
    const runtime = createSimulationRuntime();
    let s = freshWorld();
    for (let i = 0; i < 5; i++) s = runTick(s, [], runtime);
    expect(replayTraces()).toHaveLength(0);
  });

  it('a new world on the same runtime at a lower tick is not a replay', () => {
    const runtime = createSimulationRuntime();
    let s = freshWorld();
    for (let i = 0; i < 3; i++) s = runTick(s, [], runtime);
    // A new game (or a loaded save) carries a new graph object.
    const fresh = freshWorld();
    expect(fresh.graph).not.toBe(s.graph);
    expect(fresh.tick).toBeLessThan(s.tick);
    runTick(fresh, [], runtime);
    expect(replayTraces()).toHaveLength(0);
  });

  it('without a runtime nothing is detected or recorded (legacy callers)', () => {
    const s0 = freshWorld();
    runTick(s0, []);
    runTick(s0, []);
    expect(replayTraces()).toHaveLength(0);
  });
});
