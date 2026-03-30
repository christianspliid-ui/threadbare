/**
 * SiegeIndicatorMesh.ts — Three.js scene module for siege ring indicators.
 *
 * Places 6 small shield icons at hex edge midpoints around a besieged settlement hex.
 * Reuses the shield texture from ArmySpriteMesh for visual consistency.
 * The ring of shields signals that a location is under siege.
 *
 * Also exports getSiegedHexKeys() for the hex fill color darkening system,
 * and SIEGE_HEX_DARKEN_FACTOR for tuning the darkening amount.
 *
 * NFP #1 (tunability): All ring geometry constants are named.
 * NFP #3 (determinism): Shield icons placed at fixed angular offsets (predictable layout).
 * NFP #4 (fail-soft): Missing siege data silently skips — never crashes.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { getShieldTexture } from './ArmySpriteMesh';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** Scale of each siege ring shield sprite in world units. */
const SIEGE_RING_ICON_SCALE = 3.0;

/**
 * Color multiplier applied to besieged hex fill colors.
 * 0.75 = 25% darker. Export for use by hex fill color mutation logic.
 */
export const SIEGE_HEX_DARKEN_FACTOR = 0.75;

/**
 * Angles (in degrees) for the 6 hex edge midpoints in flat-top orientation.
 * 0° = right edge midpoint, proceeding counter-clockwise.
 */
const HEX_EDGE_MIDPOINT_ANGLES_DEG = [0, 60, 120, 180, 240, 300];

/**
 * Fraction of hex radius at which the edge midpoints sit.
 * For flat-top hexes, edge midpoints are at sqrt(3)/2 ≈ 0.866 of the outer radius.
 */
const EDGE_MIDPOINT_RADIUS_FACTOR = 0.866;

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Minimal data needed to render one siege ring.
 * Comes from the world graph — populated by game data.
 */
export interface SiegeRenderData {
  /** Unique ID for this siege/battle node in the graph. */
  siegeNodeId: string;
  /** Hex column of the besieged settlement. */
  settlementHexCol: number;
  /** Hex row of the besieged settlement. */
  settlementHexRow: number;
  /** Faction heraldic color of the besieging army (CSS hex string). */
  factionColor: string;
}

// ── Helper: hex edge midpoint offsets ────────────────────────────────────────

/**
 * Computes the 6 world-space offsets for hex edge midpoints in Three.js y-up space.
 *
 * @param hexSize - Hex radius in world units
 */
function getEdgeMidpointOffsets(hexSize: number): Array<{ dx: number; dy: number }> {
  const r = hexSize * EDGE_MIDPOINT_RADIUS_FACTOR;
  return HEX_EDGE_MIDPOINT_ANGLES_DEG.map(deg => {
    const rad = (deg * Math.PI) / 180;
    return {
      dx: r * Math.cos(rad),
      dy: r * Math.sin(rad), // Three.js y-up — positive y is up
    };
  });
}

// ── Scene Module Factory ──────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing 6 shield sprites around each besieged settlement.
 *
 * The ring of shields uses the same faction-colored shield texture as ArmySpriteMesh.
 * Shields are placed at hex edge midpoints (N, NE, SE, S, SW, NW equivalents in flat-top).
 *
 * @param sieges      Array of SiegeRenderData to render
 * @returns           THREE.Group at LAYER_Z.ARMIES z-level
 *
 * NFP #3: Fixed angular offsets ensure deterministic ring layout.
 * NFP #4: Returns empty Group if sieges is empty.
 *         Silently skips sieges with missing/invalid settlement hex data.
 */
export function createSiegeIndicatorMesh(sieges: SiegeRenderData[]): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.AGENTS;

  if (sieges.length === 0) return group;

  const edgeOffsets = getEdgeMidpointOffsets(HEX_CONSTANTS.HEX_SIZE);

  for (const siege of sieges) {
    // NFP #4: skip sieges with invalid hex positions
    if (siege.settlementHexCol == null || siege.settlementHexRow == null) continue;

    const centerPos = hexToWorld(
      { col: siege.settlementHexCol, row: siege.settlementHexRow },
      HEX_CONSTANTS.HEX_SIZE,
    );

    const texture = getShieldTexture(siege.factionColor);

    // Place 6 shield icons at each edge midpoint
    for (const offset of edgeOffsets) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(
        centerPos.x + offset.dx,
        centerPos.y + offset.dy,
        LAYER_Z.ARMIES,
      );
      sprite.scale.set(SIEGE_RING_ICON_SCALE, SIEGE_RING_ICON_SCALE, 1);
      group.add(sprite);
    }
  }

  return group;
}

// ── Query helper ─────────────────────────────────────────────────────────────

/**
 * Returns a Set of hex key strings ("col,row") for all besieged settlement hexes.
 *
 * Used by the hex fill color mutation logic to apply SIEGE_HEX_DARKEN_FACTOR
 * to the fill color of besieged hexes.
 *
 * @param sieges - Array of SiegeRenderData
 */
export function getSiegedHexKeys(sieges: SiegeRenderData[]): Set<string> {
  const keys = new Set<string>();
  for (const siege of sieges) {
    if (siege.settlementHexCol != null && siege.settlementHexRow != null) {
      keys.add(`${siege.settlementHexCol},${siege.settlementHexRow}`);
    }
  }
  return keys;
}

