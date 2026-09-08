/**
 * The one writer of a group's command (THR-1438).
 *
 * `commanded_by` is written at four sites today — army spawning (twice), company
 * formation, and the strategic mint — each with its own id form and its own
 * `member_of` role bookkeeping. Three of those are **spawn-time** writers: they say
 * who a group was raised under, and they are left alone. The fourth,
 * `promoteNewLeader` in the dissolution sweep, is the only one that *changes* a
 * standing command, and it did so silently, inside a sweep, as a side effect of
 * somebody dying — a leak dressed as succession.
 *
 * This module is where a command changes hands. The dissolution sweep calls it with
 * `'promotion'`; `claim × Company`, `claim × Army`, `seize × Company` (a mutiny) and
 * `seize × Army` (a coup) call it with their own `via`, so every command edge in the
 * world can say *how* its holder came to hold it. That `via` is the whole reason the
 * cells could not simply write the edge themselves: a claim and a promotion produce
 * the same edge and mean opposite things, and the roster, the war readout and the
 * chronicle all read the edge rather than the event that made it.
 *
 * NFP: Inspectability (`via` on every changed command), Fail-soft (a missing group or
 * actor writes nothing and says so), Additive (the spawn writers keep their ids).
 */

import type { GameState } from '../../types/gameState';
import { getGroupMemberEdges } from './groupQueries';

/**
 * How a commander came to command.
 *
 * `'formation'` is reserved for the spawn-time writers, which do not route through
 * here yet; it exists so a reader of the edge has the whole vocabulary rather than
 * having to treat an absent `via` as a fifth, unnamed case.
 */
export type CommandVia = 'formation' | 'promotion' | 'claim' | 'mutiny' | 'coup';

export interface SetCommanderResult {
  readonly success: boolean;
  /** Why nothing was written, when nothing was. */
  readonly error?: 'group_gone' | 'actor_gone';
  /** The commander this replaced, when there was one — the deposed, for the ops that owe them a grudge. */
  readonly previousCommanderId?: string;
}

/**
 * Point `commanded_by` at `actorId`, and make the membership roles agree.
 *
 * Every existing `commanded_by` out of the group is removed first — a group has one
 * commander, and a second edge would make `getGroupLeader` (which reads the first)
 * depend on insertion order. The new commander gains a `member_of` edge if they had
 * none (a claimant who stood where the company stood rather than marching with it),
 * and every other member's role is set to `member`.
 *
 * Never throws. Returns the deposed commander's id so a mutiny or a coup can write
 * the grudge it owes without re-reading the edge it just removed.
 */
export function setCommander(
  state: GameState,
  groupId: string,
  actorId: string,
  via: CommandVia,
  tick: number,
): SetCommanderResult {
  const graph = state.graph;
  try {
    const group = graph.getNode(groupId);
    if (!group) return { success: false, error: 'group_gone' };
    const actor = graph.getNode(actorId);
    if (!actor) return { success: false, error: 'actor_gone' };

    let previousCommanderId: string | undefined;
    for (const edge of graph.getOutgoingEdges(groupId, 'commanded_by')) {
      if (!previousCommanderId && edge.target !== actorId) previousCommanderId = edge.target;
      graph.removeEdge(edge.id);
    }

    graph.addEdge({
      id: `e_commanded_by_${groupId}_${tick}`,
      source: groupId,
      target: actorId,
      type: 'commanded_by',
      properties: { assignedTick: tick, via },
    });

    // The new commander may not have been a member — a claim is open to anyone
    // standing where the group stands. Written before the role sweep so the sweep
    // sees it and stamps `leader` on it like any other.
    const memberEdges = getGroupMemberEdges(graph, groupId);
    if (!memberEdges.some(e => e.source === actorId)) {
      graph.addEdge({
        id: `e_member_of_${actorId}_${groupId}_${tick}`,
        source: actorId,
        target: groupId,
        type: 'member_of',
        properties: { joinedTick: tick, role: 'leader' },
      });
    }

    // Reflect the new role on every membership edge so UI and prose agree.
    for (const edge of getGroupMemberEdges(graph, groupId)) {
      const isLeader = edge.source === actorId;
      if ((edge.properties?.role === 'leader') !== isLeader) {
        graph.updateEdge(edge.id, {
          properties: { ...edge.properties, role: isLeader ? 'leader' : 'member' },
        });
      }
    }

    return { success: true, ...(previousCommanderId ? { previousCommanderId } : {}) };
  } catch {
    // Fail-soft (NFP #4): a command that could not be written costs a story, never
    // the tick. The group keeps whichever commander it had.
    return { success: false, error: 'group_gone' };
  }
}
