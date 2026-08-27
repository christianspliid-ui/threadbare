/**
 * Group node shape — the single discriminator for the group family.
 *
 * THR-1297 slice 1 (plan doc 2/6 §4). Four different things reach the graph as
 * `type: 'actor'` + `actorType: 'group'`: a **company** (mortals who travel together),
 * an **army** (a faction's fielded force), a **battle** (the coordinator node two armies
 * both point at), and — landing with the undertaking kinds — a **network** (an owner's
 * web of contacts). Until now each was told apart by *which property bag happened to be
 * present*: `groupType` meant company, `armyState` meant army, `battleState` meant battle.
 *
 * That presence test is load-bearing in a place it cannot survive. `graphQueries`'
 * `isFactionMembershipEdge` rests on the premise *"companies are the only non-faction
 * `member_of` target"* — true today, **false the moment networks land**, because a network
 * takes `member_of` contact edges exactly as a company takes members. A network minted
 * without a discriminator would read as a faction to every one of the ~49 raw
 * `member_of` call sites, and each would report an agent's contact web as their faction.
 *
 * The resolution is `groupKind`: written at **every** mint site, read first by every
 * discriminator, with the old presence tests kept as a **fallback** so saved worlds and
 * the existing test fixtures keep resolving. That ordering is the whole design — the
 * explicit tag is authoritative, presence is back-compat, and neither is duplicated
 * anywhere else.
 *
 * **Why a module rather than the hand-mirrored copy the plan allowed for.** The plan's §4
 * kept `graphQueries`' private mirror of `isCompanyNode` local, citing a
 * `graphQueries → groups` import cycle. Measured at execution, no such cycle exists — both
 * files import types and constants only — and a *leaf* module importing nothing but types
 * cannot create one by construction. So the rule lives in one place and both callers derive
 * from it, which is what the plan asked for ("derives from the same rule"); the mirror was
 * the workaround, not the requirement. Same shape as `sublocationShape.ts` (THR-1183),
 * which exists because two half-blind hand-rolled discriminators each saw half the world.
 *
 * NFP priorities: Inspectability (one place to read the rule), Fail-soft (an untagged
 * legacy node still resolves through presence), Additive over destructive (nothing is
 * rejected — the old shape is tolerated, not broken).
 */

import type { GraphNode } from '../types/graph';

/**
 * What a group-family `actor` node actually is.
 *
 * `'network'` has no presence fallback because it has no legacy shape — it is minted
 * with `groupKind` from its first day (THR-1288: `actorType: 'group'` +
 * `networkState`, the army precedent).
 */
export type GroupKind = 'company' | 'army' | 'network' | 'battle';

/** Every kind, for exhaustiveness tests and debug surfaces. */
export const GROUP_KINDS: readonly GroupKind[] = ['company', 'army', 'network', 'battle'] as const;

/** True when a node is in the group family at all (`actor` + `actorType: 'group'`). */
export function isGroupFamilyNode(node: GraphNode | undefined): boolean {
  if (!node || node.type !== 'actor') return false;
  return (node.properties as Record<string, unknown>).actorType === 'group';
}

/**
 * The kind of a group node, or `undefined` when the node is not in the group family
 * (or is a group whose kind cannot be established — a fixture carrying neither the tag
 * nor any state bag).
 *
 * Reads the explicit `groupKind` tag first; falls back to the pre-THR-1297 presence
 * tests so saved worlds and fixtures written before the tag keep resolving. Order
 * matters within the fallback: `battleState` and `armyState` are checked before
 * `groupType`, because those bags are the more specific claim.
 */
export function getGroupKind(node: GraphNode | undefined): GroupKind | undefined {
  if (!isGroupFamilyNode(node)) return undefined;
  const props = node!.properties as Record<string, unknown>;

  const tagged = props.groupKind;
  if (tagged === 'company' || tagged === 'army' || tagged === 'network' || tagged === 'battle') {
    return tagged;
  }

  // Back-compat presence fallback (pre-THR-1297 nodes and fixtures).
  if (props.battleState != null) return 'battle';
  if (props.armyState != null) return 'army';
  if (props.networkState != null) return 'network';
  if (typeof props.groupType === 'string') return 'company';
  return undefined;
}

/**
 * True when a node is a *company* — mortals travelling together, as opposed to an army,
 * a battle coordinator, or a network.
 */
export function isCompanyGroupNode(node: GraphNode | undefined): boolean {
  return getGroupKind(node) === 'company';
}

/** True when a node is an army (including a warhost). */
export function isArmyGroupNode(node: GraphNode | undefined): boolean {
  return getGroupKind(node) === 'army';
}

/** True when a node is a battle coordinator. */
export function isBattleGroupNode(node: GraphNode | undefined): boolean {
  return getGroupKind(node) === 'battle';
}

/** True when a node is an owner's contact network (THR-1288). */
export function isNetworkGroupNode(node: GraphNode | undefined): boolean {
  return getGroupKind(node) === 'network';
}

/**
 * True when a `member_of` **target** is a group-family node rather than a faction.
 *
 * This is the predicate `isFactionMembershipEdge` inverts. It deliberately asks "is this
 * a group?" rather than "is this a faction?": faction nodes are not uniformly tagged
 * across worldgen and fixtures, so a positive faction requirement would silently drop
 * real faction memberships — whereas every group-family node is tagged at mint.
 *
 * Note this covers **companies and networks alike**. That widening is the point: before
 * THR-1297 the exclusion named companies only, which was correct exactly as long as
 * companies were the only non-faction `member_of` target.
 */
export function isGroupMembershipTarget(node: GraphNode | undefined): boolean {
  const kind = getGroupKind(node);
  return kind === 'company' || kind === 'network';
}
