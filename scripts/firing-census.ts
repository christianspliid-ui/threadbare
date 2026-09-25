/**
 * Firing census — THR-1526 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Runs real worlds (`initializeGameState` → `runTick`) and harvests every unified action
 * the moment it appears, attributing each firing to **a seed** (`spawnedFromSeedId` set,
 * written by `encounterSeeding`) or to **the board** (no seed behind it), with the
 * action's `source` as the spawn route. Read per tick, never at the end: resolved actions
 * are pruned after ~20 ticks, and the trace ring is too small to carry 200 ticks.
 *
 * The THR-1526 verdict (exit 1 on a breach):
 *   - every `drawable: false` template shows **zero board firings** on every seed — a
 *     board firing names the route that leaked (kill criterion 1);
 *   - the Swindled Family fires at least once on at least one seed — else its sequels'
 *     only honest supply is dry (kill criterion 2: file a Deferral to widen it, never
 *     unflag the sequels). Reported, not gated: it depends on the world's dice.
 *
 * Usage:
 *   npm run census:firings                                  # seeds 42,99 × 200 ticks, medium
 *   npm run census:firings -- --seeds 42 --ticks 60 --map small
 *   npm run census:firings -- --all                         # print every template that fired
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../src/data/unified-action-templates';

// ─── Constants ────────────────────────────────────────────────────

const DEFAULT_SEEDS: readonly number[] = [42, 99];
const DEFAULT_TICKS = 200;
/** Templates always printed, fired or not — the THR-1526 slice chain. */
const WATCHED: readonly string[] = [
  'encounter.slice.bargain_at_crossroads',
  'encounter.slice.full_moon_collection',
  'encounter.slice.full_moon_reckoning',
  'encounter.slice.swindled_family',
  'encounter.slice.swindler_found',
  'encounter.slice.grateful_kin',
  'encounter.slice.the_table_that_holds',
  // THR-1567 — the three wayside-only slice encounters the THR-1524 census found dry.
  'encounter.slice.unsafe_bridge',
  'encounter.slice.snow_on_the_pass',
  'encounter.slice.riders_behind_caravan',
];
const FAMILY_ID = 'encounter.slice.swindled_family';

// ─── Args ─────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? DEFAULT_SEEDS.join(',')).split(',').map(Number);
const ticks = Number(arg('--ticks') ?? DEFAULT_TICKS);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const printAll = argv.includes('--all');

const NON_DRAWABLE = new Set(
  [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES]
    .filter(t => t.drawable === false)
    .map(t => t.id),
);

// ─── Census ───────────────────────────────────────────────────────

interface Tally {
  seeded: number;
  board: number;
  /** board firings by `source` — the route that leaked, when one does */
  boardRoutes: Map<string, number>;
}

function runSeed(seed: number): Map<string, Tally> {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'FiringCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const seen = new Set<string>();
  const tallies = new Map<string, Tally>();
  const harvest = () => {
    for (const action of state.unifiedActions ?? []) {
      if (seen.has(action.actionId)) continue;
      seen.add(action.actionId);
      let t = tallies.get(action.templateId);
      if (!t) { t = { seeded: 0, board: 0, boardRoutes: new Map() }; tallies.set(action.templateId, t); }
      if (action.spawnedFromSeedId) {
        t.seeded++;
      } else {
        t.board++;
        const route = String(action.source ?? 'unknown');
        t.boardRoutes.set(route, (t.boardRoutes.get(route) ?? 0) + 1);
      }
    }
  };

  harvest();
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    harvest();
  }
  return tallies;
}

// ─── Report ───────────────────────────────────────────────────────

let breaches = 0;
let familyFired = false;
console.log(`\nfiring-census — map ${map}, ${ticks} ticks, seeds ${seeds.join(',')}`);
console.log(`non-drawable templates: ${[...NON_DRAWABLE].sort().join(', ') || '(none)'}\n`);

for (const seed of seeds) {
  const tallies = runSeed(seed);
  console.log(`── seed ${seed} ── (${tallies.size} templates fired)`);
  const ids = printAll ? [...new Set([...WATCHED, ...tallies.keys()])].sort() : WATCHED;
  for (const id of ids) {
    const t = tallies.get(id) ?? { seeded: 0, board: 0, boardRoutes: new Map() };
    const flag = NON_DRAWABLE.has(id) ? ' [seed-only]' : '';
    const routes = t.boardRoutes.size > 0
      ? `  board routes: ${[...t.boardRoutes].map(([r, n]) => `${r}×${n}`).join(', ')}`
      : '';
    console.log(`  ${id.padEnd(44)} seeded ${String(t.seeded).padStart(3)}   board ${String(t.board).padStart(3)}${flag}${routes}`);
  }
  for (const [id, t] of tallies) {
    if (NON_DRAWABLE.has(id) && t.board > 0) {
      breaches++;
      console.log(`  ✗ BREACH: seed-only ${id} fired ${t.board}× from the board (${[...t.boardRoutes].map(([r, n]) => `${r}×${n}`).join(', ')})`);
    }
  }
  const family = tallies.get(FAMILY_ID);
  if (family && family.seeded + family.board > 0) familyFired = true;
  console.log('');
}

console.log(`verdict: ${breaches === 0 ? 'PASS' : 'FAIL'} — ${breaches} seed-only board firing(s); `
  + `Swindled Family ${familyFired ? 'fired' : 'DID NOT FIRE (kill criterion 2 — file a Deferral to widen it; never unflag the sequels)'}`);
process.exit(breaches === 0 ? 0 : 1);
