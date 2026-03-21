import * as d3 from 'd3';
import * as THREE from 'three';
import { hexToPixel } from '../../../lib/hexMath';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';

/**
 * Camera zoom and animation constants.
 * NFP #1: Every magic number is named here — tune by changing values.
 */
export const CAMERA_CONSTANTS = {
  MIN_ZOOM: 0.3,              // Full-world zoom (~10px/hex apparent)
  MAX_ZOOM: 10,               // Hero-local zoom (~300px/hex apparent)
  JUMP_TO_DURATION_MS: 500,   // Smooth fly-to duration in ms (CONTEXT.md decision)
  DEFAULT_ZOOM: 1.5,          // Starting zoom level — shows a comfortable region
  ZOOM_TARGET_LERP_IN:  0.4,  // Per-wheel-tick convergence toward selected hex when zooming in
  ZOOM_TARGET_LERP_OUT: 0.15, // Per-wheel-tick convergence toward selected hex when zooming out (slower)
} as const;

/**
 * Synchronizes an OrthographicCamera frustum to a d3 ZoomTransform.
 *
 * d3-zoom uses y-down screen coordinates; Three.js uses y-up world coordinates.
 * The Y-flip is applied here: d3 y-down translation → positive Three.js world Y.
 *
 * NFP #2: Called every zoom event, ensuring the camera state is always traceable
 *          from the d3 transform values.
 */
export function syncCameraToZoom(
  camera: THREE.OrthographicCamera,
  transform: d3.ZoomTransform,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const halfW = canvasWidth / 2 / transform.k;
  const halfH = canvasHeight / 2 / transform.k;

  // X: d3 translate is in screen pixels, negate and divide by scale to get world center
  const cx = -transform.x / transform.k;
  // Y: flip sign — d3 y is downward, Three.js y is upward
  const cy = transform.y / transform.k;

  camera.left   = cx - halfW;
  camera.right  = cx + halfW;
  camera.top    = cy + halfH;
  camera.bottom = cy - halfH;
  camera.updateProjectionMatrix();
}

/**
 * Attaches d3-zoom to a canvas and wires it to an OrthographicCamera.
 *
 * Features:
 * - Continuous scroll zoom (no tier snapping)
 * - Drag pan (mouse button 0)
 * - Pinch zoom (touch)
 * - Double-click zoom disabled
 * - Initial transform centered on the grid's midpoint at DEFAULT_ZOOM scale
 *
 * NFP #3: Initial transform is deterministic — same canvas size = same starting view.
 */
export interface D3ZoomResult {
  zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown>;
  /** Set the world-space point that scroll-zoom should converge on (typically the selected hex center). Pass null to revert to default mouse-pointer zoom. */
  setZoomTarget: (worldX: number, worldY: number) => void;
  /** Clear the zoom target — reverts to default mouse-pointer zoom behavior. */
  clearZoomTarget: () => void;
  destroy: () => void;
}

export function setupD3Zoom(
  canvas: HTMLCanvasElement,
  camera: THREE.OrthographicCamera,
): D3ZoomResult {
  // Mutable zoom target — when set, scroll-zoom converges on this world point
  // instead of the mouse cursor position.
  let zoomTarget: { worldX: number; worldY: number } | null = null;

  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([CAMERA_CONSTANTS.MIN_ZOOM, CAMERA_CONSTANTS.MAX_ZOOM])
    // Disable double-click zoom — per CONTEXT.md decision.
    // Also block wheel events when a zoom target is set — we handle them manually below.
    .filter((event: Event) => {
      if (event.type === 'dblclick') return false;
      if (event.type === 'wheel' && zoomTarget) return false;
      return true;
    })
    .on('zoom', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      syncCameraToZoom(camera, event.transform, canvas.clientWidth, canvas.clientHeight);
    });

  const selection = d3.select(canvas);
  selection.call(zoom);

  // ── Custom wheel handler: zoom toward the selected hex ─────────────────────
  // When zoomTarget is set, we intercept wheel events and compute a transform
  // that keeps the target world point stationary on screen while scaling.
  const handleWheel = (event: WheelEvent) => {
    if (!zoomTarget) return; // Let d3 handle it normally
    event.preventDefault();

    const currentTransform = d3.zoomTransform(canvas);
    const [minK, maxK] = zoom.scaleExtent();

    // Compute new scale (same delta logic as d3-zoom: -deltaY * 0.002)
    const delta = -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002);
    const newK = Math.max(minK, Math.min(maxK, currentTransform.k * Math.pow(2, delta)));
    if (newK === currentTransform.k) return;

    // The zoom target's screen position under the current transform:
    //   screenX = tx + worldX * k   (but our syncCameraToZoom uses cx = -tx/k)
    //   We want the target to stay at screen center after zooming.
    //
    // World point: (zoomTarget.worldX, zoomTarget.worldY)
    // For syncCameraToZoom: cx = -tx/k, cy = ty/k
    // To center on the target at new scale:
    //   tx_new = -zoomTarget.worldX * newK
    //   ty_new = zoomTarget.worldY * newK
    //
    // But we don't want to snap — we want to smoothly converge.
    // Interpolate the camera center between current center and target.
    const currentCx = -currentTransform.x / currentTransform.k;
    const currentCy = currentTransform.y / currentTransform.k;

    // Lerp factor: zoom in → converge faster, zoom out → converge slower
    const isZoomingIn = newK > currentTransform.k;
    const lerpFactor = isZoomingIn
      ? CAMERA_CONSTANTS.ZOOM_TARGET_LERP_IN
      : CAMERA_CONSTANTS.ZOOM_TARGET_LERP_OUT;

    const newCx = currentCx + (zoomTarget.worldX - currentCx) * lerpFactor;
    const newCy = currentCy + (zoomTarget.worldY - currentCy) * lerpFactor;

    // Convert back to d3 transform: tx = -cx * k, ty = cy * k
    const newTransform = d3.zoomIdentity
      .translate(-newCx * newK, newCy * newK)
      .scale(newK);

    selection.call(zoom.transform, newTransform);
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });

  // ── Initial view ───────────────────────────────────────────────────────────
  // Center the initial view on the grid midpoint at DEFAULT_ZOOM
  const midHex = {
    col: Math.floor(HEX_CONSTANTS.GRID_COLS / 2),
    row: Math.floor(HEX_CONSTANTS.GRID_ROWS / 2),
  };
  const { x: gridCenterX, y: gridCenterY } = hexToPixel(midHex, HEX_CONSTANTS.HEX_SIZE);
  const k = CAMERA_CONSTANTS.DEFAULT_ZOOM;

  // World center of the grid: hexToPixel gives positive y, but HexFillMesh stores
  // positions at (x, -y, 0) for the Y-flip. So world center Y = -gridCenterY.
  //
  // syncCameraToZoom derives: cx = -tx/k, cy = ty/k
  // To center on world point (gridCenterX, -gridCenterY):
  //   tx = -gridCenterX * k
  //   ty = -gridCenterY * k
  const initialTransform = d3.zoomIdentity
    .translate(-gridCenterX * k, -gridCenterY * k)
    .scale(k);

  selection.call(zoom.transform, initialTransform);

  const destroy = () => {
    canvas.removeEventListener('wheel', handleWheel);
    selection.on('.zoom', null);
  };

  return {
    zoom,
    setZoomTarget: (worldX: number, worldY: number) => {
      zoomTarget = { worldX, worldY };
    },
    clearZoomTarget: () => {
      zoomTarget = null;
    },
    destroy,
  };
}
