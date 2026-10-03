/**
 * Allegiance — whether two mortals are on the same side (THR-1683).
 *
 * Moved out of `src/data/undertaking-objects.ts`, where it was the private blessing
 * half of `create × Condition`'s sign (THR-1429). The cast resolver needs the same
 * reading for a spell's `targeting.filter`, and `undertaking-objects` already imports
 * `spellCasting`, so importing it back from there would close a cycle. One reading,
 * one home: both callers ask this module.
 *
 * Fail-soft (NFP #4): every read is an edge walk with no throw path; a missing node
 * reads as "not an ally".
 */

import type { WorldGraph } from './graph';
import { getGroupOf } from './groups/groupQueries';
import { CONDITION_ALLY_STANDING_MIN } from '../data/strategic-action-constants';

/** The first faction the actor is a member of, if any. */
export function actorFactionId(graph: WorldGraph, actorId: string): string | null {
  for (const e of graph.getOutgoingEdges(actorId, 'member_of')) {
    const n = graph.getNode(e.target);
    if (n?.type === 'actor' && n.properties.actorType === 'faction') return n.id;
  }
  return null;
}

/**
 * Whether two mortals are allies — the blessing half of the condition sign, and the
 * `ally` reading of a spell's target filter.
 *
 * Three readings in order, the first that answers wins: the same faction, the same
 * company, or standing at or above `CONDITION_ALLY_STANDING_MIN`. Self is handled by
 * the caller, because blessing oneself needs no test at all.
 */
export function isAlly(graph: WorldGraph, actorId: string, targetId: string): boolean {
  const actorFaction = actorFactionId(graph, actorId);
  if (actorFaction && actorFaction === actorFactionId(graph, targetId)) return true;

  // Compare ids, not node objects — `getGroupOf` returns a fresh handle per call.
  const actorGroup = getGroupOf(graph, actorId)?.id;
  if (actorGroup && actorGroup === getGroupOf(graph, targetId)?.id) return true;

  for (const e of graph.getOutgoingEdges(actorId, 'reputation_with')) {
    if (e.target !== targetId) continue;
    const score = e.properties.score;
    if (typeof score === 'number' && Number.isFinite(score) && score >= CONDITION_ALLY_STANDING_MIN) return true;
  }
  return false;
}
