/**
 * Rival-influence markers (THR-66, THR-621, THR-829) — state → HexMapV2 overlay adapter.
 *
 * Emits one marker per hex a rival is visibly working on, tinted by the
 * sponsoring rival's primary sphere. Mirrors the `buildReachSignatureMarkers`
 * adapter pattern. Pure + fail-soft: targets without hex coords are skipped; no
 * rivals → empty list.
 *
 * **Two inputs, neither of them an edge.** Rivals are *not graph nodes* — they
 * live in `state.rivalDefinitions` — so the original THR-66 design of reading
 * `sponsors_scheme` edges (rival → target) could never fire: `graph.addEdge`
 * threw on the missing source. THR-829 retired that edge for rival schemes and
 * re-sourced this layer from state:
 *
 * - **Essence-source drains** (THR-621) — a source whose `contestedBy` names a
 *   rival is a hex that rival is demonstrably bleeding. "Being bled."
 * - **Scheme targets** (`buildRivalSchemeTargets`, THR-829) — compositions a
 *   rival sponsors whose `materialize` move has fired, keyed on the
 *   composition's `sponsorRivalId` + `resolvedNodes.target`. "Being schemed
 *   against."
 *
 * A hex carrying both is marked once, and the drain wins (the stronger signal).
 */
import type { WorldGraph } from './graph';
import type { RivalDefinition } from '../types/rival';
import type { ActiveComposition } from '../types/gameState';
import { SPHERE_ICONS } from '../data/sphereIcons';
import { getRivalSchemeFamily } from '../data/rival-schemes';
import { readEssenceSource } from './essenceSources';
import { resolveLocationToHex } from './encounterAwareness';
import { schemeFlags } from './rival';

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
   * Why this hex is marked (THR-621). `scheme` = a rival scheme has materialized
   * at this target (THR-829 — read from composition state, not an edge);
   * `source_contested` / `source_desecrated` = a rival drain on one of the
   * player's essence sources. Lets the map distinguish "being schemed against"
   * from "actively being bled".
   */
  reason?: 'scheme' | 'source_contested' | 'source_desecrated';
}

/** A location a rival's scheme has materialized at (THR-829). */
export interface RivalSchemeTarget {
  rivalId: string;
  targetId: string;
  compositionId: string;
}

function rivalColor(rival: RivalDefinition): string {
  const sphere = rival.primarySphere;
  return sphere
    ? (SPHERE_ICONS[sphere]?.color ?? RIVAL_MARKER_DEFAULT_COLOR)
    : RIVAL_MARKER_DEFAULT_COLOR;
}

/**
 * The graph-free attribution surface for rival schemes (THR-829): every
 * rival-sponsored composition that has not failed, has a resolved target, and
 * whose family's `materialize` phase has fired its move (the move-done world
 * flag `phaseRivalActions` sets). Pure + fail-soft: an unknown family or a
 * composition with no target yields nothing.
 */
export function buildRivalSchemeTargets(
  compositions: readonly ActiveComposition[] | undefined,
  worldFlags: Readonly<Record<string, unknown>> | undefined,
): RivalSchemeTarget[] {
  const out: RivalSchemeTarget[] = [];
  if (!compositions || !worldFlags) return out;
  for (const c of compositions) {
    if (!c.sponsorRivalId || !c.schemeFamily || c.status === 'failed') continue;
    const targetId = c.resolvedNodes?.target;
    if (!targetId) continue;
    const family = getRivalSchemeFamily(c.schemeFamily);
    if (!family) continue;
    const materialized = family.beats.some(
      (b) =>
        b.move === 'materialize' &&
        worldFlags[schemeFlags.moveDone(c.compositionId, b.phaseId)] === true,
    );
    if (!materialized) continue;
    out.push({ rivalId: c.sponsorRivalId, targetId, compositionId: c.compositionId });
  }
  return out;
}

export function buildRivalInfluenceMarkers(
  graph: WorldGraph,
  rivals: RivalDefinition[],
  schemeTargets: readonly RivalSchemeTarget[] = [],
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

  // ── THR-66 / THR-829: locations a rival scheme has materialized at ──
  for (const st of schemeTargets) {
    const rival = byId.get(st.rivalId);
    if (!rival) continue; // sponsored by something that is not a known rival
    const hex = resolveLocationToHex(graph, st.targetId);
    if (!hex) continue; // fail-soft: unplaceable target is skipped
    const key = `${hex.col},${hex.row}`;
    if (seen.has(key)) continue; // already marked (a live drain wins the hex)
    seen.add(key);
    markers.push({
      col: hex.col,
      row: hex.row,
      color: rivalColor(rival),
      rivalId: rival.id,
      targetId: st.targetId,
      reason: 'scheme',
    });
  }

  return markers;
}
