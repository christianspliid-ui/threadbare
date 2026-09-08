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
 *
 * `'old_quarrel'` is the one member deliberately **absent** from `GRUDGE_PROVENANCE`
 * (THR-1437): a quarrel the world was seeded with is history, not an injury anybody
 * saw, so the motive gate must read it as `rivalry` — which licenses lower, seize and
 * destroy on things — and never as `grudge`, which licenses the plot.
 */
export type GrudgeCause =
  | 'group_engagement'
  | 'grievance_cooled'
  | 'old_quarrel'
  // THR-1438 — the two injuries of the ownership band. Both **are** in
  // `GRUDGE_PROVENANCE`, unlike `'old_quarrel'`: being deposed by one of your own and
  // being reached for by someone who wanted your seat are things that happened *to*
  // you, with a name attached, so they license the plot the way any other injury does.
  | 'command_seized'
  | 'usurpation_failed';

export interface WriteGrudgeOptions {
  /** The event node the grudge traces back to, when one exists. */
  readonly sourceEventId?: string;
  /**
   * Rewrite a standing edge's `cause` when this one is an injury and the standing one
   * is not (THR-1438).
   *
   * Without it the ownership band's three ops would never record their injury. A
   * mutiny, a coup and a usurpation are all **motive-gated on hostility**, so by the
   * time one completes a `hostile_to` between the two almost always exists already —
   * a `covets`, an `old_quarrel` — and this writer's default is to leave an existing
   * edge exactly as it is. The provenance would then read as mere rivalry forever,
   * and the person who was deposed would hold no licence to plot back.
   *
   * Only ever an upgrade: an edge that already carries an injury cause keeps it, so
   * the *first* wound named is the one that stands. `since` is untouched — the
   * relationship is as old as it was; what changed is what it is now about.
   */
  readonly upgradeCause?: boolean;
}

/**
 * The causes that read as an injury rather than as friction.
 *
 * Mirrors `undertakingMotive.GRUDGE_PROVENANCE` for the members this file owns; the
 * gate's own set is the authority and covers the causes written by other lanes
 * (`mentorship_break`, `attempted_killing`) that never pass through here.
 */
const INJURY_CAUSES: ReadonlySet<string> = new Set<GrudgeCause>([
  'group_engagement', 'grievance_cooled', 'command_seized', 'usurpation_failed',
]);

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
    if (existing) {
      // THR-1438: an injury arriving on top of mere friction renames what the
      // relationship is about. Never the reverse, and never a second injury over the first.
      if (options.upgradeCause && INJURY_CAUSES.has(cause)) {
        const standing = existing.properties?.cause;
        if (typeof standing !== 'string' || !INJURY_CAUSES.has(standing)) {
          try {
            graph.updateEdge(existing.id, {
              properties: { ...existing.properties, cause, causeUpgradedTick: tick },
            });
          } catch {
            // Fail-soft: the edge keeps the cause it had.
          }
        }
      }
      continue;
    }
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

/**
 * The covet rivalry's provenance (THR-1388). Deliberately **not** a `GrudgeCause`:
 * `undertakingMotive.GRUDGE_PROVENANCE` does not list it, so the gate reads the edge
 * as `rivalry` (two mortals in each other's way), never `grudge` (one wronged the
 * other) — a covet cannot mint a vendetta by itself; only the harm it licenses can.
 */
export type CovetCause = 'covets';

export interface WriteCovetRivalryOptions {
  /** The holding the mortal kept reaching for. */
  readonly sourceTargetId?: string;
}

/**
 * Write the covet rivalry one way — actor → owner — idempotently.
 *
 * One direction, unlike `writeGrudge`: coveting is a state of the coveter, not of the
 * relationship. The owner has done nothing and holds no quarrel until a harm arrives,
 * at which point the existing lane writes the grudge both ways.
 *
 * @returns true when the edge was newly created.
 */
export function writeCovetRivalry(
  graph: WorldGraph,
  actorId: string,
  ownerId: string,
  tick: number,
  options: WriteCovetRivalryOptions = {},
): boolean {
  if (actorId === ownerId) return false;
  const existing = graph.getOutgoingEdges(actorId, 'hostile_to').find(e => e.target === ownerId);
  if (existing) return false;
  try {
    const cause: CovetCause = 'covets';
    graph.addEdge({
      id: `e_hostile_to_${actorId}_${ownerId}`,
      source: actorId,
      target: ownerId,
      type: 'hostile_to',
      properties: {
        since: tick,
        cause,
        ...(options.sourceTargetId && { sourceTargetId: options.sourceTargetId }),
      },
    });
    return true;
  } catch {
    // Fail-soft: a missing rivalry costs a story, never correctness (NFP #4).
    return false;
  }
}
