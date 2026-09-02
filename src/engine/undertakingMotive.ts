// src/engine/undertakingMotive.ts
//
// The destroy motive gate (THR-1297 §2; grammar verdict THR-1281 §4).
//
// A destroy verb that names a `motiveGate` is refused unless the actor holds one of
// the named motives toward whoever owns the target. No motiveless demolition; every
// destroy narratable, which is what doc 4's grievance minting consumes downstream.
//
// This module introduces no relation of its own. Each of the four motives reads a
// mechanism the world already writes:
//
//   grudge            — a `hostile_to` edge minted by a group engagement
//   rivalry           — any other standing `hostile_to` from actor toward owner
//   contested_ambition— actor and owner both actively `pursues` the same ambition node
//   faction_war       — the two factions are declared rivals (`relates_to.isRival`)
//
// NFP #2 (Inspectability): the result names *which* motive licensed the verb, so the
//   trace can say why a razing was allowed rather than only that it was.
// NFP #3 (Determinism): pure reads, no RNG, stable iteration over graph edge order.
// NFP #4 (Fail-soft): a missing node, a malformed edge, or an unowned target all
//   resolve to a refusal reason — never a throw.

import type { WorldGraph } from './graph';
import type { MotiveKind, StrategicActionTemplate } from '../types/strategicAction';
import { getAgentFaction } from './graphQueries';
import { areFactionsHostile } from './factionNetwork';

/**
 * The `hostile_to` provenance values that mean "a specific past injury" rather than a
 * standing rivalry.
 *
 * `writeGrudge` (band opposition) stamps `cause: 'group_engagement'`. The other two
 * `hostile_to` writers stamp their provenance under *different* keys — excommunication
 * uses `reason`, mentorship severance uses `basis` — so this reader checks all three
 * rather than assuming one. That key divergence is a real inconsistency in the edge's
 * writers; it is read around here rather than migrated, because renaming a live edge
 * property is a destructive change and this gate only needs to classify.
 */
const GRUDGE_PROVENANCE = new Set(['group_engagement', 'mentorship_break']);

const HOSTILE_PROVENANCE_KEYS = ['cause', 'reason', 'basis'] as const;

/** Why a destroy candidate was allowed, or why it was not. */
export interface MotiveGateResult {
  readonly allowed: boolean;
  /** The motive that licensed the verb — set only when `allowed`. */
  readonly motive?: MotiveKind;
  /** The owner the motive is held toward — set only when `allowed`. */
  readonly ownerId?: string;
  /**
   * How many owners the target had. `0` means the refusal is "nobody owns this", which
   * reads very differently from "the actor has no quarrel with the owner" and is worth
   * separating in the trace.
   */
  readonly ownerCount: number;
}

const ALLOWED_UNGATED: MotiveGateResult = { allowed: true, ownerCount: 0 };

/**
 * Who has a claim on this node today.
 *
 * Reads the three claim edges: `controls` (faction territory and strategic control),
 * `commanded_by` (group-family leadership), and `owns` (personal holdings). This is the
 * single place that knows about them — every caller asks through here rather than
 * walking edges itself.
 *
 * The `owns` arm landed with THR-1298, closing the gap this docblock had promised since
 * slice 2. Without it an agent-owned holding was invisible to the motive gate *and* to
 * grievance attribution: a razing of someone's own workshop resolved to "nobody owns
 * this", which both refused the destroy and left the harm with no victim to mint from.
 * `owns` runs actor → node (single writer, `holdings.ts`), so owners are the sources of
 * the *incoming* edges — the opposite direction from `commanded_by` below it.
 *
 * Returns actor ids in graph edge order, deduplicated.
 */
export function resolveTargetOwners(graph: WorldGraph, targetNodeId: string): readonly string[] {
  const owners = new Set<string>();
  try {
    for (const edge of graph.getIncomingEdges(targetNodeId, 'controls')) {
      if (edge.source !== targetNodeId) owners.add(edge.source);
    }
    for (const edge of graph.getOutgoingEdges(targetNodeId, 'commanded_by')) {
      if (edge.target !== targetNodeId) owners.add(edge.target);
    }
    for (const edge of graph.getIncomingEdges(targetNodeId, 'owns')) {
      if (edge.source !== targetNodeId) owners.add(edge.source);
    }
  } catch {
    // Fail-soft: an unreadable graph answers "unowned", which refuses the destroy.
    // Refusing a razing we cannot justify is the safe direction of this failure.
  }
  return [...owners];
}

/**
 * Whether `actorId` holds `motive` toward `ownerId`.
 *
 * Order matters for the two `hostile_to` motives: grudge is the more specific reading
 * of the same edge, so a caller that accepts both gets `grudge` named when the edge
 * carries an injury provenance and `rivalry` when it does not.
 */
export function holdsMotive(
  graph: WorldGraph,
  actorId: string,
  ownerId: string,
  motive: MotiveKind,
): boolean {
  if (actorId === ownerId) return false;

  switch (motive) {
    case 'grudge':
      return hostileEdges(graph, actorId, ownerId).some(isInjuryProvenance);

    case 'rivalry':
      return hostileEdges(graph, actorId, ownerId).some(props => !isInjuryProvenance(props));

    case 'contested_ambition':
      return sharesActiveAmbition(graph, actorId, ownerId);

    case 'faction_war': {
      const actorFaction = getAgentFaction(graph, actorId)?.faction.id;
      const ownerFaction = getAgentFaction(graph, ownerId)?.faction.id;
      // The owner may *be* a faction rather than belong to one — territory is held by
      // faction nodes, so this is the common case, not an edge case.
      return areFactionsHostile(graph, actorFaction ?? actorId, ownerFaction ?? ownerId);
    }

    default:
      // An unknown motive licenses nothing. The registry's schema gate rejects one at
      // build time; this arm is the runtime half of the same refusal.
      return false;
  }
}

/**
 * Evaluate a template's motive gate against a concrete target.
 *
 * An ungated template is allowed unconditionally — the gate is opt-in, which is what
 * keeps this additive over the 42 templates that never needed it.
 */
export function evaluateMotiveGate(
  graph: WorldGraph,
  actorId: string,
  targetNodeId: string,
  template: StrategicActionTemplate,
): MotiveGateResult {
  const gate = template.motiveGate;
  if (!gate || gate.length === 0) return ALLOWED_UNGATED;

  const owners = resolveTargetOwners(graph, targetNodeId);
  if (owners.length === 0) {
    // Nobody holds this, so there is nobody the destruction is aimed at. A gated verb
    // asked for a reason and the world supplied none, so it is refused — a destroy
    // that should have fired costs a candidate, one that fires unaimed costs the
    // chronicle its "why".
    return { allowed: false, ownerCount: 0 };
  }

  for (const ownerId of owners) {
    for (const motive of gate) {
      if (holdsMotive(graph, actorId, ownerId, motive)) {
        return { allowed: true, motive, ownerId, ownerCount: owners.length };
      }
    }
  }

  return { allowed: false, ownerCount: owners.length };
}

// ─── Readers ────────────────────────────────────────────────────────

function hostileEdges(
  graph: WorldGraph,
  actorId: string,
  ownerId: string,
): readonly Record<string, unknown>[] {
  try {
    return graph.getOutgoingEdges(actorId, 'hostile_to')
      .filter(e => e.target === ownerId)
      .map(e => e.properties as Record<string, unknown>);
  } catch {
    return [];
  }
}

function isInjuryProvenance(properties: Record<string, unknown>): boolean {
  return HOSTILE_PROVENANCE_KEYS.some(key => {
    const value = properties[key];
    return typeof value === 'string' && GRUDGE_PROVENANCE.has(value);
  });
}

/**
 * Two actors actively pursuing the same ambition node.
 *
 * `pursues` targets an ambition node, so "overlapping" is node identity rather than a
 * milestone-name comparison: two agents on the same ambition node are competing for
 * the same thing by construction. Both sides must be `active` — a resolved ambition is
 * a memory, not a contest.
 */
function sharesActiveAmbition(graph: WorldGraph, actorId: string, ownerId: string): boolean {
  const activeTargets = (id: string): Set<string> => {
    const set = new Set<string>();
    try {
      for (const edge of graph.getOutgoingEdges(id, 'pursues')) {
        if (edge.properties.status === 'active') set.add(edge.target);
      }
    } catch {
      // Fail-soft: unreadable ambitions contest nothing.
    }
    return set;
  };

  const mine = activeTargets(actorId);
  if (mine.size === 0) return false;
  for (const target of activeTargets(ownerId)) {
    if (mine.has(target)) return true;
  }
  return false;
}
