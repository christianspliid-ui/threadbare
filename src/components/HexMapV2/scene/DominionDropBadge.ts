/**
 * DominionDropBadge.ts — the band-drop badge (THR-1750 § U4, § Decided 6).
 *
 * A broken gold ring on a place's hex for `DOMINION_DROP_BADGE_TICKS` after its band
 * fell. Shown whether or not the lens is on (the drop is news), covered by fog like
 * every layer, never an interrupt (THR-1763). Its words live in the hex tooltip:
 * `ui.dominion.drop` plus the chronicle line, verbatim.
 *
 * NFP #4: no drops → an empty group.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import type { DominionDropBadge } from '../../../engine/dominionProjection';

export const DOMINION_DROP_LAYER_NAME = 'dominion_drops';

/** Ring radii as a fraction of the hex radius. */
const RING_INNER = 0.62;
const RING_OUTER = 0.74;
/** The break in the ring, in radians — what makes it read as "slipped". */
const RING_GAP_RAD = 0.9;
const RING_SEGMENTS = 32;
const RING_COLOR = '#d4a040';
const RING_OPACITY = 0.9;

export interface DominionDropLayer {
  group: THREE.Group;
  count: number;
  dispose(): void;
}

export function createDominionDropLayer(drops: readonly DominionDropBadge[]): DominionDropLayer {
  const group = new THREE.Group();
  group.name = DOMINION_DROP_LAYER_NAME;
  if (drops.length === 0) return { group, count: 0, dispose() {} };

  const size = HEX_CONSTANTS.HEX_SIZE;
  const geo = new THREE.RingGeometry(size * RING_INNER, size * RING_OUTER, RING_SEGMENTS, 1, RING_GAP_RAD / 2 + Math.PI / 2, Math.PI * 2 - RING_GAP_RAD);
  const mat = new THREE.MeshBasicMaterial({ color: RING_COLOR, transparent: true, opacity: RING_OPACITY, depthWrite: false, side: THREE.DoubleSide });
  for (const d of drops) {
    const [col, row] = d.hexKey.split(',').map(Number);
    const wp = hexToWorld({ col, row }, size);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wp.x, wp.y, LAYER_Z.DOMINION_DROP_BADGE);
    mesh.renderOrder = RENDER_ORDER.DOMINION_DROP_BADGE;
    mesh.userData = { placeId: d.placeId };
    group.add(mesh);
  }
  return {
    group,
    count: drops.length,
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
