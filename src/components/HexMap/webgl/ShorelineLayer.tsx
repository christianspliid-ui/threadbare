/**
 * Shoreline foam layer for the WebGL hex map.
 * Renders a subtle white foam ring around the boundary between water and land hexes.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { HexTile, TerrainType } from '../../../types';
import { hexNeighbors, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Foam strip width (fraction of hex radius, from the edge inward) */
const FOAM_WIDTH = 0.15;

/** Foam Y offset above water surface */
const FOAM_Y = -0.04;

/** Foam color */
const FOAM_COLOR = '#c8d8e0';

/** Foam opacity */
const FOAM_OPACITY = 0.45;

/** Hex outer radius */
const HEX_RADIUS = 1.0;

/** Water terrain types */
const WATER_TERRAINS: Set<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows',
  'coast', 'lake', 'river', 'reef',
]);

// ── Component ───────────────────────────────────────────────────────────────

interface ShorelineLayerProps {
  tiles: HexTile[];
}

function coordKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function ShorelineLayer({ tiles }: ShorelineLayerProps) {
  const geometry = useMemo(() => {
    const tileMap = new Map<string, HexTile>();
    for (const t of tiles) {
      tileMap.set(coordKey(t.coord.col, t.coord.row), t);
    }

    // Pre-compute hex corners
    const outerCorners: [number, number][] = [];
    const innerCorners: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      outerCorners.push([HEX_RADIUS * 0.95 * Math.cos(angle), HEX_RADIUS * 0.95 * Math.sin(angle)]);
      innerCorners.push([HEX_RADIUS * (0.95 - FOAM_WIDTH) * Math.cos(angle), HEX_RADIUS * (0.95 - FOAM_WIDTH) * Math.sin(angle)]);
    }

    // Find shoreline edges: water hex adjacent to land hex
    const foamEdges: { cx: number; cz: number; sector: number }[] = [];

    for (const tile of tiles) {
      if (!WATER_TERRAINS.has(tile.terrain)) continue;

      const { col, row } = tile.coord;
      const neighbors = hexNeighbors({ col, row });

      for (let s = 0; s < 6; s++) {
        const nKey = coordKey(neighbors[s].col, neighbors[s].row);
        const nTile = tileMap.get(nKey);
        // Foam where water meets land (or map edge)
        if (nTile && !WATER_TERRAINS.has(nTile.terrain)) {
          const cx = col * HEX_SCALE_X;
          const cz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);
          foamEdges.push({ cx, cz, sector: s });
        }
      }
    }

    if (foamEdges.length === 0) return null;

    // Each foam edge = quad strip along one hex edge = 2 triangles = 6 verts
    const totalVerts = foamEdges.length * 6;
    const positions = new Float32Array(totalVerts * 3);
    let vi = 0;

    function pushVert(x: number, y: number, z: number) {
      const i3 = vi * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      vi++;
    }

    for (const { cx, cz, sector } of foamEdges) {
      const [ox0, oz0] = outerCorners[sector];
      const [ox1, oz1] = outerCorners[(sector + 1) % 6];
      const [ix0, iz0] = innerCorners[sector];
      const [ix1, iz1] = innerCorners[(sector + 1) % 6];

      // Quad: outer0, outer1, inner0 then outer1, inner1, inner0
      pushVert(cx + ox0, FOAM_Y, cz + oz0);
      pushVert(cx + ox1, FOAM_Y, cz + oz1);
      pushVert(cx + ix0, FOAM_Y, cz + iz0);

      pushVert(cx + ox1, FOAM_Y, cz + oz1);
      pushVert(cx + ix1, FOAM_Y, cz + iz1);
      pushVert(cx + ix0, FOAM_Y, cz + iz0);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, vi * 3), 3));
    geo.computeVertexNormals();
    return geo;
  }, [tiles]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={FOAM_COLOR}
        transparent
        opacity={FOAM_OPACITY}
        side={THREE.DoubleSide}
        fog
      />
    </mesh>
  );
}
