/**
 * Company Cohesion — THR-74
 *
 * Cohesion is event-driven: it moves when something happens to the company
 * (a shared success, a death, a dissent), never by passive per-tick drift. That
 * keeps the number legible — every change traces back to a narratable event.
 *
 * Cohesion is exposed to the player only as the prose ladder
 * (`bound`/`holding`/`frayed`/`breaking`, see `getCohesionState`). The raw number
 * belongs to the engine and the DebugPanel.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { getGroupCohesion, isGroupBlessed } from './groupQueries';
import {
  GROUP_COHESION_SUCCESS_DELTA,
  GROUP_COHESION_FAILURE_DELTA,
  GROUP_COHESION_SOCIAL_DELTA,
  GROUP_COHESION_DEATH_DELTA,
  GROUP_DISSENT_COHESION_HIT,
} from '../../data/group-constants';

/** The named events that move cohesion. Each maps to one constant. */
export type CohesionEvent =
  | 'encounter_success'
  | 'encounter_failure'
  | 'positive_social'
  | 'member_death'
  | 'dissent';

const EVENT_DELTAS: Record<CohesionEvent, number> = {
  encounter_success: GROUP_COHESION_SUCCESS_DELTA,
  encounter_failure: GROUP_COHESION_FAILURE_DELTA,
  positive_social: GROUP_COHESION_SOCIAL_DELTA,
  member_death: GROUP_COHESION_DEATH_DELTA,
  dissent: GROUP_DISSENT_COHESION_HIT,
};

/**
 * Apply one cohesion event to a company.
 *
 * Returns the delta actually applied — 0 when the event was suppressed. A Bless
 * this Company window suppresses *negative* dissent only: blessing a company stops
 * them bickering over the road, it does not make a comrade's death painless.
 *
 * Callers must `touchWorld(runtime)` after a non-zero return, since this mutates a
 * node property in place and the graph object identity does not change.
 */
export function applyCohesionEvent(
  graph: WorldGraph,
  groupId: string,
  event: CohesionEvent,
  tick: number,
): number {
  const node = graph.getNode(groupId);
  if (!node) return 0;

  if (event === 'dissent' && isGroupBlessed(node, tick)) return 0;

  const delta = EVENT_DELTAS[event];
  const before = getGroupCohesion(node);
  const after = Math.max(0, Math.min(1, before + delta));
  if (after === before) return 0;

  graph.updateNode(groupId, {
    properties: { ...node.properties, cohesion: after },
  });
  return after - before;
}

/**
 * Apply an explicit cohesion delta (used by Bless this Company, which is a
 * one-off divine boost rather than one of the systemic events).
 */
export function applyCohesionDelta(
  graph: WorldGraph,
  groupId: string,
  delta: number,
): number {
  const node = graph.getNode(groupId);
  if (!node) return 0;
  const before = getGroupCohesion(node);
  const after = Math.max(0, Math.min(1, before + delta));
  if (after === before) return 0;
  graph.updateNode(groupId, { properties: { ...node.properties, cohesion: after } });
  return after - before;
}

/**
 * Detect members lost since the last tick and charge the company for each.
 *
 * Death takes two shapes in this codebase and only one of them leaves a trace on
 * the edge:
 *
 *  - **Retained echo** — `aspects.ts` keeps apex mortals as nodes flagged
 *    `deceased: true`. The `member_of` edge survives, so it can simply be closed.
 *  - **Hard death** — `agentLifecycle.ts` calls `graph.removeNode`, which cascades
 *    and deletes every incident edge. The membership edge is *gone*, so there is
 *    nothing left to inspect.
 *
 * The second case is why the company keeps a `roster` of member ids: comparing it
 * against the live membership is the only way to notice someone who vanished
 * without a trace. A member who *left* is not a loss — their edge persists with
 * `leftAtTick`, which is exactly what distinguishes departure from death.
 *
 * Returns the number of cohesion deltas applied, and refreshes the stored roster.
 */
export function reconcileLostMembers(
  graph: WorldGraph,
  group: GraphNode,
  tick: number,
): number {
  let applied = 0;

  // Case 1 — the node is still there but marked dead. Close the edge.
  for (const edge of graph.getIncomingEdges(group.id, 'member_of')) {
    if (edge.properties?.leftAtTick != null) continue;
    const member = graph.getNode(edge.source);
    const gone = member == null
      || (member.properties as Record<string, unknown>).deceased === true
      || (member.properties as Record<string, unknown>).status === 'dead';
    if (!gone) continue;

    graph.updateEdge(edge.id, {
      properties: { ...edge.properties, leftAtTick: tick, leaveReason: 'death' },
    });
    applyCohesionEvent(graph, group.id, 'member_death', tick);
    applied++;
  }

  // Case 2 — the node and its edge both vanished. Only the stored roster remembers.
  const current = graph.getNode(group.id);
  const roster = ((current?.properties as Record<string, unknown> | undefined)?.roster as string[] | undefined) ?? [];
  const known = new Set(graph.getIncomingEdges(group.id, 'member_of').map(e => e.source));
  for (const memberId of roster) {
    if (known.has(memberId)) continue; // still a member, or left with an edge to prove it
    applyCohesionEvent(graph, group.id, 'member_death', tick);
    applied++;
  }

  refreshRoster(graph, group.id);
  return applied;
}

/**
 * Rewrite a company's `roster` to its current live membership.
 *
 * The roster is bookkeeping, not truth: `member_of` edges remain the authority on
 * who belongs. It exists solely so a cascade-deleted edge is still detectable.
 * Call it after any membership change.
 */
export function refreshRoster(graph: WorldGraph, groupId: string): void {
  const node = graph.getNode(groupId);
  if (!node) return;
  const live = graph
    .getIncomingEdges(groupId, 'member_of')
    .filter(e => e.properties?.leftAtTick == null)
    .map(e => e.source);
  graph.updateNode(groupId, { properties: { ...node.properties, roster: live } });
}
