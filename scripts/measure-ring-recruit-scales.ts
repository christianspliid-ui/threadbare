/**
 * THR-1580 — ring recruiting: which capability scale should the Shadow preference read?
 *
 * `foundRing` (strategicGraphOps) fills a ring from the bound recruit cast, then from
 * co-located ungrouped individuals ordered faction-mate first, then anyone whose Shadow
 * is at or above `RING_RECRUIT_SHADOW_MIN` (0.35), then everyone else. It is a
 * preference, not a gate: the ring founds either way. The preference read the pre-refit
 * curve (midpoint 10, k 0.4), where 0.35 sits at raw ~8.5. This script measures, for
 * every location holding ring-eligible people, the Shadow raw distribution, the share
 * each scale calls "leans Shadow", and how often a location has more leaners than a ring
 * takes (`RING_TARGET_MEMBER_COUNT`) — where the preference stops discriminating and the
 * id sort picks.
 *
 * Time: a few seconds per seed at --ticks 0 (world generation only); each tick adds ≈0.8 s
 *       per seed on medium.
 * Usage: npm run measure:ring-recruit-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
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
import { RING_RECRUIT_SHADOW_MIN, RING_TARGET_MEMBER_COUNT } from '../src/data/strategic-action-constants';
import { rawToReachShare } from '../src/data/reach-share-constants';
import { getAgentsAtLocation } from '../src/engine/graphQueries';
import { isAgentGone, isGrouped } from '../src/engine/groups/groupQueries';

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

console.log(`THR-1580 ring-recruit scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS} min=${RING_RECRUIT_SHADOW_MIN} ring=${RING_TARGET_MEMBER_COUNT}`);

for (const seed of SEEDS) {
  const graph = initState(seed).graph;
  const pools: number[][] = []; // per location: Shadow raw of each ring-eligible person
  for (const loc of graph.getNodesByType('location')) {
    const raws = getAgentsAtLocation(graph, loc.id)
      .filter((n) => n.properties.actorType === 'individual' && !isGrouped(graph, n.id) && !isAgentGone(n))
      .map((n) => {
        const raw = computeRawScore(graph, n.id, 'shadow');
        return Number.isFinite(raw) ? raw : 0;
      });
    if (raws.length > 0) pools.push(raws);
  }
  const all = pools.flat().sort((a, b) => a - b);
  console.log(`\nseed ${seed}: locations=${pools.length} people=${all.length} shadow raw p50/p90/p99=${q(all, 0.5)}/${q(all, 0.9)}/${q(all, 0.99)}`);
  for (const [name, curve] of Object.entries(SCALES)) {
    const leans = (raw: number) => curve(raw) >= RING_RECRUIT_SHADOW_MIN;
    const people = all.filter(leans).length;
    const withAny = pools.filter((p) => p.some(leans)).length;
    const saturated = pools.filter((p) => p.filter(leans).length > RING_TARGET_MEMBER_COUNT).length;
    console.log(`  ${name.padEnd(10)} leans=${pct(people, all.length)}  locations with a leaner=${pct(withAny, pools.length)}  more leaners than a ring takes=${pct(saturated, pools.length)}`);
  }
}
