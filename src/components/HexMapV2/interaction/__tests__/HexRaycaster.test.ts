import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { screenToHex, worldToScreen, hexToWorldCenter, INTERACTION_CONSTANTS } from '../HexRaycaster';
import { hexToPixel } from '../../../../lib/hexMath';
import { HEX_CONSTANTS } from '../../scene/HexFillMesh';

/** Build an orthographic camera covering a given world rectangle. */
function makeCameraForWorld(
  left: number, right: number, top: number, bottom: number,
): THREE.OrthographicCamera {
  const cam = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 10000);
  cam.position.set(0, 0, 100);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  return cam;
}

/** Minimal canvas-like object for tests (doesn't need real DOM). */
function makeCanvas(width: number, height: number): HTMLCanvasElement {
  return { clientWidth: width, clientHeight: height } as HTMLCanvasElement;
}

describe('INTERACTION_CONSTANTS', () => {
  it('has expected values', () => {
    expect(INTERACTION_CONSTANTS.SELECTED_RING_WIDTH).toBe(2.5);
    expect(INTERACTION_CONSTANTS.HOVER_OVERLAY_OPACITY).toBe(0.10);
    expect(INTERACTION_CONSTANTS.TOOLTIP_OFFSET_Y).toBe(12);
  });
});

describe('screenToHex', () => {
  it('returns null for coordinates that map outside the grid (negative col)', () => {
    // Camera centered at world (0,0), canvas 800x600
    // Click at (0,0) screen → world at camera left/top, likely outside grid
    const cam = makeCameraForWorld(-400, 400, 300, -300);
    const canvas = makeCanvas(800, 600);
    // Very far left click — should be outside the 200-col grid
    const result = screenToHex(0, 300, cam, canvas);
    // World x at screen x=0: -400 (camera left edge), col would be very negative
    if (result !== null) {
      // It's valid only if it actually maps within [0,200) x [0,300) — reject test if so
      expect(result.col >= 0 && result.col < HEX_CONSTANTS.GRID_COLS).toBe(true);
    }
    // Explicitly test with a world that maps to col < 0
    const farLeftCam = makeCameraForWorld(-500, -100, 300, -300);
    const farResult = screenToHex(400, 300, farLeftCam, canvas);
    expect(farResult).toBeNull();
  });

  it('returns null for coordinates that map outside the grid (row out of range)', () => {
    // Camera showing world below row 300
    const size = HEX_CONSTANTS.HEX_SIZE;
    const worldYBeyondGrid = -(300 * Math.sqrt(3) * size + size); // below last row
    const farDownCam = makeCameraForWorld(-100, 100, worldYBeyondGrid - 100, worldYBeyondGrid - 200);
    const canvas = makeCanvas(200, 200);
    const result = screenToHex(100, 100, farDownCam, canvas);
    expect(result).toBeNull();
  });

  it('round-trips hexToPixel for a known hex coordinate', () => {
    // Pick a hex in the middle of the grid
    const targetHex = { col: 10, row: 15 };
    const { x: px, y: py } = hexToPixel(targetHex, HEX_CONSTANTS.HEX_SIZE);
    // World position (px, -py) — Y-flipped as in HexFillMesh
    const worldX = px;
    const worldY = -py;

    // Create a camera that centers on this world point
    const halfW = 200;
    const halfH = 200;
    const cam = makeCameraForWorld(worldX - halfW, worldX + halfW, worldY + halfH, worldY - halfH);
    const canvas = makeCanvas(400, 400);

    // The hex center is at canvas center (200, 200)
    const result = screenToHex(200, 200, cam, canvas);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(targetHex.col);
    expect(result!.row).toBe(targetHex.row);
  });

  it('round-trips for an odd-column hex (column 5)', () => {
    const targetHex = { col: 5, row: 10 };
    const { x: px, y: py } = hexToPixel(targetHex, HEX_CONSTANTS.HEX_SIZE);
    const worldX = px;
    const worldY = -py;

    const halfW = 150;
    const halfH = 150;
    const cam = makeCameraForWorld(worldX - halfW, worldX + halfW, worldY + halfH, worldY - halfH);
    const canvas = makeCanvas(300, 300);

    // Hex center at canvas center
    const result = screenToHex(150, 150, cam, canvas);
    expect(result).not.toBeNull();
    expect(result!.col).toBe(targetHex.col);
    expect(result!.row).toBe(targetHex.row);
  });
});

describe('worldToScreen', () => {
  it('maps the world origin to canvas center', () => {
    // Camera symmetric around origin
    const cam = makeCameraForWorld(-400, 400, 300, -300);
    const canvas = makeCanvas(800, 600);
    const pos = new THREE.Vector3(0, 0, 0);
    const result = worldToScreen(pos, cam, canvas);
    expect(result.x).toBeCloseTo(400, 0);
    expect(result.y).toBeCloseTo(300, 0);
  });

  it('maps a known world point to screen coordinates', () => {
    // Camera: left=-400, right=400, top=300, bottom=-300, canvas 800x600
    // World (400, 0) → NDC x = 1.0 → screen x = (0.5+0.5)*800 = 800 (right edge)
    const cam = makeCameraForWorld(-400, 400, 300, -300);
    const canvas = makeCanvas(800, 600);
    const pos = new THREE.Vector3(400, 0, 0);
    const result = worldToScreen(pos, cam, canvas);
    expect(result.x).toBeCloseTo(800, 0);
    expect(result.y).toBeCloseTo(300, 0);
  });
});

describe('hexToWorldCenter', () => {
  it('returns the correct world position for a hex', () => {
    const hex = { col: 3, row: 7 };
    const { x: px, y: py } = hexToPixel(hex, HEX_CONSTANTS.HEX_SIZE);
    const worldPos = hexToWorldCenter(hex);
    expect(worldPos.x).toBeCloseTo(px, 5);
    expect(worldPos.y).toBeCloseTo(-py, 5); // Y-flipped
    expect(worldPos.z).toBe(0);
  });
});
