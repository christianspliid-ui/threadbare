/**
 * THR-1952 (mortal wealth S2) — the plan's S2 Done-when predicates, measured on a
 * real seeded world. Plan: Docs/plans/2026-10-15-thr-1936-mortal-wealth.md § Done when, S2.
 *
 * One run per seed (default seed 42, medium map, 600 ticks) reports:
 *   - paying work's share of poor deciders' board wins (want ≥ 5%; ~1% before S2);
 *   - the Destitute share of deciders at t0 and at the end (within 10 points);
 *   - the median decider Means at the end (between Getting by and Comfortable);
 *   - the mean forecast of free-choice engagements (compare against main: within 2 points);
 *   - the comfort pace: median ticks for a decider who starts Getting by to reach
 *     Comfortable. `MEANS_CELL_COST_ENABLED` may be switched on only when this median
 *     is at most `MEANS_COMFORT_PACE_TARGET_TICKS` (120) **and** the founding-starvation
 *     floor holds on every gate seed with the patron on (THR-2008): this script reads the
 *     last `npm run measure:founding-starvation` verdict from
 *     .cache/founding-starvation-verdict.json; a missing verdict, or one built from code
 *     that has changed since, counts as not met.
 *
 * Usage: npm run measure:means [-- --seeds 42 --ticks 600 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { isAutonomousDecisionActor } from '../src/engine/decisionTier';
import { getAvatarsOf } from '../src/engine/graphQueries';
import { getWealthTier, readWealth, WEALTH_TIER_COMFORTABLE, WEALTH_TIER_GETTING_BY } from '../src/engine/wealth';
import type { WorldGraph } from '../src/engine/graph';
import { existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import {
  MEANS_CELL_COST_ENABLED,
  MEANS_COMFORT_PACE_TARGET_TICKS,
} from '../src/data/mortal-means-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;

/** THR-2008 — the second predicate: the last founding-starvation verdict, or null when none was measured. */
function foundingFloorVerdict(): boolean | null {
  const path = '.cache/founding-starvation-verdict.json';
  try {
    if (!existsSync(path)) return null;
    const v = JSON.parse(readFileSync(path, 'utf8')) as { pass?: unknown; gateConfig?: unknown; head?: unknown; dirty?: unknown };
    // Only a 600-tick medium-map verdict counts: a short run passes the floor trivially.
    if (v.gateConfig !== true) return null;
    // Only a verdict whose bundles were built from a clean commit, with nothing in src/ or
    // scripts/ changed since (committed or not): a code change after the build voids it.
    if (typeof v.head !== 'string' || v.dirty !== false) return null;
    const changedSince = execFileSync('git', ['diff', '--name-only', v.head, '--', 'src', 'scripts'], { encoding: 'utf8' }).trim();
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'src', 'scripts'], { encoding: 'utf8' }).trim();
    if (changedSince !== '' || untracked !== '') return null;
    return typeof v.pass === 'boolean' ? v.pass : null;
  } catch {
    return null;
  }
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function deciderWealth(graph: WorldGraph, avatarIds: ReadonlySet<string>): Map<string, number> {
  const out = new Map<string, number>();
  for (const node of graph.getNodesByType('actor')) {
    if (avatarIds.has(node.id) || !isAutonomousDecisionActor(node)) continue;
    out.set(node.id, readWealth(node.properties as Record<string, unknown>));
  }
  return out;
}

function destituteShare(wealth: Map<string, number>): number {
  if (wealth.size === 0) return 0;
  let n = 0;
  for (const w of wealth.values()) if (getWealthTier(w) === 'Destitute') n++;
  return n / wealth.size;
}

interface BoardTrace {
  category: string;
  boardFamily?: string;
  boardTop?: Array<{ meansMultiplier?: number }>;
  meansWant?: { wealth: number };
}

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

for (const seed of SEEDS) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[MAP];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Reach', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const avatarIds = new Set(getAvatarsOf(state.graph, state.ascendantId).map(a => a.id));

  const start = deciderWealth(state.graph, avatarIds);
  const destituteT0 = destituteShare(start);
  const gettingBy = [...start].filter(([, w]) => w >= WEALTH_TIER_GETTING_BY && w < WEALTH_TIER_COMFORTABLE).map(([id]) => id);
  const reachedComfort = new Map<string, number>();

  let poorWins = 0;
  let poorPaying = 0;
  let allWins = 0;
  let allPaying = 0;

  for (let t = 1; t <= TICKS; t++) {
    state = runTick(state, [], runtime);
    for (const tr of getTraces() as ReadonlyArray<BoardTrace>) {
      if (tr.category !== 'decision_board_comparison' || !tr.boardFamily || tr.boardFamily === 'idle') continue;
      const paying = tr.boardTop?.[0]?.meansMultiplier !== undefined;
      allWins++;
      if (paying) allPaying++;
      if (tr.meansWant && tr.meansWant.wealth < WEALTH_TIER_GETTING_BY) {
        poorWins++;
        if (paying) poorPaying++;
      }
    }
    clearTraces();
    for (const id of gettingBy) {
      if (reachedComfort.has(id)) continue;
      const node = state.graph.getNode(id);
      if (node && readWealth(node.properties as Record<string, unknown>) >= WEALTH_TIER_COMFORTABLE) reachedComfort.set(id, t);
    }
  }
  disableTracing();

  const end = deciderWealth(state.graph, avatarIds);
  const destituteEnd = destituteShare(end);
  const medianEnd = median([...end.values()]);
  const forecasts = runtime.engagementLedger.log.filter(e => e.freeChoice).map(e => e.forecast);
  const meanForecast = forecasts.length ? forecasts.reduce((a, b) => a + b, 0) / forecasts.length : null;
  const pace = median([...reachedComfort.values()]);

  const payingShare = poorWins > 0 ? poorPaying / poorWins : 0;
  const paceOk = pace !== null && pace <= MEANS_COMFORT_PACE_TARGET_TICKS;
  const floorOk = foundingFloorVerdict();
  const drift = destituteEnd - destituteT0;
  const lines = [
    `seed ${seed} · ${MAP} · ${TICKS} ticks · deciders ${start.size} → ${end.size}`,
    `  paying work, poor deciders' board wins: ${poorPaying} / ${poorWins} = ${pct(payingShare)}  (want ≥ 5%) ${payingShare >= 0.05 ? 'PASS' : 'FAIL'}`,
    `  paying work, all deciders' board wins:  ${allPaying} / ${allWins} = ${pct(allWins ? allPaying / allWins : 0)}`,
    `  Destitute share: t0 ${pct(destituteT0)} → t${TICKS} ${pct(destituteEnd)}  (drift ${(100 * drift).toFixed(1)} pts, want ≤ 10) ${drift <= 0.10 ? 'PASS' : 'FAIL'}`,
    `  median decider Means at t${TICKS}: ${medianEnd?.toFixed(1) ?? '—'} (${medianEnd === null ? '—' : getWealthTier(medianEnd)}; want Getting by … Comfortable) ${medianEnd !== null && medianEnd >= WEALTH_TIER_GETTING_BY && medianEnd < 60 ? 'PASS' : 'FAIL'}`,
    `  mean forecast of free-choice engagements: ${meanForecast === null ? '—' : (100 * meanForecast).toFixed(2)} over ${forecasts.length} (compare against main: within 2 points)`,
    `  comfort pace: ${reachedComfort.size} of ${gettingBy.length} Getting-by deciders reached Comfortable; median ${pace ?? '—'} ticks (target ≤ ${MEANS_COMFORT_PACE_TARGET_TICKS}) ${paceOk ? 'PASS' : 'FAIL'}`,
    `  founding-starvation floor (patron on, gate seeds): ${floorOk === null ? 'not measured on this code — run npm run measure:founding-starvation' : floorOk ? 'PASS' : 'FAIL'}`,
    `  → founding costs ${paceOk && floorOk === true ? 'MAY switch on' : 'stay off'} (both predicates required; MEANS_CELL_COST_ENABLED = ${MEANS_CELL_COST_ENABLED})`,
  ];
  console.log(lines.join('\n'));
}
