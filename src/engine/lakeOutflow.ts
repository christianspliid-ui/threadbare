import type { HexCoord } from '../types';
import type { WorldGenData } from './worldGenData';
import { hexNeighbors } from '../lib/hexMath';
import { hexKey } from '../lib/hexKey';
import { LAKE_OUTFLOW_MIN_LENGTH } from './worldGenData';

function inBounds(col: number, row: number, cols: number, rows: number): boolean {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

function isEdgeHex(col: number, row: number, cols: number, rows: number): boolean {
  return col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
}

function isOpenOcean(t: string): boolean {
  return t === 'ocean' || t === 'deep_ocean' || t === 'tropical_ocean';
}

/**
 * Generate outflow rivers from lakes that have inflow rivers.
 *
 * For each lake cluster with at least one river entering it:
 * 1. Find the pour-point (lowest-elevation non-lake neighbor)
 * 2. Route a river downstream from the pour-point using drainageElevation
 * 3. Terminate at ocean, grid edge, another river (confluence), or another lake
 *
 * Lakes are processed in elevation order (lowest first) so downstream lakes
 * receive inflows before we check whether they need outflows.
 *
 * Must run AFTER generateRivers and promoteDepressionLakes.
 *
 * Mutates data.hasRiver and data.riverPaths in place.
 */
export function generateLakeOutflows(data: WorldGenData): void {
  const { cols, rows, terrain, hasRiver, lakeIds, drainageElevation, elevation } = data;
  const total = cols * rows;

  // Use drainageElevation if available, fall back to elevation
  const elev = drainageElevation.some((v, i) => v !== 0 || elevation[i] === 0)
    ? drainageElevation
    : elevation;

  // Group lake hexes by lake ID and find which lakes have inflows
  const lakeGroups = new Map<number, number[]>();
  for (let i = 0; i < total; i++) {
    if (lakeIds[i] < 0) continue;
    const id = lakeIds[i];
    if (!lakeGroups.has(id)) lakeGroups.set(id, []);
    lakeGroups.get(id)!.push(i);
  }

  // Sort lakes by average elevation (lowest first)
  const sortedLakes = [...lakeGroups.entries()]
    .map(([id, hexes]) => ({
      id,
      hexes,
      avgElev: hexes.reduce((sum, idx) => sum + elevation[idx], 0) / hexes.length,
    }))
    .sort((a, b) => a.avgElev - b.avgElev);

  let outflowCount = 0;

  for (const lake of sortedLakes) {
    // Check if lake has any inflow river
    const lakeHexSet = new Set(lake.hexes);
    let hasInflow = false;
    for (const idx of lake.hexes) {
      if (hasRiver[idx] === 1) {
        hasInflow = true;
        break;
      }
    }
    if (!hasInflow) continue;

    // Find pour-point: lowest-elevation non-lake, non-ocean neighbor of any lake hex
    let pourIdx = -1;
    let pourElev = Infinity;
    for (const idx of lake.hexes) {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const neighbors = hexNeighbors({ col, row })
        .filter(n => inBounds(n.col, n.row, cols, rows));

      for (const n of neighbors) {
        const nIdx = n.row * cols + n.col;
        if (lakeHexSet.has(nIdx)) continue;
        if (isOpenOcean(terrain[nIdx])) continue; // drains directly to ocean, no need for outflow
        if (elev[nIdx] < pourElev) {
          pourElev = elev[nIdx];
          pourIdx = nIdx;
        }
      }
    }

    if (pourIdx < 0) continue; // all neighbors are ocean or lake — no outflow needed

    // Find the lake-edge hex closest to the pour-point (for visual connection)
    const pourCol = pourIdx % cols;
    const pourRow = Math.floor(pourIdx / cols);

    // Route outflow from pour-point downstream
    const path: HexCoord[] = [];

    // Add the lake-edge hex that's adjacent to the pour-point
    const pourNeighbors = hexNeighbors({ col: pourCol, row: pourRow })
      .filter(n => inBounds(n.col, n.row, cols, rows));
    for (const n of pourNeighbors) {
      const nIdx = n.row * cols + n.col;
      if (lakeHexSet.has(nIdx)) {
        path.push({ col: n.col, row: n.row });
        break;
      }
    }

    // Start routing from pour-point
    path.push({ col: pourCol, row: pourRow });
    const visited = new Set<string>();
    visited.add(hexKey(pourCol, pourRow));
    // Mark lake hexes as visited to prevent backflow
    for (const idx of lake.hexes) {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      visited.add(hexKey(c, r));
    }

    let currentCol = pourCol;
    let currentRow = pourRow;
    let safety = 0;

    while (safety++ < 500) {
      const currentIdx = currentRow * cols + currentCol;

      // Terminate at grid edge
      if (isEdgeHex(currentCol, currentRow, cols, rows) && path.length > 1) break;

      const neighbors = hexNeighbors({ col: currentCol, row: currentRow })
        .filter(n => inBounds(n.col, n.row, cols, rows));

      let bestNeighbor: HexCoord | null = null;
      let bestElev = elev[currentIdx];

      for (const n of neighbors) {
        const key = hexKey(n.col, n.row);
        if (visited.has(key)) continue;
        const nIdx = n.row * cols + n.col;
        if (elev[nIdx] < bestElev) {
          bestElev = elev[nIdx];
          bestNeighbor = n;
        }
      }

      // Try flat traversal if no downhill
      if (!bestNeighbor) {
        for (const n of neighbors) {
          const key = hexKey(n.col, n.row);
          if (visited.has(key)) continue;
          const nIdx = n.row * cols + n.col;
          if (elev[nIdx] <= elev[currentIdx] + 0.01) {
            bestNeighbor = n;
            break;
          }
        }
      }

      if (!bestNeighbor) break;

      path.push(bestNeighbor);
      visited.add(hexKey(bestNeighbor.col, bestNeighbor.row));
      currentCol = bestNeighbor.col;
      currentRow = bestNeighbor.row;

      const nIdx = currentRow * cols + currentCol;
      const nTerrain = terrain[nIdx];

      // Terminate at ocean, lake, or existing river (confluence)
      if (isOpenOcean(nTerrain) || nTerrain === 'coastal_shallows') break;
      if (nTerrain === 'lake') break;
      if (hasRiver[nIdx] === 1) break;
    }

    // Discard outflows that are too short
    if (path.length < LAKE_OUTFLOW_MIN_LENGTH) continue;

    // Mark hexes and store path
    for (const hex of path) {
      hasRiver[hex.row * cols + hex.col] = 1;
    }

    data.riverPaths.push({
      id: `lake-outflow-${outflowCount++}`,
      hexes: path,
    });
  }
}
