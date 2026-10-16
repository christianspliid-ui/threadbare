/**
 * The crown — pure read helpers over `sworn_to` (THR-1932, plan § 7).
 *
 * The Crown is derived, never stored: a realm with CROWN_MIN_OATHS or more incoming
 * `sworn_to` edges. Every reader (the faction sheet, the map outline, the hex tooltip,
 * the debug bridge, and war aims' defence-first rule) asks through here.
 *
 * Fail-soft: with CROWN_ENABLED off every helper returns empty, so an old save's
 * `sworn_to` edges are ignored by every reader.
 */

import type { WorldGraph } from '../graph';
import type { GraphEdge, GraphNode } from '../../types/graph';
import type { HexCoord } from '../../types';
import type { RealmProjection } from '../realmProjection';
import type { SwornToEdgeProperties } from './types';
import { CROWN_ENABLED, CROWN_MIN_OATHS } from '../../data/crown-constants';
import { REALM_FACTION_CLASS } from '../../data/realm-content';
import { getFactionLeaderId } from '../factionNetwork';

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function isRealmFaction(node: GraphNode | undefined | null): boolean {
  return !!node && node.properties.actorType === 'faction' && node.properties.factionClass === REALM_FACTION_CLASS;
}

/** Every live oath edge in edge-id order (both ends present). */
export function allOathEdges(graph: WorldGraph): GraphEdge[] {
  if (!CROWN_ENABLED) return [];
  return graph.getEdgesByType('sworn_to')
    .filter(e => graph.getNode(e.source) && graph.getNode(e.target))
    .sort(byId);
}

export function readOath(edge: GraphEdge): SwornToEdgeProperties {
  return edge.properties as unknown as SwornToEdgeProperties;
}

/** The faction's own oath (it is the vassal), or null. Oldest by swornTick if a save holds two. */
export function oathOf(graph: WorldGraph, factionId: string): GraphEdge | null {
  if (!CROWN_ENABLED) return null;
  const out = graph.getOutgoingEdges(factionId, 'sworn_to').filter(e => graph.getNode(e.target));
  if (out.length === 0) return null;
  return [...out].sort((a, b) => (readOath(a).swornTick ?? 0) - (readOath(b).swornTick ?? 0) || byId(a, b))[0];
}

/** The liege this faction owes fealty to, or null. */
export function liegeOf(graph: WorldGraph, factionId: string): string | null {
  return oathOf(graph, factionId)?.target ?? null;
}

/** The oaths sworn to this faction (it is the liege), in edge-id order. */
export function oathsTo(graph: WorldGraph, liegeId: string): GraphEdge[] {
  if (!CROWN_ENABLED) return [];
  return graph.getIncomingEdges(liegeId, 'sworn_to').filter(e => graph.getNode(e.source)).sort(byId);
}

/** The vassals of this faction, in vassal-id order. */
export function vassalsOf(graph: WorldGraph, liegeId: string): string[] {
  return oathsTo(graph, liegeId).map(e => e.source).sort();
}

export function isCrown(graph: WorldGraph, factionId: string): boolean {
  return vassalsOf(graph, factionId).length >= CROWN_MIN_OATHS;
}

/** The Crown's ruler: whoever leads the realm (anointed or score-derived), or null. */
export function crownRulerOf(graph: WorldGraph, factionId: string): string | null {
  try {
    return getFactionLeaderId(graph, factionId) ?? null;
  } catch {
    return null;
  }
}

function settlementsHeldBy(graph: WorldGraph, factionId: string): string[] {
  return graph.getOutgoingEdges(factionId, 'controls').map(e => e.target);
}

/**
 * What this realm has promised to keep safe: its own settlements plus every settlement
 * held by a faction sworn to it. War aims' defence-first rule (THR-1933) reads this.
 */
export function protectedHoldingsOf(graph: WorldGraph, factionId: string): string[] {
  const out = new Set<string>(settlementsHeldBy(graph, factionId));
  for (const v of vassalsOf(graph, factionId)) for (const s of settlementsHeldBy(graph, v)) out.add(s);
  return [...out].sort();
}

/**
 * Realm → the Crown its realm is sworn to, for every sworn *realm* (a guild vassal draws
 * no outline: its land is its liege's). Built from the graph; the projection carries it.
 */
export function buildCrownOf(graph: WorldGraph): Map<string, string> {
  const crownOf = new Map<string, string>();
  for (const e of allOathEdges(graph)) {
    if (!isRealmFaction(graph.getNode(e.source)) || !isRealmFaction(graph.getNode(e.target))) continue;
    if (crownOf.has(e.source)) continue;
    crownOf.set(e.source, e.target);
  }
  return crownOf;
}

/**
 * The hexes inside a crown's outline: its own projected hexes and its sworn realms'.
 * Empty when no realm is sworn to it (a guild-only crown draws no outline).
 */
export function crownHexes(projection: RealmProjection, crownId: string): HexCoord[] {
  const crownOf = projection.crownOf;
  if (!crownOf) return [];
  const members = new Set<string>([...crownOf].filter(([, c]) => c === crownId).map(([r]) => r));
  if (members.size === 0) return [];
  members.add(crownId);
  const out: HexCoord[] = [];
  for (const realm of projection.realms) if (members.has(realm.id)) out.push(...realm.hexes);
  return out;
}

/** The crowns the projection draws an outline for (realms with at least one sworn realm). */
export function outlinedCrowns(projection: RealmProjection): string[] {
  return [...new Set(projection.crownOf?.values() ?? [])].sort();
}
