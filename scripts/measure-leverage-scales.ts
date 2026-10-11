/**
 * THR-1580 — social leverage: which capability scale should the wealth and power
 * comparisons read?
 *
 * `computeInitialLeverage` compares actor vs target Gold (ratio) and Iron (gap).
 * It read the pre-refit curve (midpoint 10, k 0.4), which saturates at raw ~20, so
 * two seasoned agents both read ~1.0 and neither bonus can fire between them. This
 * script measures, over every ordered pair of agents on a generated world, how often
 * each bonus fires on three scales: pre-refit, the dice curve, and the reach share.
 *
 * Usage: npm run measure:leverage-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
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
import { LEVERAGE_WEALTH_RATIO, LEVERAGE_POWER_GAP } from '../src/engine/socialLeverage';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const TICKS = parseInt(argValue('--ticks') ?? '0', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

// The pre-THR-1580 thresholds, frozen here so the "before" column stays the before.
const PRE_WEALTH_RATIO = 1.5;
const PRE_POWER_GAP = 0.2;

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
type Scale = (raw: number) => number;
const SCALES: Record<string, Scale> = {
  preRefit: (raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K),
  dice: (raw) => sigmoid(raw),
  reachShare: (raw) => rawToReachShare(raw),
};

function wealthFires(actor: number, target: number, ratio: number): boolean {
  return (target > 0 && actor > target * ratio) || (target === 0 && actor > 0);
}

const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1).padStart(5)}%`);

console.log(`THR-1580 leverage scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);
console.log(`shipped LEVERAGE_WEALTH_RATIO=${LEVERAGE_WEALTH_RATIO} LEVERAGE_POWER_GAP=${LEVERAGE_POWER_GAP}`);

for (const seed of SEEDS) {
  const state = initState(seed);
  const graph = state.graph;
  const agents = graph.getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'individual' && n.properties.deceased !== true)
    .map((n) => n.id);
  const gold = agents.map((id) => computeRawScore(graph, id, 'gold'));
  const iron = agents.map((id) => computeRawScore(graph, id, 'iron'));
  console.log(`\nseed ${seed}: agents=${agents.length}, ordered pairs=${agents.length * (agents.length - 1)}`);
  const goldSorted = [...gold].sort((a, b) => a - b);
  const ironSorted = [...iron].sort((a, b) => a - b);
  const q = (s: number[], p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]?.toFixed(1);
  console.log(`  raw gold p10/p50/p90=${q(goldSorted, 0.1)}/${q(goldSorted, 0.5)}/${q(goldSorted, 0.9)}  raw iron p10/p50/p90=${q(ironSorted, 0.1)}/${q(ironSorted, 0.5)}/${q(ironSorted, 0.9)}`);
  const tier = agents.map((id) => (graph.getNode(id)?.properties.spotlightTier as string | undefined) ?? 'spotlight');
  const spot = agents.map((_, i) => tier[i] !== 'ambient');
  const spotRaw = (vals: number[]) => vals.filter((_, i) => spot[i]).sort((a, b) => a - b);
  console.log(`  non-ambient (spotlight+notable)=${spot.filter(Boolean).length}  their raw gold p10/p50/p90=${q(spotRaw(gold), 0.1)}/${q(spotRaw(gold), 0.5)}/${q(spotRaw(gold), 0.9)}  iron=${q(spotRaw(iron), 0.1)}/${q(spotRaw(iron), 0.5)}/${q(spotRaw(iron), 0.9)}`);
  const COHORTS: Array<[string, (a: number, t: number) => boolean]> = [
    ['all pairs', () => true],
    ['non-ambient actor', (a) => spot[a]],
    ['non-ambient both', (a, t) => spot[a] && spot[t]],
    // Both past the pre-refit knee (raw >= 20) in the compared reach: the band the old curve could not tell apart.
    ['gold both raw>=20', (a, t) => gold[a] >= 20 && gold[t] >= 20],
    ['iron both raw>=20', (a, t) => iron[a] >= 20 && iron[t] >= 20],
  ];
  for (const [cohort, inCohort] of COHORTS) {
  console.log(`  -- ${cohort}`);
  for (const [name, scale] of Object.entries(SCALES)) {
    let pairs = 0;
    let wealthPre = 0;
    let powerPre = 0;
    let wealthNew = 0;
    let powerNew = 0;
    for (let a = 0; a < agents.length; a++) {
      for (let t = 0; t < agents.length; t++) {
        if (a === t || !inCohort(a, t)) continue;
        pairs++;
        const ag = scale(gold[a]);
        const tg = scale(gold[t]);
        const ai = scale(iron[a]);
        const ti = scale(iron[t]);
        if (wealthFires(ag, tg, PRE_WEALTH_RATIO)) wealthPre++;
        if (ai > ti + PRE_POWER_GAP) powerPre++;
        if (wealthFires(ag, tg, LEVERAGE_WEALTH_RATIO)) wealthNew++;
        if (ai > ti + LEVERAGE_POWER_GAP) powerNew++;
      }
    }
    console.log(
      `  ${name.padEnd(10)} wealth@${PRE_WEALTH_RATIO}=${pct(wealthPre, pairs)} power@${PRE_POWER_GAP}=${pct(powerPre, pairs)}` +
        `  | wealth@${LEVERAGE_WEALTH_RATIO}=${pct(wealthNew, pairs)} power@${LEVERAGE_POWER_GAP}=${pct(powerNew, pairs)}`,
    );
  }
  }
}
