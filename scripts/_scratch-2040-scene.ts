/**
 * PROTO (THR-2040 re-plan) — never merged. The larder pull's census, classified by the
 * SCENE's settlement (where the story happens), the reading the pull itself uses.
 * Per context (hungry / glut / fed settlement): famine- and plenty-row shares among
 * shortlisted candidates and among board winners; plus the undertaking share of non-idle
 * verdicts. Run once with LARDER_PULL=0 and once with LARDER_PULL=0.75.
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';
import type { WorldGraph } from '../src/engine/graph';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const FAMINE_ROWS = ['encounter.aid_refugees','encounter.barter_survival','encounter.mend_fishing_nets','encounter.town.bell_at_the_exchange','gold.famine.merchant_granaries','encounter.forage_provisions','encounter.black_market_deal','encounter.pickpocket'];
const PLENTY_ROWS = ['encounter.harvest_bounty','encounter.market_day_festival','encounter.festival_of_spheres','encounter.grand_tournament','tavern.drinking_contest','encounter.town.mill_lease_auction','encounter.town.tithe_barn_raid','encounter.realm.crowns_reckoning','encounter.caravan_deal','encounter.foreign_trader'];
const inRows = (rows: string[], id: string) => rows.some(r => id === r || id.startsWith(r + '.'));
const SETTLE = ['hamlet', 'town', 'city', 'capital'];

type Ranked = [string, number, string | null, string, number];
interface Probe { shortlist: string[]; winner: string | null; winnerFamily: string | null; ranked?: Ranked[] }
let current: Probe[] = [];
(globalThis as unknown as { __poolProbe: (r: Probe) => void }).__poolProbe = (r) => { current.push(r); };

const C: Record<string, number> = {};
const inc = (k: string, by = 1) => { C[k] = (C[k] ?? 0) + by; };
const ctxOf = (graph: WorldGraph, locId: string, memo: Map<string, string | null>): string | null => {
  if (memo.has(locId)) return memo.get(locId)!;
  let n = graph.getNode(locId);
  if (n && !SETTLE.includes(n.properties.locationSubtype as string) && n.properties.parentLocationId) n = graph.getNode(n.properties.parentLocationId as string);
  let ctx: string | null = null;
  if (n && SETTLE.includes(n.properties.locationSubtype as string)) {
    const p = n.properties;
    ctx = isHungryToday(n).hungry ? 'hungry' : ((Number(p.foodSurplusDays) || 0) >= 3 && (Number(p.foodBalance) || 0) >= 0.75) ? 'glut' : 'fed';
  }
  memo.set(locId, ctx); return ctx;
};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime(); const preset = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Scene', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let t = 1; t <= ticks; t++) {
    current = [];
    state = runTick(state, [], runtime);
    const memo = new Map<string, string | null>();
    for (const p of current) {
      inc(`verdict|${p.winnerFamily ?? 'idle'}`);
      const ranked = p.ranked ?? [];
      const top = ranked.slice(0, p.shortlist.length);
      for (const r of top) {
        const ctx = ctxOf(state.graph, r[3], memo); if (!ctx) continue;
        inc(`${ctx}|short|all`);
        if (inRows(FAMINE_ROWS, r[0])) inc(`${ctx}|short|famine`);
        if (inRows(PLENTY_ROWS, r[0])) inc(`${ctx}|short|plenty`);
      }
      for (const r of ranked) {
        const ctx = ctxOf(state.graph, r[3], memo); if (!ctx) continue;
        if (inRows(FAMINE_ROWS, r[0])) { inc(`${ctx}|ranked|famine`); if (r[4] !== 1) inc(`${ctx}|pulled|famine`); }
      }
      if (p.winnerFamily === 'encounter' && p.winner) {
        const w = top.find(r => r[0] === p.winner);
        const ctx = w ? ctxOf(state.graph, w[3], memo) : null;
        if (ctx) {
          inc(`${ctx}|win|all`);
          if (inRows(FAMINE_ROWS, p.winner)) inc(`${ctx}|win|famine`);
          if (inRows(PLENTY_ROWS, p.winner)) inc(`${ctx}|win|plenty`);
        }
      }
    }
  }
  console.error(`seed ${seed} done`);
}
const pct = (n = 0, d = 0) => `${n}/${d} (${((100 * n) / Math.max(1, d)).toFixed(1)}%)`;
console.log(`LARDER_PULL=${process.env.LARDER_PULL ?? 0} seeds ${seeds.join(',')} × ${ticks}`);
for (const c of ['hungry', 'glut', 'fed']) {
  console.log(`${c}: shortlist famine ${pct(C[`${c}|short|famine`], C[`${c}|short|all`])} plenty ${pct(C[`${c}|short|plenty`], C[`${c}|short|all`])} · winners famine ${pct(C[`${c}|win|famine`], C[`${c}|win|all`])} plenty ${pct(C[`${c}|win|plenty`], C[`${c}|win|all`])} · famine rows pulled ${pct(C[`${c}|pulled|famine`], C[`${c}|ranked|famine`])}`);
}
const nonIdle = Object.entries(C).filter(([k]) => k.startsWith('verdict|') && k !== 'verdict|idle').reduce((a, [, v]) => a + v, 0);
console.log(`verdicts: ${Object.entries(C).filter(([k]) => k.startsWith('verdict|')).map(([k, v]) => `${k.slice(8)} ${v}`).join(' · ')} · undertaking share of non-idle ${pct(C['verdict|undertaking'], nonIdle)}`);
