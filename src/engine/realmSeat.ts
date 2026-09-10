/**
 * Where a Realm's court sits (THR-1155).
 *
 * The seat is **edge-internal data**: a `role: 'seat'` property on the one `controls`
 * edge that runs from the Realm to the town it is seated in. It says something about
 * that holding, not about a second thing the Realm is connected to, so it is not an
 * edge type and not a node property pointing at an id — the same rule that keeps
 * `influence` on the edge rather than in a parallel table.
 *
 * Two callers, one rule, which is why this is a module rather than a loop inside the
 * mint: worldgen stamps the seat when it writes a Realm's territory, and the guild-hall
 * reconciliation pass re-stamps it when the town it chose turns out to be a definition
 * faction's hall and the Realm's edge there is dropped. A Realm that lost its seat and
 * was never re-seated would draw no capital marker and answer *nowhere* to "where is
 * its court", which is a hole rather than a fact.
 *
 * NFP #3: deterministic — the preference is the Realm's own seat hex, then the most
 * town-like holding, ties broken by the lowest Location id. NFP #4: a Realm that holds
 * nothing gets no seat and no throw; the fail-soft table permits a court with no hall.
 */

import type { WorldGraph } from './graph';

/**
 * How town-like a settlement is, for choosing a seat when the domain's capital hex
 * seated nothing. Higher wins. Anything not listed ranks 0 — a shrine can be a capital
 * of last resort, but only when a Realm holds nothing better.
 */
export const REALM_SEAT_SUBTYPE_RANK: Record<string, number> = {
  capital: 5, city: 4, castle: 3, town: 2, fort: 1,
};

/**
 * Stamp `role: 'seat'` on exactly one of a Realm's `controls` edges, clearing the role
 * from any other. Returns the seated Location's id, or `null` when the Realm holds
 * nothing.
 */
export function stampRealmSeat(graph: WorldGraph, realmId: string): string | null {
  const held = graph.getOutgoingEdges(realmId, 'controls')
    .slice()
    .sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0));
  if (held.length === 0) return null;

  const realm = graph.getNode(realmId);
  const seatCol = realm?.properties.seatHexCol as number | undefined;
  const seatRow = realm?.properties.seatHexRow as number | undefined;

  let chosen = held[0];
  let bestRank = -1;
  for (const edge of held) {
    const node = graph.getNode(edge.target);
    if (!node) continue;
    if (seatCol !== undefined
      && node.properties.hexCol === seatCol
      && node.properties.hexRow === seatRow) {
      chosen = edge;
      bestRank = Number.POSITIVE_INFINITY;
      break;
    }
    const rank = REALM_SEAT_SUBTYPE_RANK[node.properties.locationSubtype as string] ?? 0;
    if (rank > bestRank) { bestRank = rank; chosen = edge; }
  }

  for (const edge of held) {
    const shouldBeSeat = edge.id === chosen.id;
    const isSeat = edge.properties.role === 'seat';
    if (shouldBeSeat === isSeat) continue;
    const properties = { ...edge.properties };
    if (shouldBeSeat) properties.role = 'seat';
    else delete properties.role;
    graph.updateEdge(edge.id, { properties });
  }

  return chosen.target;
}
