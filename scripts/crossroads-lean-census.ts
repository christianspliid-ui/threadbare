/**
 * Crossroads lean census — THR-2188 (design lane prototype; lives on proto/thr-2188-*, never merged).
 *
 * Threads one mortal per seed (the god's `thread` edge, courtPosition the_first), then at
 * every fresh reading with no lean held writes a lean exactly as `placeCrossroadsLean`
 * does (minus readability and the spend), rotating: toward road 2, away from road 1,
 * toward the last road. Tallies each outcome by forecast word, and for every
 * `lapsed_unavailable` records why the road was gone.
 *
 * Usage: node --experimental-strip-types scripts/crossroads-lean-census.ts [--seeds 42,7] [--ticks 600]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { forecastLean, readCrossroadsSnapshot, readCrossroadsLean, sameRoad } from '../src/engine/crossroads';
import type { CrossroadsLean, CrossroadsSnapshot, LeanDirection } from '../src/engine/crossroads';
import { REACH_TO_SPHERE } from '../src/data/premonition-constants';

const argv = process.argv.slice(2);
const arg = (n: string): string | undefined => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

type Key = string;
const table = new Map<Key, Record<string, number>>();
const bump = (k: Key, o: string): void => {
  const row = table.get(k) ?? { followed: 0, resisted: 0, lapsed_unavailable: 0, lapsed_expired: 0 };
  row[o] = (row[o] ?? 0) + 1; table.set(k, row);
};
const causes: Record<string, number> = {};
const lapseFamily: Record<string, number> = {};
const lapseHeld: number[] = [];
const MORTALS = Number(arg('--mortals') ?? 6);
const pendingRecover: Array<{ agentId: string; templateId: string; family: string; tick: number; done: boolean }> = [];
const recovered: Record<string, number> = {};
const lapseTpl: Record<string, number> = {};
const moveTally: Record<string, number> = {};
const leadT: Record<string, number[]> = {};
const placedTpl: Record<string, number> = {};
let decisions = 0;
let torn = 0;

interface Placed { lean: CrossroadsLean; snap: CrossroadsSnapshot; rotation: number }

for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'CrossroadsCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);
    const mortals = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' && !n.properties.isDead && !n.properties.deceased && !n.id.startsWith('actor.past'))
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, MORTALS);
    if (mortals.length === 0 || !state.ascendantId) { console.log(`seed ${seed}: no mortal`); continue; }
    for (const m of mortals) {
      state.graph.addEdge({ id: `census_thread_${m.id}`, source: state.ascendantId, target: m.id, type: 'thread', properties: { courtPosition: 'retinue', bondReception: 'devotion' } });
    }
    const per = new Map(mortals.map(m => [m.id, { rotation: 0, lastSnapTick: -1, placed: null as Placed | null }]));
    for (let i = 0; i < ticks; i++) {
      clearTraces();
      state = runTick(state, [], runtime);
      const traces = getTraces() as unknown as Array<Record<string, unknown>>;
      for (const mortal of mortals) {
      const ps = per.get(mortal.id)!;
      let placed = ps.placed;
      const node = state.graph.getNode(mortal.id);
      if (!node || node.properties.deceased) continue;
      for (const t of traces) {
        if (t.agentId === mortal.id && t.category === 'crossroads_snapshot') {
          const opts = (t.options as Array<{ templateId: string }> | undefined) ?? [];
          for (const p of pendingRecover) if (!p.done && p.agentId === mortal.id && Number(t.tick) - p.tick <= 72 && opts.some(o => o.templateId === p.templateId)) { p.done = true; recovered[p.family] = (recovered[p.family] ?? 0) + 1; }
        }
      }
      for (const t of traces) {
        if (t.agentId !== mortal.id) continue;
        if (t.category === 'crossroads_snapshot') { decisions++; if (t.settledness === 'torn') torn++; }
        if (t.category !== 'crossroads_lean_outcome' || !placed) continue;
        const k = `${String(t.direction)} · ${String(t.forecastAtPlacement)}`;
        bump(k, String(t.outcome));
        { const lead = (ps as unknown as { lead: number }).lead; const b = lead < 1 ? "<1" : lead < 1.25 ? "1-1.25" : lead < 1.5 ? "1.25-1.5" : lead < 2 ? "1.5-2" : lead < 3 ? "2-3" : "3+"; const kk = String(t.direction) + " lead " + b; const rr = leadT[kk] ?? [0, 0, 0]; if (t.outcome === "followed") rr[0]++; if (t.outcome === "followed" || t.outcome === "resisted") rr[1]++; rr[2]++; leadT[kk] = rr; }
        if (t.outcome === 'lapsed_unavailable') {
          lapseFamily[String(t.family)] = (lapseFamily[String(t.family)] ?? 0) + 1;
          lapseHeld.push(Number(t.heldTicks));
          // Why: what the new board holds for this template.
          const board = traces.find(b => b.category === 'decision_board_comparison' && b.agentId === mortal.id) as Record<string, unknown> | undefined;
          const top = (board?.boardTop as Array<{ family: string; id: string }> | undefined) ?? [];
          const snapNow = readCrossroadsSnapshot(node.properties.crossroads);
          const sameTemplateNow = snapNow?.options.some(o => o.templateId === placed!.lean.templateId) ?? false;
          const inTop = top.some(e => e.id.includes(placed!.lean.templateId));
          const fam = placed.lean.family;
          const cause = fam === 'strategic_action'
            ? (sameTemplateNow || inTop ? 'work: same template, other target' : 'work: template gone')
            : (inTop ? 'encounter: on top list but unmatched' : 'encounter: template off every list');
          causes[cause] = (causes[cause] ?? 0) + 1;
          lapseTpl[placed.lean.templateId] = (lapseTpl[placed.lean.templateId] ?? 0) + 1;
          const moved = String(node.properties.locationId) !== (placed as unknown as { loc: string }).loc; const atRoad = placed.lean.targetId === String(node.properties.locationId); moveTally[(moved ? 'moved' : 'same place') + (placed.lean.family === 'encounter' ? (atRoad ? ', now AT the road' : ', road elsewhere') : '')] = (moveTally[(moved ? 'moved' : 'same place') + (placed.lean.family === 'encounter' ? (atRoad ? ', now AT the road' : ', road elsewhere') : '')] ?? 0) + 1;
          pendingRecover.push({ agentId: mortal.id, templateId: placed.lean.templateId, family: fam, tick: Number(t.tick), done: false });
        }
        placed = null; ps.placed = null;
      }
      if (readCrossroadsLean(node.properties.crossroadsLean)) continue;
      const snap = readCrossroadsSnapshot(node.properties.crossroads);
      if (!snap || snap.tick === ps.lastSnapTick || snap.options.length < 2) continue;
      ps.lastSnapTick = snap.tick;
      const r = ps.rotation++ % 3;
      const idx = r === 0 ? 1 : r === 1 ? 0 : snap.options.length - 1;
      const direction: LeanDirection = r === 1 ? 'away' : 'toward';
      const o = snap.options[idx];
      const road = { family: o.family, templateId: o.templateId, targetId: o.targetId };
      const forecast = forecastLean(snap, { ...road, direction });
      { const m = (x: typeof o) => sameRoad(x, road) ? (direction === "toward" ? 2 : 0.5) : 1; const rk = snap.options.map((x, j) => ({ j, s: x.score * m(x) })).sort((a, b) => (b.s - a.s) || (a.j - b.j)); const tgt = rk.find(x => x.j === idx)!; const best = rk.find(x => x.j !== idx)!; (ps as unknown as { lead: number }).lead = direction === "toward" ? tgt.s / Math.max(1e-9, best.s) : rk[0].j === 0 ? 0 : rk[0].s / Math.max(1e-9, rk[1].s); }
      const lean: CrossroadsLean = { ...road, direction, tick: state.tick, sphere: REACH_TO_SPHERE[o.reach], essencePaid: 0, rankWhenPlaced: idx, forecastAtPlacement: forecast };
      node.properties.crossroadsLean = lean;
      ps.placed = { lean, snap, rotation: r, loc: String(node.properties.locationId) } as Placed;
      placedTpl[lean.templateId] = (placedTpl[lean.templateId] ?? 0) + 1;
      void sameRoad;
      }
    }
  } finally {
    disableTracing();
  }
}

console.log(`decisions ${decisions}, torn ${torn} (${(100 * torn / Math.max(1, decisions)).toFixed(0)}%)`);
console.log('forecast\tfollowed\tresisted\tlapsed_unavail\tlapsed_expired');
for (const [k, r] of [...table.entries()].sort()) console.log(`${k}\t${r.followed}\t${r.resisted}\t${r.lapsed_unavailable}\t${r.lapsed_expired}`);
const agg = (pred: (k: string) => boolean): [number, number, number] => {
  let f = 0, d = 0, all = 0;
  for (const [k, r] of table) if (pred(k)) { f += r.followed; d += r.followed + r.resisted; all += r.followed + r.resisted + r.lapsed_unavailable + r.lapsed_expired; }
  return [f, d, all];
};
for (const w of ['likely', 'may', 'not_enough']) {
  const [f, d, all] = agg(k => k.endsWith(w));
  console.log(`${w}: followed ${f}/${d} decided (${(100 * f / Math.max(1, d)).toFixed(0)}%), ${f}/${all} all (${(100 * f / Math.max(1, all)).toFixed(0)}%)`);
}
console.log('lapse family', JSON.stringify(lapseFamily));
console.log('lapse causes', JSON.stringify(causes));
console.log('lapse templates (lapsed/placed)', Object.entries(lapseTpl).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>k+' '+v+'/'+placedTpl[k]).join('; '));
for (const k of Object.keys(leadT).sort()) console.log('LEAD', k, 'followed', leadT[k][0], 'decided', leadT[k][1], 'all', leadT[k][2]);
console.log('lapse vs movement', JSON.stringify(moveTally));
console.log('lapsed road back on a reading within 72 ticks', JSON.stringify(recovered));
console.log('JSON', JSON.stringify({ table: Object.fromEntries(table), causes, lapseFamily, recovered, decisions, torn }));
lapseHeld.sort((a, b) => a - b);
console.log('lapse heldTicks median', lapseHeld[Math.floor(lapseHeld.length / 2)] ?? '-', 'max', lapseHeld[lapseHeld.length - 1] ?? '-');
