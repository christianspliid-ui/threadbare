/**
 * Who stands beside a fighter (THR-1543, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §11, THR-1271).
 *
 * `getCompanyMembersAtHex` composes the company queries that already exist —
 * `getGroupOf`, `getGroupMembers`, `resolveLocationToHex` — into the one question a
 * fight asks: which living members of my company are on my hex right now? It adds
 * no graph shape; a company is still a `member_of` edge to a company node.
 *
 * Pure: a read of the graph, safe from the attended forecast (plan doc §3b).
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { getGroupMembers, getGroupOf, isAgentGone } from '../groups/groupQueries';
import { resolveLocationToHex } from '../encounterAwareness';

/** The hex an agent stands on, or null when their position cannot be resolved. */
export function agentHexOf(graph: WorldGraph, agentId: string): { col: number; row: number } | null {
  const locationId = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
  return locationId ? resolveLocationToHex(graph, locationId) : null;
}

/**
 * The living members of the fighter's company who share the fighter's hex, in join
 * order — never the fighter, and never anyone in `exclude` (the fight's opponent:
 * two members of one company can fight over an injury, plan doc 5).
 *
 * Empty when the fighter has no company, or their hex cannot be resolved
 * (fail-soft: an unplaceable fighter fights alone).
 */
export function getCompanyMembersAtHex(
  graph: WorldGraph,
  fighterId: string,
  exclude: readonly (string | null | undefined)[] = [],
): GraphNode[] {
  try {
    const company = getGroupOf(graph, fighterId);
    if (!company) return [];
    const hex = agentHexOf(graph, fighterId);
    if (!hex) return [];
    const excluded = new Set<string>([fighterId, ...exclude.filter((id): id is string => !!id)]);
    return getGroupMembers(graph, company.id).filter((member) => {
      if (excluded.has(member.id) || isAgentGone(member)) return false;
      const at = agentHexOf(graph, member.id);
      return at !== null && at.col === hex.col && at.row === hex.row;
    });
  } catch {
    return [];
  }
}
