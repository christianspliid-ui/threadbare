/**
 * Procedural hex mesh geometry for WebGL rendering.
 * Generates a single BufferGeometry containing all hexes in the grid,
 * with per-vertex colors, UVs, terrain layer indices for texture atlas sampling,
 * elevation offset, vertex color noise, hex subdivision with micro-displacement,
 * and hex outline generation.
 */
import * as THREE from 'three';
import type { HexTile, HexCoord } from '../../../types';
import type { TerrainType } from '../../../types';
import { hexNeighbors, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { BIOME_COLORS, hexToRgb } from '../../../engine/color';
import { TERRAIN_TO_ATLAS } from './terrainAtlas';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** How far into the hex the blend zone extends (0 = no blend, 1 = blend to center) */
export const BLEND_FACTOR = 0.35;

/** Noise perturbation strength for hex edges (world units) */
export const EDGE_PERTURB_STRENGTH = 0.15;

/** Hex outer radius in world units */
export const DEFAULT_HEX_RADIUS = 1.0;

/** Maximum elevation offset in world Y units (applied to mountains at elevation=1) */
export const MAX_ELEVATION_HEIGHT = 1.5;

/** Minimum elevation offset (applied to lowest tiles, can be negative for water) */
export const MIN_ELEVATION_HEIGHT = -0.2;

/** Valley ambient occlusion darkening (0 = none, 0.15 = noticeable) */
export const VALLEY_DARKEN = 0.12;

/** Per-vertex color noise strength (0 = none, 0.1 = subtle variation) */
export const VERTEX_COLOR_NOISE = 0.08;

/** Hex outline opacity (0–1) */
export const HEX_OUTLINE_OPACITY = 0.12;

/** Hex outline color */
export const HEX_OUTLINE_COLOR = '#8b693c';

/** Subdivision level per hex sector (1 = original 6-tri, 2 = 24-tri, 3 = 54-tri) */
const HEX_SUBDIV = 3;

/** Per-terrain micro-displacement amplitude (world Y units) */
const TERRAIN_NOISE_AMP: Partial<Record<TerrainType, number>> = {
  // Elevated — strong displacement for craggy peaks
  mountains: 0.25,
  high_mountains: 0.35,
  volcano: 0.3,
  hills: 0.1,
  forested_hills: 0.08,
  plateau: 0.06,
  badlands: 0.12,
  broken_lands: 0.15,
  mountain_pass: 0.1,

  // Forest — gentle undulation
  temperate_forest: 0.03,
  dense_forest: 0.03,
  boreal_forest: 0.04,
  jungle: 0.03,
  tropical_forest: 0.03,
  evergreen_forest: 0.03,
  light_forest: 0.02,
  dead_forest: 0.04,
  great_home_trees: 0.03,

  // Lowlands — very subtle
  grassland: 0.02,
  farmland: 0.01,
  steppe: 0.02,
  savanna: 0.02,
  floodplain: 0.01,

  // Desert — dunes and rocky terrain
  desert: 0.04,
  rocky_desert: 0.08,
  sand_dunes: 0.06,

  // Cold — minimal
  tundra: 0.03,
  glacier: 0.02,
  arctic: 0.02,
  snow_fields: 0.02,

  // Wet — minimal
  swamp: 0.02,
  marsh: 0.01,
  moor_bog: 0.02,

  // Water — no displacement (WaterLayer handles waves)
  ocean: 0.0,
  deep_ocean: 0.0,
  coastal_shallows: 0.0,
  coast: 0.01,
  lake: 0.0,
  river: 0.0,
  reef: 0.0,
  tropical_ocean: 0.0,
};
const DEFAULT_NOISE_AMP = 0.03;

// ── Hex vertex generation ───────────────────────────────────────────────────

/** Get the 6 corner positions of a flat-top hexagon centered at origin */
function hexCorners(radius: number): THREE.Vector3[] {
  const corners: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    corners.push(new THREE.Vector3(
      radius * Math.cos(angle),
      0,
      radius * Math.sin(angle),
    ));
  }
  return corners;
}

/** Saturation boost to compensate for lighting desaturation */
const COLOR_SATURATION_BOOST = 1.3;

/** Convert hex color string to THREE.Color with saturation boost for lit rendering */
function terrainColor(terrain: TerrainType): THREE.Color {
  const hex = BIOME_COLORS[terrain] || '#2a2a2a';
  const rgb = hexToRgb(hex);
  const color = new THREE.Color(rgb.r / 255, rgb.g / 255, rgb.b / 255);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s * COLOR_SATURATION_BOOST), hsl.l);
  return color;
}

// ── Simple seeded noise for edge perturbation (NFP #3: Determinism) ─────────

function hashCoord(x: number, z: number, seed: number): number {
  const ix = Math.round(x * 1000);
  const iz = Math.round(z * 1000);
  let h = ((seed * 16807 + ix * 48271 + iz * 69621) & 0x7fffffff);
  h = ((h * 16807) & 0x7fffffff);
  return (h % 10000) / 5000 - 1; // -1..1
}

function perturbPoint(p: THREE.Vector3, strength: number, seed: number): THREE.Vector3 {
  if (strength <= 0) return p;
  const nx = hashCoord(p.x, p.z, seed) * strength;
  const nz = hashCoord(p.x + 7.31, p.z + 13.17, seed + 1) * strength;
  return new THREE.Vector3(p.x + nx, p.y, p.z + nz);
}

/** Deterministic per-vertex brightness noise (-1..1) based on position */
function vertexNoise(x: number, z: number, seed: number): number {
  return hashCoord(x * 3.7, z * 3.7, seed + 99);
}

/** Multi-octave micro noise for terrain displacement (-1..1) */
function microNoise(x: number, z: number, seed: number): number {
  let val = hashCoord(x * 1.5, z * 1.5, seed + 200);
  val += hashCoord(x * 3.0, z * 3.0, seed + 300) * 0.5;
  val += hashCoord(x * 6.0, z * 6.0, seed + 400) * 0.25;
  return val / 1.75;
}

// ── Elevation helpers ───────────────────────────────────────────────────────

function elevationToY(elevation: number): number {
  const t = elevation * elevation;
  return MIN_ELEVATION_HEIGHT + t * (MAX_ELEVATION_HEIGHT - MIN_ELEVATION_HEIGHT);
}

function edgeElevation(tileElev: number, neighborElev: number | null): number {
  if (neighborElev === null) return elevationToY(tileElev);
  return (elevationToY(tileElev) + elevationToY(neighborElev)) / 2;
}

// ── Tile lookup helpers ─────────────────────────────────────────────────────

function makeTileMap(tiles: HexTile[]): Map<string, HexTile> {
  const map = new Map<string, HexTile>();
  for (const t of tiles) {
    map.set(`${t.coord.col},${t.coord.row}`, t);
  }
  return map;
}

function coordKey(col: number, row: number): string {
  return `${col},${row}`;
}

// ── Subdivision helpers ─────────────────────────────────────────────────────

/** Triangles per hex with current subdivision level */
function trisPerHex(N: number): number {
  // Each of 6 sectors has N² triangles
  return 6 * N * N;
}

// ── Main geometry builder ───────────────────────────────────────────────────

export interface HexMeshResult {
  geometry: THREE.BufferGeometry;
  hexFaceRanges: Map<string, { start: number; count: number }>;
  outlineGeometry: THREE.BufferGeometry;
}

/**
 * Build a single merged BufferGeometry for the entire hex grid.
 * Includes: positions, colors, normals, UVs, terrain layer indices, blend weights.
 * Each hex sector is subdivided into N² triangles for terrain micro-detail.
 */
export function buildHexMeshGeometry(
  tiles: HexTile[],
  cols: number,
  rows: number,
  hexSize: number = 30,
  seed: number = 42,
): HexMeshResult {
  const tileMap = makeTileMap(tiles);
  const corners = hexCorners(DEFAULT_HEX_RADIUS);
  const N = HEX_SUBDIV;

  // Vertex count: each hex has 6 sectors × N² triangles × 3 vertices
  const vertexCount = tiles.length * trisPerHex(N) * 3;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const terrainLayers = new Float32Array(vertexCount * 3);
  const hexFaceRanges = new Map<string, { start: number; count: number }>();

  // Outline: each hex = 6 edge segments = 12 vertices (unchanged)
  const outlinePositions = new Float32Array(tiles.length * 12 * 3);
  let oi = 0;
  let vi = 0;

  function pushVertex(
    pos: THREE.Vector3,
    color: THREE.Color,
    u: number, v: number,
    primaryLayer: number,
    secondaryLayer: number,
    blendWeight: number,
  ) {
    const idx3 = vi * 3;
    const idx2 = vi * 2;
    positions[idx3] = pos.x;
    positions[idx3 + 1] = pos.y;
    positions[idx3 + 2] = pos.z;
    colors[idx3] = color.r;
    colors[idx3 + 1] = color.g;
    colors[idx3 + 2] = color.b;
    uvs[idx2] = u;
    uvs[idx2 + 1] = v;
    terrainLayers[idx3] = primaryLayer;
    terrainLayers[idx3 + 1] = secondaryLayer;
    terrainLayers[idx3 + 2] = blendWeight;
    vi++;
  }

  function pushOutlineVertex(pos: THREE.Vector3) {
    const idx = oi * 3;
    outlinePositions[idx] = pos.x;
    outlinePositions[idx + 1] = pos.y;
    outlinePositions[idx + 2] = pos.z;
    oi++;
  }

  for (const tile of tiles) {
    const { col, row } = tile.coord;
    const key = coordKey(col, row);
    const faceStart = vi;

    const px = col * HEX_SCALE_X;
    const pz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);
    const elevation = tile.geoParams.elevation;
    const centerY = elevationToY(elevation);

    const cellColor = terrainColor(tile.terrain);
    const primaryLayer = TERRAIN_TO_ATLAS[tile.terrain] ?? 0;
    const noiseAmp = TERRAIN_NOISE_AMP[tile.terrain] ?? DEFAULT_NOISE_AMP;

    // Valley darkening
    const valleyFactor = 1 - (1 - elevation) * VALLEY_DARKEN;
    const centerNoise = vertexNoise(px, pz, seed) * VERTEX_COLOR_NOISE;
    const noisedCenterColor = cellColor.clone();
    noisedCenterColor.r = Math.max(0, Math.min(1, (noisedCenterColor.r + centerNoise) * valleyFactor));
    noisedCenterColor.g = Math.max(0, Math.min(1, (noisedCenterColor.g + centerNoise) * valleyFactor));
    noisedCenterColor.b = Math.max(0, Math.min(1, (noisedCenterColor.b + centerNoise) * valleyFactor));

    // Get neighbor data
    const neighbors = hexNeighbors({ col, row });
    const neighborTiles: (HexTile | null)[] = neighbors.map(n =>
      tileMap.get(coordKey(n.col, n.row)) ?? null,
    );
    const neighborColors: (THREE.Color | null)[] = neighborTiles.map(nt =>
      nt ? terrainColor(nt.terrain) : null,
    );

    // Process each of the 6 sectors
    for (let sector = 0; sector < 6; sector++) {
      const nTile = neighborTiles[sector];
      const nColor = neighborColors[sector];
      const neighborLayer = nTile ? (TERRAIN_TO_ATLAS[nTile.terrain] ?? 0) : primaryLayer;
      const edgeY = edgeElevation(elevation, nTile?.geoParams.elevation ?? null);

      // Corner vectors (local, relative to center)
      const cA = corners[sector];
      const cB = corners[(sector + 1) % 6];

      // Helper: compute vertex attributes at barycentric (si, sj) within this sector
      // si = steps toward corner A, sj = steps toward corner B
      // center is at (0,0), corner A at (N,0), corner B at (0,N)
      function sectorVert(si: number, sj: number) {
        const u = si / N; // fraction toward corner A
        const v = sj / N; // fraction toward corner B
        const radial = u + v; // 0 at center, 1 at edge

        // Local offset from hex center
        const localX = cA.x * u + cB.x * v;
        const localZ = cA.z * u + cB.z * v;

        // World position
        const wx = px + localX;
        const wz = pz + localZ;

        // Elevation: interpolate between center and edge
        const posY = centerY * (1 - radial) + edgeY * radial;

        // Micro-displacement: fades to zero near edge to prevent seams
        const fadeFactor = radial < 0.75 ? 1.0 : Math.max(0, (1.0 - radial) / 0.25);
        const noiseY = microNoise(wx, wz, seed) * noiseAmp * fadeFactor;

        // Edge perturbation: only near outer edge
        let finalX = wx;
        let finalZ = wz;
        if (radial > 0.7) {
          const perturbStr = EDGE_PERTURB_STRENGTH * (radial - 0.7) / 0.3;
          finalX += hashCoord(wx, wz, seed) * perturbStr;
          finalZ += hashCoord(wx + 7.31, wz + 13.17, seed + 1) * perturbStr;
        }

        const pos = new THREE.Vector3(finalX, posY + noiseY, finalZ);

        // Color: blend from center color toward neighbor
        const color = noisedCenterColor.clone();
        if (nColor && radial > 0) {
          color.lerp(nColor, radial * BLEND_FACTOR);
        }
        // Also blend with adjacent sector neighbors at corners
        const prevNColor = neighborColors[(sector + 5) % 6];
        if (prevNColor && u > 0 && radial > 0.5) {
          color.lerp(prevNColor, (u / N) * BLEND_FACTOR * 0.3);
        }
        const nextNColor = neighborColors[(sector + 1) % 6];
        if (nextNColor && v > 0 && radial > 0.5) {
          color.lerp(nextNColor, (v / N) * BLEND_FACTOR * 0.3);
        }

        // Vertex noise
        const vNoise = vertexNoise(wx, wz, seed) * VERTEX_COLOR_NOISE;
        color.r = Math.max(0, Math.min(1, color.r + vNoise));
        color.g = Math.max(0, Math.min(1, color.g + vNoise));
        color.b = Math.max(0, Math.min(1, color.b + vNoise));

        // UVs: map hex-local position to 0–1
        const uvX = 0.5 + (localX / DEFAULT_HEX_RADIUS) * 0.5;
        const uvY = 0.5 + (localZ / DEFAULT_HEX_RADIUS) * 0.5;

        // Terrain layer blending
        const edgeBlend = nTile && neighborLayer !== primaryLayer ? radial * BLEND_FACTOR : 0;

        return { pos, color, uvX, uvY, edgeBlend };
      }

      // Generate N² triangles for this sector using triangular grid
      // Vertex grid: (i, j) where i >= 0, j >= 0, i + j <= N
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N - i; j++) {
          // Upward triangle: (i,j) → (i+1,j) → (i,j+1)
          const a = sectorVert(i, j);
          const b = sectorVert(i + 1, j);
          const c = sectorVert(i, j + 1);
          pushVertex(a.pos, a.color, a.uvX, a.uvY, primaryLayer, neighborLayer, a.edgeBlend);
          pushVertex(b.pos, b.color, b.uvX, b.uvY, primaryLayer, neighborLayer, b.edgeBlend);
          pushVertex(c.pos, c.color, c.uvX, c.uvY, primaryLayer, neighborLayer, c.edgeBlend);

          // Downward triangle: (i+1,j) → (i+1,j+1) → (i,j+1)
          if (i + j + 1 < N) {
            const d = sectorVert(i + 1, j);
            const e = sectorVert(i + 1, j + 1);
            const f = sectorVert(i, j + 1);
            pushVertex(d.pos, d.color, d.uvX, d.uvY, primaryLayer, neighborLayer, d.edgeBlend);
            pushVertex(e.pos, e.color, e.uvX, e.uvY, primaryLayer, neighborLayer, e.edgeBlend);
            pushVertex(f.pos, f.color, f.uvX, f.uvY, primaryLayer, neighborLayer, f.edgeBlend);
          }
        }
      }

      // Outline: outer edge of this sector (between the two outermost corners)
      // The outermost edge is from (N, 0) to (0, N) — but we only need the
      // segment from corner[sector] to corner[sector+1]
      const outC0 = sectorVert(N, 0);
      const outC1 = sectorVert(0, N);
      const outlineOffset = 0.02;
      pushOutlineVertex(new THREE.Vector3(outC0.pos.x, outC0.pos.y + outlineOffset, outC0.pos.z));
      pushOutlineVertex(new THREE.Vector3(outC1.pos.x, outC1.pos.y + outlineOffset, outC1.pos.z));
    }

    hexFaceRanges.set(key, { start: faceStart, count: vi - faceStart });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, vi * 3), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, vi * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs.subarray(0, vi * 2), 2));
  geometry.setAttribute('aTerrainLayer', new THREE.BufferAttribute(terrainLayers.subarray(0, vi * 3), 3));
  geometry.computeVertexNormals();

  const outlineGeo = new THREE.BufferGeometry();
  outlineGeo.setAttribute('position', new THREE.BufferAttribute(outlinePositions.subarray(0, oi * 3), 3));

  return { geometry, hexFaceRanges, outlineGeometry: outlineGeo };
}

/**
 * Given a face index from raycasting, find which hex was hit.
 */
export function faceIndexToHex(
  faceIndex: number,
  hexFaceRanges: Map<string, { start: number; count: number }>,
): HexCoord | null {
  const vertexIndex = faceIndex * 3;
  for (const [key, range] of hexFaceRanges) {
    if (vertexIndex >= range.start && vertexIndex < range.start + range.count) {
      const [col, row] = key.split(',').map(Number);
      return { col, row };
    }
  }
  return null;
}
