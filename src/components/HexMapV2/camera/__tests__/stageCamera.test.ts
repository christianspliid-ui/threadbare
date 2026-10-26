/**
 * THR-1892 — the Stage's camera math (plan THR-1877 § D6).
 */
import { describe, it, expect } from 'vitest';
import { centreForWorldAt, centroid, chooseStageFrame, chooseStageZoom, hexScreenWidth, inMiddleBand, recentreOnClose } from '../stageCamera';
import { STAGE_CLOSE_CENTRE_BAND_FRACTION } from '../../../../data/stage-content';
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

describe('centroid and recentreOnClose', () => {
  it('centroid of none is null; of points, their mean', () => {
    expect(centroid([])).toBeNull();
    expect(centroid([{ x: 0, y: 0 }, { x: 4, y: 2 }])).toEqual({ x: 2, y: 1 });
  });

  // THR-2056 — the round-5 shape: a place eased into the Stage window at the right edge.
  const rect = { left: 0, top: 48, right: 1305, bottom: 1080 };
  const centre = { x: 652.5, y: 564 };

  it('a place in the middle third stays; the camera does not move', () => {
    expect(inMiddleBand(centre, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toBe(true);
    expect(recentreOnClose({ x: 700, y: 600 }, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toBeNull();
  });

  it('a place left at the right edge goes to the visible map centre, not 48 px inside the edge', () => {
    expect(recentreOnClose({ x: 1256, y: 564 }, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toEqual(centre);
  });

  it('a place past the canvas, or above or below the middle third, is centred too', () => {
    expect(recentreOnClose({ x: 1780, y: 564 }, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toEqual(centre);
    expect(recentreOnClose({ x: 652, y: 100 }, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toEqual(centre);
  });

  it('three closes in a row never drift: each lands in the middle third', () => {
    let at = { x: 1256, y: 900 };
    for (let i = 0; i < 3; i++) {
      at = recentreOnClose(at, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION) ?? at;
      expect(inMiddleBand(at, rect, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toBe(true);
      at = { x: at.x + 600, y: at.y }; // the next chapter eases it back into the right-edge window
    }
  });

  it('an empty rect moves nothing', () => {
    expect(recentreOnClose({ x: 0, y: 0 }, { left: 0, top: 0, right: 0, bottom: 50 }, STAGE_CLOSE_CENTRE_BAND_FRACTION)).toBeNull();
  });
});

// THR-1897 (§ D6) — a premonition frames its options' places when they all fit at k ≥ 5.
describe('chooseStageFrame', () => {
  const window = { w: 280, h: 984 };

  it('one point frames itself at the chosen zoom', () => {
    expect(chooseStageFrame([{ x: 0, y: 0 }], 10, window, 1)).toEqual({ framed: 1, zoom: 10 });
  });

  it('places that fit at the chosen zoom are all framed there', () => {
    expect(chooseStageFrame([{ x: 0, y: 0 }, { x: 10, y: 0 }], 5, window, 1)).toEqual({ framed: 2, zoom: 5 });
  });

  it('places that fit only further out are framed at the zoom that fits, while it is at least 5', () => {
    const r = chooseStageFrame([{ x: 0, y: 0 }, { x: 30, y: 0 }], 10, window, 1);
    expect(r.framed).toBe(2);
    expect(r.zoom).toBeCloseTo(280 / 50);
  });

  it('places too far apart to fit at 5 frame the mortal alone, at the chosen zoom', () => {
    expect(chooseStageFrame([{ x: 0, y: 0 }, { x: 200, y: 0 }], 10, window, 1)).toEqual({ framed: 1, zoom: 10 });
  });
});
