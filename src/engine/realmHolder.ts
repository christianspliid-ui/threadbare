/**
 * realmHolder.ts — who holds this town (THR-1155 § UI).
 *
 * The Realm's **point reader**, standing to `realmProjection` exactly as
 * `getHexRegionData` stands to `areaProjection`: the projection is the partition view
 * the map draws, this is the one-place question every sheet and chronicle line asks.
 * Both read the same `controls` edges, so the border and the *held by* line cannot say
 * different things — which is the whole reason the political map stopped being a stamp.
 *
 * **Why a Realm is not the only answer.** A town can be held by a guild that keeps its
 * hall there (the guild-hall reconciliation drops the Realm's redundant edge at
 * seeding), by a monster faction that took a lair, or by nobody at all. The reader
 * returns whoever holds it and says whether that holder is a nation; a surface that
 * wants to phrase *Unclaimed* differently for wilderness than for a guild-held town has
 * what it needs, and one that does not can render the name.
 *
 * NFP #2 Inspectability: the edge id comes back, so a *held by* line on screen is
 * traceable to the edge that put it there.
 * NFP #4 Fail-soft: a dangling `controls` edge, a holder that is not a faction, and a
 * Location nobody holds each return `null` rather than throwing.
 */

import type { WorldGraph } from './graph';
import { REALM_FACTION_CLASS } from '../data/realm-content';

/** Who holds a Location, as a surface needs to render it. */
export interface LocationHolder {
  /** The holding faction's node id. */
  id: string;
  /** The name the player reads. */
  name: string;
  /** `factionClass: 'realm'` — a nation rather than a guild, order, cult or horde. */
  isRealm: boolean;
  /** True when this is the Realm's seat — the town its court sits in. */
  isSeat: boolean;
  /** The `controls` edge id this answer came from. */
  edgeId: string;
}

/**
 * The faction that holds this Location, or `null` when nobody does.
 *
 * A mortal's `controlType: 'strategic'` stance also rides `controls` and is deliberately
 * not an answer here — a hold is a commitment to a town, not title to it, and THR-1448
 * owns what it means on a sheet. The filter is the same one conquest and the projection
 * use, so all three agree on what "held" means.
 *
 * When more than one faction holds a town — which worldgen's reconciliation exists to
 * prevent but a conquest into a contested state could produce — the lowest edge id wins,
 * so the line is stable across reads rather than following iteration order.
 */
export function getLocationHolder(
  graph: WorldGraph,
  locationId: string | undefined,
): LocationHolder | null {
  if (!locationId) return null;

  const candidates = graph.getIncomingEdges(locationId, 'controls')
    .filter(edge => graph.getNode(edge.source)?.properties.actorType === 'faction')
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const edge = candidates[0];
  if (!edge) return null;

  const holder = graph.getNode(edge.source);
  if (!holder) return null;

  return {
    id: holder.id,
    name: holder.name ?? holder.id,
    isRealm: holder.properties.factionClass === REALM_FACTION_CLASS,
    isSeat: edge.properties?.role === 'seat',
    edgeId: edge.id,
  };
}
