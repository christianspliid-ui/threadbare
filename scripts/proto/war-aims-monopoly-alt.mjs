// THR-1868: what monopoly rule is reachable? Reads the cached war-aims snapshots (never merged).
import fs from 'fs';
const snaps = JSON.parse(fs.readFileSync('.cache/war-aims-snapshots.json', 'utf8'));
const out = [];
const p = (s = '') => out.push(s);
const days = [0, 10, 25, 50].map(d => snaps[Math.min(d, snaps.length - 1)]);
const name = new Map(snaps.flatMap(s => s.factions.map(f => [f.id, f.name])));
const SET = new Set(['hamlet', 'town', 'city', 'capital', 'castle', 'fort']);
for (const s of days) {
  const day = s.tick / 12;
  const holder = new Map(s.controls.map(c => [c.tgt, c.src]));
  const res = new Map();
  for (const [id, l] of Object.entries(s.locs)) {
    if (l.parent) continue;
    for (const r of Object.keys(l.resources)) (res.get(r) ?? res.set(r, []).get(r)).push({ id, h: holder.get(id), hex: l.hex, settled: SET.has(l.subtype) });
  }
  p(`## day ${day}`);
  let a = 0, b = 0, c = 0;
  for (const [r, places] of [...res].sort()) {
    const held = places.filter(x => x.h);
    const by = new Map(); for (const x of held) by.set(x.h, (by.get(x.h) ?? 0) + 1);
    const best = [...by].sort((x, y) => y[1] - x[1])[0];
    // A: 60% of HELD bearing places (unclaimed land does not count against a holder).
    const A = best && held.length >= 2 && best[1] / held.length >= 0.6;
    // B: 'only supplier' — the sole holder of the resource among all holders (min 2 places held).
    const B = best && by.size === 1 && best[1] >= 2;
    // C: 60% of bearing places within 8 hexes of the holder's best-held place (a regional market).
    let C = false, Cdesc = '';
    for (const [f] of by) for (const x of held.filter(y => y.h === f && y.hex)) {
      const near = places.filter(y => y.hex && Math.abs(y.hex[0] - x.hex[0]) + Math.abs(y.hex[1] - x.hex[1]) <= 8);
      const mine = near.filter(y => y.h === f).length;
      if (near.length >= 3 && mine / near.length >= 0.6) { C = true; Cdesc = `${name.get(f)} ${mine}/${near.length} near ${x.id}`; }
    }
    if (A) a++; if (B) b++; if (C) c++;
    p(`  ${r.padEnd(8)} bearing ${places.length}, held ${held.length}, holders ${by.size}, best ${best ? `${name.get(best[0])} ${best[1]}` : '-'} | A ${A ? 'Y' : '-'} B ${B ? 'Y' : '-'} C ${C ? 'Y ' + Cdesc : '-'}`);
  }
  p(`  monopolies: A (60% of held) ${a}, B (sole holder) ${b}, C (60% regional, 8 hexes) ${c}`);
}
fs.writeFileSync('scripts/proto/war-aims-monopoly-alt.output.txt', out.join('\n') + '\n');
console.log(out.join('\n'));
