/**
 * The warm start — `?view=game&seeded&warm=<ticks>` (THR-1744).
 *
 * Plan: `Docs/plans/2026-10-05-thr-1744-warm-playtest.md` § Start state.
 *
 * A warm playtester arrives in a world that has already been running for a few
 * seasons, with The First bonded. Production has no `window.__DEBUG`, so the lever
 * is the URL alone: before the player gets control, the world is advanced through
 * the same `runTicksSync` → `runTickBatch` pipeline every live tick runs, in chunks,
 * behind `WarmStartOverlay`.
 *
 * What the warm-up never does is decide for the player. Beats, vignettes and
 * premonitions raised while it runs are held by the existing
 * `interruptSuppressedUntilTick`, not resolved; they wait, one at a time, once it
 * clears. The First runs on **Lives on** meanwhile, set and restored through the
 * attention toggle's own write path. Undertaking moments are interrupt-tier for a
 * followed mortal whatever the mode, so the survivors are re-tiered to unacknowledged
 * badges (`settleUndertakingMomentsAsBadges`) rather than popping at arrival.
 *
 * The orchestration is the pure-ish async `runWarmStart` (injected dependencies, so
 * a test can drive a normal end, a thrown chunk and a twilight stop without a world);
 * the hook only wires it to GameView.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { deriveSeasonAndYear, TICKS_PER_SEASON } from '../../../types/temporal';
import type { DebugTickStopReason } from '../../../engine/debugTickBatch';

// ── Constants (NFP #1) ──────────────────────────────────────────────────────

/** URL param name. */
export const WARM_START_PARAM = 'warm';
/** Clamp. 300 ticks measured at 93 s headless on seed 42; tick cost grows with population. */
export const WARM_START_MAX_TICKS = 600;
/** Ticks per `runTicksSync` call between yields — keeps the overlay repainting. */
export const WARM_START_CHUNK_TICKS = 3;
/** Decisions that may wait at arrival before the done line flags a pile-up. Never auto-resolved. */
export const WARM_START_MAX_ARRIVAL_DECISIONS = 1;
/** Re-tier the warm-up's interrupt-tier undertaking moments to badges at the end. */
export const WARM_START_SETTLE_MOMENTS = true;
/**
 * How long after the arrival render the done line waits before reading the registry.
 * Some held decisions open one render after suppression clears (a spine beat enters
 * from an effect), so reading on the arrival render itself undercounts them.
 */
export const WARM_START_ARRIVAL_SETTLE_MS = 500;
/** The console marker `scripts/cold-playtest/extract.mjs` looks for. */
export const WARM_START_LOG_MARKER = '[warm-start] done';

export type AttentionMode = 'pause' | 'auto_resolve';

// ── URL parsing ─────────────────────────────────────────────────────────────

/**
 * Read `?warm=<ticks>`. Returns the clamped tick count, or 0 when the lever is
 * absent or ignored. Honoured only with `?view=game&seeded` — there is no bonded
 * First to warm without it. An ignored value logs one `console.warn` (fail-soft).
 */
export function parseWarmStartTicks(search: string): number {
  const params = new URLSearchParams(search);
  if (!params.has(WARM_START_PARAM)) return 0;
  const raw = params.get(WARM_START_PARAM) ?? '';
  if (params.get('view') !== 'game' || !params.has('seeded')) {
    console.warn(`[warm-start] ignored: ?${WARM_START_PARAM}=${raw} needs ?view=game&seeded`);
    return 0;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    console.warn(`[warm-start] ignored: ?${WARM_START_PARAM}=${raw} is not a tick count >= 1`);
    return 0;
  }
  return Math.min(Math.floor(n), WARM_START_MAX_TICKS);
}

// ── Season words (Law 13: never a tick count) ───────────────────────────────

const SEASON_WORDS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

/** "Autumn, year 1" — the top bar's season and year, through the one calendar conversion. */
export function formatWarmSeason(tick: number, ticksPerSeason: number = TICKS_PER_SEASON): string {
  const { season, year } = deriveSeasonAndYear(tick, ticksPerSeason);
  return `${SEASON_WORDS[season] ?? 'Spring'}, year ${year + 1}`;
}

// ── Orchestration ───────────────────────────────────────────────────────────

export interface WarmStartChunkResult {
  ticksRun: number;
  tick: number;
  stoppedReason: DebugTickStopReason;
  error?: string;
}

export interface WarmStartDeps {
  /** Ticks to advance, already clamped. */
  requested: number;
  startTick: number;
  chunkTicks?: number;
  runChunk: (n: number) => WarmStartChunkResult;
  /** The First's current attention mode, or null when there is no First thread. */
  getFirstMode: () => AttentionMode | null;
  /** Flip The First's mode through the toggle's own write path. */
  toggleFirstMode: () => void;
  setSuppressedUntil: (tick: number | null) => void;
  /** Re-tier the warm-up's moments; returns how many changed and how many interrupts remain. */
  settleMoments: (sinceTick: number) => { settled: number; pendingInterrupts: number };
  onProgress?: (tick: number) => void;
  yieldToBrowser?: () => Promise<void>;
  now?: () => number;
}

export interface WarmStartResult {
  requested: number;
  advanced: number;
  stoppedEarly: null | 'phase' | 'error';
  ms: number;
  firstModeRestored: AttentionMode | null;
  momentsSettled: number;
  pendingInterruptsAtArrival: number;
}

const defaultYield = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/**
 * Run the warm-up. Never throws: a thrown chunk stops it at the tick reached, and the
 * end steps (settle, restore, clear suppression) always run, so the game is never left
 * blocked behind the scrim (fail-soft).
 */
export async function runWarmStart(deps: WarmStartDeps): Promise<WarmStartResult> {
  const now = deps.now ?? (() => Date.now());
  const yieldToBrowser = deps.yieldToBrowser ?? defaultYield;
  const chunk = Math.max(1, deps.chunkTicks ?? WARM_START_CHUNK_TICKS);
  const t0 = now();

  let advanced = 0;
  let stoppedEarly: WarmStartResult['stoppedEarly'] = null;
  let previousMode: AttentionMode | null = null;

  try {
    // Suppression first, using the clamped request, so nothing raised on the first
    // chunk can open. `+ 1` covers the arrival tick itself.
    deps.setSuppressedUntil(deps.startTick + deps.requested + 1);
    previousMode = deps.getFirstMode();
    if (previousMode === 'pause') deps.toggleFirstMode();

    while (advanced < deps.requested) {
      const n = Math.min(chunk, deps.requested - advanced);
      const result = deps.runChunk(n);
      advanced += result.ticksRun;
      deps.onProgress?.(result.tick);
      if (result.stoppedReason === 'error') {
        stoppedEarly = 'error';
        console.error('[warm-start] a chunk threw; stopping at the tick reached', result.error);
        break;
      }
      if (result.stoppedReason === 'phase_left_playing') { stoppedEarly = 'phase'; break; }
      if (result.ticksRun === 0) { stoppedEarly = 'phase'; break; }
      await yieldToBrowser();
    }
  } catch (err) {
    stoppedEarly = 'error';
    console.error('[warm-start] warm-up threw; stopping at the tick reached', err);
  }

  // ── End steps: always run ──
  let momentsSettled = 0;
  let pendingInterruptsAtArrival = 0;
  try {
    if (WARM_START_SETTLE_MOMENTS) {
      const settled = deps.settleMoments(deps.startTick);
      momentsSettled = settled.settled;
      pendingInterruptsAtArrival = settled.pendingInterrupts;
    }
  } catch (err) {
    console.error('[warm-start] settling moments failed', err);
  }
  let firstModeRestored: AttentionMode | null = previousMode;
  try {
    const current = deps.getFirstMode();
    if (previousMode !== null && current !== null && current !== previousMode) deps.toggleFirstMode();
    firstModeRestored = deps.getFirstMode() ?? previousMode;
  } catch (err) {
    console.error('[warm-start] restoring the attention mode failed', err);
  }
  try {
    deps.setSuppressedUntil(null);
  } catch (err) {
    console.error('[warm-start] clearing suppression failed', err);
  }

  return {
    requested: deps.requested,
    advanced,
    stoppedEarly,
    ms: Math.round(now() - t0),
    firstModeRestored,
    momentsSettled,
    pendingInterruptsAtArrival,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────

export interface WarmStartProgress {
  startTick: number;
  targetTick: number;
  currentTick: number;
}

export interface UseWarmStartArgs {
  /** Clamped tick count from `parseWarmStartTicks`; 0 disables the hook. */
  requested: number;
  /** The world is in `playing` and ready to tick. */
  ready: boolean;
  startTick: number;
  runChunk: WarmStartDeps['runChunk'];
  getFirstMode: WarmStartDeps['getFirstMode'];
  toggleFirstMode: WarmStartDeps['toggleFirstMode'];
  setSuppressedUntil: WarmStartDeps['setSuppressedUntil'];
  settleMoments: WarmStartDeps['settleMoments'];
  /** Interrupt surfaces open once suppression clears — read after the arrival render. */
  getOpenInterrupts: () => string[];
}

export interface UseWarmStartResult {
  running: boolean;
  progress: WarmStartProgress | null;
}

export function useWarmStart(args: UseWarmStartArgs): UseWarmStartResult {
  // Latest callbacks, read across awaits (the closures GameView passes change per render).
  const argsRef = useRef(args);
  argsRef.current = args;

  const startedRef = useRef(false);
  const [running, setRunningState] = useState(false);
  const [progress, setProgress] = useState<WarmStartProgress | null>(null);
  const [arrival, setArrival] = useState<WarmStartResult | null>(null);

  const start = useCallback(async () => {
    const a = argsRef.current;
    const startTick = a.startTick;
    setRunningState(true);
    setProgress({ startTick, targetTick: startTick + a.requested, currentTick: startTick });
    // Let the overlay paint before the first chunk.
    await defaultYield();
    const result = await runWarmStart({
      requested: a.requested,
      startTick,
      runChunk: n => argsRef.current.runChunk(n),
      getFirstMode: () => argsRef.current.getFirstMode(),
      toggleFirstMode: () => argsRef.current.toggleFirstMode(),
      setSuppressedUntil: t => argsRef.current.setSuppressedUntil(t),
      settleMoments: since => argsRef.current.settleMoments(since),
      onProgress: tick => setProgress(p => (p ? { ...p, currentTick: tick } : p)),
    });
    setArrival(result);
    setRunningState(false);
  }, []);

  useEffect(() => {
    if (startedRef.current || args.requested <= 0 || !args.ready) return;
    startedRef.current = true;
    void start();
  }, [args.requested, args.ready, start]);

  // The done line is written after the arrival render, so `openInterruptsAtArrival`
  // reads the registry with the overlay closed and suppression cleared.
  useEffect(() => {
    if (!arrival || running) return;
    const timer = setTimeout(() => {
      let openInterruptsAtArrival: string[] = [];
      try {
        openInterruptsAtArrival = argsRef.current.getOpenInterrupts().filter(id => id !== 'WarmStartOverlay');
      } catch { /* fail-soft: an unreadable registry logs an empty list */ }
      const line = { ...arrival, openInterruptsAtArrival };
      console.info(`${WARM_START_LOG_MARKER} ${JSON.stringify(line)}`);
      if (openInterruptsAtArrival.length > WARM_START_MAX_ARRIVAL_DECISIONS) {
        console.warn(`[warm-start] ${openInterruptsAtArrival.length} decisions wait at arrival (> ${WARM_START_MAX_ARRIVAL_DECISIONS})`);
      }
      setArrival(null);
    }, WARM_START_ARRIVAL_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [arrival, running]);

  return { running, progress };
}
