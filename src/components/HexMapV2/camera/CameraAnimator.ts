import * as d3 from 'd3';
import { CAMERA_CONSTANTS } from './D3ZoomCamera';

/**
 * Smoothly animates the camera to a target world-space position using d3 transitions.
 *
 * Uses the same d3 transition approach as the existing HexMap.tsx centerOn, which fires
 * zoom events on each frame — keeping syncCameraToZoom automatically in sync.
 *
 * Camera centering math:
 *   syncCameraToZoom sets: cx = -transform.x / k, cy = transform.y / k
 *   To center world point (targetX, targetY): cx = targetX, cy = targetY
 *   => transform.x = -targetX * k, transform.y = targetY * k
 *   Using d3.zoomIdentity.translate(tx, ty).scale(k): transform.x = tx * k, transform.y = ty * k
 *   => tx = -targetX, ty = targetY
 *
 * @param canvas          The canvas element that d3-zoom is attached to
 * @param zoomBehavior    The d3 ZoomBehavior created by setupD3Zoom
 * @param targetWorldX    World-space X coordinate to center on
 * @param targetWorldY    World-space Y coordinate to center on (Three.js y-up)
 * @param targetScale     Zoom level to animate to (defaults to current scale)
 * @param duration        Animation duration in ms (defaults to JUMP_TO_DURATION_MS)
 *
 * NFP #2: All camera state changes flow through zoom events → syncCameraToZoom — fully traceable.
 */
export function animateCameraTo(
  canvas: HTMLCanvasElement,
  zoomBehavior: d3.ZoomBehavior<HTMLCanvasElement, unknown>,
  targetWorldX: number,
  targetWorldY: number,
  targetScale?: number,
  duration?: number,
): void {
  const durationMs = duration ?? CAMERA_CONSTANTS.JUMP_TO_DURATION_MS;
  const currentTransform = d3.zoomTransform(canvas);
  const scale = targetScale ?? currentTransform.k;

  // Construct target d3 transform that centers (targetWorldX, targetWorldY) on screen.
  // syncCameraToZoom derives: cx = -transform.x / k, cy = transform.y / k
  // We need transform.x = -targetWorldX * k, transform.y = targetWorldY * k
  // d3.zoomIdentity.translate(tx, ty).scale(k) stores {k, x: tx, y: ty}
  // so tx = -targetWorldX * k, ty = targetWorldY * k
  const targetTransform = d3.zoomIdentity
    .translate(-targetWorldX * scale, targetWorldY * scale)
    .scale(scale);

  d3.select(canvas)
    .transition()
    .duration(durationMs)
    .call(zoomBehavior.transform, targetTransform);
}
