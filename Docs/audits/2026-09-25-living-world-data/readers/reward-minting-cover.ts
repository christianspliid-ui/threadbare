// Companion to reward-minting.ts (THR-1626): for each Storied/Mythic recipe filter the census saw,
// which found-origin cores could carry it (family, forms, materials, reaches, spheres — a static
// over-approximation of the tags a core can produce). Usage: bundle like reward-minting.ts, then
// node .cache/reward-minting-cover.mjs <reward-minting output.json>
import { ITEM_GEN_CORES } from '../../../../src/data/item-generator-cores';
import { ITEM_GEN_FORMS, ITEM_GEN_MATERIALS, ITEM_GEN_REACHES } from '../../../../src/data/item-generator-tables';
import * as fs from 'fs';
const rm = JSON.parse(fs.readFileSync(process.argv[2] ?? '.cache/rm.json', 'utf8'));
const reach = (c: any): Set<string> => {
  const s = new Set<string>(['#storied', ...c.family]);
  const forms = Object.keys(c.forms ?? {}).concat(...Object.values(c.formsByEvent ?? {}).map((f: any) => Object.keys(f)));
  for (const f of forms) { const F = (ITEM_GEN_FORMS as any)[f]; if (!F) continue; F.tags.forEach((t: string) => s.add(t));
    for (const m of Object.values(ITEM_GEN_MATERIALS) as any[]) if (m.fits.some((x: string) => F.fits.includes(x))) (m.tags ?? []).forEach((t: string) => s.add(t)); }
  const rs = Object.keys(c.reaches ?? {}); (rs.length ? rs : ITEM_GEN_REACHES).forEach(r => s.add('#' + r));
  Object.keys(c.spheres ?? {}).forEach(sp => s.add('#' + sp));
  if (c.trophy || c.monsterSpheres) ['chaos','order','light','darkness','force','matter','energy','life','mind','spirit','time','entropy'].forEach(sp => s.add('#'+sp));
  return s;
};
const out: any = {}; let tot = 0, cov = 0;
for (const seed of ['42', '99', '7']) for (const [k, n] of Object.entries(rm[seed].storiedMythicFilters) as [string, number][]) {
  const m = /^t(\d) \[(.*)\]$/.exec(k)!; const band = Number(m[1]); const f = m[2] ? m[2].split(',') : [];
  const cores = ITEM_GEN_CORES.filter((c: any) => c.origins.includes('found') && c.bands.includes(band) && f.every(t => reach(c).has(t))).map((c: any) => c.id);
  const key = `t${band} [${f.join(',')}]`; out[key] = out[key] ?? { draws: 0, cores }; out[key].draws += n; tot += n; if (cores.length) cov += n;
}
const rows = Object.entries(out).sort((a: any, b: any) => b[1].draws - a[1].draws).map(([k, v]: any) => `${String(v.draws).padStart(3)} ${k.padEnd(26)} ${v.cores.length} ${v.cores.slice(0,6).join(',')}`);
console.log(rows.join('\n')); console.log(`covered draws ${cov}/${tot} = ${(cov/tot*100).toFixed(0)}%`);
