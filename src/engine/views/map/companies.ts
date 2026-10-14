/**
 * map.companies — each active company's ring at its hex (THR-1822, moved from
 * GameView's `companyRenderData` memo). Position derives from the leader
 * (companies carry no `located_at` edge); a positionless company is skipped.
 */
import { hexToWorld } from '../../../lib/worldPosition';
import { getActiveGroups, getGroupPosition, getGroupMembers, isGroupThreaded, isAgentGone } from '../../groups/groupQueries';
import type { ViewSelector } from '../readView';
import type { MapCompanyVM } from './mapTypes';

export interface MapCompaniesArgs {
  hexSize: number;
}

/** Steps a position walks up (Place → Location) looking for a hex. */
const COMPANY_POSITION_MAX_DEPTH = 3;

export const mapCompaniesSelector: ViewSelector<MapCompaniesArgs, MapCompanyVM[]> = {
  id: 'map.companies',
  invalidation: 'world',
  key: (args) => String(args.hexSize),
  fallback: () => [],
  build(ctx, { hexSize }) {
    const graph = ctx.graph;
    const result: MapCompanyVM[] = [];
    for (const group of getActiveGroups(graph)) {
      const positionId = getGroupPosition(graph, group.id);
      if (!positionId) continue;
      // Resolve the position node up to hex granularity (Place → Location → hex).
      let node = graph.getNode(positionId) ?? null;
      let hexCol: number | undefined;
      let hexRow: number | undefined;
      for (let depth = 0; depth < COMPANY_POSITION_MAX_DEPTH && node; depth++) {
        const p = node.properties as Record<string, unknown>;
        if (typeof p.hexCol === 'number' && typeof p.hexRow === 'number') {
          hexCol = p.hexCol;
          hexRow = p.hexRow;
          break;
        }
        const parentId = p.parentLocationId as string | undefined;
        node = parentId ? (graph.getNode(parentId) ?? null) : null;
      }
      if (hexCol == null || hexRow == null) continue;
      const world = hexToWorld({ col: hexCol, row: hexRow }, hexSize);
      const memberCount = getGroupMembers(graph, group.id).filter(m => !isAgentGone(m)).length;
      result.push({
        id: group.id,
        worldX: world.x,
        worldY: world.y,
        threaded: isGroupThreaded(graph, group.id, ctx.ascendantId),
        memberCount,
      });
    }
    return result;
  },
};
