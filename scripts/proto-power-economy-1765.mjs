#!/usr/bin/env node
// THR-1765 prototype — NEVER MERGED (lives on proto/thr-1765-god-power).
//
// How the god's own power grows, measured on the full-window economy with every consumer multiplier
// in place. Copy of the THR-1761/1762/1763 economy (proto/thr-1763-erosion:
// scripts/proto-band-economy-1763-erosion.mjs) with three changes:
//
//  1. Holdings carry a continuous MATCH (THR-1760 units, power 1), not a band step. The band is the settled
//     cut B read on dominion = match > 0 ? match × POWER : match — so power is live on every holding.
//       tick-0 match by band: Hostile −2, Foreign +0.25 (the player picks the best-matched), Touched 1.0,
//       Held 2.2, Sovereign 3.5.
//       tended gain (THR-1762 pace at power 1: Touched ~5 d, Held ~14 d, Sovereign ~42 d), per day:
//         0.10 below 0.5 · 0.11 to 1.5 · 0.054 to 3.0 · 0.04 above, capped at 5.
//       neglect (THR-1763 decay 0.01 on an untended place): −0.04 a day, never below the tick-0 match.
//       raids (THR-1763 sink: burst 4, one landing a day per 10 Touched-or-better holdings, on the top 3):
//         −1 / L a day, L = days per band from the measured burst table (proto-erosion-1763.rates.json).
//     Neglect AND raids run together (the combined run THR-1763 left owed), from day 30.
//  2. The god's sphere scores (primary, secondary) level by triangle cost (level n costs n progress,
//     MAX 10), and POWER = (primary + secondary) / DOMINION_POWER_BASELINE 3 (THR-1760), clamped by a cap.
//     Writers per variant: mandate (+2 at ticks 300 and 600, +5 at 900, onto the primary — the THR-1767
//     model's assumption), attunement marks on essence EARNED through each sphere (+k progress per mark),
//     clash trials (Model C), Sovereign-count feedback.
//  3. Reports power by day, the signature multiplier (0.6 + 0.14 × primary), income, pool, pinned state,
//     and holdings at Held+ / Sovereign.
//
//   node scripts/proto-power-economy-1765.mjs > scripts/proto-power-economy-1765.out.txt

import { readFileSync } from "fs";

const RUN_TICKS = 1080, TICKS_PER_DAY = 12;
const SNAPSHOT_TICKS = [120, 360, 540, 720, 1080];   // days 10, 30, 45, 60, 90
const PLAYER = {
  actEvery: 6, storySpendEvery: 24, storySpend: { primary: 3, secondary: 2 },
  threadSchedule: [0, 60, 150, 300, 500, 720], bindReserve: 10, sourceStepEvery: 36, fallbackSpend: 4,
};
const SEAT_TICK = 14, SIGNATURE_TICK = 40, SPINE_CARDS = 7;
const BASE_ESSENCE_PER_TICK = 1.0, ESSENCE_PER_SEAT = 1.0;
const ASPECT_ESSENCE_PER_TICK = 0.3, ASPECT_ELIGIBILITY_TICKS = 60;
const INITIAL_ESSENCE_PER_SPHERE = 50, BASE_MAX_ESSENCE = 50, MAX_ESSENCE_PER_THREAD = 5;
const PRIMARY_SHARE = 0.35, SECONDARY_SHARE = 0.25, OTHER_SHARE_EACH = 0.04, OTHER_SPHERE_COUNT = 10;
const TIER_MAINTENANCE = { 0: 0, 1: 0.1, 2: 0.2, 3: 0.35, 4: 0.5 };
const TIER_PROMOTION_THRESHOLDS = { 2: 30, 3: 90, 4: 180 };
const BASE_SOURCE_INCOME = 0.5, SOURCE_FLOWERING_MULTIPLIER = 2.0, SOURCE_DR_BASE = 0.8;
const SANCTITY_BUILD_PER_ACTION = 0.15, SANCTITY_FLOWERING_THRESHOLD = 0.6, SOURCE_CONTROL_SUSTAIN = 0.15;
const COST = { bindThread: 10, findSource: 3, claimSource: 5, sanctify: 3 };
const WELLSPRING_TICK = 48, WELLSPRING_CARDS = 5, SOURCE_MILESTONE_CARDS = 6;
const HELD_GROUND_FLOWERING = 2, HELD_GROUND_CARDS = 4, LATENT_SOURCES = 4;
const TIER_YIELD = { 1: 0.15, 2: 0.30, 3: 0.45, 4: 0.60 };

// THR-1761 T4 band table (chosen)
const T = { cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMult: [0.5, 1, 1.1, 1.25, 1.5], source: [0, 1, 1.1, 1.25, 1.5] };
const BAND_MARK = ['x', 'F', 'T', 'H', 'S'];
const CUT = { foreign: -1.5, touched: 0.5, held: 1.5, sovereign: 3 };   // THR-1760 cut B
const MATCH0 = { Hostile: -2, Foreign: 0.25, Touched: 1.0, Held: 2.2, Sovereign: 3.5 };
const bandOf = (m, P) => { const d = m > 0 ? m * P : m; return d >= CUT.sovereign ? 4 : d >= CUT.held ? 3 : d >= CUT.touched ? 2 : d >= CUT.foreign ? 1 : 0; };
const gainPerDay = m => (m < 0.5 ? 0.10 : m < 1.5 ? 0.11 : m < 3.0 ? 0.054 : 0.04);
const MATCH_MAX = 5, NEGLECT_PER_DAY = 0.04, PRESS_FROM = 360;
const RAID_PLACES_PER_DAILY_BURST = 10;

// The god's sphere scores
const POWER_BASELINE = 3, START = { primary: 2, secondary: 1 }, MAX_SCORE = 10;
const MANDATE = [[300, 2], [600, 2], [900, 5]];
const sigMult = score => 0.6 + 0.14 * Math.min(MAX_SCORE, score);

const RATES = JSON.parse(readFileSync(new URL('./proto-erosion-1763.rates.json', import.meta.url), 'utf8'));
const pooledDays = key => RATES.pooledFromHeld[key]?.dropDaysP50 ?? null;
const BURST_GRID = [0.375, 0.75, 1.5, 3, 5, 6, 10, 20];
function burstDays(m, every) {
  const at = iv => pooledDays(`burst m=${m} every ${iv}d`);
  if (every <= BURST_GRID[0]) return at(BURST_GRID[0]);
  if (every >= 20) { const d = at(20); return d === null ? null : d * every / 20; }
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

const GODS = {
  shepherd: { name: 'Shepherd life3/spirit2 (seed 42)', mortal: 'Touched', sources: ['Touched', 'Foreign', 'Foreign', 'Foreign'] },
  thin: { name: 'Showcase mind3/spirit2 (seed 99, thinnest turf)', mortal: 'Foreign', sources: ['Foreign', 'Foreign', 'Foreign', 'Foreign'] },
  rich: { name: 'World god time3/energy2 (seed 7, richest sources)', mortal: 'Foreign', sources: ['Touched', 'Touched', 'Touched', 'Touched'] },
};

// Power-growth variants
const V = {
  V0: { name: 'V0 today: mandate only', marks: [20, 60], perMark: 0, marksOn: [] },
  V1: { name: 'V1 mandate + attunement [20,60,150,300,600] +1/mark, both bought spheres', marks: [20, 60, 150, 300, 600], perMark: 1, marksOn: ['primary', 'secondary'] },
  V1p: { name: 'V1p as V1, primary only', marks: [20, 60, 150, 300, 600], perMark: 1, marksOn: ['primary'] },
  V2: { name: 'V2 mandate + attunement +2/mark, both', marks: [20, 60, 150, 300, 600], perMark: 2, marksOn: ['primary', 'secondary'] },
  V3: { name: 'V3 Model C: attunement +1/mark primary + clash trials 120/6/2', marks: [20, 60, 150, 300, 600], perMark: 1, marksOn: ['primary'], trials: { every: 120, cost: 6, progress: 2 } },
  V4: { name: 'V4 V1 + turf feedback (+1 primary progress per Sovereign holding per 10 days)', marks: [20, 60, 150, 300, 600], perMark: 1, marksOn: ['primary', 'secondary'], feedback: true },
  V5: { name: 'V5 V1 with marks [20,60,120,200,300,450,650]', marks: [20, 60, 120, 200, 300, 450, 650], perMark: 1, marksOn: ['primary', 'secondary'] },
  // the run-long ladder: the shipped two marks, then roughly ×1.5–2 steps sized to the ~3,000 primary essence a
  // run now earns (THR-1747 economy), so the god levels about every two to three weeks to the end of the run
  V6: { name: 'V6 mandate + run-long marks [20,60,150,300,600,1000,1500,2100,2800] +1/mark, both', marks: [20, 60, 150, 300, 600, 1000, 1500, 2100, 2800], perMark: 1, marksOn: ['primary', 'secondary'] },
};
const CAPS = [null, 2.0, 5 / 3];
const NO_POWER = { name: 'P pinned at 1 (THR-1761..1763 baseline)', pinned: true, marks: [20, 60], perMark: 0, marksOn: [] };

const priced = (c, m) => (c <= 0 ? 0 : Math.max(1, Math.round(c * m)));

function simulate(G, W, cap) {
  const pool = { primary: INITIAL_ESSENCE_PER_SPHERE, secondary: INITIAL_ESSENCE_PER_SPHERE, other: INITIAL_ESSENCE_PER_SPHERE };
  const earned = { primary: 0, secondary: 0 };
  const sc = { primary: { s: START.primary, p: 0 }, secondary: { s: START.secondary, p: 0 } };
  const levelTicks = [];
  const threads = [], sources = [], snaps = [];
  const marks = { primary: 0, secondary: 0 };
  let seat = false, wellspring = false, latentLeft = LATENT_SOURCES, pendingClaim = 0, cards = SPINE_CARDS;
  let nextThread = 0, lastSourceStep = -999, lastAct = -999, srcMilestone = false, heldGround = false, lastTrial = 0;
  let upkeepMissed = 0, minPoolP = Infinity, lastUnpaid = -9999;
  const push = (k, n, t) => {
    if (W.pinned) return;
    const x = sc[k]; x.p += n;
    while (x.s < MAX_SCORE && x.p >= x.s + 1) { x.p -= x.s + 1; x.s++; levelTicks.push(t); }
  };
  const power = () => { if (W.pinned) return 1; const P = (sc.primary.s + sc.secondary.s) / POWER_BASELINE; return cap ? Math.min(cap, P) : P; };
  const pay = (k, base, bi) => { const c = priced(base, T.cost[bi]); pool[k] -= c; return c; };
  const all = () => [...sources.map(h => ({ h, src: true })), ...threads.map(h => ({ h, src: false }))];

  for (let t = 0; t <= RUN_TICKS; t++) {
    const P = power();
    if (t === SEAT_TICK) seat = true;
    if (t === SIGNATURE_TICK) cards++;
    if (t === WELLSPRING_TICK) { wellspring = true; cards += WELLSPRING_CARDS; }

    // turf: tended holdings gain match; from day 30 untended ones decay and the top 3 are raided
    const H = all();
    for (const { h, src } of H) {
      const tended = !src || !h.flowering;
      if (tended) h.m = Math.min(MATCH_MAX, h.m + gainPerDay(h.m) / TICKS_PER_DAY);
      else if (t >= PRESS_FROM && h.m > h.m0) h.m = Math.max(h.m0, h.m - NEGLECT_PER_DAY / TICKS_PER_DAY);
    }
    if (t >= PRESS_FROM) {
      const held = H.filter(x => bandOf(x.h.m, P) >= 2).length;
      if (held > 0) {
        const ranked = H.slice().sort((a, b) => b.h.m - a.h.m), focus = Math.min(3, held);
        const L = burstDays(4, focus * RAID_PLACES_PER_DAILY_BURST / held);
        // a tended holding absorbs one burst (THR-1763's rule): raids land only on untended holdings in the top 3
        if (L) for (const x of ranked.slice(0, focus)) if (x.src && x.h.flowering) x.h.m = Math.max(-2, x.h.m - 1 / (L * TICKS_PER_DAY));
      }
    }

    // income
    let total = BASE_ESSENCE_PER_TICK + (seat ? ESSENCE_PER_SEAT : 0) + threads.filter(x => x.aspect).length * ASPECT_ESSENCE_PER_TICK;
    for (const th of threads) total += TIER_YIELD[th.tier] * T.yieldMult[bandOf(th.m, P)];
    const gen = { primary: total * PRIMARY_SHARE, secondary: total * SECONDARY_SHARE, other: total * OTHER_SHARE_EACH };
    const val = s => BASE_SOURCE_INCOME * (s.flowering ? SOURCE_FLOWERING_MULTIPLIER : 1) * T.source[bandOf(s.m, P)];
    const rs = [...sources].sort((a, b) => val(b) - val(a));
    gen.primary += rs.reduce((sum, s, r) => sum + val(s) * Math.pow(SOURCE_DR_BASE, r), 0);
    const capE = BASE_MAX_ESSENCE + threads.length * MAX_ESSENCE_PER_THREAD;
    for (const k of ['primary', 'secondary', 'other']) {
      const added = Math.min(gen[k], Math.max(0, capE - pool[k]));
      pool[k] += added; if (k !== 'other') earned[k] += added;
    }
    const income = gen.primary + gen.secondary + gen.other * OTHER_SPHERE_COUNT;

    let upkeep = sources.length * SOURCE_CONTROL_SUSTAIN;
    for (const th of threads) upkeep += TIER_MAINTENANCE[th.tier];
    if (pool.primary >= upkeep) { pool.primary -= upkeep; for (const th of threads) th.ticksAtTier++; }
    else if (upkeep > 0) { upkeepMissed++; lastUnpaid = t; }
    if (t >= 120) minPoolP = Math.min(minPoolP, pool.primary);
    for (const th of threads) {
      if (th.tier < 4 && th.ticksAtTier >= TIER_PROMOTION_THRESHOLDS[th.tier + 1]) { th.tier++; th.ticksAtTier = 0; }
      else if (th.tier === 4 && !th.aspect && th.ticksAtTier >= ASPECT_ELIGIBILITY_TICKS) th.aspect = true;
    }

    // power writers
    for (const k of ['primary', 'secondary']) {
      while (marks[k] < W.marks.length && earned[k] >= W.marks[marks[k]]) {
        marks[k]++; if (marks[k] <= 2) cards++;
        if (W.marksOn.includes(k)) push(k, W.perMark, t);
      }
    }
    for (const [mt, n] of MANDATE) if (t === mt) push('primary', n, t);
    if (W.trials && t - lastTrial >= W.trials.every && pool.secondary >= W.trials.cost) { lastTrial = t; pool.secondary -= W.trials.cost; push('primary', W.trials.progress, t); }
    if (W.feedback && t > 0 && t % (10 * TICKS_PER_DAY) === 0) push('primary', H.filter(x => bandOf(x.h.m, P) === 4).length, t);

    // the player acts
    const firstBand = () => (threads.length ? bandOf(threads[0].m, P) : bandOf(MATCH0[G.mortal], P));
    if (t % PLAYER.storySpendEvery === 0 && t > 0) {
      const bi = firstBand(), p = priced(PLAYER.storySpend.primary, T.cost[bi]), s = priced(PLAYER.storySpend.secondary, T.cost[bi]);
      if (pool.primary >= p) pool.primary -= p;
      if (pool.secondary >= s) pool.secondary -= s;
    }
    if (t - lastAct >= PLAYER.actEvery) {
      const mb = bandOf(MATCH0[G.mortal], P), bindPrice = priced(COST.bindThread, T.cost[mb]);
      if (nextThread < PLAYER.threadSchedule.length && t >= PLAYER.threadSchedule[nextThread] && pool.primary >= bindPrice + PLAYER.bindReserve) {
        pay('primary', COST.bindThread, mb);
        threads.push({ tier: 1, ticksAtTier: 0, aspect: false, m: MATCH0[G.mortal], m0: MATCH0[G.mortal] }); nextThread++; lastAct = t;
      } else if (wellspring && t - lastSourceStep >= PLAYER.sourceStepEvery) {
        const dormant = sources.find(s => !s.flowering);
        const nb = G.sources[Math.min(sources.length, G.sources.length - 1)], nbi = bandOf(MATCH0[nb], P);
        if (dormant && pool.primary >= priced(COST.sanctify, T.cost[bandOf(dormant.m, P)])) {
          pay('primary', COST.sanctify, bandOf(dormant.m, P)); dormant.sanctity += SANCTITY_BUILD_PER_ACTION;
          if (dormant.sanctity >= SANCTITY_FLOWERING_THRESHOLD - 1e-9) dormant.flowering = true;
          lastSourceStep = t; lastAct = t;
        } else if (pendingClaim > 0 && pool.other >= priced(COST.claimSource, T.cost[nbi])) {
          pay('other', COST.claimSource, nbi); pendingClaim--;
          sources.push({ sanctity: 0, flowering: false, m: MATCH0[nb], m0: MATCH0[nb] }); lastSourceStep = t; lastAct = t;
        } else if (latentLeft > 0 && pool.other >= priced(COST.findSource, T.cost[nbi])) {
          pay('other', COST.findSource, nbi); latentLeft--; pendingClaim++; lastSourceStep = t; lastAct = t;
        }
      } else {
        const bi = firstBand(), c = priced(PLAYER.fallbackSpend, T.cost[bi]);
        if (pool.primary >= c) { pool.primary -= c; lastAct = t; }
      }
    }
    const flowering = sources.filter(s => s.flowering).length;
    if (!srcMilestone && (sources.length >= 3 || flowering >= 1)) { srcMilestone = true; cards += SOURCE_MILESTONE_CARDS; }
    if (!heldGround && flowering >= HELD_GROUND_FLOWERING) { heldGround = true; cards += HELD_GROUND_CARDS; }

    if (SNAPSHOT_TICKS.includes(t)) {
      const bands = all().map(x => bandOf(x.h.m, P));
      snaps.push({
        day: t / TICKS_PER_DAY, P, prim: sc.primary.s, sec: sc.secondary.s, sig: sigMult(sc.primary.s),
        income, poolP: pool.primary, pinned: pool.primary < 1 || t - lastUnpaid <= 60,
        heldPlus: bands.filter(b => b >= 3).length, sov: bands.filter(b => b === 4).length, n: bands.length,
        bandStr: [...threads.map(h => BAND_MARK[bandOf(h.m, P)]), '|', ...sources.map(h => BAND_MARK[bandOf(h.m, P)])].join(''),
      });
    }
  }
  return { snaps, upkeepMissed, minPoolP, levelTicks, earned };
}

const f1 = x => (Math.round(x * 10) / 10).toFixed(1), f2 = x => x.toFixed(2);
console.log('# THR-1765 — god power growth on the full-window economy (T4 band table, THR-1762 pace, THR-1763 neglect + raids TOGETHER)');
console.log('# per god: power d10/30/45/60/90 · primary/secondary score d90 · signature mult d90 · income d10/30/45/60/90 · pool d90 · unpaid ticks · min pool · Held+/Sovereign holdings d90 · bands d90 · sphere levels (days)');
const runs = [[NO_POWER, null], ...Object.values(V).flatMap(W => CAPS.map(c => [W, c]))];
for (const [W, cap] of runs) {
  console.log(`\n## ${W.name}${cap ? ` — power cap ${f2(cap)}` : W.pinned ? '' : ' — no cap'}`);
  for (const [gk, G] of Object.entries(GODS)) {
    const { snaps, upkeepMissed, minPoolP, levelTicks, earned } = simulate(G, W, cap);
    const L = snaps[snaps.length - 1];
    const pinned = snaps.some(s => s.pinned) ? '  PINNED' : '';
    console.log(`  ${gk.padEnd(8)} P ${snaps.map(s => f2(s.P)).join('/')}  score ${L.prim}/${L.sec}  sig ×${f2(L.sig)}  income ${snaps.map(s => f1(s.income)).join('/')}  pool ${Math.round(L.poolP)}  unpaid ${upkeepMissed}  min ${f1(minPoolP)}  H+ ${L.heldPlus}/${L.n} S ${L.sov}  ${L.bandStr}  levels@d ${levelTicks.map(x => Math.round(x / TICKS_PER_DAY)).join(',') || '-'}  earned ${Math.round(earned.primary)}/${Math.round(earned.secondary)}${pinned}`);
  }
}
