import * as THREE from 'three';
import type { HexCoord } from '../../../types';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { AGENT_PORTRAIT_RADIUS } from '../../../data/agent-visual-content';
import type { AgentSpriteEntry } from '../scene/AgentSpriteMesh';

/**
 * Interaction constants.
 * NFP #1: Every magic number is named — tune by changing values here.
 */
export const INTERACTION_CONSTANTS = {
  SELECTED_RING_WIDTH: 2.5,     // Ring outline width in world units (2–3px range per UI-SPEC)
  SELECTION_OVERLAY_OPACITY: 0.18, // Tinted fill on selected hex (ascendant sphere color)
  HOVER_OVERLAY_OPACITY: 0.10,  // Subtle white overlay on hovered hex
  TOOLTIP_OFFSET_Y: 12,         // px: tooltip appears this many px above the screen position
  AGENT_CLICK_RADIUS_PX: 18,    // px: minimum hit radius for agent click detection (scales with zoom)
  TOOLTIP_HOVER_DELAY_MS: 1000, // ms: delay before tooltip appears on hover (THR-388)
} as const;

/**
 * Converts screen pixel coordinates to a hex grid coordinate.
 *
 * Process:
 * 1. Screen → NDC → Three.js world point (unproject via orthographic camera)
 * 2. World point → hex using nearest-hex rounding from redblobgames.com pixel-to-hex
 *
 * The world coordinate system uses Y-up (Three.js), but hexes were placed at -y
 * (Y-flipped in HexFillMesh). So: worldY = -(SVG-space y) → SVG y = -worldY.
 *
 * Returns null if the computed coordinate is outside the valid grid bounds.
 *
 * NFP #4 (Fail-soft): Returns null rather than throwing for out-of-bounds inputs.
 */
export function screenToHex(
  screenX: number,
  screenY: number,
  camera: THREE.OrthographicCamera,
  canvas: HTMLCanvasElement,
): HexCoord | null {
  const ndcX =  (screenX / canvas.clientWidth)  * 2 - 1;
  const ndcY = -(screenY / canvas.clientHeight) * 2 + 1;

  const worldPoint = new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);

  // HexFillMesh stores hex at world position (x, -y, 0) where x,y come from hexToPixel.
  // So: worldX = hexPixelX, worldY = -hexPixelY
  // => hexPixelX = worldX, hexPixelY = -worldY
  const px = worldPoint.x;
  const py = -worldPoint.y; // back to SVG/grid space (y-down)

  // Inverse of hexToPixel for flat-top odd-q offset grid:
  //   pixelX = col * HEX_SIZE * HEX_SCALE_X
  //   pixelY = row * HEX_SCALE_Y * HEX_SIZE + (col%2===1 ? HEX_SCALE_Y*HEX_SIZE/2 : 0)
  //
  // Use fractional column first, then deduce row accounting for odd-column offset.
  const size = HEX_CONSTANTS.HEX_SIZE;

  const fracCol = px / (size * HEX_SCALE_X);
  const col = Math.round(fracCol);

  // Clamp col for offset adjustment — don't use out-of-range col for parity check
  const colForParity = Math.max(0, col);
  const yOffset = (colForParity % 2 === 1) ? (HEX_SCALE_Y * size / 2) : 0;
  const fracRow = (py - yOffset) / (HEX_SCALE_Y * size);
  const row = Math.round(fracRow);

  // Validate bounds
  if (col < 0 || col >= HEX_CONSTANTS.GRID_COLS || row < 0 || row >= HEX_CONSTANTS.GRID_ROWS) {
    return null;
  }

  return { col, row };
}

/**
 * Projects a Three.js world position to screen (canvas) pixel coordinates.
 * Used to position the HTML tooltip overlay at the hovered hex's screen position.
 */
export function worldToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.OrthographicCamera,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const projected = worldPos.clone().project(camera);
  const x = ( projected.x * 0.5 + 0.5) * canvas.clientWidth;
  const y = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;
  return { x, y };
}

/**
 * Returns the Three.js world position of the center of a hex tile.
 * Accounts for the Y-flip applied in HexFillMesh (world y = -pixelY).
 */
export function hexToWorldCenter(hex: HexCoord): THREE.Vector3 {
  const { x, y } = hexToPixel(hex, HEX_CONSTANTS.HEX_SIZE);
  return new THREE.Vector3(x, -y, 0);
}

/**
 * Distance-based agent picking: returns the agentId of the closest visible
 * agent sprite whose projected screen position is within AGENT_CLICK_RADIUS_PX
 * of the click, or null if no agent is close enough.
 *
 * Uses screen-space projection rather than Three.js raycasting because Sprite
 * objects have inconsistent raycaster behaviour with OrthographicCamera at
 * varying zoom levels. This approach is zoom-invariant — the hit radius is
 * always 18px regardless of zoom.
 *
 * NFP #4 (Fail-soft): returns null on any missing ref rather than throwing.
 */
export function pickAgentAtScreen(
  screenX: number,
  screenY: number,
  camera: THREE.OrthographicCamera,
  canvas: HTMLCanvasElement,
  spriteMap: Map<string, AgentSpriteEntry>,
  zoomK: number = 1,
): string | null {
  let closest: { agentId: string; distPx: number } | null = null;
  // Scale hit radius with zoom so clicking anywhere on the visual circle works.
  // AGENT_PORTRAIT_RADIUS world units × zoomK ≈ visual pixel radius of the sprite.
  const radius = Math.max(INTERACTION_CONSTANTS.AGENT_CLICK_RADIUS_PX, AGENT_PORTRAIT_RADIUS * zoomK);

  for (const [agentId, entry] of spriteMap) {
    if (!entry.sprite.visible) continue;
    const screen = worldToScreen(entry.sprite.position, camera, canvas);
    const dx = screenX - screen.x;
    const dy = screenY - screen.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    if (distPx <= radius && (!closest || distPx < closest.distPx)) {
      closest = { agentId, distPx };
    }
  }

  return closest?.agentId ?? null;
}

/**
 * Distance-based army sprite picking: returns the armyId of the closest army
 * sprite whose projected screen position is within ARMY_CLICK_RADIUS_PX of
 * the click, or null if no army is close enough.
 *
 * Iterates over `armyGroup.children` (THREE.Sprite objects with `userData.armyId`
 * set by createArmyLayer). Uses the same screen-projection approach as pickAgentAtScreen.
 *
 * NFP #4 (Fail-soft): returns null on any missing ref or malformed userData.
 */
const ARMY_CLICK_RADIUS_PX = 24;

export function pickArmyAtScreen(
  screenX: number,
  screenY: number,
  camera: THREE.OrthographicCamera,
  canvas: HTMLCanvasElement,
  armyGroup: THREE.Group | null,
): string | null {
  if (!armyGroup) return null;
  let closest: { armyId: string; distPx: number } | null = null;

  for (const child of armyGroup.children) {
    if (!(child instanceof THREE.Sprite)) continue;
    const armyId = child.userData?.armyId as string | undefined;
    if (!armyId) continue;
    const screen = worldToScreen(child.position, camera, canvas);
    const dx = screenX - screen.x;
    const dy = screenY - screen.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    if (distPx <= ARMY_CLICK_RADIUS_PX && (!closest || distPx < closest.distPx)) {
      closest = { armyId, distPx };
    }
  }

  return closest?.armyId ?? null;
}
