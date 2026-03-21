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
export function setupD3Zoom(
  canvas: HTMLCanvasElement,
  camera: THREE.OrthographicCamera,
): { zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown>; destroy: () => void } {
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([CAMERA_CONSTANTS.MIN_ZOOM, CAMERA_CONSTANTS.MAX_ZOOM])
    // Disable double-click zoom — per CONTEXT.md decision
    .filter((event: Event) => event.type !== 'dblclick')
    .on('zoom', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      syncCameraToZoom(camera, event.transform, canvas.clientWidth, canvas.clientHeight);
    });

  const selection = d3.select(canvas);
  selection.call(zoom);

  // Center the initial view on the grid midpoint at DEFAULT_ZOOM
  const midHex = {
    col: Math.floor(HEX_CONSTANTS.GRID_COLS / 2),
    row: Math.floor(HEX_CONSTANTS.GRID_ROWS / 2),
  };
  const { x: gridCenterX, y: gridCenterY } = hexToPixel(midHex, HEX_CONSTANTS.HEX_SIZE);
  const k = CAMERA_CONSTANTS.DEFAULT_ZOOM;
  const canvasW = canvas.clientWidth || 800;
  const canvasH = canvas.clientHeight || 600;

  // d3 transform: tx = canvasW/2 - worldX * k, ty = canvasH/2 + worldY * k
  // (worldY uses +worldY because HexFillMesh stores world at -y for Y-flip,
  //  so the center pixel in d3 space is canvasH/2 - (-gridCenterY)*k = canvasH/2 + gridCenterY*k)
  const initialTransform = d3.zoomIdentity
    .translate(canvasW / 2 - gridCenterX * k, canvasH / 2 + gridCenterY * k)
    .scale(k);

  selection.call(zoom.transform, initialTransform);

  const destroy = () => {
    selection.on('.zoom', null);
  };

  return { zoom, destroy };
}
