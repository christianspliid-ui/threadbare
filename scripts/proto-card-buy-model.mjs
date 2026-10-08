#!/usr/bin/env node
// PROTOTYPE — THR-1770 (design lane, 2026-10-08). Lives on proto/thr-1770-card-buy only; never merged.
//
// Question: can a god BUY its cards with what the run earns, instead of receiving them on the
// Beat Director's schedule? For two sample gods, under six acquisition shapes, print:
//   - the economy at days 5/10/20/45/90 (earned, spent on casting, left for buying, cards bought)
//   - the first ten cards each god acquires, with the tick, side by side
//   - the overlap between the two gods' first five / first ten (the cookie-cutter test)
//   - casting starvation: casting essence spent vs the no-buy baseline
//
// Economy = the THR-1747 retune (thread upkeep 0/0.1/0.2/0.35/0.5, Wellspring milestone at bond+48,
// source upkeep 0.15) on the THR-1767 scripted player (scripts/power-progression-model.mjs).
// Constants copied from that script; cited there.
//
// Catalog: scratchpad dump of UNIFIED_ACTION_TEMPLATES filtered to actorAffinities ∋ 'ascendant'
// (143 cards: id, essenceCost, sphereAffinity, reach, requiresReach). Pass --catalog <path>.
//
// Usage: node scripts/proto-card-buy-model.mjs --catalog catalog.json [--shape <key>] [--seed N]

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const argv = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const CATALOG = JSON.parse(readFileSync(argv('--catalog') ?? 'catalog.json', 'utf8'));
const ONLY = argv('--shape');
const MC_RUNS = 400;

// ─── Run + economy (THR-1747 retune; constants from scripts/power-progression-model.mjs) ───
const RUN_TICKS = 1080, TPD = 12;
const SNAP_DAYS = [5, 10, 20, 45, 90];
const SEAT_TICK = 14, SIGNATURE_TICK = 40, WELLSPRING_TICK = 48;
const BASE = 1.0, PER_SEAT = 1.0, PER_THREAD = 0.1;
const SHARE = { primary: 0.35, secondary: 0.25, other: 0.04 };
const START_POOL = 50, BASE_CAP = 50, CAP_PER_THREAD = 5;
const MAINT = { 1: 0.1, 2: 0.2, 3: 0.35, 4: 0.5 };
const PROMO = { 2: 30, 3: 90, 4: 180 };
const SRC_BASE = 0.5, SRC_FLOWER_X = 2, SRC_DR = 0.8, SRC_UPKEEP = 0.15, SANCT = 0.15, SANCT_FLOWER = 0.6;
const PLAYER = { actEvery: 6, storyEvery: 24, story: { primary: 3, secondary: 2 }, threadSchedule: [0, 60, 150, 300, 500, 720],
  bindCost: 10, bindReserve: 10, sourceEvery: 36, fallback: 4, latent: 4, findCost: 3, claimCost: 5, sanctifyCost: 3 };

// ─── Buy-system tunables (all PROPOSED, named so a retune is a number) ───
const BUY_PRICE_PER_ESSENCE_COST = 10;   // price = this × card's essenceCost …
const BUY_PRICE_FLOOR = 20;              // … never below this …
const BUY_PRICE_ESCALATION = Number(argv('--escalation') ?? 0.1); // … and every card already bought raises the next price by this share
const PLAYER_KIND = argv('--player') ?? 'fit'; // 'fit' = values reach + sphere fit; 'optimiser' = engine cards and cheapness only
const POOL_PRICE_PER_ESSENCE_COST = 4;   // shape P1 (pool currency) must stay under the pool cap
const POOL_PRICE_CAP = 45;
const POOL_BUY_RESERVE = 10;             // P1 player keeps this much after a buy
const MARKET_EVERY = 9, MARKET_OFFER = 3;// shape H3: the cadence pool becomes a 3-card market every ~9 ticks

// ─── The two sample gods (THR-1769 audit § Timeline today) ───
const GODS = {
  shepherd: { name: 'Shepherd (hunger gather)', primary: 'life', secondary: 'spirit', reaches: ['heart', 'stone', 'star'],
    signatures: { primary: 'invest.heart.sworn_oath', secondary: 'invest.stone.great_work' } },
  showcase: { name: 'Showcase god (Vara, hunger witness)', primary: 'mind', secondary: 'spirit', reaches: ['eye', 'veil', 'shadow'],
    signatures: { primary: 'invest.eye.deep_eye', secondary: 'invest.veil.rend_the_gate' } },
};

// ─── What stays a story moment in every shape (and why — see the audit § The shop) ───
const SPINE = ['bind_thread_agent', 'observe_agent', 'bind_thread_location', 'action.imbue', 'divine.persuade'];
const SPINE_CHOICE = ['divine.dream', 'divine.omen', 'divine.inspire'];
const WELLSPRING = ['loc.find_source', 'loc.claim_source', 'loc.consecrate_source', 'loc.sanctify_source', 'loc.defend_source'];
const WORLD_MILESTONES = ['loc.open_markets', 'loc.bless_harvest', 'loc.blight', 'loc.reveal_vein', 'loc.guide_caravan', 'loc.sour_mine',
  'company.draw_together', 'company.bless', 'company.reunite', 'company.sunder', 'divine.rekindle_thread'];
const STORY_KEPT = new Set([...SPINE, ...SPINE_CHOICE, ...WELLSPRING, ...WORLD_MILESTONES]);

// Engine cards: what a reasonable player wants first because it grows the run (income, holdings, reach of the hand).
const ENGINE_RX = /^(bind_thread_|action\.consecrate|action\.bestow|action\.anoint|hex\.tap_source|hex\.claim_resource|hex\.claim_dominion|loc\.place_of_power|invest\.)/;

function cardSphereCurrency(card, god) {
  // A card with a sphere is bought in that sphere; a sphereless card in the god's primary.
  return card.sphere ?? god.primary;
}
function poolKey(sphere, god) { return sphere === god.primary ? 'primary' : sphere === god.secondary ? 'secondary' : 'other'; }

function value(card, god) {
  let v = 1;
  if (ENGINE_RX.test(card.id)) v += 3;
  if (PLAYER_KIND === 'optimiser') return v;
  const r = god.reaches.indexOf(card.reach);
  if (r >= 0) v += [2, 1.5, 1][r];
  if (card.sphere === god.primary) v += 1; else if (card.sphere === god.secondary) v += 0.5;
  return v;
}
function shopFor(god) {
  return CATALOG.filter(c => !STORY_KEPT.has(c.id) && c.id !== god.signatures.primary
    && (!c.reqReach || god.reaches.includes(c.reqReach)));
}
let BOUGHT = 0; // reset per run
const buyPrice = c => Math.round(Math.max(BUY_PRICE_FLOOR, BUY_PRICE_PER_ESSENCE_COST * (c.cost || 0)) * (1 + BUY_PRICE_ESCALATION * BOUGHT));
const poolPrice = c => Math.min(POOL_PRICE_CAP, Math.max(8, POOL_PRICE_PER_ESSENCE_COST * (c.cost || 0)));

// ─── Deterministic PRNG for the lottery-shaped shapes (S0 today, H2, H3) ───
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ─── Today's pool (THR-1769 § 1b, after THR-1747 E2/E3): grant-carrying investment beats retire once granted ───
const INVEST_BEATS = [
  ['the_hallowed_place', ['action.consecrate', 'action.consecrate-relic']],
  ['the_favored_soul', ['action.bestow', 'action.teach_spell']],
  ['the_chosen_banner', ['action.anoint']],
  ['the_unveiled_eye', ['action.secrets.reveal_secret', 'action.secrets.plant_secret']],
];
// The six spine re-grant beats retire immediately under E3 (their grants are held). Delivery mass 16.8, intro 6×3, selection 2×1.

// ─── The economy loop, shared by every shape; `shape` decides how cards arrive ───
function run(god, shape, seed = 1) {
  const rnd = mulberry32(seed);
  const pool = { primary: START_POOL, secondary: START_POOL, other: START_POOL };
  const wallet = {};            // C2: spendable essence-earned per sphere (earned − spent on buys)
  const earned = {};            // lifetime earned per sphere (THR-1180 counter: banks only what lands)
  const held = new Set([...SPINE, 'divine.inspire']);
  const acquired = [];          // { t, id, how }
  const shop = shopFor(god);
  const categoryOpen = new Set();
  let castSpent = 0, buySpentPool = 0, seat = false, wellspring = false, sigDone = false;
  const threads = [], sources = []; let latent = PLAYER.latent, pendingClaim = 0, nextThread = 0, lastAct = -99, lastSrc = -99;
  let nextDraw = SIGNATURE_TICK + 9; const beats = INVEST_BEATS.map(([id, grants]) => ({ id, grants, live: true }));
  let sigBeatLive = true, intros = 6;
  const snaps = [];
  const spheres = ['life', 'spirit', 'mind', 'force', 'time', 'darkness', 'chaos', 'matter', 'order', 'entropy', 'light', 'void'];
  for (const s of spheres) { wallet[s] = 0; earned[s] = 0; }
  const otherPool = {}; for (const s of spheres) if (s !== god.primary && s !== god.secondary) otherPool[s] = START_POOL;

  BOUGHT = 0;
  const acquire = (t, id, how) => { if (!held.has(id)) { held.add(id); acquired.push({ t, id, how }); if (how === 'buy') BOUGHT++; } };
  const poolOf = s => (s === god.primary ? pool.primary : s === god.secondary ? pool.secondary : otherPool[s]);
  const debit = (s, n) => { if (s === god.primary) pool.primary -= n; else if (s === god.secondary) pool.secondary -= n; else otherPool[s] -= n; };

  for (let t = 0; t <= RUN_TICKS; t++) {
    if (t === SEAT_TICK) seat = true;
    if (t === SIGNATURE_TICK) acquire(t, god.signatures.primary, 'story');
    if (t === WELLSPRING_TICK) { wellspring = true; for (const id of WELLSPRING) acquire(t, id, 'story'); }

    // income
    const total = BASE + (seat ? PER_SEAT : 0) + threads.length * PER_THREAD;
    const cap = BASE_CAP + threads.length * CAP_PER_THREAD;
    const sv = s => SRC_BASE * (s.flowering ? SRC_FLOWER_X : 1);
    const srcIncome = [...sources].sort((a, b) => sv(b) - sv(a)).reduce((sum, s, i) => sum + sv(s) * SRC_DR ** i, 0);
    for (const s of spheres) {
      const gen = s === god.primary ? total * SHARE.primary + srcIncome : s === god.secondary ? total * SHARE.secondary : total * SHARE.other;
      const cur = poolOf(s);
      const landed = Math.min(gen, Math.max(0, cap - cur));
      debit(s, -landed); earned[s] += landed; wallet[s] += landed;
    }
    // upkeep (primary)
    const upkeep = threads.reduce((u, th) => u + MAINT[th.tier], 0) + sources.length * SRC_UPKEEP;
    if (pool.primary >= upkeep) { pool.primary -= upkeep; castSpent += upkeep; for (const th of threads) th.at++; }
    for (const th of threads) if (th.tier < 4 && th.at >= PROMO[th.tier + 1]) { th.tier++; th.at = 0; }

    // ── how cards arrive ──
    shape.tick({ t, god, rnd, held, shop, wallet, pool, poolOf, debit, acquire, categoryOpen,
      addBuyPool: n => { buySpentPool += n; },
      draw: () => {             // today's Director, post-spine, THR-1747 rules
        if (t < nextDraw) return null;
        nextDraw = t + Math.max(4, 9 + Math.round((rnd() * 4) - 2));
        const items = [];
        const affOf = r => { const i = god.reaches.indexOf(r); return i < 0 ? 0 : [4, 3, 2][i] / 5; };
        for (const b of beats) if (b.live) {
          const eye = b.id === 'the_unveiled_eye' ? (1 + 2 * affOf('eye')) * (god.primary === 'mind' ? 1.5 : 1) : 1;
          items.push({ w: 4 * eye, kind: 'invest', b });
        }
        if (sigBeatLive) items.push({ w: 4, kind: 'signature' });
        for (let i = 0; i < intros; i++) items.push({ w: 3, kind: 'intro' });
        items.push({ w: 2, kind: 'select' }, { w: 16.8, kind: 'delivery' });
        const W = items.reduce((s, x) => s + x.w, 0); let r = rnd() * W;
        for (const x of items) { r -= x.w; if (r <= 0) {
          if (x.kind === 'invest') x.b.live = false;
          if (x.kind === 'signature') sigBeatLive = false;
          if (x.kind === 'intro') intros = Math.max(0, intros - 1);
          return x;
        } }
        return null;
      } });

    // ── the player casts (identical to the THR-1767 scripted player, cast spend counted) ──
    if (t % PLAYER.storyEvery === 0 && t > 0) {
      const p = Math.min(pool.primary, PLAYER.story.primary), s = Math.min(pool.secondary, PLAYER.story.secondary);
      pool.primary -= p; pool.secondary -= s; castSpent += p + s;
    }
    if (t - lastAct >= PLAYER.actEvery) {
      if (nextThread < PLAYER.threadSchedule.length && t >= PLAYER.threadSchedule[nextThread] && pool.primary >= PLAYER.bindCost + PLAYER.bindReserve) {
        pool.primary -= PLAYER.bindCost; castSpent += PLAYER.bindCost; threads.push({ tier: 1, at: 0 }); nextThread++; lastAct = t;
      } else if (wellspring && t - lastSrc >= PLAYER.sourceEvery) {
        const dormant = sources.find(s => !s.flowering);
        if (dormant && pool.primary >= PLAYER.sanctifyCost) {
          pool.primary -= PLAYER.sanctifyCost; castSpent += PLAYER.sanctifyCost; dormant.sanct += SANCT; lastSrc = lastAct = t;
          if (dormant.sanct >= SANCT_FLOWER) dormant.flowering = true;
        } else if (pendingClaim > 0 && otherPool.order >= PLAYER.claimCost) {
          otherPool.order -= PLAYER.claimCost; castSpent += PLAYER.claimCost; pendingClaim--; sources.push({ sanct: 0, flowering: false }); lastSrc = lastAct = t;
        } else if (latent > 0 && otherPool.order >= PLAYER.findCost) {
          otherPool.order -= PLAYER.findCost; castSpent += PLAYER.findCost; latent--; pendingClaim++; lastSrc = lastAct = t;
        }
      } else if (pool.primary >= PLAYER.fallback) { pool.primary -= PLAYER.fallback; castSpent += PLAYER.fallback; lastAct = t; }
    }

    if (SNAP_DAYS.includes(t / TPD)) snaps.push({ day: t / TPD,
      earnedP: earned[god.primary], earnedS: earned[god.secondary], cast: castSpent,
      walletP: wallet[god.primary], walletS: wallet[god.secondary], buyPool: buySpentPool,
      cards: held.size, bought: acquired.filter(a => a.how === 'buy').length });
  }
  return { acquired, snaps, held };
}

// ─── Buy helpers ───
function bestAffordable(ctx, { currency = 'wallet', filter = () => true, from = null } = {}) {
  // Per currency, a reasonable player saves for the best value-for-price card it can see, and buys it the
  // moment that currency can pay. Every sphere's wallet runs its own queue.
  const cands = (from ?? ctx.shop).filter(c => !ctx.held.has(c.id) && filter(c));
  const bySphere = {};
  for (const c of cands) { const s = cardSphereCurrency(c, ctx.god); (bySphere[s] ??= []).push(c); }
  const buys = [];
  for (const [s, list] of Object.entries(bySphere)) {
    const price = currency === 'wallet' ? buyPrice : poolPrice;
    list.sort((a, b) => value(b, ctx.god) / price(b) - value(a, ctx.god) / price(a) || a.id.localeCompare(b.id));
    const top = list[0];
    if (currency === 'wallet' && ctx.wallet[s] >= buyPrice(top)) buys.push({ c: top, s, p: buyPrice(top) });
    if (currency === 'pool' && ctx.poolOf(s) >= poolPrice(top) + POOL_BUY_RESERVE) buys.push({ c: top, s, p: poolPrice(top) });
  }
  return buys;
}

// Categories a story beat opens in shape H1 (prefix families of the catalog).
const CATEGORY_OF = id => {
  if (/^bind_thread_|^thread\./.test(id)) return 'threads';
  if (/^hex\./.test(id)) return 'land';
  if (/^loc\.|^sub\./.test(id)) return 'places';
  if (/^artifact\.|^action\.imbue|^action\.consecrate-relic/.test(id)) return 'relics';
  if (/^action\.faction\.|^action\.anoint|^action\.divine-edict/.test(id)) return 'followers';
  if (/^action\.secrets\.|^divine\.perceive|^scry_|^whisper_|^divine\.relay|^observe_|^dream_sending/.test(id)) return 'sight';
  return 'favour';          // divine.* persuasion / blessing / self verbs, action.social.*, action.bestow …
};
const BEAT_OPENS = { the_hallowed_place: 'places', the_favored_soul: 'favour', the_chosen_banner: 'followers', the_unveiled_eye: 'sight',
  signature: 'land', intro: 'threads', select: 'relics' };

// ─── The six shapes ───
const SHAPES = {
  S0: { name: 'S0 — Today: story grants only (THR-1747 rules)', tick(ctx) {
    const d = ctx.draw(); if (!d) return;
    if (d.kind === 'invest') for (const id of d.b.grants) ctx.acquire(ctx.t, id, 'story');
    if (d.kind === 'signature') ctx.acquire(ctx.t, ctx.god.signatures.secondary, 'story');
  } },
  S1: { name: 'S1 — Story grants kept, but each gift beat draws its cards by the god identity (no buy)', tick(ctx) {
    const d = ctx.draw(); if (!d || (d.kind !== 'invest' && d.kind !== 'signature')) return;
    const n = d.kind === 'invest' ? d.b.grants.length : 1;
    if (d.kind === 'signature') { ctx.acquire(ctx.t, ctx.god.signatures.secondary, 'story'); return; }
    const affOf = r => { const i = ctx.god.reaches.indexOf(r); return i < 0 ? 0 : [4, 3, 2][i] / 5; };
    const weight = c => (1 + 2 * affOf(c.reach)) * (c.sphere === ctx.god.primary ? 1.5 : c.sphere === ctx.god.secondary ? 1.25 : 1);
    const open = ctx.shop.filter(c => !ctx.held.has(c.id) && c.id !== ctx.god.signatures.secondary);
    for (let k = 0; k < n && open.length; k++) {
      const W = open.reduce((q, c) => q + weight(c), 0); let r = ctx.rnd() * W;
      const i = open.findIndex(c => (r -= weight(c)) <= 0); ctx.acquire(ctx.t, open.splice(i < 0 ? 0 : i, 1)[0].id, 'story');
    }
  } },
  P1: { name: 'P1 — Pure buy, priced in the casting pool (4 × cost, capped 45)', tick(ctx) {
    for (const b of bestAffordable(ctx, { currency: 'pool' })) { ctx.debit(b.s, b.p); ctx.addBuyPool(b.p); ctx.acquire(ctx.t, b.c.id, 'buy'); }
  } },
  P2: { name: 'P2 — Pure buy, priced in essence earned (10 × cost, floor 20)', tick(ctx) {
    for (const b of bestAffordable(ctx)) { ctx.wallet[b.s] -= b.p; ctx.acquire(ctx.t, b.c.id, 'buy'); }
  } },
  H1: { name: 'H1 — Story beat opens a family, essence earned buys the card', tick(ctx) {
    const d = ctx.draw();
    if (d) { const fam = d.kind === 'invest' ? BEAT_OPENS[d.b.id] : BEAT_OPENS[d.kind]; if (fam) ctx.categoryOpen.add(fam); }
    for (const b of bestAffordable(ctx, { filter: c => ctx.categoryOpen.has(CATEGORY_OF(c.id)) })) { ctx.wallet[b.s] -= b.p; ctx.acquire(ctx.t, b.c.id, 'buy'); }
  } },
  H2: { name: 'H2 — Each gift beat offers two; the one passed over is bought later with essence earned', tick(ctx) {
    const d = ctx.draw();
    if (d && (d.kind === 'invest' || d.kind === 'signature')) {
      const gift = d.kind === 'invest' ? d.b.grants : [ctx.god.signatures.secondary];
      // the alternate: the best-value card for this god that no beat grants (the orphan shop)
      const alt = ctx.shop.filter(c => !ctx.held.has(c.id) && !INVEST_BEATS.some(([, g]) => g.includes(c.id)) && c.id !== ctx.god.signatures.secondary)
        .sort((a, b) => value(b, ctx.god) - value(a, ctx.god) || a.id.localeCompare(b.id))[0];
      const giftV = gift.reduce((s, id) => s + value(ctx.shop.find(c => c.id === id) ?? { id, reach: null, sphere: null }, ctx.god), 0) / gift.length;
      if (alt && value(alt, ctx.god) > giftV) { ctx.acquire(ctx.t, alt.id, 'chosen'); ctx.offered ??= []; }
      else for (const id of gift) ctx.acquire(ctx.t, id, 'chosen');
    }
    for (const b of bestAffordable(ctx)) { ctx.wallet[b.s] -= b.p; ctx.acquire(ctx.t, b.c.id, 'buy'); }
  } },
  H3: { name: 'H3 — The cadence pool becomes a market: 3 cards every ~9 ticks, bought with essence earned', tick(ctx) {
    if (ctx.t < SIGNATURE_TICK + MARKET_EVERY || (ctx.t - SIGNATURE_TICK) % MARKET_EVERY) return;
    const affOf = r => { const i = ctx.god.reaches.indexOf(r); return i < 0 ? 0 : [4, 3, 2][i] / 5; };
    const weight = c => (1 + 2 * affOf(c.reach)) * (c.sphere === ctx.god.primary ? 1.5 : c.sphere === ctx.god.secondary ? 1.25 : 1);
    const open = ctx.shop.filter(c => !ctx.held.has(c.id));
    const offer = [];
    for (let k = 0; k < MARKET_OFFER && open.length; k++) {
      const W = open.reduce((s, c) => s + weight(c), 0); let r = ctx.rnd() * W;
      const i = open.findIndex(c => (r -= weight(c)) <= 0); offer.push(open.splice(i < 0 ? 0 : i, 1)[0]);
    }
    for (const b of bestAffordable(ctx, { from: offer })) { ctx.wallet[b.s] -= b.p; ctx.acquire(ctx.t, b.c.id, 'buy'); }
  } },
};

// ─── Report ───
const pad = (s, n) => String(s).padEnd(n);
function table(rows) {
  const cols = Object.keys(rows[0]); const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
  console.log('| ' + cols.map((c, i) => pad(c, w[i])).join(' | ') + ' |');
  console.log('|' + w.map(n => '-'.repeat(n + 2)).join('|') + '|');
  for (const r of rows) console.log('| ' + cols.map((c, i) => pad(r[c], w[i])).join(' | ') + ' |');
}
const firstN = (acq, n) => acq.filter(a => a.how !== 'story' || !STORY_KEPT.has(a.id)).filter(a => a.id !== GODS.shepherd.signatures.primary && a.id !== GODS.showcase.signatures.primary).slice(0, n);
const jacc = (a, b) => { const A = new Set(a), B = new Set(b); const i = [...A].filter(x => B.has(x)).length; return `${i}/${new Set([...A, ...B]).size}`; };

const baseline = {};
for (const [gk, god] of Object.entries(GODS)) baseline[gk] = run(god, SHAPES.S0, 1);

for (const [sk, shape] of Object.entries(SHAPES)) {
  if (ONLY && sk !== ONLY) continue;
  console.log(`\n=== ${shape.name} ===`);
  const res = {};
  for (const [gk, god] of Object.entries(GODS)) res[gk] = run(god, shape, 1);
  for (const [gk, god] of Object.entries(GODS)) {
    console.log(`\n${god.name} — economy (seed 1)`);
    table(res[gk].snaps.map((s, i) => ({ Day: s.day, [`Earned ${god.primary}`]: s.earnedP.toFixed(0), [`Earned ${god.secondary}`]: s.earnedS.toFixed(0),
      'Cast spend (cum.)': s.cast.toFixed(0), 'vs no-buy': (s.cast - baseline[gk].snaps[i].cast).toFixed(0),
      [`Wallet ${god.primary}/${god.secondary}`]: `${s.walletP.toFixed(0)}/${s.walletS.toFixed(0)}`, 'Pool spent on buys': s.buyPool.toFixed(0),
      'Cards held': s.cards, Bought: s.bought })));
  }
  const a = firstN(res.shepherd.acquired, 10), b = firstN(res.showcase.acquired, 10);
  console.log('\nFirst ten acquired after the spine (tick · card · how), side by side');
  table(Array.from({ length: 10 }, (_, i) => ({ '#': i + 1,
    Shepherd: a[i] ? `${a[i].t} · ${a[i].id} · ${a[i].how}` : '—', Showcase: b[i] ? `${b[i].t} · ${b[i].id} · ${b[i].how}` : '—' })));
  console.log(`Overlap first five: ${jacc(a.slice(0, 5).map(x => x.id), b.slice(0, 5).map(x => x.id))} · first ten: ${jacc(a.map(x => x.id), b.map(x => x.id))}`);
  // Monte Carlo over seeds for the lottery-shaped shapes: mean cards by day 20 / 90, mean overlap
  if (['S0', 'S1', 'H1', 'H2', 'H3'].includes(sk)) {
    let c20 = 0, c90 = 0, ov5 = 0, t5 = 0;
    for (let s = 1; s <= MC_RUNS; s++) {
      const x = run(GODS.shepherd, shape, s), y = run(GODS.showcase, shape, s);
      c20 += x.snaps[2].cards; c90 += x.snaps[4].cards;
      const xa = firstN(x.acquired, 5).map(q => q.id), ya = firstN(y.acquired, 5).map(q => q.id);
      ov5 += xa.filter(id => ya.includes(id)).length; t5 += (firstN(x.acquired, 5)[4]?.t ?? RUN_TICKS);
    }
    console.log(`Over ${MC_RUNS} seeds (Shepherd): cards held day 20 ${(c20 / MC_RUNS).toFixed(1)}, day 90 ${(c90 / MC_RUNS).toFixed(1)}; fifth post-spine card at tick ${(t5 / MC_RUNS).toFixed(0)}; shared cards in the two gods' first five ${(ov5 / MC_RUNS).toFixed(2)}`);
  }
}

BOUGHT = 0;
// The shop itself, for the audit: count + base price spread per god
for (const [gk, god] of Object.entries(GODS)) {
  const shop = shopFor(god); const prices = shop.map(buyPrice);
  const bySphere = {}; for (const c of shop) { const s = cardSphereCurrency(c, god); bySphere[s] = (bySphere[s] || 0) + 1; }
  console.log(`\nShop for ${god.name}: ${shop.length} cards; price ${Math.min(...prices)}–${Math.max(...prices)}, mean ${(prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(0)}; by currency ${JSON.stringify(bySphere)}`);
}
