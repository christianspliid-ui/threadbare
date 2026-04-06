/**
 * worldPosition.ts — Hex-to-world coordinate conversion with Y-flip.
 *
 * Wraps hexToPixel (SVG space, y-down) with the Y-flip needed for Three.js
 * (y-up). Centralizes the pattern duplicated in 12+ mesh/animation files.
 *
 * NFP #1: Single conversion point — changing hex layout affects one function.
 */

import type { HexCoord } from '../types';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from './hexMath';

export interface WorldPosition {
  x: number;
  y: number;
}

/**
 * Convert hex coordinate to Three.js world position (y-up).
 *
 * @param hex - Hex coordinate
 * @param hexSize - Hex radius in world units (use HEX_CONSTANTS.HEX_SIZE from HexFillMesh)
 */
export function hexToWorld(hex: HexCoord, hexSize: number): WorldPosition {
  const pixel = hexToPixel(hex, hexSize);
  return { x: pixel.x, y: -pixel.y };
}

/**
 * Convert hex coordinate to Three.js world position with an offset applied
 * before the Y-flip. Useful for ring slot offsets, location icon offsets, etc.
 *
 * @param hex - Hex coordinate
 * @param offset - Offset in SVG space (added to hexToPixel result before Y-flip)
 * @param hexSize - Hex radius in world units
 */
/**
 * Convert Three.js world position back to the nearest hex coordinate (y-up → offset).
 * Inverse of hexToWorld. Returns the nearest hex by rounding.
 *
 * @param worldX - X in Three.js world space
 * @param worldY - Y in Three.js world space (y-up)
 * @param hexSize - Hex radius in world units
 */
export function worldToHex(worldX: number, worldY: number, hexSize: number): HexCoord {
  // Undo the Y-flip: pixel.y = -worldY
  const pixelY = -worldY;

  // Inverse of hexToPixel (flat-top odd-q):
  //   x = col * size * HEX_SCALE_X
  //   y = row * HEX_SCALE_Y * size + (col % 2 === 1 ? HEX_SCALE_Y * size / 2 : 0)
  const col = Math.round(worldX / (hexSize * HEX_SCALE_X));
  const yOffset = (col % 2 === 1) ? HEX_SCALE_Y * hexSize / 2 : 0;
  const row = Math.round((pixelY - yOffset) / (HEX_SCALE_Y * hexSize));
  return { col, row };
}

export function hexToWorldWithOffset(
  hex: HexCoord,
  offset: { x: number; y: number },
  hexSize: number,
): WorldPosition {
  const pixel = hexToPixel(hex, hexSize);
  return {
    x: pixel.x + offset.x,
    y: -(pixel.y + offset.y),
  };
}
