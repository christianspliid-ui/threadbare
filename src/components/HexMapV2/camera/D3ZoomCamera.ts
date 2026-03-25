import * as d3 from 'd3';
import * as THREE from 'three';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';

/**
 * Camera zoom and animation constants.
 * NFP #1: Every magic number is named here — tune by changing values.
 */
export const CAMERA_CONSTANTS = {
  MIN_ZOOM: 0.3,              // Full-world zoom (~10px/hex apparent)
  MAX_ZOOM: 15,               // Hero-local zoom (~450px/hex apparent)
  JUMP_TO_DURATION_MS: 500,   // Smooth fly-to duration in ms (CONTEXT.md decision)
  DEFAULT_ZOOM: 1.5,          // Starting zoom level — shows a comfortable region
  ZOOM_TARGET_LERP_IN:  0.4,  // Per-wheel-tick convergence toward selected hex when zooming in
  ZOOM_TARGET_LERP_OUT: 0.15, // Per-wheel-tick convergence toward selected hex when zooming out (slower)
  INITIAL_CENTER_COL: 48,     // Starting view centers on this hex column
  INITIAL_CENTER_ROW: 90,     // Starting view centers on this hex row
  WHEEL_DELTA_SCALE: 0.002,   // Wheel scroll sensitivity multiplier (deltaMode 0)
  FIT_PADDING: 0.85,          // Show grid at 85% of canvas, leaving edge padding
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
  gridCols?: number,
  gridRows?: number,
): D3ZoomResult {
  // Mutable zoom target — when set, scroll-zoom converges on this world point
  // instead of the mouse cursor position.
  let zoomTarget: { worldX: number; worldY: number } | null = null;

  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([CAMERA_CONSTANTS.MIN_ZOOM, CAMERA_CONSTANTS.MAX_ZOOM])
    // Block double-click zoom and ALL wheel events — we handle wheel manually
    // because d3-zoom's default zoom-toward-cursor math assumes a standard
    // screen↔data mapping, but our syncCameraToZoom uses a custom mapping
    // (cx = -tx/k, cy = ty/k with Y-flip). Manual handling gives us correct
    // zoom-toward-cursor AND zoom-toward-selected-hex.
    .filter((event: Event) => {
      if (event.type === 'dblclick') return false;
      if (event.type === 'wheel') return false;
      return true;
    })
    .on('zoom', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      syncCameraToZoom(camera, event.transform, canvas.clientWidth, canvas.clientHeight);
    });

  const selection = d3.select(canvas);
  selection.call(zoom);

  // ── Custom wheel handler ───────────────────────────────────────────────────
  // Handles ALL scroll-zoom because our coordinate mapping is non-standard.
  // Two modes:
  //   1. No zoom target → zoom toward the world point under the mouse cursor
  //   2. Zoom target set → zoom while lerping toward the selected hex
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    const currentTransform = d3.zoomTransform(canvas);
    const [minK, maxK] = zoom.scaleExtent();

    // Compute new scale (same delta logic as d3-zoom: -deltaY * 0.002)
    const delta = -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : CAMERA_CONSTANTS.WHEEL_DELTA_SCALE);
    const newK = Math.max(minK, Math.min(maxK, currentTransform.k * Math.pow(2, delta)));
    if (newK === currentTransform.k) return;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
    const oldK = currentTransform.k;

    // Current camera center in world space
    const cx = -currentTransform.x / oldK;
    const cy = currentTransform.y / oldK;

    let newTx: number;
    let newTy: number;

    if (zoomTarget) {
      // ── Mode 2: Lerp toward selected hex ─────────────────────────────
      const isZoomingIn = newK > oldK;
      const lerpFactor = isZoomingIn
        ? CAMERA_CONSTANTS.ZOOM_TARGET_LERP_IN
        : CAMERA_CONSTANTS.ZOOM_TARGET_LERP_OUT;

      const newCx = cx + (zoomTarget.worldX - cx) * lerpFactor;
      const newCy = cy + (zoomTarget.worldY - cy) * lerpFactor;

      newTx = -newCx * newK;
      newTy = newCy * newK;
    } else {
      // ── Mode 1: Zoom toward mouse cursor ─────────────────────────────
      // World point under cursor:
      //   worldX = cx + (sx - canvasW/2) / k
      //   worldY = cy + (canvasH/2 - sy) / k
      const sx = event.offsetX;
      const sy = event.offsetY;
      const worldX = cx + (sx - canvasW / 2) / oldK;
      const worldY = cy + (canvasH / 2 - sy) / oldK;

      // New transform that keeps (worldX, worldY) at screen (sx, sy):
      //   tx' = -worldX * k' + (sx - canvasW/2)
      //   ty' =  worldY * k' - (canvasH/2 - sy)
      newTx = -worldX * newK + (sx - canvasW / 2);
      newTy =  worldY * newK - (canvasH / 2 - sy);
    }

    const newTransform = d3.zoomIdentity
      .translate(newTx, newTy)
      .scale(newK);

    selection.call(zoom.transform, newTransform);
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });

  // ── Initial view ───────────────────────────────────────────────────────────
  // Center the initial view on the grid center if dimensions are provided,
  // otherwise fall back to the configured default hex (for HexV2View).
  const centerCol = gridCols != null ? Math.floor(gridCols / 2) : CAMERA_CONSTANTS.INITIAL_CENTER_COL;
  const centerRow = gridRows != null ? Math.floor(gridRows / 2) : CAMERA_CONSTANTS.INITIAL_CENTER_ROW;
  const startHex = {
    col: centerCol,
    row: centerRow,
  };
  const { x: gridCenterX, y: gridCenterY } = hexToPixel(startHex, HEX_CONSTANTS.HEX_SIZE);

  // Compute initial zoom to fit grid within the canvas (with padding).
  // Grid world extent: cols * HEX_SCALE_X * hexSize wide, rows * HEX_SCALE_Y * hexSize tall.
  // Zoom k means 1 world unit = k screen pixels, so we need k = canvasPx / worldUnits.
  const FIT_PADDING = CAMERA_CONSTANTS.FIT_PADDING;
  let k = CAMERA_CONSTANTS.DEFAULT_ZOOM;
  if (gridCols != null && gridRows != null) {
    const worldW = gridCols * HEX_SCALE_X * HEX_CONSTANTS.HEX_SIZE;
    const worldH = gridRows * HEX_SCALE_Y * HEX_CONSTANTS.HEX_SIZE;
    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;
    const fitK = Math.min(
      (canvasW * FIT_PADDING) / worldW,
      (canvasH * FIT_PADDING) / worldH,
    );
    // Clamp to zoom extent
    k = Math.max(CAMERA_CONSTANTS.MIN_ZOOM, Math.min(CAMERA_CONSTANTS.MAX_ZOOM, fitK));
  }

  // World center: hexToPixel gives positive y, but HexFillMesh stores
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
