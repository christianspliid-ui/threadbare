/**
 * Which faction a faction encounter is about (THR-1155 slice 3).
 *
 * `FACTION_ENCOUNTER_META` answers that question with a `factionDefId`, and for the
 * ~150 authored guild rows the answer is a constant: `ag.quest.ruin_delve` belongs to
 * `adventuring_guild` in every world that will ever exist. A Realm has no such
 * constant. Its definition is minted per world as `realm.<cultureId>` over a culture
 * worldgen generated, so `realm.quest.*` content — the court work THR-1454 will author
 * — can name its faction only at read time.
 *
 * ─── Why this matters more than a naming inconvenience ───────────────────────
 *
 * Every consumer of the meta fails *soft* on a row it cannot resolve, and each failure
 * is silent in its own direction: the rank gate stands open, the reputation reward is
 * skipped, the join outcome returns false. Put together they mean a Realm's court
 * ladder — `REALM_RANK_LADDER`, the six words a subject climbs — could never be
 * climbed. The ladder ships inside `buildRealmDefinition` and every rung is real; with
 * no resolvable meta, no realm encounter would ever move a mortal up one. The ladder
 * would be decoration. This module is what makes it a ladder.
 *
 * ─── The rule, once ───────────────────────────────────────────────────────────
 *
 * **The Realm an encounter is about is the one the agent has standing with; joining is
 * how standing begins, so a would-be subject's Realm is the one whose ground they
 * stand on.** Both halves are one sentence because they are one question asked at two
 * moments — before and after the first oath.
 *
 * The ground half asks the map (`getLocationHolder`), never the agent's acquaintances,
 * for the reason slice 3 part 1 gave for `$realm`: a Location's holder may be a guild,
 * an order or a monster faction, and `isRealm` is the discriminator that cannot be
 * forgotten because it is read here rather than remembered elsewhere. Ground no Realm
 * holds resolves to nothing, and nothing is the honest answer — there is no court there
 * to be a stranger to.
 *
 * NFP #2 (inspectability): the resolution is a pure function of the graph, so a caller
 * that traces its inputs has traced this too. NFP #4 (fail-soft): every miss returns
 * `null` and the caller skips, exactly as it already did for an unresolvable id.
 */

import type { WorldGraph } from './graph';
import type { FactionEncounterMeta } from '../types/faction';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { getFactionMembershipEdges, getAgentLocationId } from './graphQueries';
import { resolveToParentLocation } from './sublocationShape';
import { getLocationHolder } from './realmHolder';
import { REALM_FACTION_CLASS } from '../data/realm-content';

/**
 * The definition id a meta row is about, for this agent, now.
 *
 * Returns `meta.factionDefId` untouched for every authored row — the field is absent on
 * all of them, so this is the identity function across the whole static catalogue and
 * the sweep that routed the read sites here changed no guild behaviour.
 *
 * @param locationId Where the encounter is, when the caller knows. Omitted, the agent's
 *   own location stands in; a Place resolves up to the Location that holds it, because
 *   a `controls` edge points at a settlement and never at the tavern inside it.
 */
export function resolveMetaFactionDefId(
  graph: WorldGraph,
  agentId: string,
  meta: FactionEncounterMeta,
  locationId?: string,
): string | null {
  if (!meta.factionClass) return meta.factionDefId;
  if (meta.factionClass !== REALM_FACTION_CLASS) return null;

  return standingRealmDefId(graph, agentId) ?? groundRealmDefId(graph, agentId, locationId);
}

/** The Realm this agent already holds standing with, if any. */
function standingRealmDefId(graph: WorldGraph, agentId: string): string | null {
  for (const edge of getFactionMembershipEdges(graph, agentId)) {
    const faction = graph.getNode(edge.target);
    if (faction?.properties.factionClass !== REALM_FACTION_CLASS) continue;
    const defId = (edge.properties as Partial<MemberOfEdgeProperties>).factionDefId
      ?? faction.properties.factionDefId;
    if (typeof defId === 'string' && defId.length > 0) return defId;
  }
  return null;
}

/** The Realm holding the ground under this encounter, if a Realm holds it. */
function groundRealmDefId(
  graph: WorldGraph,
  agentId: string,
  locationId: string | undefined,
): string | null {
  const startId = locationId ?? getAgentLocationId(graph, agentId);
  const outer = resolveToParentLocation(graph, graph.getNode(startId ?? ''));
  const holder = getLocationHolder(graph, outer?.id);
  if (!holder?.isRealm) return null;

  const defId = graph.getNode(holder.id)?.properties.factionDefId;
  return typeof defId === 'string' && defId.length > 0 ? defId : null;
}
