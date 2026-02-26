import type { HexCoord, CubeCoord } from '../types';

export function offsetToCube(hex: HexCoord): CubeCoord {
  const q = hex.col;
  const r = hex.row - (hex.col + (hex.col & 1)) / 2;
  let s = -q - r;
  s = Math.round(s * 1e10) / 1e10;
  // Ensure we never return -0
  if (s === 0) s = 0;
  return { q, r, s };
}

export function cubeToOffset(cube: CubeCoord): HexCoord {
  const col = cube.q;
  const row = cube.r + (cube.q + (cube.q & 1)) / 2;
  return { col, row };
}

export function hexNeighbors(hex: HexCoord): HexCoord[] {
  const isEvenCol = hex.col % 2 === 0;
  const directions = isEvenCol
    ? [
        { col: +1, row: +1 }, { col: -1, row:  0 },
        { col: +1, row:  0 }, { col: -1, row: +1 },
        { col:  0, row: +1 }, { col:  0, row: -1 },
      ]
    : [
        { col: +1, row:  0 }, { col: -1, row: -1 },
        { col: +1, row: -1 }, { col: -1, row:  0 },
        { col:  0, row: +1 }, { col:  0, row: -1 },
      ];
  return directions.map(d => ({ col: hex.col + d.col, row: hex.row + d.row }));
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
}

export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = hex.col * (w * 3 / 4);
  const y = hex.row * h + (hex.col % 2 === 1 ? h / 2 : 0);
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
    const angle = (Math.PI / 180) * (60 * i);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px},${py}`);
  }
  return points.join(' ');
}
