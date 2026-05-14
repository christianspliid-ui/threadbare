import * as THREE from 'three';
import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';
import type { ChunkedLandmarkLayer } from './ChunkedLandmarkLayer';
import type { VignetteClickRegistry, LandmarkClickEntry } from './VignetteClickRegistry';

/**
 * Pick the nearest landmark instance under the given NDC pointer using raycasting.
 * Falls back to returning null if no mesh is hit or the hit cannot be resolved to a
 * registry entry (e.g. stale registry after a rebuild).
 */
export function pickLandmark(
  pointerNDC: THREE.Vector2,
  camera: THREE.Camera,
  layer: ChunkedLandmarkLayer,
  registry: VignetteClickRegistry,
): LandmarkClickEntry | null {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointerNDC, camera);

  const batchInfos = layer.getBatchInfos();
  if (batchInfos.length === 0) return null;

  const meshes = batchInfos.map(b => b.mesh);
  const intersects = raycaster.intersectObjects(
    meshes,
    TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.RAYCASTER_LANDMARK_RECURSIVE,
  );

  if (intersects.length === 0) return null;

  const hit = intersects[0]!;
  const instanceIndex = hit.instanceId ?? -1;
  if (instanceIndex < 0) return null;

  // Resolve which modelId this mesh belongs to
  const hitMesh = hit.object as THREE.InstancedMesh;
  const batch = batchInfos.find(b => b.mesh === hitMesh);
  if (!batch) return null;

  const batchKey = batch.modelId;
  const entries = registry.list();
  const entry = entries.find(e => e.batchKey === batchKey && e.instanceIndex === instanceIndex);
  return entry ?? null;
}
