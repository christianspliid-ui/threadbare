import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
const rows:any[] = (UNIFIED_ACTION_TEMPLATES as any[]).filter(t=>(t.essenceCost??0)>0 && (t.actorAffinities??[]).includes('ascendant') && t.sphereAffinity);
const by:Record<string,any[]>={};
for(const t of rows){ (by[t.sphereAffinity]??=[]).push(t); }
for(const [s,ts] of Object.entries(by)){
  console.log(`\n## ${s} (${ts.length})`);
  for(const t of ts.sort((a,b)=>a.essenceCost-b.essenceCost)){
    const cats=(t.targetCategories??['actor']).join(',');
    if(!/location|sublocation/.test(cats)) continue;
    const steps=(t.steps??[]).map((st:any)=>`${st.duration?.min??'?'}-${st.duration?.max??'?'}d${st.difficulty??'?'}`).join('|');
    console.log(`${t.id} cost=${t.essenceCost} cats=${cats} subs=${(t.targetSubtypes??[]).join('/')} tier=${t.progression?.tier} offer=${t.progression?.offer} gen=${t.progression?.generic} steps=${steps} crud=${t.crudType}`);
  }
}
