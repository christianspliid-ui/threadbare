/**
 * @vitest-environment jsdom
 *
 * THR-1921 — `doTick` advances the state ref before it commits.
 *
 * `doTick` read `gameStateRef.current`, which React refreshes only on render, and committed
 * with `setGameState(next)` without writing the ref. So a second tick in the same task — a
 * bunched interval firing twice, or `__DEBUG.tick(n)` right after an interval tick — ran the
 * same tick number again from the stale state. That replay stepped the in-place graph twice
 * and re-minted the tick's event ids (`evt_141_10` ×25 as duplicate React keys).
 *
 * Two `doTick()` calls inside one `act()` (no render between them) must move the clock by 2,
 * and the engine must see no replay. Red before the one-line fix: the clock moved by 1 and
 * one `tick_replayed` trace fired.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSimulation } from '../useSimulation';
import { createScryState } from '../../../../engine/scry';
import { createBalancedCosmology } from '../../../../engine/cosmology';
import { generateArchetypes } from '../../../../engine/ascendant';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../../../engine/traceBuffer';

const SEED = 42;
/**
 * World generation + ticks inside jsdom, tracing on: ~1–2 s locally, past vitest's 5 s
 * default on a CI shard (PR #2783 timed out both tests). A generous bound, not a perf budget.
 */
const WORLD_TEST_TIMEOUT_MS = 60_000;

describe('doTick never ticks from a stale state (THR-1921)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('two ticks before a render advance the clock by two, with no replay', () => {
    const { result } = renderHook(() =>
      useSimulation({
        archetype: generateArchetypes(4, SEED)[0],
        avatarName: 'replay',
        cosmology: createBalancedCosmology(),
        seed: SEED,
        scryState: createScryState(),
        mapSize: 'small',
      }),
    );
    expect(result.current.gameState.phase).toBe('playing');
    const start = result.current.gameState.tick;

    act(() => {
      result.current.doTick();
      result.current.doTick();
    });

    expect(result.current.gameState.tick).toBe(start + 2);
    expect(getTraces().filter(t => t.category === 'tick_replayed')).toHaveLength(0);
  }, WORLD_TEST_TIMEOUT_MS);

  it('a debug batch right after an interval tick starts from the advanced state', () => {
    const { result } = renderHook(() =>
      useSimulation({
        archetype: generateArchetypes(4, SEED)[0],
        avatarName: 'replay',
        cosmology: createBalancedCosmology(),
        seed: SEED,
        scryState: createScryState(),
        mapSize: 'small',
      }),
    );
    const start = result.current.gameState.tick;

    act(() => {
      result.current.doTick();
      result.current.runTicksSync(3);
    });

    expect(result.current.gameState.tick).toBe(start + 4);
    expect(getTraces().filter(t => t.category === 'tick_replayed')).toHaveLength(0);
  }, WORLD_TEST_TIMEOUT_MS);
});
