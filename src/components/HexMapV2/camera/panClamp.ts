/**
 * panClamp — the map can never be panned so far that the grid leaves most of the canvas
 * empty parchment (THR-2260, cold playtest round 8: "half the screen empty parchment").
 *
 * The rule, per axis: the grid's on-screen extent must cover at least
 * `PAN_MIN_GRID_COVER` of the canvas, or the whole grid when the grid is smaller than
 * that (zoomed far out). With a cover share of at most ½ this is exactly a bound on the
 * camera centre, so the clamp is a pure clamp of the centre — no iteration, no state.
 *
 * Coordinates: this module works in `hexToPixel` space (x right, y DOWN). The d3 transform
 * HexMapV2 uses maps to that space as centre x = -t.x / k, centre y = -t.y / k
 * (see `syncCameraToZoom`: world y-up = t.y / k, and world y = -pixel y).
 *
 * NFP #1: the share is a named constant. NFP #4: degenerate input returns the transform
 * unchanged, never throws.
 */
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';

/** THR-2260 — the least share of the canvas (per axis) the grid must cover. At most ½. */
export const PAN_MIN_GRID_COVER = 0.5;

export interface GridPixelBounds { xMin: number; xMax: number; yMin: number; yMax: number }
export interface PanTransform { x: number; y: number; k: number }

/** The grid's outline in `hexToPixel` space: hex centres plus the hex's own reach. */
export function gridPixelBounds(cols: number, rows: number, hexSize: number): GridPixelBounds | null {
  if (!(cols > 0) || !(rows > 0) || !(hexSize > 0)) return null;
  const halfH = (HEX_SCALE_Y * hexSize) / 2;
  return {
    xMin: -hexSize,
    xMax: (cols - 1) * HEX_SCALE_X * hexSize + hexSize,
    yMin: -halfH,
    // Odd columns sit half a row lower.
    yMax: (rows - 1) * HEX_SCALE_Y * hexSize + halfH * (cols > 1 ? 2 : 1),
  };
}

/** One axis: the allowed range of the camera centre for a grid span [lo, hi] on a canvas `size` px at zoom k. */
function centreRange(lo: number, hi: number, size: number, k: number, cover: number): [number, number] {
  const gridPx = (hi - lo) * k;
  const required = Math.min(cover * size, gridPx);
  const slack = (size / 2 - required) / k;
  const from = lo - slack;
  const to = hi + slack;
  if (from > to) {
    const mid = (lo + hi) / 2;
    return [mid, mid];
  }
  return [from, to];
}

/**
 * The transform, with its centre pulled back inside the bound. Returns the same object
 * when it is already inside (so callers can compare by identity).
 */
export function clampPanTransform(
  t: PanTransform,
  bounds: GridPixelBounds | null,
  canvas: { w: number; h: number },
  cover: number = PAN_MIN_GRID_COVER,
): PanTransform {
  if (!bounds || !(t.k > 0) || !(canvas.w > 0) || !(canvas.h > 0)) return t;
  const share = Math.max(0, Math.min(0.5, cover));
  const cx = -t.x / t.k;
  const cy = -t.y / t.k;
  const [x0, x1] = centreRange(bounds.xMin, bounds.xMax, canvas.w, t.k, share);
  const [y0, y1] = centreRange(bounds.yMin, bounds.yMax, canvas.h, t.k, share);
  const nx = Math.max(x0, Math.min(x1, cx));
  const ny = Math.max(y0, Math.min(y1, cy));
  if (nx === cx && ny === cy) return t;
  return { x: -nx * t.k, y: -ny * t.k, k: t.k };
}

/** The share of the canvas the grid covers, per axis (0..1). For tests and the debug bridge. */
export function gridCoverShare(
  t: PanTransform,
  bounds: GridPixelBounds,
  canvas: { w: number; h: number },
): { x: number; y: number } {
  const cx = -t.x / t.k;
  const cy = -t.y / t.k;
  const axis = (lo: number, hi: number, c: number, size: number) => {
    const a = size / 2 + (lo - c) * t.k;
    const b = size / 2 + (hi - c) * t.k;
    return Math.max(0, Math.min(size, b) - Math.max(0, a)) / size;
  };
  return { x: axis(bounds.xMin, bounds.xMax, cx, canvas.w), y: axis(bounds.yMin, bounds.yMax, cy, canvas.h) };
}
