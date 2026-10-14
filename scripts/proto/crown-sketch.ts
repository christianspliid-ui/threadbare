/**
 * THR-1917 crown and fealty — OBSERVER SKETCH over the THR-1867 faction purse ledger.
 * Throwaway; never merged.
 *
 * The world runs unmodified (seed 42, medium, 1,080 ticks = 90 days). Once a day the sketch
 * snapshots the graph (controls edges with influence, every place-tier Location with hex,
 * resources and sublocations, faction presence by hall / home / member agents, relations,
 * realm borders, armies with hex + strength, and every siege seen during the day). The
 * accounting then replays the purse ledger with the decided adjustments, and layers oaths
 * (vassal → liege) on top: courting, coerced oaths, fealty tax, loyalty, breaks, crowns.
 *
 * CAVEAT: nothing feeds back into the world. Oaths, purses, gifts and loyalty live only in
 * this ledger; an oath does not move an army, and a rebellion changes nothing on the map.
 *
 * Run:   npx esbuild scripts/proto/crown-sketch.ts --bundle --platform=node --format=esm \
 *          --outfile=.cache/crown.mjs --external:fs --external:path && node .cache/crown.mjs
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
import { ARMY_CREATION_GOLD_COST } from '../../src/types/army';
import type { ArmySizeCategory } from '../../src/types/army';
import { TICKS_PER_DAY } from '../../src/data/attention-constants';
import { hexDistance } from '../../src/lib/hexMath';
import type { WorldGraph } from '../../src/engine/graph';
import * as C from '../../src/data/faction-purse-constants';
import * as K from '../../src/data/crown-constants';

const SEED = 42;
const TICKS = 1080;
const CACHE = '.cache/crown-snapshots.json';
const OUT = 'scripts/proto/crown-sketch.output.txt';

// ─── Snapshot (pure read of the world) ───────────────────────────────────

type Hex = [number, number];
interface LocSnap {
  name: string; subtype: string; prosperity: number;
  resources: Record<string, { q: number; tier: string }>;
  sublocTypes: string[]; lanes: number; hex?: Hex; parent?: string;
}
interface FactionSnap {
  id: string; name: string; cls: string; guildType?: string; defId?: string; home?: string; monster?: boolean;
  /** top-level Location ids where it has a hall, base or home */
  halls: string[];
  /** top-level Location id → member agents located there */
  members: Record<string, number>;
}
interface ArmySnap { id: string; faction: string; size: ArmySizeCategory; raisedTick: number; warhost: boolean; strength: number; hex?: Hex; target?: string }
interface SiegeSnap { settlement: string; attacker: string; holders: string[]; tick: number }
interface Snap {
  tick: number;
  factions: FactionSnap[];
  controls: { src: string; tgt: string; inf: number }[];
  locs: Record<string, LocSnap>;
  realmTerrain: Record<string, Record<string, number>>;
  realmHexes: Record<string, string[]>;
  routes: { by: string; volume: number; taxRate: number; threatened: boolean }[];
  armies: ArmySnap[];
  sieges: SiegeSnap[];
  relations: { a: string; b: string; k: 'ally' | 'rival' | 'hostile' }[];
}

type G = WorldGraph;
function topLevel(g: G, id: string | undefined): string | undefined {
  if (!id) return undefined;
  const n = g.getNode(id);
  if (!n || n.type !== 'location') return undefined;
  const p = n.properties.parentLocationId as string | undefined;
  return p && g.getNode(p) ? p : id;
}
function hexOf(g: G, id: string | undefined): Hex | undefined {
  if (!id) return undefined;
  const n = g.getNode(id);
  if (!n) return undefined;
  const t = n.type === 'location' ? g.getNode(topLevel(g, id)!) ?? n : n;
  const col = t.properties.hexCol ?? t.properties.col;
  const row = t.properties.hexRow ?? t.properties.row;
  return typeof col === 'number' && typeof row === 'number' ? [col, row] : undefined;
}

function scanSieges(g: G, tick: number): SiegeSnap[] {
  const out: SiegeSnap[] = [];
  for (const n of g.getNodesByType('actor')) {
    const bs = n.properties.battleState as { battleType?: string; settlementId?: string; attackerArmyId?: string } | undefined;
    if (!bs || bs.battleType !== 'siege' || !bs.settlementId || !bs.attackerArmyId) continue;
    const attacker = g.getOutgoingEdges(bs.attackerArmyId, 'member_of')[0]?.target;
    if (!attacker) continue;
    out.push({ settlement: bs.settlementId, attacker, holders: g.getIncomingEdges(bs.settlementId, 'controls').map(e => e.source), tick });
  }
  return out;
}

function snapshot(state: { tick: number; graph: G; tiles: { coord: { col: number; row: number }; terrain: string }[] }, sieges: SiegeSnap[]): Snap {
  const g = state.graph;
  const actors = g.getNodesByType('actor');
  const factionNodes = actors.filter(n => n.properties.actorType === 'faction');
  const factionIds = new Set(factionNodes.map(n => n.id));
  const controls = g.getAllEdges().filter(e => e.type === 'controls')
    .map(e => ({ src: e.source, tgt: e.target, inf: typeof e.properties.influence === 'number' ? e.properties.influence : 0 }));

  // Locations: every place-tier Location, plus every controlled sublocation.
  const sublocsByParent = new Map<string, string[]>();
  const hallsByFaction = new Map<string, Set<string>>();
  const addHall = (f: string | undefined, loc: string | undefined) => {
    if (!f || !loc || !factionIds.has(f)) return;
    (hallsByFaction.get(f) ?? hallsByFaction.set(f, new Set()).get(f)!).add(loc);
  };
  for (const n of g.getNodesByType('location')) {
    const p = n.properties.parentLocationId as string | undefined;
    if (!p) continue;
    const t = String(n.properties.sublocationTypeId ?? n.properties.locationSubtype ?? '').replace('sublocation-type.', '');
    (sublocsByParent.get(p) ?? sublocsByParent.set(p, []).get(p)!).push(t);
    addHall(n.properties.factionId as string | undefined, p);
    addHall(n.properties.guildId as string | undefined, p);
  }
  const tradeEdges = g.getAllEdges().filter(e => e.type === 'trades_with');
  const controlled = new Set(controls.map(c => c.tgt));
  const locs: Record<string, LocSnap> = {};
  for (const n of g.getNodesByType('location')) {
    const p = n.properties.parentLocationId as string | undefined;
    if (p && !controlled.has(n.id)) continue;
    const res: Record<string, { q: number; tier: string }> = {};
    const bag = n.properties.resources as Record<string, { quantity?: number; stockTier?: string }> | undefined;
    for (const [rid, r] of Object.entries(bag ?? {})) res[rid] = { q: r.quantity ?? 0, tier: r.stockTier ?? 'adequate' };
    locs[n.id] = {
      name: n.name ?? n.id,
      subtype: String(n.properties.locationSubtype ?? n.properties.sublocationTypeId ?? '?'),
      prosperity: typeof n.properties.prosperity === 'number' ? n.properties.prosperity : 0,
      resources: res,
      sublocTypes: p ? [] : sublocsByParent.get(n.id) ?? [],
      lanes: p ? 0 : tradeEdges.filter(e => e.source === n.id || e.target === n.id).length,
      hex: hexOf(g, n.id),
      parent: p,
    };
  }
  // Faction halls (located_at edges, hall sublocations, home) and member agents.
  for (const f of factionNodes) {
    for (const e of g.getOutgoingEdges(f.id, 'located_at')) addHall(f.id, topLevel(g, e.target));
    addHall(f.id, topLevel(g, f.properties.homeLocationId as string | undefined));
  }
  const members = new Map<string, Record<string, number>>();
  for (const e of g.getAllEdges()) {
    if (e.type !== 'member_of' || !factionIds.has(e.target) || factionIds.has(e.source)) continue;
    const src = g.getNode(e.source);
    if (!src || src.properties.armyState) continue;
    const at = topLevel(g, g.getOutgoingEdges(e.source, 'located_at')[0]?.target);
    if (!at) continue;
    const m = members.get(e.target) ?? members.set(e.target, {}).get(e.target)!;
    m[at] = (m[at] ?? 0) + 1;
  }
  const factions: FactionSnap[] = factionNodes.map(n => ({
    id: n.id, name: n.name ?? n.id,
    cls: String(n.properties.factionClass ?? n.properties.factionType ?? '?'),
    guildType: n.properties.guildType as string | undefined,
    defId: n.properties.factionDefId as string | undefined,
    home: n.properties.homeLocationId as string | undefined,
    monster: n.properties.isMonsterFaction === true || n.properties.factionType === 'monster' ? true : undefined,
    halls: [...(hallsByFaction.get(n.id) ?? [])],
    members: members.get(n.id) ?? {},
  }));

  const relations: Snap['relations'] = [];
  for (const e of g.getAllEdges()) {
    if (!factionIds.has(e.source) || !factionIds.has(e.target)) continue;
    if (e.type === 'relates_to') {
      if (e.properties.isAlliance === true) relations.push({ a: e.source, b: e.target, k: 'ally' });
      if (e.properties.isRival === true) relations.push({ a: e.source, b: e.target, k: 'rival' });
    } else if (e.type === 'hostile_to') relations.push({ a: e.source, b: e.target, k: 'hostile' });
  }

  const tileTerrain = new Map(state.tiles.map(t => [`${t.coord.col},${t.coord.row}`, t.terrain]));
  const proj = buildRealmProjection(g, state.tiles as never);
  const realmTerrain: Record<string, Record<string, number>> = {};
  const realmHexes: Record<string, string[]> = {};
  for (const r of proj.realms) {
    const m: Record<string, number> = {};
    realmHexes[r.id] = [];
    for (const h of r.hexes) {
      const k = `${h.col},${h.row}`;
      const t = tileTerrain.get(k) ?? '?';
      m[t] = (m[t] ?? 0) + 1;
      realmHexes[r.id].push(k);
    }
    realmTerrain[r.id] = m;
  }
  const routes = tradeEdges.map(e => readTradeRouteProps(e.properties as Record<string, unknown>))
    .filter(p => p.controlledBy).map(p => ({ by: p.controlledBy!, volume: p.volume, taxRate: p.taxRate, threatened: p.threatened }));
  const armies: ArmySnap[] = actors.filter(n => n.properties.armyState).map(n => {
    const as = n.properties.armyState as { size: ArmySizeCategory; raisedTick: number; headcount?: number; cohesion?: number; cohesionMax?: number; objective?: { targetNodeId?: string } | null };
    const coh = as.cohesionMax && as.cohesionMax > 0 ? Math.max(0, (as.cohesion ?? as.cohesionMax) / as.cohesionMax) : 1;
    return {
      id: n.id, faction: g.getOutgoingEdges(n.id, 'member_of')[0]?.target ?? '', size: as.size, raisedTick: as.raisedTick,
      warhost: n.properties.warhost === true, strength: (as.headcount ?? 0) * coh,
      hex: hexOf(g, g.getOutgoingEdges(n.id, 'located_at')[0]?.target), target: as.objective?.targetNodeId,
    };
  });
  return { tick: state.tick, factions, controls, locs, realmTerrain, realmHexes, routes, armies, sieges, relations };
}

function runWorld(): Snap[] {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, SEED)[0];
  const preset = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(archetype, 'CrownSketch', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  const snaps: Snap[] = [snapshot(state, [])];
  const t0 = Date.now();
  let sieges: SiegeSnap[] = [];
  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    sieges.push(...scanSieges(state.graph, state.tick));
    if (state.tick % TICKS_PER_DAY === 0) {
      snaps.push(snapshot(state, sieges));
      sieges = [];
      process.stderr.write(`tick ${state.tick} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    }
  }
  fs.mkdirSync('.cache', { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(snaps));
  return snaps;
}

// ─── Purse accounting (THR-1867 ledger + the decided adjustments) ─────────

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

/** Derived per-snapshot lookups shared by income and oaths. */
interface World {
  s: Snap;
  fac: Map<string, FactionSnap>;
  hexRealm: Map<string, string>;
  /** top-level Location → its single town-tax holder */
  taxHolder: Map<string, string>;
  /** faction → top-level Locations it holds (controls, resolved up) */
  held: Map<string, Set<string>>;
  /** faction → every top-level Location it is present in (held + halls + members) */
  presence: Map<string, Set<string>>;
  rel: Map<string, 'ally' | 'rival' | 'hostile'>;
}
const top = (s: Snap, id: string) => s.locs[id]?.parent ?? id;
const hexKey = (h: Hex) => `${h[0]},${h[1]}`;

function buildWorld(s: Snap): World {
  const fac = new Map(s.factions.map(f => [f.id, f]));
  const hexRealm = new Map<string, string>();
  for (const [rid, hs] of Object.entries(s.realmHexes)) for (const h of hs) hexRealm.set(h, rid);
  const held = new Map<string, Set<string>>();
  for (const c of s.controls) (held.get(c.src) ?? held.set(c.src, new Set()).get(c.src)!).add(top(s, c.tgt));
  // Town tax: exactly one holder — the realm whose border the town lies in if that realm holds it,
  // else the strongest controller (highest controls.influence, ties to the lower id).
  const taxHolder = new Map<string, string>();
  const byTown = new Map<string, { src: string; inf: number }[]>();
  for (const c of s.controls) {
    if (s.locs[c.tgt]?.parent) continue; // a sublocation's controller does not collect the town's tax
    (byTown.get(c.tgt) ?? byTown.set(c.tgt, []).get(c.tgt)!).push(c);
  }
  for (const [town, cs] of byTown) {
    const hx = s.locs[town]?.hex;
    const borderRealm = hx ? hexRealm.get(hexKey(hx)) : undefined;
    if (borderRealm && cs.some(c => c.src === borderRealm)) { taxHolder.set(town, borderRealm); continue; }
    const best = [...cs].sort((a, b) => b.inf - a.inf || (a.src < b.src ? -1 : 1))[0];
    taxHolder.set(town, best.src);
  }
  const presence = new Map<string, Set<string>>();
  for (const f of s.factions) {
    const p = new Set<string>([...(held.get(f.id) ?? []), ...f.halls, ...Object.keys(f.members)]);
    presence.set(f.id, p);
  }
  const rel = new Map<string, 'ally' | 'rival' | 'hostile'>();
  for (const r of s.relations) {
    for (const k of [`${r.a}|${r.b}`, `${r.b}|${r.a}`]) {
      const cur = rel.get(k);
      if (r.k === 'ally' && !cur) rel.set(k, 'ally');
      if (r.k !== 'ally') rel.set(k, r.k); // rival / hostile outrank ally
    }
  }
  return { s, fac, hexRealm, taxHolder, held, presence, rel };
}

function accountDay(w: World): Map<string, Income> {
  const s = w.s;
  const out = new Map<string, Income>();
  const inc = (id: string) => out.get(id) ?? out.set(id, zero()).get(id)!;
  for (const f of s.factions) inc(f.id);
  for (const [town, holder] of w.taxHolder) { const l = s.locs[town]; if (l) inc(holder).town += townTax(l); }
  for (const c of s.controls) { const l = s.locs[c.tgt]; if (l) inc(c.src).place += placeYield(l); }
  for (const [rid, t] of Object.entries(s.realmTerrain)) inc(rid).land += landRent(t);
  for (const r of s.routes) {
    if (r.threatened || r.volume <= 0) continue;
    inc(r.by).tolls += WEALTH_ROUTE_CONTROL_INCOME * Math.max(1, Math.round(r.volume * r.taxRate));
  }
  // Guild cut: every town where the guild has a hall (home included) or members; same-affinity
  // factions present in one town split it evenly; the town's tax holder takes LANDHOLDER_TAX_RATE.
  const groups = new Map<string, FactionSnap[]>();
  for (const f of s.factions) {
    const a = affinityOf(f);
    if (!a || !C.GUILD_PLACE_AFFINITY[a]) continue;
    for (const town of new Set([...f.halls, ...Object.keys(f.members)])) {
      const k = `${town}|${a}`;
      (groups.get(k) ?? groups.set(k, []).get(k)!).push(f);
    }
  }
  for (const [k, members] of groups) {
    const [town, a] = k.split('|');
    const l = s.locs[town];
    if (!l) continue;
    const gross = guildUnits(C.GUILD_PLACE_AFFINITY[a], l) / 100 * C.GUILD_RATE / members.length;
    const holder = w.taxHolder.get(town);
    for (const m of members) {
      const tax = holder && holder !== m.id ? gross * C.LANDHOLDER_TAX_RATE : 0;
      inc(m.id).guildOwn += gross - tax;
      if (holder && tax > 0) inc(holder).guildTax += tax;
    }
  }
  return out;
}

function meansWord(treasury: number, upkeep: number): string {
  if (upkeep > 0) return C.MEANS_BANDS_DAYS.find(b => treasury / upkeep < b.below)!.word;
  return C.MEANS_BANDS_ABSOLUTE.find(b => treasury < b.below)!.word;
}

// ─── Oaths ───────────────────────────────────────────────────────────────

type Kind = 'persuaded' | 'bought' | 'coerced';
interface Parts { protection: number; gift: number; standing: number; pride: number; score: number; threat: number; liegeStr: number }
interface Oath {
  vassal: string; liege: string; taxShare: number; loyalty: number; swornDay: number; kind: Kind; parts: Parts;
  drops: { day: number; reason: string; amt: number }[];
  trace: { day: number; loyalty: number }[];
  taxPaid: number; giftPaid: number;
}
interface Broken extends Oath { brokeDay: number; reason: string; rebellion: boolean }

function canSwear(f: FactionSnap | undefined): boolean {
  if (!f || f.monster) return false;
  if (f.defId && K.NEVER_SWEAR_DEF_IDS.includes(f.defId)) return false;
  if (f.guildType && K.NEVER_SWEAR_GUILD_TYPES.includes(f.guildType)) return false;
  return f.cls === 'realm' || f.cls === 'guild' || !!f.defId;
}

function main() {
  const snaps: Snap[] = process.argv.includes('--cached') && fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : runWorld();
  const lines: string[] = [];
  const p = (x = '') => lines.push(x);
  const nameOf = new Map<string, string>();
  for (const s of snaps) for (const f of s.factions) nameOf.set(f.id, f.name);
  const nm = (id: string) => `${id} (${nameOf.get(id) ?? '?'})`;
  const f2 = (n: number) => n.toFixed(2);

  const bal = new Map<string, number>();
  const seenArmies = new Set<string>(snaps[0].armies.map(a => a.id));
  const oaths = new Map<string, Oath>(); // vassal → oath
  const broken: Broken[] = [];
  const cooldown = new Map<string, number>(); // `${vassal}|${liege}` → first day allowed again
  const events: string[] = [];
  const refusedOnce = new Set<string>();
  let refusals = 0;
  const lostTowns: { day: number; from: string; to: string; town: string }[] = [];
  const crownTrack = new Map<string, number[]>(); // liege → oath count per day
  const split = new Map<string, Map<number, { own: number; oath: number }>>(); // liege → day → income split
  let prevW: World = buildWorld(snaps[0]);
  let lastW = prevW;
  let lastIncome = new Map<string, number>();
  let lastUpkeep = new Map<string, number>();
  const days = snaps.length - 1;

  for (const s of snaps.slice(1)) {
    const day = s.tick / TICKS_PER_DAY;
    const w = buildWorld(s);
    lastW = w;
    const incomes = accountDay(w);
    const own = new Map<string, number>();
    for (const [id, i] of incomes) own.set(id, total(i));

    // Holdings lost since yesterday (controls edge gone or changed holder).
    const lostToday = new Map<string, number>();
    for (const c of prevW.s.controls) {
      const still = s.controls.some(x => x.src === c.src && x.tgt === c.tgt);
      if (still) continue;
      lostToday.set(c.src, (lostToday.get(c.src) ?? 0) + 1);
      const newHolder = s.controls.find(x => x.tgt === c.tgt)?.src;
      if (newHolder && !prevW.s.locs[c.tgt]?.parent) lostTowns.push({ day, from: c.src, to: newHolder, town: c.tgt });
    }

    // Purse: own income − upkeep − raises, then the fealty tax moves vassal → liege.
    const newArmies = s.armies.filter(a => !seenArmies.has(a.id));
    for (const a of newArmies) seenArmies.add(a.id);
    const upkeep = new Map<string, number>();
    for (const a of s.armies) upkeep.set(a.faction, (upkeep.get(a.faction) ?? 0) + K.ARMY_UPKEEP_PER_DAY[a.size]);
    for (const [id, x] of own) {
      const raise = newArmies.filter(a => a.faction === id && !a.warhost).length * ARMY_CREATION_GOLD_COST;
      bal.set(id, (bal.get(id) ?? 0) + x - (upkeep.get(id) ?? 0) - raise);
    }
    const oathIncome = new Map<string, number>();
    for (const o of oaths.values()) {
      const t = o.taxShare * Math.max(0, own.get(o.vassal) ?? 0);
      bal.set(o.vassal, (bal.get(o.vassal) ?? 0) - t);
      bal.set(o.liege, (bal.get(o.liege) ?? 0) + t);
      oathIncome.set(o.liege, (oathIncome.get(o.liege) ?? 0) + t);
      o.taxPaid += t;
    }
    for (const [id, b] of bal) bal.set(id, Math.min(C.FACTION_TREASURY_CAP, b));
    const fullInc = (id: string) => (own.get(id) ?? 0) + (oathIncome.get(id) ?? 0);
    const means = (id: string) => meansWord(bal.get(id) ?? 0, upkeep.get(id) ?? 0);
    lastIncome = new Map([...own.keys()].map(id => [id, fullInc(id)]));
    lastUpkeep = upkeep;

    const lieges = () => new Set([...oaths.values()].map(o => o.liege));
    const realms = s.factions.filter(f => f.cls === 'realm' && (w.held.get(f.id)?.size ?? 0) > 0).map(f => f.id);
    const realmHexSet = new Map(realms.map(r => [r, new Set(s.realmHexes[r] ?? [])]));

    // Candidate set for a realm: presence inside its border or its towns, plus neighbouring realms.
    const candidatesOf = (R: string): Set<string> => {
      const out = new Set<string>();
      const hexes = realmHexSet.get(R) ?? new Set<string>();
      const myTowns = w.held.get(R) ?? new Set<string>();
      for (const f of s.factions) {
        if (f.id === R) continue;
        for (const loc of w.presence.get(f.id) ?? []) {
          const hx = s.locs[loc]?.hex;
          if (myTowns.has(loc) || (hx && hexes.has(hexKey(hx)))) { out.add(f.id); break; }
        }
      }
      const mine = (s.realmHexes[R] ?? []).map(k => k.split(',').map(Number) as Hex);
      for (const R2 of realms) {
        if (R2 === R || out.has(R2)) continue;
        const theirs = (s.realmHexes[R2] ?? []).map(k => k.split(',').map(Number) as Hex);
        if (mine.some(a => theirs.some(b => hexDistance({ col: a[0], row: a[1] }, { col: b[0], row: b[1] }) <= 1))) out.add(R2);
      }
      return out;
    };
    const candCache = new Map(realms.map(r => [r, candidatesOf(r)]));

    const strengthOf = (f: string) => s.armies.filter(a => a.faction === f).reduce((x, a) => x + a.strength, 0);
    const score = (c: string, L: string, withGift: boolean): Parts => {
      const liegeStr = strengthOf(L);
      const holdHexes = [...new Set([...(w.held.get(c) ?? []), ...(w.fac.get(c)?.halls ?? [])])]
        .map(l => s.locs[l]?.hex).filter((h): h is Hex => !!h);
      let threat = 0;
      for (const a of s.armies) {
        if (!a.hex || a.faction === c || a.faction === L) continue;
        if (oaths.get(a.faction)?.liege === L) continue; // a fellow vassal's army
        if (w.rel.get(`${c}|${a.faction}`) === 'ally') continue;
        const near = holdHexes.some(h => hexDistance({ col: h[0], row: h[1] }, { col: a.hex![0], row: a.hex![1] }) <= K.OATH_THREAT_RADIUS_HEXES);
        if (near) threat = Math.max(threat, a.strength);
      }
      const protection = threat > 0 ? liegeStr / (liegeStr + threat) : K.OATH_NO_THREAT_PROTECTION;
      const r = w.rel.get(`${c}|${L}`);
      const standing = r === 'ally' ? 1 : r === 'rival' || r === 'hostile' ? -1 : 0;
      const pride = Math.min(K.OATH_PRIDE_CAP, Math.max(0, own.get(c) ?? 0) / Math.max(0.01, fullInc(L)));
      let gift = 0;
      if (withGift) {
        const full = K.OATH_GIFT_DAYS * Math.max(0, own.get(c) ?? 0);
        const spare = Math.max(0, (bal.get(L) ?? 0) - K.OATH_GIFT_RESERVE);
        gift = full > 0 ? Math.min(1, spare / full) : 0;
      }
      const sc = K.OATH_PROTECTION_W * protection + K.OATH_GIFT_W * gift + K.OATH_STANDING_W * standing - K.OATH_PRIDE_W * pride;
      return { protection, gift, standing, pride, score: sc, threat, liegeStr };
    };
    const partsStr = (x: Parts) => `prot ${f2(x.protection)} (own ${x.liegeStr.toFixed(0)} vs threat ${x.threat.toFixed(0)}) gift ${f2(x.gift)} stand ${x.standing} pride ${f2(x.pride)} → ${f2(x.score)}`;

    const breakOath = (o: Oath, reason: string) => {
      oaths.delete(o.vassal);
      const vf = w.fac.get(o.vassal);
      const rebellion = vf?.cls === 'realm' && fullInc(o.vassal) >= K.REBELLION_INCOME_RATIO * fullInc(o.liege);
      broken.push({ ...o, brokeDay: day, reason, rebellion });
      cooldown.set(`${o.vassal}|${o.liege}`, day + K.OATH_RESWEAR_COOLDOWN_DAYS);
      events.push(`day ${String(day).padStart(2)}  BREAK ${nm(o.vassal)} ✗ ${nm(o.liege)} [${o.kind}, sworn day ${o.swornDay}] loyalty ${f2(o.loyalty)} — ${reason}${rebellion ? ' — REBELLION' : ''}`);
    };

    // Loyalty, checked daily.
    for (const o of [...oaths.values()]) {
      if (!w.fac.has(o.vassal)) { breakOath(o, 'vassal gone from the world'); continue; }
      if (!w.fac.has(o.liege)) { breakOath(o, 'liege gone from the world'); continue; }
      const d: { reason: string; amt: number }[] = [];
      const m = means(o.liege);
      if (m === 'Flush' || m === 'Overflowing') d.push({ reason: 'liege flush', amt: +K.LOYALTY_RISE_FLUSH });
      if (m === 'Strained') d.push({ reason: 'liege strained', amt: -K.LOYALTY_FALL_STRAINED });
      if (m === 'Bankrupt') d.push({ reason: 'liege bankrupt', amt: -K.LOYALTY_FALL_BANKRUPT });
      const lost = lostToday.get(o.vassal) ?? 0;
      if (lost > 0) d.push({ reason: `defence failure (lost ${lost} holding${lost > 1 ? 's' : ''})`, amt: -K.LOYALTY_FAIL_DEFENCE * lost });
      if ((own.get(o.vassal) ?? 0) > fullInc(o.liege)) d.push({ reason: 'outgrown the liege', amt: -K.LOYALTY_FALL_OUTGROWN });
      const live = score(o.vassal, o.liege, false).score;
      let bestRival: { r: string; sc: number } | null = null;
      for (const R of realms) {
        if (R === o.liege || R === o.vassal || oaths.has(R) || !candCache.get(R)?.has(o.vassal)) continue;
        const sc = score(o.vassal, R, false).score;
        if (!bestRival || sc > bestRival.sc) bestRival = { r: R, sc };
      }
      if (bestRival && bestRival.sc > live + K.OATH_RIVAL_MARGIN) d.push({ reason: `rival offer from ${bestRival.r} (${f2(bestRival.sc)} vs ${f2(live)})`, amt: -K.LOYALTY_FALL_RIVAL_OFFER });
      for (const x of d) { o.loyalty += x.amt; o.drops.push({ day, ...x }); }
      o.loyalty = Math.max(0, Math.min(1, o.loyalty));
      o.trace.push({ day, loyalty: o.loyalty });
      if (o.loyalty < K.OATH_BREAK_THRESHOLD) {
        // Reason: the biggest loyalty loss over the last 10 days, by reason family.
        const fam = new Map<string, number>();
        for (const x of o.drops.filter(x => x.day > day - 10 && x.amt < 0)) {
          const key = x.reason.replace(/ \(.*\)$/, '').replace(/ from faction_\d+.*/, '');
          fam.set(key, (fam.get(key) ?? 0) + x.amt);
        }
        const top1 = [...fam].sort((a, b) => a[1] - b[1])[0];
        const last = [...o.drops].reverse().find(x => x.amt < 0 && x.reason.startsWith(top1?.[0] ?? '~'));
        breakOath(o, top1 ? `${last?.reason ?? top1[0]} (−${(-top1[1]).toFixed(2)} over 10 days)` : 'loyalty eroded');
      }
    }

    // Seeking oaths: each unsworn realm courts once a day.
    for (const R of realms) {
      if (oaths.has(R)) continue;
      const L = lieges();
      const pool = [...(candCache.get(R) ?? [])].filter(c => {
        const f = w.fac.get(c);
        return canSwear(f) && !oaths.has(c) && !L.has(c) && (cooldown.get(`${c}|${R}`) ?? 0) <= day;
      });
      // Coercion: R's army besieged a town the candidate holds today, or R took one from it recently.
      const coercible = new Set<string>();
      const siegeTicks = new Map<string, number>(); // holder → ticks R besieged its towns inside the window
      for (const back of snaps.slice(Math.max(1, s.tick / TICKS_PER_DAY - K.OATH_COERCE_WINDOW_DAYS + 1), s.tick / TICKS_PER_DAY + 1)) {
        for (const sg of back.sieges) if (sg.attacker === R) for (const h of sg.holders) siegeTicks.set(h, (siegeTicks.get(h) ?? 0) + 1);
      }
      for (const sg of s.sieges) if (sg.attacker === R) for (const h of sg.holders) if ((siegeTicks.get(h) ?? 0) >= K.OATH_COERCE_MIN_SIEGE_TICKS) coercible.add(h);
      for (const t of lostTowns) if (t.to === R && day - t.day <= K.OATH_COERCE_WINDOW_DAYS) coercible.add(t.from);
      const coercePool = [...coercible].filter(c => c !== R && canSwear(w.fac.get(c)) && !oaths.has(c) && !L.has(c)
        && (cooldown.get(`${c}|${R}`) ?? 0) <= day);
      let pick: { c: string; kind: Kind; parts: Parts } | null = null;
      if (coercePool.length) {
        const c = coercePool.sort((a, b) => (own.get(b) ?? 0) - (own.get(a) ?? 0) || (a < b ? -1 : 1))[0];
        pick = { c, kind: 'coerced', parts: score(c, R, false) };
      } else {
        const accept: { c: string; kind: Kind; parts: Parts }[] = [];
        let bestRefused: { c: string; parts: Parts } | null = null;
        for (const c of pool) {
          const a = score(c, R, false);
          if (a.score >= K.OATH_ACCEPT_THRESHOLD) { accept.push({ c, kind: 'persuaded', parts: a }); continue; }
          const b = score(c, R, true);
          if (b.score >= K.OATH_ACCEPT_THRESHOLD) { accept.push({ c, kind: 'bought', parts: b }); continue; }
          if (!bestRefused || b.score > bestRefused.parts.score) bestRefused = { c, parts: b };
        }
        accept.sort((a, b) => (own.get(b.c) ?? 0) - (own.get(a.c) ?? 0) || (a.kind === 'persuaded' ? -1 : 1) || (a.c < b.c ? -1 : 1));
        pick = accept[0] ?? null;
        if (!pick && bestRefused) {
          refusals++;
          const k = `${bestRefused.c}|${R}`;
          if (!refusedOnce.has(k)) {
            refusedOnce.add(k);
            events.push(`day ${String(day).padStart(2)}  refused ${nm(bestRefused.c)} ← ${nm(R)}: ${partsStr(bestRefused.parts)}`);
          }
        }
      }
      if (!pick) continue;
      let giftPaid = 0;
      if (pick.kind === 'bought') {
        giftPaid = pick.parts.gift * K.OATH_GIFT_DAYS * Math.max(0, own.get(pick.c) ?? 0);
        bal.set(R, (bal.get(R) ?? 0) - giftPaid);
        bal.set(pick.c, (bal.get(pick.c) ?? 0) + giftPaid);
      }
      const o: Oath = {
        vassal: pick.c, liege: R, taxShare: K.FEALTY_TAX_SHARE, loyalty: K.LOYALTY_START[pick.kind], swornDay: day,
        kind: pick.kind, parts: pick.parts, drops: [], trace: [{ day, loyalty: K.LOYALTY_START[pick.kind] }], taxPaid: 0, giftPaid,
      };
      oaths.set(pick.c, o);
      events.push(`day ${String(day).padStart(2)}  SWEAR ${nm(pick.c)} → ${nm(R)} [${pick.kind}${giftPaid ? `, gift ${giftPaid.toFixed(1)}` : ''}] income ${f2(own.get(pick.c) ?? 0)} vs ${f2(fullInc(R))}: ${partsStr(pick.parts)}`);
    }

    // Crown status + income split.
    for (const R of realms) {
      const n = [...oaths.values()].filter(o => o.liege === R).length;
      const tr = crownTrack.get(R) ?? Array(days).fill(0);
      tr[day - 1] = n;
      crownTrack.set(R, tr);
      const sp = split.get(R) ?? split.set(R, new Map()).get(R)!;
      sp.set(day, { own: own.get(R) ?? 0, oath: oathIncome.get(R) ?? 0 });
    }
    prevW = w;
  }

  // ─── Report ───
  p('THR-1917 crown and fealty — observer sketch over the THR-1867 purse ledger (THROWAWAY, never merged)');
  p(`seed ${SEED} medium · ${TICKS} ticks · one cycle per day (TICKS_PER_DAY ${TICKS_PER_DAY}) · ${days} days`);
  p('CAVEAT: the world runs unmodified. Oaths, purses, gifts and loyalty never feed back into the world.');
  p('The world was simulated once (about 10 minutes); calibration passes replayed the daily snapshots with --cached.');
  p('');
  const consts: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(K)) consts[k] = v;
  p('Crown constants: ' + JSON.stringify(consts));
  p('');

  p('== Oath event log (SWEAR / BREAK; a refusal is logged the first time a realm is refused by that candidate) ==');
  for (const e of events) p('  ' + e);
  p(`  (${refusals} refused courtings in all)`);
  p('');

  p('== Town changes of hands (controls edges, place tier) ==');
  for (const t of lostTowns) p(`  day ${String(t.day).padStart(2)}  ${t.town} (${snaps[0].locs[t.town]?.name ?? '?'}) ${nm(t.from)} → ${nm(t.to)}`);
  p('');

  p(`== Crown status over time (oaths held per liege; Crown = ≥ ${K.CROWN_MIN_OATHS}) ==`);
  for (const [R, tr] of crownTrack) {
    const runs: string[] = [];
    let start = 1;
    for (let d = 2; d <= days + 1; d++) {
      if (d === days + 1 || tr[d - 1] !== tr[d - 2]) {
        const n = tr[start - 1];
        runs.push(`d${start}-${d - 1}: ${n}${n >= K.CROWN_MIN_OATHS ? ' CROWN' : ''}`);
        start = d;
      }
    }
    const first = tr.findIndex(n => n >= K.CROWN_MIN_OATHS);
    p(`  ${nm(R)}: first crowned ${first >= 0 ? `day ${first + 1}` : 'never'}`);
    p(`    ${runs.join(' · ')}`);
  }
  p('');

  p('== Income split for every liege (own vs oath), day value and trailing 10-day mean ==');
  p('  liege        day   own/day  oath/day  oath%  | 10d own  10d oath  10d oath%  oaths');
  for (const [R, sp] of split) {
    for (const d of [30, 60, 90]) {
      const x = sp.get(d);
      if (!x) continue;
      let o10 = 0, a10 = 0;
      for (let k = d - 9; k <= d; k++) { const y = sp.get(k); if (y) { o10 += y.own; a10 += y.oath; } }
      const n = crownTrack.get(R)?.[d - 1] ?? 0;
      p(`  ${R.padEnd(11)} ${String(d).padStart(4)} ${x.own.toFixed(2).padStart(8)} ${x.oath.toFixed(2).padStart(9)} ${(100 * x.oath / Math.max(0.01, x.own + x.oath)).toFixed(1).padStart(5)}%  | ${(o10 / 10).toFixed(2).padStart(7)} ${(a10 / 10).toFixed(2).padStart(9)} ${(100 * a10 / Math.max(0.01, o10 + a10)).toFixed(1).padStart(9)}%  ${n}`);
    }
  }
  p('');

  p('== Loyalty traces (every 5 days from swearing; final value) ==');
  const all: (Oath & { brokeDay?: number; reason?: string })[] = [...broken, ...oaths.values()];
  for (const o of all.sort((a, b) => a.swornDay - b.swornDay)) {
    const pts = o.trace.filter((x, i) => i === 0 || (x.day - o.swornDay) % 5 === 0 || i === o.trace.length - 1).map(x => `d${x.day}:${f2(x.loyalty)}`);
    p(`  ${o.vassal} → ${o.liege} [${o.kind}] sworn d${o.swornDay}${o.brokeDay ? `, broke d${o.brokeDay}` : ', holding'} · tax paid ${o.taxPaid.toFixed(1)} · gift ${o.giftPaid.toFixed(1)}`);
    p(`    ${pts.join(' ')}`);
  }
  p('');

  p('== Breaks ==');
  if (!broken.length) p('  none');
  for (const b of broken) p(`  day ${b.brokeDay}: ${nm(b.vassal)} ✗ ${nm(b.liege)} [${b.kind}] — ${b.reason}${b.rebellion ? ' — REBELLION' : ''}`);
  const byKind = (k: Kind) => ({ sworn: all.filter(o => o.kind === k).length, broke: broken.filter(o => o.kind === k).length });
  p(`  by kind: ${(['persuaded', 'bought', 'coerced'] as Kind[]).map(k => { const x = byKind(k); return `${k} ${x.broke}/${x.sworn} broke`; }).join(' · ')}`);
  p('');

  // Independent factions at the last day: best realm offer and why it fails.
  p(`== Swear-eligible factions still independent on day ${days} (best realm offer and why it fails) ==`);
  const w = lastW;
  const s = w.s;
  const L = new Set([...oaths.values()].map(o => o.liege));
  const realms = s.factions.filter(f => f.cls === 'realm' && (w.held.get(f.id)?.size ?? 0) > 0).map(f => f.id);
  // Re-score on the final day's state (purses and incomes as at day end).
  const own = lastIncome;
  const strengthOf = (f: string) => s.armies.filter(a => a.faction === f).reduce((x, a) => x + a.strength, 0);
  for (const f of s.factions) {
    if (!canSwear(f) || oaths.has(f.id) || L.has(f.id)) continue;
    let best: { R: string; line: string; sc: number } | null = null;
    for (const R of realms) {
      if (R === f.id || oaths.has(R)) continue;
      const myHex = new Set(s.realmHexes[R] ?? []);
      const inBorder = [...(w.presence.get(f.id) ?? [])].some(l => (w.held.get(R)?.has(l)) || (s.locs[l]?.hex && myHex.has(hexKey(s.locs[l].hex!))));
      if (!inBorder && f.cls !== 'realm') continue;
      const liegeStr = strengthOf(R);
      const holdHexes = [...new Set([...(w.held.get(f.id) ?? []), ...f.halls])].map(l => s.locs[l]?.hex).filter((h): h is Hex => !!h);
      let threat = 0;
      for (const a of s.armies) {
        if (!a.hex || a.faction === f.id || a.faction === R || oaths.get(a.faction)?.liege === R) continue;
        if (w.rel.get(`${f.id}|${a.faction}`) === 'ally') continue;
        if (holdHexes.some(h => hexDistance({ col: h[0], row: h[1] }, { col: a.hex![0], row: a.hex![1] }) <= K.OATH_THREAT_RADIUS_HEXES)) threat = Math.max(threat, a.strength);
      }
      const protection = threat > 0 ? liegeStr / (liegeStr + threat) : K.OATH_NO_THREAT_PROTECTION;
      const r = w.rel.get(`${f.id}|${R}`);
      const standing = r === 'ally' ? 1 : r === 'rival' || r === 'hostile' ? -1 : 0;
      const pride = Math.min(K.OATH_PRIDE_CAP, Math.max(0, own.get(f.id) ?? 0) / Math.max(0.01, own.get(R) ?? 0));
      const full = K.OATH_GIFT_DAYS * Math.max(0, own.get(f.id) ?? 0);
      const spare = Math.max(0, (bal.get(R) ?? 0) - K.OATH_GIFT_RESERVE);
      const gift = full > 0 ? Math.min(1, spare / full) : 0;
      const sc = K.OATH_PROTECTION_W * protection + K.OATH_GIFT_W * gift + K.OATH_STANDING_W * standing - K.OATH_PRIDE_W * pride;
      const cd = (cooldown.get(`${f.id}|${R}`) ?? 0) > days ? ' (cooldown after a break)' : '';
      const why = sc >= K.OATH_ACCEPT_THRESHOLD ? `would accept — not courted (${R} courted a richer candidate each day)${cd}` : `below ${K.OATH_ACCEPT_THRESHOLD}${gift < 1 ? `; gift only ${f2(gift)} affordable (purse ${(bal.get(R) ?? 0).toFixed(0)}, reserve ${K.OATH_GIFT_RESERVE}, full gift ${full.toFixed(0)})` : ''}${cd}`;
      const line = `best ${R}: prot ${f2(protection)} (own ${liegeStr.toFixed(0)} vs threat ${threat.toFixed(0)}) gift ${f2(gift)} stand ${standing} pride ${f2(pride)} → ${f2(sc)} — ${why}`;
      if (!best || sc > best.sc) best = { R, line, sc };
    }
    p(`  ${f.id.padEnd(34)} inc ${(own.get(f.id) ?? 0).toFixed(2).padStart(5)} · ${best ? best.line : 'no realm counts it a candidate (no hall, holding or member inside any realm border)'}`);
  }
  p('');
  p('== Final purses of the realms ==');
  for (const R of realms) p(`  ${nm(R)}: balance ${(bal.get(R) ?? 0).toFixed(1)} · income/day ${(lastIncome.get(R) ?? 0).toFixed(2)} · upkeep/day ${(lastUpkeep.get(R) ?? 0).toFixed(2)} · ${meansWord(bal.get(R) ?? 0, lastUpkeep.get(R) ?? 0)}`);

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

main();
