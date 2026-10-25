/**
 * THR-1580 — encounter awareness: which capability scale should the per-reach hop count
 * in `encounterAwareness.filterByAwareness` read?
 *
 * Hops = 0 below AWARENESS_THRESHOLD (0.05), else BASE (1) + floor(capability / 0.15),
 * capped at MAX (5). Cross-hex encounters are visible when hex distance ≤ the best of the
 * entry's primary/secondary reach hops, so this reader shapes every agent's candidate pool.
 * It read the pre-refit curve (midpoint 10, k 0.4), which puts the 5-hop cap at raw ~11 and
 * so lets most seasoned people see the whole 5-hop disc in every reach. This script reports,
 * for every living individual, the hop counts each scale would give (per reach and for the
 * person's best reach). With `--ticks N` it also runs the live simulation and reports the
 * engagement idle rate — the mandatory candidate-pool check for this reader (run it on the
 * tree before and after the change for the behavioural before/after).
 *
 * Time: a few seconds per seed at --ticks 0 (world generation only); each tick adds ≈0.8 s
 *       per seed on medium.
 * Usage: npm run measure:awareness-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import {
  computeRawScore,
  SIGMOID_MIDPOINT,
  SIGMOID_K,
  PRE_REFIT_SIGMOID_MIDPOINT,
  PRE_REFIT_SIGMOID_K,
} from '../src/engine/domainCapability';
import { rawToReachShare } from '../src/data/reach-share-constants';
import { computeAwarenessHops } from '../src/engine/encounterAwareness';
import { computeEngagementKpiReport } from '../src/engine/kpi/engagementKpi';
import { REACH_DOMAINS } from '../src/types/traits';
import type { ReachDomain } from '../src/types/traits';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '0', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

function runState(seed: number) {
  resetEventCounter();
  const archetypes = generateArchetypes(4, seed);
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetypes[0], 'MeasureBot', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const runtime = createSimulationRuntime();
  for (let i = 0; i < TICKS; i++) state = runTick(state, [], runtime);
  return { state, runtime };
}

const sigmoid = (x: number, mid = SIGMOID_MIDPOINT, k = SIGMOID_K) => 1 / (1 + Math.exp(-k * (x - mid)));
const SCALES: Record<string, (raw: number) => number> = {
  preRefit: (raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K),
  dice: (raw) => sigmoid(raw),
  reachShare: rawToReachShare,
};
const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1).padStart(5)}%`);
const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

/** Smallest raw (0.5 steps, to 80) at which each hop count starts, on a curve. */
function hopRaws(curve: (raw: number) => number): string {
  const starts: string[] = [];
  let last = -1;
  for (let r = 0; r <= 80; r += 0.5) {
    const h = computeAwarenessHops(curve(r), 'eye');
    if (h !== last) { starts.push(`${h}@${r}`); last = h; }
  }
  return starts.join(' ');
}

const REACHES = REACH_DOMAINS as readonly ReachDomain[];

console.log(`THR-1580 encounter awareness scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);
for (const [name, curve] of Object.entries(SCALES)) console.log(`  ${name.padEnd(10)} hops start at raw: ${hopRaws(curve)}`);

for (const seed of SEEDS) {
  const { state, runtime } = runState(seed);
  const graph = state.graph;
  const people = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' && n.properties.deceased !== true);
  const raws = people.map((p) => REACHES.map((r) => computeRawScore(graph, p.id, r)));

  console.log(`\nseed ${seed}: living individuals=${people.length}`);
  for (const [name, curve] of Object.entries(SCALES)) {
    const perReach: number[] = [];
    const best: number[] = [];
    const bestHist = [0, 0, 0, 0, 0, 0];
    for (const row of raws) {
      const hops = row.map((raw) => computeAwarenessHops(curve(raw), 'eye'));
      perReach.push(...hops);
      const b = Math.max(...hops);
      best.push(b);
      bestHist[Math.min(5, b)]++;
    }
    const capped = perReach.filter((h) => h >= 5).length;
    const blind = perReach.filter((h) => h === 0).length;
    console.log(
      `  ${name.padEnd(10)} per-reach mean=${mean(perReach).toFixed(2)}  at cap=${pct(capped, perReach.length)}  own-hex only=${pct(blind, perReach.length)}` +
        `  best-reach mean=${mean(best).toFixed(2)}  best hist 0..5=${bestHist.map((c) => pct(c, people.length).trim()).join('/')}`,
    );
  }

  if (TICKS > 0 && runtime.engagementLedger) {
    const e = computeEngagementKpiReport(runtime.engagementLedger);
    console.log(
      `  live (tree as built): idle_rate=${pct(e.idleRate, 1)}  board decisions=${e.boardDecisions}  free-choice commits=${e.freeChoiceCommits}` +
        `  completed actions=${(state.unifiedActions ?? []).length}`,
    );
  }
}
