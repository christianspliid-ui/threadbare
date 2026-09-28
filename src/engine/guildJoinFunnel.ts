/**
 * The guild-join funnel (THR-1640) — how spotlight mortals get from a guild hall to a
 * membership, stage by stage, read off the traces the decision and resolution phases
 * already emit plus the live graph.
 *
 * Stages: a join reaches a decision board's top entries (`engagement_decision`), is
 * the one chosen, resolves (`guild_join_resolved`), lands in a success band, and
 * becomes a `member_of` edge. `coverage` counts the non-Realm guilds in which a
 * spotlight mortal holds a membership now — the slice's gate reads it against
 * `GUILD_SPOTLIGHT_COVERAGE_MIN`.
 *
 * Pure over its inputs (NFP #2): the trace window is whatever the ring buffer holds,
 * so `reached` / `chosen` / `resolved` count that window, while `coverage` reads the
 * graph and is exact. Fail-soft: malformed traces are skipped.
 */

import type { WorldGraph } from './graph';
import type { TraceEntry } from '../types/trace';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { getFactionMembershipEdges } from './graphQueries';
import { isAutonomousDecisionActor } from './strategicKindReachability';
import { getFactionDefinition } from '../data/faction-definition-lookup';
import { GUILD_SPOTLIGHT_COVERAGE_MIN } from '../data/faction-constants';

export interface GuildJoinFunnel {
  /** Engagement decisions whose top entries included a join. */
  readonly reached: number;
  /** …of which the join was the one chosen. */
  readonly chosen: number;
  /** Joins that resolved, by band. */
  readonly resolvedByOutcome: Readonly<Record<string, number>>;
  /** Resolved joins that did not become a membership, by reason. */
  readonly notJoinedByReason: Readonly<Record<string, number>>;
  /** Resolved joins that wrote a `member_of` edge. */
  readonly joined: number;
  /** Spotlight mortals now. */
  readonly spotlightCount: number;
  /** Non-Realm guild definition id → spotlight members now. */
  readonly spotlightMembersByGuild: Readonly<Record<string, number>>;
  /** Distinct non-Realm guilds holding at least one spotlight member. */
  readonly coverage: number;
  readonly coverageMin: number;
  readonly coverageMet: boolean;
}

/** A guild for the coverage gate: a static, non-Realm, non-monster definition. */
export function isCoverageGuild(factionDefId: string | undefined): boolean {
  // A Realm's definition is minted per world as `realm.<cultureId>` (THR-1155).
  if (!factionDefId || factionDefId.startsWith('realm.')) return false;
  const definition = getFactionDefinition(factionDefId);
  return definition != null && definition.isMonsterFaction !== true;
}

export function computeGuildJoinFunnel(
  graph: WorldGraph,
  traces: ReadonlyArray<TraceEntry>,
): GuildJoinFunnel {
  let reached = 0;
  let chosen = 0;
  let joined = 0;
  const resolvedByOutcome: Record<string, number> = {};
  const notJoinedByReason: Record<string, number> = {};

  for (const raw of traces) {
    const trace = raw as unknown as Record<string, unknown>;
    if (trace.category === 'engagement_decision' && Array.isArray(trace.candidates)) {
      const joinIds = (trace.candidates as Array<{ id?: unknown }>)
        .map(c => c.id)
        .filter((id): id is string => typeof id === 'string' && id.endsWith('.join'));
      if (joinIds.length === 0) continue;
      reached++;
      if (typeof trace.chosenId === 'string' && joinIds.includes(trace.chosenId)) chosen++;
    } else if (trace.category === 'guild_join_resolved') {
      const outcome = typeof trace.outcome === 'string' ? trace.outcome : 'unknown';
      resolvedByOutcome[outcome] = (resolvedByOutcome[outcome] ?? 0) + 1;
      if (trace.joined === true) joined++;
      else {
        const reason = typeof trace.reason === 'string' ? trace.reason : 'unknown';
        notJoinedByReason[reason] = (notJoinedByReason[reason] ?? 0) + 1;
      }
    }
  }

  const spotlight = graph.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n));
  const spotlightMembersByGuild: Record<string, number> = {};
  for (const mortal of spotlight) {
    for (const edge of getFactionMembershipEdges(graph, mortal.id)) {
      const defId = (edge.properties as Partial<MemberOfEdgeProperties>).factionDefId;
      if (!isCoverageGuild(defId)) continue;
      spotlightMembersByGuild[defId!] = (spotlightMembersByGuild[defId!] ?? 0) + 1;
    }
  }
  const coverage = Object.keys(spotlightMembersByGuild).length;

  return {
    reached,
    chosen,
    resolvedByOutcome,
    notJoinedByReason,
    joined,
    spotlightCount: spotlight.length,
    spotlightMembersByGuild,
    coverage,
    coverageMin: GUILD_SPOTLIGHT_COVERAGE_MIN,
    coverageMet: coverage >= GUILD_SPOTLIGHT_COVERAGE_MIN,
  };
}
