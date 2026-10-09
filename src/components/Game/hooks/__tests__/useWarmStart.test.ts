/**
 * THR-1744 — the warm start's parser and orchestration.
 *
 * The properties a later edit could break silently: the lever is honoured only on
 * `?view=game&seeded` and is clamped; and on every way the warm-up can end (normal,
 * a thrown chunk, a twilight stop) the end steps run — attention mode restored,
 * suppression cleared, the warm-up's moments settled — so the player is never left
 * behind the scrim and nothing is decided for them.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatWarmSeason,
  parseWarmStartTicks,
  runWarmStart,
  WARM_START_CHUNK_TICKS,
  WARM_START_MAX_TICKS,
  WARM_START_SETTLED_SPINE_BEATS,
  type AttentionMode,
  type WarmStartChunkResult,
  type WarmStartDeps,
} from '../useWarmStart';

describe('parseWarmStartTicks', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warn.mockRestore(); });

  it('is 0 and silent when the param is missing', () => {
    expect(parseWarmStartTicks('?view=game&seeded')).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it('reads a valid count on ?view=game&seeded', () => {
    expect(parseWarmStartTicks('?view=game&seeded&size=medium&warm=300')).toBe(300);
  });

  it('ignores non-numeric and < 1 values with one warning each', () => {
    expect(parseWarmStartTicks('?view=game&seeded&warm=abc')).toBe(0);
    expect(parseWarmStartTicks('?view=game&seeded&warm=0')).toBe(0);
    expect(parseWarmStartTicks('?view=game&seeded&warm=-5')).toBe(0);
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it('clamps to WARM_START_MAX_TICKS', () => {
    expect(parseWarmStartTicks('?view=game&seeded&warm=99999')).toBe(WARM_START_MAX_TICKS);
  });

  it('is ignored without ?view=game&seeded', () => {
    expect(parseWarmStartTicks('?warm=300')).toBe(0);
    expect(parseWarmStartTicks('?view=game&warm=300')).toBe(0);
    expect(parseWarmStartTicks('?view=game&firstunmet&warm=300')).toBe(0);
    expect(warn).toHaveBeenCalledTimes(3);
  });
});

describe('formatWarmSeason', () => {
  it('uses season words and a 1-based year, never a tick count', () => {
    expect(formatWarmSeason(0)).toBe('Spring, year 1');
    expect(formatWarmSeason(180)).toBe('Autumn, year 1');
    expect(formatWarmSeason(300)).toBe('Winter, year 1');
    expect(formatWarmSeason(360)).toBe('Spring, year 2');
  });
});

/** A fake world: a tick counter, a First thread mode, a suppression field, a moment queue. */
function fakeWorld(opts: {
  requested: number;
  initialMode?: AttentionMode | null;
  throwAtTick?: number;
  twilightAtTick?: number;
}) {
  const world = {
    tick: 0,
    mode: opts.initialMode === undefined ? 'pause' as AttentionMode | null : opts.initialMode,
    suppressedUntil: null as number | null,
    suppressionHistory: [] as Array<number | null>,
    settledSince: null as number | null,
    modesDuringRun: [] as Array<AttentionMode | null>,
    beatResolved: false,
  };
  const deps: WarmStartDeps = {
    requested: opts.requested,
    startTick: 0,
    yieldToBrowser: async () => {},
    runChunk: (n): WarmStartChunkResult => {
      world.modesDuringRun.push(world.mode);
      let ran = 0;
      for (let i = 0; i < n; i++) {
        if (opts.throwAtTick !== undefined && world.tick === opts.throwAtTick) {
          return { ticksRun: ran, tick: world.tick, stoppedReason: 'error', error: 'boom' };
        }
        if (opts.twilightAtTick !== undefined && world.tick === opts.twilightAtTick) {
          return { ticksRun: ran, tick: world.tick, stoppedReason: 'phase_left_playing' };
        }
        world.tick++;
        ran++;
      }
      return { ticksRun: ran, tick: world.tick, stoppedReason: 'completed' };
    },
    getFirstMode: () => world.mode,
    toggleFirstMode: () => {
      if (world.mode !== null) world.mode = world.mode === 'pause' ? 'auto_resolve' : 'pause';
    },
    setSuppressedUntil: t => { world.suppressedUntil = t; world.suppressionHistory.push(t); },
    settleMoments: since => { world.settledSince = since; return { settled: 2, pendingInterrupts: 0 }; },
  };
  return { world, deps };
}

describe('runWarmStart', () => {
  let err: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { err = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { err.mockRestore(); });

  it('normal end: advances the full request on Lives on, then restores, settles and clears', async () => {
    const { world, deps } = fakeWorld({ requested: 35 });
    const result = await runWarmStart(deps);
    expect(result.advanced).toBe(35);
    expect(result.stoppedEarly).toBeNull();
    expect(world.tick).toBe(35);
    // Suppression set to start + requested + 1 before the first chunk, cleared after.
    expect(world.suppressionHistory).toEqual([36, null]);
    // Every chunk ran with The First on Lives on; the mode is restored afterwards.
    expect(world.modesDuringRun.every(m => m === 'auto_resolve')).toBe(true);
    expect(world.mode).toBe('pause');
    expect(result.firstModeRestored).toBe('pause');
    // Chunked: ceil(35 / chunk) calls.
    expect(world.modesDuringRun.length).toBe(Math.ceil(35 / WARM_START_CHUNK_TICKS));
    expect(world.settledSince).toBe(0);
    expect(result.momentsSettled).toBe(2);
    expect(result.pendingInterruptsAtArrival).toBe(0);
  });

  it('a thrown chunk stops at the tick reached and still runs every end step', async () => {
    const { world, deps } = fakeWorld({ requested: 50, throwAtTick: 17 });
    const result = await runWarmStart(deps);
    expect(result.stoppedEarly).toBe('error');
    expect(result.advanced).toBe(17);
    expect(world.mode).toBe('pause');
    expect(world.suppressedUntil).toBeNull();
    expect(world.settledSince).toBe(0);
  });

  it('a runChunk that throws outright is caught the same way', async () => {
    const { world, deps } = fakeWorld({ requested: 50 });
    deps.runChunk = () => { throw new Error('kaboom'); };
    const result = await runWarmStart(deps);
    expect(result.stoppedEarly).toBe('error');
    expect(world.mode).toBe('pause');
    expect(world.suppressedUntil).toBeNull();
  });

  it('a twilight stop ends early with stoppedEarly: phase and still restores', async () => {
    const { world, deps } = fakeWorld({ requested: 50, twilightAtTick: 23 });
    const result = await runWarmStart(deps);
    expect(result.stoppedEarly).toBe('phase');
    expect(result.advanced).toBe(23);
    expect(world.mode).toBe('pause');
    expect(world.suppressedUntil).toBeNull();
  });

  it('a First already on Lives on is left on Lives on', async () => {
    const { world, deps } = fakeWorld({ requested: 10, initialMode: 'auto_resolve' });
    const result = await runWarmStart(deps);
    expect(world.mode).toBe('auto_resolve');
    expect(result.firstModeRestored).toBe('auto_resolve');
  });

  it('no First thread: warms anyway and reports the unchanged (null) mode', async () => {
    const { world, deps } = fakeWorld({ requested: 10, initialMode: null });
    const result = await runWarmStart(deps);
    expect(result.advanced).toBe(10);
    expect(world.mode).toBeNull();
    expect(result.firstModeRestored).toBeNull();
  });

  it('never resolves a pending decision — the warm-up has no path that could', async () => {
    // A beat pending at the start is still pending after: runWarmStart's deps expose
    // no resolve/dismiss call at all, so the only way to clear a beat is the player.
    const { world, deps } = fakeWorld({ requested: 20 });
    await runWarmStart(deps);
    expect(world.beatResolved).toBe(false);
    expect(Object.keys(deps)).not.toContain('dismissBeats');
  });
});

describe('runWarmStart — the opening gifts settle first (THR-1787)', () => {
  let err: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { err = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { err.mockRestore(); });

  it('lists the three no-choice gifts and never "A Path Opens"', () => {
    expect(WARM_START_SETTLED_SPINE_BEATS).toEqual([
      'beat.spine.the_seat',
      'beat.spine.thing_left_behind',
      'beat.spine.the_first_word',
    ]);
    expect(WARM_START_SETTLED_SPINE_BEATS).not.toContain('beat.spine.a_path_opens');
  });

  it('settles once, in order, before the first chunk and under suppression', async () => {
    const { world, deps } = fakeWorld({ requested: 5 });
    const calls: Array<{ ids: readonly string[]; tick: number; suppressed: number | null }> = [];
    const result = await runWarmStart({
      ...deps,
      settleOpening: ids => {
        calls.push({ ids, tick: world.tick, suppressed: world.suppressedUntil });
        return { settled: ['beat.spine.opening', ...ids], failedBeatId: null };
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].ids).toEqual(WARM_START_SETTLED_SPINE_BEATS);
    expect(calls[0].tick).toBe(0);
    expect(calls[0].suppressed).toBe(6);
    expect(result.openingSettled).toEqual(['beat.spine.opening', ...WARM_START_SETTLED_SPINE_BEATS]);
    expect(result.openingSettleFailed).toBeNull();
    expect(result.advanced).toBe(5);
  });

  it('a throwing settle is fail-soft: the warm-up still runs and every end step runs', async () => {
    const { world, deps } = fakeWorld({ requested: 4 });
    const result = await runWarmStart({
      ...deps,
      settleOpening: () => { throw new Error('boom'); },
    });
    expect(result.advanced).toBe(4);
    expect(result.stoppedEarly).toBeNull();
    expect(result.openingSettled).toEqual([]);
    expect(result.openingSettleFailed).toBe('beat.spine.the_seat');
    expect(world.suppressedUntil).toBeNull();
    expect(world.mode).toBe('pause');
  });

  it('without a settle dependency the step is skipped', async () => {
    const { deps } = fakeWorld({ requested: 2 });
    const result = await runWarmStart(deps);
    expect(result.openingSettled).toEqual([]);
    expect(result.openingSettleFailed).toBeNull();
  });
});
