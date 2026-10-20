/**
 * minimapGeometry — where the grid sits inside the minimap, and the two-way mapping
 * between minimap px and map world units (THR-1901, plan THR-1878 D10).
 *
 * The grid fits inside the panel with its aspect kept, centred; the margin is off-grid
 * (`--bg-abyss`). The map's world is y-up (`hexToWorld`); the minimap, like the screen, is
 * y-down — so a world point's minimap y is its hex-pixel y (`-world.y`) scaled.
 *
 * Pure: no DOM, no Three.js. NFP #4: an empty grid or a zero-size panel gives scale 0 and
 * every mapping returns the panel centre, never NaN.
 */
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';

export interface MinimapLayout {
  /** Minimap px per world unit. */
  scale: number;
  /** Minimap px of world pixel-space (0, 0). */
  offX: number;
  offY: number;
  /** One hex cell's drawn width and height in minimap px. */
  cellW: number;
  cellH: number;
}

/** The grid's extent in hex-pixel space (y-down), padded to the outer hex edges. */
export function gridPixelBounds(cols: number, rows: number, hexSize: number): { minX: number; minY: number; maxX: number; maxY: number } {
  const colStep = hexSize * HEX_SCALE_X;
  const rowStep = hexSize * HEX_SCALE_Y;
  return {
    minX: -hexSize,
    minY: -rowStep / 2,
    maxX: Math.max(0, cols - 1) * colStep + hexSize,
    // Odd columns sit half a row lower, so the last row reaches one full row further down.
    maxY: Math.max(0, rows - 1) * rowStep + rowStep,
  };
}

export function computeMinimapLayout(cols: number, rows: number, hexSize: number, panelW: number, panelH: number): MinimapLayout {
  if (cols <= 0 || rows <= 0 || panelW <= 0 || panelH <= 0) {
    return { scale: 0, offX: panelW / 2, offY: panelH / 2, cellW: 0, cellH: 0 };
  }
  const b = gridPixelBounds(cols, rows, hexSize);
  const bw = b.maxX - b.minX;
  const bh = b.maxY - b.minY;
  const scale = Math.min(panelW / bw, panelH / bh);
  return {
    scale,
    offX: (panelW - bw * scale) / 2 - b.minX * scale,
    offY: (panelH - bh * scale) / 2 - b.minY * scale,
    cellW: hexSize * HEX_SCALE_X * scale,
    cellH: hexSize * HEX_SCALE_Y * scale,
  };
}

/** A world point (y-up) → minimap px. */
export function worldToMinimap(layout: MinimapLayout, wx: number, wy: number): { x: number; y: number } {
  return { x: layout.offX + wx * layout.scale, y: layout.offY - wy * layout.scale };
}

/** Minimap px → a world point (y-up). Scale 0 maps everything to the world origin. */
export function minimapToWorld(layout: MinimapLayout, mx: number, my: number): { x: number; y: number } {
  if (layout.scale === 0) return { x: 0, y: 0 };
  return { x: (mx - layout.offX) / layout.scale, y: -(my - layout.offY) / layout.scale };
}

/** The camera's view as a minimap rectangle: centre (x, y) world, zoom k, canvas w × h px. */
export function viewRectOnMinimap(
  layout: MinimapLayout,
  view: { x: number; y: number; k: number; w: number; h: number },
): { x: number; y: number; w: number; h: number } {
  const halfW = view.w / (2 * view.k);
  const halfH = view.h / (2 * view.k);
  const tl = worldToMinimap(layout, view.x - halfW, view.y + halfH);
  return { x: tl.x, y: tl.y, w: 2 * halfW * layout.scale, h: 2 * halfH * layout.scale };
}
