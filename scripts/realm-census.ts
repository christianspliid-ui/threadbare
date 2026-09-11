/**
 * The realm census — what the world's nations hold (THR-1155 slice 2).
 *
 * Split out of `census-seeded-world.ts` rather than left inside it for one reason: that
 * script runs a world build at import time, so a test that imported the predicate from
 * it would run the whole census to ask one question. (An `import.meta.main`-style entry
 * guard would not have saved it — the npm script bundles with esbuild, which flattens
 * the guard away.) Both the instrument and its test read this module.
 */
import { REALM_FACTION_CLASS } from '../src/data/realm-content';
import { getLocationNodes } from '../src/engine/sublocationShape';
import type { WorldGraph } from '../src/engine/graph';

/**
 * What the world's nations hold — THR-1155 slice 2's Done-when, as an instrument.
 *
 * The claim under test is that *the political map is the graph*: one Realm per culture
 * domain, and every Location inside a domain held by that domain's Realm. Both halves
 * were previously true only of a picture — `RegionData.hexDomainId`, a per-hex stamp no
 * `controls` edge had to agree with — so there was nothing a census could have counted.
 *
 * **`ceded` is not a defect.** `seedLivingWorld`'s guild-hall reconciliation drops a
 * Realm's edge where an authored faction keeps its home, so there is exactly one holder
 * per town for the `[0]?.source` readers. A Location held by *some* faction is
 * accounted for; only a Location inside a domain that **nobody** holds is a gap, and
 * that is what {@link realmCensusVerdict} gates on.
 */
export interface RealmCensus {
  /** Culture domains a Location currently belongs to — the denominator. */
  domains: number;
  /** Actor nodes stamped `factionClass: 'realm'`. */
  realms: number;
  /** Realms whose `cultureId` names a domain that exists. */
  realmsWithDomain: number;
  /** Locations carrying a current-layer culture edge. */
  locationsInDomain: number;
  /** …of those, held by their own domain's Realm. */
  heldByTheirRealm: number;
  /** …of those, held instead by an authored faction keeping its home there. */
  cededToDefinitionFaction: number;
  /** …of those, held by nobody at all. The number that must be 0. */
  unheld: number;
  /** Held-town counts per Realm, by node id — the shape of the political map. */
  heldPerRealm: Record<string, number>;
}

/**
 * Count the nations and what they hold.
 *
 * Reads the graph only — no tiles, no projection. A Location's *domain* is the target
 * of its current-layer `belongs_to` edge, which is what `worldSeed` writes territory
 * from; reading the projection instead would ask the map whether it agrees with itself.
 */
export function buildRealmCensus(graph: WorldGraph): RealmCensus {
  const realmByCulture = new Map<string, string>();
  const realmIds = new Set<string>();
  for (const node of graph.getNodesByType('actor')) {
    if (node.properties.actorType !== 'faction') continue;
    if (node.properties.factionClass !== REALM_FACTION_CLASS) continue;
    realmIds.add(node.id);
    const cultureId = node.properties.cultureId;
    if (typeof cultureId === 'string') realmByCulture.set(cultureId, node.id);
  }

  const isFaction = (id: string): boolean =>
    graph.getNode(id)?.properties.actorType === 'faction';

  const domains = new Set<string>();
  const heldPerRealm: Record<string, number> = {};
  for (const id of realmIds) heldPerRealm[id] = 0;

  let locationsInDomain = 0;
  let heldByTheirRealm = 0;
  let cededToDefinitionFaction = 0;
  let unheld = 0;

  for (const location of getLocationNodes(graph)) {
    const cultureEdge = graph.getOutgoingEdges(location.id, 'belongs_to')
      .find(edge => edge.properties?.cultureLayer === 'current');
    if (!cultureEdge) continue;
    domains.add(cultureEdge.target);
    locationsInDomain += 1;

    const holders = graph.getIncomingEdges(location.id, 'controls')
      .map(edge => edge.source)
      .filter(isFaction);
    const ownRealm = realmByCulture.get(cultureEdge.target);

    if (ownRealm && holders.includes(ownRealm)) heldByTheirRealm += 1;
    else if (holders.length > 0) cededToDefinitionFaction += 1;
    else unheld += 1;

    for (const holder of holders) {
      if (holder in heldPerRealm) heldPerRealm[holder] += 1;
    }
  }

  return {
    domains: domains.size,
    realms: realmIds.size,
    realmsWithDomain: [...realmByCulture.keys()].filter(c => domains.has(c)).length,
    locationsInDomain,
    heldByTheirRealm,
    cededToDefinitionFaction,
    unheld,
    heldPerRealm,
  };
}

/**
 * The Done-when, as a boolean and a reason.
 *
 * Two gates: one Realm per domain, and no Location inside a domain left unheld. A world
 * with no domains at all (a bare `seedWorld` fixture) passes vacuously and says so —
 * the alternative is a census that reports a healthy nil, which is the shape this
 * instrument exists to refuse.
 */
export function realmCensusVerdict(census: RealmCensus): { ok: boolean; reason: string } {
  if (census.domains === 0) {
    return { ok: census.realms === 0, reason: 'no domains — a world with no nations (vacuous)' };
  }
  if (census.realms !== census.domains) {
    return { ok: false, reason: `realms ${census.realms} != domains ${census.domains}` };
  }
  if (census.realmsWithDomain !== census.realms) {
    return { ok: false, reason: `${census.realms - census.realmsWithDomain} realm(s) name a domain that does not exist` };
  }
  if (census.unheld > 0) {
    return { ok: false, reason: `${census.unheld} location(s) inside a domain held by nobody` };
  }
  return { ok: true, reason: 'one realm per domain; every domain location held' };
}

