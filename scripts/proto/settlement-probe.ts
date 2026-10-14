// THR-1923 probe — dump the seed-42 world facts the settlement-economy sketch needs. Throwaway.
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { readResources } from '../../src/engine/resourceEconomy';
import { getResourceClass } from '../../src/data/resource-classes';

const SEED = 42;
const archetype = generateArchetypes(4, SEED)[0];
const preset = MAP_SIZE_PRESETS['medium'];
const { state } = initializeGameState(archetype, 'Probe', createBalancedCosmology(), SEED, preset.cols, preset.rows);
const g = state.graph;
const tiles = (state as unknown as { tiles: { coord: { col: number; row: number }; terrain: string }[] }).tiles;
const terr: Record<string, number> = {};
for (const t of tiles) terr[t.terrain] = (terr[t.terrain] ?? 0) + 1;
const locs = g.getNodesByType('location').filter(n => !n.properties.parentLocationId).map(n => {
  const res = readResources(n.properties);
  return {
    id: n.id, name: n.name, subtype: String(n.properties.locationSubtype ?? '?'),
    col: n.properties.hexCol, row: n.properties.hexRow,
    prosperity: n.properties.prosperity,
    res: Object.fromEntries(Object.entries(res).map(([k, r]) => [k, { q: r.quantity, cat: getResourceClass(k).category, renew: r.renewalRate }])),
    subs: g.getNodesByType('location').filter(s => s.properties.parentLocationId === n.id).map(s => String(s.properties.sublocationTypeId ?? s.properties.locationSubtype ?? '?')),
  };
});
const factions = g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction').map(n => ({
  id: n.id, name: n.name, cls: n.properties.factionClass ?? n.properties.factionType, guild: n.properties.guildType,
  home: n.properties.homeLocationId,
  controls: g.getOutgoingEdges(n.id, 'controls' as never).map(e => e.target),
}));
const lanes = g.getAllEdges().filter(e => e.type === 'trades_with').map(e => [e.source, e.target]);
fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync('.cache/settlement-world.json', JSON.stringify({ cols: preset.cols, rows: preset.rows, tiles: tiles.map(t => [t.coord.col, t.coord.row, t.terrain]), locs, factions, lanes }));
console.log('terrain', JSON.stringify(terr));
const sub: Record<string, number> = {}; for (const l of locs) sub[l.subtype] = (sub[l.subtype] ?? 0) + 1;
console.log('top-tier subtypes', JSON.stringify(sub));
console.log('factions', factions.length, 'with home', factions.filter(f => f.home).length, 'classes', JSON.stringify(factions.reduce((a: Record<string, number>, f) => { const k = String(f.cls); a[k] = (a[k] ?? 0) + 1; return a; }, {})));
const homes = new Map<string, number>(); for (const f of factions) if (f.home) homes.set(String(f.home), (homes.get(String(f.home)) ?? 0) + 1);
console.log('distinct homes', homes.size, 'home subtypes', JSON.stringify([...homes.keys()].map(h => locs.find(l => l.id === h)?.subtype ?? 'sub/' + (g.getNode(h)?.properties.parentLocationId ? 'sublocation' : '?')).reduce((a: Record<string, number>, s) => { a[s] = (a[s] ?? 0) + 1; return a; }, {})));
const settle = locs.filter(l => ['hamlet', 'town', 'city', 'capital'].includes(l.subtype));
console.log('settlement sublocation counts', settle.map(s => `${s.subtype[0]}${s.subs.length}`).join(' '));
const subTypes: Record<string, number> = {}; for (const s of settle) for (const t of s.subs) subTypes[t] = (subTypes[t] ?? 0) + 1;
console.log('sublocation types in settlements', JSON.stringify(subTypes));
console.log('resource ids', JSON.stringify([...new Set(locs.flatMap(l => Object.keys(l.res)))]));
