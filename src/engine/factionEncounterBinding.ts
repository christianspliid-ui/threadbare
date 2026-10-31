/**
 * Which faction a generic faction set-piece is about (THR-2096).
 *
 * The eight `fa.*` templates are written for *a* faction — a posted bounty, a
 * conclave, a rival watched from across the square — but nothing told them which
 * one, so the player read "Faction Bounty" and "the faction's posting": a system
 * word where a name belongs. A template opts in with `bindsFaction`, and this
 * module answers the question from the graph:
 *
 *  - `'posting'` — the faction that posted the work here. The actor's own faction
 *    when it keeps a presence at this location (a `located_at` guild hall or an
 *    `owns` holding); else the faction present here. "A bounty is posted where the
 *    faction keeps a presence."
 *  - `'member'` — the actor's own faction present at this location, with no
 *    fallback: a loyalty examination or a conclave seats only its own members.
 *  - `'rival'` — the actor's own faction and one it is declared rival to
 *    (`areFactionsHostile`). An actor with no faction, or a faction with no rival,
 *    has no rivalry to act out.
 *
 * No faction to bind → the template is not offered (both draw gates read
 * {@link factionBindingAllows}). An unnamed faction is worse than no encounter.
 *
 * Pure function of (actor memberships, location presence, rivalry edges): the draw
 * gate and the prose context (`gatherNarrativeContext`) call the same resolver, so
 * the faction named on the veil is the one that let the encounter be offered.
 * Deterministic: every tie breaks on node id. Fail-soft: anything missing → undefined.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { FactionBindingMode } from '../types/unifiedAction';
import { getAgentMemberships } from './graphQueries';
import { areFactionsHostile } from './factionNetwork';
import { resolveToParentLocation } from './sublocationShape';

export interface FactionEncounterBinding {
  /** The faction the scene is about: the poster, or (for `'rival'`) the actor's own. */
  readonly factionId: string;
  readonly factionName: string;
  /** `'rival'` mode only — the faction set against `factionId`. */
  readonly rivalFactionId?: string;
  readonly rivalFactionName?: string;
  /** The actor is a member of `factionId` — drives `{?has_faction_membership}`. */
  readonly actorIsMember: boolean;
  /** The actor's `member_of.reputation` with `factionId` (0–1); 0 for a non-member. */
  readonly actorStanding: number;
}

/**
 * A member at or above this standing (`member_of.reputation`, 0–1) answers a loyalty
 * examination with conviction (`{?loyalty_high}`); below it, or an outsider, reads
 * `{?loyalty_low}`. 0.5 is the reputation ladder's "Accepted" rung.
 */
export const FACTION_LOYALTY_HIGH_STANDING = 0.5;

function standingWith(graph: WorldGraph, actorId: string, factionId: string): number {
  const edge = getAgentMemberships(graph, actorId).find(m => m.group.id === factionId)?.edge;
  const rep = edge?.properties.reputation;
  return typeof rep === 'number' && Number.isFinite(rep) ? rep : 0;
}

function isLiveFaction(node: GraphNode | undefined): node is GraphNode {
  return node != null && node.properties?.actorType === 'faction' && !!node.name;
}

const byId = (a: GraphNode, b: GraphNode): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Factions keeping a presence at the location's outer tier: a `located_at` guild
 * hall or an `owns` holding. Sorted by id.
 */
export function getFactionsPresentAt(graph: WorldGraph, locationId: string | undefined): GraphNode[] {
  if (!locationId) return [];
  const place = resolveToParentLocation(graph, graph.getNode(locationId));
  if (!place) return [];
  const seen = new Map<string, GraphNode>();
  for (const type of ['located_at', 'owns'] as const) {
    for (const edge of graph.getIncomingEdges(place.id, type)) {
      const node = graph.getNode(edge.source);
      if (isLiveFaction(node)) seen.set(node.id, node);
    }
  }
  return [...seen.values()].sort(byId);
}

/** The actor's factions, highest `member_of.rank` first, ties on id. */
function actorFactions(graph: WorldGraph, actorId: string): GraphNode[] {
  return getAgentMemberships(graph, actorId)
    .filter(m => isLiveFaction(m.group))
    .sort((a, b) =>
      ((b.edge.properties.rank as number) ?? 0) - ((a.edge.properties.rank as number) ?? 0)
      || byId(a.group, b.group))
    .map(m => m.group);
}

/** Resolve the faction (and rival) a `bindsFaction` template names. */
export function resolveFactionEncounterBinding(
  graph: WorldGraph,
  mode: FactionBindingMode | undefined,
  actorId: string,
  locationId: string | undefined,
): FactionEncounterBinding | undefined {
  if (!mode) return undefined;
  try {
    const own = actorFactions(graph, actorId);
    const present = getFactionsPresentAt(graph, locationId);
    const presentIds = new Set(present.map(f => f.id));

    if (mode === 'posting' || mode === 'member') {
      const ownHere = own.find(f => presentIds.has(f.id));
      const poster = mode === 'member' ? ownHere : ownHere ?? present[0];
      if (!poster) return undefined;
      return {
        factionId: poster.id,
        factionName: poster.name,
        actorIsMember: own.some(f => f.id === poster.id),
        actorStanding: standingWith(graph, actorId, poster.id),
      };
    }

    // 'rival': the actor's own faction (one present here first) and a rival of it
    // (one present here first). The first of the actor's factions holding a rival wins.
    const ordered = [...own.filter(f => presentIds.has(f.id)), ...own.filter(f => !presentIds.has(f.id))];
    for (const faction of ordered) {
      const rivals = getRivalFactions(graph, faction.id);
      const rival = rivals.find(r => presentIds.has(r.id)) ?? rivals[0];
      if (rival) {
        return {
          factionId: faction.id,
          factionName: faction.name,
          rivalFactionId: rival.id,
          rivalFactionName: rival.name,
          actorIsMember: true,
          actorStanding: standingWith(graph, actorId, faction.id),
        };
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** Factions declared rival to `factionId` (either direction), sorted by id. */
function getRivalFactions(graph: WorldGraph, factionId: string): GraphNode[] {
  const ids = new Set<string>();
  for (const e of graph.getOutgoingEdges(factionId, 'relates_to')) ids.add(e.target);
  for (const e of graph.getIncomingEdges(factionId, 'relates_to')) ids.add(e.source);
  return [...ids]
    .filter(id => areFactionsHostile(graph, factionId, id))
    .map(id => graph.getNode(id))
    .filter(isLiveFaction)
    .sort(byId);
}

/** Draw gate: a template that binds a faction is offered only when one binds. */
export function factionBindingAllows(
  graph: WorldGraph,
  mode: FactionBindingMode | undefined,
  actorId: string,
  locationId: string | undefined,
): boolean {
  if (!mode) return true;
  return resolveFactionEncounterBinding(graph, mode, actorId, locationId) != null;
}
