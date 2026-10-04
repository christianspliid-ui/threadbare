/**
 * Pilgrim ways (THR-1660) — the one read path for `sacred_route`, and the faith-ground
 * question the consecration cell asks: *whose congregation keeps the faith here?*
 *
 * A pilgrim way is a `sacred_route` edge, congregation → settlement. Worldgen seeds one
 * per congregation to its seat (THR-1632 S1f); the `create × pilgrim_way` undertaking
 * consecrates more mid-game. The encounter cache pools the pilgrimage at any way's
 * destination (`sacredRouteDestinationTemplates`); this module is what the sheets, the
 * debug accessor and the census read, so every surface counts the same edges (Law 56).
 *
 * Read-only, draw-free, fail-soft: a dangling edge or an unreadable culture is skipped,
 * never thrown (NFP #4). Ties break by lowest id (NFP #3).
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { getLocationCultureIds } from './culturalTension';
import { TEMPLE_OF_SPHERES_DEF_ID } from '../data/world-scenario';

/** One pilgrim way, as the sheets and the debug accessor read it (a read model, not a trace). */
export interface PilgrimWayRow {
  edgeId: string;
  congregationId: string;
  siteId: string;
  /** `'worldgen'` (seeded), `'undertaking'` (consecrated), or `'legacy'` when the writer left none. */
  origin: string;
  establishedTick: number;
  projectId: string | null;
}

/**
 * Every pilgrim way in the world whose two ends still stand, sorted by edge id.
 * The UI memoises on `worldVersion`, never on graph identity.
 */
export function selectPilgrimWays(graph: WorldGraph): PilgrimWayRow[] {
  const rows: PilgrimWayRow[] = [];
  try {
    for (const e of graph.getEdgesByType('sacred_route')) {
      if (!graph.getNode(e.source) || !graph.getNode(e.target)) continue;
      const p = e.properties as Record<string, unknown>;
      rows.push({
        edgeId: e.id,
        congregationId: e.source,
        siteId: e.target,
        origin: typeof p.origin === 'string' ? p.origin : 'legacy',
        establishedTick: typeof p.establishedTick === 'number' ? p.establishedTick : 0,
        projectId: typeof p.projectId === 'string' ? p.projectId : null,
      });
    }
  } catch {
    return [];
  }
  return rows.sort((a, b) => a.edgeId.localeCompare(b.edgeId));
}

/** Whether a settlement is already some congregation's pilgrim destination. */
export function isPilgrimDestination(graph: WorldGraph, siteId: string): boolean {
  return graph.getIncomingEdges(siteId, 'sacred_route').length > 0;
}

/** A living congregation: a Temple instance carrying its venerated-sphere stamp (THR-1632 S1b). */
function isLivingCongregation(node: GraphNode | undefined): node is GraphNode {
  if (!node || node.type !== 'actor') return false;
  const p = node.properties as Record<string, unknown>;
  return p.actorType === 'faction'
    && p.factionDefId === TEMPLE_OF_SPHERES_DEF_ID
    && 'veneratedSphere' in p
    && p.dissolved !== true;
}

/** The site's own culture: its strongest current-layer link (a fringe link counts), lowest id on a tie. */
export function siteCultureOf(graph: WorldGraph, siteId: string): string | null {
  const cultureIds = getLocationCultureIds(graph, siteId, 'current');
  if (cultureIds.length === 0) return null;
  const strength = (cultureId: string): number => {
    const edge = graph.getOutgoingEdges(siteId, 'belongs_to').find(e => e.target === cultureId);
    const s = edge?.properties.culturalStrength;
    return typeof s === 'number' ? s : 1;
  };
  return [...cultureIds].sort((a, b) => strength(b) - strength(a) || a.localeCompare(b))[0];
}

/**
 * The congregation that keeps the faith on a site's ground (D2): the living Temple
 * congregation of the site's own culture, lowest id if several, `null` if none. Read
 * from the ground, never from the mortal — no faith-ambition holder is a member of any
 * congregation (0 of 86 measured, THR-1660), so a membership rule would be dead.
 */
export function congregationOfSite(graph: WorldGraph, siteId: string): string | null {
  try {
    const cultureId = siteCultureOf(graph, siteId);
    if (!cultureId) return null;
    const ids = graph.getIncomingEdges(cultureId, 'belongs_to')
      .map(e => graph.getNode(e.source))
      .filter(isLivingCongregation)
      .map(n => n.id)
      .sort((a, b) => a.localeCompare(b));
    return ids[0] ?? null;
  } catch {
    return null;
  }
}
