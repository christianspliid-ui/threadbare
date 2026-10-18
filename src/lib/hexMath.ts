import type { HexCoord, CubeCoord } from '../types';

// =============================================================================
// Flat-top hex grid using odd-q offset coordinates
// =============================================================================
// Orientation: flat side on top/bottom, vertices on left/right
// Offset: odd columns shift down by half a hex height
// Reference: https://www.redblobgames.com/grids/hexagons/

// Hex sizing constants (Non-Functional Priority #1: Tunability)
export const HEX_SCALE_X = 1.5; // Horizontal spacing multiplier
export const HEX_SCALE_Y = Math.sqrt(3); // Vertical spacing multiplier
export const HEX_IMG_SCALE = 2; // Image size multiplier

export function offsetToCube(hex: HexCoord): CubeCoord {
  // Flat-top odd-q: col maps to q, row adjusts by column parity
  const q = hex.col;
  const r = hex.row - (hex.col - (hex.col & 1)) / 2;
  let s = -q - r;
  s = Math.round(s * 1e10) / 1e10;
  // Ensure we never return -0
  if (s === 0) s = 0;
  return { q, r, s };
}

export function cubeToOffset(cube: CubeCoord): HexCoord {
  // Flat-top odd-q: inverse of offsetToCube
  const col = cube.q;
  const row = cube.r + (cube.q - (cube.q & 1)) / 2;
  return { col, row };
}

export function hexNeighbors(hex: HexCoord): HexCoord[] {
  // Flat-top odd-q: odd columns shift down
  const isOddCol = hex.col % 2 === 1;
  const directions = isOddCol
    ? [
        { col:  1, row:  1 }, { col:  1, row:  0 },
        { col:  0, row: -1 }, { col: -1, row:  0 },
        { col: -1, row:  1 }, { col:  0, row:  1 },
      ]
    : [
        { col:  1, row:  0 }, { col:  1, row: -1 },
        { col:  0, row: -1 }, { col: -1, row: -1 },
        { col: -1, row:  0 }, { col:  0, row:  1 },
      ];
  return directions.map(d => ({ col: hex.col + d.col, row: hex.row + d.row }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
}

/**
 * The hexes on the straight line from `a` to `b` (cube-coordinate lerp, then cube
 * round). Interior hexes only by default — world-gen's land bridges (pass09) want
 * the hexes between two shores; `includeEnds` adds `a` and `b` (the Trade lens's
 * roads, THR-1898). The same two points give the same line every time (NFP #3).
 */
export function hexLine(a: HexCoord, b: HexCoord, opts: { includeEnds?: boolean } = {}): HexCoord[] {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  const dist = hexDistance(a, b);
  const out: HexCoord[] = [];
  if (opts.includeEnds) out.push({ col: a.col, row: a.row });
  if (dist === 0) return out;
  for (let i = 1; i < dist; i++) {
    const t = i / dist;
    const lq = ac.q + (bc.q - ac.q) * t;
    const lr = ac.r + (bc.r - ac.r) * t;
    const ls = ac.s + (bc.s - ac.s) * t;
    let rq = Math.round(lq);
    let rr = Math.round(lr);
    let rs = Math.round(ls);
    const dq = Math.abs(rq - lq);
    const dr = Math.abs(rr - lr);
    const ds = Math.abs(rs - ls);
    if (dq > dr && dq > ds) {
      rq = -rr - rs;
    } else if (dr > ds) {
      rr = -rq - rs;
    } else {
      rs = -rq - rr;
    }
    out.push(cubeToOffset({ q: rq, r: rr, s: rs }));
  }
  if (opts.includeEnds) out.push({ col: b.col, row: b.row });
  return out;
}

export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  // Flat-top: horizontal spacing = HEX_SCALE_X * size, vertical spacing = HEX_SCALE_Y * size
  // Odd columns shift down by half the vertical spacing
  const x = hex.col * size * HEX_SCALE_X;
  const y = hex.row * HEX_SCALE_Y * size + (hex.col % 2 === 1 ? HEX_SCALE_Y * size / 2 : 0);
  return { x, y };
}

export function generateHexGrid(cols: number, rows: number): HexCoord[] {
  const hexes: HexCoord[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      hexes.push({ col, row });
    }
  }
  return hexes;
}

export function hexPolygonPoints(cx: number, cy: number, size: number): string {
  // Flat-top hex: first vertex at 0° (rightmost), flat edges on top and bottom
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}
