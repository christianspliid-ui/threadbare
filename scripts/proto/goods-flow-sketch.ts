/**
 * THR-1866 should goods flow — IN-LOOP SKETCH. Throwaway; never merged.
 *
 * Runs the real world (seed 42, medium, 600 ticks = 50 days) and, once a day between ticks,
 * mutates resource stocks per variant. Unlike the purse ledger this is in-loop: the engine's own
 * stock-tier phase, prosperity equilibrium and scarcity arcs read the mutated quantities, so the
 * feedback (scarce → prosperity falls → demand falls → recovery) is the engine's, not the sketch's.
 *
 * Variants:
 *   today   — no change (baseline; stocks only move by god verbs, rival drain, anomaly finds)
 *   shocks  — (a) static + shocks: every SHOCK_EVERY_DAYS a seeded blight (−25) or bounty (+25)
 *             lands on one staple at one resourced place
 *   regrow  — (b) regrowth (logistic at renewalRate) and local use (demand × scarcitySensitivity)
 *   flow    — (c) regrow + every unthreatened trade lane moves a share of the balance gap in each
 *             staple/strategic good from the richer end to the poorer end
 *   flowcut — flow, and on CUT_DAY the lane that has carried the most staple so far is cut
 *             (a stand-in for an embargo, a blockade or a seized lane)
 *
 * Run:   npx esbuild scripts/proto/goods-flow-sketch.ts --bundle --platform=node --format=esm \
 *          --outfile=.cache/goods-flow.mjs --external:fs --external:path && node .cache/goods-flow.mjs <variant>
 */
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';
import { readTradeRouteProps } from '../../src/engine/tradeRoute';
import { computeLocationDemand, computeResourceBalance, readResources } from '../../src/engine/resourceEconomy';
import { getSublocationsAt } from '../../src/engine/graphQueries';
import { getResourceClass } from '../../src/data/resource-classes';
import { TICKS_PER_DAY } from '../../src/data/attention-constants';
import { hexDistance } from '../../src/lib/hexMath';
import type { WorldGraph } from '../../src/engine/graph';
import type { ResourceInstance } from '../../src/types/resource';

// ─── Tunables (named so the plan doc can lift them) ──────────────────────
const SEED = 42;
const TICKS = 600;
const SHOCK_EVERY_DAYS = 3;
const SHOCK_SIZE = 25;
const SHOCK_BLIGHT_SHARE = 0.6;
/** Logistic regrowth per day: renewalRate × REGROW_K × q × (1 − q/100). */
const REGROW_K = 0.06;
/** Floor so a renewable stock at 0 can come back (seed stock from the land). */
const REGROW_FLOOR_Q = 2;
/** Local use per day: USE_K × demand × scarcitySensitivity. */
const USE_K = 0.9;
/** Share of the balance gap (×100 quantity units / 2) a lane moves per day, scaled by volume/4. */
const FLOW_SHARE = 0.15;
const FLOW_MIN_GAP = 0.15;
/** An exporter only ships what it does not need: its own balance never falls below this. */
const EXPORT_FLOOR = 0.1;
const CUT_DAY = 20;
/** Hinterland: a settlement draws staples from unsettled resourced places within this many hexes. */
const HINTERLAND_RADIUS = 3;
/** Share of a field's spare a settlement draws per day (split among settlements that share it). */
const HINTERLAND_SHARE = 0.25;
const SETTLEMENT = new Set(['capital', 'city', 'town', 'hamlet']);

const variant = (process.argv[2] ?? 'today') as 'today' | 'shocks' | 'regrow' | 'flow' | 'flowcut' | 'hinter' | 'hintercut';
const OUT = `scripts/proto/goods-flow-${variant}.output.json`;

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rng = mulberry(SEED * 7919 + 1866);

const isTop = (g: WorldGraph, id: string) => !g.getNode(id)?.properties.parentLocationId;
function resourced(g: WorldGraph) {
  return g.getNodesByType('location').filter(n => !n.properties.parentLocationId && Object.keys(readResources(n.properties)).length > 0)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}
function demandOf(g: WorldGraph, id: string) {
  const n = g.getNode(id)!;
  return computeLocationDemand(n.properties, getSublocationsAt(g, id).length);
}
const clampQ = (q: number) => Math.max(0, Math.min(100, q));

// ─── Variant mutations, once a day ───────────────────────────────────────
const laneFlow = new Map<string, number>(); // lane key → cumulative staple moved
const cut = new Set<string>();
let cutInfo: { lane: string; from: string; to: string; carried: number } | null = null;
const shocks: { day: number; loc: string; res: string; delta: number }[] = [];

function regrowAndUse(g: WorldGraph) {
  for (const n of resourced(g)) {
    const d = demandOf(g, n.id);
    for (const [rid, r] of Object.entries(readResources(n.properties))) {
      const q = r.quantity ?? 0;
      const regrow = r.renewalRate * REGROW_K * Math.max(q, REGROW_FLOOR_Q * (r.renewalRate > 0 ? 1 : 0)) * (1 - q / 100);
      const use = USE_K * d * getResourceClass(rid).scarcitySensitivity;
      r.quantity = clampQ(q + regrow - use);
    }
  }
}

function laneKey(a: string, b: string) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

function flowAlongLanes(g: WorldGraph, day: number) {
  const lanes = g.getAllEdges().filter(e => e.type === 'trades_with' && isTop(g, e.source) && isTop(g, e.target));
  const seen = new Set<string>();
  if (variant === 'flowcut' && day === CUT_DAY && !cutInfo) {
    let best: [string, number] | null = null;
    for (const [k, v] of [...laneFlow.entries()].sort()) if (!best || v > best[1]) best = [k, v];
    if (best) { cut.add(best[0]); const [a, b] = best[0].split('|'); cutInfo = { lane: best[0], from: a, to: b, carried: best[1] }; }
  }
  for (const e of lanes) {
    const k = laneKey(e.source, e.target);
    if (seen.has(k)) continue; seen.add(k);
    const props = readTradeRouteProps(e.properties as Record<string, unknown>);
    if (props.threatened || cut.has(k)) continue;
    const A = g.getNode(e.source)!, B = g.getNode(e.target)!;
    const ra = readResources(A.properties), rb = readResources(B.properties);
    if (!A.properties.resources) A.properties.resources = ra;
    if (!B.properties.resources) B.properties.resources = rb;
    const dA = demandOf(g, A.id), dB = demandOf(g, B.id);
    const goods = new Set([...Object.keys(ra), ...Object.keys(rb)].filter(rid => {
      const c = getResourceClass(rid).category; return c === 'staple' || c === 'strategic';
    }));
    const volScale = Math.min(1, props.volume / 4);
    for (const rid of [...goods].sort()) {
      const ia: ResourceInstance = ra[rid] ?? { quantity: 0, renewable: false, renewalRate: 0 };
      const ib: ResourceInstance = rb[rid] ?? { quantity: 0, renewable: false, renewalRate: 0 };
      const ba = computeResourceBalance(ia, dA, rid), bb = computeResourceBalance(ib, dB, rid);
      const gap = ba - bb;
      if (Math.abs(gap) < FLOW_MIN_GAP) continue;
      const [src, dst, srcI, dstI, srcBag, dstBag] = gap > 0 ? [A, B, ia, ib, ra, rb] : [B, A, ib, ia, rb, ra];
      const srcD = gap > 0 ? dA : dB;
      const spare = Math.max(0, (srcI.quantity / 100 - srcD * getResourceClass(rid).scarcitySensitivity - EXPORT_FLOOR) * 100);
      const amt = Math.min(spare, FLOW_SHARE * Math.abs(gap) * 50 * volScale);
      if (amt <= 0.01) continue;
      srcI.quantity = clampQ(srcI.quantity - amt);
      dstI.quantity = clampQ(dstI.quantity + amt);
      if (!srcBag[rid]) srcBag[rid] = srcI;
      if (!dstBag[rid]) dstBag[rid] = dstI;
      if (getResourceClass(rid).category === 'staple') laneFlow.set(k, (laneFlow.get(k) ?? 0) + amt);
      void src; void dst;
    }
  }
}

const hinterFlow = new Map<string, number>(); // town|field → staple drawn
let hinterCut: { town: string; fields: string[]; drawn: number } | null = null;
const cutFields = new Set<string>();
function coordOf(g: WorldGraph, id: string) { const p = g.getNode(id)!.properties; return typeof p.hexCol === 'number' && typeof p.hexRow === 'number' ? { col: p.hexCol as number, row: p.hexRow as number } : null; }
function hinterland(g: WorldGraph, day: number) {
  const all = resourced(g);
  const towns = all.filter(n => SETTLEMENT.has(String(n.properties.locationSubtype)));
  const fields = all.filter(n => !SETTLEMENT.has(String(n.properties.locationSubtype)));
  if (variant === 'hintercut' && day === CUT_DAY && !hinterCut) {
    // Seize the fields of the settlement that has drawn the most so far (a siege of its countryside).
    const byTown = new Map<string, number>();
    for (const [k, v] of hinterFlow) { const t = k.split('|')[0]; byTown.set(t, (byTown.get(t) ?? 0) + v); }
    const best = [...byTown.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
    if (best) { const fs2 = [...hinterFlow.keys()].filter(k => k.startsWith(best[0] + '|')).map(k => k.split('|')[1]); fs2.forEach(f => cutFields.add(best[0] + '|' + f)); hinterCut = { town: best[0], fields: fs2, drawn: best[1] }; }
  }
  for (const f of fields) {
    const fc = coordOf(g, f.id); if (!fc) continue;
    const near = towns.filter(t => { const tc = coordOf(g, t.id); return tc && hexDistance(tc, fc) <= HINTERLAND_RADIUS && !cutFields.has(t.id + '|' + f.id); });
    if (near.length === 0) continue;
    const fd = demandOf(g, f.id);
    for (const [rid, fi] of Object.entries(readResources(f.properties))) {
      if (getResourceClass(rid).category !== 'staple') continue;
      const spare = Math.max(0, (fi.quantity / 100 - fd * getResourceClass(rid).scarcitySensitivity - EXPORT_FLOOR) * 100);
      if (spare <= 0.01) continue;
      // Neediest first: settlements whose own balance in this good is lowest.
      const needs = near.map(t => { const ti = readResources(t.properties)[rid]; const b = computeResourceBalance(ti ?? { quantity: 0, renewable: false, renewalRate: 0 }, demandOf(g, t.id), rid); return [t, b] as const; })
        .filter(([, b]) => b < 0.1).sort((a, b) => a[1] - b[1] || (a[0].id < b[0].id ? -1 : 1));
      if (needs.length === 0) continue;
      const each = (spare * HINTERLAND_SHARE) / needs.length;
      for (const [t] of needs) {
        const bag = readResources(t.properties); if (!t.properties.resources) t.properties.resources = bag;
        const ti = bag[rid] ?? (bag[rid] = { quantity: 0, renewable: false, renewalRate: 0 });
        const amt = Math.min(each, 100 - ti.quantity, fi.quantity);
        if (amt <= 0) continue;
        fi.quantity = clampQ(fi.quantity - amt); ti.quantity = clampQ(ti.quantity + amt);
        hinterFlow.set(t.id + '|' + f.id, (hinterFlow.get(t.id + '|' + f.id) ?? 0) + amt);
      }
    }
  }
}

function shock(g: WorldGraph, day: number) {
  if (day % SHOCK_EVERY_DAYS !== 0) return;
  const cands = resourced(g).flatMap(n => Object.keys(readResources(n.properties))
    .filter(rid => getResourceClass(rid).category === 'staple').map(rid => [n, rid] as const));
  if (cands.length === 0) return;
  const [n, rid] = cands[Math.floor(rng() * cands.length)];
  const delta = rng() < SHOCK_BLIGHT_SHARE ? -SHOCK_SIZE : SHOCK_SIZE;
  const r = readResources(n.properties)[rid];
  r.quantity = clampQ(r.quantity + delta);
  shocks.push({ day, loc: n.id, res: rid, delta });
}

// ─── Daily observation ───────────────────────────────────────────────────
interface DayObs {
  day: number;
  /** loc → rid → [quantity, tier] for staple+strategic */
  stocks: Record<string, Record<string, [number, string]>>;
  prosperity: Record<string, number>;
  unrest: Record<string, number>;
  arcs: Record<string, string>;
}
function observe(g: WorldGraph, day: number): DayObs {
  const o: DayObs = { day, stocks: {}, prosperity: {}, unrest: {}, arcs: {} };
  for (const n of g.getNodesByType('location')) {
    if (n.properties.parentLocationId) continue;
    const bag = readResources(n.properties);
    const s: Record<string, [number, string]> = {};
    for (const [rid, r] of Object.entries(bag)) {
      const c = getResourceClass(rid).category;
      if (c === 'staple' || c === 'strategic') s[rid] = [Math.round(r.quantity * 10) / 10, r.stockTier ?? 'unset'];
    }
    if (Object.keys(s).length) o.stocks[n.id] = s;
    if (typeof n.properties.prosperity === 'number') o.prosperity[n.id] = Math.round(n.properties.prosperity as number);
    if (typeof n.properties.unrest === 'number' && (n.properties.unrest as number) > 0) o.unrest[n.id] = Math.round(n.properties.unrest as number);
    const arc = n.properties.scarcityArc as { phase: string; resourceId: string } | undefined;
    if (arc) o.arcs[n.id] = `${arc.resourceId}:${arc.phase}`;
  }
  return o;
}

// ─── Run ─────────────────────────────────────────────────────────────────
resetEventCounter();
const runtime = createSimulationRuntime();
const archetype = generateArchetypes(4, SEED)[0];
const preset = MAP_SIZE_PRESETS['medium'];
let { state } = initializeGameState(archetype, 'GoodsFlow', createBalancedCosmology(), SEED, preset.cols, preset.rows);
const g0 = state.graph;
const meta = {
  locs: Object.fromEntries(g0.getNodesByType('location').filter(n => !n.properties.parentLocationId)
    .map(n => [n.id, { name: n.name, subtype: n.properties.locationSubtype ?? '?' }])),
};
const days: DayObs[] = [observe(state.graph, 0)];
const chron: { tick: number; title: string; prose: string }[] = [];
const seenChron = new Set<string>();
const t0 = Date.now();
for (let i = 0; i < TICKS; i++) {
  state = runTick(state, [], runtime);
  for (const c of state.chronicleEntries) {
    if (seenChron.has(c.id)) continue; seenChron.add(c.id);
    if ((c.promptContext as { mood?: string } | undefined)?.mood === 'economic' || /famine|glut|scarc|shortage|harvest|grain|hunger|plenty/i.test(c.title ?? '')) {
      chron.push({ tick: c.tick, title: c.title, prose: (c.prose ?? '').slice(0, 220) });
    }
  }
  if (state.tick % TICKS_PER_DAY === 0) {
    const day = state.tick / TICKS_PER_DAY;
    if (variant === 'shocks') shock(state.graph, day);
    if (variant === 'regrow' || variant === 'flow' || variant === 'flowcut' || variant === 'hinter' || variant === 'hintercut') regrowAndUse(state.graph);
    if (variant === 'hinter' || variant === 'hintercut') hinterland(state.graph, day);
    if (variant === 'flow' || variant === 'flowcut') flowAlongLanes(state.graph, day);
    days.push(observe(state.graph, day));
    if (day % 10 === 0) process.stderr.write(`${variant} day ${day} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
}
const lanesEnd = state.graph.getAllEdges().filter(e => e.type === 'trades_with').map(e => ({ a: e.source, b: e.target, ...readTradeRouteProps(e.properties as Record<string, unknown>) }));
fs.writeFileSync(OUT, JSON.stringify({ variant, meta, days, chron, shocks, cutInfo, laneFlow: Object.fromEntries(laneFlow), lanesEnd, hinterCut, hinterFlow: Object.fromEntries(hinterFlow) }));
process.stderr.write(`${variant} done → ${OUT}\n`);
