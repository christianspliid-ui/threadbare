/**
 * THR-1580 — stranger curiosity: which capability scale should the Eye gate read?
 *
 * `computeBondModifier` (socialEncounterGeneration) gives an agent meeting a stranger
 * (trust 0) a curiosity bonus when its Eye capability is above
 * `STRANGER_CURIOSITY_THRESHOLD` (0.3). The gate read the pre-refit curve (midpoint 10,
 * k 0.4), where 0.3 sits at raw ~7.9 — below the floor of a protagonist's worldgen
 * roll (`10 + rand(31)`). This script measures, for every social-eligible individual
 * (spotlight or faction-linked, not a monster — the `findVisibleAgents` filter), the
 * Eye raw distribution and the share each scale would call "perceptive".
 *
 * Usage: npm run measure:stranger-curiosity-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
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
import { STRANGER_CURIOSITY_THRESHOLD } from '../src/data/agent-behavior-constants';
import { rawToReachShare } from '../src/data/reach-share-constants';
import { getFactionMembershipEdges } from '../src/engine/graphQueries';
import { isMonster } from '../src/engine/monsters/isMonster';

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

console.log(`THR-1580 stranger-curiosity scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS} threshold=${STRANGER_CURIOSITY_THRESHOLD}`);

for (const seed of SEEDS) {
  const graph = initState(seed).graph;
  const groups = new Map<string, number[]>(); // spotlight / faction-linked ambient → Eye raw
  for (const a of graph.getNodesByType('actor')) {
    if (a.properties.deceased === true || a.properties.actorType !== 'individual' || isMonster(a)) continue;
    const spotlight = ((a.properties.spotlightTier ?? 'spotlight') as string) === 'spotlight';
    const factionLinked = getFactionMembershipEdges(graph, a.id)
      .some((e) => (e.properties.factionDefId as string | undefined) != null);
    if (!spotlight && !factionLinked) continue;
    const key = spotlight ? 'spotlight' : 'faction-linked';
    const raw = computeRawScore(graph, a.id, 'eye');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(Number.isFinite(raw) ? raw : 0);
  }
  console.log(`\nseed ${seed}:`);
  for (const [key, raws] of [...groups.entries()].sort()) {
    const sorted = [...raws].sort((a, b) => a - b);
    console.log(`  ${key.padEnd(15)} n=${String(sorted.length).padStart(4)}  eye raw p10/p50/p90=${q(sorted, 0.1)}/${q(sorted, 0.5)}/${q(sorted, 0.9)}`);
    for (const [name, curve] of Object.entries(SCALES)) {
      const curious = sorted.filter((raw) => curve(raw) > STRANGER_CURIOSITY_THRESHOLD).length;
      console.log(`    ${name.padEnd(10)} curious=${pct(curious, sorted.length)}`);
    }
  }
}
