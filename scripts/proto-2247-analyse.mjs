// PROTO thr-2247 — reads .cache/doom-push/*.raw.json and prints the push census and the decision rate.
// Never merged (proto/thr-2247-doom-push-census).
import fs from 'fs';
const dir = process.argv[2] ?? '.cache/doom-push';
const DAY = 12; // TICKS_PER_DAY
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.raw.json')).sort();
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  const post = (t) => t != null && t > r.warm;
  const led = r.ledger.filter((x) => post(x.t));
  const sum = (a, k) => a.reduce((s, x) => s + (typeof k === 'function' ? k(x) : x[k] ?? 0), 0);
  const total = sum(led, 'd'); const own = sum(led, 'own');
  const stage5 = r.ledger.find((x) => x.stage === 5)?.t ?? null;
  const pushes = r.pushes.filter((p) => post(p.tick));
  const micro = pushes.filter((p) => p.kind === 'micro');
  const byName = {}; const byActor = { first: 0, other: 0 }; const byLoc = {}; const actors = new Set();
  for (const p of micro) {
    byName[p.name] = (byName[p.name] ?? 0) + p.mag;
    if (p.actorId === r.firstId) byActor.first += p.mag; else byActor.other += p.mag;
    byLoc[p.locationId ?? 'none'] = (byLoc[p.locationId ?? 'none'] ?? 0) + p.mag;
    actors.add(p.actorId);
  }
  const rate = pushes.filter((p) => p.kind !== 'micro');
  const topLoc = Object.entries(byLoc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${v.toFixed(1)}`);
  const microInStage5 = sum(micro.filter((p) => stage5 != null && p.tick >= stage5), 'mag');
  // decisions
  const dec = r.decisions.filter((d) => post(d.t));
  const offered = dec.filter((d) => d.kind === 'hand' || d.kind === 'vision' || d.kind === 'beat');
  const ret = dec.find((d) => /return/i.test(String(d.id)))?.t
    ?? (r.visionChoices.map((s) => s.split(':')).find((a) => /apotheosis/i.test(a[1]))?.[0]?.slice(1) * 1) ?? null;
  const end = r.ranTo;
  const perDay = (a, from, to) => (to > from ? (a.filter((d) => d.t >= from && d.t < to).length / ((to - from) / DAY)) : NaN);
  const firstHands = offered.filter((d) => d.kind === 'hand' && d.actorId === r.firstId);
  console.log(`\n== seed ${r.seed} arm ${r.arm} warm ${r.warm} ranTo t${end} stop=${r.stopReason} phase=${r.phase}`);
  console.log(`doom post-warm: total ${total.toFixed(1)} clock ticks · own step ${own.toFixed(1)} · other ${(total - own).toFixed(1)} (${(100 * (total - own) / total).toFixed(0)}%) · last stage from t${stage5} · end progress ${r.ledger.at(-1)?.p?.toFixed(3)} mod ${r.ledger.at(-1)?.mod}`);
  console.log(`micro pushes: ${micro.length} events, ${sum(micro, 'mag').toFixed(1)} ticks, ${actors.size} actors; by kind ${JSON.stringify(Object.fromEntries(Object.entries(byName).map(([k, v]) => [k, +v.toFixed(1)])))}; First ${byActor.first.toFixed(1)} / others ${byActor.other.toFixed(1)}; in last stage ${microInStage5.toFixed(1)}; top places ${topLoc.join(' ')} of ${Object.keys(byLoc).length}`);
  console.log(`rate pushes: ${rate.length} ${JSON.stringify(rate.slice(0, 5))}`);
  console.log(`decisions offered post-warm: ${offered.length} (hand ${offered.filter((d) => d.kind === 'hand').length}, First's hands ${firstHands.length}, vision ${offered.filter((d) => d.kind === 'vision').length}, beat ${offered.filter((d) => d.kind === 'beat').length}); held-without-hand ${dec.filter((d) => d.kind === 'held-nohand').length}`);
  console.log(`return/apotheosis at t${ret}; per day before ${perDay(offered, r.warm, ret ?? end).toFixed(2)} · after ${ret ? perDay(offered, ret, end).toFixed(2) : 'n/a'} · in last stage ${stage5 ? perDay(offered, stage5, end).toFixed(2) : 'n/a'} · before last stage ${stage5 ? perDay(offered, r.warm, stage5).toFixed(2) : 'n/a'}`);
  const lastHand = offered.filter((d) => d.kind === 'hand').at(-1)?.t; const lastFirst = firstHands.at(-1)?.t;
  console.log(`last hand t${lastHand} · last First hand t${lastFirst} · longest gap with no decision: ${(() => { let g = 0, prev = r.warm; for (const d of offered) { g = Math.max(g, d.t - prev); prev = d.t; } g = Math.max(g, end - prev); return (g / DAY).toFixed(1); })()} days`);
}
