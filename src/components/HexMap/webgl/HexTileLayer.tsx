/**
 * GLTF hex tile terrain layer for the WebGL hex map.
 * Replaces the procedural terrain mesh with KayKit Medieval Hexagon tile models.
 *
 * Each hex on the grid gets a placed GLTF hex model, selected by terrain type.
 * KayKit tiles are flat-top hexes; we rotate 90° + scale √3/2 to match our
 * pointy-top grid (HEX_SCALE_X=1.5, HEX_SCALE_Y=√3, radius=1.0).
 *
 * Coast tiles are edge-matched to pick the right variant (A–E) based on
 * how many neighboring hexes are water.
 */
import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HexTile, TerrainType } from '../../../types';
import { hexNeighbors, HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import type { ModelId } from './modelLoader';
import { loadAllModels, getModel, getSharedMaterial, modelsReady } from './modelLoader';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/**
 * Scale factor to convert flat-top KayKit hex to our pointy-top grid.
 * KayKit circumradius = 2/√3 ≈ 1.1547, ours = 1.0.
 * After 90° Y rotation, uniform scale = 1/circumradius = √3/2 ≈ 0.866.
 */
const HEX_TILE_SCALE = Math.sqrt(3) / 2;

/** Y rotation to convert flat-top → pointy-top (90° = π/2) */
const HEX_TILE_ROTATION_Y = Math.PI / 2;

/** Base Y offset — push tiles down so grass surface sits near Y=0 */
const HEX_TILE_Y_OFFSET = 0;

/** Elevation scale — how much to lift tiles per elevation unit */
const ELEVATION_SCALE = 0.7;

/** Minimum elevation to generate a bottom fill column beneath */
const BOTTOM_FILL_THRESHOLD = 0.15;

/** Water terrain types */
const WATER_TERRAINS: Set<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows',
  'coast', 'lake', 'river', 'reef',
]);

// ── Terrain → hex tile model mapping ────────────────────────────────────────

/** Map terrain types to hex tile models */
function getHexTileModel(
  terrain: TerrainType,
  elevation: number,
  waterNeighborCount: number,
  hasRiver: boolean,
): { modelId: ModelId; extraRotation: number } {
  // Water tiles
  if (WATER_TERRAINS.has(terrain)) {
    return { modelId: 'hex_water', extraRotation: 0 };
  }

  // River tiles (land hex with river)
  if (hasRiver) {
    return { modelId: 'hex_river_A', extraRotation: 0 };
  }

  // Coast detection: land hex adjacent to water
  if (waterNeighborCount > 0) {
    // Pick coast variant based on number of water neighbors
    // A = 1 water edge, B = 2 adjacent, C = 3, D = 4, E = 5
    const coastVariants: ModelId[] = [
      'hex_coast_A', 'hex_coast_B', 'hex_coast_C', 'hex_coast_D', 'hex_coast_E',
    ];
    const idx = Math.min(waterNeighborCount - 1, coastVariants.length - 1);
    return { modelId: coastVariants[idx], extraRotation: 0 };
  }

  // Elevated terrain — use sloped tiles
  if (elevation > 0.7) {
    return { modelId: 'hex_grass_sloped_high', extraRotation: 0 };
  }
  if (elevation > 0.4) {
    return { modelId: 'hex_grass_sloped_low', extraRotation: 0 };
  }

  // Default: grass tile
  return { modelId: 'hex_grass', extraRotation: 0 };
}

// ── Coast rotation logic ────────────────────────────────────────────────────

/**
 * Compute rotation for coast tiles so the water-facing edge aligns correctly.
 * Returns extra Y rotation in radians.
 */
function computeCoastRotation(
  col: number,
  row: number,
  waterNeighborIndices: number[],
): number {
  if (waterNeighborIndices.length === 0) return 0;

  // Average the water neighbor directions to find the "water-facing" angle
  // Hex neighbor directions (pointy-top): 0=E, 1=NE, 2=NW, 3=W, 4=SW, 5=SE
  const dirAngles = [0, 60, 120, 180, 240, 300];
  let sumX = 0;
  let sumZ = 0;
  for (const idx of waterNeighborIndices) {
    const a = (dirAngles[idx] * Math.PI) / 180;
    sumX += Math.cos(a);
    sumZ += Math.sin(a);
  }
  return Math.atan2(sumZ, sumX);
}

// ── Instance grouping ───────────────────────────────────────────────────────

interface TileInstance {
  modelId: ModelId;
  matrix: THREE.Matrix4;
}

function buildTileInstances(tiles: HexTile[]): Map<ModelId, THREE.Matrix4[]> {
  const tileMap = new Map<string, HexTile>();
  for (const t of tiles) {
    tileMap.set(`${t.coord.col},${t.coord.row}`, t);
  }

  const groups = new Map<ModelId, THREE.Matrix4[]>();

  for (const tile of tiles) {
    const { col, row } = tile.coord;
    const elevation = tile.geoParams.elevation;

    // Count water neighbors + track which directions
    const neighbors = hexNeighbors({ col, row });
    const waterNeighborIndices: number[] = [];
    for (let i = 0; i < 6; i++) {
      const nKey = `${neighbors[i].col},${neighbors[i].row}`;
      const nTile = tileMap.get(nKey);
      if (!nTile || WATER_TERRAINS.has(nTile.terrain)) {
        waterNeighborIndices.push(i);
      }
    }

    const isWater = WATER_TERRAINS.has(tile.terrain);
    const waterNeighborCount = isWater ? 0 : waterNeighborIndices.length;

    const { modelId, extraRotation } = getHexTileModel(
      tile.terrain,
      elevation,
      waterNeighborCount,
      tile.hasRiver ?? false,
    );

    // World position
    const px = col * HEX_SCALE_X;
    const pz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);

    // Y position: water sits lower, land rises with elevation
    let py = HEX_TILE_Y_OFFSET;
    if (!isWater) {
      py += elevation * elevation * ELEVATION_SCALE;
    }

    // Compute coast rotation if applicable
    let rotY = HEX_TILE_ROTATION_Y + extraRotation;
    if (waterNeighborCount > 0 && !isWater) {
      rotY += computeCoastRotation(col, row, waterNeighborIndices);
    }

    // Build transform: position + rotation + scale
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(px, py, pz),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
      new THREE.Vector3(HEX_TILE_SCALE, HEX_TILE_SCALE, HEX_TILE_SCALE),
    );

    let arr = groups.get(modelId);
    if (!arr) {
      arr = [];
      groups.set(modelId, arr);
    }
    arr.push(matrix);

    // Bottom fill: place hex_grass_bottom beneath elevated tiles
    // Scale Y to fill the gap between ground and tile surface
    if (!isWater && elevation > BOTTOM_FILL_THRESHOLD) {
      const fillHeight = py; // how tall the column needs to be
      if (fillHeight > 0.05) {
        const bottomMatrix = new THREE.Matrix4();
        bottomMatrix.compose(
          new THREE.Vector3(px, 0, pz), // sits at ground level
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), HEX_TILE_ROTATION_Y),
          new THREE.Vector3(HEX_TILE_SCALE, HEX_TILE_SCALE * fillHeight, HEX_TILE_SCALE),
        );
        let bottomArr = groups.get('hex_grass_bottom');
        if (!bottomArr) {
          bottomArr = [];
          groups.set('hex_grass_bottom', bottomArr);
        }
        bottomArr.push(bottomMatrix);
      }
    }
  }

  return groups;
}

// ── Instanced mesh renderer ─────────────────────────────────────────────────

function TileGroup({
  modelId,
  instances,
}: {
  modelId: ModelId;
  instances: THREE.Matrix4[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const model = getModel(modelId);
  const material = getSharedMaterial();

  useEffect(() => {
    if (!meshRef.current || instances.length === 0) return;
    for (let i = 0; i < instances.length; i++) {
      meshRef.current.setMatrixAt(i, instances[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  if (!model || !material || instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[model.geometry, material, instances.length]}
      frustumCulled={false}
      castShadow
      receiveShadow
    />
  );
}

// ── Component ───────────────────────────────────────────────────────────────

interface HexTileLayerProps {
  tiles: HexTile[];
}

export function HexTileLayer({ tiles }: HexTileLayerProps) {
  const [ready, setReady] = useState(modelsReady());

  useEffect(() => {
    if (ready) return;
    loadAllModels().then(() => setReady(true));
  }, [ready]);

  const tileGroups = useMemo(
    () => (ready ? buildTileInstances(tiles) : new Map()),
    [tiles, ready],
  );

  if (!ready || tileGroups.size === 0) return null;

  const entries = Array.from(tileGroups.entries());

  return (
    <group>
      {entries.map(([modelId, matrices]) => (
        <TileGroup key={modelId} modelId={modelId} instances={matrices} />
      ))}
    </group>
  );
}
