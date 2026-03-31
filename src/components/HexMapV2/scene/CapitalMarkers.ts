/**
 * CapitalMarkers.ts — Red dot markers at political capital hexes.
 *
 * Renders capital dots as THREE.Points objects:
 *   - Domain capitals: larger dots (size 6)
 *   - Province-only capitals: smaller dots (size 3)
 *
 * Two separate THREE.Points objects are returned in a THREE.Group
 * since PointsMaterial doesn't support per-point sizes.
 *
 * NFP #1 Tunability: All sizes and colors in named constants.
 * NFP #4 Fail-soft: Empty provinces/domains produce empty group.
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

/** Pixel size of domain capital dots (sizeAttenuation: false = screen pixels) */
const DOMAIN_CAPITAL_SIZE = 6;

/** Pixel size of province-only capital dots */
const PROVINCE_CAPITAL_SIZE = 3;

/** Z offset: above borders (0.035), below labels */
const CAPITAL_Z = 0.04;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create red dot capital markers for all political capitals.
 *
 * @param regionData - Region data with provinces and domains
 * @returns THREE.Group containing up to two THREE.Points (domain + province-only)
 */
export function createCapitalMarkers(regionData: RegionData): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS;

  const { provinces, domains } = regionData;

  // NFP #4 Fail-soft: empty input produces empty group
  if (provinces.length === 0) return group;

  const size = HEX_CONSTANTS.HEX_SIZE;

  // Determine which provinces are domain capitals
  const domainCapitalHexKeys = new Set<string>();
  for (const domain of domains) {
    domainCapitalHexKeys.add(hexKeyFromCoord(domain.capitalHex));
  }

  const domainPositions: number[] = [];
  const provincePositions: number[] = [];

  for (const province of provinces) {
    const { x: wx, y: wy } = hexToWorld(province.capitalHex, size);
    const hKey = hexKeyFn(province.capitalHex.col, province.capitalHex.row);

    if (domainCapitalHexKeys.has(hKey)) {
      domainPositions.push(wx, wy, CAPITAL_Z);
    } else {
      provincePositions.push(wx, wy, CAPITAL_Z);
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

  addPoints(domainPositions, DOMAIN_CAPITAL_SIZE);
  addPoints(provincePositions, PROVINCE_CAPITAL_SIZE);

  return group;
}
