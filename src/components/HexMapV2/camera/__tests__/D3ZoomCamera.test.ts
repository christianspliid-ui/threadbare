import { describe, it, expect } from 'vitest';
import { syncCameraToZoom, CAMERA_CONSTANTS, computeFitZoom, computeMinZoom } from '../D3ZoomCamera';
import * as THREE from 'three';
import { zoomIdentity } from 'd3-zoom';

describe('syncCameraToZoom', () => {
  function makeCamera(): THREE.OrthographicCamera {
    return new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
  }

  it('sets camera frustum to full canvas at identity transform', () => {
    const camera = makeCamera();
    const transform = zoomIdentity; // k=1, x=0, y=0
    syncCameraToZoom(camera, transform, 1920, 1080);
    // halfW = 1920/2/1 = 960, halfH = 1080/2/1 = 540
    // cx = 0, cy = 0
    expect(camera.left).toBe(-960);
    expect(camera.right).toBe(960);
    expect(camera.top).toBe(540);
    expect(camera.bottom).toBe(-540);
  });

  it('zooming in (k=2) halves the visible frustum', () => {
    const camera = makeCamera();
    const transform = zoomIdentity.scale(2); // k=2, x=0, y=0
    syncCameraToZoom(camera, transform, 1920, 1080);
    // halfW = 1920/2/2 = 480, halfH = 1080/2/2 = 270
    expect(camera.left).toBe(-480);
    expect(camera.right).toBe(480);
    expect(camera.top).toBe(270);
    expect(camera.bottom).toBe(-270);
  });

  it('panning shifts camera center correctly', () => {
    const camera = makeCamera();
    // d3 transform with translation: x=100, y=200, k=1
    const transform = zoomIdentity.translate(100, 200);
    syncCameraToZoom(camera, transform, 1920, 1080);
    // cx = -100/1 = -100, cy = 200/1 = 200 (Y-flip)
    // frustum: [-100-960, -100+960] x [200-540, 200+540]
    expect(camera.left).toBe(-1060);
    expect(camera.right).toBe(860);
    expect(camera.top).toBe(740);
    expect(camera.bottom).toBe(-340);
  });

  it('combined zoom and pan produces correct frustum', () => {
    const camera = makeCamera();
    // zoomIdentity.scale(4).translate(-50, 25) gives k=4, x=-200, y=100
    // (d3 applies translate in scaled space, so x = tx*k = -50*4 = -200, y = ty*k = 25*4 = 100)
    const transform = zoomIdentity.scale(4).translate(-50, 25);
    syncCameraToZoom(camera, transform, 800, 600);
    // halfW = 800/2/4 = 100, halfH = 600/2/4 = 75
    // cx = -(-200)/4 = 50, cy = 100/4 = 25
    expect(camera.left).toBe(50 - 100);   // -50
    expect(camera.right).toBe(50 + 100);  // 150
    expect(camera.top).toBe(25 + 75);     // 100
    expect(camera.bottom).toBe(25 - 75);  // -50
  });
});

describe('CAMERA_CONSTANTS', () => {
  it('has expected zoom range values', () => {
    expect(CAMERA_CONSTANTS.MIN_ZOOM_FLOOR).toBe(2);
    expect(CAMERA_CONSTANTS.ABSOLUTE_MIN_ZOOM).toBe(0.5);
    expect(CAMERA_CONSTANTS.MAX_ZOOM).toBe(20);
    expect(CAMERA_CONSTANTS.JUMP_TO_DURATION_MS).toBe(500);
    expect(CAMERA_CONSTANTS.DEFAULT_ZOOM).toBe(1.5);
  });
});

// THR-1649: the camera can zoom out to the whole map.
describe('computeFitZoom / computeMinZoom', () => {
  it('fits a medium 32×24 grid at 1920×1080 below the old clamp of 5', () => {
    const fitK = computeFitZoom(32, 24, 1920, 1080);
    expect(fitK).not.toBeNull();
    expect(fitK!).toBeLessThan(5);
    // The whole-map zoom is reachable: the floor never sits above the fit zoom.
    expect(computeMinZoom(fitK)).toBeLessThanOrEqual(fitK!);
  });

  it('keeps MIN_ZOOM_FLOOR when the grid already fits above it', () => {
    const fitK = computeFitZoom(8, 6, 1920, 1080)!;
    expect(fitK).toBeGreaterThan(CAMERA_CONSTANTS.MIN_ZOOM_FLOOR);
    expect(computeMinZoom(fitK)).toBe(CAMERA_CONSTANTS.MIN_ZOOM_FLOOR);
  });

  it('drops below the floor for a large grid so it can still show whole', () => {
    const fitK = computeFitZoom(48, 36, 1920, 1080)!;
    expect(fitK).toBeLessThan(CAMERA_CONSTANTS.MIN_ZOOM_FLOOR);
    expect(computeMinZoom(fitK)).toBeCloseTo(fitK);
  });

  it('never zooms out past ABSOLUTE_MIN_ZOOM', () => {
    expect(computeMinZoom(0.01)).toBe(CAMERA_CONSTANTS.ABSOLUTE_MIN_ZOOM);
  });

  it('fails soft on degenerate input', () => {
    expect(computeFitZoom(0, 24, 1920, 1080)).toBeNull();
    expect(computeFitZoom(32, 24, 0, 0)).toBeNull();
    expect(computeMinZoom(null)).toBe(CAMERA_CONSTANTS.MIN_ZOOM_FLOOR);
    expect(computeMinZoom(Number.NaN)).toBe(CAMERA_CONSTANTS.MIN_ZOOM_FLOOR);
  });
});
