/**
 * The remote-anchor rule — THR-1296 §6 (THR-1290 §5), slice 5.
 *
 * > "A remote undertaking must anchor through an entity the agent commands at or near
 * > the site; no anchor → the remote verb is simply not offered."
 *
 * ## Why this is one function
 *
 * The gate is asked twice — at proposal, so a reachless remote verb never becomes a
 * decision, and again at re-bind, so an undertaking whose anchor died does not quietly
 * carry on. The mentorship eligibility check is the cautionary tale this follows: it
 * lived in two copies (candidate generation and the phase) that had *already drifted*
 * by the time THR-1292 retired one of them. So the answer lives here, once, and both
 * callers import it.
 *
 * ## The edge direction, encapsulated
 *
 * `commanded_by` runs **army → commander**. Three separate files carry a comment
 * warning about that direction, which is the strongest possible evidence that the
 * fourth reader will get it wrong. Nobody outside this module should have to know:
 * ask {@link getCommandedEntities} for what an agent commands and the direction is
 * this module's problem.
 *
 * ## What counts as commanded, v1
 *
 * Armies and warhosts, via `commanded_by`. A company's position is its leader's
 * (`getGroupPosition`), so a company the agent leads is a *degenerate* anchor — it
 * sits exactly where the agent does and can therefore never satisfy a range test the
 * agent themself failed. It is included for correctness, and noted as degenerate
 * rather than special-cased away: the moment companies can be detached, it becomes a
 * real anchor with no code change.
 *
 * **Deliberately not anchor sources**, each for a stated reason:
 * - `controls` — scheduled for deletion (THR-1303), and a two-population split today.
 * - `leads` — a faction has no hex, so it cannot be *at* a site.
 * - `thread` — the god's edge, not the agent's.
 * - `owes_favor` — leverage, not command. A plausible soft tier later; recorded, not built.
 *
 * With armies alone, remote undertakings are **rare** in v1. That is honest rather
 * than a defect: the rule's payload arrives with the T1 network kind
 * ([THR-1288](https://linear.app/threadbare/issue/THR-1288)) and doc 2's holdings,
 * both of which register into this same helper.
 */
import type { WorldGraph } from '../graph';
import { isArmyGroupNode } from '../groupShape';
import type { GraphNode } from '../../types/graph';
import { hexDistance } from '../../lib/hexMath';
import { resolveLocationToHex } from '../encounterAwareness';
import { getGroupPosition } from '../groups/groupQueries';
import {
  BINDER_REMOTE_RANGE_HEXES,
  BINDER_REMOTE_ANCHOR_RANGE_HEXES,
} from '../../data/binder-constants';

/** The ledger key a winning anchor binds under. Reserved — never an authored cast key. */
export const ANCHOR_CAST_KEY = '$anchor';

export interface RemoteAnchor {
  readonly nodeId: string;
  readonly name: string;
  /** `degenerate` marks a company, whose position is the agent's own (see module doc). */
  readonly kind: 'army' | 'degenerate';
  readonly hex: { col: number; row: number };
  /** Hex distance from the anchor to the undertaking's site. */
  readonly distanceToSite: number;
}

/**
 * Everything this agent commands.
 *
 * The `commanded_by` edge runs army → commander, so the agent's commanded entities are
 * the **sources** of its *incoming* edges. This is the only place that spelling appears.
 */
export function getCommandedEntities(graph: WorldGraph, agentId: string): GraphNode[] {
  const out: GraphNode[] = [];
  const seen = new Set<string>();
  for (const edge of graph.getIncomingEdges(agentId, 'commanded_by')) {
    if (seen.has(edge.source)) continue;
    seen.add(edge.source);
    const node = graph.getNode(edge.source);
    if (node) out.push(node);
  }
  return out;
}

/** Where a commanded entity stands, resolved to a hex. */
function anchorHex(
  graph: WorldGraph,
  node: GraphNode,
): { col: number; row: number } | null {
  // An army carries its own `located_at`; a company borrows its leader's.
  const direct = graph.getOutgoingEdges(node.id, 'located_at')[0]?.target;
  const locationId = direct ?? getGroupPosition(graph, node.id);
  if (!locationId) return null;
  return resolveLocationToHex(graph, locationId);
}

/**
 * Does this undertaking need a commanded anchor at all?
 *
 * **Two conditions, and the first one is the deviation from the plan as written
 * (THR-1296 §6, measured at slice 5 — impediment #842).** §6 gated on distance alone:
 * *"a target beyond `BINDER_REMOTE_RANGE_HEXES` of the agent requires one"*. Shipped
 * that way it does not make remote undertakings **rare**, as §6 predicts — it makes
 * nearly all undertakings impossible, because on a real map almost every target is
 * more than two hexes away and almost no agent commands an army.
 *
 * Measured, not argued: the distance-only gate turned `trades_with` edges written in
 * the 120-tick seeded smoke from a healthy count to **zero**, and took seven
 * doom-identity milestone tests down with it — 8 failures across 2 files, all of them
 * subsystems with nothing to do with this plan. A controlled arm (this predicate
 * forced to `false`, nothing else changed) returned all 25 to green.
 *
 * The distance rule is not what was wrong; its **scope** was. "Remote" is a property
 * of the *verb* — commissioning, garrisoning, raiding are done through others —
 * not of how far the agent happens to be standing. An agent who walks four hexes to
 * survey a market is not acting remotely, they are walking. So remoteness is now
 * declared (`StrategicActionTemplate.remote`), which also makes this the same shape as
 * every other seam in this plan: the engine ships honoring it, doc 2 authors the rows,
 * and an emptiness-pinning test fails deliberately when the first one lands.
 *
 * Keeping it a named predicate rather than an inline comparison is what lets the
 * proposal site and the re-bind site agree by construction rather than by both
 * remembering the same `&&`.
 */
export function requiresRemoteAnchor(
  isRemoteVerb: boolean,
  travelDistanceHexes: number,
): boolean {
  return isRemoteVerb && travelDistanceHexes > BINDER_REMOTE_RANGE_HEXES;
}

/**
 * Every commanded entity standing near enough to the site to foot an undertaking there.
 *
 * Sorted nearest-first, ties broken by node id, so the winner is deterministic across
 * a replayed seed (NFP #3) — an anchor chosen by graph iteration order would make the
 * whole downstream cast non-reproducible.
 *
 * Fail-soft (NFP #4): an entity with no resolvable position is skipped, not thrown on.
 */
export function findRemoteAnchors(
  graph: WorldGraph,
  agentId: string,
  siteHex: { col: number; row: number } | null | undefined,
): RemoteAnchor[] {
  if (!siteHex) return [];

  const anchors: RemoteAnchor[] = [];
  for (const node of getCommandedEntities(graph, agentId)) {
    const hex = anchorHex(graph, node);
    if (!hex) continue;
    const distanceToSite = hexDistance(hex, siteHex);
    if (distanceToSite > BINDER_REMOTE_ANCHOR_RANGE_HEXES) continue;
    anchors.push({
      nodeId: node.id,
      name: node.name ?? node.id,
      // An army is `type: 'actor'` + `actorType: 'group'` carrying an `armyState` bag —
      // there is no `'army'` NodeType, and testing for one would have classified every
      // anchor as degenerate forever while compiling cleanly under the THR-489 baseline.
      // Same shape as impediment #834's `getNodesByType('agent')`, reached from a second
      // direction: the plausible spelling is the wrong one.
      // THR-1297: asked through the shape module now, so the explicit `groupKind` tag wins
      // and the `armyState` presence test survives only as the back-compat fallback.
      kind: isArmyGroupNode(node) ? 'army' : 'degenerate',
      hex,
      distanceToSite,
    });
  }

  anchors.sort((a, b) =>
    a.distanceToSite !== b.distanceToSite
      ? a.distanceToSite - b.distanceToSite
      : a.nodeId.localeCompare(b.nodeId));
  return anchors;
}

/**
 * The gate, as one call: may this agent undertake this at this site, and through whom?
 *
 * `{ allowed: true, anchorNodeId: undefined }` is the local case — permitted, and
 * carrying no anchor because none was needed. Callers must not read a missing
 * `anchorNodeId` as a refusal.
 */
export type RemoteAnchorVerdict =
  | { readonly allowed: true; readonly anchorNodeId?: string; readonly anchor?: RemoteAnchor }
  | { readonly allowed: false; readonly reason: 'no_remote_anchor' };

export function evaluateRemoteAnchorGate(
  graph: WorldGraph,
  agentId: string,
  siteHex: { col: number; row: number } | null | undefined,
  travelDistanceHexes: number,
  isRemoteVerb: boolean,
): RemoteAnchorVerdict {
  if (!requiresRemoteAnchor(isRemoteVerb, travelDistanceHexes)) return { allowed: true };
  const [winner] = findRemoteAnchors(graph, agentId, siteHex);
  if (!winner) return { allowed: false, reason: 'no_remote_anchor' };
  return { allowed: true, anchorNodeId: winner.nodeId, anchor: winner };
}
