/**
 * Rival-influence markers (THR-66, THR-621) — graph → HexMapV2 overlay adapter.
 *
 * Emits one marker per hex a rival is visibly working on, tinted by the
 * sponsoring rival's primary sphere. Mirrors the `buildReachSignatureMarkers`
 * adapter pattern. Pure + fail-soft: targets without hex coords are skipped; no
 * rivals → empty list.
 *
 * **Two sources, because one of them cannot fire.** The original THR-66 path
 * reads `sponsors_scheme` edges (rival → target location). Rivals are *not graph
 * nodes* — they live in `state.rivalDefinitions`, never in the graph — so
 * `graph.addEdge` throws `Source node not found` every time a scheme tries to
 * bind one, and the throw is swallowed by the move dispatcher's fail-soft catch.
 * That path is therefore dead by construction and this layer rendered nothing.
 * It is kept (cheap, and it starts working the day rivals become nodes) but it is
 * no longer the only input.
 *
 * The THR-621 path reads the **essence-source bag** instead: a source whose
 * `contestedBy` names a rival is a hex that rival is demonstrably bleeding, and
 * the host node is a real graph node with real hex coordinates. This is what
 * actually lights the layer up today, and it is what lets the player see *which
 * rival is draining which source* without reading code.
 */
import type { WorldGraph } from './graph';
import type { RivalDefinition } from '../types/rival';
import { SPHERE_ICONS } from '../data/sphereIcons';
import { readEssenceSource } from './essenceSources';
import { resolveLocationToHex } from './encounterAwareness';

/** Default marker color when a rival has no primary sphere. */
const RIVAL_MARKER_DEFAULT_COLOR = '#cc4444';

export interface RivalInfluenceMarker {
  col: number;
  row: number;
  /** CSS hex color keyed to the sponsoring rival's primary sphere. */
  color: string;
  rivalId: string;
  targetId: string;
  /**
   * Why this hex is marked (THR-621). `scheme` = a `sponsors_scheme` edge;
   * `source_contested` / `source_desecrated` = a rival drain on one of the
   * player's essence sources. Lets the map distinguish "being schemed against"
   * from "actively being bled".
   */
  reason?: 'scheme' | 'source_contested' | 'source_desecrated';
}

function rivalColor(rival: RivalDefinition): string {
  const sphere = rival.primarySphere;
  return sphere
    ? (SPHERE_ICONS[sphere]?.color ?? RIVAL_MARKER_DEFAULT_COLOR)
    : RIVAL_MARKER_DEFAULT_COLOR;
}

export function buildRivalInfluenceMarkers(
  graph: WorldGraph,
  rivals: RivalDefinition[],
): RivalInfluenceMarker[] {
  const markers: RivalInfluenceMarker[] = [];
  // De-dupe: a hex both schemed against and drained is marked once, drain wins
  // (it is the stronger, more actionable signal).
  const seen = new Set<string>();

  // ── THR-621: sources a rival is currently bleeding ──
  // Walks locations rather than the ascendant's `controls` edges so the adapter
  // stays a pure graph→overlay read with no ascendant argument. Sources are few,
  // and this mirrors `findLatentSourcesInRange`'s existing location walk.
  const byId = new Map(rivals.map((r) => [r.id, r]));
  for (const loc of graph.getNodesByType('location')) {
    const src = readEssenceSource(loc.properties);
    if (!src?.contestedBy) continue;
    const rival = byId.get(src.contestedBy);
    if (!rival) continue; // drained by something that is not a known rival
    const hex = resolveLocationToHex(graph, loc.id);
    if (!hex) continue; // fail-soft: unplaceable host is skipped
    const key = `${hex.col},${hex.row}`;
    seen.add(key);
    markers.push({
      col: hex.col,
      row: hex.row,
      color: rivalColor(rival),
      rivalId: rival.id,
      targetId: loc.id,
      reason: src.desecrated ? 'source_desecrated' : 'source_contested',
    });
  }

  // ── THR-66: locations under an active scheme (see the header note) ──
  for (const rival of rivals) {
    const edges = graph.getOutgoingEdges(rival.id, 'sponsors_scheme');
    if (edges.length === 0) continue;
    const color = rivalColor(rival);
    for (const edge of edges) {
      const target = graph.getNode(edge.target);
      if (!target) continue;
      const col = target.properties.hexCol as number | undefined;
      const row = target.properties.hexRow as number | undefined;
      if (col === undefined || row === undefined) continue;
      if (seen.has(`${col},${row}`)) continue; // already marked by a live drain
      markers.push({ col, row, color, rivalId: rival.id, targetId: target.id, reason: 'scheme' });
    }
  }

  return markers;
}
