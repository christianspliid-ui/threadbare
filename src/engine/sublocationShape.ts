/**
 * Sublocation node shape — the single discriminator for the sublocation tier.
 *
 * THR-1183. Sublocations used to reach the graph in two incompatible node shapes:
 * `sublocation.ts` (the canonical, worldgen-volume writer) minted `type: 'location'`
 * carrying `sublocationTypeId`/`parentLocationId`, while
 * `strategicGraphOps.createSublocation` minted `type: 'sublocation'` outright. Readers
 * then hand-rolled their own discriminator, and each one saw only half the world:
 * `getNodesByType('location')` sweeps missed every strategic sublocation, and
 * `getNodesByType('sublocation')` sweeps missed every canonical one.
 *
 * The resolution (THR-1183): **one mint shape — `type: 'location'` carrying
 * `parentLocationId`** — and one predicate, this module, through which every reader
 * asks the question. `'sublocation'` stays a registered `NodeType` (THR-1177) and is
 * still *accepted* here, because **saved worlds** can carry it; since THR-1193 it has
 * **no production writer at all**. (THR-1183 left one behind — the
 * `hex.restore_fragment` graph-op recipe — and THR-1193 converted it, so the tolerance
 * below is now a pure back-compat read path.) Tolerating it costs one `||` and is what
 * NFP #4 (fail-soft) asks for — a legacy node must degrade to "still a sublocation",
 * never to "invisible".
 *
 * The discriminator is `parentLocationId`, not a subtype string, because that is what
 * `encounterAftermath` already treated as authoritative when deciding whether `$target`
 * binds the sublocation field or the location field — the two tiers carry different tax
 * and gating semantics, so the same node must never satisfy both.
 *
 * Note `properties.locationSubtype === 'sublocation'` and
 * `properties.locationType === 'sublocation'` appear only in test fixtures — no
 * production writer has ever emitted either. They are not accepted here; a fixture
 * inventing a shape proves nothing about production and must not become a constraint.
 *
 * NFP priorities: Inspectability (one place to read the rule), Fail-soft (legacy
 * shape still resolves), Additive over destructive (the retired shape is tolerated,
 * not rejected).
 */

import type { WorldGraph } from './graph';
import type { GraphNode, NodeType } from '../types/graph';

/**
 * The legacy node type retired as a *write* shape by THR-1183 (last writer converted
 * under THR-1193) and still accepted as a *read* shape for saved worlds. Named rather
 * than inlined so every tolerance site greps to one symbol.
 */
export const LEGACY_SUBLOCATION_NODE_TYPE: NodeType = 'sublocation';

/**
 * True when `node` occupies the sublocation tier, under either shape.
 *
 * Accepts the canonical shape (`type: 'location'` with a `parentLocationId`) and the
 * legacy shape (`type: 'sublocation'`, whatever its properties carry — a legacy node
 * that lost its `parentLocationId` is still a sublocation, just an unresolvable one).
 */
export function isSublocationNode(node: GraphNode | undefined | null): boolean {
  if (!node) return false;
  // `node.type` is widened to string: the legacy literal is a registered NodeType, but
  // saved worlds predate the registration and the property bag is untyped either way.
  if ((node.type as string) === LEGACY_SUBLOCATION_NODE_TYPE) return true;
  return node.type === 'location' && typeof node.properties?.parentLocationId === 'string';
}

/**
 * True when `node` is a place at the hex/settlement/waypoint tier — a location that is
 * deliberately *not* a sublocation.
 *
 * The complement of {@link isSublocationNode} within location nodes, not its negation:
 * an actor node is neither.
 */
export function isPlaceTierLocation(node: GraphNode | undefined | null): boolean {
  if (!node) return false;
  return node.type === 'location' && !isSublocationNode(node);
}

/**
 * Every sublocation in the graph, under either shape, in stable insertion order
 * (canonical shape first, then any legacy nodes).
 *
 * Use this in place of `graph.getNodesByType('sublocation')`, which since THR-1183
 * returns only legacy nodes and so reports an empty world on a normally-generated map.
 */
export function getSublocationNodes(graph: WorldGraph): GraphNode[] {
  const canonical = graph.getNodesByType('location').filter(isSublocationNode);
  const legacy = graph.getNodesByType(LEGACY_SUBLOCATION_NODE_TYPE);
  return [...canonical, ...legacy];
}

/**
 * Every place-tier location — the sweep that wants settlements and waypoints without
 * the sublocations nested inside them.
 *
 * Since THR-1183 a bare `getNodesByType('location')` returns both tiers, so a caller
 * that means "settlements" must say so. (It returned both tiers before THR-1183 too —
 * the canonical writer has always minted `type: 'location'` — so this is a
 * long-standing trap this function names rather than a new one.)
 */
export function getPlaceTierLocations(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('location').filter(isPlaceTierLocation);
}

/**
 * Resolve `node` up to the location that contains it, so callers reading hex
 * coordinates or region ids land on the place tier.
 *
 * Returns `node` unchanged when it is not a sublocation, and `undefined` when it is a
 * sublocation whose `parentLocationId` is missing or dangling — the two failure modes a
 * caller must distinguish, since the first is "nothing to do" and the second is
 * "unresolvable" (fail-soft: never throws).
 */
export function resolveToParentLocation(
  graph: WorldGraph,
  node: GraphNode | undefined | null,
): GraphNode | undefined {
  if (!node) return undefined;
  if (!isSublocationNode(node)) return node;
  const parentId = node.properties?.parentLocationId;
  if (typeof parentId !== 'string' || parentId.length === 0) return undefined;
  return graph.getNode(parentId);
}
