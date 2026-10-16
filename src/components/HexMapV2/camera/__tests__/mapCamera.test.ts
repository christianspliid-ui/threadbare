// @vitest-environment jsdom
/**
 * THR-1900 — the map camera controller on a real d3-zoom (plan THR-1878 D7, D8).
 *
 * - The opening frame's label tier equals the tier of the zoom actually applied (the old
 *   bug: the labels' zoom state started at DEFAULT_ZOOM until the first zoom event).
 * - Every "show me" lands at FOCUS_ZOOM and traces `ui_map_camera_jump` with k = 10.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import * as d3 from 'd3';
import { setupD3Zoom, CAMERA_CONSTANTS } from '../D3ZoomCamera';
import { createMapCamera, onZoomK } from '../mapCamera';
import { getZoomTier } from '../../scene/ZoomVisibilityMatrix';
import type { VisibilityMap } from '../../../../types/visibility';
import { clearTraces, enableTracing, getTraces } from '../../../../engine/traceBuffer';

const COLS = 48;
const ROWS = 16;

function makeCanvas(w = 1260, h = 1000): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', { value: w });
  Object.defineProperty(canvas, 'clientHeight', { value: h });
  document.body.appendChild(canvas);
  return canvas;
}

function setup(visibility: VisibilityMap | undefined, fogEnabled = true) {
  const canvas = makeCanvas();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
  const { zoom } = setupD3Zoom(canvas, camera, COLS, ROWS);
  const mapCamera = createMapCamera({
    canvas: () => canvas,
    zoom: () => zoom,
    visibilityMap: () => visibility,
    fogEnabled: () => fogEnabled,
    tick: () => 7,
    grid: () => ({ cols: COLS, rows: ROWS }),
  });
  return { canvas, zoom, mapCamera };
}

const patch: VisibilityMap = new Map();
for (let c = 17; c <= 23; c++) for (let r = 4; r <= 9; r++) patch.set(`${c},${r}`, { state: 'visible' });

function jumps() {
  return getTraces().filter(t => t.category === 'ui_map_camera_jump') as unknown as { reason: string; k: number; target: string | null; tick: number }[];
}

beforeEach(() => {
  enableTracing();
  clearTraces();
});

describe('onZoomK — the labels zoom state is seeded from the applied transform', () => {
  it('reports the applied k at registration, then the opening k, never DEFAULT_ZOOM', () => {
    const { canvas, zoom, mapCamera } = setup(patch);
    const seen: number[] = [];
    onZoomK(zoom, canvas, 'labels', k => seen.push(k));
    expect(seen[0]).toBe(d3.zoomTransform(canvas).k);

    const opening = mapCamera.applyOpening({ col: 20, row: 6 }, null)!;
    const firstRenderedTier = getZoomTier(seen[seen.length - 1]);
    expect(firstRenderedTier).toBe(getZoomTier(d3.zoomTransform(canvas).k));
    expect(firstRenderedTier).toBe(getZoomTier(opening.k));
    expect(seen).not.toContain(CAMERA_CONSTANTS.DEFAULT_ZOOM);
  });
});

describe('applyOpening (D8)', () => {
  it('opens on the First with k in [6, 10], with no animation, and traces it', () => {
    const { canvas, mapCamera } = setup(patch);
    const opening = mapCamera.applyOpening({ col: 20, row: 6 }, { col: 2, row: 2 })!;
    expect(opening.centredOn).toBe('first');
    expect(opening.k).toBeGreaterThanOrEqual(6);
    expect(opening.k).toBeLessThanOrEqual(10);
    expect(d3.zoomTransform(canvas).k).toBe(opening.k);
    expect(mapCamera.getOpening()).toEqual(opening);
    const [jump] = jumps();
    expect(jump).toMatchObject({ reason: 'opening', k: opening.k, target: '20,6', tick: 7 });
  });

  it('opens on the whole grid with fog off', () => {
    const { mapCamera } = setup(patch, false);
    expect(mapCamera.applyOpening({ col: 20, row: 6 }, null)!.centredOn).toBe('grid');
  });
});

describe('focusOn / zoomBy / showKnownLand', () => {
  it('focusOn traces k = FOCUS_ZOOM for every "show me" reason', () => {
    const { mapCamera } = setup(patch);
    mapCamera.focusOn({ col: 20, row: 6 }, 'centre_first');
    mapCamera.focusOn({ col: 3, row: 3 }, 'centre_seat');
    mapCamera.focusOn({ col: 9, row: 9 });
    expect(jumps().map(j => [j.reason, j.k, j.target])).toEqual([
      ['centre_first', CAMERA_CONSTANTS.FOCUS_ZOOM, '20,6'],
      ['centre_seat', CAMERA_CONSTANTS.FOCUS_ZOOM, '3,3'],
      ['focus', CAMERA_CONSTANTS.FOCUS_ZOOM, '9,9'],
    ]);
  });

  it('zoomBy refuses at the limit and traces a step otherwise', () => {
    const { canvas, zoom, mapCamera } = setup(patch);
    d3.select(canvas).call(zoom.transform, d3.zoomIdentity.scale(CAMERA_CONSTANTS.MAX_ZOOM));
    expect(mapCamera.zoomBy(2)).toBe(false);
    expect(mapCamera.zoomBy(0.5)).toBe(true);
    expect(jumps().at(-1)).toMatchObject({ reason: 'zoom_step', k: CAMERA_CONSTANTS.MAX_ZOOM / 2, target: null });
  });

  it('showKnownLand traces known_land; subscribe reports now and on every zoom event', () => {
    const { canvas, zoom, mapCamera } = setup(patch);
    const states: number[] = [];
    const off = mapCamera.subscribe(s => states.push(s.k));
    expect(states).toHaveLength(1);
    onZoomK(zoom, canvas, 'notify', () => mapCamera.notify());
    d3.select(canvas).call(zoom.transform, d3.zoomIdentity.scale(4));
    expect(states.at(-1)).toBe(4);
    off();
    mapCamera.showKnownLand();
    expect(jumps().at(-1)?.reason).toBe('known_land');
  });

  it('is a no-op before d3-zoom is attached', () => {
    const mapCamera = createMapCamera({
      canvas: () => null,
      zoom: () => null,
      visibilityMap: () => undefined,
      fogEnabled: () => true,
      tick: () => 0,
      grid: () => ({ cols: 1, rows: 1 }),
    });
    expect(() => mapCamera.focusOn({ col: 1, row: 1 })).not.toThrow();
    expect(mapCamera.zoomBy(2)).toBe(false);
    expect(mapCamera.applyOpening(null, null)).toBeNull();
    expect(jumps()).toHaveLength(0);
  });
});
