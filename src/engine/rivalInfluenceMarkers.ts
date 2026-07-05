/**
 * Rival-influence markers (THR-66) — graph → HexMapV2 overlay adapter.
 *
 * Reads `sponsors_scheme` edges (rival actor → target location) and emits one
 * marker per contested hex, tinted by the sponsoring rival's primary sphere.
 * Mirrors the `buildReachSignatureMarkers` adapter pattern. Pure + fail-soft:
 * targets without hex coords are skipped; no rivals → empty list.
 */
import type { WorldGraph } from './graph';
import type { RivalDefinition } from '../types/rival';
import { SPHERE_ICONS } from '../data/sphereIcons';

/** Default marker color when a rival has no primary sphere. */
const RIVAL_MARKER_DEFAULT_COLOR = '#cc4444';

export interface RivalInfluenceMarker {
  col: number;
  row: number;
  /** CSS hex color keyed to the sponsoring rival's primary sphere. */
  color: string;
  rivalId: string;
  targetId: string;
}

export function buildRivalInfluenceMarkers(
  graph: WorldGraph,
  rivals: RivalDefinition[],
): RivalInfluenceMarker[] {
  const markers: RivalInfluenceMarker[] = [];
  for (const rival of rivals) {
    const edges = graph.getOutgoingEdges(rival.id, 'sponsors_scheme');
    if (edges.length === 0) continue;
    const sphere = rival.primarySphere;
    const color = sphere ? (SPHERE_ICONS[sphere]?.color ?? RIVAL_MARKER_DEFAULT_COLOR) : RIVAL_MARKER_DEFAULT_COLOR;
    for (const edge of edges) {
      const target = graph.getNode(edge.target);
      if (!target) continue;
      const col = target.properties.hexCol as number | undefined;
      const row = target.properties.hexRow as number | undefined;
      if (col === undefined || row === undefined) continue;
      markers.push({ col, row, color, rivalId: rival.id, targetId: target.id });
    }
  }
  return markers;
}
