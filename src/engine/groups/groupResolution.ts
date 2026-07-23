/**
 * Company Resolution — THR-74
 *
 * Turns a company into a *better* protagonist for a step without turning it into a
 * different kind of actor.
 *
 * Two effects, both additive:
 *
 * 1. **Best-member substitution** — the member with the highest capability in the
 *    step's required Reach acts for that step. This is what makes a company read as
 *    an ensemble: the scholar handles the ciphered door, the brawler handles what
 *    comes through it. Step outcomes (injury, glory, conditions) land on the acting
 *    member, not on the leader (user-accepted default, grill Q3 rider).
 *
 * 2. **Capped assist** — every *other* member who clears
 *    `GROUP_ASSIST_MIN_TIER` in that Reach contributes `GROUP_ASSIST_PER_MEMBER`,
 *    summed and capped at `GROUP_ASSIST_CAP`. The cap is why a company of ten is not
 *    ten times a lone agent: help has sharply diminishing returns.
 *
 * A company at `bound` cohesion adds `GROUP_BOUND_RESOLUTION_BONUS` on top.
 *
 * The mechanical actor of the encounter stays an individual throughout — no
 * awareness, encounter, or position system ever meets a positionless group actor.
 */

import type { WorldGraph } from '../graph';
import type { ReachDomain } from '../../types/traits';
import { computeCapability, computeTier } from '../domainCapability';
import { getGroupMembers, getGroupCohesion, getCohesionState } from './groupQueries';
import {
  GROUP_ASSIST_PER_MEMBER,
  GROUP_ASSIST_CAP,
  GROUP_ASSIST_MIN_TIER,
  GROUP_BOUND_RESOLUTION_BONUS,
} from '../../data/group-constants';

export interface GroupStepResolution {
  /** The member who acts for this step (may be the nominal protagonist). */
  actingMemberId: string;
  actingMemberName: string;
  /** Additive bonus from assisting members, already capped. */
  assistBonus: number;
  /** How many members qualified as assists. */
  assistCount: number;
  /** Additive bonus for a `bound` company; 0 otherwise. */
  cohesionBonus: number;
  /** `assistBonus + cohesionBonus` — what the caller adds to the step modifier. */
  totalBonus: number;
}

/**
 * Resolve who acts and what the company contributes for one step.
 *
 * Returns undefined when the company has no usable members, in which case the
 * caller resolves the step as an ordinary individual action (fail-soft table row:
 * "Group-eligible template fires for a disbanded/missing group → resolve as
 * individual, no assist").
 */
export function resolveGroupStep(
  graph: WorldGraph,
  groupId: string,
  stepReach: ReachDomain,
  fallbackActorId: string,
): GroupStepResolution | undefined {
  const members = getGroupMembers(graph, groupId);
  if (members.length === 0) return undefined;

  // Best member for this Reach. Ties break on id so the same state always picks
  // the same protagonist (NFP #3).
  const ranked = members
    .map(m => ({ member: m, capability: safeCapability(graph, m.id, stepReach) }))
    .sort((a, b) => b.capability - a.capability || a.member.id.localeCompare(b.member.id));

  const acting = ranked[0] ?? undefined;
  if (!acting) return undefined;

  // Assists: everyone else who clears the tier gate.
  let assistCount = 0;
  for (const entry of ranked.slice(1)) {
    if (computeTier(entry.capability) >= GROUP_ASSIST_MIN_TIER) assistCount++;
  }
  const assistBonus = Math.min(GROUP_ASSIST_CAP, assistCount * GROUP_ASSIST_PER_MEMBER);

  const group = graph.getNode(groupId);
  const cohesionBonus =
    getCohesionState(getGroupCohesion(group)) === 'bound' ? GROUP_BOUND_RESOLUTION_BONUS : 0;

  return {
    actingMemberId: acting.member.id || fallbackActorId,
    actingMemberName: acting.member.name,
    assistBonus,
    assistCount,
    cohesionBonus,
    totalBonus: assistBonus + cohesionBonus,
  };
}

/** Capability read that can never throw or return NaN into the ranking sort. */
function safeCapability(graph: WorldGraph, agentId: string, reach: ReachDomain): number {
  try {
    const value = computeCapability(graph, agentId, reach);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}
