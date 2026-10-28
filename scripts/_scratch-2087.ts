// THR-2087 census (design lane, never merged): on the seeded medium world, how many hexes a hex card can
// target hold a place-tier location, and how far the nearest place is when they do not.
// Usage: npx esbuild scripts/_scratch-2087.ts --bundle --platform=node --format=esm --outfile=.cache/s2087.mjs && node .cache/s2087.mjs
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../src/engine/gameInit';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { getPlaceNodes, getLocationNodes } from '../src/engine/sublocationShape';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';

const c = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
const init: any = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, c, 'medium', 'breach'); const s: any = init.state;
devSeedTheFirst(s);
console.log('state keys with hex:', Object.keys(s).filter(k => /hex|map/i.test(k)).join(', '));

const hexArr: any[] = init.tiles.filter((t: any) => t.terrain !== 'ocean' && t.terrain !== 'coastal_shallows').map((t: any) => ({ col: t.coord.col, row: t.coord.row, terrain: t.terrain }));
const hexList: any[] = Array.isArray(hexArr) ? hexArr : Object.values(hexArr);
console.log('hex count', hexList.length, 'sample keys', hexList[0] ? Object.keys(hexList[0]).join(',') : '-');

const places = getPlaceNodes(s.graph);
const locs = getLocationNodes(s.graph);
const placeHex = new Map<string, number>();
let placesWithHex = 0;
for (const p of locs) {
  const col = Number(p.properties.hexCol), row = Number(p.properties.hexRow);
  if (!Number.isFinite(col) || !Number.isFinite(row)) continue;
  placesWithHex++;
  const k = `${col}_${row}`; placeHex.set(k, (placeHex.get(k) ?? 0) + 1);
}
console.log(`place nodes ${places.length}, place-tier (getLocationNodes) ${locs.length}, with hexCol/Row ${placesWithHex}, distinct hexes holding a place ${placeHex.size}`);
const perHex = [...placeHex.values()]; perHex.sort((a, b) => a - b);
console.log('places per occupied hex: max', perHex[perHex.length - 1], 'median', perHex[Math.floor(perHex.length / 2)]);

// offset-coord hex distance via cube conversion (odd-q is an assumption; report both)
function cube(col: number, row: number, oddq: boolean) {
  if (oddq) { const x = col; const z = row - (col - (col & 1)) / 2; return [x, -x - z, z]; }
  const x = col - (row - (row & 1)) / 2; const z = row; return [x, -x - z, z];
}
function dist(a: [number, number], b: [number, number], oddq: boolean) {
  const A = cube(a[0], a[1], oddq), B = cube(b[0], b[1], oddq);
  return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2]));
}
const occ = [...placeHex.keys()].map(k => k.split('_').map(Number) as [number, number]);

const hexTemplates = (UNIFIED_ACTION_TEMPLATES as any[]).filter(t => (t.targetCategories ?? []).includes('hex'));
console.log(`hex-category templates ${hexTemplates.length}; with sphereAffinity ${hexTemplates.filter(t => t.sphereAffinity).length}`);
for (const t of hexTemplates.filter(t => t.sphereAffinity)) console.log(`  ${t.id} ${t.sphereAffinity} essence=${t.essenceCost ?? 0} subtypes=${(t.targetSubtypes ?? []).length || 'any'} actors=${JSON.stringify(t.actorAffinities)}`);
const noAff = hexTemplates.filter(t => !t.sphereAffinity && JSON.stringify(t.actorAffinities ?? '').includes('ascendant'));
console.log(`ascendant hex cards with NO sphereAffinity: ${noAff.length}: ${noAff.map(t => t.id).join(', ')}`);

for (const oddq of [true, false]) {
  for (const [label, filt] of [['all hexes', (_h: any) => true], ['seed_life terrain', (h: any) => (hexTemplates.find(t => t.id === 'hex.seed_life')?.targetSubtypes ?? []).includes(h.terrain ?? h.terrainType ?? h.biome)]] as const) {
    const hs = hexList.filter(filt as any);
    const d = hs.map(h => { const p: [number, number] = [Number(h.col ?? h.q), Number(h.row ?? h.r)]; return Math.min(...occ.map(o => dist(p, o, oddq))); });
    const b = (n: number) => d.filter(x => x <= n).length;
    console.log(`${oddq ? 'odd-q' : 'odd-r'} ${label}: n=${hs.length} hold a place ${b(0)} (${(100 * b(0) / Math.max(1, hs.length)).toFixed(0)}%), ≤1 ${b(1)}, ≤2 ${b(2)}, ≤3 ${b(3)}, max ${Math.max(...d)}`);
  }
}
