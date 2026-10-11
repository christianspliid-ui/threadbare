#!/usr/bin/env node
// PROTOTYPE — THR-1773 (attended, 2026-10-11). Lives on proto/thr-1773-cross-run only; never merged.
//
// Christian's ruling (chat, 2026-10-11): what carries between runs is "the world remembers + wider" —
// the god starts every run equally strong; what carries is in the WORLD (echoes seeded into a NEW world)
// and in the player's CHOICES (each run unlocks hungers, courts and cards for later runs). No stat growth.
//
// This driver plays an account through 20 runs and prints, at runs 1 / 2 / 5 / 10 / 20:
//   - what the run starts with (hungers on offer, market width, echoes alive in the world, the head start
//     those echoes give THIS run's god, the World-Soul tilt toward its spheres)
//   - what the run's own economy then does by day 10 and day 45 (scripts/proto-card-tiers-1794.mjs --json,
//     the THR-1794 market with the account's locked cards removed)
//
// Usage: node scripts/proto-cross-run-1773.mjs [--runs-mc 200] [--unlocks 4] [--harvest bittersweet]

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const argv = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const here = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(here, 'proto-card-tiers-1794.catalog.json');
const CATALOG = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const MC = argv('--runs-mc') ?? '200';

// ─── Cross-run tunables (all PROPOSED; named so a retune is a number) ───
const ACCOUNT_CARD_UNLOCKS_PER_RUN = Number(argv('--unlocks') ?? 2); // cards that join the omen pool after each run
const RUN1_T3_PER_SPHERE = 1;            // run 1's market keeps each sphere's cheapest tier-3 card; the rest of T3/T4 is the reservoir
const RUN1_HUNGERS = ['gather', 'witness', 'reclaim', 'sever'];       // one per court shape (circle, web, high_house, abyss)
const HUNGER_UNLOCKS_PER_RUN = 1;        // one hunger awakens per run (the player picks between two the echoes favour)
const HARVEST = argv('--harvest') ?? 'bittersweet';
const HARVEST_DIVINE_ECHOES = { triumphant: 3, bittersweet: 2, somber: 1 };     // HARVEST_ECHO_COUNTS.divine — src/types/worldSoul.ts
const ECHO_DEGRADATION_RATE = 0.15, ECHO_FADE_THRESHOLD = 0.9;                 // src/types/echo.ts
const MAX_SEEDED_ECHOES = 6;             // a new world seeds at most this many divine echoes, strongest first
const ECHO_HELD_BELOW = 0.3, ECHO_TOUCHED_BELOW = 0.6; // a fresh Monument starts its place Held, a fading one Touched
const FUNDAMENT_BLEND_PER_RUN = 0.1;     // blendFundaments weight: how far the next world's sphere weights lean toward the god's spheres
const FUNDAMENT_REVERT = 0.05;           // and how far they relax back toward even each run (so no sphere runs away)

// Hunger catalog — spheres after the THR-1749 re-alignment (Docs/audits THR-1772 § 2)
const HUNGERS = {
  gather: ['life', 'spirit'], witness: ['mind', 'spirit'], reclaim: ['force', 'time'], sever: ['entropy', 'mind'],
  reshape: ['force', 'matter'], preserve: ['time', 'spirit'], kindle: ['energy', 'life'], bind: ['matter', 'mind'],
  wander: ['energy', 'time'], consume: ['entropy', 'force'], haunt: ['spirit', 'entropy'], illuminate: ['mind', 'energy'],
};
const OPPOSITE = { force: 'mind', mind: 'force', matter: 'time', time: 'matter', energy: 'spirit', spirit: 'energy', life: 'entropy', entropy: 'life',
  chaos: 'order', order: 'chaos', light: 'darkness', darkness: 'light' };
const SPHERES = Object.keys(OPPOSITE);

// ─── The table under test (THR-1794) ───
const [head, ...rows] = readFileSync(join(here, 'proto-card-tiers-1794.tsv'), 'utf8').trim().split(/\r?\n/);
const cols = head.split('\t');
const TABLE = rows.map(r => { const v = r.split('\t'); const o = {}; cols.forEach((c, i) => { o[c] = v[i] ?? ''; }); return o; });
const costOf = id => CATALOG.find(c => c.id === id)?.cost ?? 0;
const nameOf = id => CATALOG.find(c => c.id === id)?.name ?? id;
const market = TABLE.filter(r => r.offer === 'market');

// Run 1's base market: every tier 1–2 card, every generic card, and each sphere's cheapest tier-3 card.
const base = new Set(market.filter(r => Number(r.tier) <= 2 || r.generic === 'y').map(r => r.id));
for (const s of SPHERES) market.filter(r => r.pricedIn === s && Number(r.tier) === 3 && r.generic !== 'y')
  .sort((a, b) => costOf(a.id) - costOf(b.id) || a.id.localeCompare(b.id)).slice(0, RUN1_T3_PER_SPHERE).forEach(r => base.add(r.id));
const reservoir = market.filter(r => !base.has(r.id));

// ─── Play an account ───
const account = { hungers: [...RUN1_HUNGERS], locked: new Set(reservoir.map(r => r.id)), played: [], echoes: [],
  fundament: Object.fromEntries(SPHERES.map(s => [s, 1 / 12])) };
const queue = Object.keys(HUNGERS).filter(h => !RUN1_HUNGERS.includes(h));
const snapshots = {};
const tmp = mkdtempSync(join(tmpdir(), 'thr1773-'));

for (let run = 1; run <= 20; run++) {
  // the player plays the newest god on offer (run 1–4: each starting hunger once; after: each awakened one, then cycles)
  const hunger = run <= account.hungers.length ? account.hungers[run - 1] : account.hungers[(run - 1) % account.hungers.length];
  const [P, S] = HUNGERS[hunger];
  // what the world seeds: the strongest live echoes, read against THIS god's spheres
  const live = account.echoes.filter(e => e.deg < ECHO_FADE_THRESHOLD).sort((a, b) => a.deg - b.deg).slice(0, MAX_SEEDED_ECHOES);
  const headStart = { held: 0, touched: 0, hostile: 0, kin: 0, relics: 0 };
  for (const e of live) {
    const friendly = e.spheres.some(s => s === P || s === S), opposed = e.spheres.some(s => OPPOSITE[s] === P || OPPOSITE[s] === S);
    if (e.kind === 'monument') {
      if (friendly) headStart[e.deg < ECHO_HELD_BELOW ? 'held' : e.deg < ECHO_TOUCHED_BELOW ? 'touched' : 'touched']++;
      else if (opposed) headStart.hostile++;
    }
    if (e.kind === 'legacy' && friendly) headStart.kin++;
    if (e.kind === 'relic') headStart.relics++;
  }
  const tilt = (account.fundament[P] + account.fundament[S]) / (2 / 12);
  if ([1, 2, 5, 10, 20].includes(run)) {
    const lockedFile = join(tmp, `locked-${run}.txt`); writeFileSync(lockedFile, [...account.locked].join('\n'));
    const m = JSON.parse(execFileSync(process.execPath, [join(here, 'proto-card-tiers-1794.mjs'), '--catalog', CATALOG_PATH, '--json', '--runs', MC, '--locked', `@${lockedFile}`], { encoding: 'utf8' }));
    snapshots[run] = { hunger, P, S, hungers: account.hungers.length, market: m.market, locked: m.locked, live: live.length,
      liveKinds: ['monument', 'legacy', 'relic'].map(k => live.filter(e => e.kind === k).length).join(' / '), headStart, tilt, m };
  }
  // ── Twilight: harvest echoes of THIS god, unlock cards and a hunger for the account ──
  for (const e of account.echoes) e.deg = Math.round((e.deg + ECHO_DEGRADATION_RATE) * 100) / 100;
  const kinds = ['monument', 'legacy', 'relic'];
  for (let i = 0; i < HARVEST_DIVINE_ECHOES[HARVEST]; i++) account.echoes.push({ kind: kinds[(run + i) % 3], spheres: [P, S], deg: 0, run });
  const w = r => (r.pricedIn === P ? 3 : r.pricedIn === S ? 2 : 0.5);
  const pick = reservoir.filter(r => account.locked.has(r.id)).sort((a, b) => w(b) - w(a) || Number(a.tier) - Number(b.tier) || costOf(a.id) - costOf(b.id) || a.id.localeCompare(b.id))
    .slice(0, ACCOUNT_CARD_UNLOCKS_PER_RUN);
  for (const r of pick) account.locked.delete(r.id);
  for (let i = 0; i < HUNGER_UNLOCKS_PER_RUN && queue.length; i++) {
    // of the next two sealed hungers, the one sharing a sphere with this god awakens (the echoes favour kin)
    const two = queue.slice(0, 2); const kin = two.find(h => HUNGERS[h].some(s => s === P || s === S)) ?? two[0];
    queue.splice(queue.indexOf(kin), 1); account.hungers.push(kin);
  }
  for (const s of SPHERES) account.fundament[s] = account.fundament[s] * (1 - FUNDAMENT_BLEND_PER_RUN - FUNDAMENT_REVERT)
    + ((s === P || s === S) ? 0.5 : 0) * FUNDAMENT_BLEND_PER_RUN + (1 / 12) * FUNDAMENT_REVERT;
  account.played.push(hunger);
}

// ─── Report ───
const pad = (s, n) => String(s).padEnd(n);
function table(rs) {
  const cs = Object.keys(rs[0]); const w = cs.map(c => Math.max(c.length, ...rs.map(r => String(r[c]).length)));
  console.log('| ' + cs.map((c, i) => pad(c, w[i])).join(' | ') + ' |');
  console.log('|' + w.map(n => '-'.repeat(n + 2)).join('|') + '|');
  for (const r of rs) console.log('| ' + cs.map((c, i) => pad(r[c], w[i])).join(' | ') + ' |');
}
console.log(`THR-1773 cross-run curve — harvest ${HARVEST} every run, ${ACCOUNT_CARD_UNLOCKS_PER_RUN} card unlocks a run, ${MC} seeds per point`);
console.log(`Run-1 market ${base.size} cards; reservoir ${reservoir.length}: ${reservoir.map(r => nameOf(r.id)).join(', ')}`);
console.log('\nWhat a run starts with (the god played that run; head start read against its spheres)');
table(Object.entries(snapshots).map(([run, s]) => ({ Run: run, God: `${s.hunger} (${s.P}/${s.S})`, 'Hungers on offer': s.hungers, 'Market cards': s.market, 'Still sealed': s.locked,
  'Echoes alive M/L/R': s.liveKinds, 'Places Held/Touched at start': `${s.headStart.held}/${s.headStart.touched}`, 'Hostile monuments': s.headStart.hostile,
  'Kin mortals': s.headStart.kin, 'World tilt to its spheres': `×${s.tilt.toFixed(2)}` })));
console.log('\nWhat the run then does (Shepherd measured on that account\'s market; fit player; means)');
table(Object.entries(snapshots).map(([run, s]) => { const g = s.m.gods.shepherd; return { Run: run,
  'Day 10 held / bought': `${g[10].held.toFixed(1)} / ${g[10].bought.toFixed(1)}`, 'Day 45 held / bought': `${g[45].held.toFixed(1)} / ${g[45].bought.toFixed(1)}`,
  'Day 45 bought T1/T2/T3/T4': g[45].tiers.map(n => n.toFixed(1)).join(' / '), 'Day 90 bought T3/T4': `${g[90].tiers[2].toFixed(1)} / ${g[90].tiers[3].toFixed(1)}`,
  'Shared first five buys': s.m.shared5.toFixed(2) }; }));
console.log(`\nHunger awakening order: ${account.hungers.join(', ')}`);
