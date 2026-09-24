/**
 * `isMonster` — the one definition of "this actor is a lair's monster"
 * (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 3).
 *
 * A monster is a class of Mortal, not a node type or an actorType: an `individual`
 * actor carrying `isMonsterElite` (the flag `createNamedElite` has always written) or
 * a `monsterState` card. Either marker is enough, so a card written by a later path,
 * or a flag on a node minted before cards existed, still reads as a monster.
 *
 * Systems meant for mortals exclude monsters through this predicate rather than by
 * re-reading the raw flag: the plot's target list, NPC graduation, lair clearing's
 * challenger scan and social visibility.
 */

import type { GraphNode } from '../../types/graph';

/** True when `node` is a lair's monster. Fail-soft: a missing node is not a monster. */
export function isMonster(node: GraphNode | undefined | null): boolean {
  if (!node) return false;
  const props = node.properties as Record<string, unknown> | undefined;
  if (!props) return false;
  return props.isMonsterElite === true || props.monsterState != null;
}
