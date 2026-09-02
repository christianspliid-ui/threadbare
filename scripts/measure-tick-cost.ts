/**
 * measure:tick-cost — engine cost per tick, report-only (THR-1385).
 *
 * The 200-tick small-map `debugTickBatch` case went 18 s → 45 s → 112 s over five
 * weeks and the only signal was hang-detector timeouts being raised. This probe is
 * the number that should have been read: ms/tick on the real
 * `initializeGameState → runTick` path, plus the phase breakdown that says *where*
 * the tick went, from the THR-580 profiling ring the tick loop already carries.
 *
 * It never asserts a wall-clock value (THR-1328: timing assertions measure GC
 * scheduling, not code) and it never fails — a trend someone reads, not a gate.
 *
 * Deterministic in everything but the clock (NFP #3): same seed, same map, same
 * tick count → same agent counts and the same phase *order*; only the milliseconds
 * move with the machine. Every knob is a named constant (NFP #1) with a flag.
 *
 *   npm run measure:tick-cost                       # human report
 *   npm run measure:tick-cost -- --json             # one JSON object on stdout
 *   npm run measure:tick-cost -- --ticks 100 --map medium --seed 99
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { enableProfiling, getTimingTraces, clearTimingTraces } from '../src/engine/traceBuffer';
import type { TickPhaseProfileTrace, TickProfileTrace } from '../src/types/trace';

// ─── Constants (NFP #1) ───────────────────────────────────────────

/** Seed of the reference world. 42 is the CLI default and the `debugTickBatch` case. */
export const TICK_COST_SEED = 42;
/** Map preset of the reference world — small, the shape of the case that regressed. */
export const TICK_COST_MAP: MapSizePreset = 'small';
/** Ticks run. 200 matches the `debugTickBatch` 200-tick case the ticket measured. */
export const TICK_COST_TICKS = 200;
/**
 * Ticks reported as the warm-up band. The first fifty ticks carry worldgen settling
 * (seeding top-ups, first encounters); the band after them is the steady-state number
 * a regression shows in.
 */
export const TICK_COST_WARMUP_TICKS = 50;
/** Phases named in the breakdown. */
export const TICK_COST_TOP_PHASES = 8;

// ─── Args ─────────────────────────────────────────────────────────

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const seed = parseInt(argValue('--seed') ?? String(TICK_COST_SEED), 10);
const map = (argValue('--map') ?? TICK_COST_MAP) as MapSizePreset;
const ticks = parseInt(argValue('--ticks') ?? String(TICK_COST_TICKS), 10);
const warmup = Math.min(parseInt(argValue('--warmup') ?? String(TICK_COST_WARMUP_TICKS), 10), ticks);
const json = process.argv.includes('--json');

// ─── Run ──────────────────────────────────────────────────────────

export interface TickCostReport {
  seed: number;
  map: MapSizePreset;
  ticks: number;
  warmupTicks: number;
  agentsAtStart: number;
  agentsAtEnd: number;
  /** Wall-clock over the whole run, worldgen excluded. */
  totalMs: number;
  msPerTickWarmup: number;
  msPerTickSteady: number;
  /** Cumulative ms per phase over the whole run, descending. */
  phases: { phase: string; totalMs: number; share: number; maxMs: number }[];
  /** ms of worldgen (`initializeGameState`), reported beside the run for scale. */
  worldgenMs: number;
  node: string;
  measuredAt: string;
}

function measure(): TickCostReport {
  const preset = MAP_SIZE_PRESETS[map];
  if (!preset) throw new Error(`unknown map preset: ${map}`);
  resetEventCounter();
  clearTimingTraces();
  enableProfiling();

  const archetype = generateArchetypes(4, seed)[0];
  const runtime = createSimulationRuntime();
  const wgStart = performance.now();
  let { state } = initializeGameState(archetype, 'tick-cost', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const worldgenMs = performance.now() - wgStart;
  const agentsAtStart = state.graph.getNodesByType('actor').length;

  const perPhase = new Map<string, { totalMs: number; maxMs: number }>();
  let warmupMs = 0;
  let steadyMs = 0;
  const runStart = performance.now();
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    // The timing ring holds 4000 entries and a tick emits ~65 — read and clear per
    // tick, or the first ticks fall off the end before the report.
    for (const t of getTimingTraces()) {
      if (t.category === 'tick_phase_profile') {
        const p = t as TickPhaseProfileTrace;
        const d = p.durationMs ?? 0;
        const acc = perPhase.get(p.phase) ?? { totalMs: 0, maxMs: 0 };
        acc.totalMs += d;
        if (d > acc.maxMs) acc.maxMs = d;
        perPhase.set(p.phase, acc);
      } else if (t.category === 'tick_profile') {
        const total = (t as TickProfileTrace).totalMs;
        if (i < warmup) warmupMs += total; else steadyMs += total;
      }
    }
    clearTimingTraces();
  }
  const totalMs = performance.now() - runStart;
  const agentsAtEnd = state.graph.getNodesByType('actor').length;

  const phaseTotal = [...perPhase.values()].reduce((s, v) => s + v.totalMs, 0) || 1;
  const phases = [...perPhase.entries()]
    .map(([phase, v]) => ({ phase, totalMs: v.totalMs, share: v.totalMs / phaseTotal, maxMs: v.maxMs }))
    .sort((a, b) => b.totalMs - a.totalMs);

  return {
    seed, map, ticks, warmupTicks: warmup,
    agentsAtStart, agentsAtEnd,
    totalMs,
    msPerTickWarmup: warmup > 0 ? warmupMs / warmup : 0,
    msPerTickSteady: ticks - warmup > 0 ? steadyMs / (ticks - warmup) : 0,
    phases,
    worldgenMs,
    node: process.version,
    measuredAt: new Date().toISOString(),
  };
}

const report = measure();

if (json) {
  console.log(JSON.stringify(report));
} else {
  const r = report;
  console.log(`tick cost — seed ${r.seed} · ${r.map} · ${r.ticks} ticks · node ${r.node}`);
  console.log(`  agents ${r.agentsAtStart} → ${r.agentsAtEnd} · worldgen ${(r.worldgenMs / 1000).toFixed(1)}s · run ${(r.totalMs / 1000).toFixed(1)}s`);
  console.log(`  ms/tick  warm-up (1–${r.warmupTicks}) ${r.msPerTickWarmup.toFixed(0)}   steady (${r.warmupTicks + 1}–${r.ticks}) ${r.msPerTickSteady.toFixed(0)}`);
  console.log(`  top ${TICK_COST_TOP_PHASES} phases by cumulative time:`);
  for (const p of r.phases.slice(0, TICK_COST_TOP_PHASES)) {
    console.log(`    ${p.phase.padEnd(34)} ${(p.totalMs / 1000).toFixed(1).padStart(6)}s  ${(p.share * 100).toFixed(1).padStart(5)}%  max ${p.maxMs.toFixed(0)}ms`);
  }
}
