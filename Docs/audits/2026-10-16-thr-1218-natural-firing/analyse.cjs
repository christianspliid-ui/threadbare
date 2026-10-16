const fs = require('fs');
const path = require('path');
const dir = __dirname;
const seeds = process.argv.slice(2);
const runs = seeds.map(s => JSON.parse(fs.readFileSync(path.join(dir, `run-${s}.json`), 'utf8')));
const TPD = runs[0].TICKS_PER_DAY;
const isEnc = f => /^(encounter|enc)\./.test(f.templateId);
const fam = f => f.encounterType || f.templateId.split('.').slice(0, 2).join('.');
const pct = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
const r2 = x => Number.isFinite(x) ? x.toFixed(2) : '-';

const perSeed = [];
const all = { fir: [], exp: {}, notif: {} };
for (const run of runs) {
  const r = run.results[0];
  for (const [k, v] of Object.entries(r.exposure)) all.exp[k] = (all.exp[k] || 0) + v;
  for (const [k, v] of Object.entries(r.notif)) all.notif[r.seed + ':' + k] = v;
  for (const f of r.firings) all.fir.push(f);
  const enc = r.firings.filter(isEnc).filter(f => f.actorType === 'individual');
  perSeed.push({ seed: r.seed, ms: r.ms, total: r.firings.length, enc: enc.length, agentTicks: r.exposure.all,
    rate: enc.length / r.exposure.all * 100, threads: Object.keys(r.finalThreads).length,
    first: enc.filter(f => f.threaded).length });
}
console.log('## per seed'); console.table(perSeed);

const enc = all.fir.filter(isEnc).filter(f => f.actorType === 'individual');
const nonEnc = all.fir.filter(f => !isEnc(f));
console.log('non-encounter actions', nonEnc.length, Object.entries(nonEnc.reduce((m, f) => (m[f.templateId.split('.')[0]] = (m[f.templateId.split('.')[0]] || 0) + 1, m), {})));
console.log('non-individual encounter actors', all.fir.filter(isEnc).filter(f => f.actorType !== 'individual').length);

const rateRow = (label, list, expKey) => {
  const e = all.exp[expKey] || 0;
  return { label, firings: list.length, agentTicks: e, per100: r2(list.length / e * 100), perDay: r2(list.length / e * TPD) };
};
console.log('## split');
console.table([
  rateRow('all individuals', enc, 'all'),
  rateRow('threaded (First)', enc.filter(f => f.threaded), 'threaded'),
  rateRow('unthreaded', enc.filter(f => !f.threaded), 'unthreaded'),
  ...['spotlight', 'notable', 'ambient', 'none'].map(s => rateRow('spot:' + s, enc.filter(f => !f.threaded && f.spotlight === s), 'spot:' + s)),
  ...['novice', 'journeyman', 'expert', 'master'].map(t => rateRow('agentTier:' + t, enc.filter(f => f.agentTier === t), 'tier:' + t)),
]);
// band of the reach the encounter used
const rb = {}; for (const f of enc) rb[f.reachBand] = (rb[f.reachBand] || 0) + 1;
console.log('reach-band of firing (stamp or template reach)', rb);
// First per-seed
console.log('First firings per seed', runs.map(r => r.results[0].firings.filter(isEnc).filter(f => f.threaded).length));

// families
const fm = {}; for (const f of enc) { const k = fam(f); fm[k] = fm[k] || { n: 0, first: 0, seeded: 0 }; fm[k].n++; if (f.threaded) fm[k].first++; if (f.seeded) fm[k].seeded++; }
console.log('## families'); console.table(Object.entries(fm).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => ({ family: k, ...v, share: (v.n / enc.length * 100).toFixed(1) + '%' })));
const fmFirst = {}; for (const f of enc.filter(f => f.threaded)) fmFirst[f.templateId] = (fmFirst[f.templateId] || 0) + 1;
console.log('First templates', fmFirst);

// surfacing
const tiers = {}; for (const f of enc) { const k = (f.threaded ? 'T:' : 'U:') + f.effectiveTier + (f.routine ? '+routine' : ''); tiers[k] = (tiers[k] || 0) + 1; }
console.log('effectiveTier (T=threaded,U=unthreaded)', tiers);
let pause = 0, auto = 0, aft = 0, notified = 0, nf = 0, nfp = 0;
const firstIds = new Set(enc.filter(f => f.threaded).map(f => f.seed + ':' + f.actionId));
for (const [k, v] of Object.entries(all.notif)) { notified++; if (v.pause) pause++; if (v.auto && !v.pause) auto++; if (v.aftermath) aft++; if (firstIds.has(k)) { nf++; if (v.pause) nfp++; } }
console.log({ notifiedActions: notified, pauseAny: pause, autoOnly: auto, withAftermath: aft, firstNotified: nf, firstPause: nfp, firstEncounters: firstIds.size });
const nonFirstNotified = Object.keys(all.notif).filter(k => !firstIds.has(k));
console.log('notified non-First keys sample', nonFirstNotified.slice(0, 5));

// gaps & back-to-back
const byAgent = new Map();
for (const f of enc) { const k = f.seed + ':' + f.actorId; if (!byAgent.has(k)) byAgent.set(k, []); byAgent.get(k).push(f); }
const gapsAll = [], gapsFirst = [], gapsSpot = [];
let pairs = 0, sameFam = 0, sameTpl = 0, pairsF = 0, sameFamF = 0, sameTplF = 0;
for (const [, l] of byAgent) {
  l.sort((a, b) => a.tick - b.tick);
  for (let i = 1; i < l.length; i++) {
    const g = l[i].tick - l[i - 1].tick;
    gapsAll.push(g); if (l[i].threaded) gapsFirst.push(g); if (l[i].spotlight === 'spotlight') gapsSpot.push(g);
    pairs++; const sf = fam(l[i]) === fam(l[i - 1]); const st = l[i].templateId === l[i - 1].templateId;
    if (sf) sameFam++; if (st) sameTpl++;
    if (l[i].threaded) { pairsF++; if (sf) sameFamF++; if (st) sameTplF++; }
  }
}
const g = (name, a) => ({ name, n: a.length, p10: pct(a, 0.1), median: pct(a, 0.5), p90: pct(a, 0.9), mean: r2(a.reduce((s, x) => s + x, 0) / a.length) });
console.log('## gaps (ticks)'); console.table([g('all individuals', gapsAll), g('spotlight', gapsSpot), g('First', gapsFirst)]);
console.log({ pairs, sameFamPct: r2(sameFam / pairs * 100), sameTplPct: r2(sameTpl / pairs * 100), pairsF, sameFamFPct: r2(sameFamF / pairsF * 100), sameTplFPct: r2(sameTplF / pairsF * 100) });
// agents firing at least once
const agentsFired = byAgent.size;
console.log({ agentsFired, avgLivingAgents: r2(all.exp.all / (runs.length * runs[0].ticks)) });
// share of encounters seeded vs board
console.log({ seededShare: r2(enc.filter(f => f.seeded).length / enc.length * 100), sources: enc.reduce((m, f) => (m[f.source] = (m[f.source] || 0) + 1, m), {}) });
