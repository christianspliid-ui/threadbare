/**
 * map.agents — the people drawn on the map: the avatar and the mortals the god
 * has threaded (THR-1822, moved from GameView's `agentRenderData` memo).
 *
 * The avatar's own paint (portrait, sphere colour, sigil) is the host's; this row
 * carries `isAvatar` and the host applies it after the read.
 */
import type { SpotlightTier } from '../../../types/npc';
import { getAgentPortraitUrlFromProperties } from '../../../data/portrait-assets';
import { getRetinueAgents } from '../../retinue';
import type { ViewSelector } from '../readView';
import type { MapAgentVM } from './mapTypes';
import { shouldRenderIndividualOnHexMap } from './agentVisibility';

export interface MapAgentsArgs {
  /** The god's avatar node, or null before it stands on the map. */
  avatarNodeId: string | null;
}

export const mapAgentsSelector: ViewSelector<MapAgentsArgs, MapAgentVM[]> = {
  id: 'map.agents',
  invalidation: 'world',
  key: (args) => args.avatarNodeId ?? '',
  fallback: () => [],
  build(ctx, { avatarNodeId }) {
    const graph = ctx.graph;
    const actors = graph.getNodesByType('actor');
    const retinueIds = new Set(getRetinueAgents(graph, ctx.ascendantId).map(r => r.id));
    const threadedAgentIds = new Set(graph.getOutgoingEdges(ctx.ascendantId, 'thread').map(e => e.target));
    const result: MapAgentVM[] = [];
    for (let i = 0; i < actors.length; i++) {
      const n = actors[i];
      // Only notable-or-higher individuals and army groups are map-positioned.
      const actorType = n.properties.actorType as string | undefined;
      if (actorType !== 'individual' && actorType !== 'group') continue;
      // Army nodes are drawn by the army layer, not the agent sprites.
      if (n.properties.armyState != null) continue;
      if (actorType === 'individual') {
        // Commanders are represented by their army's icon while on campaign.
        const commandedByEdges = graph.getIncomingEdges(n.id, 'commanded_by');
        const tier = n.properties.spotlightTier as SpotlightTier | undefined;
        if (!shouldRenderIndividualOnHexMap(tier, commandedByEdges.length)) continue;
        // Only the avatar and agents threaded by the ascendant appear on the map.
        if (n.id !== avatarNodeId && !threadedAgentIds.has(n.id)) continue;
      }
      let hexCol = n.properties.hexCol as number | undefined;
      let hexRow = n.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        const locEdges = graph.getOutgoingEdges(n.id, 'located_at');
        const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
        if (locationId) {
          const loc = graph.getNode(locationId);
          if (loc) {
            hexCol = loc.properties.hexCol as number | undefined;
            hexRow = loc.properties.hexRow as number | undefined;
          }
        }
      }
      if (hexCol == null || hexRow == null) continue;

      const movState = n.properties.movementState as
        | { currentHexPosition?: { col: number; row: number }; currentRoadType?: string; roadHexQueue?: unknown[] }
        | undefined;
      if (movState?.currentHexPosition) {
        hexCol = movState.currentHexPosition.col;
        hexRow = movState.currentHexPosition.row;
      }

      const isAvatar = n.id === avatarNodeId;
      result.push({
        id: n.id,
        hexCol,
        hexRow,
        portraitUrl: isAvatar
          ? undefined
          : (getAgentPortraitUrlFromProperties(n.properties as Record<string, unknown>) ?? undefined),
        factionIndex: i % 6,
        isRetinue: retinueIds.has(n.id),
        isThreaded: threadedAgentIds.has(n.id),
        isAvatar,
        name: n.name,
        currentRoadType: movState?.currentRoadType as 'major' | 'trail' | undefined,
        roadHexQueueLength: Array.isArray(movState?.roadHexQueue) ? movState.roadHexQueue.length : undefined,
      });
    }
    return result;
  },
};
