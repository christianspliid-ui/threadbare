import type { HexCoord, CubeCoord } from '../types';

export function offsetToCube(hex: HexCoord): CubeCoord {
  const q = hex.col - (hex.row - (hex.row & 1)) / 2;
  const r = hex.row;
  let s = -q - r;
  s = Math.round(s * 1e10) / 1e10;
  // Ensure we never return -0
  if (s === 0) s = 0;
  return { q, r, s };
}

export function cubeToOffset(cube: CubeCoord): HexCoord {
  const col = cube.q + (cube.r - (cube.r & 1)) / 2;
  const row = cube.r;
  return { col, row };
}

export function hexNeighbors(hex: HexCoord): HexCoord[] {
  const isOddRow = hex.row % 2 === 1;
  const directions = isOddRow
    ? [
        { col:  1, row: -1 }, { col:  1, row:  0 },
        { col:  1, row:  1 }, { col:  0, row:  1 },
        { col: -1, row:  0 }, { col:  0, row: -1 },
      ]
    : [
        { col:  0, row: -1 }, { col:  1, row:  0 },
        { col:  0, row:  1 }, { col: -1, row:  1 },
        { col: -1, row:  0 }, { col: -1, row: -1 },
      ];
  return directions.map(d => ({ col: hex.col + d.col, row: hex.row + d.row }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
}

export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const w = Math.sqrt(3) * size;
  const h = size * 2;
  const x = hex.col * w + (hex.row % 2 === 1 ? w / 2 : 0);
  const y = hex.row * (h * 3 / 4);
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
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}
