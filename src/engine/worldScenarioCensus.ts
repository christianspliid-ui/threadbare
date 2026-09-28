/**
 * World scenario census (THR-1632) — one pure selector over the graph that answers
 * "what did the faith-and-politics settings put in this world?". Read by
 * `window.__DEBUG.getWorldScenario()` and by the census reader
 * `Docs/audits/2026-09-25-living-world-data/readers/faith.ts`, so the debug lever and
 * the audit can never disagree about what they are counting.
 *
 * Read-only; no draws; fail-soft (a missing node or property is skipped, never thrown).
 */

import type { WorldGraph } from './graph';
import { getLocationNodes } from './sublocationShape';
import { CULTURE_FRINGE_SUBTYPES, TEMPLE_OF_SPHERES_DEF_ID } from '../data/world-scenario';

/** Settlement tiers the "unheld" count is taken over (hamlet and up). */
const HELD_COUNT_SUBTYPES: ReadonlySet<string> = new Set(['hamlet', 'town', 'city', 'capital']);
const HOLY_SUBTYPES: ReadonlySet<string> = new Set(['shrine', 'temple']);

export interface CongregationCensusRow {
  id: string;
  name: string;
  cultureId: string | null;
  veneratedSphere: string | null;
  seatId: string | null;
  seatSubtype: string | null;
  hallCount: number;
  /** Halls standing on a Location whose heartland culture is not this congregation's. */
  hallsOffHeartland: number;
  /** Whether a `sacred_route` runs from this congregation to its seat. */
  pilgrimRouteToSeat: boolean;
}

export interface WorldScenarioCensus {
  congregations: CongregationCensusRow[];
  /** Temple of the Spheres faction nodes of any shape (1 = today's single Temple). */
  templeFactions: number;
  /** Shrines + temples on each living culture's heartland (non-fringe current link). */
  holyPlacesByCulture: Record<string, number>;
  /** Locations carrying a fringe culture link. */
  fringeSettlements: number;
  /** Fringe links on subtypes outside `CULTURE_FRINGE_SUBTYPES` — must be 0. */
  fringeOnNonSettlements: number;
  /** Fringe-eligible Locations with no culture link at all. */
  culturelessSettlements: number;
  /** Town guilds (nodes with a `guildType`) carrying `factionClass: 'guild'`. */
  settlementGuildsLabelled: number;
  /** Town guilds in total. */
  settlementGuilds: number;
  /** Hamlet-and-up Locations with no incoming `controls` edge. */
  unheldSettlements: number;
  /** `sacred_route` edges in the world. */
  pilgrimRoutes: number;
}

function heartlandCultureOf(graph: WorldGraph, locationId: string): string | null {
  for (const e of graph.getOutgoingEdges(locationId, 'belongs_to')) {
    const p = e.properties as Record<string, unknown>;
    if (p.cultureLayer === 'current' && !p.fringe) return e.target;
  }
  return null;
}

export function selectWorldScenarioCensus(graph: WorldGraph): WorldScenarioCensus {
  const congregations: CongregationCensusRow[] = [];
  let templeFactions = 0;
  let settlementGuildsLabelled = 0;
  let settlementGuilds = 0;

  for (const n of graph.getNodesByType('actor')) {
    const p = n.properties as Record<string, unknown>;
    if (p.actorType !== 'faction') continue;
    if (typeof p.guildType === 'string') {
      settlementGuilds++;
      if (p.factionClass === 'guild') settlementGuildsLabelled++;
    }
    if (p.factionDefId !== TEMPLE_OF_SPHERES_DEF_ID) continue;
    templeFactions++;
    const cultureEdge = graph.getOutgoingEdges(n.id, 'belongs_to')
      .find(e => graph.getNode(e.target)?.properties.actorType === 'culture');
    // Only a Temple instance that carries a venerated-sphere stamp is a congregation;
    // today's single world-wide Temple may still pick up a culture link elsewhere.
    if (!('veneratedSphere' in p)) continue;
    const cultureId = cultureEdge?.target ?? null;
    const seatId = (p.homeLocationId as string | undefined) ?? null;
    let hallCount = 0;
    let hallsOffHeartland = 0;
    for (const e of graph.getOutgoingEdges(n.id, 'located_at')) {
      if ((e.properties as Record<string, unknown>).role !== 'guild_hall') continue;
      hallCount++;
      if (heartlandCultureOf(graph, e.target) !== cultureId) hallsOffHeartland++;
    }
    congregations.push({
      id: n.id,
      name: n.name,
      cultureId,
      veneratedSphere: (p.veneratedSphere as string | null | undefined) ?? null,
      seatId,
      seatSubtype: seatId ? (graph.getNode(seatId)?.properties.locationSubtype as string | undefined) ?? null : null,
      hallCount,
      hallsOffHeartland,
      pilgrimRouteToSeat: seatId !== null
        && graph.getOutgoingEdges(n.id, 'sacred_route').some(e => e.target === seatId),
    });
  }
  congregations.sort((a, b) => a.id.localeCompare(b.id));

  const holyPlacesByCulture: Record<string, number> = {};
  for (const c of graph.getNodesByType('actor')) {
    if (c.properties.actorType !== 'culture' || c.id.startsWith('hist_')) continue;
    holyPlacesByCulture[c.id] = 0;
  }
  let fringeSettlements = 0;
  let fringeOnNonSettlements = 0;
  let culturelessSettlements = 0;
  let unheldSettlements = 0;
  for (const loc of getLocationNodes(graph)) {
    const subtype = loc.properties.locationSubtype as string | undefined;
    const links = graph.getOutgoingEdges(loc.id, 'belongs_to');
    const fringe = links.some(e => (e.properties as Record<string, unknown>).fringe === true);
    if (fringe) {
      fringeSettlements++;
      if (!subtype || !CULTURE_FRINGE_SUBTYPES.has(subtype)) fringeOnNonSettlements++;
    }
    if (subtype && CULTURE_FRINGE_SUBTYPES.has(subtype) && links.length === 0) culturelessSettlements++;
    if (subtype && HOLY_SUBTYPES.has(subtype)) {
      const heart = heartlandCultureOf(graph, loc.id);
      if (heart && heart in holyPlacesByCulture) holyPlacesByCulture[heart]++;
    }
    if (subtype && HELD_COUNT_SUBTYPES.has(subtype)
      && graph.getIncomingEdges(loc.id, 'controls').length === 0) {
      unheldSettlements++;
    }
  }

  return {
    congregations,
    templeFactions,
    holyPlacesByCulture,
    fringeSettlements,
    fringeOnNonSettlements,
    culturelessSettlements,
    settlementGuildsLabelled,
    settlementGuilds,
    unheldSettlements,
    pilgrimRoutes: graph.getEdgesByType('sacred_route').length,
  };
}
