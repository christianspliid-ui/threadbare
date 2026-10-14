/**
 * map.threadLines — the god's threads, avatar → each threaded mortal, in world
 * space (THR-1822, moved from GameView's `threadLineData` memo). Rebuilt each
 * world version so the lines track moving mortals.
 */
import { hexToWorld } from '../../../lib/worldPosition';
import type { ViewSelector } from '../readView';
import type { MapThreadLineVM } from './mapTypes';
import { nodeMapHex } from './mapPosition';

export interface MapThreadLinesArgs {
  avatarNodeId: string | null;
  /** The scene's hex radius in world units (`HEX_CONSTANTS.HEX_SIZE`). */
  hexSize: number;
}

export const mapThreadLinesSelector: ViewSelector<MapThreadLinesArgs, MapThreadLineVM[]> = {
  id: 'map.threadLines',
  invalidation: 'world',
  key: (args) => `${args.avatarNodeId ?? ''}|${args.hexSize}`,
  fallback: () => [],
  build(ctx, { avatarNodeId, hexSize }) {
    const graph = ctx.graph;
    const avatarNode = avatarNodeId ? graph.getNode(avatarNodeId) : undefined;
    const avatarPos = avatarNode ? nodeMapHex(graph, avatarNode) : null;
    if (!avatarPos) return [];
    const fromWorld = hexToWorld(avatarPos, hexSize);
    const result: MapThreadLineVM[] = [];
    for (const edge of graph.getOutgoingEdges(ctx.ascendantId, 'thread')) {
      const agentNode = graph.getNode(edge.target);
      if (!agentNode) continue;
      const pos = nodeMapHex(graph, agentNode);
      if (!pos) continue;
      const toWorld = hexToWorld(pos, hexSize);
      const courtPosition = (edge.properties as Record<string, unknown>)['courtPosition'] as string | undefined;
      result.push({
        agentId: edge.target,
        courtPosition: courtPosition ?? 'watched',
        fromX: fromWorld.x,
        fromY: fromWorld.y,
        toX: toWorld.x,
        toY: toWorld.y,
      });
    }
    return result;
  },
};
