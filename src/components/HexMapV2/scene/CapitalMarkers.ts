/**
 * CapitalMarkers.ts — a dot where each Realm's court sits.
 *
 * **One tier since THR-1155.** The layer used to draw two sizes of dot from worldgen's
 * province list: a big one on a domain's capital hex and a small one on every other
 * province's. Provinces are not objects the player can act on, so the small tier is
 * gone; what remains marks the seat of a **Realm** — the town its `controls` edge
 * carries `role: 'seat'` on, read through `realmProjection`. A Realm whose seat is
 * sacked and re-stamped moves its dot, which is the same promise the border makes.
 *
 * NFP #1 Tunability: sizes and colors in named constants.
 * NFP #4 Fail-soft: a Realm with no seat (it holds nothing seatable) contributes no
 * dot; an empty projection produces an empty group.
 * NFP #7 Performance: one THREE.Points object regardless of Realm count.
 */

import * as THREE from 'three';
import type { RealmProjection } from '../../../engine/realmProjection';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { getActivePalette } from '../palette/activePalette';

// ─── Capital marker constants (NFP #1: Tunability) ────────────────────────────

/** Pixel size of a Realm seat dot (sizeAttenuation: false = screen pixels) */
const REALM_SEAT_SIZE = 6;

/** Z offset: above borders (0.035), below labels */
const CAPITAL_Z = 0.04;

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create the seat markers for every Realm with a seated court.
 *
 * @param realmProjection - The political partition, projected from `controls` (THR-1155)
 * @returns THREE.Group containing one THREE.Points, or empty when no Realm is seated
 */
export function createCapitalMarkers(realmProjection: RealmProjection): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS;

  const size = HEX_CONSTANTS.HEX_SIZE;
  const positions: number[] = [];

  for (const realm of realmProjection.realms) {
    // A court with no hall draws no dot rather than a dot at the origin — the
    // fail-soft table permits the state, and (0,0) is a real hex.
    if (!realm.seatHex) continue;
    const { x: wx, y: wy } = hexToWorld(realm.seatHex, size);
    positions.push(wx, wy, CAPITAL_Z);
  }

  // NFP #4 Fail-soft: empty input produces an empty group
  if (positions.length === 0) return group;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: getActivePalette().capitalColor,
    size: REALM_SEAT_SIZE,
    sizeAttenuation: false,
    vertexColors: false,
  });

  const points = new THREE.Points(geo, mat);
  points.renderOrder = RENDER_ORDER.LOCATIONS;
  group.add(points);

  return group;
}
