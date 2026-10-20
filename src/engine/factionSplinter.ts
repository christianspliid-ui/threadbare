/**
 * factionSplinter — the graph writes of a faction splitting in two.
 *
 * Moved out of the `faction_splinter` aftermath case (`encounterAftermath.ts`) so the
 * hunger-and-unrest rising (THR-1957, `unrestPressure/rising.ts`) splits a holder's
 * resident members through the same writes. The aftermath keeps its traces and its
 * chronicle line; this helper only writes the graph:
 *
 * 1. the new faction node (`actorType: 'faction'`, `actorStatus: 'active'`);
 * 2. each chosen member's `member_of` moved from the source to the new faction, its
 *    reputation scaled by `reputationShare`, its rank and role carried over (the edge
 *    schema requires both; a member with none reads rank 0, role `member`);
 * 3. the source's `relates_to` edges copied to the new faction, marked `inherited`;
 * 4. the new faction's resentment toward its parent (`basis: 'splinter'`).
 *
 * The caller owns `touchWorld` / `touchStructure`.
 *
 * Plus the `resident_of` member selector (THR-1957): the members whose observed
 * residence resolves to one place-tier Location.
 *
 * NFP #3: members in the order given; no draw. NFP #4: a member with no edge to the
 * source is skipped; duplicate edge ids are swallowed.
 */
import type { WorldGraph } from './graph';
import { getFactionMembershipEdges } from './graphQueries';
import { RESIDENCE_POSITION_PROP } from './agentResidence';
import { resolveToParentLocation } from './sublocationShape';
import { FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT } from '../data/game-config';

export interface SplinterMember {
  readonly id: string;
  readonly reputation: number;
}

export interface SplinterFactionArgs {
  readonly sourceFactionId: string;
  readonly newFactionId: string;
  readonly newFactionName: string;
  readonly members: readonly SplinterMember[];
  readonly reputationShare: number;
  readonly tick: number;
  /** Extra properties on the new faction node (e.g. `sourceEncounterId`, `risenAt`). */
  readonly extraProperties?: Readonly<Record<string, unknown>>;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Write a splinter faction into the graph. Returns the ids of the members moved. */
export function splinterFaction(graph: WorldGraph, args: SplinterFactionArgs): string[] {
  const { sourceFactionId, newFactionId, newFactionName, members, reputationShare, tick } = args;
  graph.addNode({
    id: newFactionId,
    type: 'actor',
    name: newFactionName,
    properties: {
      actorType: 'faction',
      actorStatus: 'active',
      foundedTick: tick,
      ...(args.extraProperties ?? {}),
    },
  });

  const moved: string[] = [];
  for (const member of members) {
    const oldEdges = getFactionMembershipEdges(graph, member.id).filter(e => e.target === sourceFactionId);
    const old = oldEdges[0]?.properties ?? {};
    const rank = typeof old.rank === 'number' ? old.rank : 0;
    const role = typeof old.role === 'string' ? old.role : 'member';
    for (const e of oldEdges) graph.removeEdge(e.id);
    try {
      graph.addEdge({
        id: `member_of_${member.id}_${newFactionId}`,
        source: member.id,
        target: newFactionId,
        type: 'member_of',
        properties: { reputation: clamp01(member.reputation * reputationShare), joinedTick: tick, rank, role },
      });
      moved.push(member.id);
    } catch { /* fail-soft: duplicate id */ }
  }

  for (const rel of graph.getOutgoingEdges(sourceFactionId, 'relates_to')) {
    if (rel.target === newFactionId) continue;
    try {
      graph.addEdge({
        id: `relates_to_${newFactionId}_${rel.target}_inherited`,
        source: newFactionId,
        target: rel.target,
        type: 'relates_to',
        properties: { ...rel.properties, inherited: true },
      });
    } catch { /* fail-soft: duplicate id */ }
  }

  try {
    graph.addEdge({
      id: `relates_to_${newFactionId}_${sourceFactionId}`,
      source: newFactionId,
      target: sourceFactionId,
      type: 'relates_to',
      properties: { sentiment: FACTION_SPLINTER_INITIAL_SENTIMENT_TO_PARENT, strength: 0.8, basis: 'splinter' },
    });
  } catch { /* fail-soft: duplicate id */ }

  return moved;
}

/**
 * Does this agent's observed residence resolve to `placeId` (a place-tier Location)?
 * The `resident_of` selector and the rising both ask this.
 */
export function residesIn(graph: WorldGraph, agentId: string, placeId: string): boolean {
  const residenceId = graph.getNode(agentId)?.properties?.[RESIDENCE_POSITION_PROP];
  if (typeof residenceId !== 'string') return false;
  return resolveToParentLocation(graph, graph.getNode(residenceId))?.id === placeId;
}
