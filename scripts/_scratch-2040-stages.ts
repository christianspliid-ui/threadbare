/**
 * PROTO (THR-2040 re-plan) — never merged. Which filter stage drops the famine rows in a
 * hungry settlement? Per decision in a settlement, records whether any famine row survives
 * each filter stage, split hungry / glut / fed. Same rows and classification as
 * `_scratch-2040-pool.ts`. Also prints which *other* templates fill the cap in hungry towns.
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const FAMINE_ROWS = ['encounter.aid_refugees','encounter.barter_survival','encounter.mend_fishing_nets','encounter.town.bell_at_the_exchange','gold.famine.merchant_granaries','encounter.forage_provisions','encounter.black_market_deal','encounter.pickpocket'];
const PLENTY_ROWS = ['encounter.harvest_bounty','encounter.market_day_festival','encounter.festival_of_spheres','encounter.grand_tournament','tavern.drinking_contest','encounter.town.mill_lease_auction','encounter.town.tithe_barn_raid','encounter.realm.crowns_reckoning','encounter.caravan_deal','encounter.foreign_trader'];
const inRows = (rows: string[], id: string) => rows.some(r => id === r || id.startsWith(r + '.'));
const SETTLE = ['hamlet', 'town', 'city', 'capital'];
const STAGES = ['merged', 'awareness', 'visibility', 'prereq', 'breath_role', 'threat', 'cap', 'drawable', 'shortlist', 'winner'];

interface Probe { ranked?: [string, number, string | null][]; locationId: string; merged: string[]; drawable: string[]; shortlist: string[]; winner: string | null; stages: Record<string, string[]> | null; filtered: string[] }
let current: Probe[] = [];
(globalThis as unknown as { __poolProbe: (r: Probe) => void }).__poolProbe = (r) => { current.push(r); };

const dec: Record<string, number> = {};
const hit: Record<string, number> = {};
const capSize: Record<string, number[]> = {};
const preCapSize: Record<string, number[]> = {};
const capFill = new Map<string, number>();
let mismatch = 0;
const gap: Record<string, { n: number; ranks: number[]; ratio: number[]; add: number[]; s1: number[]; s5: number[]; zones: Record<string, number> }> = {};
const add = (k: string) => { hit[k] = (hit[k] ?? 0) + 1; };

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Stages', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let t = 1; t <= ticks; t++) {
    current = [];
    state = runTick(state, [], runtime);
    for (const p of current) {
      if (!p.stages) continue;
      const loc = state.graph.getNode(p.locationId);
      if (!loc) continue;
      const town = SETTLE.includes(loc.properties.locationSubtype as string) ? loc
        : (loc.properties.parentLocationId ? state.graph.getNode(loc.properties.parentLocationId as string) : undefined);
      if (!town || !SETTLE.includes(town.properties.locationSubtype as string)) continue;
      const tp = town.properties;
      const hungry = isHungryToday(town).hungry;
      const glut = !hungry && (Number(tp.foodSurplusDays) || 0) >= 3 && (Number(tp.foodBalance) || 0) >= 0.75;
      const ctx = hungry ? 'hungry' : glut ? 'glut' : 'fed';
      dec[ctx] = (dec[ctx] ?? 0) + 1;
      if ((p.stages.cap ?? []).join() !== p.filtered.join()) mismatch++;
      (capSize[ctx] ??= []).push(new Set(p.stages.cap ?? []).size);
      (preCapSize[ctx] ??= []).push(new Set(p.stages.threat ?? []).size);
      for (const s of STAGES) {
        const ids = s === 'winner' ? (p.winner ? [p.winner] : []) : s === 'merged' || s === 'drawable' || s === 'shortlist' ? p[s as 'merged'] : (p.stages[s] ?? []);
        if (ids.some(id => inRows(FAMINE_ROWS, id))) add(`${ctx}|famine|${s}`);
        if (ids.some(id => inRows(PLENTY_ROWS, id))) add(`${ctx}|plenty|${s}`);
      }
      if (p.ranked && p.ranked.length >= 5) {
        const s5 = p.ranked[4][1]; const s1 = p.ranked[0][1];
        const fi = p.ranked.findIndex(r => inRows(FAMINE_ROWS, r[0]));
        if (fi >= 0) {
          const g = (gap[ctx] ??= { n: 0, ranks: [], ratio: [], add: [], s1: [], s5: [], zones: {} });
          g.n++; g.ranks.push(fi + 1); g.s1.push(s1); g.s5.push(s5);
          const fsc = p.ranked[fi][1]; g.ratio.push(fsc > 0 ? s5 / fsc : 99); g.add.push(s5 - fsc);
          for (const r of p.ranked) if (inRows(FAMINE_ROWS, r[0])) g.zones[r[2] ?? 'null'] = (g.zones[r[2] ?? 'null'] ?? 0) + 1;
        }
      }
      if (hungry) for (const id of new Set(p.stages.cap ?? [])) capFill.set(id, (capFill.get(id) ?? 0) + 1);
    }
  }
  console.error(`seed ${seed} done`, JSON.stringify(dec));
}
const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
const med = (a: number[] = []) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
console.log(`decisions ${JSON.stringify(dec)} · cap≠filtered mismatches ${mismatch}`);
console.log(['ctx|set', ...STAGES].join('\t'));
for (const c of ['hungry', 'glut', 'fed']) for (const set of ['famine', 'plenty']) {
  console.log([`${c}|${set}`, ...STAGES.map(s => pct(hit[`${c}|${set}|${s}`] ?? 0, dec[c] ?? 0))].join('\t'));
}
for (const c of ['hungry', 'glut', 'fed']) console.log(`${c}: median distinct templates before cap ${med(preCapSize[c])}, after cap ${med(capSize[c])}`);
console.log('top templates in the capped pool in hungry towns:', [...capFill].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k} ${pct(v, dec.hungry ?? 0)}`).join(' · '));
const q = (a: number[], f: number) => { const s = [...a].sort((x, y) => x - y); return (s[Math.floor(f * (s.length - 1))] ?? 0).toFixed(3); };
for (const c of ['hungry', 'glut', 'fed']) {
  const g = gap[c]; if (!g) continue;
  console.log(`${c}: n ${g.n} · best famine rank p25/p50/p75 ${q(g.ranks, .25)}/${q(g.ranks, .5)}/${q(g.ranks, .75)} · 5th÷famine p25/p50/p75 ${q(g.ratio, .25)}/${q(g.ratio, .5)}/${q(g.ratio, .75)} · additive gap p50 ${q(g.add, .5)} · top p50 ${q(g.s1, .5)} · 5th p50 ${q(g.s5, .5)} · zones ${JSON.stringify(g.zones)}`);
}
