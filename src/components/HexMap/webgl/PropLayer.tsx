/**
 * Instanced prop rendering layer for the WebGL hex map.
 * Loads KayKit GLTF models and renders them as InstancedMesh objects
 * with a shared palette texture for minimal draw calls.
 *
 * Falls back to procedural geometry if GLTF models haven't loaded yet.
 */
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { HexTile } from '../../../types';
import {
  createTreeGeometry,
  createDeciduousTreeGeometry,
  createRockGeometry,
  createBoulderGeometry,
  createGrassTuftGeometry,
} from './propGeometry';
import { generatePropInstances, groupByModel } from './propPlacement';
import type { ModelId } from './modelLoader';
import { loadAllModels, getModel, getSharedMaterial, modelsReady } from './modelLoader';

// ── Fallback prop colors (used when GLTF models haven't loaded) ─────────────

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

/** Renders a single InstancedMesh for one GLTF model type */
function GLTFPropGroup({
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
    />
  );
}

/** Fallback: procedural geometry prop group (used while GLTF loads) */
function FallbackPropGroup({
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
  const [gltfReady, setGltfReady] = useState(modelsReady());

  // Trigger GLTF loading
  useEffect(() => {
    if (gltfReady) return;
    loadAllModels().then(() => setGltfReady(true));
  }, [gltfReady]);

  // Generate all instance placements (same regardless of GLTF vs fallback)
  const instances = useMemo(
    () => generatePropInstances(tiles, seed),
    [tiles, seed],
  );

  // Group instances by GLTF model ID
  const modelGroups = useMemo(
    () => groupByModel(instances, seed),
    [instances, seed],
  );

  // Fallback geometries (only used while GLTF loads)
  const fallbackGeos = useMemo(() => ({
    conifer: createTreeGeometry(),
    deciduous: createDeciduousTreeGeometry(),
    rock: createRockGeometry(),
    boulder: createBoulderGeometry(),
    grass: createGrassTuftGeometry(),
  }), []);

  if (gltfReady) {
    // Render with GLTF models
    const entries = Array.from(modelGroups.entries());
    return (
      <group>
        {entries.map(([modelId, mats]) => (
          <GLTFPropGroup key={modelId} modelId={modelId} instances={mats} />
        ))}
      </group>
    );
  }

  // Fallback: procedural geometry while loading
  return (
    <group>
      <FallbackPropGroup geometry={fallbackGeos.conifer} instances={instances.conifer} color={CONIFER_COLOR} />
      <FallbackPropGroup geometry={fallbackGeos.deciduous} instances={instances.deciduous} color={DECIDUOUS_COLOR} />
      <FallbackPropGroup geometry={fallbackGeos.rock} instances={instances.rock} color={ROCK_COLOR} />
      <FallbackPropGroup geometry={fallbackGeos.boulder} instances={instances.boulder} color={BOULDER_COLOR} />
      <FallbackPropGroup geometry={fallbackGeos.grass} instances={instances.grass} color={GRASS_COLOR} />
    </group>
  );
}
