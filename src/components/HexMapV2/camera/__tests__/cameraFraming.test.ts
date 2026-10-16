/**
 * THR-1900 — the opening view and known-land fit (plan THR-1878 D8).
 */
import { describe, it, expect } from 'vitest';
import type { VisibilityMap } from '../../../../types/visibility';
import { hexToWorld } from '../../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../../scene/HexFillMesh';
import { CAMERA_CONSTANTS } from '../D3ZoomCamera';
import {
  boundsOfHexes,
  computeOpeningView,
  fitKnownLand,
  knownHexes,
  panView,
  zoomLimits,
  zoomStepView,
} from '../cameraFraming';

function visibility(known: [number, number][], unexplored: [number, number][] = []): VisibilityMap {
  const map: VisibilityMap = new Map();
  for (const [c, r] of known) map.set(`${c},${r}`, { state: 'visible' });
  for (const [c, r] of unexplored) map.set(`${c},${r}`, { state: 'unexplored' });
  return map;
}

/** A small explored patch around (20,20): roughly what a fresh run knows. */
const PATCH: [number, number][] = [];
for (let c = 17; c <= 23; c++) for (let r = 18; r <= 22; r++) PATCH.push([c, r]);

const BASE = {
  cols: 48,
  rows: 16,
  canvasW: 1260,
  canvasH: 1000,
  minK: 0.5,
  maxK: CAMERA_CONSTANTS.MAX_ZOOM,
  fogEnabled: true,
};

describe('knownHexes / boundsOfHexes', () => {
  it('skips unexplored entries and pads by one hex radius', () => {
    const vis = visibility([[2, 2], [4, 3]], [[9, 9]]);
    expect(knownHexes(vis)).toEqual([{ col: 2, row: 2 }, { col: 4, row: 3 }]);
    const b = boundsOfHexes(knownHexes(vis))!;
    const a = hexToWorld({ col: 2, row: 2 }, HEX_CONSTANTS.HEX_SIZE);
    expect(b.minX).toBeCloseTo(a.x - HEX_CONSTANTS.HEX_SIZE);
    expect(boundsOfHexes([])).toBeNull();
  });
});

describe('computeOpeningView (D8)', () => {
  it('opens centred on the First with k in [6, 10]', () => {
    const first = { col: 20, row: 20 };
    const view = computeOpeningView({ ...BASE, firstHex: first, seatHex: { col: 3, row: 3 }, visibilityMap: visibility(PATCH) });
    expect(view.centredOn).toBe('first');
    expect(view.k).toBeGreaterThanOrEqual(CAMERA_CONSTANTS.OPENING_ZOOM_MIN);
    expect(view.k).toBeLessThanOrEqual(CAMERA_CONSTANTS.OPENING_ZOOM_MAX);
    const w = hexToWorld(first, HEX_CONSTANTS.HEX_SIZE);
    expect(view.x).toBeCloseTo(w.x);
    expect(view.y).toBeCloseTo(w.y);
  });

  it('clamps a tiny known patch up to OPENING_ZOOM_MAX and a huge one down to OPENING_ZOOM_MIN', () => {
    const tiny = computeOpeningView({ ...BASE, firstHex: { col: 5, row: 5 }, seatHex: null, visibilityMap: visibility([[5, 5]]) });
    expect(tiny.k).toBe(CAMERA_CONSTANTS.OPENING_ZOOM_MAX);
    const wide: [number, number][] = [[0, 0], [47, 15]];
    const big = computeOpeningView({ ...BASE, firstHex: { col: 5, row: 5 }, seatHex: null, visibilityMap: visibility(wide) });
    expect(big.k).toBe(CAMERA_CONSTANTS.OPENING_ZOOM_MIN);
  });

  it('falls back to the seat, then the known land, then the grid', () => {
    const vis = visibility(PATCH);
    expect(computeOpeningView({ ...BASE, firstHex: null, seatHex: { col: 19, row: 19 }, visibilityMap: vis }).centredOn).toBe('seat');
    expect(computeOpeningView({ ...BASE, firstHex: null, seatHex: null, visibilityMap: vis }).centredOn).toBe('land');
    expect(computeOpeningView({ ...BASE, firstHex: { col: 1, row: 1 }, seatHex: null, visibilityMap: undefined }).centredOn).toBe('grid');
    expect(computeOpeningView({ ...BASE, fogEnabled: false, firstHex: { col: 1, row: 1 }, seatHex: null, visibilityMap: vis }).centredOn).toBe('grid');
    expect(computeOpeningView({ ...BASE, firstHex: { col: 1, row: 1 }, seatHex: null, visibilityMap: visibility([], [[1, 1]]) }).centredOn).toBe('grid');
  });

  it('is deterministic', () => {
    const input = { ...BASE, firstHex: { col: 20, row: 20 }, seatHex: null, visibilityMap: visibility(PATCH) };
    expect(computeOpeningView(input)).toEqual(computeOpeningView(input));
  });
});

describe('fitKnownLand / zoom steps / pan', () => {
  it('fits the known land unclamped by the opening range', () => {
    const view = fitKnownLand(visibility([[5, 5]]), 1260, 1000, 0.5, 20)!;
    expect(view.k).toBeGreaterThan(CAMERA_CONSTANTS.OPENING_ZOOM_MAX);
    expect(fitKnownLand(visibility([]), 1260, 1000, 0.5, 20)).toBeNull();
  });

  it('a zoom step multiplies k and stops at the limits', () => {
    expect(zoomStepView({ x: 0, y: 0, k: 4 }, 2, 0.5, 20).k).toBe(8);
    expect(zoomStepView({ x: 0, y: 0, k: 16 }, 2, 0.5, 20).k).toBe(20);
    expect(zoomLimits(20, 0.5, 20)).toEqual({ atMax: true, atMin: false });
    expect(zoomLimits(0.5, 0.5, 20)).toEqual({ atMax: false, atMin: true });
  });

  it('pans by a share of the canvas in world units at the current zoom', () => {
    const v = panView({ x: 100, y: 50, k: 10 }, 1 / 3, 0, 1200, 900);
    expect(v.x).toBeCloseTo(140);
    expect(v.y).toBe(50);
  });
});
