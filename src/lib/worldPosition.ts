/**
 * worldPosition.ts — Hex-to-world coordinate conversion with Y-flip.
 *
 * Wraps hexToPixel (SVG space, y-down) with the Y-flip needed for Three.js
 * (y-up). Centralizes the pattern duplicated in 12+ mesh/animation files.
 *
 * NFP #1: Single conversion point — changing hex layout affects one function.
 */

import type { HexCoord } from '../types';
import { hexToPixel } from './hexMath';

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
