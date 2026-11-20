/**
 * THR-2260 — the pan clamp: the grid never covers less than PAN_MIN_GRID_COVER of the canvas.
 */
import { describe, it, expect } from 'vitest';
import { clampPanTransform, gridCoverShare, gridPixelBounds, PAN_MIN_GRID_COVER, type PanTransform } from '../panClamp';
import { STAGE_CLOSE_CENTRE_BAND_FRACTION } from '../../../../data/stage-content';
import { hexToPixel } from '../../../../lib/hexMath';
import { HEX_CONSTANTS } from '../../scene/HexFillMesh';

const SIZE = HEX_CONSTANTS.HEX_SIZE;
// The medium map's shape is not load-bearing; any grid larger than the canvas at k ≥ 2 will do.
const COLS = 60;
const ROWS = 40;
const BOUNDS = gridPixelBounds(COLS, ROWS, SIZE)!;
const CANVAS = { w: 1600, h: 1032 };

/** A transform that puts pixel-space point (px, py) at screen (sx, sy) at zoom k. */
function placing(px: number, py: number, sx: number, sy: number, k: number): PanTransform {
  // screen = size/2 + (p - c) * k  →  c = p - (screen - size/2) / k ; t = -c * k
  const cx = px - (sx - CANVAS.w / 2) / k;
  const cy = py - (sy - CANVAS.h / 2) / k;
  return { x: -cx * k, y: -cy * k, k };
}

function screenOf(px: number, py: number, t: PanTransform) {
  const cx = -t.x / t.k;
  const cy = -t.y / t.k;
  return { x: CANVAS.w / 2 + (px - cx) * t.k, y: CANVAS.h / 2 + (py - cy) * t.k };
}

describe('clampPanTransform (THR-2260)', () => {
  it('a view in the middle of the grid is returned unchanged (same object)', () => {
    const mid = hexToPixel({ col: 30, row: 20 }, SIZE);
    const t = placing(mid.x, mid.y, CANVAS.w / 2, CANVAS.h / 2, 6);
    expect(clampPanTransform(t, BOUNDS, CANVAS)).toBe(t);
  });

  it('a west-edge place pushed to the right edge is pulled back until the grid covers the share', () => {
    const west = hexToPixel({ col: 0, row: 20 }, SIZE);
    const t = placing(west.x, west.y, 1500, CANVAS.h / 2, 6);
    expect(gridCoverShare(t, BOUNDS, CANVAS).x).toBeLessThan(PAN_MIN_GRID_COVER);
    const c = clampPanTransform(t, BOUNDS, CANVAS);
    expect(c).not.toBe(t);
    expect(gridCoverShare(c, BOUNDS, CANVAS).x).toBeGreaterThanOrEqual(PAN_MIN_GRID_COVER - 1e-9);
    expect(c.k).toBe(t.k);
  });

  it('at every zoom, from any wild pan, the clamped grid covers at least the share (or the whole grid)', () => {
    for (const k of [0.5, 1, 2, 3, 6, 10, 20]) {
      for (const [sx, sy] of [[-5000, -5000], [5000, 5000], [-5000, 5000], [5000, -5000], [800, 500]]) {
        const t = placing(0, 0, sx, sy, k);
        const c = clampPanTransform(t, BOUNDS, CANVAS);
        const cover = gridCoverShare(c, BOUNDS, CANVAS);
        const gridShareX = Math.min(1, ((BOUNDS.xMax - BOUNDS.xMin) * k) / CANVAS.w);
        const gridShareY = Math.min(1, ((BOUNDS.yMax - BOUNDS.yMin) * k) / CANVAS.h);
        expect(cover.x).toBeGreaterThanOrEqual(Math.min(PAN_MIN_GRID_COVER, gridShareX) - 1e-9);
        expect(cover.y).toBeGreaterThanOrEqual(Math.min(PAN_MIN_GRID_COVER, gridShareY) - 1e-9);
      }
    }
  });

  it('after the close re-centres a west-edge place, the clamp keeps it inside the centre band', () => {
    const west = hexToPixel({ col: 0, row: 20 }, SIZE);
    for (const k of [3, 6, 10]) {
      const centred = placing(west.x, west.y, CANVAS.w / 2, CANVAS.h / 2, k);
      const c = clampPanTransform(centred, BOUNDS, CANVAS);
      const at = screenOf(west.x, west.y, c);
      const band = (CANVAS.w * STAGE_CLOSE_CENTRE_BAND_FRACTION);
      expect(at.x).toBeGreaterThanOrEqual(band);
      expect(at.x).toBeLessThanOrEqual(CANVAS.w - band);
    }
  });

  it('degenerate input passes through (fail-soft)', () => {
    const t = { x: 1, y: 2, k: 3 };
    expect(clampPanTransform(t, null, CANVAS)).toBe(t);
    expect(clampPanTransform(t, BOUNDS, { w: 0, h: 10 })).toBe(t);
    expect(gridPixelBounds(0, 10, SIZE)).toBeNull();
  });
});
