/**
 * THR-1580 — army raising: which capability scale should the army gates read?
 *
 * Three readers share one family (`armySpawning.ts` and its campaign mirror in
 * `notableAgendas.ts`), all `computeTier(capability)` = ceil(capability × 10):
 *   - faction Gold tier ≥ ARMY_SPAWN_GOLD_TIER_MIN (3) — may the faction field an army;
 *   - faction Gold tier → army size (≥ 5 regiment, ≥ 7 host, else warband);
 *   - member Iron tier ≥ ARMY_SPAWN_IRON_TIER_MIN (4) — who may command, highest tier wins.
 * They read the pre-refit curve (midpoint 10, k 0.4), which saturates at raw ~20. This
 * script measures, for every living faction, what each scale would give: eligibility,
 * size category, how many members clear the commander gate, and whether the chosen
 * commander is the faction's strongest Iron member (the pre-refit curve ties everyone
 * past raw ~20 at tier 10, so the first edge wins).
 *
 * Usage: npm run measure:army-scales [-- --seeds 42,99,7 --ticks 0 --map medium]
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
import { rawToReachShare } from '../src/data/reach-share-constants';
import {
  ARMY_SPAWN_GOLD_TIER_MIN,
  ARMY_SPAWN_IRON_TIER_MIN,
  determineSizeCategory,
} from '../src/types/army';

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
const tierOf = (curve: (raw: number) => number, raw: number) => computeTier(curve(Number.isFinite(raw) ? raw : 0));
const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1).padStart(5)}%`);
const q = (s: number[], p: number) => (s.length === 0 ? 'n/a' : s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(1));

console.log(`THR-1580 army-raising scales — seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);

for (const seed of SEEDS) {
  const graph = initState(seed).graph;
  const factions = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'faction' && n.properties.deceased !== true);
  const goldRaws = factions.map((f) => computeRawScore(graph, f.id, 'gold')).sort((a, b) => a - b);

  // Every individual member's Iron raw, per faction, in edge order (selectCommander's order).
  const members = factions.map((f) =>
    graph
      .getIncomingEdges(f.id, 'member_of')
      .filter((e) => graph.getNode(e.source)?.properties.actorType === 'individual')
      .map((e) => computeRawScore(graph, e.source, 'iron')),
  );
  const allIron = members.flat().sort((a, b) => a - b);

  console.log(`\nseed ${seed}: factions=${factions.length}  individual members=${allIron.length}`);
  console.log(`  faction gold raw p10/p50/p90 = ${q(goldRaws, 0.1)}/${q(goldRaws, 0.5)}/${q(goldRaws, 0.9)}  min=${q(goldRaws, 0)}`);
  console.log(`  member  iron raw p50/p90/p99 = ${q(allIron, 0.5)}/${q(allIron, 0.9)}/${q(allIron, 0.99)}  (>=20: ${pct(allIron.filter((v) => v >= 20).length, allIron.length)})`);

  for (const [name, curve] of Object.entries(SCALES)) {
    const eligible = goldRaws.filter((r) => tierOf(curve, r) >= ARMY_SPAWN_GOLD_TIER_MIN).length;
    const sizes = { warband: 0, regiment: 0, host: 0 };
    for (const r of goldRaws) sizes[determineSizeCategory(tierOf(curve, r))]++;

    let commanders = 0;
    let factionsWithCommander = 0;
    let pickIsStrongest = 0;
    for (const irons of members) {
      let bestIdx = -1;
      let bestTier = 0;
      irons.forEach((raw, i) => {
        const t = tierOf(curve, raw);
        if (t >= ARMY_SPAWN_IRON_TIER_MIN) {
          commanders++;
          if (t > bestTier) { bestTier = t; bestIdx = i; }
        }
      });
      if (bestIdx >= 0) {
        factionsWithCommander++;
        if (irons[bestIdx] >= Math.max(...irons)) pickIsStrongest++;
      }
    }
    console.log(
      `  ${name.padEnd(10)} gold-eligible=${pct(eligible, goldRaws.length)}  size w/r/h=${sizes.warband}/${sizes.regiment}/${sizes.host}` +
        `  commander-eligible members=${pct(commanders, allIron.length)}  factions with a commander=${factionsWithCommander}/${factions.length}` +
        `  pick = strongest Iron ${pickIsStrongest}/${factionsWithCommander}`,
    );
  }  // The shipped rule: gate on the reach-share tier, rank on the raw Iron score.
  let shippedPicks = 0;
  let shippedStrongest = 0;
  for (const irons of members) {
    const gated = irons.filter((raw) => tierOf(rawToReachShare, raw) >= ARMY_SPAWN_IRON_TIER_MIN);
    if (gated.length === 0) continue;
    shippedPicks++;
    if (Math.max(...gated) >= Math.max(...irons)) shippedStrongest++;
  }
  console.log(`  shipped    (share gate, raw rank) pick = strongest Iron ${shippedStrongest}/${shippedPicks}`);
}

