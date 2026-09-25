// Throwaway reader: how alive is a fresh world. Read-only.
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import type { MapSizePreset } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getGroupKind } from '../../../../src/engine/groupShape';
import { getLocationNodes, isPlaceNode, resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { locationClassOf, placeClassOf } from '../../../../src/data/world-objects';
import type { GameState } from '../../../../src/types/gameState';

type P = Record<string, unknown>;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const a = process.argv.slice(2);
const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const seeds = get('--seeds', '42,99').split(',').map(Number);
const map = get('--map', 'medium') as MapSizePreset;
const ticks = Number(get('--ticks', '150'));
const snaps = get('--snaps', '0,20,150').split(',').map(Number);
const out = get('--out', 'alive.json');

function snapshot(state: GameState) {
  const g = state.graph;
  const nodeTypes: Record<string, number> = {};
  for (const n of g.getAllNodes()) inc(nodeTypes, n.type);
  const edgeTypes: Record<string, number> = {};
  for (const e of g.getAllEdges()) inc(edgeTypes, e.type);

  const locByClass: Record<string, number> = {};
  const locBySubtype: Record<string, number> = {};
  const locs = getLocationNodes(g);
  for (const n of locs) { const st = (n.properties as P).locationSubtype as string; inc(locBySubtype, st ?? '?'); inc(locByClass, locationClassOf(st) ?? `unclassed:${st}`); }
  const placeByClass: Record<string, number> = {};
  const places = g.getNodesByType('location').filter(isPlaceNode);
  for (const n of places) inc(placeByClass, placeClassOf((n.properties as P).sublocationTypeId as string) ?? 'unclassed');

  const actors = g.getNodesByType('actor');
  const indiv = actors.filter(n => (n.properties as P).actorType === 'individual');
  const alive = indiv.filter(n => !(n.properties as P).deceased && (n.properties as P).status !== 'dead');
  const mortalByTier: Record<string, number> = {};
  for (const n of alive) inc(mortalByTier, String((n.properties as P).spotlightTier ?? 'unset'));
  const dead = indiv.length - alive.length;
  const actorTypes: Record<string, number> = {};
  for (const n of actors) inc(actorTypes, String((n.properties as P).actorType));
  const factionBy: Record<string, number> = {};
  for (const n of actors.filter(n => (n.properties as P).actorType === 'faction')) {
    const p = n.properties as P; inc(factionBy, `${p.factionClass ?? '-'}/${p.factionType ?? 'untyped'}${p.lairId || String(n.id).includes('lair') ? '/lair' : ''}`);
  }
  const groupBy: Record<string, number> = {};
  for (const n of actors) { const k = getGroupKind(n); if (k) inc(groupBy, k); }

  // items
  const arts = g.getNodesByType('artifact');
  const itemTemplates = arts.filter(n => (n.properties as P).catalogTemplate).length;
  const possessedTargets = new Set(g.getEdgesByType('possesses').map(e => e.target));
  const itemsHeld = arts.filter(n => possessedTargets.has(n.id)).length;
  // traits
  const traitBySub: Record<string, number> = {};
  for (const n of g.getNodesByType('trait')) inc(traitBySub, String((n.properties as P).subcategory ?? '?'));
  const borneBySub: Record<string, number> = {};
  for (const e of g.getEdgesByType('has_trait')) { const t = g.getNode(e.target); inc(borneBySub, String((t?.properties as P | undefined)?.subcategory ?? '?')); }
  const eventBy: Record<string, number> = {};
  for (const n of g.getNodesByType('event')) inc(eventBy, String((n.properties as P).eventType ?? '?'));
  const pursuesBy: Record<string, number> = {};
  for (const e of g.getEdgesByType('pursues')) { const s = g.getNode(e.source); inc(pursuesBy, `${(s?.properties as P)?.actorType}/${(s?.properties as P)?.spotlightTier ?? '-'}`); }

  // --- alive-ness ---
  const where = new Map<string, string>(); // actor -> outer location id
  for (const e of g.getEdgesByType('located_at')) {
    const t = g.getNode(e.target); const outer = resolveToParentLocation(g, t);
    if (outer) where.set(e.source, outer.id);
  }
  const settlements = locs.filter(n => locationClassOf((n.properties as P).locationSubtype as string) === 'settlement');
  const residents = new Map<string, string[]>();
  for (const n of alive) { const w = where.get(n.id); if (w) { const r = residents.get(w) ?? []; r.push(n.id); residents.set(w, r); } }
  const has = (id: string, t: any, dir: 'out' | 'in' | 'both' = 'both') =>
    (dir !== 'in' && g.getOutgoingEdges(id, t).length > 0) || (dir !== 'out' && g.getIncomingEdges(id, t).length > 0);
  const tierOf = (id: string) => String((g.getNode(id)?.properties as P)?.spotlightTier ?? 'unset');
  const s = { n: settlements.length, withSpotlight: 0, withNotable: 0, withSpotOrNotable: 0, controlled: 0, withFactionMember: 0,
    withAmbition: 0, withQuarrel: 0, withSecretOrFavor: 0, withRelationship: 0, withPossession: 0, withNothingDramatic: 0, residentsTotal: 0, zeroResidents: 0 };
  for (const loc of settlements) {
    const r = residents.get(loc.id) ?? [];
    s.residentsTotal += r.length; if (!r.length) s.zeroResidents++;
    const spot = r.some(id => tierOf(id) === 'spotlight'); const nota = r.some(id => tierOf(id) === 'notable');
    if (spot) s.withSpotlight++; if (nota) s.withNotable++; if (spot || nota) s.withSpotOrNotable++;
    if (g.getIncomingEdges(loc.id, 'controls').length) s.controlled++;
    if (r.some(id => has(id, 'member_of', 'out'))) s.withFactionMember++;
    const amb = r.some(id => has(id, 'pursues', 'out')); if (amb) s.withAmbition++;
    const q = r.some(id => has(id, 'hostile_to')); if (q) s.withQuarrel++;
    const sec = r.some(id => has(id, 'knows_secret_of') || has(id, 'owes_favor')); if (sec) s.withSecretOrFavor++;
    if (r.some(id => g.getAllEdgesForNode(id).some(e => e.type === 'relates_to' && [e.source, e.target].every(x => (g.getNode(x)?.properties as P)?.actorType === 'individual')))) s.withRelationship++;
    if (r.some(id => has(id, 'possesses', 'out'))) s.withPossession++;
    if (!amb && !q && !sec) s.withNothingDramatic++;
  }
  // relationships per spotlight mortal
  const spot = alive.filter(n => (n.properties as P).spotlightTier === 'spotlight');
  const REL = ['relates_to', 'hostile_to', 'member_of', 'mentors', 'knows_secret_of', 'owes_favor', 'possesses', 'owns', 'reputation_with', 'pursues', 'estranged', 'training', 'graduated', 'commanded_by', 'leads', 'accompanies', 'knows_of', 'knows_clue_of', 'participated_in'];
  const perSpot: Record<string, number> = {}; let spotIndivTies = 0; let spotZeroIndivTies = 0;
  for (const n of spot) {
    const es = g.getAllEdgesForNode(n.id);
    for (const t of REL) inc(perSpot, t, es.filter(e => e.type === t).length);
    const ties = es.filter(e => ['relates_to', 'hostile_to', 'mentors', 'estranged', 'knows_secret_of', 'owes_favor'].includes(e.type)
      && (g.getNode(e.source === n.id ? e.target : e.source)?.properties as P)?.actorType === 'individual').length;
    spotIndivTies += ties; if (!ties) spotZeroIndivTies++;
  }
  for (const k of Object.keys(perSpot)) perSpot[k] = +(perSpot[k] / Math.max(1, spot.length)).toFixed(2);
  const indivWithAnyTie = alive.filter(n => g.getAllEdgesForNode(n.id).some(e => ['relates_to', 'hostile_to', 'mentors', 'estranged'].includes(e.type)
    && (g.getNode(e.source === n.id ? e.target : e.source)?.properties as P)?.actorType === 'individual')).length;
  const relatesPairs: Record<string, number> = {};
  for (const e of g.getEdgesByType('relates_to')) inc(relatesPairs, `${(g.getNode(e.source)?.properties as P)?.actorType}->${(g.getNode(e.target)?.properties as P)?.actorType}`);

  // hexes / areas
  const WATER = new Set(['ocean','deep_ocean','tropical_ocean','coastal_shallows','lake','reef']); const land = state.tiles.filter(t => !WATER.has(t.terrain as string));
  const namedHex = new Set<string>();
  for (const n of locs) { const p = n.properties as P; if (p.hexCol != null) namedHex.add(`${p.hexCol},${p.hexRow}`); }
  const tileRegion = new Map<string, string>(); for (const t of state.tiles) if (t.regionId) tileRegion.set(`${t.coord.col},${t.coord.row}`, t.regionId);
  const regions = g.getNodesByType('region');
  const settleByRegion: Record<string, number> = {}; const namedByRegion: Record<string, number> = {};
  for (const n of locs) { const p = n.properties as P; const r = tileRegion.get(`${p.hexCol},${p.hexRow}`); if (!r) continue; inc(namedByRegion, r); if (locationClassOf(p.locationSubtype as string) === 'settlement') inc(settleByRegion, r); }
  const regionKeys = new Set(state.tiles.map(t => t.regionId).filter(Boolean) as string[]);
  const areasNoSettlement = [...regionKeys].filter(r => !settleByRegion[r]).length;
  const areasNoNamed = [...regionKeys].filter(r => !namedByRegion[r]).length;

  // pre-history: property keys hinting history
  const histKeys: Record<string, number> = {};
  for (const n of g.getAllNodes()) for (const k of Object.keys(n.properties ?? {})) if (/found|histor|lore|legend|era|past|origin|backstory|ancien|age$|died|death|memor|chronic/i.test(k)) inc(histKeys, `${n.type}.${k}`);

  const strat = (state as any).strategicState;
  return {
    tick: state.tick, nodeTypes, edgeTypes, locByClass, locBySubtype, placeByClass, mortalByTier, deadMortals: dead, actorTypes, factionBy, groupBy,
    artifacts: arts.length, itemTemplates, itemsHeld, traitBySub, borneBySub, eventBy, pursuesBy,
    settlements: s, spotlightCount: spot.length, perSpot, spotIndivTiesMean: +(spotIndivTies / Math.max(1, spot.length)).toFixed(2), spotZeroIndivTies,
    aliveMortals: alive.length, indivWithAnyTie, relatesPairs,
    tiles: state.tiles.length, landTiles: land.length, namedHexes: namedHex.size, regionNodes: regions.length, tileRegions: regionKeys.size, areasNoSettlement, areasNoNamed,
    histKeys, chronicleEntries: state.chronicleEntries?.length ?? 0, chronicleVolumes: state.chronicle?.volumes?.length ?? 0,
    recentEvents: state.recentEvents?.length ?? 0, echoStates: state.echoStates?.length ?? 0,
    projects: strat?.projects?.length ?? 0, activeCompositions: (state.activeCompositions ?? []).length,
    compositionsByKind: (state.activeCompositions ?? []).reduce((m: Record<string, number>, c: any) => { inc(m, c.sponsorRivalId ? 'rival_scheme' : c.sponsorNotableId ? 'notable_agenda' : 'other'); return m; }, {}),
    emittedOmens: (state.emittedOmens ?? []).length, omenActive: JSON.stringify(state.omenState ?? null).slice(0, 200),
    rivals: state.rivalStates?.length ?? 0, hiddenMarks: (state.hiddenMarks ?? []).length, intelligence: (state.intelligenceRecords ?? []).length,
    prosperityShocks: (state.prosperityShocks ?? []).length, activeDelves: (state.activeDelves ?? []).length,
  };
}

const results: any[] = [];
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  const t0 = Date.now();
  let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const initMs = Date.now() - t0;
  const snapshots: any[] = [];
  if (snaps.includes(0)) snapshots.push(snapshot(state));
  const ev1_20: Record<string, number> = {}; const ev21_150: Record<string, number> = {};
  const evByTick: number[] = [];
  const tickMs: number[] = [];
  const evActors1_20 = new Set<string>();
  for (let i = 1; i <= ticks; i++) {
    const s0 = performance.now();
    state = runTick(state, [], runtime);
    tickMs.push(performance.now() - s0);
    const evs = state.tickEvents ?? [];
    evByTick.push(evs.length);
    for (const e of evs) { inc(i <= 20 ? ev1_20 : ev21_150, e.type); if (i <= 20 && e.actorId) evActors1_20.add(e.actorId); }
    if (snaps.includes(i)) snapshots.push(snapshot(state));
  }
  const avg = (xs: number[]) => xs.length ? +(xs.reduce((x, y) => x + y, 0) / xs.length).toFixed(1) : 0;
  const r = { seed, map, initMs, tickMsAvg1_20: avg(tickMs.slice(0, 20)), tickMsAvg21_150: avg(tickMs.slice(20)), tickMsAvgAll: avg(tickMs),
    events1_20: ev1_20, distinctEventTypes1_20: Object.keys(ev1_20).length, totalEvents1_20: evByTick.slice(0, 20).reduce((x, y) => x + y, 0),
    events21_150: ev21_150, evByTickFirst20: evByTick.slice(0, 20), distinctActorsInEvents1_20: evActors1_20.size, snapshots };
  results.push(r);
  console.log(JSON.stringify({ seed, map, initMs, tickMsAvg1_20: r.tickMsAvg1_20, tickMsAvg21_150: r.tickMsAvg21_150, distinct: r.distinctEventTypes1_20, total: r.totalEvents1_20 }));
}
writeFileSync(out, JSON.stringify(results, null, 2));
console.log('wrote', out);
