/**
 * Instanced prop rendering layer for the WebGL hex map.
 * Renders trees, rocks, boulders, and grass tufts as InstancedMesh objects.
 */
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { HexTile } from '../../../types';
import {
  createTreeGeometry,
  createDeciduousTreeGeometry,
  createRockGeometry,
  createBoulderGeometry,
  createGrassTuftGeometry,
} from './propGeometry';
import { generatePropInstances } from './propPlacement';

// ── Prop colors (NFP #1: Tunability) ────────────────────────────────────────

/** Prop colors — bright diorama / LEGO brick palette */
const CONIFER_COLOR = '#3a7a3a';
const DECIDUOUS_COLOR = '#5aaa48';
const ROCK_COLOR = '#8a8580';
const BOULDER_COLOR = '#7a7570';
const GRASS_COLOR = '#68a040';

// ── Component ───────────────────────────────────────────────────────────────

interface PropLayerProps {
  tiles: HexTile[];
  seed?: number;
}

function PropGroup({
  geometry,
  instances,
  color,
}: {
  geometry: THREE.BufferGeometry;
  instances: THREE.Matrix4[];
  color: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current || instances.length === 0) return;
    for (let i = 0; i < instances.length; i++) {
      meshRef.current.setMatrixAt(i, instances[i]);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, instances.length]}
      frustumCulled={false}
    >
      <meshBasicMaterial color={color} fog />
    </instancedMesh>
  );
}

export function PropLayer({ tiles, seed = 42 }: PropLayerProps) {
  // Generate all geometries once
  const geometries = useMemo(() => ({
    conifer: createTreeGeometry(),
    deciduous: createDeciduousTreeGeometry(),
    rock: createRockGeometry(),
    boulder: createBoulderGeometry(),
    grass: createGrassTuftGeometry(),
  }), []);

  // Generate instance placements
  const instances = useMemo(
    () => generatePropInstances(tiles, seed),
    [tiles, seed],
  );

  return (
    <group>
      <PropGroup geometry={geometries.conifer} instances={instances.conifer} color={CONIFER_COLOR} />
      <PropGroup geometry={geometries.deciduous} instances={instances.deciduous} color={DECIDUOUS_COLOR} />
      <PropGroup geometry={geometries.rock} instances={instances.rock} color={ROCK_COLOR} />
      <PropGroup geometry={geometries.boulder} instances={instances.boulder} color={BOULDER_COLOR} />
      <PropGroup geometry={geometries.grass} instances={instances.grass} color={GRASS_COLOR} />
    </group>
  );
}
