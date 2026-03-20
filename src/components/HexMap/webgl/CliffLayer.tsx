/**
 * Cliff wall layer for the WebGL hex map.
 * Generates vertical faces between hexes with significant elevation differences,
 * creating a diorama / stacked-terrain-layer look.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { BIOME_COLORS, hexToRgb } from '../../../engine/color';
import { hexNeighbors, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import {
  DEFAULT_HEX_RADIUS,
  MAX_ELEVATION_HEIGHT,
  MIN_ELEVATION_HEIGHT,
  EDGE_PERTURB_STRENGTH,
} from './hexMeshGeometry';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Minimum elevation difference (in raw 0–1 units) to generate a cliff face */
const CLIFF_THRESHOLD = 0.18;

/** How many vertical subdivisions per cliff face (more = smoother curved cliffs) */
const CLIFF_V_SEGMENTS = 2;

/** How many horizontal segments per cliff edge (matches hex edge smoothness) */
const CLIFF_H_SEGMENTS = 3;

/** Cliff face base color — warm sandy brown (diorama brick) */
const CLIFF_COLOR_BASE = new THREE.Color('#8a7a60');

/** Cliff face highlight blend (lerps toward terrain color for variety) */
const CLIFF_TERRAIN_BLEND = 0.35;

/** Cliff ambient occlusion — subtle darkening at bottom of cliff face */
const CLIFF_AO_STRENGTH = 0.2;

// ── Helpers ─────────────────────────────────────────────────────────────────

function hexCorners(radius: number): [number, number][] {
  const corners: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
  }
  return corners;
}

function elevationToY(elevation: number): number {
  const t = elevation * elevation;
  return MIN_ELEVATION_HEIGHT + t * (MAX_ELEVATION_HEIGHT - MIN_ELEVATION_HEIGHT);
}

function hashCoord(x: number, z: number, seed: number): number {
  const ix = Math.round(x * 1000);
  const iz = Math.round(z * 1000);
  let h = ((seed * 16807 + ix * 48271 + iz * 69621) & 0x7fffffff);
  h = ((h * 16807) & 0x7fffffff);
  return (h % 10000) / 5000 - 1;
}

function coordKey(col: number, row: number): string {
  return `${col},${row}`;
}

// ── Component ───────────────────────────────────────────────────────────────

interface CliffLayerProps {
  tiles: HexTile[];
  seed?: number;
}

export function CliffLayer({ tiles, seed = 42 }: CliffLayerProps) {
  const geometry = useMemo(() => {
    const tileMap = new Map<string, HexTile>();
    for (const t of tiles) {
      tileMap.set(coordKey(t.coord.col, t.coord.row), t);
    }

    const corners = hexCorners(DEFAULT_HEX_RADIUS);

    // Estimate max cliff faces: each tile can have up to 6 cliff edges
    // Each cliff face: CLIFF_H_SEGMENTS × CLIFF_V_SEGMENTS × 2 tris × 3 verts
    const maxCliffVerts = tiles.length * 6 * CLIFF_H_SEGMENTS * CLIFF_V_SEGMENTS * 6;
    const positions = new Float32Array(maxCliffVerts * 3);
    const normals = new Float32Array(maxCliffVerts * 3);
    const colors = new Float32Array(maxCliffVerts * 3);
    let vi = 0;

    function pushCliffVert(
      x: number, y: number, z: number,
      nx: number, ny: number, nz: number,
      r: number, g: number, b: number,
    ) {
      const i3 = vi * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      normals[i3] = nx;
      normals[i3 + 1] = ny;
      normals[i3 + 2] = nz;
      colors[i3] = r;
      colors[i3 + 1] = g;
      colors[i3 + 2] = b;
      vi++;
    }

    for (const tile of tiles) {
      const { col, row } = tile.coord;
      const px = col * HEX_SCALE_X;
      const pz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);
      const tileY = elevationToY(tile.geoParams.elevation);

      const neighbors = hexNeighbors({ col, row });

      for (let s = 0; s < 6; s++) {
        const neighbor = tileMap.get(coordKey(neighbors[s].col, neighbors[s].row));
        if (!neighbor) continue; // Skip map edges — fog handles those

        const neighborY = elevationToY(neighbor.geoParams.elevation);

        // Only generate cliff if THIS tile is significantly higher
        const diff = tileY - neighborY;
        if (diff < CLIFF_THRESHOLD) continue;

        // Edge corners (in local hex space)
        const [c0x, c0z] = corners[s];
        const [c1x, c1z] = corners[(s + 1) % 6];

        // Apply edge perturbation to match terrain mesh
        function perturbedCorner(localX: number, localZ: number): [number, number] {
          const wx = px + localX;
          const wz = pz + localZ;
          const pertX = hashCoord(wx, wz, seed) * EDGE_PERTURB_STRENGTH;
          const pertZ = hashCoord(wx + 7.31, wz + 13.17, seed + 1) * EDGE_PERTURB_STRENGTH;
          return [wx + pertX, wz + pertZ];
        }

        // Cliff face color: darken the terrain color toward rocky brown
        const cliffColor = CLIFF_COLOR_BASE.clone();
        // Tint toward terrain for natural look
        const terrainHex = BIOME_COLORS[tile.terrain] || '#5a5248';
        const tRgb = hexToRgb(terrainHex);
        const terrainCol = new THREE.Color(tRgb.r / 255, tRgb.g / 255, tRgb.b / 255);
        cliffColor.lerp(terrainCol, CLIFF_TERRAIN_BLEND);

        // Outward-facing normal (perpendicular to edge, horizontal)
        const edgeDx = c1x - c0x;
        const edgeDz = c1z - c0z;
        const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDz * edgeDz);
        const faceNx = -edgeDz / edgeLen; // perpendicular
        const faceNz = edgeDx / edgeLen;

        // Generate subdivided cliff wall
        for (let hi = 0; hi < CLIFF_H_SEGMENTS; hi++) {
          const t0 = hi / CLIFF_H_SEGMENTS;
          const t1 = (hi + 1) / CLIFF_H_SEGMENTS;

          // Interpolate along edge
          const lx0 = c0x + (c1x - c0x) * t0;
          const lz0 = c0z + (c1z - c0z) * t0;
          const lx1 = c0x + (c1x - c0x) * t1;
          const lz1 = c0z + (c1z - c0z) * t1;

          const [wx0, wz0] = perturbedCorner(lx0, lz0);
          const [wx1, wz1] = perturbedCorner(lx1, lz1);

          // Edge Y = midpoint between tile and neighbor elevations
          const topY = (tileY + neighborY) / 2;
          const bottomY = neighborY;

          for (let vj = 0; vj < CLIFF_V_SEGMENTS; vj++) {
            const v0 = vj / CLIFF_V_SEGMENTS;
            const v1 = (vj + 1) / CLIFF_V_SEGMENTS;

            const y0 = topY + (bottomY - topY) * v0;
            const y1 = topY + (bottomY - topY) * v1;

            // AO: darken toward bottom
            const ao0 = 1 - v0 * CLIFF_AO_STRENGTH;
            const ao1 = 1 - v1 * CLIFF_AO_STRENGTH;
            const r0 = cliffColor.r * ao0;
            const g0 = cliffColor.g * ao0;
            const b0 = cliffColor.b * ao0;
            const r1 = cliffColor.r * ao1;
            const g1 = cliffColor.g * ao1;
            const b1 = cliffColor.b * ao1;

            // Quad: two triangles
            // Top-left, top-right, bottom-left
            pushCliffVert(wx0, y0, wz0, faceNx, 0, faceNz, r0, g0, b0);
            pushCliffVert(wx1, y0, wz1, faceNx, 0, faceNz, r0, g0, b0);
            pushCliffVert(wx0, y1, wz0, faceNx, 0, faceNz, r1, g1, b1);
            // Top-right, bottom-right, bottom-left
            pushCliffVert(wx1, y0, wz1, faceNx, 0, faceNz, r0, g0, b0);
            pushCliffVert(wx1, y1, wz1, faceNx, 0, faceNz, r1, g1, b1);
            pushCliffVert(wx0, y1, wz0, faceNx, 0, faceNz, r1, g1, b1);
          }
        }
      }
    }

    if (vi === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, vi * 3), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals.subarray(0, vi * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, vi * 3), 3));
    return geo;
  }, [tiles, seed]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors fog side={THREE.DoubleSide} />
    </mesh>
  );
}
