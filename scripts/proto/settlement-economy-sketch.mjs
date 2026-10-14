// THR-1923 settlement economy — STANDALONE SKETCH on the seed-42 world at tick 0. Throwaway; never merged.
//
// Reads .cache/settlement-world.json (written by settlement-probe.ts) and runs the agreed model for DAYS days:
//   land yields (hexes within WORK_RADIUS, one hex per person, Civ-style) → the town's own sink eats first →
//   food surplus fills a growth meter (people) · wood/stone surplus fills a build meter (works, in limited slots) ·
//   special goods in reach unlock works and traits · only a faction seat may pass TOWN_MAX_POP · a surplus with
//   nowhere to go starts a trade route to the nearest seat city (own faction first) or a hungry settlement.
// It does NOT run the engine tick; it answers one question: does the model keep the map diverse?
//
// node scripts/proto/settlement-economy-sketch.mjs [variant]   variant: agreed (default) | flat (control: no path
//   dependence, no slot limit, no seat rule, uniform build list — the convergent strawman)
import * as fs from 'fs';

const V = process.argv[2] ?? 'agreed';
const AGREED = V === 'agreed';
const DAYS = 150;
/** Worldgen settling run: the economy runs this many days before the game starts, so day 0 sizes fit the land. */
const SETTLE_DAYS = 50;
const W = JSON.parse(fs.readFileSync('.cache/settlement-world.json', 'utf8'));

// ─── Constants (the plan doc lifts these) ───────────────────────────────
const WORK_RADIUS = 3;
const FOOD_PER_PERSON = 1.5;
/** The settlement's own hex always yields at least this (Civ city centre): [food, wood, stone]. */
const CENTRE_YIELD = [2, 1, 1];
const WOOD_PER_PERSON = 0.25;           // upkeep: firewood, repairs
const GROWTH_BASE = 12, GROWTH_PER_PERSON = 4;     // meter size to gain one person
const STORE_DAYS = 3;                   // food store covers this many days of need
const STARVE_DAYS = 6;                  // days at empty store + meter before losing a person
const HOUSING_BASE = 4, HOUSING_PER_WORK = 3;
const TOWN_MAX_POP = AGREED ? 9 : 99;   // no seat → never past town
const CITY_POP = 10, CAPITAL_POP = 14, TOWN_POP = 4;
// Tier: size AND power. City needs a seat that pulls resources in; capital needs a realm seat.
const TIER_OF = t => (AGREED && t.pop >= CAPITAL_POP && t.realmSeat ? 'capital' : t.pop >= CITY_POP && (!AGREED || pulls(t)) ? 'city' : t.pop >= TOWN_POP ? 'town' : 'hamlet');
const SLOTS = AGREED ? { hamlet: 2, town: 3, city: 5, capital: 6 } : { hamlet: 99, town: 99, city: 99, capital: 99 };
const PATH_BONUS = AGREED ? 1.0 : 0;    // per owned work sharing a tag
const LEAN_BONUS = AGREED ? 0.5 : 0;    // holder faction's natural work
const NOISE = 0.25;                     // seeded tie-break jitter
const IDLE_DAYS_TO_LOSE = 20;
const SEAT_DRAW = 0.5;                  // share of held settlements' surplus a seat pulls in
const ROUTE_RANGE = 8;
const ROUTE_PERSIST_DAYS = 3;           // surplus must last this long before a route is born
const ROUTE_DIE_DAYS = 6;
const SHOCK_EVERY = 5, SHOCK_DAYS = 20, SHOCK_FACTOR = 0.3;

// Terrain yields per worked hex per day: [food, wood, stone]
const TERRAIN = {
  grassland: [3, 0, 0], floodplain: [4, 0, 0], steppe: [2.5, 0, 0], temperate_forest: [1, 3, 0], boreal_forest: [1, 2, 0],
  dense_forest: [0, 3, 0], hills: [1, 1, 2], mountains: [0, 0, 3], high_mountains: [0, 0, 1], mountain_pass: [0, 0, 1],
  plateau: [2, 0, 1], tundra: [1, 0, 0], moor_bog: [0.5, 1, 0], coastal_shallows: [2, 0, 0], ocean: [1, 0, 0],
  deep_ocean: [0, 0, 0], broken_lands: [0, 0, 1],
};
// Resource deposits on a hex add to its yield (quantity/50 ×): which channel
const RES_CHANNEL = { grain: 0, grazing: 0, fish: 0, water: 0, timber: 1, peat: 1, stone: 2, ore: -1 };
// Special goods: place subtype (or deposit) → good
const SPECIAL_PLACE = { gem_deposit: 'gems', herb_garden: 'herbs', crystal_cavern: 'crystal', iron_seep: 'ore', golden_grove: 'amber', hot_spring: 'springs', fossil_bed: 'curios', healing_spring: 'springs', mining: 'ore' };

// Works: tag, build cost (build points), upkeep (wood/day), needs, effect
const WORKS = {
  housing:       { tag: 'growth', cost: 18, upkeep: 0.1 },
  granary:       { tag: 'food',  cost: 15, upkeep: 0.1, needs: t => t.yield[0] >= 6, food: 1.15 },
  mill:          { tag: 'food',  cost: 22, upkeep: 0.2, needs: t => t.terrain.grassland + t.terrain.floodplain >= 3, food: 1.2 },
  fishery:       { tag: 'food',  cost: 15, upkeep: 0.1, needs: t => t.terrain.coastal_shallows + t.terrain.ocean >= 2, food: 1.15 },
  stockyard:     { tag: 'food',  cost: 15, upkeep: 0.1, needs: t => t.terrain.steppe >= 3, food: 1.1 },
  timber_yard:   { tag: 'wood',  cost: 15, upkeep: 0, needs: t => t.yield[1] >= 3, wood: 1.3 },
  stoneworks:    { tag: 'stone', cost: 18, upkeep: 0.1, needs: t => t.yield[2] >= 3, stone: 1.3 },
  walls:         { tag: 'stone', cost: 30, upkeep: 0.3, needs: t => t.pop >= 4 && (t.yield[2] >= 2 || t.seat), happy: 1 },
  market:        { tag: 'trade', cost: 24, upkeep: 0.2, needs: t => t.routes >= 2, happy: 1, routeCap: 1 },
  workshop:      { tag: 'craft', cost: 24, upkeep: 0.3, needs: t => t.yield[1] >= 2, goods: 1 },
  counting_house:{ tag: 'trade', cost: 26, upkeep: 0.2, needs: t => t.routes >= 1, routeCap: 1 },
  smithy:        { tag: 'craft', cost: 20, upkeep: 0.3, needs: t => t.special.has('ore'), trait: 'Iron Town' },
  gem_cutter:    { tag: 'craft', cost: 20, upkeep: 0.2, needs: t => t.special.has('gems'), trait: "Gem-cutters' Town", goods: 1 },
  apothecary:    { tag: 'faith', cost: 18, upkeep: 0.1, needs: t => t.special.has('herbs'), trait: 'Herb Town', happy: 1 },
  bathhouse:     { tag: 'faith', cost: 20, upkeep: 0.2, needs: t => t.special.has('springs'), trait: 'Spa Town', happy: 2 },
  seers_hall:    { tag: 'faith', cost: 22, upkeep: 0.2, needs: t => t.special.has('crystal'), trait: 'Crystal Seers' },
  amber_carvers: { tag: 'craft', cost: 18, upkeep: 0.1, needs: t => t.special.has('amber'), trait: 'Amber Market', goods: 1 },
  curio_hall:    { tag: 'faith', cost: 18, upkeep: 0.1, needs: t => t.special.has('curios'), trait: 'Curio Collectors' },
  shrine:        { tag: 'faith', cost: 16, upkeep: 0.1, needs: t => t.pop >= 3 && (t.lean === 'shrine' || [...t.works.keys()].some(w => WORKS[w].tag === 'faith')), happy: 1 },
};
// Faction class → natural work (the purse's natural-places table stands in)
const LEAN = { guild: 'workshop', military: 'walls', religious: 'shrine', criminal: 'market', political: 'counting_house', realm: 'walls' };
// Existing economic sublocations that seed works at t0
const SEED_WORK = { 'sublocation-type.workshop': 'workshop', 'sublocation-type.manufactory': 'workshop', 'sublocation-type.market-district': 'market', 'sublocation-type.counting-house': 'counting_house', 'sublocation-type.temple-quarter': 'shrine' };

// ─── PRNG + hex math ────────────────────────────────────────────────────
function mulberry(a) { return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry(42 * 7919 + 1923);
const cube = (c, r) => { const q = c, rr = r - (c - (c & 1)) / 2; return [q, rr, -q - rr]; };
const dist = (a, b) => { const x = cube(a[0], a[1]), y = cube(b[0], b[1]); return Math.max(Math.abs(x[0] - y[0]), Math.abs(x[1] - y[1]), Math.abs(x[2] - y[2])); };

// ─── Build the world ────────────────────────────────────────────────────
const SETTLE = new Set(['hamlet', 'town', 'city', 'capital']);
const START_POP = { hamlet: 2, town: 5, city: 10, capital: 14 };
const tileAt = new Map(W.tiles.map(([c, r, t]) => [`${c},${r}`, t]));
const locs = W.locs;
const settlements = locs.filter(l => SETTLE.has(l.subtype)).sort((a, b) => (a.id < b.id ? -1 : 1));
const places = locs.filter(l => !SETTLE.has(l.subtype) && typeof l.col === 'number');
const holder = new Map(); const holderCls = new Map();
for (const f of W.factions) for (const c of f.controls) if (!holder.has(c)) { holder.set(c, f.id); holderCls.set(c, f.cls); }
// Seats: homeLocationId; realms with no home get their largest held settlement (a substrate gap the plan fills).
const seatOf = new Map(); // settlement id → faction ids seated there
for (const f of W.factions) {
  let home = f.home;
  if (!home && f.cls === 'realm') home = f.controls.filter(c => SETTLE.has(locs.find(l => l.id === c)?.subtype)).sort((a, b) => START_POP[locs.find(l => l.id === b).subtype] - START_POP[locs.find(l => l.id === a).subtype] || (a < b ? -1 : 1))[0];
  if (home) (seatOf.get(home) ?? seatOf.set(home, []).get(home)).push(f.id);
}
// Hex ownership: each land hex within WORK_RADIUS goes to its holder's settlement, else the nearest (ties by id).
const hexOwner = new Map();
for (const [c, r] of W.tiles) {
  let best = null;
  for (const s of settlements) {
    const d = dist([c, r], [s.col, s.row]);
    if (d > WORK_RADIUS) continue;
    if (!best || d < best.d || (d === best.d && s.id < best.s.id)) best = { s, d };
  }
  if (best) hexOwner.set(`${c},${r}`, best.s.id);
}
function hexYield(key) {
  const y = [...(TERRAIN[tileAt.get(key)] ?? [0, 0, 0])];
  for (const p of places) if (`${p.col},${p.row}` === key) for (const [rid, r] of Object.entries(p.res)) { const ch = RES_CHANNEL[rid]; if (ch >= 0) y[ch] += (r.q ?? 0) / 50; }
  return y;
}
const T = settlements.map(s => {
  const hexes = [...hexOwner.entries()].filter(([, o]) => o === s.id).map(([k]) => ({ key: k, y: hexYield(k), shockUntil: -1 }));
  const terrain = new Proxy({}, { get: (_, k) => hexes.filter(h => tileAt.get(h.key) === k).length });
  const special = new Set();
  for (const p of places) if (dist([p.col, p.row], [s.col, s.row]) <= WORK_RADIUS) { const g = SPECIAL_PLACE[p.subtype]; if (g) special.add(g); if ((p.res.ore?.q ?? 0) >= 60) special.add('ore'); }
  if ((s.res.ore?.q ?? 0) >= 60) special.add('ore');
  const works = new Map(); // work → { idle }
  for (const sub of s.subs) { const w = SEED_WORK[sub]; if (w && !works.has(w)) works.set(w, { idle: 0 }); }
  return {
    id: s.id, name: s.name, col: s.col, row: s.row, startTier: s.subtype, pop: START_POP[s.subtype], hexes, terrain, special,
    works, seat: (seatOf.get(s.id) ?? []).length > 0, realmSeat: (seatOf.get(s.id) ?? []).some(fid => W.factions.find(f => f.id === fid)?.cls === 'realm'), holder: holder.get(s.id), lean: LEAN[holderCls.get(s.id) ?? (seatOf.get(s.id) ? W.factions.find(f => f.id === seatOf.get(s.id)[0]).cls : '')],
    store: 0, growth: 0, build: 0, inFood: 0, inBuild: 0, starve: 0, goods: 0, happy: 0, routesOut: [], routes: 0, yield: [0, 0, 0], foodSurplusDays: 0, woodSurplusDays: 0, traitsEver: new Set(),
  };
});
const byId = new Map(T.map(t => [t.id, t]));
// Grandfather t0 works over the slot cap (they are lost only through idleness).
const routes = []; // { from, to, good, amt, idleDays }

// ─── One day ────────────────────────────────────────────────────────────
function mult(t, k) { let m = 1; for (const w of t.works.keys()) m *= WORKS[w][k] ?? 1; return m; }
function workedYield(t, day) {
  // One hex per person; pick hexes by need: food first while short, else balanced.
  const short = t.store < t.pop * FOOD_PER_PERSON;
  const score = h => { const f = h.shockUntil > day ? SHOCK_FACTOR : 1; return (h.y[0] * (short ? 3 : 2) + h.y[1] + h.y[2]) * f; };
  const worked = [...t.hexes].sort((a, b) => score(b) - score(a) || (a.key < b.key ? -1 : 1)).slice(0, t.pop);
  const y = [...CENTRE_YIELD];
  for (const h of worked) { const f = h.shockUntil > day ? SHOCK_FACTOR : 1; for (let i = 0; i < 3; i++) y[i] += h.y[i] * f; }
  y[0] *= mult(t, 'food'); y[1] *= mult(t, 'wood'); y[2] *= mult(t, 'stone');
  return y;
}
// Land sets the base: one home per LAND_PER_HOME food the settlement's best hexes can yield.
const LAND_PER_HOME = 2.5;
function landHousing(t) { const best = t.hexes.map(h => h.y[0]).sort((a, b) => b - a).slice(0, TOWN_MAX_POP).reduce((a, b) => a + b, CENTRE_YIELD[0]); return Math.max(2, Math.round(best / LAND_PER_HOME)); }
/** A seat lifts the town ceiling only while it actually pulls resources in: held settlements, or incoming routes. */
const SEAT_MIN_INCOMING = 2;
function pulls(t) { if (!AGREED) return true; if (!t.seat) return false; const held = T.some(o => o !== t && o.holder && seatOf.get(t.id).includes(o.holder)); return held || routes.filter(r => r.to === t.id).length >= SEAT_MIN_INCOMING; }
function housing(t) { return landHousing(t) + HOUSING_PER_WORK * (t.works.has('housing') ? 1 : 0) + (pulls(t) ? PULL_HOMES * pullCount(t) : 0); }
const PULL_HOMES = 2, PULL_MAX = 6;
function pullCount(t) { const held = T.filter(o => o !== t && o.holder && seatOf.get(t.id)?.includes(o.holder)).length; return Math.min(PULL_MAX, held + routes.filter(r => r.to === t.id).length); }
function popCap(t) { return Math.min(housing(t), pulls(t) ? 99 : TOWN_MAX_POP); }
function slots(t) { return SLOTS[TIER_OF(t)]; }
function chooseWork(t) {
  const cands = Object.entries(WORKS).filter(([id, w]) => !t.works.has(id) && (!w.needs || w.needs(t)));
  if (cands.length === 0) return null;
  const surplusTag = t.yield[2] > t.yield[1] ? 'stone' : t.yield[1] > 0 ? 'wood' : 'food';
  let best = null;
  for (const [id, w] of cands) {
    let s = 1 + rng() * NOISE;
    if (!AGREED) { s = 1 + rng() * NOISE; } else {
      if (w.tag === surplusTag) s += 1;
      if (w.tag === 'food' && t.yield[0] > t.pop * FOOD_PER_PERSON * 1.3) s += 0.8;
      if (w.trait) s += 1.2; // a special good in reach pulls hard
      if (id === 'housing' && t.pop >= housing(t) - 1) s += 1.5;
      for (const ow of t.works.keys()) if (WORKS[ow].tag === w.tag) s += PATH_BONUS;
      if (t.lean === id) s += LEAN_BONUS;
    }
    if (!best || s > best.s) best = { id, s };
  }
  return best.id;
}
function nearestBuyer(t, good) {
  const cands = T.filter(o => o !== t && dist([o.col, o.row], [t.col, t.row]) <= ROUTE_RANGE && (good === 'food' ? (o.seat || o.store < o.pop * FOOD_PER_PERSON) : (o.seat || o.works.has('market'))));
  if (cands.length === 0) return null;
  const own = cands.filter(o => AGREED && o.seat && t.holder && seatOf.get(o.id)?.includes(t.holder));
  const pool = own.length ? own : cands;
  return pool.sort((a, b) => dist([a.col, a.row], [t.col, t.row]) - dist([b.col, b.row], [t.col, t.row]) || (a.id < b.id ? -1 : 1))[0];
}
function day(d) {
  if (d % SHOCK_EVERY === 0) { const t = T[Math.floor(rng() * T.length)]; const h = t.hexes[Math.floor(rng() * t.hexes.length)]; if (h) h.shockUntil = d + SHOCK_DAYS; }
  const exports = new Map(); // id → [food, build]
  for (const t of T) {
    t.yield = workedYield(t, d);
    t.landFood = t.yield[0];
    t.yield[0] += t.inFood; t.yield[1] += t.inBuild; t.inFood = 0; t.inBuild = 0; // yesterday's imports and seat draws
    // Food
    const need = t.pop * FOOD_PER_PERSON;
    let food = t.yield[0] - need;
    const storeCap = need * STORE_DAYS;
    if (food >= 0) {
      const toStore = Math.min(food, storeCap - t.store); t.store += toStore; food -= toStore;
      const cap = popCap(t);
      if (t.pop < cap) { t.growth += food; food = 0; const meter = GROWTH_BASE + GROWTH_PER_PERSON * t.pop; if (t.growth >= meter) { t.growth -= meter; t.pop += 1; } }
      t.starve = 0;
      t.foodSurplusDays = food > 0.5 ? t.foodSurplusDays + 1 : 0;
      exports.set(t.id, [food, 0]);
    } else {
      const take = Math.min(-food, t.store); t.store -= take; food += take;
      if (food < 0) { t.growth = Math.max(0, t.growth + food); if (t.growth === 0) t.starve += 1; }
      if (t.starve >= STARVE_DAYS && t.pop > 1) { t.pop -= 1; t.starve = 0; }
      t.foodSurplusDays = 0; exports.set(t.id, [0, 0]);
    }
    // Build (wood + stone are build points; upkeep first)
    let upkeep = t.pop * WOOD_PER_PERSON; for (const w of t.works.keys()) upkeep += WORKS[w].upkeep;
    let bp = t.yield[1] + t.yield[2] - upkeep;
    if (bp < 0) { // short of upkeep: the most expensive-to-keep work idles
      const worst = [...t.works.entries()].sort((a, b) => WORKS[b[0]].upkeep - WORKS[a[0]].upkeep)[0];
      if (worst) { worst[1].idle += 1; if (worst[1].idle >= IDLE_DAYS_TO_LOSE) t.works.delete(worst[0]); }
      bp = 0;
    } else for (const w of t.works.values()) w.idle = 0;
    // Special-good works idle when their good leaves reach (war, lost land) — not modelled here.
    if (t.works.size < slots(t)) {
      t.build += bp;
      const pick = chooseWork(t);
      if (pick && t.build >= WORKS[pick].cost) { t.build -= WORKS[pick].cost; t.works.set(pick, { idle: 0 }); }
      t.woodSurplusDays = 0;
    } else { t.woodSurplusDays = bp > 0.5 ? t.woodSurplusDays + 1 : 0; exports.get(t.id)[1] = bp; }
    t.goods = 0; for (const w of t.works.keys()) t.goods += WORKS[w].goods ?? 0;
  }
  // Seats pull surplus from the settlements their faction holds.
  if (AGREED) for (const t of T) {
    if (!t.holder) continue;
    const seatTown = T.find(o => o.seat && o !== t && seatOf.get(o.id)?.includes(t.holder));
    if (!seatTown) continue;
    const ex = exports.get(t.id); const f = ex[0] * SEAT_DRAW, b = ex[1] * SEAT_DRAW;
    ex[0] -= f; ex[1] -= b; seatTown.inFood += f; seatTown.inBuild += b;
  }
  // Trade routes: born from lasting surplus, die when it ends.
  for (const t of T) {
    const ex = exports.get(t.id);
    for (const [good, amt, days] of [['food', ex[0], t.foodSurplusDays], ['goods', ex[1] + t.goods, t.woodSurplusDays + (t.goods > 0 ? ROUTE_PERSIST_DAYS : 0)]]) {
      let r = routes.find(x => x.from === t.id && x.good === good);
      if (!r && amt > 0.5 && days >= ROUTE_PERSIST_DAYS) {
        const cap = 1 + (t.works.has('market') ? 1 : 0) + (t.works.has('counting_house') ? 1 : 0);
        if (routes.filter(x => x.from === t.id).length < cap) { const b = nearestBuyer(t, good); if (b) { r = { from: t.id, to: b.id, good, amt: 0, idleDays: 0, born: d, carried: 0 }; routes.push(r); } }
      }
      if (r) {
        if (amt > 0.5) { r.idleDays = 0; r.carried += amt; const b = byId.get(r.to); if (good === 'food') b.inFood += amt; else b.inBuild += amt * 0.5; }
        else if (++r.idleDays >= ROUTE_DIE_DAYS) routes.splice(routes.indexOf(r), 1);
      }
    }
  }
  for (const t of T) {
    t.routes = routes.filter(r => r.from === t.id || r.to === t.id).length;
    t.happy = 0; for (const w of t.works.keys()) t.happy += WORKS[w].happy ?? 0;
    t.happy += (t.starve > 0 ? -2 : 0) - Math.floor(t.pop / 5) + (t.routes > 0 ? 1 : 0);
  }
}

// ─── Traits & measures ──────────────────────────────────────────────────
function traits(t) {
  const s = new Set();
  for (const w of t.works.keys()) if (WORKS[w].trait) s.add(WORKS[w].trait);
  const F = t.terrain;
  if (t.landFood / Math.max(1, Math.min(t.pop, t.hexes.length)) >= 3) s.add('Breadbasket');
  if (t.works.has('timber_yard')) s.add('Timber Town');
  if (t.works.has('stoneworks')) s.add('Quarry Town');
  if (t.works.has('fishery')) s.add('Fishing Port');
  if (t.works.has('stockyard')) s.add('Horse Country');
  if (t.works.has('market') && routes.filter(r => r.from === t.id || r.to === t.id).length >= 3) s.add('Market Town');
  if (t.works.has('walls')) s.add('Walled');
  if (t.happy <= -2) s.add('Restless');
  return s;
}
const jacc = (a, b) => { const u = new Set([...a, ...b]); if (u.size === 0) return 1; let i = 0; for (const x of a) if (b.has(x)) i++; return i / u.size; };
function measure(d) {
  const pops = T.map(t => t.pop).sort((a, b) => a - b);
  const mean = pops.reduce((a, b) => a + b, 0) / pops.length;
  const sd = Math.sqrt(pops.reduce((a, b) => a + (b - mean) ** 2, 0) / pops.length);
  const q = p => pops[Math.floor(p * (pops.length - 1))];
  const tiers = {}; for (const t of T) tiers[TIER_OF(t)] = (tiers[TIER_OF(t)] ?? 0) + 1;
  let pairs = 0, distinct = 0;
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
    if (TIER_OF(T[i]) !== TIER_OF(T[j])) continue;
    pairs++; if (jacc(new Set(T[i].works.keys()), new Set(T[j].works.keys())) < 0.5) distinct++;
  }
  const tr = T.map(traits); const combos = new Set(tr.map(s => [...s].sort().join('+')));
  const count = {}; for (const s of tr) for (const x of s) count[x] = (count[x] ?? 0) + 1;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
  return { d, cv: sd / mean, iqr: q(0.75) - q(0.25), p10: q(0.1), p50: q(0.5), p90: q(0.9), tiers, distinctShare: pairs ? distinct / pairs : 1, pairs, combos: combos.size, topTrait: top[0], topShare: top[1] / T.length, routes: routes.length, popTotal: T.reduce((a, t) => a + t.pop, 0), worksMean: T.reduce((a, t) => a + t.works.size, 0) / T.length };
}

for (let d = -SETTLE_DAYS + 1; d <= 0; d++) day(d);
const M = [measure(0)];
for (let d = 1; d <= DAYS; d++) { day(d); if (d === 1 || d % 25 === 0) M.push(measure(d)); }
const L = [];
L.push(`THR-1923 settlement economy sketch — variant "${V}" — seed 42 medium world at tick 0, ${T.length} settlements, ${SETTLE_DAYS}-day worldgen settling run, then ${DAYS} game days`);
L.push(`seats: ${T.filter(t => t.seat).length} settlements hold a faction seat; ${T.filter(t => t.holder).length} have a holder`);
L.push('');
L.push('day   size CV  IQR  p10/p50/p90   tiers h/t/c/cap   same-tier pairs <50% shared   trait combos  top trait (share)        routes  works/settlement');
for (const m of M) L.push(`${String(m.d).padStart(3)}   ${m.cv.toFixed(2).padStart(6)} ${String(m.iqr).padStart(4)}  ${`${m.p10}/${m.p50}/${m.p90}`.padStart(10)}   ${`${m.tiers.hamlet ?? 0}/${m.tiers.town ?? 0}/${m.tiers.city ?? 0}/${m.tiers.capital ?? 0}`.padStart(14)}   ${`${(m.distinctShare * 100).toFixed(0)}% of ${m.pairs}`.padStart(26)}   ${String(m.combos).padStart(12)}  ${`${m.topTrait} (${(m.topShare * 100).toFixed(0)}%)`.padEnd(24)} ${String(m.routes).padStart(6)}  ${m.worksMean.toFixed(1).padStart(6)}`);
const m50 = M.find(m => m.d === 50), m150 = M.at(-1), m0 = M[0];
L.push(`total people day 1 ${M[1].popTotal} → day 150 ${m150.popTotal}`);
L.push('');
L.push('Diversity test (THR-1866 measures):');
L.push(`  1 sizes stay spread:          size CV day 1 ${M[1].cv.toFixed(2)} → day 100 ${M.find(m => m.d === 100).cv.toFixed(2)}  ${M.find(m => m.d === 100).cv >= M[1].cv ? 'PASS' : 'FAIL'}`);
L.push(`  2 building mixes distinct:    ${(m150.distinctShare * 100).toFixed(0)}% of same-tier pairs share < half their works  ${m150.distinctShare > 0.5 ? 'PASS' : 'FAIL'}`);
L.push(`  3 traits many and rare:       ${m150.combos} combos across ${T.length}; top trait ${m150.topTrait} on ${(m150.topShare * 100).toFixed(0)}%  ${m150.combos >= T.length / 3 && m150.topShare < 0.5 ? 'PASS' : 'FAIL'}`);
const noWorse = m150.cv >= m50.cv - 0.02 && m150.distinctShare >= m50.distinctShare - 0.05 && m150.combos >= m50.combos - 1;
L.push(`  4 no convergence day 50→150:  CV ${m50.cv.toFixed(2)}→${m150.cv.toFixed(2)} · distinct ${(m50.distinctShare * 100).toFixed(0)}→${(m150.distinctShare * 100).toFixed(0)}% · combos ${m50.combos}→${m150.combos}  ${noWorse ? 'PASS' : 'FAIL'}`);
L.push('');
L.push('Settlements at day 150 (start tier → pop/tier · seat · works · traits):');
for (const t of [...T].sort((a, b) => b.pop - a.pop)) L.push(`  ${t.name.padEnd(26)} ${t.startTier.padEnd(7)} → ${String(t.pop).padStart(2)} ${TIER_OF(t).padEnd(7)} ${t.seat ? 'seat' : '    '}  ${[...t.works.keys()].join(', ').padEnd(70)} ${[...traits(t)].join(', ')}`);
L.push('');
L.push(`Routes alive at day ${DAYS}: ${routes.length}`);
for (const r of routes.slice().sort((a, b) => b.carried - a.carried).slice(0, 10)) L.push(`  ${byId.get(r.from).name} → ${byId.get(r.to).name} (${r.good}, born day ${r.born}, carried ${r.carried.toFixed(0)})`);
const out = L.join('\n');
fs.writeFileSync(`scripts/proto/settlement-economy-${V}.output.txt`, out + '\n');
console.log(out);
