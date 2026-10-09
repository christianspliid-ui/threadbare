#!/usr/bin/env node
// THR-1762 copy of proto/thr-1761-band-buys:scripts/proto-band-economy-1761.mjs with GROW_EVERY read from env. NEVER MERGED.
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

// ─── Candidate band tables (index = band H F T Hd S) ─────────────────────────
const TABLES = {
  none: {
    name: 'T0 no band (main after THR-1747, flat 0.1 thread yield)',
    cost: [1, 1, 1, 1, 1], yieldMode: 'flat', yieldMult: [1, 1, 1, 1, 1], source: [1, 1, 1, 1, 1],
  },
  sketch: {
    name: 'T1 the 2026-10-05 sketch (sources Held+ only; per-tier yield Held+ only)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'gate', yieldMult: [0, 0, 0, 1, 1], source: [0, 0, 0, 1, 1],
  },
  graded: {
    name: 'T2 graded (cost 1.5/1/0.9/0.8/0.75; yield and source ×0/0.5/1/1.25/1.5)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'tier', yieldMult: [0, 0.5, 1, 1.25, 1.5], source: [0, 0.5, 1, 1.25, 1.5],
  },
  steep: {
    name: 'T3 steep (cost 2/1/0.85/0.7/0.6; yield and source ×0/0.5/1/1.5/2)',
    cost: [2, 1, 0.85, 0.7, 0.6], yieldMode: 'tier', yieldMult: [0, 0.5, 1, 1.5, 2], source: [0, 0.5, 1, 1.5, 2],
  },
  // Par at Foreign: a holding on neutral ground pays exactly what main pays today (per-tier yield
  // aside); home turf adds upside, hostile ground takes it away.
  par: {
    name: 'T4 par at Foreign (cost 1.5/1/0.9/0.8/0.75; yield ×0.5/1/1.1/1.25/1.5; source ×0/1/1.1/1.25/1.5)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'tier', yieldMult: [0.5, 1, 1.1, 1.25, 1.5], source: [0, 1, 1.1, 1.25, 1.5],
  },
  parSteep: {
    name: 'T5 par at Foreign, steeper (cost 1.5/1/0.9/0.8/0.75; yield ×0.5/1/1.25/1.5/2; source ×0/1/1.25/1.5/2)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'tier', yieldMult: [0.5, 1, 1.25, 1.5, 2], source: [0, 1, 1.25, 1.5, 2],
  },
  parFlatYield: {
    name: 'T6 par at Foreign, flat 0.1 yield kept (cost 1.5/1/0.9/0.8/0.75; yield 0.1 ×0.5/1/1.1/1.25/1.5; source ×0/1/1.1/1.25/1.5)',
    cost: [1.5, 1, 0.9, 0.8, 0.75], yieldMode: 'flatBand', yieldMult: [0.5, 1, 1.1, 1.25, 1.5], source: [0, 1, 1.1, 1.25, 1.5],
  },
};

// ─── The three gods (bands from proto-band-holdings-1761.out.txt, tick 0) ─────
// mortal: band of the best-matched mortals a player would thread; sources: the 4 claimed, best first.
const GODS = {
  shepherd: { name: 'Shepherd life3/spirit2 (seed 42)', mortal: 'Touched', sources: ['Touched', 'Foreign', 'Foreign', 'Foreign'] },
  thin: { name: 'Showcase mind3/spirit2 (seed 99, thinnest turf)', mortal: 'Foreign', sources: ['Foreign', 'Foreign', 'Foreign', 'Foreign'] },
  rich: { name: 'World god time3/energy2 (seed 7, richest sources)', mortal: 'Foreign', sources: ['Touched', 'Touched', 'Touched', 'Touched'] },
};

// ─── Turf scenarios (stand-ins for writers this map has not decided yet) ──────
// static: bands never move (no frontier verbs, THR-1762; no secondary-actor writer, THR-1764).
// growing: a holding climbs one band per GROW_EVERY ticks held (a proxy, not a design).
// pressed: from day 30, every holding loses one band per PRESS_EVERY ticks (a proxy for THR-1763).
const GROW_EVERY = Number(process.env.GROW_EVERY ?? 240), PRESS_FROM = 360, PRESS_EVERY = 240;
const SCENARIOS = ['static', 'growing', 'pressed'];

function bandAt(h, t, scenario) {
  let i = B[h.band0];
  if (scenario === 'growing') i += Math.floor((t - h.since) / GROW_EVERY);
  if (scenario === 'pressed' && t >= PRESS_FROM) i -= Math.floor((t - Math.max(PRESS_FROM, h.since)) / PRESS_EVERY) + 1;
  return Math.max(0, Math.min(4, i));
}
const priced = (c, m) => (c <= 0 ? 0 : Math.max(1, Math.round(c * m)));

function simulate(T, G, scenario) {
  const pool = { primary: INITIAL_ESSENCE_PER_SPHERE, secondary: INITIAL_ESSENCE_PER_SPHERE, other: INITIAL_ESSENCE_PER_SPHERE };
  const earned = { primary: 0, secondary: 0 };
  const threads = [], sources = [], snaps = [], cardEvents = [];
  const marks = { primary: 0, secondary: 0 };
  let seat = false, wellspring = false, latentLeft = LATENT_SOURCES, pendingClaim = 0, cards = SPINE_CARDS;
  let nextThread = 0, lastSourceStep = -999, lastAct = -999, srcMilestone = false, heldGround = false;
  let spent = 0, spentAtPar = 0;
  const pay = (k, base, bandIdx) => { const c = priced(base, T.cost[bandIdx]); pool[k] -= c; spent += c; spentAtPar += base; return c; };
  const firstBand = t => (threads.length ? bandAt(threads[0], t, scenario) : B[G.mortal]);
  const grantCards = (t, n) => { cards += n; cardEvents.push(t); };

  for (let t = 0; t <= RUN_TICKS; t++) {
    if (t === SEAT_TICK) seat = true;
    if (t === SIGNATURE_TICK) grantCards(t, 1);
    if (t === WELLSPRING_TICK) { wellspring = true; grantCards(t, WELLSPRING_CARDS); }

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
      day: t / TICKS_PER_DAY, income, srcIncome, net: gen.primary - upkeep, poolP: pool.primary, threads: threads.length,
      maxTier: Math.max(0, ...threads.map(x => x.tier)), sources: sources.length, flowering, cards,
      bands: [...threads.map(h => BAND_MARK[bandAt(h, t, scenario)]), '|', ...sources.map(h => BAND_MARK[bandAt(h, t, scenario)])].join(''),
      priceIndex: spentAtPar ? spent / spentAtPar : 1,
    });
  }
  return { snaps, lastCardDay: cardEvents.length ? Math.round(cardEvents[cardEvents.length - 1] / TICKS_PER_DAY) : null };
}

const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
const summary = process.argv.includes('--summary');
for (const scenario of SCENARIOS) {
  console.log(`\n# Turf scenario: ${scenario}`);
  for (const [tk, T] of Object.entries(TABLES)) {
    console.log(`\n## ${T.name}`);
    for (const [gk, G] of Object.entries(GODS)) {
      const { snaps, lastCardDay } = simulate(T, G, scenario);
      if (summary) {
        console.log(`  ${gk.padEnd(9)} income d10/30/60/90 ${snaps.map(s => f1(s.income)).join(' / ')} · net ${snaps.map(s => f1(s.net)).join(' / ')} · src ${snaps.map(s => f1(s.srcIncome)).join(' / ')} · cards ${snaps[snaps.length - 1].cards} (last d${lastCardDay}) · price×${snaps[snaps.length - 1].priceIndex.toFixed(2)}`);
        continue;
      }
      console.log(`\n### ${G.name}\n`);
      console.log('| Day | Income / tick | Source income | Primary net after upkeep | Primary pool | Threads (max tier) | Sources (flowering) | Cards held | Bands (threads | sources) | Price index |');
      console.log('|---|---|---|---|---|---|---|---|---|---|');
      for (const s of snaps) console.log(`| ${s.day} | ${f1(s.income)} | ${f1(s.srcIncome)} | ${f1(s.net)} | ${Math.round(s.poolP)} | ${s.threads} (${s.maxTier}) | ${s.sources} (${s.flowering}) | ${s.cards} | ${s.bands} | ${s.priceIndex.toFixed(2)} |`);
      console.log(`\nLast new card: day ${lastCardDay}`);
    }
  }
}
