/**
 * THR-1580 — ascendant progression: which capability scale should the god's reach tiers
 * (`phaseAscendantProgression` → Deepening beats), the practice damping in
 * `accruePlayerReachPractice`, and the `getAscendantProgress` readout read?
 *
 * The ascendant's raw score is (almost) only its `reachPractice` bag — it carries no
 * `domainCapabilities` — so a fresh god reads raw 0 and every in-domain action adds
 * PLAYER_PRACTICE_PER_ACTION × difficultyScaling × max(1 − cap × DAMPING, 0.1)
 * (× SECONDARY_REACH_PRACTICE_MULT on the secondary reach). Each tier crossing enqueues one
 * Deepening beat. This script reports, per scale, how many in-domain actions it takes to
 * reach each tier (the Deepening arc's pacing), and with `--live` it drives the real
 * `accruePlayerReachPractice` + `getAscendantProgress` on seeded worlds, so running it on the
 * tree before and after the change gives the behavioural before/after.
 *
 * Usage: npm run measure:ascendant-progression-scales [-- --seeds 42,99,7 --map medium --actions 120]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import {
  computeRawScore,
  computeTier,
  SIGMOID_MIDPOINT,
  SIGMOID_K,
  PRE_REFIT_SIGMOID_MIDPOINT,
  PRE_REFIT_SIGMOID_K,
} from '../src/engine/domainCapability';
import { difficultyScaling } from '../src/engine/capabilityGrowth';
import { accruePlayerReachPractice, getAscendantProgress } from '../src/engine/phaseAscendantProgression';
import { rawToReachShare } from '../src/data/reach-share-constants';
import {
  PLAYER_PRACTICE_PER_ACTION,
  PLAYER_DIMINISHING_RETURNS_FACTOR,
  SECONDARY_REACH_PRACTICE_MULT,
} from '../src/data/player-progression';
import type { ReachDomain } from '../src/types/traits';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map((s) => parseInt(s.trim(), 10));
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;
const ACTIONS = parseInt(argValue('--actions') ?? '120', 10);
const DIFFICULTIES = [0.3, 0.5, 0.7];

const sigmoid = (x: number, mid = SIGMOID_MIDPOINT, k = SIGMOID_K) => 1 / (1 + Math.exp(-k * (x - mid)));
const SCALES: Record<string, (raw: number) => number> = {
  preRefit: (raw) => sigmoid(raw, PRE_REFIT_SIGMOID_MIDPOINT, PRE_REFIT_SIGMOID_K),
  dice: (raw) => sigmoid(raw),
  reachShare: rawToReachShare,
};

/** Actions to first reach each tier 2..10 (— = not within the cap), from raw 0. */
function arc(curve: (raw: number) => number, difficulty: number, mult: number, cap: number): (number | null)[] {
  const firstAt: (number | null)[] = Array(11).fill(null);
  let raw = 0;
  for (let n = 1; n <= cap; n++) {
    const c = curve(raw);
    raw += PLAYER_PRACTICE_PER_ACTION * difficultyScaling(difficulty * 100) * Math.max(1 - c * PLAYER_DIMINISHING_RETURNS_FACTOR, 0.1) * mult;
    const tier = computeTier(curve(raw));
    for (let t = 2; t <= tier; t++) if (firstAt[t] === null) firstAt[t] = n;
  }
  return firstAt.slice(2);
}

const CAP = 2000;
console.log(`THR-1580 ascendant progression scales — model arc from raw 0 (actions to reach tier 2..10, cap ${CAP})`);
for (const d of DIFFICULTIES) {
  for (const [label, mult] of [['primary', 1], ['secondary', SECONDARY_REACH_PRACTICE_MULT]] as const) {
    console.log(`\n difficulty ${d} (×${difficultyScaling(d * 100)}), ${label}:`);
    for (const [name, curve] of Object.entries(SCALES)) {
      const a = arc(curve, d, mult, CAP);
      const crossed = a.filter((x) => x !== null).length;
      console.log(`  ${name.padEnd(10)} ${a.map((x) => String(x ?? '—').padStart(5)).join('')}   crossings=${crossed}`);
    }
  }
}

console.log(`\nLive (this tree's accruePlayerReachPractice + getAscendantProgress), ${ACTIONS} primary-reach actions at difficulty 0.5, map=${MAP}:`);
for (const seed of SEEDS) {
  resetEventCounter();
  const archetypes = generateArchetypes(4, seed);
  const preset = MAP_SIZE_PRESETS[MAP];
  const { state } = initializeGameState(archetypes[0], 'MeasureBot', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const before = getAscendantProgress(state);
  if (!before || before.reaches.length === 0) {
    console.log(`  seed ${seed}: no ascendant progress`);
    continue;
  }
  const primary = before.reaches[0].reach as ReachDomain;
  const raw0 = computeRawScore(state.graph, state.ascendantId, primary);
  const tiersAt: string[] = [];
  let lastTier = before.reaches[0].tier;
  for (let n = 1; n <= ACTIONS; n++) {
    accruePlayerReachPractice(state.graph, state.ascendantId, primary, 0.5, n);
    const t = getAscendantProgress(state)!.reaches[0].tier;
    if (t > lastTier) {
      tiersAt.push(`t${t}@${n}`);
      lastTier = t;
    }
  }
  const after = getAscendantProgress(state)!.reaches[0];
  console.log(
    `  seed ${seed}: primary=${primary} raw0=${raw0.toFixed(2)} tier0=${before.reaches[0].tier}` +
      ` → raw=${computeRawScore(state.graph, state.ascendantId, primary).toFixed(2)} cap=${after.capability.toFixed(3)} tier=${after.tier}` +
      `  crossings: ${tiersAt.join(' ') || 'none'}`,
  );
}
