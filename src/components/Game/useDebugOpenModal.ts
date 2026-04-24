import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { GameState } from '../../types/gameState';
import type { ThreadCategory } from '../../engine/retinue';

interface DebugModalOpeners {
  openAgentProfileForId: (id: string) => void;
  openStubModal: (nodeId: string, category: ThreadCategory) => void;
}

/**
 * Dev-only hook: reads `?debug.openModal=<target>` on mount and auto-opens the
 * matching modal. Tree-shaken from prod bundles via the `import.meta.env.DEV` guard.
 *
 * Supported targets:
 *   agent    → AgentProfileModal for the first retinue agent (The First in seeded games)
 *   location → LocationProfileModal for the first location node
 *   faction  → FactionSheet for the first faction actor node
 */
export function useDebugOpenModal(
  gameStateRef: RefObject<GameState>,
  openers: DebugModalOpeners,
): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const modal = new URLSearchParams(window.location.search).get('debug.openModal');
    if (!modal) return;

    // Small delay to let game state initialize before opening modals
    const id = window.setTimeout(() => {
      const state = gameStateRef.current;
      if (!state) {
        console.warn('[useDebugOpenModal] game state not ready');
        return;
      }
      const graph = state.graph;

      switch (modal) {
        case 'agent': {
          const agents = graph.getNodesByType('actor').filter(
            n => (n.properties as Record<string, unknown>).actorType === 'individual',
          );
          // Prefer first retinue agent (The First in seeded games)
          const threadEdges = state.ascendantId
            ? graph.getOutgoingEdges(state.ascendantId, 'thread')
            : [];
          const firstRetinueId = threadEdges[0]?.target;
          const target = (firstRetinueId && graph.getNode(firstRetinueId)) ?? agents[0];
          if (target) openers.openAgentProfileForId(target.id);
          else console.warn('[useDebugOpenModal] No agent found for debug.openModal=agent');
          break;
        }
        case 'location': {
          const locs = graph.getNodesByType('location');
          if (locs.length > 0) openers.openStubModal(locs[0].id, 'location');
          else console.warn('[useDebugOpenModal] No location found for debug.openModal=location');
          break;
        }
        case 'faction': {
          const factions = graph.getNodesByType('actor').filter(
            n => (n.properties as Record<string, unknown>).actorType === 'faction',
          );
          if (factions.length > 0) openers.openStubModal(factions[0].id, 'faction');
          else console.warn('[useDebugOpenModal] No faction found for debug.openModal=faction');
          break;
        }
        default:
          console.warn(`[useDebugOpenModal] Unknown modal target: "${modal}". Supported: agent, location, faction`);
      }
    }, 500);

    return () => window.clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once on mount
}
