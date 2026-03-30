/**
 * CapitalMarkers.ts — Red dot markers at political capital hexes.
 *
 * Renders capital dots as THREE.Points objects:
 *   - Kingdom capitals: larger dots (size 6)
 *   - Barony-only capitals: smaller dots (size 3)
 *
 * Two separate THREE.Points objects are returned in a THREE.Group
 * since PointsMaterial doesn't support per-point sizes.
 *
 * NFP #1 Tunability: All sizes and colors in named constants.
 * NFP #4 Fail-soft: Empty baronies/kingdoms produce empty group.
 * NFP #7 Performance: Two Points objects regardless of capital count.
 */

import * as THREE from 'three';
import type { RegionData } from '../../../engine/regionTypes';
import { hexKeyFromCoord, hexKey as hexKeyFn } from '../../../lib/hexKey';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { getActivePalette } from '../palette/activePalette';

// ─── Capital marker constants (NFP #1: Tunability) ────────────────────────────

/** Pixel size of kingdom capital dots (sizeAttenuation: false = screen pixels) */
const KINGDOM_CAPITAL_SIZE = 6;

/** Pixel size of barony-only capital dots */
const BARONY_CAPITAL_SIZE = 3;

/** Z offset: above borders (0.035), below labels */
const CAPITAL_Z = 0.04;

/** Color — reads from active palette theme (default: red, matches border lines) */
const CAPITAL_COLOR_DEFAULT = 0xC83030;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create red dot capital markers for all political capitals.
 *
 * @param regionData - Region data with baronies and kingdoms
 * @returns THREE.Group containing up to two THREE.Points (kingdom + barony-only)
 */
export function createCapitalMarkers(regionData: RegionData): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS;

  const { baronies, kingdoms } = regionData;

  // NFP #4 Fail-soft: empty input produces empty group
  if (baronies.length === 0) return group;

  const size = HEX_CONSTANTS.HEX_SIZE;

  // Determine which baronies are kingdom capitals
  const kingdomCapitalHexKeys = new Set<string>();
  for (const kingdom of kingdoms) {
    kingdomCapitalHexKeys.add(hexKeyFromCoord(kingdom.capitalHex));
  }

  const kingdomPositions: number[] = [];
  const baronyPositions: number[] = [];

  for (const barony of baronies) {
    const { x: wx, y: wy } = hexToWorld(barony.capitalHex, size);

    const hKey = hexKeyFn(barony.capitalHex.col, barony.capitalHex.row);

    if (kingdomCapitalHexKeys.has(hKey)) {
      kingdomPositions.push(wx, wy, CAPITAL_Z);
    } else {
      baronyPositions.push(wx, wy, CAPITAL_Z);
    }
  }

  const addPoints = (positions: number[], dotSize: number): void => {
    if (positions.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: getActivePalette().capitalColor,
      size: dotSize,
      sizeAttenuation: false,
      vertexColors: false,
    });

    const points = new THREE.Points(geo, mat);
    points.renderOrder = RENDER_ORDER.LOCATIONS;
    group.add(points);
  };

  addPoints(kingdomPositions, KINGDOM_CAPITAL_SIZE);
  addPoints(baronyPositions, BARONY_CAPITAL_SIZE);

  return group;
}
