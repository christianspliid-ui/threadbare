#!/usr/bin/env node
// God-card progression iteration model (THR-1811; ported from the THR-1794 prototype,
// proto/thr-1794-card-tiers:scripts/proto-card-tiers-1794.mjs).
//
// Question it answers: with the tier ladder and the generic verdict carried as data on each
// god card (`UnifiedActionTemplate.progression`), does the world's offering (THR-1770 option B)
// keep each god distinct, and how does the hand fill by tier over a 90-day run?
//
// One source: the table is read from the templates (scripts/dump-god-card-catalog.ts), never
// a side TSV. A model, not the game: 'fit' and 'optimiser' are scripted players, and
// FIT_PLAYER_SKIPS_BELOW is a model flag, not a rule.
//
// Usage:
//   npm run model:god-cards                                  # the report
//   npm run model:god-cards -- --set hex.smite=tier:3        # one-field overlays, repeatable
//   npm run model:god-cards -- --generic-sold                # generic rung cards sold in the market
//   npm run model:god-cards -- --player optimiser|fit        # default: both
//   npm run model:god-cards -- --export                      # print the merged table (TSV) and exit
//   npm run model:god-cards -- --check                       # the content gate in miniature
//   npm run model:god-cards -- --sphere-gate                 # offer only in-sphere + sphereless cards (OFFERING_IN_SPHERE_ONLY)

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const argv = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const argAll = k => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));
const CATALOG = JSON.parse(readFileSync(argv('--catalog') ?? '.cache/god-card-catalog.json', 'utf8'));
const TIERS_PATH = 'templates (UnifiedActionTemplate.progression)';
const GENERIC_SOLD = args.includes('--generic-sold');
const SPHERE_GATE = args.includes('--sphere-gate');
const MC_RUNS = Number(argv('--runs') ?? 400);

// ─── The progression table, read off the templates ───
const TIERS = {};
for (const c of CATALOG) {
  const p = c.progression;
  if (!p) continue;
  TIERS[c.id] = {
    id: c.id, tier: String(p.tier), offer: p.offer, generic: p.generic ? 'y' : 'n',
    pricedIn: p.pricedIn ?? '', gift: p.giftBy ?? '', flag: (p.flags ?? []).join(','), why: '',
  };
}
for (const s of argAll('--set')) { const [id, kv] = s.split('='); const [f, val] = kv.split(':'); if (!TIERS[id]) throw new Error(`--set: no row ${id}`); TIERS[id][f] = val; }

const CARDS = CATALOG.map(c => {
  const p = TIERS[c.id];
  return { ...c, tier: p ? Number(p.tier) : null, offer: p?.offer ?? null, generic: p?.generic === 'y',
    pricedIn: p?.pricedIn || c.sphere || null, gift: p?.gift || null, flag: p?.flag || '', why: p?.why || '' };
});
if (GENERIC_SOLD) for (const c of CARDS) if (c.generic && c.gift === 'rung') { c.offer = 'market'; c.gift = null; }

const SPHERES = ['chaos', 'order', 'light', 'darkness', 'force', 'mind', 'matter', 'time', 'energy', 'spirit', 'life', 'entropy'];

// ─── The gate in miniature (what the build's content check owes) ───
function check() {
  const errs = [];
  for (const c of CARDS) {
    if (c.tier == null) { errs.push(`${c.id}: no progression row`); continue; }
    if (![1, 2, 3, 4].includes(c.tier)) errs.push(`${c.id}: tier ${c.tier} not in 1..4`);
    if (!['market', 'gift'].includes(c.offer)) errs.push(`${c.id}: offer '${c.offer}' not market|gift`);
    if (c.offer === 'market' && !c.generic && !SPHERES.includes(c.pricedIn)) errs.push(`${c.id}: market card with no price sphere`);
    if (c.offer === 'gift' && !['spine', 'milestone', 'rung', 'signature'].includes(c.gift)) errs.push(`${c.id}: gift with no giver`);
    if (c.sphere && c.pricedIn !== c.sphere) errs.push(`${c.id}: pricedIn ${c.pricedIn} disagrees with sphereAffinity ${c.sphere}`);
  }
  for (const id of Object.keys(TIERS)) if (!CATALOG.some(c => c.id === id)) errs.push(`${id}: row for a card that is not in the catalog`);
  for (const t of [1, 2, 3, 4]) if (!CARDS.some(c => c.tier === t && c.offer === 'market')) errs.push(`tier ${t}: no market card`);
  return errs;
}
// Warnings, not failures: sphere × tier holes in the market (a content-authoring signal, not a data error).
function holes() {
  const out = [];
  for (const s of SPHERES) { const miss = [1, 2, 3, 4].filter(t => !CARDS.some(c => c.offer === 'market' && !c.generic && c.pricedIn === s && c.tier === t)); if (miss.length) out.push(`${s}: no T${miss.join('/T')}`); }
  return out;
}
if (args.includes('--check')) { const h = holes(); if (h.length) console.log('warn — market holes by sphere: ' + h.join(' · ')); }
if (args.includes('--check')) { const e = check(); console.log(e.length ? e.join('\n') : `ok — ${CARDS.length} cards`); process.exit(e.length ? 1 : 0); }
if (args.includes('--export')) {
  console.log(['id', 'name', 'cost', 'sphere', 'reach', 'tier', 'offer', 'generic', 'pricedIn', 'gift', 'flag', 'why'].join('\t'));
  for (const c of CARDS) console.log([c.id, c.name, c.cost, c.sphere ?? '', c.reach, c.tier, c.offer, c.generic ? 'y' : 'n', c.pricedIn ?? '', c.gift ?? '', c.flag, c.why].join('\t'));
  process.exit(0);
}
{ const e = check(); if (e.length) { console.error('table fails the gate:\n' + e.join('\n')); process.exit(1); } }

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

// ─── Progression tunables (all PROPOSED; a retune is a number) ───
// The rung ladder reads the god's growth: attunement marks crossed on the bought spheres, on the
// THR-1765 run-long ladder. Rung n opens when the god has crossed PROGRESSION_RUNG_MARKS[n-1] marks.
const DOMINION_ATTUNEMENT_MARKS = [20, 60, 150, 300, 600, 1000, 1500, 2100, 2800]; // THR-1765
const PROGRESSION_RUNG_MARKS = (argv('--rungs') ?? '0,3,6,8').split(',').map(Number);
const PRICE_BY_TIER = Object.fromEntries((argv('--prices') ?? '20,40,80,120').split(',').map((n, i) => [i + 1, Number(n)]));   // essence earned through the card's sphere
// A card is paid from essence earned through its own sphere, or from the god's primary at this markup.
// Without it, the catalog's sphere imbalance (spirit 20 market cards, life 6, light 0) decides how many
// cards a god can ever buy. --off-sphere-mult 0 turns the fallback off (strict own-sphere pricing).
const OFF_SPHERE_PRICE_MULT = Number(argv('--off-sphere-mult') ?? 2);
const BUY_PRICE_ESCALATION = Number(argv('--escalation') ?? 0.1); // every card bought raises the next price by this share (THR-1770) …
const ESCALATION_SCOPE = argv('--escalation-scope') ?? 'tier';   // … counting only buys of the same tier ('tier'), or every buy ('all', THR-1770)
const MARKET_EVERY = 9, MARKET_OFFER = 3;               // THR-1770 H3: three omens every ~9 ticks
const FIT_PLAYER_SKIPS_BELOW = 1;                      // player model, not a game rule: the fit player passes on cards more than this many tiers below the top open rung
const FRESH_RUNG_WEIGHT = 1.5;                         // the newest open rung's cards rise a little more often
const RUNG_GIFT_SPACING = 36;                           // a rung's generic gifts arrive one per 3 days, not in a flood
const SECONDARY_SIGNATURE_RUNG = 2;                     // the secondary reach signature is the first gift of this rung
const HELD_GROUND_FLOWERING = 2;                        // THR-1747 E5 milestone

// ─── The two sample gods (THR-1769 audit § Timeline today) ───
const GODS = {
  shepherd: { name: 'Shepherd', primary: 'life', secondary: 'spirit', reaches: ['heart', 'stone', 'star'],
    signatures: { primary: 'invest.heart.sworn_oath', secondary: 'invest.stone.great_work' } },
  showcase: { name: 'Showcase (Vara)', primary: 'mind', secondary: 'spirit', reaches: ['eye', 'veil', 'shadow'],
    signatures: { primary: 'invest.eye.deep_eye', secondary: 'invest.veil.rend_the_gate' } },
};

const ENGINE_RX = /^(bind_thread_|action\.consecrate|action\.bestow|action\.anoint|hex\.tap_source|hex\.claim_resource|hex\.claim_dominion|hex\.shift_dominion|loc\.place_of_power|invest\.)/;
const affOf = (god, r) => { const i = god.reaches.indexOf(r); return i < 0 ? 0 : [4, 3, 2][i] / 5; };
const identityWeight = (c, god) => (1 + 2 * affOf(god, c.reach)) * (c.pricedIn === god.primary ? 1.5 : c.pricedIn === god.secondary ? 1.25 : 1);
const priceSphere = (c, god) => (c.generic ? god.primary : c.pricedIn);
function value(c, god, kind) {
  let v = 1;
  if (ENGINE_RX.test(c.id)) v += 3;
  if (kind === 'optimiser') return v;   // engine use and cheapness only: the honest worst case for identity
  v += c.tier;                          // a player who plays for the story wants the grander card
  const r = god.reaches.indexOf(c.reach); if (r >= 0) v += [2, 1.5, 1][r];
  if (c.pricedIn === god.primary) v += 1; else if (c.pricedIn === god.secondary) v += 0.5;
  return v;
}
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function run(god, kind, seed = 1) {
  const rnd = mulberry32(seed);
  const pool = {}; const wallet = {}; const earned = {};
  for (const s of SPHERES) { pool[s] = START_POOL; wallet[s] = 0; earned[s] = 0; }
  const P = god.primary, S = god.secondary;
  const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
  const held = new Set(CARDS.filter(c => c.gift === 'spine').map(c => c.id).filter(id => !['divine.dream', 'divine.omen'].includes(id)));
  const acquired = []; let bought = 0, offSphereBuys = 0; const boughtByTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const acquire = (t, id, how) => { if (held.has(id)) return; held.add(id); acquired.push({ t, id, how, tier: byId[id]?.tier }); if (how === 'buy') { bought++; boughtByTier[byId[id].tier]++; } };
  let castSpent = 0, seat = false, wellspring = false, heldGround = false;
  const threads = [], sources = []; let latent = PLAYER.latent, pendingClaim = 0, nextThread = 0, lastAct = -99, lastSrc = -99;
  let rung = 0; const rungOpen = {}; const giftQueue = []; let nextGift = 0;
  const snaps = [];
  const marks = () => [P, S].reduce((m, s) => m + DOMINION_ATTUNEMENT_MARKS.filter(x => earned[s] >= x).length, 0);
  const marketCards = () => CARDS.filter(c => c.offer === 'market' && c.tier <= rung && !held.has(c.id)
    && (!c.reqReach || god.reaches.includes(c.reqReach)) && c.id !== god.signatures.primary
    // OFFERING_IN_SPHERE_ONLY (THR-1811): only sphereless cards and cards in the god's two spheres.
    && (!SPHERE_GATE || !c.sphere || c.sphere === P || c.sphere === S));

  for (let t = 0; t <= RUN_TICKS; t++) {
    if (t === SEAT_TICK) seat = true;
    if (t === SIGNATURE_TICK) acquire(t, god.signatures.primary, 'story');
    if (t === WELLSPRING_TICK) { wellspring = true; for (const c of CARDS) if (c.gift === 'milestone' && /_source$/.test(c.id)) acquire(t, c.id, 'story'); }

    // income: what lands in a pool below its cap is earned (THR-1180 counter) and fills the buy wallet
    const total = BASE + (seat ? PER_SEAT : 0) + threads.length * PER_THREAD;
    const cap = BASE_CAP + threads.length * CAP_PER_THREAD;
    const sv = s => SRC_BASE * (s.flowering ? SRC_FLOWER_X : 1);
    const srcIncome = [...sources].sort((a, b) => sv(b) - sv(a)).reduce((sum, s, i) => sum + sv(s) * SRC_DR ** i, 0);
    for (const s of SPHERES) {
      const gen = s === P ? total * SHARE.primary + srcIncome : s === S ? total * SHARE.secondary : total * SHARE.other;
      const landed = Math.min(gen, Math.max(0, cap - pool[s]));
      pool[s] += landed; earned[s] += landed; wallet[s] += landed;
    }
    const upkeep = threads.reduce((u, th) => u + MAINT[th.tier], 0) + sources.length * SRC_UPKEEP;
    if (pool[P] >= upkeep) { pool[P] -= upkeep; castSpent += upkeep; for (const th of threads) th.at++; }
    for (const th of threads) if (th.tier < 4 && th.at >= PROMO[th.tier + 1]) { th.tier++; th.at = 0; }

    // ── rungs open on the god's growth; each opening queues that rung's generic gifts ──
    if (t >= SIGNATURE_TICK) while (rung < 4 && marks() >= PROGRESSION_RUNG_MARKS[rung]) {
      rung++; rungOpen[rung] = t;
      for (const c of CARDS) if (c.gift === 'rung' && c.tier === rung) giftQueue.push(c.id);
      if (rung === SECONDARY_SIGNATURE_RUNG) giftQueue.unshift(god.signatures.secondary); // the world calls on the deeper domain
    }
    if (giftQueue.length && t >= nextGift && t >= SIGNATURE_TICK) { acquire(t, giftQueue.shift(), 'gift'); nextGift = t + RUNG_GIFT_SPACING; }
    if (!heldGround && sources.filter(s => s.flowering).length >= HELD_GROUND_FLOWERING) {
      heldGround = true; for (const id of ['hex.tap_source', 'hex.claim_resource', 'hex.claim_dominion', 'loc.place_of_power']) acquire(t, id, 'story');
    }

    // ── the market: three omens, take up at most one ──
    if (t >= SIGNATURE_TICK + MARKET_EVERY && (t - SIGNATURE_TICK) % MARKET_EVERY === 0) {
      const open = marketCards();
      const w = c => identityWeight(c, god) * (c.tier === rung ? FRESH_RUNG_WEIGHT : 1);
      const offer = [];
      for (let k = 0; k < MARKET_OFFER && open.length; k++) {
        const W = open.reduce((q, c) => q + w(c), 0); let r = rnd() * W;
        const i = open.findIndex(c => (r -= w(c)) <= 0); offer.push(open.splice(i < 0 ? 0 : i, 1)[0]);
      }
      const base = c => Math.round(PRICE_BY_TIER[c.tier] * (1 + BUY_PRICE_ESCALATION * (ESCALATION_SCOPE === 'tier' ? boughtByTier[c.tier] : bought)));
      // cheapest way this god can pay for the card right now, or null
      const pay = c => {
        const s = priceSphere(c, god);
        if (wallet[s] >= base(c)) return { s, p: base(c) };
        const off = Math.round(base(c) * OFF_SPHERE_PRICE_MULT);
        if (OFF_SPHERE_PRICE_MULT > 0 && s !== P && wallet[P] >= off) return { s: P, p: off };
        return null;
      };
      // the story player lets trivia pass once grander rungs are open, and saves for them
      const wanted = c => kind === 'optimiser' || c.tier >= rung - FIT_PLAYER_SKIPS_BELOW;
      const afford = offer.filter(wanted).map(c => ({ c, q: pay(c) })).filter(x => x.q)
        .sort((a, b) => value(b.c, god, kind) / b.q.p - value(a.c, god, kind) / a.q.p || a.c.id.localeCompare(b.c.id));
      if (afford.length) { const { c, q } = afford[0]; wallet[q.s] -= q.p; acquire(t, c.id, 'buy'); offSphereBuys += q.s === priceSphere(c, god) ? 0 : 1; }
    }

    // ── the scripted player casts (THR-1767, unchanged) ──
    if (t % PLAYER.storyEvery === 0 && t > 0) {
      const p = Math.min(pool[P], PLAYER.story.primary), s = Math.min(pool[S], PLAYER.story.secondary);
      pool[P] -= p; pool[S] -= s; castSpent += p + s;
    }
    if (t - lastAct >= PLAYER.actEvery) {
      if (nextThread < PLAYER.threadSchedule.length && t >= PLAYER.threadSchedule[nextThread] && pool[P] >= PLAYER.bindCost + PLAYER.bindReserve) {
        pool[P] -= PLAYER.bindCost; castSpent += PLAYER.bindCost; threads.push({ tier: 1, at: 0 }); nextThread++; lastAct = t;
      } else if (wellspring && t - lastSrc >= PLAYER.sourceEvery) {
        const dormant = sources.find(s => !s.flowering);
        if (dormant && pool[P] >= PLAYER.sanctifyCost) {
          pool[P] -= PLAYER.sanctifyCost; castSpent += PLAYER.sanctifyCost; dormant.sanct += SANCT; lastSrc = lastAct = t;
          if (dormant.sanct >= SANCT_FLOWER) dormant.flowering = true;
        } else if (pendingClaim > 0 && pool.order >= PLAYER.claimCost) {
          pool.order -= PLAYER.claimCost; castSpent += PLAYER.claimCost; pendingClaim--; sources.push({ sanct: 0, flowering: false }); lastSrc = lastAct = t;
        } else if (latent > 0 && pool.order >= PLAYER.findCost) {
          pool.order -= PLAYER.findCost; castSpent += PLAYER.findCost; latent--; pendingClaim++; lastSrc = lastAct = t;
        }
      } else if (pool[P] >= PLAYER.fallback) { pool[P] -= PLAYER.fallback; castSpent += PLAYER.fallback; lastAct = t; }
    }

    if (SNAP_DAYS.includes(t / TPD)) {
      const tiers = [1, 2, 3, 4].map(n => [...held].filter(id => byId[id]?.tier === n).length);
      const boughtTiers = [1, 2, 3, 4].map(n => acquired.filter(a => a.how === 'buy' && a.tier === n).length);
      snaps.push({ day: t / TPD, tiers, boughtTiers, cards: held.size, bought, offSphereBuys, rung, marks: marks(), walletP: wallet[P], walletS: wallet[S] });
    }
  }
  return { acquired, snaps, rungOpen };
}

// ─── Report ───
const pad = (s, n) => String(s).padEnd(n);
function table(rows) {
  const cols = Object.keys(rows[0]); const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
  console.log('| ' + cols.map((c, i) => pad(c, w[i])).join(' | ') + ' |');
  console.log('|' + w.map(n => '-'.repeat(n + 2)).join('|') + '|');
  for (const r of rows) console.log('| ' + cols.map((c, i) => pad(r[c], w[i])).join(' | ') + ' |');
}
const nameOf = id => CARDS.find(c => c.id === id)?.name ?? id;
const buys = acq => acq.filter(a => a.how === 'buy');
const postSpine = (acq, god) => acq.filter(a => a.id !== god.signatures.primary && !/_source$/.test(a.id));

console.log(`THR-1794 card tiers — table ${TIERS_PATH.split(/[\\/]/).pop()}${GENERIC_SOLD ? ' — FORK OPTION: generic cards SOLD (priced in the primary)' : ''}`);
const counts = { market: 0, gift: 0 }; for (const c of CARDS) counts[c.offer]++;
const byTier = [1, 2, 3, 4].map(n => `T${n} ${CARDS.filter(c => c.tier === n && c.offer === 'market').length}m/${CARDS.filter(c => c.tier === n && c.offer === 'gift').length}g`);
console.log(`${CARDS.length} cards: ${counts.market} market, ${counts.gift} gift (${CARDS.filter(c => c.generic).length} generic) · by tier ${byTier.join(' · ')}`);

for (const kind of (argv('--player') ? [argv('--player')] : ['fit', 'optimiser'])) {
  console.log(`\n================ player: ${kind} ================`);
  const res = Object.fromEntries(Object.entries(GODS).map(([k, g]) => [k, run(g, kind, 1)]));
  for (const [k, god] of Object.entries(GODS)) {
    const r = res[k];
    console.log(`\n${god.name} (${god.primary}/${god.secondary}) — seed 1 · rungs open on day ${[1, 2, 3, 4].map(n => r.rungOpen[n] != null ? (r.rungOpen[n] / TPD).toFixed(0) : '—').join(' / ')}`);
    table(r.snaps.map(s => ({ Day: s.day, Marks: s.marks, Rung: s.rung, 'Held T1/T2/T3/T4': s.tiers.join(' / '), 'Bought T1/T2/T3/T4': s.boughtTiers.join(' / '), Held: s.cards, Bought: s.bought, 'of which off-sphere': s.offSphereBuys,
      [`Wallet ${god.primary}/${god.secondary}`]: `${s.walletP.toFixed(0)}/${s.walletS.toFixed(0)}` })));
  }
  const a = buys(res.shepherd.acquired), b = buys(res.showcase.acquired);
  console.log('\nFirst five buys, side by side (day · card · tier)');
  table(Array.from({ length: 5 }, (_, i) => ({ '#': i + 1,
    Shepherd: a[i] ? `${(a[i].t / TPD).toFixed(0)} · ${nameOf(a[i].id)} · T${a[i].tier}` : '—', Showcase: b[i] ? `${(b[i].t / TPD).toFixed(0)} · ${nameOf(b[i].id)} · T${b[i].tier}` : '—' })));
  const ga = postSpine(res.shepherd.acquired, GODS.shepherd), gb = postSpine(res.showcase.acquired, GODS.showcase);
  console.log('First eight acquisitions after the spine, buys and gifts (day · card · how)');
  table(Array.from({ length: 8 }, (_, i) => ({ '#': i + 1,
    Shepherd: ga[i] ? `${(ga[i].t / TPD).toFixed(0)} · ${nameOf(ga[i].id)} · ${ga[i].how}` : '—', Showcase: gb[i] ? `${(gb[i].t / TPD).toFixed(0)} · ${nameOf(gb[i].id)} · ${gb[i].how}` : '—' })));

  let sh5 = 0, shAll5 = 0, c20 = 0, c90 = 0, b90 = 0, t5 = 0; const tierAt90 = [0, 0, 0, 0];
  for (let s = 1; s <= MC_RUNS; s++) {
    const x = run(GODS.shepherd, kind, s), y = run(GODS.showcase, kind, s);
    const xb = buys(x.acquired).slice(0, 5).map(q => q.id), yb = buys(y.acquired).slice(0, 5).map(q => q.id);
    sh5 += xb.filter(id => yb.includes(id)).length;
    const xa = postSpine(x.acquired, GODS.shepherd).slice(0, 5).map(q => q.id), ya = postSpine(y.acquired, GODS.showcase).slice(0, 5).map(q => q.id);
    shAll5 += xa.filter(id => ya.includes(id)).length;
    c20 += x.snaps[2].cards; c90 += x.snaps[4].cards; b90 += x.snaps[4].bought; t5 += (buys(x.acquired)[4]?.t ?? RUN_TICKS);
    x.snaps[4].boughtTiers.forEach((n, i) => { tierAt90[i] += n; });
  }
  const m = v => (v / MC_RUNS).toFixed(2);
  console.log(`Over ${MC_RUNS} seeds — shared cards in the two gods' first five BUYS: ${m(sh5)} (THR-1770 H3 baseline 0.49 fit / 0.61 optimiser; today's gifts 3.77)`);
  console.log(`  shared in the first five acquisitions after the spine, gifts included: ${m(shAll5)}`);
  console.log(`  Shepherd: held day 20 ${(c20 / MC_RUNS).toFixed(1)}, day 90 ${(c90 / MC_RUNS).toFixed(1)} (bought ${(b90 / MC_RUNS).toFixed(1)}: T1/T2/T3/T4 ${tierAt90.map(n => (n / MC_RUNS).toFixed(1)).join(' / ')}); fifth buy on day ${(t5 / MC_RUNS / TPD).toFixed(0)}`);
}

// ─── Tool reach: how often a god holds each generic tool by day 45 / 90 (the risk of selling them) ───
if (args.includes('--tool-reach')) {
  const tools = [...CARDS.filter(c => c.generic && c.gift !== 'spine' && c.gift !== 'milestone').map(c => c.id), GODS.shepherd.signatures.secondary];
  console.log(`\nGeneric tools held (share of ${MC_RUNS} seeds, fit player, Shepherd) — ${GENERIC_SOLD ? 'SOLD' : 'GIFTED at rungs'}`);
  const rows = tools.map(id => {
    let d45 = 0, d90 = 0;
    for (let s = 1; s <= MC_RUNS; s++) { const a = run(GODS.shepherd, 'fit', s).acquired.find(q => q.id === id); if (a && a.t <= 540) d45++; if (a) d90++; }
    return { card: nameOf(id), tier: CARDS.find(c => c.id === id).tier, 'by day 45': `${Math.round(100 * d45 / MC_RUNS)}%`, 'by day 90': `${Math.round(100 * d90 / MC_RUNS)}%` };
  });
  table(rows);
}
