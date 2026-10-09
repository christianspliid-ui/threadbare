#!/usr/bin/env node
// THR-1763 copy of the THR-1762 economy (proto/thr-1762-frontier-pace:scripts/proto-band-economy-1762-pace.mjs). NEVER MERGED.
// Adds one `pressed` variant per opposition shape measured by scripts/proto-erosion-1763.ts: every holding
// climbs one band per 14 days while tended (the chosen THR-1762 pace), and loses one band per L days while
// pressed, L read from scripts/proto-erosion-1763.rates.json (untended, from Held, pooled over four gods):
//   decay r      — threads are always tended (a threaded mortal is a carrier); a source is tended while the
//                  god works it (claimed → flowering), untended after; untended holdings decay toward
//                  their tick-0 band (never below it).
//   burst m / k  — the single most valuable holding (highest band; sources before threads) is pressed, floor Hostile.
//   sink m / N   — H = holdings at Held+; the top min(3,H) are pressed, each at the measured rate for a burst
//                  every 3N/H days (H/N bursts a day spread over the top 3) — so the sink grows with the god.
//   doom         — every holding loses the measured bands at each crossing (days 18/36/54/72), per god vector.
// Rival-shaped pressure starts at day 30 (the THR-1761 stand-in's start, for comparability).
// Also the THR-1761 harsh `pressed` stand-in on T4 and on T4 with a softened Hostile row.
//
//   node scripts/proto-band-economy-1763-erosion.mjs > scripts/proto-band-economy-1763-erosion.out.txt
//
// --- original header ---
// THR-1761 prototype — NEVER MERGED (lives on proto/thr-1761-band-buys).
//
// What the Dominion band buys. The THR-1767 full-window model (scripts/power-progression-model.mjs)
// with one extension: every held mortal and every held source carries a band, and four consumers
// read it — card cost, thread yield, source income (and, outside the essence loop, the odds).
// Base economy = the engine on main after THR-1747 (retuned upkeep, Wellspring at bond + 48,
// source upkeep charged, held-ground milestone at 2 flowering → 4 cards). Bands come from
// scripts/proto-band-holdings-1761.out.txt (the settled THR-1760 cut, seeds 42/99/7, tick 0).
//
//   node scripts/proto-band-economy-1761.mjs              # all tables × gods × turf scenarios
//   node scripts/proto-band-economy-1761.mjs --summary    # one line per run

import { readFileSync } from "fs";

const RUN_TICKS = 1080, TICKS_PER_DAY = 12;
const SNAPSHOT_TICKS = [120, 360, 720, 1080];            // days 10, 30, 60, 90 (the ticket's four)
const PLAYER = {
  actEvery: 6, storySpendEvery: 24, storySpend: { primary: 3, secondary: 2 },
  threadSchedule: [0, 60, 150, 300, 500, 720], bindReserve: 10, sourceStepEvery: 36, fallbackSpend: 4,
};
const SEAT_TICK = 14, SIGNATURE_TICK = 40, SPINE_CARDS = 7;
const BASE_ESSENCE_PER_TICK = 1.0, ESSENCE_PER_THREAD = 0.1, ESSENCE_PER_SEAT = 1.0;
const ASPECT_ESSENCE_PER_TICK = 0.3, ASPECT_ELIGIBILITY_TICKS = 60;
const INITIAL_ESSENCE_PER_SPHERE = 50, BASE_MAX_ESSENCE = 50, MAX_ESSENCE_PER_THREAD = 5;
const PRIMARY_SHARE = 0.35, SECONDARY_SHARE = 0.25, OTHER_SHARE_EACH = 0.04, OTHER_SPHERE_COUNT = 10;
const TIER_MAINTENANCE = { 0: 0, 1: 0.1, 2: 0.2, 3: 0.35, 4: 0.5 };      // shipped THR-1747
const TIER_PROMOTION_THRESHOLDS = { 2: 30, 3: 90, 4: 180 };
const BASE_SOURCE_INCOME = 0.5, SOURCE_FLOWERING_MULTIPLIER = 2.0, SOURCE_DR_BASE = 0.8;
const SANCTITY_BUILD_PER_ACTION = 0.15, SANCTITY_FLOWERING_THRESHOLD = 0.6, SOURCE_CONTROL_SUSTAIN = 0.15;
const ATTUNEMENT_MARKS = [20, 60];
const COST = { bindThread: 10, findSource: 3, claimSource: 5, sanctify: 3 };
const WELLSPRING_TICK = 48, WELLSPRING_CARDS = 5;
const SOURCE_MILESTONE_CARDS = 6;                        // 3 held or first flowering → six econ verbs
const HELD_GROUND_FLOWERING = 2, HELD_GROUND_CARDS = 4;  // THR-1747 E5
const LATENT_SOURCES = 4;                                // 6 per map; ~4 in find range
const TIER_YIELD = { 1: 0.15, 2: 0.30, 3: 0.45, 4: 0.60 }; // THR-1745 Model B per-tier yield

const BANDS = ['Hostile', 'Foreign', 'Touched', 'Held', 'Sovereign'];
const BAND_MARK = ['x', 'F', 'T', 'H', 'S'];  // x = Hostile, so it never reads as Held
const B = Object.fromEntries(BANDS.map((b, i) => [b, i]));

// ─── Band tables: T4 (chosen by THR-1761) and T4 with a softened Hostile row ─────
const TABLES = {
  par: {
    name: 'T4 par at Foreign (cost 1.5/1/0.9/0.8/0.75; yield ×0.5/1/1.1/1.25/1.5; source ×0/1/1.1/1.25/1.5)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'tier', yieldMult: [0.5, 1, 1.1, 1.25, 1.5], source: [0, 1, 1.1, 1.25, 1.5],
  },
  parSoft: {
    name: 'T4-soft: T4 with the Hostile row softened (yield 0.5→0.75, source 0→0.5)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'tier', yieldMult: [0.75, 1, 1.1, 1.25, 1.5], source: [0.5, 1, 1.1, 1.25, 1.5],
  },
};

// ─── The three gods (bands from proto-band-holdings-1761.out.txt, tick 0) ─────
// mortal: band of the best-matched mortals a player would thread; sources: the 4 claimed, best first.
// erosionGod: which proto-erosion-1763 god vector stands in for this god's per-god doom rate.
const GODS = {
  shepherd: { name: 'Shepherd life3/spirit2 (seed 42)', mortal: 'Touched', sources: ['Touched', 'Foreign', 'Foreign', 'Foreign'], erosionGod: 'shepherd' },
  thin: { name: 'Showcase mind3/spirit2 (seed 99, thinnest turf)', mortal: 'Foreign', sources: ['Foreign', 'Foreign', 'Foreign', 'Foreign'], erosionGod: 'showcase' },
  // time/energy: doom's entropy is time's ally, not its opposite — no measured god; doom rate taken as 0.
  rich: { name: 'World god time3/energy2 (seed 7, richest sources)', mortal: 'Foreign', sources: ['Touched', 'Touched', 'Touched', 'Touched'], erosionGod: null },
};

// ─── Measured erosion rates (scripts/proto-erosion-1763.ts) ────────────────────
const RATES = JSON.parse(readFileSync(new URL('./proto-erosion-1763.rates.json', import.meta.url), 'utf8'));
const pooledDays = key => RATES.pooledFromHeld[key]?.dropDaysP50 ?? null; // null = never within 90 days
const BURST_GRID = [0.375, 0.75, 1.5, 3, 5, 6, 10, 20];
/** Days to lose one band for a burst of m every `every` days: measured on the grid, log-interpolated between. */
function burstDays(m, every) {
  const at = iv => pooledDays(`burst m=${m} every ${iv}d`);
  if (every <= BURST_GRID[0]) return at(BURST_GRID[0]);
  if (every >= BURST_GRID[BURST_GRID.length - 1]) { const d = at(20); return d === null ? null : d * every / 20; }
  for (let i = 1; i < BURST_GRID.length; i++) {
    const lo = BURST_GRID[i - 1], hi = BURST_GRID[i];
    if (every <= hi) {
      const a = at(lo), b = at(hi);
      if (a === null || b === null) return a ?? b;
      const f = Math.log(every / lo) / Math.log(hi / lo);
      return Math.exp(Math.log(a) + f * (Math.log(b) - Math.log(a)));
    }
  }
  return null;
}
/** Bands a god loses per doom crossing: measured untended from Held, per vector (bands lost by day 90 / 4 crossings). */
function doomBandsPerCrossing(godKey) {
  if (!godKey) return 0;
  const r = RATES.perGod?.Held?.[godKey]?.['doom (shipped)'];
  if (!r || r.dropP50 === null) return 0;
  // p50 days to lose the first band / crossing cadence 18 days → one band per ceil(p50/18) crossings
  return 1 / Math.max(1, Math.round(r.dropP50 / 18));
}

// ─── Turf scenarios ────────────────────────────────────────────────────────────
// Legacy (closed form): static / growing (GROW_EVERY) / pressed (THR-1761 harsh stand-in).
// New (stateful, per tick): grow14 baseline and one pressed variant per measured opposition shape.
const GROW_EVERY = 168, PRESS_FROM = 360, PRESS_EVERY = 240, TENDED_GROW_EVERY = 168;
const DOOM_CROSSINGS = [216, 432, 648, 864];
const SCENARIOS = [
  { name: 'growing (1 band / 14 d, no erosion — the THR-1762 baseline)', kind: 'legacy', legacy: 'growing' },
  { name: '1761 harsh pressed (every holding −1 band / 20 d from day 30)', kind: 'legacy', legacy: 'pressed' },
  ...[0.005, 0.01, 0.02].map(r => ({ name: `shape 1 decay+opp r=${r} (untended sources relax to tick-0 band)`, kind: 'decay', L: pooledDays(`decay+opp r=${r}`) })),
  ...[3, 4, 6].flatMap(m => [5, 10, 20].map(k => ({ name: `shape 2 burst m=${m} every ${k}d on the top holding`, kind: 'burst', L: burstDays(m, k) }))),
  ...[4, 6].flatMap(m => [5, 10].map(N => ({ name: `shape 3 sink m=${m} N=${N} (H/N bursts a day on the top 3)`, kind: 'sink', m, N }))),
  { name: 'shape 4 doom as shipped (crossings d18/36/54/72)', kind: 'doom' },
];

function bandAt(h, t, scenario) {
  if (scenario.kind !== 'legacy') return h.b;
  let i = B[h.band0];
  if (scenario.legacy === 'growing') i += Math.floor((t - h.since) / GROW_EVERY);
  if (scenario.legacy === 'pressed' && t >= PRESS_FROM) i -= Math.floor((t - Math.max(PRESS_FROM, h.since)) / PRESS_EVERY) + 1;
  return Math.max(0, Math.min(4, i));
}

/** One tick of the stateful band model: tended holdings grow, pressed holdings lose. */
function stepBands(t, threads, sources, scenario, G) {
  if (scenario.kind === 'legacy') return;
  const all = [...sources.map(h => ({ h, src: true })), ...threads.map(h => ({ h, src: false }))];
  for (const { h, src } of all) {
    h.b ??= B[h.band0]; h.acc ??= 0;
    // tended: threads always (carrier); sources while being worked (not yet flowering) — and always outside shape 1
    const tended = !src || !h.flowering || scenario.kind !== 'decay';
    if (tended) h.acc += 1 / TENDED_GROW_EVERY;
    h.pressRate = 0;
  }
  if (t >= PRESS_FROM) {
    const ranked = all.slice().sort((a, b) => (b.h.b - a.h.b) || (Number(b.src) - Number(a.src)));
    if (scenario.kind === 'decay' && scenario.L) {
      for (const { h, src } of all) if (src && h.flowering && h.b > B[h.band0]) h.pressRate = 1 / (scenario.L * TICKS_PER_DAY);
    } else if (scenario.kind === 'burst' && scenario.L && ranked.length) {
      ranked[0].h.pressRate = 1 / (scenario.L * TICKS_PER_DAY);
    } else if (scenario.kind === 'sink') {
      const H = all.filter(x => x.h.b >= B.Held).length;
      if (H > 0) {
        const focus = Math.min(3, H), every = focus * scenario.N / H, L = burstDays(scenario.m, every);
        if (L) for (const x of ranked.slice(0, focus)) x.h.pressRate = 1 / (L * TICKS_PER_DAY);
      }
    }
  }
  const doomLoss = scenario.kind === 'doom' && DOOM_CROSSINGS.includes(t) ? doomBandsPerCrossing(G.erosionGod) : 0;
  for (const { h } of all) {
    h.acc -= h.pressRate + doomLoss;
    const floor = scenario.kind === 'decay' ? B[h.band0] : 0;
    while (h.acc >= 1) { h.acc -= 1; if (h.b < 4) h.b++; else h.acc = 0; }
    while (h.acc <= -1) { h.acc += 1; if (h.b > floor) h.b--; else h.acc = 0; }
  }
}
const priced = (c, m) => (c <= 0 ? 0 : Math.max(1, Math.round(c * m)));

function simulate(T, G, scenario) {
  const pool = { primary: INITIAL_ESSENCE_PER_SPHERE, secondary: INITIAL_ESSENCE_PER_SPHERE, other: INITIAL_ESSENCE_PER_SPHERE };
  const earned = { primary: 0, secondary: 0 };
  const threads = [], sources = [], snaps = [], cardEvents = [];
  const marks = { primary: 0, secondary: 0 };
  let seat = false, wellspring = false, latentLeft = LATENT_SOURCES, pendingClaim = 0, cards = SPINE_CARDS;
  let nextThread = 0, lastSourceStep = -999, lastAct = -999, srcMilestone = false, heldGround = false;
  let spent = 0, spentAtPar = 0, upkeepMissed = 0, minPoolP = Infinity, lastUnpaid = -9999;
  const pay = (k, base, bandIdx) => { const c = priced(base, T.cost[bandIdx]); pool[k] -= c; spent += c; spentAtPar += base; return c; };
  const firstBand = t => (threads.length ? bandAt(threads[0], t, scenario) : B[G.mortal]);
  const grantCards = (t, n) => { cards += n; cardEvents.push(t); };

  for (let t = 0; t <= RUN_TICKS; t++) {
    if (t === SEAT_TICK) seat = true;
    if (t === SIGNATURE_TICK) grantCards(t, 1);
    if (t === WELLSPRING_TICK) { wellspring = true; grantCards(t, WELLSPRING_CARDS); }
    stepBands(t, threads, sources, scenario, G);

    // income
    let total = BASE_ESSENCE_PER_TICK + (seat ? ESSENCE_PER_SEAT : 0) + threads.filter(x => x.aspect).length * ASPECT_ESSENCE_PER_TICK;
    for (const th of threads) {
      const bi = bandAt(th, t, scenario);
      total += T.yieldMode === 'flat' ? ESSENCE_PER_THREAD
        : T.yieldMode === 'flatBand' ? ESSENCE_PER_THREAD * T.yieldMult[bi]
        : T.yieldMode === 'gate' ? (T.yieldMult[bi] ? TIER_YIELD[th.tier] : ESSENCE_PER_THREAD)
        : TIER_YIELD[th.tier] * T.yieldMult[bi];
    }
    const gen = { primary: total * PRIMARY_SHARE, secondary: total * SECONDARY_SHARE, other: total * OTHER_SHARE_EACH };
    const val = s => BASE_SOURCE_INCOME * (s.flowering ? SOURCE_FLOWERING_MULTIPLIER : 1) * T.source[bandAt(s, t, scenario)];
    const ranked = [...sources].sort((a, b) => val(b) - val(a));
    const srcIncome = ranked.reduce((sum, s, r) => sum + val(s) * Math.pow(SOURCE_DR_BASE, r), 0);
    gen.primary += srcIncome;
    const cap = BASE_MAX_ESSENCE + threads.length * MAX_ESSENCE_PER_THREAD;
    for (const k of ['primary', 'secondary', 'other']) {
      const added = Math.min(gen[k], Math.max(0, cap - pool[k]));
      pool[k] += added; if (k !== 'other') earned[k] += added;
    }
    const income = gen.primary + gen.secondary + gen.other * OTHER_SPHERE_COUNT;

    // upkeep (primary; all-or-nothing)
    let upkeep = sources.length * SOURCE_CONTROL_SUSTAIN;
    for (const th of threads) upkeep += TIER_MAINTENANCE[th.tier];
    if (pool.primary >= upkeep) { pool.primary -= upkeep; for (const th of threads) th.ticksAtTier++; }
    else if (upkeep > 0) { upkeepMissed++; lastUnpaid = t; }
    if (t >= 120) minPoolP = Math.min(minPoolP, pool.primary);

    for (const th of threads) {
      if (th.tier < 4 && th.ticksAtTier >= TIER_PROMOTION_THRESHOLDS[th.tier + 1]) { th.tier++; th.ticksAtTier = 0; }
      else if (th.tier === 4 && !th.aspect && th.ticksAtTier >= ASPECT_ELIGIBILITY_TICKS) th.aspect = true;
    }
    for (const k of ['primary', 'secondary']) {
      while (marks[k] < ATTUNEMENT_MARKS.length && earned[k] >= ATTUNEMENT_MARKS[marks[k]]) { marks[k]++; grantCards(t, 1); }
    }

    // the player acts (every price read through the target's band)
    if (t % PLAYER.storySpendEvery === 0 && t > 0) {
      const bi = firstBand(t);
      const p = priced(PLAYER.storySpend.primary, T.cost[bi]), s = priced(PLAYER.storySpend.secondary, T.cost[bi]);
      if (pool.primary >= p) { pool.primary -= p; spent += p; spentAtPar += PLAYER.storySpend.primary; }
      if (pool.secondary >= s) { pool.secondary -= s; spent += s; spentAtPar += PLAYER.storySpend.secondary; }
    }
    if (t - lastAct >= PLAYER.actEvery) {
      const bindPrice = priced(COST.bindThread, T.cost[B[G.mortal]]);
      if (nextThread < PLAYER.threadSchedule.length && t >= PLAYER.threadSchedule[nextThread] && pool.primary >= bindPrice + PLAYER.bindReserve) {
        pay('primary', COST.bindThread, B[G.mortal]);
        threads.push({ tier: 1, ticksAtTier: 0, aspect: false, band0: G.mortal, since: t }); nextThread++; lastAct = t;
      } else if (wellspring && t - lastSourceStep >= PLAYER.sourceStepEvery) {
        const dormant = sources.find(s => !s.flowering);
        const nextBand = G.sources[Math.min(sources.length, G.sources.length - 1)];
        if (dormant && pool.primary >= priced(COST.sanctify, T.cost[bandAt(dormant, t, scenario)])) {
          pay('primary', COST.sanctify, bandAt(dormant, t, scenario)); dormant.sanctity += SANCTITY_BUILD_PER_ACTION;
          if (dormant.sanctity >= SANCTITY_FLOWERING_THRESHOLD - 1e-9) dormant.flowering = true;
          lastSourceStep = t; lastAct = t;
        } else if (pendingClaim > 0 && pool.other >= priced(COST.claimSource, T.cost[B[nextBand]])) {
          pay('other', COST.claimSource, B[nextBand]); pendingClaim--;
          sources.push({ sanctity: 0, flowering: false, band0: nextBand, since: t }); lastSourceStep = t; lastAct = t;
        } else if (latentLeft > 0 && pool.other >= priced(COST.findSource, T.cost[B[nextBand]])) {
          pay('other', COST.findSource, B[nextBand]); latentLeft--; pendingClaim++; lastSourceStep = t; lastAct = t;
        }
      } else {
        const bi = firstBand(t), c = priced(PLAYER.fallbackSpend, T.cost[bi]);
        if (pool.primary >= c) { pool.primary -= c; spent += c; spentAtPar += PLAYER.fallbackSpend; lastAct = t; }
      }
    }
    const flowering = sources.filter(s => s.flowering).length;
    if (!srcMilestone && (sources.length >= 3 || flowering >= 1)) { srcMilestone = true; grantCards(t, SOURCE_MILESTONE_CARDS); }
    if (!heldGround && flowering >= HELD_GROUND_FLOWERING) { heldGround = true; grantCards(t, HELD_GROUND_CARDS); }

    if (SNAPSHOT_TICKS.includes(t)) snaps.push({
      day: t / TICKS_PER_DAY, pinned: pool.primary < 1 || t - lastUnpaid <= 60, income, srcIncome, net: gen.primary - upkeep, poolP: pool.primary, threads: threads.length,
      maxTier: Math.max(0, ...threads.map(x => x.tier)), sources: sources.length, flowering, cards,
      bands: [...threads.map(h => BAND_MARK[bandAt(h, t, scenario)]), '|', ...sources.map(h => BAND_MARK[bandAt(h, t, scenario)])].join(''),
      priceIndex: spentAtPar ? spent / spentAtPar : 1,
    });
  }
  return { upkeepMissed, minPoolP, snaps, lastCardDay: cardEvents.length ? Math.round(cardEvents[cardEvents.length - 1] / TICKS_PER_DAY) : null };
}

const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
const PIN = 1; // a primary pool under 1 essence is pinned: upkeep (all-or-nothing) and every priced verb fail
console.log("# THR-1763 economy under the measured opposition shapes (T4 and T4-soft), three gods");
console.log("# columns: income/tick d10/30/60/90 · primary pool d10/30/60/90 (* = pinned: pool < 1, or upkeep went unpaid in the 5 days before) · ticks upkeep unpaid (of 1080) · min pool after d10 · bands at d90 (threads | sources)");
for (const scenario of SCENARIOS) {
  for (const [tk, T] of Object.entries(TABLES)) {
    console.log(`
## ${scenario.name} — ${tk === "par" ? "T4" : "T4-soft"}${scenario.L !== undefined ? ` (L = ${scenario.L === null ? "never in 90 d" : scenario.L.toFixed(1) + " d per band"})` : ""}`);
    for (const [gk, G] of Object.entries(GODS)) {
      const { snaps, upkeepMissed, minPoolP } = simulate(T, G, scenario);
      const pools = snaps.map(x => `${Math.round(x.poolP)}${x.pinned ? "*" : ""}`).join(" / ");
      const pinned = snaps.some(x => x.pinned) ? "  PINNED" : "";
      console.log(`  ${gk.padEnd(9)} income ${snaps.map(x => f1(x.income)).join(" / ").padEnd(24)} pool ${pools.padEnd(22)} unpaid ${String(upkeepMissed).padStart(4)}  min ${f1(minPoolP).padStart(5)}  d90 ${snaps[snaps.length - 1].bands}${pinned}`);
    }
  }
}
