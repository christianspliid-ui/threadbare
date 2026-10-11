/**
 * THR-1580 — reputation walk: which capability scale should Shadow distortion and
 * Heart resistance read?
 *
 * `perceiveReputation` adds `shadow × SHADOW_DISTORTION_FACTOR` per intermediary on
 * the best indirect path and damps that by `1 − heart × HEART_TRUST_FACTOR` of the
 * source. Both multiplied the pre-refit curve (midpoint 10, k 0.4), which saturates
 * at raw ~20. This script measures, over every ordered pair of living individuals
 * with no direct `relates_to` edge but an indirect path, how far each scale moves the
 * perceived reputation from the capability-free walk (raw trust product + faction
 * rank), and how often that move changes the ally / neutral / enemy reading that
 * `agentSelection` takes at ±0.3.
 *
 * Usage: npm run measure:reputation-walk-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
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
import { perceiveReputation, REPUTATION_MAX_HOPS, type CapabilityReader } from '../src/engine/reputationWalk';
import { findAllPaths } from '../src/engine/graphUtils';
import type { WorldGraph } from '../src/engine/graph';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '0', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;
const ALLY = 0.3; // agentSelection's ally / enemy cut

function initState(seed: number) {
  resetEventCounter();
  const archetypes = generateArchetypes(4, seed);
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetypes[0], 'MeasureBot', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const runtime = createSimulationRuntime();
  for (let i = 0; i < TICKS; i++) state = runTick(state, [], runtime);
  return state;
}

const sigmoid = (x: number, mid = SIGMOID_MIDPOINT, k = SIGMOID_K) => 1 / (1 + Math.exp(-k * (x - mid)));
const onRaw = (f: (raw: number) => number): CapabilityReader =>
  (g: WorldGraph, id, d) => f(computeRawScore(g, id, d));
const SCALES: Record<string, CapabilityReader> = {
  preRefit: onRaw((raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K)),
  dice: onRaw((raw) => sigmoid(raw)),
  reachShare: onRaw(rawToReachShare),
};
const NONE: CapabilityReader = () => 0;

const band = (r: number) => (r > ALLY ? 1 : r < -ALLY ? -1 : 0);
const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1).padStart(5)}%`);
const q = (s: number[], p: number) => (s.length === 0 ? 'n/a' : s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(3));

console.log(`THR-1580 reputation-walk scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);

for (const seed of SEEDS) {
  const state = initState(seed);
  const graph = state.graph;
  const agents = graph.getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' && n.properties.deceased !== true)
    .map((n) => n.id);
  const sorted = (vals: number[]) => [...vals].sort((a, b) => a - b);
  const shadow = sorted(agents.map((id) => computeRawScore(graph, id, 'shadow')));
  const heart = sorted(agents.map((id) => computeRawScore(graph, id, 'heart')));
  console.log(`\nseed ${seed}: agents=${agents.length}  raw shadow p10/p50/p90=${q(shadow, 0.1)}/${q(shadow, 0.5)}/${q(shadow, 0.9)}  raw heart p10/p50/p90=${q(heart, 0.1)}/${q(heart, 0.5)}/${q(heart, 0.9)}`);

  const direct = new Set<string>();
  for (const e of graph.getEdgesByType('relates_to')) {
    direct.add(`${e.source}|${e.target}`);
    direct.add(`${e.target}|${e.source}`);
  }

  // Indirect pairs only — a direct edge returns its trust untouched by either reader.
  const pairs: Array<[string, string, number]> = [];
  for (const s of agents) {
    for (const t of agents) {
      if (s === t || direct.has(`${s}|${t}`)) continue;
      if (findAllPaths(graph, s, t, REPUTATION_MAX_HOPS, 'relates_to').length === 0) continue;
      pairs.push([s, t, perceiveReputation(graph, s, t, NONE)]);
    }
  }
  console.log(`  indirect pairs with a path=${pairs.length}`);
  // The agents the walk actually reads: everyone holding a relates_to edge.
  const walkers = agents.filter((id) => graph.getOutgoingEdges(id, 'relates_to').length + graph.getIncomingEdges(id, 'relates_to').length > 0);
  const wShadow = sorted(walkers.map((id) => computeRawScore(graph, id, 'shadow')));
  const wHeart = sorted(walkers.map((id) => computeRawScore(graph, id, 'heart')));
  const past = (s: number[]) => pct(s.filter((v) => v >= 20).length, s.length);
  console.log(`  walkers=${walkers.length}  raw shadow p10/p50/p90=${q(wShadow, 0.1)}/${q(wShadow, 0.5)}/${q(wShadow, 0.9)} (>=20: ${past(wShadow)})  raw heart p10/p50/p90=${q(wHeart, 0.1)}/${q(wHeart, 0.5)}/${q(wHeart, 0.9)} (>=20: ${past(wHeart)})`);
  for (const [name, reader] of Object.entries(SCALES)) {
    const shifts: number[] = [];
    let bandChanged = 0;
    for (const [s, t, base] of pairs) {
      const r = perceiveReputation(graph, s, t, reader);
      shifts.push(Math.abs(r - base));
      if (band(r) !== band(base)) bandChanged++;
    }
    const sh = sorted(shifts);
    const mean = shifts.reduce((a, b) => a + b, 0) / Math.max(1, shifts.length);
    console.log(
      `  ${name.padEnd(10)} |shift| mean=${mean.toFixed(3)} p50/p90/max=${q(sh, 0.5)}/${q(sh, 0.9)}/${q(sh, 1)}  band changed=${pct(bandChanged, pairs.length)}`,
    );
  }
}
