import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TERRAIN_TEXTURE_LAB_CONSTANTS, TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';
import { createVignetteInstanceMaterial } from './VignetteInstanceMaterial';
import type { ResolvedHexFiller, FillerInstance } from './VignetteResolver';

interface ExtractedSubmesh {
  geometry: THREE.BufferGeometry;
  color: THREE.Color;
}

interface FillerBatch {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

export class ChunkedFillerLayer {
  private scene: THREE.Scene;
  private loader: GLTFLoader;
  private batches: FillerBatch[] = [];
  private gltfCache: Map<string, Promise<THREE.Group>> = new Map();
  private boundsGroup: THREE.Group;

  constructor(scene: THREE.Scene, loader: GLTFLoader) {
    this.scene = scene;
    this.loader = loader;
    this.boundsGroup = new THREE.Group();
    this.boundsGroup.name = 'ChunkedFillerBounds';
    scene.add(this.boundsGroup);
  }

  async build(specs: ResolvedHexFiller[]): Promise<boolean> {
    this.clearBatches();

    // Group instances by modelUrl across all hexes
    const byUrl = new Map<string, FillerInstance[]>();
    for (const hexFiller of specs) {
      for (const inst of hexFiller.instances) {
        const list = byUrl.get(inst.modelUrl) ?? [];
        list.push(inst);
        byUrl.set(inst.modelUrl, list);
      }
    }

    const maxBatch = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.SCATTER_MAX_INSTANCES_PER_BATCH;

    try {
      for (const [modelUrl, instances] of byUrl) {
        const count = Math.min(instances.length, maxBatch);
        if (count === 0) continue;

        let scene: THREE.Group;
        try {
          scene = await this.loadGltf(modelUrl);
        } catch (err) {
          console.warn(`[ChunkedFillerLayer] Failed to load ${modelUrl}:`, err);
          continue;
        }

        const submeshes = this.extractSubmeshes(scene);
        if (submeshes.length === 0) continue;

        for (const submesh of submeshes) {
          const material = createVignetteInstanceMaterial(submesh.color);
          const mesh = new THREE.InstancedMesh(submesh.geometry, material, count);
          mesh.frustumCulled = false;

          this.applyInstances(mesh, submesh.geometry, instances, count);

          this.scene.add(mesh);
          this.batches.push({ mesh, geometry: submesh.geometry, material });
        }

        if (import.meta.env.DEV) {
          console.debug('[vignette.chunk]', { modelUrl, instanceCount: count, submeshCount: submeshes.length });
        }
      }
      return true;
    } catch (err) {
      console.warn('[ChunkedFillerLayer] Build failed:', err);
      this.clearBatches();
      return false;
    }
  }

  private applyInstances(
    mesh: THREE.InstancedMesh,
    geometry: THREE.BufferGeometry,
    instances: FillerInstance[],
    count: number,
  ): void {
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);

    const visibilityState = new Float32Array(count);
    const hoverMix = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const inst = instances[i]!;
      pos.set(inst.x, inst.y, TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z);
      quat.setFromAxisAngle(zAxis, inst.yawDegrees * (Math.PI / 180));
      scaleVec.setScalar(inst.scale);
      matrix.compose(pos, quat, scaleVec);
      mesh.setMatrixAt(i, matrix);
      visibilityState[i] = inst.visibilityState;
      hoverMix[i] = 0;
    }

    mesh.instanceMatrix.needsUpdate = true;
    geometry.setAttribute('aVisibilityState', new THREE.InstancedBufferAttribute(visibilityState, 1));
    geometry.setAttribute('aHoverMix', new THREE.InstancedBufferAttribute(hoverMix, 1));
  }

  private async loadGltf(url: string): Promise<THREE.Group> {
    const cached = this.gltfCache.get(url);
    if (cached) return cached;

    const promise = this.loader.loadAsync(url).then(gltf => {
      gltf.scene.updateMatrixWorld(true);
      return gltf.scene;
    });

    this.gltfCache.set(url, promise);
    return promise;
  }

  private extractSubmeshes(scene: THREE.Group): ExtractedSubmesh[] {
    const submeshes: ExtractedSubmesh[] = [];
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);

      const mat = Array.isArray(child.material) ? child.material[0] : child.material;
      const color = (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial)
        ? mat.color.clone()
        : new THREE.Color(0xffffff);

      submeshes.push({ geometry: geom, color });
    });
    return submeshes;
  }

  setVisible(visible: boolean): void {
    for (const batch of this.batches) {
      batch.mesh.visible = visible;
    }
  }

  setChunkBoundsVisible(visible: boolean): void {
    this.boundsGroup.visible = visible;
  }

  clearBatches(): void {
    for (const batch of this.batches) {
      this.scene.remove(batch.mesh);
      batch.geometry.dispose();
      batch.material.dispose();
    }
    this.batches = [];
  }

  dispose(): void {
    this.clearBatches();
    this.scene.remove(this.boundsGroup);
    this.gltfCache.clear();
  }
}
