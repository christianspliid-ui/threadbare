/**
 * The opener behind every link inside a detail card (THR-1851).
 *
 * `Section` makes a faction-allegiance line, a thread line or a prose term clickable only
 * when `DetailPageOpenerProvider` supplies a handler. Until THR-1851 that provider was
 * mounted only in a test, so in the live game every one of those links was plain text —
 * the reason no playtester ever reached a faction sheet. `GameView` now provides the
 * callback this hook returns.
 *
 * A link names a node (`NodeRef`); the router speaks `WorldRef`, so the node is read
 * from the live graph and named by {@link worldRefForNodeId}. A node no `WorldRefKind`
 * names opens nothing (fail-soft, NFP #4).
 *
 * **A faction opens its sheet, not a card.** The faction card is a short stub; the sheet
 * holds the agenda, the people and the standing the player went looking for. The card
 * stack closes first because a card's z-band sits above every sheet (the stacking table
 * in `GameView`), so a sheet opened under a live card would be invisible. Every other
 * kind stacks as a card, which is what a card's links have always meant.
 */
import { useCallback } from 'react';
import type { NodeRef } from '../types/detailPage';
import type { WorldRef } from '../types/worldRef';
import { fromGraphNode, type GraphNodeLike } from '../types/worldRefAdapters';
import type { RefRouter } from './useRefRouter';

/** The graph reads this module needs — the live `WorldGraph` satisfies it. */
export interface NodeLookup {
  getNode(id: string): GraphNodeLike | undefined;
  getNodesByType(type: string): readonly GraphNodeLike[];
}

/**
 * The Realm faction a culture stands behind, or `undefined`.
 *
 * A culture has no sheet: `FactionSheet` reads a faction definition, and a culture node
 * carries none ("Faction data unavailable"). Its living face is the Realm minted over it,
 * whose definition id is `realm.<cultureId>` (THR-1155) — the court and crown a player
 * means when they go looking for "the Witness Skyfield".
 */
export function resolveCultureRealm(graph: NodeLookup, cultureId: string): GraphNodeLike | undefined {
  const defId = `realm.${cultureId}`;
  return graph
    .getNodesByType('actor')
    .find(n => n.properties?.actorType === 'faction' && n.properties?.factionDefId === defId);
}

/**
 * Name a node id as a `WorldRef`, resolving a culture to its Realm first.
 * `undefined` when the node is missing or names nothing a router can open.
 */
export function worldRefForNodeId(graph: NodeLookup, nodeId: string): WorldRef | undefined {
  try {
    const node = graph.getNode(nodeId);
    if (node?.type === 'actor' && node.properties?.actorType === 'culture') {
      return fromGraphNode(resolveCultureRealm(graph, node.id));
    }
    return fromGraphNode(node);
  } catch {
    return undefined; // a malformed graph costs the link, never the app (NFP #4)
  }
}

export function useDetailNodeRefOpener(
  router: Pick<RefRouter, 'open' | 'stack'>,
  getGraph: () => NodeLookup,
): (ref: NodeRef) => void {
  return useCallback(
    (ref: NodeRef) => {
      const worldRef = worldRefForNodeId(getGraph(), ref.nodeId);
      if (!worldRef) return;
      if (worldRef.kind === 'faction') {
        router.stack.popTo(-1);
        router.open(worldRef, 'sheet', { via: 'detail-link' });
        return;
      }
      router.open(worldRef, 'card', { via: 'detail-link' });
    },
    [router, getGraph],
  );
}
