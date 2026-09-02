// src/engine/grievance/grudgeEdge.ts
//
// The one writer of `hostile_to` between two agents (THR-1298 slice 5).
//
// Band opposition has written this edge since THR-731; the grievance lifecycle needs
// the same edge when a vendetta cools into a standing grudge. Rather than add a second
// writer with its own spelling, the band's helper moved here and both callers pass
// their own `cause`.
//
// **Provenance lives under `cause`, and this file is why it does not spread.** The
// three existing `hostile_to` writers stamp provenance under three different keys —
// band opposition `cause`, excommunication `reason`, mentorship severance `basis` —
// which `undertakingMotive.ts` reads around rather than migrates, because renaming a
// live edge property is destructive. A fourth key would widen a divergence that is
// already documented as a defect, so the grievance writer joins the `cause` camp
// instead of inventing one (plan § Graph nodes / edges).

import type { WorldGraph } from '../graph';

/**
 * Why a grudge stands between two agents.
 *
 * A closed set rather than a free string: `undertakingMotive.GRUDGE_PROVENANCE`
 * classifies these values to decide whether a destroy verb is licensed, and a typo in a
 * free-form cause would silently read as "no grudge" — a motive gate that fails open on
 * a misspelling is worse than one that fails closed on an unknown enum.
 */
export type GrudgeCause = 'group_engagement' | 'grievance_cooled';

export interface WriteGrudgeOptions {
  /** The event node the grudge traces back to, when one exists. */
  readonly sourceEventId?: string;
}

/**
 * Write the standing grudge both ways, idempotently.
 *
 * Bidirectional because a grudge is a state of the relationship, not of one party:
 * having razed someone's home puts you at odds with them whether or not you feel
 * wronged in return.
 *
 * Returns whether any edge was newly written. Existing edges are left exactly as they
 * are — refreshing `since` on every pass would make an old grudge indistinguishable
 * from a fresh one, and the re-ignition rule reads that edge's existence, not its age.
 *
 * @returns true when at least one direction was newly created.
 */
export function writeGrudge(
  graph: WorldGraph,
  a: string,
  b: string,
  tick: number,
  cause: GrudgeCause,
  options: WriteGrudgeOptions = {},
): boolean {
  // Self-grudge is meaningless and would make `hasGrudge` answer true for every agent
  // who ever harmed anything of their own (the self-facing abandonment path).
  if (a === b) return false;

  let wrote = false;
  for (const [from, to] of [[a, b], [b, a]] as const) {
    const existing = graph.getOutgoingEdges(from, 'hostile_to').find(e => e.target === to);
    if (existing) continue;
    try {
      graph.addEdge({
        id: `e_hostile_to_${from}_${to}`,
        source: from,
        target: to,
        type: 'hostile_to',
        properties: {
          since: tick,
          cause,
          ...(options.sourceEventId && { sourceEventId: options.sourceEventId }),
        },
      });
      wrote = true;
    } catch {
      // Fail-soft: a missing grudge costs prose, never correctness (NFP #4).
    }
  }
  return wrote;
}

/**
 * Whether a grudge already stands between these two, in either direction.
 *
 * Either direction, because `writeGrudge` writes both and a half-written pair (one
 * `addEdge` threw) should still read as "these two have history" rather than as a
 * clean slate.
 */
export function hasGrudge(graph: WorldGraph, a: string, b: string): boolean {
  return graph.getOutgoingEdges(a, 'hostile_to').some(e => e.target === b)
    || graph.getOutgoingEdges(b, 'hostile_to').some(e => e.target === a);
}
