import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
const rows:any[] = (UNIFIED_ACTION_TEMPLATES as any[]).filter(t=>(t.essenceCost??0)>0 && (t.actorAffinities??[]).includes('ascendant'));
for (const s of ['mind','spirit','force','life','energy','time','matter','entropy']) {
  const r = rows.filter(t=>(t.progression?.pricedIn ?? t.sphereAffinity)===s && (t.progression?.tier??9)<=1);
  console.log(s.padEnd(8), r.map(t=>`${t.id}(${t.essenceCost},${(t.targetCategories??['actor']).join('/')},${t.progression?.offer},aff=${t.sphereAffinity??'-'})`).join('  '));
}
