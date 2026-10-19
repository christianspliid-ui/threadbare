/**
 * THR-1892 — the Stage's camera math (plan THR-1877 § D6).
 */
import { describe, it, expect } from 'vitest';
import { centreForWorldAt, centroid, chooseStageZoom, hexScreenWidth, nudgeInside } from '../stageCamera';
import { CAMERA_CONSTANTS } from '../D3ZoomCamera';

describe('centreForWorldAt', () => {
  it('a world point at the canvas centre needs the camera on it', () => {
    expect(centreForWorldAt({ x: 100, y: 50 }, { x: 400, y: 300 }, { w: 800, h: 600 }, 10)).toEqual({ x: 100, y: 50, k: 10 });
  });

  it('a point right of centre moves the camera left by the offset over k; below moves it up (y-up world)', () => {
    const c = centreForWorldAt({ x: 100, y: 50 }, { x: 600, y: 400 }, { w: 800, h: 600 }, 10);
    expect(c.x).toBeCloseTo(80);
    expect(c.y).toBeCloseTo(60);
  });
});

describe('chooseStageZoom', () => {
  const [minK, maxK] = [CAMERA_CONSTANTS.MIN_ZOOM_FLOOR, CAMERA_CONSTANTS.MAX_ZOOM];

  it('keeps a legible zoom whose hex fits the window', () => {
    // k 6: a 120 px hex in a 280 px window (0.43 of it).
    expect(chooseStageZoom(6, 280, minK, maxK)).toBe(6);
  });

  it('below the label zoom it uses FOCUS_ZOOM', () => {
    expect(chooseStageZoom(3, 280, minK, maxK)).toBe(CAMERA_CONSTANTS.FOCUS_ZOOM);
  });

  it('a hex wider than 0.8 of the window uses FOCUS_ZOOM', () => {
    // k 15: a 300 px hex in a 280 px window.
    expect(hexScreenWidth(15)).toBe(300);
    expect(chooseStageZoom(15, 280, minK, maxK)).toBe(CAMERA_CONSTANTS.FOCUS_ZOOM);
  });

  it('FOCUS_ZOOM is clamped to the camera limits', () => {
    expect(chooseStageZoom(1, 280, minK, 8)).toBe(8);
  });
});

describe('centroid and nudgeInside', () => {
  it('centroid of none is null; of points, their mean', () => {
    expect(centroid([])).toBeNull();
    expect(centroid([{ x: 0, y: 0 }, { x: 4, y: 2 }])).toEqual({ x: 2, y: 1 });
  });

  it('a point inside the margin stays; one past the right edge comes back by the least distance', () => {
    const rect = { left: 320, top: 48, right: 1580, bottom: 1080 };
    expect(nudgeInside({ x: 900, y: 500 }, rect, 48)).toBeNull();
    expect(nudgeInside({ x: 1780, y: 564 }, rect, 48)).toEqual({ x: 1532, y: 564 });
  });

  it('a rect too small for its margin moves nothing', () => {
    expect(nudgeInside({ x: 0, y: 0 }, { left: 0, top: 0, right: 50, bottom: 50 }, 48)).toBeNull();
  });
});
