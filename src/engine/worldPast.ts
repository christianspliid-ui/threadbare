/**
 * worldPast — a thin past, derived from what worldgen already placed (THR-1631 S1).
 *
 * A new world has two to four dead empires and about a hundred of their ruins, and until
 * this pass it said nothing about any of them. `seedWorldPast` writes the past those
 * ruins imply, and nothing it cannot back with a fact already on the map:
 *
 *  - **S1b** one elder war, between the two empires that left the most battlefields;
 *  - **S1c** a founding age on every settlement, and a named dead founder for each Realm seat;
 *  - **S1d** two or three wars in living memory between neighbouring Realms, each with a
 *    burned town (a plain ruin) and a fallen commander;
 *  - **S1e** descent from a dead empire on about a quarter of the mortals on its old land;
 *  - **S1f** the dead — founders, fallen commanders and wonder finders — capped at ten;
 *  - **S1g** `readWorldPast` / `getPlacePast`, the pure readers;
 *  - **S3** (THR-1657) `worldPastAmbitions.mintPastAmbitions`, injected and run at the
 *    tail: a fallen commander's kin wants revenge on the winning Realm's leader, and a
 *    hero near a wonder chases its legend. Drawless, deciders only, no spotlight pull.
 *
 * **Everything is graph** (plan Lane decision 1): event nodes, deceased actors in the
 * run-time `retain` shape (`markMortalDead`), existing edge types, and two properties.
 * The past never enters `chronicleEntries`, which cycle end empties.
 *
 * **Determinism (NFP #3).** The pass owns `mulberry32(seed + WORLDGEN_PAST_PRIME)` and runs
 * after every other worldgen draw, so no existing node moves. Draw order is fixed:
 *   1. elder war age, then its name;
 *   2. founding ages (settlements sorted by id);
 *   3. war count, then war pairs (sorted candidates, drawn without replacement);
 *   4. war ages; 5. losers;
 *   6. names — commanders, then founders;
 *   7. descent (every individual sorted by id — the draw is consumed even when it cannot apply);
 *   8. wonder finders' names.
 * Every candidate list is sorted by id before a draw. `Math.random()` is never used.
 *
 * **Fail-soft (NFP #4).** `gameInit` wraps the call; inside, every miss is recorded in the
 * summary by id rather than thrown.
 *
 * Plan: `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md`.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { HexTile } from '../types';
import { mulberry32 } from '../lib/prng';
import { hexDistance } from '../lib/hexMath';
import { hexKey } from '../lib/hexKey';
import { getLocationNodes, resolveToParentLocation } from './sublocationShape';
import { locationClassOf } from '../data/world-objects';
import { REALM_FACTION_CLASS } from '../data/realm-content';
import { pickCulturalName } from '../data/culture-name-pools';
import { TICKS_PER_SEASON, SEASONS_PER_YEAR } from '../types/temporal';
import { emitTrace } from './traceBuffer';
import {
  WORLD_PAST_DEFAULTS,
  WORLDGEN_PAST_PRIME,
  WORLD_PAST_ELDER_WAR_NAMES,
  type WorldPastConstants,
  type FoundingClass,
  type YearRange,
} from '../data/world-past-constants';
import {
  WORLD_PAST_ORIGIN,
  type ElderRuinArchetype,
  type PlacePast,
  type WorldPastDescentStratum,
  type WorldPastRole,
  type WorldPastSeededSummary,
  type WorldPastView,
  type WorldPastLivingWar,
  type WorldPastKnowledge,
  type WorldPastPlayerView,
  type WorldPastAmbitionsSummary,
} from '../types/worldPast';

/** A year, in ticks (90 × 4 = 360). Past ticks are negative: `-yearsAgo × TICKS_PER_YEAR`. */
export const TICKS_PER_YEAR = TICKS_PER_SEASON * SEASONS_PER_YEAR;

/** Neutral raw-scale capabilities for the dead — they never roll, but readers expect the bag. */
const DEAD_CAPABILITY_RAW = 10;
const REACHES = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'] as const;

type P = Record<string, unknown>;

const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function hexOf(node: GraphNode | undefined): { col: number; row: number } | undefined {
  const p = node?.properties as P | undefined;
  if (!p || typeof p.hexCol !== 'number' || typeof p.hexRow !== 'number') return undefined;
  return { col: p.hexCol, row: p.hexRow };
}

function drawInt(rng: () => number, [lo, hi]: YearRange): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function foundingClassOf(subtype: string | undefined): FoundingClass | undefined {
  if (!subtype) return undefined;
  const cls = locationClassOf(subtype);
  if (cls === 'ruin') return subtype === 'elder_ruin' ? undefined : 'ruins';
  if (cls !== 'settlement') return undefined;
  return subtype as FoundingClass;
}

function isRealm(node: GraphNode | undefined): boolean {
  const p = node?.properties as P | undefined;
  return p?.actorType === 'faction' && p.factionClass === REALM_FACTION_CLASS;
}

/** The Locations a faction holds through `controls` (faction → location). */
function heldLocationIds(graph: WorldGraph, factionId: string): string[] {
  return graph.getOutgoingEdges(factionId, 'controls')
    .filter(e => graph.getNode(e.target)?.type === 'location')
    .map(e => e.target)
    .sort();
}

/** A Realm's seat: the `role: 'seat'` hold, else a held capital, else the held Location nearest its seat hex. */
function realmSeatId(graph: WorldGraph, realm: GraphNode): string | undefined {
  const holds = graph.getOutgoingEdges(realm.id, 'controls').filter(e => graph.getNode(e.target)?.type === 'location');
  const seat = holds.filter(e => e.properties?.role === 'seat').map(e => e.target).sort()[0];
  if (seat) return seat;
  const ids = holds.map(e => e.target).sort();
  const capital = ids.find(id => graph.getNode(id)?.properties.locationSubtype === 'capital');
  if (capital) return capital;
  const p = realm.properties as P;
  if (typeof p.seatHexCol === 'number' && typeof p.seatHexRow === 'number') {
    const at = { col: p.seatHexCol, row: p.seatHexRow };
    let best: string | undefined;
    let bestD = Infinity;
    for (const id of ids) {
      const h = hexOf(graph.getNode(id));
      if (!h) continue;
      const d = hexDistance(at, h);
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }
  return ids[0];
}

/** The current-layer culture a Location belongs to, if any. */
function locationCultureId(graph: WorldGraph, locationId: string): string | undefined {
  return graph.getOutgoingEdges(locationId, 'belongs_to')
    .filter(e => (e.properties as P | undefined)?.cultureLayer === 'current'
      && (graph.getNode(e.target)?.properties as P | undefined)?.actorType === 'culture')
    .map(e => e.target)
    .sort()[0];
}

/**
 * Realm pairs whose held settlements come within `maxHexes` of each other, sorted by id.
 * A pair is `[a, b]` with `a < b`.
 */
export function realmNeighbourPairs(graph: WorldGraph, maxHexes: number = WORLD_PAST_DEFAULTS.warMaxHexes): Array<[string, string]> {
  const realms = graph.getNodesByType('actor').filter(isRealm).sort(byId);
  const hexesOf = new Map<string, Array<{ col: number; row: number }>>();
  for (const r of realms) {
    const hs: Array<{ col: number; row: number }> = [];
    for (const id of heldLocationIds(graph, r.id)) {
      const h = hexOf(graph.getNode(id));
      if (h) hs.push(h);
    }
    hexesOf.set(r.id, hs);
  }
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < realms.length; i++) {
    for (let j = i + 1; j < realms.length; j++) {
      const a = hexesOf.get(realms[i].id) ?? [];
      const b = hexesOf.get(realms[j].id) ?? [];
      if (a.some(x => b.some(y => hexDistance(x, y) <= maxHexes))) pairs.push([realms[i].id, realms[j].id]);
    }
  }
  return pairs;
}

function seatMidpoint(
  a: { col: number; row: number } | undefined,
  b: { col: number; row: number } | undefined,
): { col: number; row: number } | undefined {
  if (!a || !b) return undefined;
  return { col: Math.floor((a.col + b.col) / 2), row: Math.floor((a.row + b.row) / 2) };
}

// ─── The pass ─────────────────────────────────────────────────────────────

export interface SeedWorldPastOptions {
  /** Worldgen tiles, for a mortal's home region (descent). Without them no descent is written. */
  tiles?: readonly HexTile[];
  constants?: Partial<WorldPastConstants>;
  /**
   * S3 (THR-1657): `worldPastAmbitions.mintPastAmbitions`, injected by `gameInit` so this
   * module stays free of the ambition, grievance and faction imports (it is read low in the
   * import graph, and those close a cycle). Absent → the past mints no ambitions.
   */
  mintAmbitions?: (graph: WorldGraph, view: WorldPastView, constants: WorldPastConstants) => WorldPastAmbitionsSummary;
}

/**
 * Write the past onto the graph. Called once from `initializeGameState`, after latent
 * sources and before `loc.start`. Returns the summary it also emits as the
 * `world_past_seeded` trace, or `null` when the pass is disabled.
 */
export function seedWorldPast(
  graph: WorldGraph,
  seed: number,
  options: SeedWorldPastOptions = {},
): WorldPastSeededSummary | null {
  const c: WorldPastConstants = { ...WORLD_PAST_DEFAULTS, ...(options.constants ?? {}) };
  if (!c.enabled) return null;
  const started = Date.now();
  const rng = mulberry32(seed + WORLDGEN_PAST_PRIME);
  const usedNames = new Set<string>(
    graph.getNodesByType('actor').map(n => n.name).filter((n): n is string => typeof n === 'string'),
  );
  const summary: WorldPastSeededSummary = {
    events: { elderWar: 0, livingWars: 0 },
    foundedSettlements: 0,
    dead: { founder: 0, fallen_commander: 0, wonder_finder: 0 },
    descent: { mortals: 0, candidates: 0, byCulture: {} },
    misses: { warsWithoutBurnedTown: [], realmPairsAvailable: 0 },
    durationMs: 0,
  };
  let eventsWritten = 0;
  let deadWritten = 0;

  const locations = getLocationNodes(graph).slice().sort(byId);
  const elderRuins = locations.filter(n => n.properties.locationSubtype === 'elder_ruin');

  // ── S1b: the elder war ──────────────────────────────────────────────────
  const battlefieldsBy = new Map<string, string[]>();
  for (const ruin of elderRuins) {
    const p = ruin.properties as P;
    if (p.archetype !== 'battlefield' || typeof p.originCultureId !== 'string') continue;
    const list = battlefieldsBy.get(p.originCultureId) ?? [];
    list.push(ruin.id);
    battlefieldsBy.set(p.originCultureId, list);
  }
  const rankedEmpires = [...battlefieldsBy.entries()]
    .filter(([id]) => !!graph.getNode(id))
    .sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  // Always consume the age and name draws, so a world without an elder war keeps the
  // same stream as one with (a later empire-seeding change must not shift foundings).
  const elderYears = drawInt(rng, c.elderAgeYears);
  const elderName = WORLD_PAST_ELDER_WAR_NAMES[Math.floor(rng() * WORLD_PAST_ELDER_WAR_NAMES.length)];
  let elderWarYears: number | undefined;
  if (rankedEmpires.length >= 2 && eventsWritten < c.eventsMax) {
    const [a, b] = [rankedEmpires[0][0], rankedEmpires[1][0]].sort();
    const eventId = 'event.past.elder_war';
    graph.addNode({
      id: eventId,
      type: 'event',
      name: elderName,
      properties: {
        eventType: 'past_elder_war',
        pastYearsAgo: elderYears,
        tick: -elderYears * TICKS_PER_YEAR,
        pastName: elderName,
        pastOrigin: WORLD_PAST_ORIGIN,
      },
    });
    for (const empireId of [a, b]) {
      graph.addEdge({ id: `e_past_participated_${empireId}_${eventId}`, source: empireId, target: eventId, type: 'participated_in', properties: {} });
    }
    const sites = [...(battlefieldsBy.get(a) ?? []), ...(battlefieldsBy.get(b) ?? [])].sort();
    for (const siteId of sites) {
      graph.addEdge({ id: `e_past_occurred_${eventId}_${siteId}`, source: eventId, target: siteId, type: 'occurred_at', properties: {} });
    }
    eventsWritten++;
    summary.events.elderWar = 1;
    elderWarYears = elderYears;
  } else {
    summary.misses.elderWar = 'fewer_than_two_empires_with_battlefields';
  }

  // ── S1c: founding ages ──────────────────────────────────────────────────
  // Founding never reaches back to the elder war: the settlements stand on its aftermath.
  const foundingCap = (elderWarYears ?? c.elderAgeYears[0]) - 1;
  const founded = new Map<string, number>();
  for (const loc of locations) {
    const cls = foundingClassOf(loc.properties.locationSubtype as string | undefined);
    if (!cls) continue;
    const years = Math.min(foundingCap, drawInt(rng, c.foundingYears[cls]));
    founded.set(loc.id, years);
  }

  // Realms and their seats. A seat is the oldest place its Realm holds.
  const realms = graph.getNodesByType('actor').filter(isRealm).sort(byId);
  const seatOf = new Map<string, string>();
  for (const realm of realms) {
    const seatId = realmSeatId(graph, realm);
    if (!seatId) continue;
    seatOf.set(realm.id, seatId);
    const oldest = Math.max(0, ...heldLocationIds(graph, realm.id).map(id => founded.get(id) ?? 0));
    if (founded.has(seatId) && (founded.get(seatId) ?? 0) < oldest) founded.set(seatId, oldest);
    if (!founded.has(seatId)) founded.set(seatId, Math.min(foundingCap, Math.max(oldest, drawInt(rng, c.foundingYears.capital))));
  }

  // ── S1d: wars in living memory ──────────────────────────────────────────
  const pairs = realmNeighbourPairs(graph, c.warMaxHexes);
  summary.misses.realmPairsAvailable = pairs.length;
  const wantWars = c.livingWars.min + Math.floor(rng() * (c.livingWars.max - c.livingWars.min + 1));
  const warCount = Math.max(0, Math.min(wantWars, pairs.length, c.eventsMax - eventsWritten));
  const pool = pairs.slice();
  const chosen: Array<[string, string]> = [];
  for (let i = 0; i < warCount; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  chosen.sort((x, y) => (x.join('|') < y.join('|') ? -1 : 1));
  const warYears = chosen.map(() => drawInt(rng, c.livingMemoryYears));
  const losers = chosen.map(pair => (rng() < 0.5 ? pair[0] : pair[1]));

  const plainRuins = locations
    .filter(n => foundingClassOf(n.properties.locationSubtype as string | undefined) === 'ruins');
  const usedRuins = new Set<string>();
  interface PlannedWar { eventId: string; pair: [string, string]; years: number; loserId: string; winnerId: string; burnedTownId?: string }
  const wars: PlannedWar[] = [];
  chosen.forEach((pair, i) => {
    const eventId = `event.past.war.${i}`;
    const loserId = losers[i];
    const winnerId = pair[0] === loserId ? pair[1] : pair[0];
    // The seats' midpoint (plan § S1d). A world whose plain ruins all lie far from it
    // (seed 42: 12+ hexes from every one, and 14+ from every front) writes the war
    // without a burned town and says so in `misses` — the fail-soft the plan names.
    const mid = seatMidpoint(hexOf(graph.getNode(seatOf.get(pair[0]) ?? '')), hexOf(graph.getNode(seatOf.get(pair[1]) ?? '')));
    let burnedTownId: string | undefined;
    if (mid) {
      let bestD = Infinity;
      for (const ruin of plainRuins) {
        if (usedRuins.has(ruin.id)) continue;
        const h = hexOf(ruin);
        if (!h) continue;
        const d = hexDistance(mid, h);
        if (d <= c.burnedTownMaxHexes && d < bestD) { bestD = d; burnedTownId = ruin.id; }
      }
    }
    if (burnedTownId) {
      usedRuins.add(burnedTownId);
      // A town that burned was standing before the war that burned it.
      const f = founded.get(burnedTownId) ?? 0;
      if (f <= warYears[i]) founded.set(burnedTownId, Math.min(foundingCap, warYears[i] + Math.max(1, f)));
    } else {
      summary.misses.warsWithoutBurnedTown.push(eventId);
    }
    wars.push({ eventId, pair, years: warYears[i], loserId, winnerId, burnedTownId });
  });

  // Write founding ages (after the burned-town raise, so every value is final).
  for (const [locId, years] of founded) {
    const node = graph.getNode(locId);
    if (!node) continue;
    node.properties.foundedYearsAgo = years;
    summary.foundedSettlements++;
  }

  for (const war of wars) {
    graph.addNode({
      id: war.eventId,
      type: 'event',
      name: `${graph.getNode(war.pair[0])?.name ?? war.pair[0]} and ${graph.getNode(war.pair[1])?.name ?? war.pair[1]} at war`,
      properties: {
        eventType: 'past_war',
        pastYearsAgo: war.years,
        tick: -war.years * TICKS_PER_YEAR,
        pastOrigin: WORLD_PAST_ORIGIN,
      },
    });
    for (const realmId of war.pair) {
      graph.addEdge({
        id: `e_past_participated_${realmId}_${war.eventId}`,
        source: realmId, target: war.eventId, type: 'participated_in',
        properties: { role: realmId === war.winnerId ? 'winner' : 'loser' },
      });
    }
    if (war.burnedTownId) {
      graph.addEdge({ id: `e_past_occurred_${war.eventId}_${war.burnedTownId}`, source: war.eventId, target: war.burnedTownId, type: 'occurred_at', properties: {} });
    }
    eventsWritten++;
    summary.events.livingWars++;
  }

  // ── S1f (part 1): names, in the fixed order commanders → founders ─────────
  const cultureName = (cultureId: string | undefined): string => {
    const culture = cultureId ? graph.getNode(cultureId) : undefined;
    const p = (culture?.properties ?? {}) as P;
    const identity = p.cultureIdentity as { foundationBias?: string; veneratedSpheres?: string[] } | undefined;
    const signature = p.culturePhoneticSignature as Parameters<typeof pickCulturalName>[4];
    return pickCulturalName(identity?.foundationBias ?? '', identity?.veneratedSpheres?.[0] ?? '', rng, usedNames, signature, cultureId, 0);
  };

  const addDead = (
    role: WorldPastRole,
    index: number,
    name: string,
    cultureId: string | undefined,
    restsAtId: string,
    yearsAgo: number,
    cause: 'battle' | 'lifecycle',
  ): string => {
    const id = `actor.past.${role}.${index}`;
    const domainCapabilities: Record<string, number> = {};
    for (const r of REACHES) domainCapabilities[r] = DEAD_CAPABILITY_RAW;
    graph.addNode({
      id,
      type: 'actor',
      name,
      properties: {
        actorType: 'individual',
        // Explicit: an unset tier reads as 'spotlight' downstream. The dead never decide.
        spotlightTier: 'ambient',
        domainCapabilities,
        locationId: restsAtId,
        // The run-time `retain` death shape (`markMortalDead`), nothing else.
        deceased: true,
        deceasedTick: -yearsAgo * TICKS_PER_YEAR,
        deathCause: cause,
        pastRole: role,
        pastOrigin: WORLD_PAST_ORIGIN,
        pastYearsAgo: yearsAgo,
      },
    });
    graph.addEdge({ id: `e_located_at_${id}`, source: id, target: restsAtId, type: 'located_at', properties: {} });
    if (cultureId && graph.getNode(cultureId)) {
      graph.addEdge({ id: `e_past_culture_${id}`, source: id, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 1.0, cultureLayer: 'current' } });
    }
    deadWritten++;
    summary.dead[role]++;
    return id;
  };

  wars.forEach((war, i) => {
    if (deadWritten >= c.deadMax) return;
    const loser = graph.getNode(war.loserId);
    const cultureId = (loser?.properties as P | undefined)?.cultureId as string | undefined;
    const restsAt = war.burnedTownId ?? seatOf.get(war.loserId);
    if (!restsAt) return;
    // A commander dies in the war's year, give or take nothing: they fell there.
    const id = addDead('fallen_commander', i, cultureName(cultureId), cultureId, restsAt, war.years, 'battle');
    graph.addEdge({
      id: `e_past_member_${id}`, source: id, target: war.loserId, type: 'member_of',
      properties: { role: 'commander', rank: c.commanderRank, factionDefId: (loser?.properties as P | undefined)?.factionDefId, joinedTick: -war.years * TICKS_PER_YEAR },
    });
    graph.addEdge({ id: `e_past_participated_${id}_${war.eventId}`, source: id, target: war.eventId, type: 'participated_in', properties: { role: 'fallen' } });
  });

  realms.forEach((realm, i) => {
    if (deadWritten >= c.deadMax) return;
    const seatId = seatOf.get(realm.id);
    if (!seatId) return;
    const cultureId = (realm.properties as P).cultureId as string | undefined;
    const years = founded.get(seatId) ?? c.foundingYears.capital[0];
    const id = addDead('founder', i, cultureName(cultureId), cultureId, seatId, years, 'lifecycle');
    // The edge worldgen already writes from a settlement to its builder. No `tick`:
    // the Builder's Legacy mandate counts only edges stamped since it began (THR-1618).
    graph.addEdge({ id: `e_past_founded_${seatId}`, source: seatId, target: id, type: 'constructed_by', properties: { structureType: 'founding' } });
  });

  // ── S1e: descent ────────────────────────────────────────────────────────
  if (options.tiles && options.tiles.length > 0) {
    const regionAt = new Map<string, string>();
    for (const t of options.tiles) if (t.regionId) regionAt.set(`${t.coord.col},${t.coord.row}`, t.regionId);
    const empireOfRegion = new Map<string, string | undefined>();
    const empireOf = (regionId: string): string | undefined => {
      if (empireOfRegion.has(regionId)) return empireOfRegion.get(regionId);
      const hit = graph.getOutgoingEdges(regionId, 'belongs_to')
        .filter(e => (e.properties as P | undefined)?.cultureLayer === 'historical')
        .map(e => e.target).sort()[0];
      empireOfRegion.set(regionId, hit);
      return hit;
    };
    const mortals = graph.getNodesByType('actor')
      .filter(n => (n.properties as P).actorType === 'individual' && (n.properties as P).deceased !== true)
      .sort(byId);
    for (const mortal of mortals) {
      // Consumed for every mortal, so a later fix to home resolution does not shift the stream.
      const roll = rng();
      const home = homeHex(graph, mortal);
      const regionId = home ? regionAt.get(`${home.col},${home.row}`) : undefined;
      const empireId = regionId ? empireOf(regionId) : undefined;
      if (!empireId) continue;
      summary.descent.candidates++;
      if (roll >= c.descentShare) continue;
      const stratum: WorldPastDescentStratum = { cultureId: empireId, relation: 'descent' };
      const existing = Array.isArray(mortal.properties.backstoryStrata) ? mortal.properties.backstoryStrata as unknown[] : [];
      mortal.properties.backstoryStrata = [...existing, stratum];
      if (mortal.properties.originCultureId == null) mortal.properties.originCultureId = empireId;
      summary.descent.mortals++;
      summary.descent.byCulture[empireId] = (summary.descent.byCulture[empireId] ?? 0) + 1;
    }
  }

  // ── S1f (part 2): wonder finders ─────────────────────────────────────────
  const wonders = locations.filter(n => locationClassOf(n.properties.locationSubtype as string | undefined) === 'wonder');
  const held = (id: string) => graph.getIncomingEdges(id, 'controls').some(e => isRealm(graph.getNode(e.source)));
  const wonderOrder = [...wonders.filter(w => held(w.id)), ...wonders.filter(w => !held(w.id))];
  const cultured = locations.filter(n => !!locationCultureId(graph, n.id));
  let finderIndex = 0;
  for (const wonder of wonderOrder) {
    if (finderIndex >= c.wonderFindersMax || deadWritten >= c.deadMax) break;
    let cultureId = locationCultureId(graph, wonder.id);
    if (!cultureId) {
      const at = hexOf(wonder);
      let bestD = Infinity;
      for (const loc of cultured) {
        const h = hexOf(loc);
        if (!at || !h) continue;
        const d = hexDistance(at, h);
        if (d < bestD) { bestD = d; cultureId = locationCultureId(graph, loc.id); }
      }
    }
    const years = Math.min(foundingCap, founded.get(wonder.id) ?? drawInt(rng, c.foundingYears.town));
    addDead('wonder_finder', finderIndex, cultureName(cultureId), cultureId, wonder.id, years, 'lifecycle');
    finderIndex++;
  }

  // ── S3: the past feeds ambitions (THR-1657) ───────────────────────────────
  // Last, and drawless: it reads what the pass just wrote and consumes nothing from the
  // stream, so every S1 write above is byte-identical with or without it.
  if (options.mintAmbitions) summary.ambitions = options.mintAmbitions(graph, readWorldPast(graph), c);

  summary.durationMs = Date.now() - started;
  emitTrace({
    category: 'world_past_seeded',
    tick: 0,
    summary: formatWorldPastSummary(summary),
    events: summary.events,
    foundedSettlements: summary.foundedSettlements,
    dead: summary.dead,
    descent: summary.descent,
    misses: summary.misses,
    ambitions: summary.ambitions,
    durationMs: summary.durationMs,
  });
  return summary;
}

/** A mortal's home hex: its `locationId`, else its `located_at`, resolved to the Location tier. */
export function homeHex(graph: WorldGraph, mortal: GraphNode): { col: number; row: number } | undefined {
  const locId = typeof mortal.properties.locationId === 'string'
    ? mortal.properties.locationId as string
    : graph.getOutgoingEdges(mortal.id, 'located_at')[0]?.target;
  if (!locId) return undefined;
  const loc = graph.getNode(locId);
  return hexOf(loc) ?? hexOf(resolveToParentLocation(graph, loc));
}

/** One line for the worldgen console and the trace summary. */
export function formatWorldPastSummary(s: WorldPastSeededSummary): string {
  return `[worldgen] past: elder war ${s.events.elderWar}, living wars ${s.events.livingWars}, `
    + `founded ${s.foundedSettlements}, dead ${s.dead.fallen_commander}+${s.dead.founder}+${s.dead.wonder_finder}, `
    + `descent ${s.descent.mortals}/${s.descent.candidates}`
    + (s.misses.elderWar ? `, no elder war (${s.misses.elderWar})` : '')
    + (s.misses.warsWithoutBurnedTown.length ? `, ${s.misses.warsWithoutBurnedTown.length} war(s) without a burned town` : '')
    + (s.ambitions ? `, ambitions ${s.ambitions.minted.length} minted / ${s.ambitions.skipped.length} skipped` : '')
    + ` (${s.durationMs} ms)`;
}

// ─── S1g: the readers ─────────────────────────────────────────────────────

function pastEvents(graph: WorldGraph, eventType: string): GraphNode[] {
  return graph.getNodesByType('event')
    .filter(n => n.properties.eventType === eventType && n.properties.pastOrigin === WORLD_PAST_ORIGIN)
    .sort(byId);
}

function seededDead(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('actor')
    .filter(n => n.properties.pastOrigin === WORLD_PAST_ORIGIN && n.properties.deceased === true)
    .sort(byId);
}

/**
 * Everything the pass wrote, read back from the graph, unfogged. Pure: reads edges and
 * properties only, and drops any clause whose node has since gone (NFP #4).
 */
export function readWorldPast(graph: WorldGraph): WorldPastView {
  const empires = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'culture' && n.properties.cultureEra === 'historical')
    .sort(byId)
    .map(n => ({ cultureId: n.id, ruinCounts: { temple: 0, vault: 0, battlefield: 0 } as Record<ElderRuinArchetype, number> }));
  const empireById = new Map(empires.map(e => [e.cultureId, e]));
  for (const loc of getLocationNodes(graph)) {
    const p = loc.properties as P;
    if (p.locationSubtype !== 'elder_ruin' || typeof p.originCultureId !== 'string') continue;
    const e = empireById.get(p.originCultureId);
    const kind = p.archetype as ElderRuinArchetype;
    if (e && kind in e.ruinCounts) e.ruinCounts[kind]++;
  }

  const view: WorldPastView = { elderAge: { empires }, settling: [], livingMemory: [], wonders: [] };

  const elder = pastEvents(graph, 'past_elder_war')[0];
  if (elder) {
    const empireIds = graph.getIncomingEdges(elder.id, 'participated_in').map(e => e.source).filter(id => !!graph.getNode(id)).sort();
    if (empireIds.length === 2) {
      view.elderAge.war = {
        eventId: elder.id,
        empireIds: [empireIds[0], empireIds[1]],
        siteIds: graph.getOutgoingEdges(elder.id, 'occurred_at').map(e => e.target).filter(id => !!graph.getNode(id)).sort(),
        yearsAgo: elder.properties.pastYearsAgo as number,
        pastName: elder.properties.pastName as string | undefined,
      };
    }
  }

  const dead = seededDead(graph);
  const founderOf = new Map<string, string>();
  for (const loc of getLocationNodes(graph)) {
    const f = graph.getOutgoingEdges(loc.id, 'constructed_by')
      .find(e => e.properties?.structureType === 'founding' && graph.getNode(e.target)?.properties.pastRole === 'founder');
    if (f) founderOf.set(loc.id, f.target);
  }
  view.settling = getLocationNodes(graph)
    .filter(n => typeof n.properties.foundedYearsAgo === 'number')
    .map(n => ({ settlementId: n.id, yearsAgo: n.properties.foundedYearsAgo as number, ...(founderOf.has(n.id) ? { founderId: founderOf.get(n.id) } : {}) }))
    .sort((a, b) => (a.founderId ? 0 : 1) - (b.founderId ? 0 : 1) || b.yearsAgo - a.yearsAgo || (a.settlementId < b.settlementId ? -1 : 1));

  for (const ev of pastEvents(graph, 'past_war')) {
    const sides = graph.getIncomingEdges(ev.id, 'participated_in').filter(e => isRealm(graph.getNode(e.source)));
    const winner = sides.find(e => e.properties?.role === 'winner')?.source;
    const loser = sides.find(e => e.properties?.role === 'loser')?.source;
    if (!winner || !loser) continue;
    const realmIds = [winner, loser].sort() as [string, string];
    const burned = graph.getOutgoingEdges(ev.id, 'occurred_at').map(e => e.target).find(id => !!graph.getNode(id));
    const war: WorldPastLivingWar = {
      eventId: ev.id,
      realmIds,
      winnerId: winner,
      loserId: loser,
      ...(burned ? { burnedTownId: burned } : {}),
      fallenIds: graph.getIncomingEdges(ev.id, 'participated_in')
        .filter(e => graph.getNode(e.source)?.properties.pastRole === 'fallen_commander')
        .map(e => e.source).sort(),
      yearsAgo: ev.properties.pastYearsAgo as number,
    };
    view.livingMemory.push(war);
  }

  const finderAt = new Map<string, string>();
  for (const d of dead) {
    if (d.properties.pastRole !== 'wonder_finder') continue;
    const at = graph.getOutgoingEdges(d.id, 'located_at')[0]?.target;
    if (at && !finderAt.has(at)) finderAt.set(at, d.id);
  }
  view.wonders = getLocationNodes(graph)
    .filter(n => locationClassOf(n.properties.locationSubtype as string | undefined) === 'wonder')
    .sort(byId)
    .map(w => {
      const holder = graph.getIncomingEdges(w.id, 'controls')
        .filter(e => graph.getNode(e.source)?.properties.actorType === 'faction').map(e => e.source).sort()[0];
      return { wonderId: w.id, ...(finderAt.has(w.id) ? { finderId: finderAt.get(w.id) } : {}), ...(holder ? { holderId: holder } : {}) };
    });

  return view;
}

/**
 * One place's past — the hook the S2 page line and ruin content read, never re-derive.
 * `fellInEventId` is set only where the graph backs it (an `occurred_at` from a past
 * event), so no line can claim a fall the engine does not hold.
 */
export function getPlacePast(graph: WorldGraph, locationId: string): PlacePast | null {
  const loc = graph.getNode(locationId);
  if (!loc || loc.type !== 'location') return null;
  const p = loc.properties as P;
  const fellIn = graph.getIncomingEdges(locationId, 'occurred_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => !!n && n.properties.pastOrigin === WORLD_PAST_ORIGIN)
    .map(n => n.id).sort()[0];
  const founder = graph.getOutgoingEdges(locationId, 'constructed_by')
    .find(e => e.properties?.structureType === 'founding')?.target;
  const restingIds = graph.getIncomingEdges(locationId, 'located_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => !!n && n.properties.pastOrigin === WORLD_PAST_ORIGIN && n.properties.deceased === true)
    .map(n => n.id).sort();
  const archetype = p.locationSubtype === 'elder_ruin' ? p.archetype as ElderRuinArchetype | undefined : undefined;
  const empireId = p.locationSubtype === 'elder_ruin' && typeof p.originCultureId === 'string' ? p.originCultureId : undefined;
  const record: PlacePast = {
    locationId,
    ...(typeof p.foundedYearsAgo === 'number' ? { foundedYearsAgo: p.foundedYearsAgo } : {}),
    ...(founder && graph.getNode(founder) ? { founderId: founder } : {}),
    ...(empireId ? { empireId } : {}),
    ...(archetype ? { archetype } : {}),
    ...(fellIn ? { fellInEventId: fellIn } : {}),
    restingIds,
  };
  const hasAnything = record.foundedYearsAgo != null || record.empireId || record.fellInEventId || record.restingIds.length > 0;
  return hasAnything ? record : null;
}

// ─── S2: the player's view (THR-1656) ─────────────────────────────────────

/** The hex a place sits on — its own, or its parent Location's for the inner tier. */
function placeHex(graph: WorldGraph, locationId: string): { col: number; row: number } | undefined {
  const node = graph.getNode(locationId);
  return hexOf(node) ?? hexOf(resolveToParentLocation(graph, node));
}

/**
 * Whether the player's fog knows a place (plan § S2b, Lane decision 4): its hex is
 * `visible` or `remembered`, or its ruins layer has been revealed by a Find or Perceive.
 * No `visibility` means fog is off. A place with no hex is never known — fail closed, so a
 * specific cannot leak through a broken position.
 */
export function isPastPlaceKnown(graph: WorldGraph, locationId: string | undefined, knowledge: WorldPastKnowledge): boolean {
  if (!locationId) return false;
  if (!knowledge.visibility) return true;
  const hex = placeHex(graph, locationId);
  if (!hex) return false;
  const key = hexKey(hex.col, hex.row);
  const state = knowledge.visibility.get(key)?.state;
  if (state === 'visible' || state === 'remembered') return true;
  return knowledge.hexRevelation?.[key]?.ruins === true;
}

/**
 * `readWorldPast`, fog-gated for the player (THR-1656). Pure. The outline is always
 * present; every specific — which ruin fell in the elder war, which town burned, where a
 * commander or a wonder finder lies — carries a `known` flag the surfaces word by.
 */
export function readWorldPastForPlayer(graph: WorldGraph, knowledge: WorldPastKnowledge): WorldPastPlayerView {
  const view = readWorldPast(graph);
  const known = (id: string | undefined) => isPastPlaceKnown(graph, id, knowledge);
  const restingAt = (actorId: string) => graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  return {
    elderAge: {
      empires: view.elderAge.empires,
      ...(view.elderAge.war
        ? { war: { ...view.elderAge.war, knownSiteIds: view.elderAge.war.siteIds.filter(known) } }
        : {}),
    },
    settling: view.settling,
    livingMemory: view.livingMemory.map(w => ({
      ...w,
      burnedTownKnown: known(w.burnedTownId),
      fallen: w.fallenIds.map(id => {
        const at = restingAt(id);
        return { id, ...(at ? { restingAtId: at } : {}), known: known(at) };
      }),
    })),
    wonders: view.wonders.map(w => ({ ...w, known: known(w.wonderId) })),
  };
}

/** True for a dead actor the past pass seeded. */
export function isSeededDead(node: GraphNode | undefined): boolean {
  return !!node && node.properties.pastOrigin === WORLD_PAST_ORIGIN && node.properties.deceased === true;
}
