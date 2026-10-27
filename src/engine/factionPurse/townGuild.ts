/**
 * The town's own guild (THR-2077) — the fellowship a scene names when it wins a town
 * building "for the fellowship". Pure: reads the graph, never writes.
 *
 * The pick, with no draw (NFP #3): the first affinity in `affinities` order that has a
 * purse faction present in the town (`guildPresenceIndex`), then within it the faction
 * with the most members standing in the town, then the lowest id. A realm never holds,
 * because a realm's `controls` edge moves a border.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { isRealmNode } from '../realmProjection';
import { affinityKeyOf, guildPresenceIndex, isPurseFaction } from './income';
import { MILL_FELLOWSHIP_AFFINITIES } from '../../data/faction-purse-constants';

export interface TownGuildPick {
  readonly guildId: string;
  /** The affinity key it was picked under, e.g. 'artisans'. */
  readonly affinity: string;
}

/** Members of `factionId` whose `located_at` is the town or one of its Places. */
function membersStandingIn(graph: WorldGraph, factionId: string, townId: string): number {
  let count = 0;
  for (const m of graph.getIncomingEdges(factionId, 'member_of')) {
    const here = graph.getOutgoingEdges(m.source, 'located_at').some(e => {
      if (e.target === townId) return true;
      return graph.getNode(e.target)?.properties.parentLocationId === townId;
    });
    if (here) count++;
  }
  return count;
}

export function pickTownGuild(
  graph: WorldGraph,
  townId: string,
  affinities: readonly string[] = MILL_FELLOWSHIP_AFFINITIES,
): TownGuildPick | null {
  const candidates = graph.getNodesByType('actor').filter((f): f is GraphNode => {
    if (!isPurseFaction(f) || isRealmNode(f.properties)) return false;
    // A dissolved faction keeps its node and home; it holds nothing new.
    if (f.properties.dissolved || f.properties.actorStatus === 'dissolved') return false;
    const key = affinityKeyOf(f);
    return key !== undefined && affinities.includes(key);
  });
  if (candidates.length === 0) return null;
  const presence = guildPresenceIndex(graph, candidates);
  const present = candidates.filter(f => presence.get(f.id)?.has(townId));
  for (const affinity of affinities) {
    const ranked = present
      .filter(f => affinityKeyOf(f) === affinity)
      .map(f => ({ id: f.id, members: membersStandingIn(graph, f.id, townId) }))
      .sort((a, b) => (b.members - a.members) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (ranked.length > 0) return { guildId: ranked[0].id, affinity };
  }
  return null;
}
