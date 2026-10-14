/**
 * THR-1867 faction purse — OBSERVER LEDGER SKETCH. Throwaway; never merged.
 *
 * The world runs unmodified (seed 42, medium, 600 ticks). Every PURSE_CYCLE_TICKS the ledger
 * snapshots the graph (controls edges, held locations' prosperity + resource bags, guild homes'
 * sublocations + lanes, the realm projection's hex terrains, armies, trade-route tolls) and then
 * accounts income/spend per faction under `src/data/faction-purse-constants.ts`.
 *
 * CAVEAT: spending never feeds back. Ledger treasuries are not the engine's `wealth`; an army the
 * ledger says a faction "cannot afford" still exists in the world, and nothing the world does
 * reads these numbers.
 *
 * Run:   npx esbuild scripts/proto/faction-purse-ledger.ts --bundle --platform=node --format=esm \
 *          --outfile=.cache/purse.mjs --external:fs --external:path && node .cache/purse.mjs
 *        add `--cached` to re-account the saved snapshots without re-running the world.
 */
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';
import { buildRealmProjection } from '../../src/engine/realmProjection';
import { readTradeRouteProps } from '../../src/engine/tradeRoute';
import { getResourceClass } from '../../src/data/resource-classes';
import { WEALTH_ROUTE_CONTROL_INCOME } from '../../src/engine/wealth';
import { ARMY_CREATION_GOLD_COST, ARMY_MAINTENANCE_COST } from '../../src/types/army';
import type { ArmySizeCategory } from '../../src/types/army';
import { COMMISSION_QUEST_COST, BOUNTY_COST } from '../../src/types/factionAction';
import { GUILD_WAREHOUSE_THRESHOLD, GUILD_COUNTING_HOUSE_THRESHOLD } from '../../src/engine/phaseSublocations';
import { TICKS_PER_DAY } from '../../src/data/attention-constants';
import type { WorldGraph } from '../../src/engine/graph';
import * as C from '../../src/data/faction-purse-constants';

const SEED = 42;
const TICKS = 600;
const CACHE = '.cache/faction-purse-snapshots.json';
const OUT = 'scripts/proto/faction-purse-ledger.output.txt';
/** Counterfactual for T3: faction_2 loses this town at this day. */
const CF_FACTION = 'faction_2';
const CF_TOWN = 'loc_7';
const CF_LOSS_DAY = 25;

// ─── Snapshot (pure read of the world) ───────────────────────────────────

interface LocSnap { name: string; subtype: string; prosperity: number; resources: Record<string, { q: number; tier: string }>; sublocTypes: string[]; lanes: number }
interface FactionSnap { id: string; name: string; cls: string; guildType?: string; defId?: string; home?: string }
interface Snap {
  tick: number;
  factions: FactionSnap[];
  controls: { src: string; tgt: string }[];
  locs: Record<string, LocSnap>;
  realmTerrain: Record<string, Record<string, number>>;
  unclaimedTerrain: Record<string, number>;
  realmTerrainCF: Record<string, Record<string, number>>;
  routes: { by: string; volume: number; taxRate: number; threatened: boolean }[];
  armies: { id: string; faction: string; size: ArmySizeCategory; raisedTick: number; warhost: boolean }[];
}

function terrainCounts(proj: ReturnType<typeof buildRealmProjection>, tileTerrain: Map<string, string>) {
  const out: Record<string, Record<string, number>> = {};
  for (const r of proj.realms) {
    const m: Record<string, number> = {};
    for (const h of r.hexes) { const t = tileTerrain.get(`${h.col},${h.row}`) ?? '?'; m[t] = (m[t] ?? 0) + 1; }
    out[r.id] = m;
  }
  return out;
}

function snapshot(state: { tick: number; graph: WorldGraph; tiles: { coord: { col: number; row: number }; terrain: string }[] }): Snap {
  const g = state.graph;
  const factions: FactionSnap[] = g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction').map(n => ({
    id: n.id, name: n.name ?? n.id,
    cls: String(n.properties.factionClass ?? n.properties.factionType ?? '?'),
    guildType: n.properties.guildType as string | undefined,
    defId: n.properties.factionDefId as string | undefined,
    home: n.properties.homeLocationId as string | undefined,
  }));
  const controls = g.getAllEdges().filter(e => e.type === 'controls').map(e => ({ src: e.source, tgt: e.target }));
  const sublocsByParent = new Map<string, string[]>();
  for (const n of g.getNodesByType('location')) {
    const p = n.properties.parentLocationId as string | undefined;
    if (!p) continue;
    const t = String(n.properties.sublocationTypeId ?? n.properties.locationSubtype ?? '').replace('sublocation-type.', '');
    (sublocsByParent.get(p) ?? sublocsByParent.set(p, []).get(p)!).push(t);
  }
  const tradeEdges = g.getAllEdges().filter(e => e.type === 'trades_with');
  const wanted = new Set<string>([...controls.map(c => c.tgt), ...factions.map(f => f.home).filter((h): h is string => !!h)]);
  const locs: Record<string, LocSnap> = {};
  for (const id of wanted) {
    const n = g.getNode(id);
    if (!n) continue;
    const res: Record<string, { q: number; tier: string }> = {};
    const bag = n.properties.resources as Record<string, { quantity?: number; stockTier?: string }> | undefined;
    for (const [rid, r] of Object.entries(bag ?? {})) res[rid] = { q: r.quantity ?? 0, tier: r.stockTier ?? 'adequate' };
    locs[id] = {
      name: n.name ?? id,
      subtype: String(n.properties.locationSubtype ?? n.properties.sublocationTypeId ?? '?'),
      prosperity: typeof n.properties.prosperity === 'number' ? n.properties.prosperity : 0,
      resources: res,
      sublocTypes: sublocsByParent.get(id) ?? [],
      lanes: tradeEdges.filter(e => e.source === id || e.target === id).length,
    };
  }
  const tileTerrain = new Map(state.tiles.map(t => [`${t.coord.col},${t.coord.row}`, t.terrain]));
  const proj = buildRealmProjection(g, state.tiles as never);
  const unclaimed: Record<string, number> = {};
  for (const t of state.tiles) if (!proj.hexRealmId.has(`${t.coord.col},${t.coord.row}`)) unclaimed[t.terrain] = (unclaimed[t.terrain] ?? 0) + 1;
  // Counterfactual projection: the same graph seen through a proxy that hides one controls edge.
  const cfGraph = new Proxy(g, {
    get(target, prop, recv) {
      if (prop === 'getOutgoingEdges') {
        return (id: string, type?: string) => target.getOutgoingEdges(id, type as never)
          .filter(e => !(e.type === 'controls' && e.source === CF_FACTION && e.target === CF_TOWN));
      }
      const v = Reflect.get(target, prop, recv);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  const projCF = buildRealmProjection(cfGraph as WorldGraph, state.tiles as never);
  const routes = tradeEdges.map(e => readTradeRouteProps(e.properties as Record<string, unknown>))
    .filter(p => p.controlledBy).map(p => ({ by: p.controlledBy!, volume: p.volume, taxRate: p.taxRate, threatened: p.threatened }));
  const armies = g.getNodesByType('actor').filter(n => n.properties.armyState).map(n => {
    const as = n.properties.armyState as { size: ArmySizeCategory; raisedTick: number };
    return { id: n.id, faction: g.getOutgoingEdges(n.id, 'member_of')[0]?.target ?? '', size: as.size, raisedTick: as.raisedTick, warhost: n.properties.warhost === true };
  });
  return {
    tick: state.tick, factions, controls, locs,
    realmTerrain: terrainCounts(proj, tileTerrain), unclaimedTerrain: unclaimed,
    realmTerrainCF: terrainCounts(projCF, tileTerrain), routes, armies,
  };
}

function runWorld(): Snap[] {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(archetype, 'PurseLedger', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  const snaps: Snap[] = [snapshot(state)];
  const t0 = Date.now();
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    if (state.tick % C.PURSE_CYCLE_TICKS === 0) {
      snaps.push(snapshot(state));
      process.stderr.write(`tick ${state.tick} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
  }
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(snaps));
  return snaps;
}

// ─── Accounting ──────────────────────────────────────────────────────────

interface Income { town: number; place: number; land: number; guildTax: number; guildOwn: number; tolls: number }
const zero = (): Income => ({ town: 0, place: 0, land: 0, guildTax: 0, guildOwn: 0, tolls: 0 });
const total = (i: Income) => i.town + i.place + i.land + i.guildTax + i.guildOwn + i.tolls;

function townTax(l: LocSnap): number {
  if (!C.SETTLEMENT_TIER_SUBTYPES.includes(l.subtype)) return 0;
  return C.TOWN_TAX_BASE * l.prosperity / C.TOWN_TAX_PROSPERITY_PIVOT;
}
function placeYield(l: LocSnap): number {
  let s = 0;
  for (const [rid, r] of Object.entries(l.resources)) {
    s += (r.q / 100) * (C.YIELD_RATE[getResourceClass(rid).category] ?? 0) * (C.STOCK_TIER_MULT[r.tier] ?? 1);
  }
  return s;
}
function landRent(terr: Record<string, number> | undefined): number {
  let s = 0;
  for (const [t, n] of Object.entries(terr ?? {})) s += n * C.HEX_RENT[C.TERRAIN_RENT_CATEGORY[t] ?? 'none'];
  return s;
}
function affinityOf(f: FactionSnap): string | undefined {
  if (f.guildType) return f.guildType;
  if (f.defId) return C.DEFINITION_FACTION_AFFINITY[f.defId];
  return undefined;
}
function guildUnits(aff: C.GuildAffinity, l: LocSnap): number {
  let u = 0;
  for (const rid of aff.resources) u += l.resources[rid]?.q ?? 0;
  for (const t of l.sublocTypes) if (aff.sublocationTypes.includes(t)) u += C.GUILD_SUBLOCATION_UNITS;
  if (aff.lanes) u += l.lanes * C.GUILD_LANE_UNITS;
  if (aff.townTaxShare) u += l.prosperity * C.BANKER_TAX_BASE_SHARE;
  return u;
}

/** One day's income for every faction. `hideEdge` drops one controls edge (the T3 counterfactual). */
function accountDay(s: Snap, hideEdge?: { src: string; tgt: string }, terrainOverride?: Record<string, Record<string, number>>): Map<string, Income> {
  const out = new Map<string, Income>();
  const inc = (id: string) => out.get(id) ?? out.set(id, zero()).get(id)!;
  for (const f of s.factions) inc(f.id);
  const controls = s.controls.filter(c => !(hideEdge && c.src === hideEdge.src && c.tgt === hideEdge.tgt));
  for (const c of controls) {
    const l = s.locs[c.tgt];
    if (!l || !out.has(c.src)) continue;
    inc(c.src).town += townTax(l);
    inc(c.src).place += placeYield(l);
  }
  const terr = terrainOverride ?? s.realmTerrain;
  for (const [rid, t] of Object.entries(terr)) inc(rid).land += landRent(t);
  for (const r of s.routes) {
    if (!out.has(r.by) || r.threatened || r.volume <= 0) continue;
    inc(r.by).tolls += WEALTH_ROUTE_CONTROL_INCOME * Math.max(1, Math.round(r.volume * r.taxRate));
  }
  // Guild cut: same-affinity factions sharing a home town split it evenly.
  const groups = new Map<string, FactionSnap[]>();
  for (const f of s.factions) {
    const a = affinityOf(f);
    if (!a || !f.home || !C.GUILD_PLACE_AFFINITY[a]) continue;
    const k = `${f.home}|${a}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(f);
  }
  for (const [k, members] of groups) {
    const [home, a] = k.split('|');
    const l = s.locs[home];
    if (!l) continue;
    const gross = guildUnits(C.GUILD_PLACE_AFFINITY[a], l) / 100 * C.GUILD_RATE / members.length;
    const holders = controls.filter(c => c.tgt === home).map(c => c.src);
    for (const m of members) {
      const taxed = holders.filter(h => h !== m.id);
      const tax = taxed.length > 0 ? gross * C.LANDHOLDER_TAX_RATE : 0;
      inc(m.id).guildOwn += gross - tax;
      for (const h of taxed) inc(h).guildTax += tax / taxed.length;
    }
  }
  return out;
}

const upkeepPerDay = (size: ArmySizeCategory) => ARMY_MAINTENANCE_COST[size] * C.ARMY_UPKEEP_SCALE;

function meansWord(treasury: number, upkeep: number): string {
  if (upkeep > 0) {
    const days = treasury / upkeep;
    return C.MEANS_BANDS_DAYS.find(b => days < b.below)!.word;
  }
  return C.MEANS_BANDS_ABSOLUTE.find(b => treasury < b.below)!.word + '*';
}

interface Row { day: number; inc: Income; spendArmy: number; spendUpkeep: number; upkeep: number; armies: string; balance: number; means: string }

function ledger(snaps: Snap[]) {
  const rows = new Map<string, Row[]>();
  const bal = new Map<string, number>();
  const seenArmies = new Set<string>(snaps[0].armies.map(a => a.id));
  const raised: string[] = [];
  for (const s of snaps.slice(1)) {
    const day = s.tick / TICKS_PER_DAY;
    const incomes = accountDay(s);
    const newArmies = s.armies.filter(a => !seenArmies.has(a.id));
    for (const a of newArmies) { seenArmies.add(a.id); raised.push(`day ${day}: ${a.id} (${a.size}${a.warhost ? ', warhost' : ''}) for ${a.faction}`); }
    for (const [id, inc] of incomes) {
      const fielded = s.armies.filter(a => a.faction === id);
      const upkeep = fielded.reduce((x, a) => x + upkeepPerDay(a.size), 0);
      const spendArmy = newArmies.filter(a => a.faction === id && !a.warhost).length * ARMY_CREATION_GOLD_COST;
      const b = Math.min(C.FACTION_TREASURY_CAP, (bal.get(id) ?? 0) + total(inc) - upkeep - spendArmy);
      bal.set(id, b);
      (rows.get(id) ?? rows.set(id, []).get(id)!).push({
        day, inc, spendArmy, spendUpkeep: upkeep, upkeep,
        armies: fielded.map(a => a.size[0].toUpperCase()).join('') || '-', balance: b, means: meansWord(b, upkeep),
      });
    }
  }
  return { rows, raised };
}

// ─── Report ──────────────────────────────────────────────────────────────

const f1 = (n: number) => n.toFixed(1).padStart(7);
function main() {
  const snaps: Snap[] = process.argv.includes('--cached') && fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : runWorld();
  const lines: string[] = [];
  const p = (s = '') => lines.push(s);
  const last = snaps[snaps.length - 1];
  const nameOf = (id: string) => last.factions.find(f => f.id === id)?.name ?? snaps[0].factions.find(f => f.id === id)?.name ?? id;

  p('THR-1867 faction purse — observer ledger (THROWAWAY prototype, never merged)');
  p(`seed ${SEED} medium · ${TICKS} ticks · cycle ${C.PURSE_CYCLE_TICKS} ticks = 1 day (TICKS_PER_DAY ${TICKS_PER_DAY}) · ${snaps.length - 1} cycles`);
  p('CAVEAT: the world runs unmodified. Spending never feeds back: ledger treasuries are not engine wealth.');
  p('');
  p('Constants: ' + JSON.stringify({
    FACTION_TREASURY_CAP: C.FACTION_TREASURY_CAP, TOWN_TAX_BASE: C.TOWN_TAX_BASE, YIELD_RATE: C.YIELD_RATE,
    STOCK_TIER_MULT: C.STOCK_TIER_MULT, HEX_RENT: C.HEX_RENT, GUILD_RATE: C.GUILD_RATE,
    GUILD_SUBLOCATION_UNITS: C.GUILD_SUBLOCATION_UNITS, GUILD_LANE_UNITS: C.GUILD_LANE_UNITS,
    BANKER_TAX_BASE_SHARE: C.BANKER_TAX_BASE_SHARE, LANDHOLDER_TAX_RATE: C.LANDHOLDER_TAX_RATE,
    ARMY_UPKEEP_SCALE: C.ARMY_UPKEEP_SCALE,
    ARMY_UPKEEP_PER_DAY: { warband: upkeepPerDay('warband'), regiment: upkeepPerDay('regiment'), host: upkeepPerDay('host') },
    ARMY_CREATION_GOLD_COST, COMMISSION_QUEST_COST, BOUNTY_COST, GUILD_WAREHOUSE_THRESHOLD, GUILD_COUNTING_HOUSE_THRESHOLD,
  }));
  p('');

  // Hex census
  p('== Hex rent census (realm projection, day 0 and final day) ==');
  for (const [label, s] of [['day 0', snaps[0]], [`day ${last.tick / TICKS_PER_DAY}`, last]] as const) {
    p(`-- ${label}`);
    for (const [rid, t] of Object.entries(s.realmTerrain)) {
      const byCat: Record<string, number> = {};
      for (const [ter, n] of Object.entries(t)) { const c = C.TERRAIN_RENT_CATEGORY[ter] ?? 'none'; byCat[c] = (byCat[c] ?? 0) + n; }
      const n = Object.values(t).reduce((a, b) => a + b, 0);
      p(`  ${rid.padEnd(10)} ${String(n).padStart(4)} hexes ${JSON.stringify(byCat)} rent/day ${landRent(t).toFixed(2)}`);
    }
    const byCat: Record<string, number> = {};
    for (const [ter, n] of Object.entries(s.unclaimedTerrain)) { const c = C.TERRAIN_RENT_CATEGORY[ter] ?? 'none'; byCat[c] = (byCat[c] ?? 0) + n; }
    p(`  unclaimed  ${String(Object.values(s.unclaimedTerrain).reduce((a, b) => a + b, 0)).padStart(4)} hexes ${JSON.stringify(byCat)} potential rent/day ${landRent(s.unclaimedTerrain).toFixed(2)}`);
  }
  p('');

  const { rows, raised } = ledger(snaps);
  p('== Armies raised during the run (charged ARMY_CREATION_GOLD_COST unless warhost) ==');
  p(raised.length ? raised.map(r => '  ' + r).join('\n') : '  none');
  p(`  fielded at day 0: ${snaps[0].armies.map(a => `${a.id}=${a.size}`).join(', ')}`);
  p(`  fielded at final: ${last.armies.map(a => `${a.id}=${a.size}`).join(', ') || 'none'}`);
  p('');

  const focus = ['faction_0', 'faction_1', 'faction_2', 'faction_def_merchant_consortium'];
  for (const id of focus) {
    const r = rows.get(id);
    if (!r) { p(`== ${id}: absent`); continue; }
    p(`== Ledger: ${id} ${nameOf(id)} (per day; armies W/R/H fielded; Means = treasury ÷ upkeep/day, * = absolute fallback, upkeep 0) ==`);
    p(' day    town   place    land guildTx guildOwn  tolls | income  upkeep  raise | balance  armies means');
    for (const x of r) {
      p(`${String(x.day).padStart(4)} ${f1(x.inc.town)} ${f1(x.inc.place)} ${f1(x.inc.land)} ${f1(x.inc.guildTax)} ${f1(x.inc.guildOwn)} ${f1(x.inc.tolls)} | ${f1(total(x.inc))} ${f1(x.spendUpkeep)} ${f1(x.spendArmy)} | ${f1(x.balance)}  ${x.armies.padEnd(6)} ${x.means}`);
    }
    const sum = r.reduce((a, x) => { a.town += x.inc.town + x.inc.guildTax; a.place += x.inc.place; a.land += x.inc.land; return a; }, { town: 0, place: 0, land: 0 });
    const tt = sum.town + sum.place + sum.land;
    p(`  split over run (guild tax folded into towns, tolls/own-guild excluded): towns ${(100 * sum.town / tt).toFixed(1)}% · places ${(100 * sum.place / tt).toFixed(1)}% · land ${(100 * sum.land / tt).toFixed(1)}%`);
    p('');
  }

  // First-afford days
  p('== First day each treasury could afford ==');
  const thresholds: [string, number][] = [['quest', COMMISSION_QUEST_COST], ['bounty', BOUNTY_COST], ['warehouse', GUILD_WAREHOUSE_THRESHOLD], ['army', ARMY_CREATION_GOLD_COST], ['counting house', GUILD_COUNTING_HOUSE_THRESHOLD]];
  for (const id of focus) {
    const r = rows.get(id) ?? [];
    p(`  ${id.padEnd(32)} ` + thresholds.map(([k, v]) => `${k}(${v}): ${r.find(x => x.balance >= v)?.day ?? 'never'}`).join(' · '));
  }
  p('');

  // T2: faction_0 army cadence
  const r0 = rows.get('faction_0') ?? [];
  const net0 = r0.map(x => total(x.inc) - x.spendUpkeep);
  const avgNet0 = net0.reduce((a, b) => a + b, 0) / Math.max(1, net0.length);
  const inc0 = r0.reduce((a, x) => a + total(x.inc), 0) / Math.max(1, r0.length);
  const fieldedDays0 = r0.filter(x => x.armies !== '-').length;
  p(`== T2 faction_0: mean income/day ${inc0.toFixed(2)}; fielded an army on ${fieldedDays0}/${r0.length} days`);
  p(`     net after upkeep on what it actually fielded ${avgNet0.toFixed(2)}/day → a new army (${ARMY_CREATION_GOLD_COST}) every ${(ARMY_CREATION_GOLD_COST / avgNet0).toFixed(1)} days`);
  p(`     net with one regiment fielded every day ${(inc0 - upkeepPerDay('regiment')).toFixed(2)}/day → a new army every ${(ARMY_CREATION_GOLD_COST / (inc0 - upkeepPerDay('regiment'))).toFixed(1)} days`);
  // T3 faction_1
  const r1 = rows.get('faction_1') ?? [];
  const avgNet1 = r1.reduce((a, x) => a + total(x.inc) - x.spendUpkeep, 0) / Math.max(1, r1.length);
  const one1 = r1.reduce((a, x) => a + total(x.inc), 0) / Math.max(1, r1.length);
  p(`== T3 faction_1: mean income/day ${one1.toFixed(2)}; mean net/day with what it fields ${avgNet1.toFixed(2)}; min balance ${Math.min(...r1.map(x => x.balance)).toFixed(1)}`);
  for (const sz of ['warband', 'regiment', 'host'] as ArmySizeCategory[]) p(`     sustains one ${sz} (${upkeepPerDay(sz)}/day)? ${one1 >= upkeepPerDay(sz) ? 'yes' : 'no'}`);
  // T3 faction_2 counterfactual
  p(`== T3 faction_2 counterfactual: loses ${CF_TOWN} at day ${CF_LOSS_DAY}, keeps fielding one army ==`);
  let b2 = rows.get(CF_FACTION)?.find(x => x.day === CF_LOSS_DAY)?.balance ?? 0;
  let brokeDay: number | null = null;
  const cfIncomes: number[] = [];
  for (const s of snaps.slice(1)) {
    const day = s.tick / TICKS_PER_DAY;
    if (day <= CF_LOSS_DAY) continue;
    const inc = accountDay(s, { src: CF_FACTION, tgt: CF_TOWN }, s.realmTerrainCF).get(CF_FACTION) ?? zero();
    const fielded = s.armies.filter(a => a.faction === CF_FACTION);
    const upkeep = fielded.length ? fielded.reduce((x, a) => x + upkeepPerDay(a.size), 0) : upkeepPerDay('regiment');
    b2 += total(inc) - upkeep;
    cfIncomes.push(total(inc));
    if (b2 < 0 && brokeDay === null) brokeDay = day;
  }
  const cfAvg = cfIncomes.reduce((a, b) => a + b, 0) / Math.max(1, cfIncomes.length);
  p(`  income/day without the town ${cfAvg.toFixed(2)} vs one regiment ${upkeepPerDay('regiment')}/day, warband ${upkeepPerDay('warband')}/day · start balance day ${CF_LOSS_DAY} ${(rows.get(CF_FACTION)?.find(x => x.day === CF_LOSS_DAY)?.balance ?? 0).toFixed(1)} (ledger, includes the world's own raises) · goes broke on day ${brokeDay ?? 'never (by day 50)'} · end balance ${b2.toFixed(1)}`);
  // Clean runway: treasury banked by day CF_LOSS_DAY with ONE regiment fielded and no raises, then the town is lost.
  let clean = 0;
  for (const s of snaps.slice(1)) {
    const day = s.tick / TICKS_PER_DAY;
    if (day > CF_LOSS_DAY) break;
    clean += total(accountDay(s).get(CF_FACTION) ?? zero()) - upkeepPerDay('regiment');
  }
  const cfNet = cfAvg - upkeepPerDay('regiment');
  p(`  clean runway (one regiment fielded from day 1, no raise charges): banked ${clean.toFixed(1)} by day ${CF_LOSS_DAY}; after the loss net ${cfNet.toFixed(2)}/day → ${cfNet < 0 ? `broke ${(clean / -cfNet).toFixed(0)} days later` : 'never broke'}`);
  // The real loss: who held loc_7 when
  const holderLine = snaps.map(s => `${s.tick / TICKS_PER_DAY}:${s.controls.filter(c => c.tgt === CF_TOWN).map(c => c.src).join('+') || 'none'}`);
  const changes = holderLine.filter((h, i) => i === 0 || h.split(':')[1] !== holderLine[i - 1].split(':')[1]);
  p(`  actual holders of ${CF_TOWN} (${snaps[0].locs[CF_TOWN]?.name}) by day: ${changes.join(' → ')}`);
  p('');

  // T5 town guilds
  p('== T5 town guilds (factionClass guild, guild_N): treasury on day 10 ==');
  const townGuilds = last.factions.filter(f => f.id.startsWith('guild_'));
  let affordQuest = 0;
  for (const f of townGuilds) {
    const r = rows.get(f.id) ?? [];
    const b10 = r.find(x => x.day === 10)?.balance ?? 0;
    if (b10 >= COMMISSION_QUEST_COST) affordQuest++;
    p(`  ${f.id.padEnd(9)} ${(f.guildType ?? '').padEnd(9)} home ${(f.home ?? '').padEnd(7)} day10 ${b10.toFixed(1).padStart(6)} · day50 ${(r[r.length - 1]?.balance ?? 0).toFixed(1).padStart(6)}`);
  }
  p(`  → ${affordQuest}/${townGuilds.length} town guilds can afford commission_quest (${COMMISSION_QUEST_COST}) by day 10`);
  p('');
  // T6
  let maxB = 0; let maxId = '';
  for (const [id, r] of rows) for (const x of r) if (x.balance > maxB) { maxB = x.balance; maxId = id; }
  p(`== T6 highest treasury anywhere in the run: ${maxB.toFixed(1)} (${maxId}) vs cap ${C.FACTION_TREASURY_CAP}`);
  // all-faction final table
  p('');
  p('== Every faction with any income or balance, final day (monster lairs and unhoused factions omitted) ==');
  for (const [id, r] of [...rows].filter(([, r]) => r.some(x => total(x.inc) > 0 || x.balance !== 0)).sort((a, b) => b[1][b[1].length - 1].balance - a[1][a[1].length - 1].balance)) {
    const x = r[r.length - 1];
    p(`  ${id.padEnd(34)} income/day ${total(x.inc).toFixed(2).padStart(6)} balance ${x.balance.toFixed(1).padStart(7)} ${x.means}`);
  }

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

main();
