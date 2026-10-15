/**
 * markerObstacles.ts — the screen boxes place names must step aside for (THR-1899).
 *
 * THR-1831 § 4: threaded medallions and the avatar (at every band) and portraits
 * (close in) are label-collision obstacles. A place name that overlaps one moves
 * to its free slot below its anchor or hides; the marker never moves. Which kinds
 * count, per band, is `labelObstacle` on their MAP_MARKERS row.
 *
 * NFP #4: a missing camera or group yields no obstacles, never a throw.
 */

import * as THREE from 'three';
import type { AgentSpriteGroup } from '../scene/AgentSpriteMesh';
import { isLabelObstacleIn, type ZoomBand } from '../../../data/map-markers';
import type { ScreenBBox } from './labelCollision';

/** Px of clearance around a marker box, so a name does not kiss the medallion's ring. */
export const MARKER_OBSTACLE_PADDING_PX = 2;

const scratch = new THREE.Vector3();

/**
 * Screen boxes (CSS px, canvas-relative) of every visible agent marker that is a
 * label obstacle in `band`. The box is the sprite as drawn: world scale × k.
 */
export function computeMarkerObstacleBoxes(
  group: AgentSpriteGroup | null,
  camera: THREE.OrthographicCamera | null,
  canvasWidth: number,
  canvasHeight: number,
  band: ZoomBand,
): ScreenBBox[] {
  if (!group || !camera || canvasWidth <= 0 || canvasHeight <= 0) return [];
  const worldW = camera.right - camera.left;
  if (!(worldW > 0)) return [];
  const pxPerWorld = canvasWidth / worldW;
  const boxes: ScreenBBox[] = [];
  for (const entry of group.spriteMap.values()) {
    if (!entry.sprite.visible || !isLabelObstacleIn(entry.kind, band)) continue;
    scratch.copy(entry.sprite.position).project(camera);
    const sx = (scratch.x + 1) / 2 * canvasWidth;
    const sy = (1 - scratch.y) / 2 * canvasHeight;
    const half = (entry.sprite.scale.x * pxPerWorld) / 2 + MARKER_OBSTACLE_PADDING_PX;
    if (sx + half < 0 || sx - half > canvasWidth || sy + half < 0 || sy - half > canvasHeight) continue;
    boxes.push({ left: sx - half, top: sy - half, right: sx + half, bottom: sy + half });
  }
  return boxes;
}
