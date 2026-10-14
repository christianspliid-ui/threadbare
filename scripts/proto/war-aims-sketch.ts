/**
 * THR-1868 economic war aims — OBSERVER SKETCH over the THR-1867 purse ledger (snapshot code from the THR-1917 crown sketch).
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
const TICKS = 600;
const CACHE = '.cache/war-aims-snapshots.json';
const OUT = 'scripts/proto/war-aims-sketch.output.txt';

// ─── Snapshot (pure read of the world) ───────────────────────────────────

type Hex = [number, number];
interface LocSnap {
  name: string; subtype: string; prosperity: number;
  resources: Record<string, { q: number; tier: string }>;
  sublocTypes: string[]; lanes: number; hex?: Hex; parent?: string;
}
interface FactionSnap {
  id: string; name: string; cls: string; guildType?: string; defId?: string; home?: string; monster?: boolean; monopolies?: string[];
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
    monopolies: Array.isArray(n.properties.monopolies) ? (n.properties.monopolies as string[]) : [],
    halls: [...(hallsByFaction.get(n.id) ?? [])],
    members: members.get(n.id) ?? {},
  }));

  const relations: Snap['relations'] = [];
  for (const e of g.getAllEdges()) {
    if (!factionIds.has(e.source) || !factionIds.has(e.target)) continue;
    if (e.type === 'relates_to') {
      if (e.properties.isAlliance === true) relations.push({ a: e.source, b: e.target, k: 'ally' });
      if (e.properties.isRival === true || e.properties.basis === 'war' || (typeof e.properties.sentiment === 'number' && e.properties.sentiment < -0.3)) relations.push({ a: e.source, b: e.target, k: 'rival' });
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
  let { state } = initializeGameState(archetype, 'WarAimsSketch', createBalancedCosmology(), SEED, preset.cols, preset.rows);
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

// ─── War aims (THR-1868) ─────────────────────────────────────────────────

/** Distance scale for value-weighted targeting: a target this many hexes away is worth half. */
const DIST_HALF_HEXES = 6;
/** Hinterland reach, from the THR-1866 decision (a town works the hexes within 3). */
const HINTERLAND_HEXES = 3;
/** Bonus multipliers on a target's value. */
const MONO_COMPLETE_BONUS = 1.0; // taking it completes a monopoly for the attacker
const MONO_BREAK_BONUS = 0.5; // taking it breaks an enemy's monopoly
const MONO_REGION_HEXES = 8; // regional market radius for monopolies
const STARVE_BONUS = 0.5; // the attacker's own towns lack the staple this target's fields grow
/** Defence: an enemy army marching on one of my holdings (or a sworn/allied one) within this many hexes. */
const DEFEND_RADIUS_HEXES = 8;
const ARMY_TARGET_SUBTYPES = ['hamlet', 'town', 'city', 'capital', 'castle', 'fort'];
const STAPLES = new Set(['grain', 'fish', 'water', 'livestock', 'game']);

const hd = (a: Hex, b: Hex) => hexDistance({ col: a[0], row: a[1] }, { col: b[0], row: b[1] });

interface Target { id: string; holder: string; value: number; parts: { tax: number; yield: number; fields: number }; dist: number; mono: string[]; breaks: string[]; starve: string[]; score: number }

function main() {
  const snaps: Snap[] = process.argv.includes('--cached') && fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : runWorld();
  const lines: string[] = [];
  const p = (x = '') => lines.push(x);
  const nameOf = new Map<string, string>();
  for (const s of snaps) for (const f of s.factions) nameOf.set(f.id, f.name);
  const nm = (id: string) => `${id} (${nameOf.get(id) ?? '?'})`;
  const f2 = (n: number) => n.toFixed(2);
  const pct = (a: number, b: number) => b ? `${Math.round(100 * a / b)}%` : '—';

  p(`THR-1868 war aims — observer sketch, seed ${SEED}, medium, ${snaps[snaps.length - 1].tick} ticks (${snaps.length - 1} days)`);
  p(`Value = purse income the attacker would collect if it held the target (town tax + place yield of the town and its`);
  p(`sublocations + share of unsettled resource fields within ${HINTERLAND_HEXES} hexes). Score = value × (1 + bonuses) / (1 + dist/${DIST_HALF_HEXES}).`);
  p(`Distance is hex distance (today's engine ranks by path hops; hex distance is the proxy here).`);
  p();

  // ── Monopoly census ──
  p('## Monopolies (engine field faction.monopolies, world-wide 60% of bearing places, min 2)');
  const monoTimeline = new Map<string, { from: number; to: number; holder: string }[]>();
  for (const s of snaps) {
    const day = s.tick / TICKS_PER_DAY;
    for (const f of s.factions) for (const r of f.monopolies ?? []) {
      const runs = monoTimeline.get(r) ?? monoTimeline.set(r, []).get(r)!;
      const last = runs[runs.length - 1];
      if (last && last.holder === f.id && last.to === day - 1) last.to = day; else runs.push({ from: day, to: day, holder: f.id });
    }
  }
  const resBearing = new Map<string, number>();
  for (const l of Object.values(snaps[0].locs)) for (const r of Object.keys(l.resources)) resBearing.set(r, (resBearing.get(r) ?? 0) + 1);
  p(`resources: ${resBearing.size}; bearing places per resource: ${[...resBearing].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(', ')}`);
  if (monoTimeline.size === 0) p('no monopoly held on any day');
  for (const [r, runs] of monoTimeline) p(`  ${r}: ${runs.map(x => `${nm(x.holder)} day ${x.from}–${x.to}`).join('; ')}`);
  // Near-monopolies at the end: best share per resource.
  const sEnd = snaps[snaps.length - 1];
  const share = (s: Snap, r: string) => {
    const by = new Map<string, number>(); let tot = 0;
    for (const [id, l] of Object.entries(s.locs)) {
      if (!(r in l.resources)) continue; tot++;
      const c = s.controls.find(x => x.tgt === id)?.src; if (c) by.set(c, (by.get(c) ?? 0) + 1);
    }
    return { tot, by };
  };
  /** Regional market (THR-1868 decision): places bearing r within MONO_REGION_HEXES of a point. */
  const regionalShare = (s: Snap, r: string, at: Hex) => {
    const by = new Map<string, number>(); let tot = 0;
    for (const [id, l] of Object.entries(s.locs)) {
      if (l.parent || !(r in l.resources) || !l.hex || hd(l.hex, at) > MONO_REGION_HEXES) continue; tot++;
      const c = s.controls.find(x => x.tgt === id)?.src; if (c) by.set(c, (by.get(c) ?? 0) + 1);
    }
    return { tot, by };
  };
  p('best share per resource at the end (holder, held/bearing):');
  for (const r of [...resBearing.keys()].sort()) {
    const { tot, by } = share(sEnd, r);
    const best = [...by].sort((a, b) => b[1] - a[1])[0];
    p(`  ${r.padEnd(12)} ${best ? `${nm(best[0])} ${best[1]}/${tot}` : `none held of ${tot}`}`);
  }
  p();

  // ── Armies: today's targets vs value-weighted ──
  p('## Army objectives');
  const seen = new Set<string>();
  const firstTargets: { day: number; army: string; fac: string; hex?: Hex; target?: string; s: Snap }[] = [];
  for (const s of snaps) {
    for (const a of s.armies) {
      if (seen.has(a.id) || !a.target) continue;
      seen.add(a.id);
      firstTargets.push({ day: s.tick / TICKS_PER_DAY, army: a.id, fac: a.faction, hex: a.hex, target: a.target, s });
    }
  }
  const allArmies = new Set(snaps.flatMap(s => s.armies.map(a => a.id)));
  p(`armies seen: ${allArmies.size}; with an objective: ${firstTargets.length}`);

  const relCount = { hostile: 0, rival: 0, ally: 0, none: 0, self: 0, unheld: 0 };
  let nearestIsBest = 0, valueToday = 0, valueBest = 0, distToday = 0, distBest = 0, noLegal = 0, compared = 0;
  let monoCompletes = 0, monoBreaks = 0, starveHits = 0, defendCases = 0;
  const pickRows: string[] = [];
  const todayTargets = new Map<string, number>(), bestTargets = new Map<string, number>();

  for (const ft of firstTargets) {
    const s = ft.s; const w = buildWorld(s);
    const holderOf = (loc: string) => s.controls.find(c => c.tgt === loc)?.src;
    const relOf = (a: string, b: string) => a === b ? 'self' : (w.rel.get(`${a}|${b}`) ?? 'none');
    const h0 = ft.target ? holderOf(ft.target) : undefined;
    const r0 = h0 ? relOf(ft.fac, h0) : 'unheld';
    relCount[r0 as keyof typeof relCount]++;
    if (!ft.hex) continue;

    // My staples: does any town I hold stand at scarce/famine in a staple?
    const myTowns = [...(w.held.get(ft.fac) ?? [])];
    const myShort = new Set<string>();
    for (const t of myTowns) for (const [r, x] of Object.entries(s.locs[t]?.resources ?? {})) if (STAPLES.has(r) && (x.tier === 'scarce' || x.tier === 'famine' || x.tier === 'critical')) myShort.add(r);
    const myMonos = new Set(w.fac.get(ft.fac)?.monopolies ?? []);

    const settlements = Object.entries(s.locs).filter(([, l]) => !l.parent && ARMY_TARGET_SUBTYPES.includes(l.subtype) && l.hex);
    const fields = Object.entries(s.locs).filter(([, l]) => !l.parent && !ARMY_TARGET_SUBTYPES.includes(l.subtype) && l.hex && Object.keys(l.resources).length > 0);
    const legal: Target[] = [];
    for (const [id, l] of settlements) {
      const holder = holderOf(id);
      if (!holder || holder === ft.fac) continue;
      const rel = relOf(ft.fac, holder);
      if (rel !== 'hostile' && rel !== 'rival') continue; // proposal: war only on enemies
      const tax = townTax(l);
      let yld = placeYield(l);
      for (const [sid, sl] of Object.entries(s.locs)) if (sl.parent === id && holderOf(sid) === holder) yld += placeYield(sl);
      let fv = 0; const fieldRes = new Set<string>();
      for (const [, fl] of fields) {
        const d = hd(l.hex!, fl.hex!); if (d > HINTERLAND_HEXES) continue;
        const sharers = settlements.filter(([, o]) => hd(o.hex!, fl.hex!) <= HINTERLAND_HEXES).length || 1;
        fv += placeYield(fl) / sharers;
        for (const r of Object.keys(fl.resources)) fieldRes.add(r);
      }
      const value = tax + yld + fv;
      // Monopoly effects of taking it (world-wide share, as the engine counts).
      const mono: string[] = [], breaks: string[] = [];
      for (const r of Object.keys(l.resources)) {
        const { tot, by } = regionalShare(s, r, l.hex!);
        if (tot < 2) continue; void myMonos;
        const mine = (by.get(ft.fac) ?? 0) + 1;
        if (tot >= 3 && (by.get(ft.fac) ?? 0) / tot < 0.6 && mine / tot >= 0.6) mono.push(r);
        const theirs = by.get(holder) ?? 0;
        if (theirs / tot >= 0.6 && (theirs - 1) / tot < 0.6) breaks.push(r);
      }
      const starve = [...fieldRes, ...Object.keys(l.resources)].filter(r => myShort.has(r));
      const bonus = (mono.length ? MONO_COMPLETE_BONUS : 0) + (breaks.length ? MONO_BREAK_BONUS : 0) + (starve.length ? STARVE_BONUS : 0);
      const dist = hd(ft.hex, l.hex!);
      legal.push({ id, holder, value, parts: { tax, yield: yld, fields: fv }, dist, mono, breaks, starve: [...new Set(starve)], score: value * (1 + bonus) / (1 + dist / DIST_HALF_HEXES) });
    }
    // Defence: an enemy army whose objective is one of my holdings (or an ally's) within DEFEND_RADIUS.
    const threatened = s.armies.filter(a => a.faction !== ft.fac && a.target && a.hex
      && (w.held.get(ft.fac)?.has(top(s, a.target)) || [...(w.held.entries())].some(([f, set]) => relOf(ft.fac, f) === 'ally' && set.has(top(s, a.target!))))
      && hd(a.hex, ft.hex!) <= DEFEND_RADIUS_HEXES);
    if (threatened.length) defendCases++;

    const today = ft.target ? s.locs[ft.target] : undefined;
    todayTargets.set(ft.target ?? '?', (todayTargets.get(ft.target ?? '?') ?? 0) + 1);
    if (!legal.length) { noLegal++; pickRows.push(`  day ${String(ft.day).padStart(2)} ${nm(ft.fac)} → today ${today?.name ?? ft.target} [${r0}] | value pick: none (no enemy settlement)${threatened.length ? ' | DEFEND' : ''}`); continue; }
    compared++;
    legal.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    const best = legal[0];
    bestTargets.set(best.id, (bestTargets.get(best.id) ?? 0) + 1);
    const tLegal = legal.find(t => t.id === ft.target);
    const nearest = [...legal].sort((a, b) => a.dist - b.dist || (a.id < b.id ? -1 : 1))[0];
    if (nearest.id === best.id) nearestIsBest++;
    const todayVal = tLegal?.value ?? (today ? townTax(today) + placeYield(today) : 0);
    valueToday += todayVal; valueBest += best.value;
    distToday += today?.hex ? hd(ft.hex, today.hex) : 0; distBest += best.dist;
    if (best.mono.length) monoCompletes++;
    if (best.breaks.length) monoBreaks++;
    if (best.starve.length) starveHits++;
    pickRows.push(`  day ${String(ft.day).padStart(2)} ${nm(ft.fac)} → today ${today?.name ?? ft.target} [${r0}, v ${f2(todayVal)}, d ${today?.hex ? hd(ft.hex, today.hex) : '?'}] | value pick ${s.locs[best.id].name} of ${nm(best.holder)} [v ${f2(best.value)} = tax ${f2(best.parts.tax)} + yield ${f2(best.parts.yield)} + fields ${f2(best.parts.fields)}, d ${best.dist}${best.mono.length ? `, completes ${best.mono}` : ''}${best.breaks.length ? `, breaks ${best.breaks}` : ''}${best.starve.length ? `, feeds ${best.starve}` : ''}]${threatened.length ? ' | DEFEND' : ''}`);
  }
  p(`today's target held by: hostile ${relCount.hostile}, rival ${relCount.rival}, ally ${relCount.ally}, no relation ${relCount.none}, self ${relCount.self}, unheld ${relCount.unheld}`);
  p(`distinct targets today: ${todayTargets.size} for ${firstTargets.length} armies; top: ${[...todayTargets].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => `${snaps[0].locs[t]?.name ?? t}×${n}`).join(', ')}`);
  p(`value pick: no enemy settlement for ${noLegal} of ${firstTargets.length} armies (they would hold, defend or stand down)`);
  p(`compared ${compared}: value pick = nearest enemy in ${nearestIsBest} (${pct(nearestIsBest, compared)}); distinct value targets ${bestTargets.size}`);
  p(`mean value of target: today ${f2(valueToday / Math.max(1, compared))}/day, value pick ${f2(valueBest / Math.max(1, compared))}/day`);
  p(`mean distance: today ${f2(distToday / Math.max(1, compared))} hexes, value pick ${f2(distBest / Math.max(1, compared))} hexes`);
  p(`value picks that complete a monopoly ${monoCompletes}, break one ${monoBreaks}, feed a staple the attacker lacks ${starveHits}`);
  p(`armies raised while an enemy army marched on their own or an ally's holding within ${DEFEND_RADIUS_HEXES} hexes: ${defendCases}`);
  p();
  p('## Per army (first day an objective is seen)');
  for (const r of pickRows) p(r);
  p();

  // ── Relations census ──
  const last = buildWorld(sEnd);
  const pairs = { hostile: 0, rival: 0, ally: 0 };
  for (const r of sEnd.relations) pairs[r.k]++;
  p(`## Relations at the end: hostile_to ${pairs.hostile}, rival ${pairs.rival}, alliance ${pairs.ally} (directed edges); realms holding land: ${sEnd.factions.filter(f => f.cls === 'realm' && (last.held.get(f.id)?.size ?? 0) > 0).length}`);

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

main();
