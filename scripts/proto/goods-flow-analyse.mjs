// THR-1866 — compare the five goods-flow variants. Throwaway; never merged.
// node scripts/proto/goods-flow-analyse.mjs > scripts/proto/goods-flow-sketch.output.txt
import * as fs from 'fs';

const STAPLES = new Set(['grain', 'fish', 'water', 'grazing']);
const variants = ['today', 'shocks', 'regrow', 'flow', 'flowcut', 'hinter', 'hintercut'];
const runs = Object.fromEntries(variants.filter(v => fs.existsSync(`scripts/proto/goods-flow-${v}.output.json`))
  .map(v => [v, JSON.parse(fs.readFileSync(`scripts/proto/goods-flow-${v}.output.json`, 'utf8'))]));

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const fmt = n => (Math.round(n * 10) / 10).toString();

function analyse(r) {
  const days = r.days;
  const out = { famineOnsets: 0, glutOnsets: 0, famineTowns: new Set(), glutTowns: new Set(), flicker: 0, arcsOpened: 0, arcFlashpoints: 0, crossings: 0, arcsDissolved: 0 };
  const famineSpells = []; // durations
  const open = new Map();
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1], cur = days[i];
    for (const [loc, res] of Object.entries(cur.stocks)) {
      for (const [rid, [, tier]] of Object.entries(res)) {
        const pt = prev.stocks[loc]?.[rid]?.[1];
        if (!pt || pt === 'unset' || pt === tier) continue;
        out.crossings++;
        // flicker: returns to pt within 2 days
        const back = [days[i + 1], days[i + 2]].some(d => d?.stocks[loc]?.[rid]?.[1] === pt);
        if (back) out.flicker++;
        if (!STAPLES.has(rid)) continue;
        const k = `${loc}|${rid}`;
        if (tier === 'scarce') { out.famineOnsets++; out.famineTowns.add(loc); open.set(k, cur.day); }
        if (tier === 'surplus') { out.glutOnsets++; out.glutTowns.add(loc); }
        if (pt === 'scarce' && open.has(k)) { famineSpells.push(cur.day - open.get(k)); open.delete(k); }
      }
    }
    for (const loc of Object.keys(prev.arcs)) if (!cur.arcs[loc]) out.arcsDissolved++;
    for (const [loc, a] of Object.entries(cur.arcs)) {
      const pa = prev.arcs[loc];
      if (!pa) out.arcsOpened++;
      if (false) {} if (a.endsWith(':flashpoint') && !(pa ?? '').endsWith(':flashpoint')) out.arcFlashpoints++;
    }
  }
  for (const [, d] of open) famineSpells.push(days.at(-1).day - d);
  // tier census at day 0 / 25 / 50, staples only
  const census = d => { const c = { scarce: 0, adequate: 0, surplus: 0 }; for (const res of Object.values(d.stocks)) for (const [rid, [, t]] of Object.entries(res)) if (STAPLES.has(rid) && c[t] !== undefined) c[t]++; return c; };
  const qs = d => Object.values(d.stocks).flatMap(res => Object.entries(res).filter(([rid]) => STAPLES.has(rid)).map(([, [q]]) => q));
  const pros = d => Object.values(d.prosperity);
  const imported = Object.entries(days.at(-1).stocks).flatMap(([loc, res]) => Object.keys(res).filter(rid => !days[0].stocks[loc]?.[rid]).map(rid => `${loc}:${rid}`));
  return {
    ...out, famineTowns: out.famineTowns.size, glutTowns: out.glutTowns.size,
    famineSpellMedian: pct(famineSpells, 0.5), famineSpellMax: Math.max(0, ...famineSpells),
    census0: census(days[0]), census25: census(days[25] ?? days.at(-1)), census50: census(days.at(-1)),
    stapleQ0: [0.1, 0.5, 0.9].map(p => pct(qs(days[0]), p)), stapleQ50: [0.1, 0.5, 0.9].map(p => pct(qs(days.at(-1)), p)),
    pros0: [0.1, 0.5, 0.9].map(p => pct(pros(days[0]), p)), pros50: [0.1, 0.5, 0.9].map(p => pct(pros(days.at(-1)), p)),
    importedGoods: imported.length,
    chronicle: r.chron.length,
    econChron: r.chron.filter(c => !/Holding Pays/i.test(c.title)).length,
  };
}

const lines = [];
const L = s => lines.push(s);
L('THR-1866 goods-flow sketch — seed 42 · medium · 600 ticks (50 days) · in-loop stock mutation once a day');
L('Staples = grain, fish, water, grazing. "Famine onset" = a staple stock tier crossing into scarce; "glut" = into surplus.');
L('');
const res = Object.fromEntries(Object.entries(runs).map(([v, r]) => [v, analyse(r)]));
const cols = Object.keys(res);
const row = (label, f) => L(label.padEnd(34) + cols.map(v => String(f(res[v])).padStart(14)).join(''));
L(''.padEnd(34) + cols.map(v => v.padStart(14)).join(''));
row('tier crossings (all goods)', a => a.crossings);
row('  of which flicker (back ≤2 days)', a => a.flicker);
row('famine onsets (staple → scarce)', a => a.famineOnsets);
row('places that ever starved', a => a.famineTowns);
row('famine spell median / max (days)', a => `${a.famineSpellMedian}/${a.famineSpellMax}`);
row('glut onsets (staple → surplus)', a => a.glutOnsets);
row('places that ever glutted', a => a.glutTowns);
row('scarcity arcs opened', a => a.arcsOpened);
row('arcs reaching flashpoint', a => a.arcFlashpoints);
row('arcs that ended (recovered)', a => a.arcsDissolved);
row('famine/glut/scarcity chronicle', a => a.econChron);
row('staple tiers day 0 s/a/+', a => `${a.census0.scarce}/${a.census0.adequate}/${a.census0.surplus}`);
row('staple tiers day 25 s/a/+', a => `${a.census25.scarce}/${a.census25.adequate}/${a.census25.surplus}`);
row('staple tiers day 50 s/a/+', a => `${a.census50.scarce}/${a.census50.adequate}/${a.census50.surplus}`);
row('staple qty p10/p50/p90 day 0', a => a.stapleQ0.map(fmt).join('/'));
row('staple qty p10/p50/p90 day 50', a => a.stapleQ50.map(fmt).join('/'));
row('prosperity p10/p50/p90 day 0', a => a.pros0.join('/'));
row('prosperity p10/p50/p90 day 50', a => a.pros50.join('/'));
row('goods held by import at day 50', a => a.importedGoods);
row('economic chronicle lines', a => a.chronicle);

// Lanes
for (const v of ['flow', 'flowcut']) {
  const r = runs[v]; if (!r) continue;
  L(''); L(`── ${v}: lanes ──`);
  const name = id => r.meta.locs[id]?.name ?? id;
  const top = Object.entries(r.laneFlow).sort((a, b) => b[1] - a[1]).slice(0, 6);
  for (const [k, amt] of top) { const [a, b] = k.split('|'); L(`  ${name(a)} ↔ ${name(b)}: staple moved ${fmt(amt)}`); }
  L(`  lanes at end: ${r.lanesEnd.length} (threatened ${r.lanesEnd.filter(l => l.threatened).length})`);
}

// Cut counterfactual
if (runs.flow && runs.flowcut?.cutInfo) {
  const ci = runs.flowcut.cutInfo; const r = runs.flowcut, f = runs.flow;
  const name = id => r.meta.locs[id]?.name ?? id;
  L(''); L(`── the cut: lane ${name(ci.from)} ↔ ${name(ci.to)} cut on day 20 (it had carried ${fmt(ci.carried)} staple) ──`);
  for (const loc of [ci.from, ci.to]) {
    const staples = new Set([...Object.keys(f.days.at(-1).stocks[loc] ?? {}), ...Object.keys(r.days.at(-1).stocks[loc] ?? {})].filter(x => STAPLES.has(x)));
    for (const rid of staples) {
      const traj = run => [0, 10, 20, 25, 30, 35, 40, 50].map(d => { const s = run.days[d]?.stocks[loc]?.[rid]; return s ? `${fmt(s[0])}${({scarce:"S",adequate:"a",surplus:"+"})[s[1]] ?? "?"}` : '—'; }).join(' ');
      L(`  ${name(loc)} ${rid}  flow:    ${traj(f)}`);
      L(`  ${name(loc)} ${rid}  flowcut: ${traj(r)}`);
    }
    const p = run => [0, 20, 30, 40, 50].map(d => run.days[d]?.prosperity[loc] ?? '—').join(' ');
    const u = run => [20, 30, 40, 50].map(d => run.days[d]?.unrest[loc] ?? 0).join(' ');
    const a = run => [...new Set(run.days.slice(20).map(d => d.arcs[loc]).filter(Boolean))].join(', ') || 'none';
    L(`  ${name(loc)} prosperity d0/20/30/40/50  flow ${p(f)} | cut ${p(r)} · unrest d20/30/40/50 flow ${u(f)} | cut ${u(r)} · arcs after cut flow [${a(f)}] cut [${a(r)}]`);
  }
  L("  (quantity then tier: S scarce, a adequate, + surplus)");
}

// Hinterland
if (runs.hinter) {
  const r = runs.hinter; const name = id => r.meta.locs[id]?.name ?? id;
  const byTown = {}; for (const [k, v] of Object.entries(r.hinterFlow)) { const t = k.split('|')[0]; byTown[t] = (byTown[t] ?? 0) + v; }
  L(''); L(`── hinter: ${Object.keys(byTown).length} settlements fed from ${new Set(Object.keys(r.hinterFlow).map(k => k.split('|')[1])).size} fields; top draws ──`);
  for (const [t, v] of Object.entries(byTown).sort((a, b) => b[1] - a[1]).slice(0, 8)) L(`  ${name(t)} (${r.meta.locs[t]?.subtype}) drew ${fmt(v)} staple`);
}
if (runs.hinter && runs.hintercut?.hinterCut) {
  const hc = runs.hintercut.hinterCut, r = runs.hintercut, f = runs.hinter; const name = id => r.meta.locs[id]?.name ?? id;
  L(''); L(`── the siege of the fields: ${name(hc.town)} loses its ${hc.fields.length} fields (${hc.fields.map(name).join(', ')}) on day 20, having drawn ${fmt(hc.drawn)} ──`);
  const staples = new Set([...Object.keys(f.days.at(-1).stocks[hc.town] ?? {}), ...Object.keys(r.days.at(-1).stocks[hc.town] ?? {})].filter(x => STAPLES.has(x)));
  const T = { scarce: 'S', adequate: 'a', surplus: '+' };
  for (const rid of staples) {
    const traj = run => [1, 10, 20, 25, 30, 35, 40, 50].map(d => { const s = run.days[d]?.stocks[hc.town]?.[rid]; return s ? fmt(s[0]) + (T[s[1]] ?? '?') : '—'; }).join(' ');
    L(`  ${rid}  kept fields: ${traj(f)}`); L(`  ${rid}  fields lost: ${traj(r)}`);
  }
  const p = run => [1, 20, 30, 40, 50].map(d => run.days[d]?.prosperity[hc.town] ?? '—').join(' ');
  const u = run => [20, 30, 40, 50].map(d => run.days[d]?.unrest[hc.town] ?? 0).join(' ');
  const arc = run => [20, 25, 30, 35, 40, 45, 50].map(d => run.days[d]?.arcs[hc.town] ?? '-').join(' ');
  L(`  prosperity d1/20/30/40/50   kept ${p(f)} | lost ${p(r)}`);
  L(`  unrest d20/30/40/50         kept ${u(f)} | lost ${u(r)}`);
  L(`  scarcity arc d20..50 kept: ${arc(f)}`); L(`  scarcity arc d20..50 lost: ${arc(r)}`);
  L('  (quantity then tier: S scarce, a adequate, + surplus)');
}

// Shocks list summary
if (runs.shocks) {
  const s = runs.shocks.shocks; L(''); L(`── shocks: ${s.length} landed (${s.filter(x => x.delta < 0).length} blights, ${s.filter(x => x.delta > 0).length} bounties) — none recover under (a)`);
}

// Chronicle samples
for (const v of cols) {
  L(''); L(`── ${v}: economic chronicle (first 6 of ${runs[v].chron.length}) ──`);
  for (const c of runs[v].chron.filter(c => !/Holding Pays/i.test(c.title)).slice(0, 6)) L(`  t${c.tick} ${c.title} — ${c.prose.replace(/\s+/g, ' ').slice(0, 160)}`);
}
console.log(lines.join('\n'));
