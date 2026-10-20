/**
 * stageCamera.ts — the Stage's camera math (THR-1892, plan THR-1877 § D6). Pure.
 *
 * The Stage eases the moment's hex into a window of open map at the screen's right edge,
 * not into the canvas centre. Zoom k means 1 world unit = k screen pixels, and the camera
 * centre sits at the canvas centre (`syncCameraToZoom`), so a world point lands at a
 * canvas-local point when the camera centre is offset by that point's distance from the
 * canvas centre, divided by k. World y is up, screen y is down.
 */
import { CAMERA_CONSTANTS } from './D3ZoomCamera';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION, STAGE_CAMERA_KEEP_MIN_K } from '../../../data/stage-content';

export interface CameraCentre {
  x: number;
  y: number;
  k: number;
}

/** The camera centre that puts world point `world` at canvas-local `local` at zoom `k`. */
export function centreForWorldAt(
  world: { x: number; y: number },
  local: { x: number; y: number },
  canvas: { w: number; h: number },
  k: number,
): CameraCentre {
  return {
    x: world.x - (local.x - canvas.w / 2) / k,
    y: world.y + (local.y - canvas.h / 2) / k,
    k,
  };
}

/** A hex's width on screen at zoom k (a flat-top hex is two radii across). */
export function hexScreenWidth(k: number): number {
  return HEX_CONSTANTS.HEX_SIZE * 2 * k;
}

/**
 * Keep the player's zoom when the place is legible there — at least
 * `STAGE_CAMERA_KEEP_MIN_K` (place labels appear) and no wider than
 * `STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION` of the window — else `FOCUS_ZOOM`, clamped.
 */
export function chooseStageZoom(k: number, windowWidth: number, minK: number, maxK: number): number {
  const keeps = k >= STAGE_CAMERA_KEEP_MIN_K && hexScreenWidth(k) <= STAGE_CAMERA_HEX_MAX_WINDOW_FRACTION * windowWidth;
  if (keeps) return k;
  return Math.max(minK, Math.min(maxK, CAMERA_CONSTANTS.FOCUS_ZOOM));
}

/** The centroid of world points; null for none. */
export function centroid(points: readonly { x: number; y: number }[]): { x: number; y: number } | null {
  if (points.length === 0) return null;
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

/**
 * On close: the smallest move that keeps a screen point inside the visible map, `margin`
 * pixels in from each edge. Null when it is already inside (the camera stays).
 */
export function nudgeInside(
  point: { x: number; y: number },
  rect: { left: number; top: number; right: number; bottom: number },
  margin: number,
): { x: number; y: number } | null {
  const minX = rect.left + margin;
  const maxX = rect.right - margin;
  const minY = rect.top + margin;
  const maxY = rect.bottom - margin;
  if (minX > maxX || minY > maxY) return null;
  const x = Math.max(minX, Math.min(maxX, point.x));
  const y = Math.max(minY, Math.min(maxY, point.y));
  return x === point.x && y === point.y ? null : { x, y };
}

/**
 * THR-1897 (§ D6) — a premonition frames its mortal's place and every option's place, but
 * only when all of them fit the window at a zoom of at least `STAGE_CAMERA_KEEP_MIN_K`;
 * otherwise it frames the mortal's place alone. `points[0]` is the lit hex. Returns how
 * many of the points to frame (all, or 1) and the zoom to frame them at.
 */
export function chooseStageFrame(
  points: readonly { x: number; y: number }[],
  zoom: number,
  window: { w: number; h: number },
  minK: number,
): { framed: number; zoom: number } {
  if (points.length <= 1) return { framed: points.length, zoom };
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const across = HEX_CONSTANTS.HEX_SIZE * 2;
  const spanW = Math.max(...xs) - Math.min(...xs) + across;
  const spanH = Math.max(...ys) - Math.min(...ys) + across;
  const fitK = Math.min(window.w / spanW, window.h / spanH);
  if (!Number.isFinite(fitK)) return { framed: 1, zoom };
  if (zoom <= fitK) return { framed: points.length, zoom };
  const k = Math.max(minK, fitK);
  return k >= STAGE_CAMERA_KEEP_MIN_K && k <= fitK ? { framed: points.length, zoom: k } : { framed: 1, zoom };
}
