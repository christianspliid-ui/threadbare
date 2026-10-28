/**
 * PROTO (THR-2040 re-plan) — never merged. Where do the famine scenes drop out of a
 * hungry town's decision? Counts, per decision made in a settlement (or its sublocation),
 * whether any famine-row template is in the merged regional entries, survives the filter
 * pipeline, survives retire/cap/cooldown, reaches the top-5 shortlist, and wins the board.
 * `npx tsx scripts/_scratch-2040-pool.ts --seeds 1,2,3 --ticks 360`
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';
import { UNIFIED_ACTION_TEMPLATES, CACHE_REGISTERED_REGIONAL_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../src/data/unified-action-templates';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const FAMINE_ROWS = ['encounter.aid_refugees','encounter.barter_survival','encounter.mend_fishing_nets','encounter.town.bell_at_the_exchange','gold.famine.merchant_granaries','encounter.forage_provisions','encounter.black_market_deal','encounter.pickpocket'];
const PLENTY_ROWS = ['encounter.harvest_bounty','encounter.market_day_festival','encounter.festival_of_spheres','encounter.grand_tournament','tavern.drinking_contest','encounter.town.mill_lease_auction','encounter.town.tithe_barn_raid','encounter.realm.crowns_reckoning','encounter.caravan_deal','encounter.foreign_trader'];
const rowOf = (rows: string[], id: string) => rows.find(r => id === r || id.startsWith(r + '.'));
const SETTLE = ['hamlet', 'town', 'city', 'capital'];
const STAGES = ['merged', 'filtered', 'drawable', 'shortlist', 'winner'] as const;
type Stage = typeof STAGES[number];

const all = [...new Set([...UNIFIED_ACTION_TEMPLATES, ...CACHE_REGISTERED_REGIONAL_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES].map(t => t.id))];
for (const r of [...FAMINE_ROWS, ...PLENTY_ROWS]) {
  const n = all.filter(id => id === r || id.startsWith(r + '.')).length;
  if (n !== 1) console.log(`row ${r}: ${n} templates`);
}

interface Probe { agentId: string; locationId: string; tick: number; merged: string[]; filtered: string[]; drawable: string[]; shortlist: string[]; winner: string | null; winnerFamily: string | null }
let current: Probe[] = [];
(globalThis as unknown as { __poolProbe: (r: Probe) => void }).__poolProbe = (r) => { current.push(r); };

// pooled counters: [context][stage] decisions where ANY row of the set is present; per-row presence too
const ctxs = ['hungry', 'fed', 'glut'] as const;
const pooled: Record<string, Record<string, number>> = {};
const perRow: Record<string, Record<string, number>> = {};
const decisions: Record<string, number> = { hungry: 0, fed: 0, glut: 0 };
const bump = (o: Record<string, Record<string, number>>, k: string, s: string) => { (o[k] ??= {})[s] = (o[k][s] ?? 0) + 1; };

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Pool', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let t = 1; t <= ticks; t++) {
    current = [];
    state = runTick(state, [], runtime);
    // classify by the settlement state at the end of the tick (the probe ran during it)
    for (const p of current) {
      const loc = state.graph.getNode(p.locationId);
      if (!loc) continue;
      const town = SETTLE.includes(loc.properties.locationSubtype as string) ? loc
        : (loc.properties.parentLocationId ? state.graph.getNode(loc.properties.parentLocationId as string) : undefined);
      if (!town || !SETTLE.includes(town.properties.locationSubtype as string)) continue;
      const tp = town.properties;
      const hungry = isHungryToday(town).hungry;
      const glut = !hungry && (Number(tp.foodSurplusDays) || 0) >= 3 && (Number(tp.foodBalance) || 0) >= 0.75;
      const ctx = hungry ? 'hungry' : glut ? 'glut' : 'fed';
      decisions[ctx]++;
      for (const [setName, rows] of [['famine', FAMINE_ROWS], ['plenty', PLENTY_ROWS]] as const) {
        for (const s of STAGES) {
          const ids = s === 'winner' ? (p.winner ? [p.winner] : []) : p[s];
          const hitRows = new Set(ids.map(id => rowOf(rows, id)).filter(Boolean) as string[]);
          if (hitRows.size) bump(pooled, `${ctx}|${setName}`, s);
          for (const r of hitRows) bump(perRow, `${ctx}|${r}`, s);
        }
      }
    }
  }
  console.error(`seed ${seed} done`, JSON.stringify(decisions));
}

const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
console.log(`\nDecisions in a settlement — hungry ${decisions.hungry}, glut ${decisions.glut}, fed ${decisions.fed}`);
console.log('\nShare of decisions where ANY row of the set is present at each stage');
console.log(['ctx|set', ...STAGES].join('\t'));
for (const c of ctxs) for (const set of ['famine', 'plenty']) {
  const row = pooled[`${c}|${set}`] ?? {};
  console.log([`${c}|${set}`, ...STAGES.map(s => pct(row[s] ?? 0, decisions[c]))].join('\t'));
}
console.log('\nPer row (hungry vs fed): merged / filtered / drawable / shortlist / winner');
for (const r of [...FAMINE_ROWS, ...PLENTY_ROWS]) {
  const line = (c: string) => STAGES.map(s => pct(perRow[`${c}|${r}`]?.[s] ?? 0, decisions[c])).join(' ');
  console.log(`${r}\n   hungry ${line('hungry')}\n   glut   ${line('glut')}\n   fed    ${line('fed')}`);
}
