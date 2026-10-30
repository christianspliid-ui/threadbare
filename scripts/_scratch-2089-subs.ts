import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../src/engine/gameInit';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { getPlaceNodes } from '../src/engine/sublocationShape';
const id:any = DEV_ASCENDANT_IDENTITY;
const c = deriveCosmologyFromIdentity({ sphereAlignment: id.sphereAlignment, mortalTags: id.mortalTags, hungerId: id.hungerId });
const s:any = initializeGameStateFromIdentity(id, 42, c, 'medium', 'breach').state; devSeedTheFirst(s);
const places = getPlaceNodes(s.graph); const cnt:Record<string,number>={};
for (const n of places as any[]) { const k=`${n.properties.locationSubtype}|${n.properties.locationType}`; cnt[k]=(cnt[k]??0)+1; }
console.log(places.length, JSON.stringify(cnt));
const subs = s.graph.getNodesByType('location').filter((n:any)=>typeof n.properties?.parentLocationId==='string');
const sc:Record<string,number>={}; for (const n of subs as any[]) { const k=`${n.properties.sublocationCategory}`; sc[k]=(sc[k]??0)+1; }
console.log(subs.length, JSON.stringify(sc));
import { getLocationNodes } from '../src/engine/sublocationShape';
console.log(Object.keys((places as any[])[0].properties).join(','));
const locs = getLocationNodes(s.graph) as any[]; console.log('locs', locs.length, Object.keys(locs[0].properties).slice(0,40).join(','));
const lc:Record<string,number>={}; for (const n of locs) { const k=`${n.properties.locationSubtype ?? n.properties.locationType ?? n.properties.settlementType ?? n.properties.category}`; lc[k]=(lc[k]??0)+1; } console.log(JSON.stringify(lc));
const towns = locs.filter(n=>['hamlet','town','city','capital','settlement'].includes(n.properties.locationSubtype ?? n.properties.locationType));
console.log('towns', towns.length, towns.map(n=>`${n.properties.locationSubtype}:${n.properties.population}/${Math.round(n.properties.foodStore??-1)}/${n.properties.buildProgress??'-'}`).join(' '));
