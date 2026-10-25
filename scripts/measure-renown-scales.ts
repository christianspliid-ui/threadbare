/**
 * THR-1580 — power renown: which capability scale should the renown tier read?
 *
 * `phaseReputationTraits` gives every actor a `trait.reputation.power.renown` level
 * from its best tier across the eight reaches: tier ≥ 4 Noted, ≥ 6 Renowned, ≥ 8
 * Legendary (`computeTier(capability)` = ceil(capability × 10)). The tier read the
 * pre-refit curve (midpoint 10, k 0.4), which saturates at raw ~20. This script
 * measures, for every living actor, the renown level each scale would give, split by
 * actor type (individual / faction / monster) — and, for individuals, how many carry
 * a raw ≥ 20 best reach, where the pre-refit curve reads everyone as tier 10.
 *
 * Time: a few seconds per seed at --ticks 0 (world generation only); each tick adds ≈0.8 s
 *       per seed on medium.
 * Usage: npm run measure:renown-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import {
  computeRawScore,
  computeTier,
  SIGMOID_MIDPOINT,
  SIGMOID_K,
  PRE_REFIT_SIGMOID_MIDPOINT,
  PRE_REFIT_SIGMOID_K,
} from '../src/engine/domainCapability';
import { renownLevelFromTier } from '../src/engine/phaseReputationTraits';
import { rawToReachShare } from '../src/data/reach-share-constants';
import { REACH_DOMAINS } from '../src/types/traits';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '0', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

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
const SCALES: Record<string, (raw: number) => number> = {
  preRefit: (raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K),
  dice: (raw) => sigmoid(raw),
  reachShare: rawToReachShare,
};
const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1).padStart(5)}%`);
const q = (s: number[], p: number) => (s.length === 0 ? 'n/a' : s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1));

console.log(`THR-1580 power-renown scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);

for (const seed of SEEDS) {
  const graph = initState(seed).graph;
  const actors = graph.getNodesByType('actor').filter((n) => n.properties.deceased !== true);
  const byType = new Map<string, number[]>(); // actorType → best raw per actor
  for (const a of actors) {
    const best = Math.max(...REACH_DOMAINS.map((r) => computeRawScore(graph, a.id, r)));
    const type = String(a.properties.actorType ?? 'unknown');
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(Number.isFinite(best) ? best : 0);
  }
  console.log(`\nseed ${seed}: actors=${actors.length}`);
  for (const [type, bests] of [...byType.entries()].sort()) {
    const sorted = [...bests].sort((a, b) => a - b);
    const past20 = sorted.filter((v) => v >= 20).length;
    console.log(`  ${type.padEnd(10)} n=${String(sorted.length).padStart(4)}  best raw p10/p50/p90=${q(sorted, 0.1)}/${q(sorted, 0.5)}/${q(sorted, 0.9)}  (>=20: ${pct(past20, sorted.length)})`);
    const bands = [8, 12, 20, 28, 40, Infinity];
    const counts = bands.map((hi, i) => sorted.filter((v) => v >= (i === 0 ? -Infinity : bands[i - 1]) && v < hi).length);
    console.log(`    best raw  <8:${counts[0]}  8–12:${counts[1]}  12–20:${counts[2]}  20–28:${counts[3]}  28–40:${counts[4]}  ≥40:${counts[5]}`);
    for (const [name, curve] of Object.entries(SCALES)) {
      const levels = [0, 0, 0, 0];
      for (const raw of sorted) levels[renownLevelFromTier(computeTier(curve(raw)))]++;
      console.log(
        `    ${name.padEnd(10)} none=${pct(levels[0], sorted.length)}  Noted=${pct(levels[1], sorted.length)}  Renowned=${pct(levels[2], sorted.length)}  Legendary=${pct(levels[3], sorted.length)}`,
      );
    }
  }
}
