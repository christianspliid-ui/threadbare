/**
 * THR-689 — synchronous tick batch for the debug bridge.
 *
 * Automated browser tabs report `document.hidden`, which throttles the interval-driven
 * tick loop to roughly one tick per interaction. That makes any "run N ticks, then
 * observe X" browser check unreachable by construction — executors were forced to
 * substitute headless CLI sweeps, which exercise engine state but never the real UI
 * render path. This helper drives the same `runTick` pipeline the auto-play loop calls,
 * synchronously, so a debug caller can advance the sim without depending on the
 * browser's frame scheduling.
 *
 * React-free on purpose: `useSimulation` wraps it, and tests drive it directly.
 */
import { runTick } from './orchestrator';
import { emitTrace } from './traceBuffer';
import type { GameState } from '../types/gameState';
import type { TraceEntry } from '../types/trace';
import type { SimulationRuntime } from './simulationRuntime';
import type { HexCoord } from '../types';

/**
 * Upper bound on ticks a single batch call may run (NFP #1 — tunable).
 * Guards against a typo (`__DEBUG.tick(10000)`) locking the tab in a synchronous loop.
 * Requests above this are clamped, not rejected: the caller still gets a usable result
 * plus `capped: true`, rather than an error that leaves the sim untouched.
 */
export const DEBUG_TICK_MAX = 200;

/** Why the batch stopped before running every requested tick. */
export type DebugTickStopReason = 'completed' | 'capped' | 'phase_left_playing' | 'error';

export interface DebugTickBatchResult {
  /** Ticks actually advanced (may be < requested when capped or interrupted). */
  ticksRun: number;
  /** Tick counter after the batch. */
  tick: number;
  /** Wall-clock duration of the batch, milliseconds. */
  durationMs: number;
  /** What the caller asked for, before clamping. */
  requested: number;
  /** True when `requested` exceeded DEBUG_TICK_MAX and was clamped. */
  capped: boolean;
  stoppedReason: DebugTickStopReason;
  /** The advanced state — caller is responsible for committing it to React. */
  state: GameState;
  /** Set only when a tick threw; the batch returns partial progress rather than propagating. */
  error?: string;
}

/**
 * Advance `requested` ticks through the real tick pipeline, starting from `start`.
 *
 * Fail-soft (NFP #4): a throw inside `runTick` stops the batch and returns the ticks
 * that already succeeded, with `stoppedReason: 'error'`. The caller still gets a
 * committable state — a debug helper must never be the thing that crashes the loop.
 *
 * Emits exactly one aggregate trace per call, never one per tick: the ring buffer holds
 * 2000 entries, and a 200-tick per-tick burst would evict most of the run's real traces.
 */
export function runTickBatch(
  start: GameState,
  requested: number,
  runtime: SimulationRuntime,
  resolveTargets: (state: GameState) => HexCoord[],
): DebugTickBatchResult {
  const startedAt = performance.now();
  const normalized = Math.floor(requested);
  const capped = normalized > DEBUG_TICK_MAX;
  const count = Math.min(normalized, DEBUG_TICK_MAX);

  let current = start;
  let ticksRun = 0;
  let stoppedReason: DebugTickStopReason = capped ? 'capped' : 'completed';
  let error: string | undefined;

  for (let i = 0; i < count; i++) {
    if (current.phase !== 'playing') {
      stoppedReason = 'phase_left_playing';
      break;
    }
    try {
      current = runTick(current, resolveTargets(current), runtime);
      ticksRun++;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      stoppedReason = 'error';
      break;
    }
  }

  const durationMs = performance.now() - startedAt;

  emitTrace({
    category: 'debug_tick_batch',
    tick: current.tick,
    requested: normalized,
    ticksRun,
    capped,
    stoppedReason,
    durationMs,
    summary:
      `__DEBUG.tick: ran ${ticksRun}/${normalized} tick(s) to tick ${current.tick} ` +
      `in ${durationMs.toFixed(1)}ms (${stoppedReason})`,
  } as TraceEntry);

  return { ticksRun, tick: current.tick, durationMs, requested: normalized, capped, stoppedReason, state: current, error };
}
