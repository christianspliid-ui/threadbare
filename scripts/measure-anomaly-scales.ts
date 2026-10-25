/**
 * THR-1580 — anomaly discovery: which capability scale should the Eye gate and the Eye/Veil
 * pull in `encounterScoring.computeAnomalyDiscoveryBonus` read?
 *
 * The bonus is 0 unless Eye ≥ ANOMALY_EYE_THRESHOLD (0.15); past the gate it is
 * BASE + Eye × EYE_SCALING × 10 + Veil × VEIL_SCALING × 10 — an additive pull on every
 * candidate at an undiscovered anomaly location. It read the pre-refit curve (midpoint 10,
 * k 0.4), which puts the gate at raw ~5.7 and saturates the pull by raw ~18. This script
 * measures, for every living individual, what each scale would give: who clears the gate,
 * and the size of the pull among those who do. With `--ticks N` it also reports how many
 * anomaly locations exploration has discovered by then (run it on the tree before and after
 * the change for the behavioural before/after).
 *
 * Time: a few seconds per seed at --ticks 0 (world generation only); each tick adds ≈0.8 s
 *       per seed on medium.
 * Usage: npm run measure:anomaly-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
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
import {
  ANOMALY_DISCOVERY_BASE_BONUS,
  ANOMALY_EYE_SCALING,
  ANOMALY_VEIL_SCALING,
  ANOMALY_EYE_THRESHOLD,
} from '../src/data/agent-behavior-constants';

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
const q = (s: number[], p: number) => (s.length === 0 ? 'n/a' : s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2));

/** Smallest raw (0.5 steps, to 80) whose capability clears the gate. */
function gateRaw(curve: (raw: number) => number): number {
  for (let r = 0; r <= 80; r += 0.5) if (curve(r) >= ANOMALY_EYE_THRESHOLD) return r;
  return Infinity;
}

console.log(`THR-1580 anomaly discovery scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);

for (const seed of SEEDS) {
  const graph = initState(seed).graph;
  const people = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' && n.properties.deceased !== true);
  const anomalies = graph.getNodesByType('location').filter((n) => n.properties.isAnomalyLocation === true);
  const discovered = anomalies.filter((n) => n.properties.discoveredByExploration === true).length;

  const eyes: number[] = [];
  const veils: number[] = [];
  for (const p of people) {
    eyes.push(computeRawScore(graph, p.id, 'eye'));
    veils.push(computeRawScore(graph, p.id, 'veil'));
  }
  const sortedEye = [...eyes].sort((a, b) => a - b);

  console.log(`\nseed ${seed}: living individuals=${people.length}  anomaly locations=${anomalies.length} (discovered ${discovered})`);
  console.log(`  Eye raw p50/p90/p99 = ${q(sortedEye, 0.5)}/${q(sortedEye, 0.9)}/${q(sortedEye, 0.99)}`);

  for (const [name, curve] of Object.entries(SCALES)) {
    const bonuses: number[] = [];
    for (let i = 0; i < people.length; i++) {
      const eye = curve(eyes[i]);
      if (eye < ANOMALY_EYE_THRESHOLD) continue;
      const veil = curve(veils[i]);
      bonuses.push(ANOMALY_DISCOVERY_BASE_BONUS + eye * ANOMALY_EYE_SCALING * 10 + veil * ANOMALY_VEIL_SCALING * 10);
    }
    bonuses.sort((a, b) => a - b);
    console.log(
      `  ${name.padEnd(10)} gate raw>=${String(gateRaw(curve)).padStart(4)}  drawn=${pct(bonuses.length, people.length)}` +
        `  pull among drawn p10/p50/p90/max=${q(bonuses, 0.1)}/${q(bonuses, 0.5)}/${q(bonuses, 0.9)}/${q(bonuses, 1)}`,
    );
  }
}
