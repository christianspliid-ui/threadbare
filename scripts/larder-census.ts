/**
 * Larder census (THR-2040) — `npm run census:larder -- --seeds 42,99,7 --ticks 360`.
 *
 * How often is a settlement hungry, glutted, booming or busting, and how much do they overlap?
 * The `ROWS` line is the plan's Done-when predicate: the famine rows' share of firings in
 * hungry settlements should beat their share in all settlements, and the plenty rows' share
 * in glutted settlements likewise. The row lists are hard-coded (not read from the affinity
 * table) so the same script measures main before the larder term existed.
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { getAgentLocation } from '../src/engine/graphQueries';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';
import { readResources } from '../src/engine/resourceEconomy';
import { getResourceClass } from '../src/data/resource-classes';
import { ECON_BOOM_THRESHOLD, ECON_BUST_THRESHOLD } from '../src/data/economic-scene-affinity';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const FAMINE_ROWS = ['encounter.aid_refugees','encounter.barter_survival','encounter.mend_fishing_nets','encounter.town.bell_at_the_exchange','gold.famine.merchant_granaries','encounter.forage_provisions','encounter.black_market_deal','encounter.pickpocket'];
const PLENTY_ROWS = ['encounter.harvest_bounty','encounter.market_day_festival','encounter.festival_of_spheres','encounter.grand_tournament','tavern.drinking_contest','encounter.town.mill_lease_auction','encounter.town.tithe_barn_raid','encounter.realm.crowns_reckoning','encounter.caravan_deal','encounter.foreign_trader'];
const inRows = (rows: string[], id: string) => rows.some(r => id === r || id.startsWith(r + '.'));
const SETTLE = ['hamlet', 'town', 'city', 'capital'];

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Larder', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const c = { samples: 0, hungry: 0, hungryEcon: 0, glut1: 0, glut3: 0, arc: 0, scarceStaple: 0, surplusStaple: 0,
    boom: 0, bust: 0, hungryAndBust: 0, hungryNotBust: 0, glutAndBoom: 0, glutNotBoom: 0, foodStoreTowns: 0 };
  const hungryTowns = new Set<string>(); const glutTowns = new Set<string>(); const allTowns = new Set<string>();
  const firedHungry = new Map<string, number>(); const firedAll = new Map<string, number>();
  const seen = new Set<string>(); const fb: number[] = []; let inTown = 0; const R = { famAll: 0, famHungry: 0, hungryAll: 0, plAll: 0, plPlenty: 0, plentyAll: 0, plentyFam: 0 };
  for (let t = 1; t <= ticks; t++) {
    state = runTick(state, [], runtime);
    const towns = state.graph.getNodesByType('location').filter(n => SETTLE.includes(n.properties.locationSubtype as string));
    const hungryIds = new Set<string>(); const plentyIds = new Set<string>();
    for (const n of towns) {
      const p = n.properties;
      const h = isHungryToday(n).hungry;
      if (h) hungryIds.add(n.id);
      if ((typeof p.foodSurplusDays === 'number' ? p.foodSurplusDays : 0) >= 3 && (typeof p.foodBalance === 'number' ? p.foodBalance : 0) >= 0.75) plentyIds.add(n.id);
      if (t % 12 !== 0) continue;
      allTowns.add(n.id); c.samples++;
      if (typeof p.foodStore === 'number') c.foodStoreTowns++;
      const pros = typeof p.prosperity === 'number' ? p.prosperity : 50;
      const boom = pros > ECON_BOOM_THRESHOLD, bust = pros < ECON_BUST_THRESHOLD;
      const sd = typeof p.foodSurplusDays === 'number' ? p.foodSurplusDays : 0;
      const res = Object.entries(readResources(p));
      if (h) { c.hungry++; hungryTowns.add(n.id); if (isHungryToday(n).source === 'settlement_economy') c.hungryEcon++; if (bust) c.hungryAndBust++; else c.hungryNotBust++; }
      if (sd >= 1) { c.glut1++; fb.push(typeof p.foodBalance === 'number' ? p.foodBalance : 0); }
      if (sd >= 3) { c.glut3++; glutTowns.add(n.id); if (boom) c.glutAndBoom++; else c.glutNotBoom++; }
      if (p.scarcityArc) c.arc++;
      if (res.some(([rid, r]) => r.stockTier === 'scarce' && getResourceClass(rid).category === 'staple')) c.scarceStaple++;
      if (res.some(([rid, r]) => r.stockTier === 'surplus' && getResourceClass(rid).category === 'staple')) c.surplusStaple++;
      if (boom) c.boom++; if (bust) c.bust++;
    }
    for (const a of state.unifiedActions ?? []) {
      if (seen.has(a.actionId)) continue; seen.add(a.actionId);
      const loc = getAgentLocation(state.graph, a.actorId);
      const parent = loc?.properties?.parentLocationId as string | undefined;
      const at = loc && SETTLE.includes(loc.properties.locationSubtype as string) ? loc.id : parent;
      if (at) inTown++;
      const fam = inRows(FAMINE_ROWS, a.templateId), pl = inRows(PLENTY_ROWS, a.templateId);
      if (at) { if (fam) R.famAll++; if (pl) R.plAll++; if (hungryIds.has(at)) { R.hungryAll++; if (fam) R.famHungry++; } if (plentyIds.has(at)) { R.plentyAll++; if (pl) R.plPlenty++; if (fam) R.plentyFam++; } }
      firedAll.set(a.templateId, (firedAll.get(a.templateId) ?? 0) + 1);
      if (at && hungryIds.has(at)) firedHungry.set(a.templateId, (firedHungry.get(a.templateId) ?? 0) + 1);
    }
  }
  const pct = (x: number) => `${x} (${((100 * x) / Math.max(1, c.samples)).toFixed(1)}%)`;
  console.log(`\n── seed ${seed}, ${map}, ${ticks} ticks — ${allTowns.size} settlements, ${c.samples} town-days (foodStore on ${c.foodStoreTowns})`);
  console.log(`hungry ${pct(c.hungry)} [econ-source ${c.hungryEcon}] in ${hungryTowns.size} towns · of which bust ${c.hungryAndBust}, not bust ${c.hungryNotBust}`);
  console.log(`glut≥1d ${pct(c.glut1)} · glut≥3d ${pct(c.glut3)} in ${glutTowns.size} towns · of which boom ${c.glutAndBoom}, not boom ${c.glutNotBoom}`);
  console.log(`scarcityArc ${pct(c.arc)} · scarce staple ${pct(c.scarceStaple)} · surplus staple ${pct(c.surplusStaple)} · boom ${pct(c.boom)} · bust ${pct(c.bust)}`);
  fb.sort((x, y) => x - y); const q = (f: number) => fb[Math.floor(f * (fb.length - 1))]?.toFixed(2);
  console.log('foodBalance on surplus days p10/p50/p90/max', q(0.1), q(0.5), q(0.9), q(1), 'share>=0.5', (fb.filter(x => x >= 0.5).length / Math.max(1, fb.length)).toFixed(2), 'share>=0.75', (fb.filter(x => x >= 0.75).length / Math.max(1, fb.length)).toFixed(2), 'firings in a settlement', inTown);
  console.log(`ROWS famine-rows share: in hungry towns ${R.famHungry}/${R.hungryAll}, in all towns ${R.famAll}/${inTown} · plenty-rows share: in plenty towns ${R.plPlenty}/${R.plentyAll}, in all towns ${R.plAll}/${inTown} · famine rows in plenty towns ${R.plentyFam}`);
  const total = [...firedAll.values()].reduce((a, b) => a + b, 0);
  const hungryTotal = [...firedHungry.values()].reduce((a, b) => a + b, 0);
  console.log(`firings ${total}, in a hungry settlement ${hungryTotal}; top in hungry:`, [...firedHungry].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(', '));
}
