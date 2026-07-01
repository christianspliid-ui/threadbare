/**
 * Reach-signature map markers (THR-554) — pure selector projecting the three
 * engine-backed reach-signature effects into per-hex render markers for the
 * HexMapV2 signifier layer.
 *
 *  • Iron / Warhost  → a mustered army node (`properties.warhost === true`,
 *    THR-550 `signature_warhost`), resolved to its hex via its `located_at` edge.
 *  • Veil  / Rift    → a live `ControlEffect` carrying `perTickSphereInfluence`
 *    (THR-551 `sphere_influence_amplify`), anchored at `targetHexCol/Row`.
 *  • Stone / Wonder  → a unique location minted by `spawn_unique_location`
 *    (THR-552), read straight off its `hexCol/hexRow`.
 *
 * Pure + deterministic (no PRNG, no mutation): same graph + controlEffects →
 * same marker list, sorted by id for stable render order (NFP #2/#3). Lives in
 * the engine (not the scene layer) so it is unit-testable without a WebGL
 * context and reusable by the debug bridge.
 */

import type { WorldGraph } from './graph';
import type { ControlEffect } from '../types/controlEffect';
import type { SphereName } from '../types/index';
import { resolveLocationToHex } from './encounterAwareness';

/** The three reach-signature effects that leave a distinct on-map footprint. */
export type ReachSignatureMarkerKind = 'warhost' | 'rift' | 'wonder';

/**
 * Graph-node property flag set by `raiseWarhostForce` (armySpawning.ts) that
 * distinguishes an ascendant-summoned warhost from an ordinary ambition army.
 */
export const WARHOST_MARKER_PROP = 'warhost';

/**
 * `properties.generatedBy` value set by the `spawn_unique_location` aftermath
 * effect (encounterAftermath.ts) on the Great Work location. Detecting by
 * provenance (not a specific uniqueTag) also covers future unique-location
 * signatures without a code change here.
 */
export const UNIQUE_LOCATION_GENERATOR = 'spawn_unique_location';

/** One resolved per-hex signature footprint. Flat + inspectable (NFP #2). */
export interface ReachSignatureMarker {
  /** Which signature left this footprint. Drives glyph + colour selection. */
  readonly kind: ReachSignatureMarkerKind;
  /** Stable source id (armyId / effectId / locationId) — used for keying + sort. */
  readonly id: string;
  readonly hexCol: number;
  readonly hexRow: number;
  /**
   * Rift only: the Creation/Foundation Sphere the rift amplifies, so the glyph
   * can be tinted to the sphere the ascendant is flooding the land with.
   * Undefined for warhost/wonder (which use their fixed reach colour).
   */
  readonly sphere?: SphereName;
}

/**
 * Project the live graph + control effects into reach-signature map markers.
 * Fail-soft (NFP #4): any node/effect that cannot be resolved to a hex is
 * silently skipped rather than throwing — a missing coordinate never crashes
 * the render layer.
 */
export function buildReachSignatureMarkers(
  graph: WorldGraph,
  controlEffects: readonly ControlEffect[] | undefined,
): ReachSignatureMarker[] {
  const markers: ReachSignatureMarker[] = [];

  // ── Iron / Warhost — mustered army nodes ────────────────────────────────
  for (const actor of graph.getNodesByType('actor')) {
    if (actor.properties?.[WARHOST_MARKER_PROP] !== true) continue;
    const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
    const hex = locEdges.length > 0 ? resolveLocationToHex(graph, locEdges[0].target) : null;
    if (!hex) continue;
    markers.push({ kind: 'warhost', id: actor.id, hexCol: hex.col, hexRow: hex.row });
  }

  // ── Veil / Rift — live sphere-amplifying control effects ────────────────
  for (const effect of controlEffects ?? []) {
    const influence = effect.perTickSphereInfluence;
    if (!influence) continue;
    // Include unless an `active` flag explicitly says the effect has lapsed.
    if ((effect as { active?: boolean }).active === false) continue;
    if (typeof effect.targetHexCol !== 'number' || typeof effect.targetHexRow !== 'number') continue;
    markers.push({
      kind: 'rift',
      id: effect.effectId,
      hexCol: effect.targetHexCol,
      hexRow: effect.targetHexRow,
      sphere: influence.sphere,
    });
  }

  // ── Stone / Wonder — unique locations minted by a reach signature ───────
  for (const loc of graph.getNodesByType('location')) {
    if (loc.properties?.generatedBy !== UNIQUE_LOCATION_GENERATOR) continue;
    const col = loc.properties?.hexCol;
    const row = loc.properties?.hexRow;
    if (typeof col !== 'number' || typeof row !== 'number') continue;
    markers.push({ kind: 'wonder', id: loc.id, hexCol: col, hexRow: row });
  }

  // Deterministic render order: stable across renders regardless of graph
  // iteration order (NFP #3).
  markers.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return markers;
}
