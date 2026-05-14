import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS,
  type TerrainTextureLabModelDefinition,
  type TerrainTextureLabModelPlacement,
} from '../terrainTextureLabPresets';
import { createVignetteInstanceMaterial } from './VignetteInstanceMaterial';
import { validateLandmarkExport, type LandmarkValidationReport } from './LandmarkExportValidator';
import type { VignetteClickRegistry, LandmarkClickEntry } from './VignetteClickRegistry';
import type { TerrainTextureLabVignetteClickTarget } from '../terrainTextureLabVignettePrototype';

interface ExtractedSubmesh {
  geometry: THREE.BufferGeometry;
  color: THREE.Color;
}

interface LandmarkBatch {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  modelId: string;
  submeshIndex: number;
}

export interface LandmarkBatchInfo {
  mesh: THREE.InstancedMesh;
  modelId: string;
  submeshIndex: number;
}

const VALIDATION_REPORT_CAP = 64;

export class ChunkedLandmarkLayer {
  private scene: THREE.Scene;
  private loader: GLTFLoader;
  private batches: LandmarkBatch[] = [];
  private gltfCache: Map<string, Promise<THREE.Group>> = new Map();
  private boundsGroup: THREE.Group;
  private _batchCount = 0;
  private _validationReports: LandmarkValidationReport[] = [];

  constructor(scene: THREE.Scene, loader: GLTFLoader) {
    this.scene = scene;
    this.loader = loader;
    this.boundsGroup = new THREE.Group();
    this.boundsGroup.name = 'ChunkedLandmarkBounds';
    scene.add(this.boundsGroup);
  }

  async build(
    placements: TerrainTextureLabModelPlacement[],
    models: TerrainTextureLabModelDefinition[],
    clickTargets: TerrainTextureLabVignetteClickTarget[],
    registry: VignetteClickRegistry,
  ): Promise<boolean> {
    this.clearBatches();
    this._validationReports = [];

    const maxBatch = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_MAX_INSTANCES_PER_BATCH;
    const t0 = performance.now();

    // Group placements by modelId to build one batch group per model
    const byModelId = new Map<string, TerrainTextureLabModelPlacement[]>();
    for (const placement of placements) {
      const list = byModelId.get(placement.modelId) ?? [];
      list.push(placement);
      byModelId.set(placement.modelId, list);
    }

    const registryEntries: LandmarkClickEntry[] = [];
    let validationWarningCount = 0;

    try {
      for (const [modelId, modelPlacements] of byModelId) {
        const model = models.find(m => m.id === modelId);
        if (!model) continue;

        const count = Math.min(modelPlacements.length, maxBatch);
        if (count === 0) continue;

        let gltfScene: THREE.Group;
        try {
          gltfScene = await this.loadGltf(model.sourceUrl);
        } catch (err) {
          console.warn(`[ChunkedLandmarkLayer] Failed to load ${model.sourceUrl}:`, err);
          continue;
        }

        const report = validateLandmarkExport(
          gltfScene,
          model.sourceUrl,
          TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_MAX_MATERIAL_SLOTS,
        );
        if (report.severity === 'warn') {
          validationWarningCount++;
          console.warn(
            `[ChunkedLandmarkLayer] ${model.sourceUrl}: ${report.declaredMaterialCount} submeshes exceeds limit of ${TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_MAX_MATERIAL_SLOTS}.`,
          );
        }
        this.pushValidationReport(report);

        const submeshes = this.extractSubmeshes(
          gltfScene,
          TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_MAX_MATERIAL_SLOTS,
        );
        if (submeshes.length === 0) continue;

        for (let submeshIndex = 0; submeshIndex < submeshes.length; submeshIndex++) {
          const submesh = submeshes[submeshIndex]!;
          const material = createVignetteInstanceMaterial(submesh.color);
          const mesh = new THREE.InstancedMesh(submesh.geometry, material, count);
          mesh.frustumCulled = false;

          this.applyInstances(mesh, submesh.geometry, modelPlacements, count);

          this.scene.add(mesh);
          this.batches.push({ mesh, geometry: submesh.geometry, material, modelId, submeshIndex });
        }

        // Register click entries for this model's placements
        const batchKey = modelId;
        for (let instanceIndex = 0; instanceIndex < count; instanceIndex++) {
          const placement = modelPlacements[instanceIndex]!;
          const clickTarget = clickTargets.find(
            ct => ct.hexId === placement.hexId && ct.modelId === placement.modelId,
          );
          if (clickTarget) {
            registryEntries.push({ ...clickTarget, batchKey, instanceIndex });
          }
        }
      }

      registry.replace(registryEntries);
      this._batchCount = this.batches.length;

      if (import.meta.env.DEV) {
        const buildTimeMs = performance.now() - t0;
        console.debug('[vignette.landmark.build]', {
          totalLandmarkCount: placements.length,
          batchCount: this._batchCount,
          uniqueModelCount: byModelId.size,
          buildTimeMs,
          validationWarningCount,
        });
        console.debug('[vignette.landmark.registry]', {
          entryCount: registryEntries.length,
          uniqueHexCount: new Set(registryEntries.map(e => e.hexId)).size,
        });
      }

      return true;
    } catch (err) {
      console.warn('[ChunkedLandmarkLayer] Build failed:', err);
      this.clearBatches();
      return false;
    }
  }

  get batchCount(): number {
    return this._batchCount;
  }

  get validationReports(): readonly LandmarkValidationReport[] {
    return this._validationReports;
  }

  private pushValidationReport(report: LandmarkValidationReport): void {
    this._validationReports.push(report);
    if (this._validationReports.length > VALIDATION_REPORT_CAP) {
      this._validationReports.shift();
    }
  }

  private applyInstances(
    mesh: THREE.InstancedMesh,
    geometry: THREE.BufferGeometry,
    placements: TerrainTextureLabModelPlacement[],
    count: number,
  ): void {
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);

    const visibilityState = new Float32Array(count);
    const hoverMix = new Float32Array(count);
    const selectionMix = new Float32Array(count);
    const landmarkZ =
      TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z +
      TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_LAYER_Z_OFFSET;

    for (let i = 0; i < count; i++) {
      const p = placements[i]!;
      const x = p.x ?? 0;
      const y = p.y ?? 0;
      pos.set(x, y, landmarkZ + (p.heightOffset ?? 0));
      quat.setFromAxisAngle(zAxis, (p.rotationDegrees ?? 0) * (Math.PI / 180));
      scaleVec.setScalar(p.scale);
      matrix.compose(pos, quat, scaleVec);
      mesh.setMatrixAt(i, matrix);
      visibilityState[i] = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_DEFAULT_VISIBILITY_STATE;
      hoverMix[i] = 0;
      selectionMix[i] = 0;
    }

    mesh.instanceMatrix.needsUpdate = true;
    geometry.setAttribute('aVisibilityState', new THREE.InstancedBufferAttribute(visibilityState, 1));
    geometry.setAttribute('aHoverMix', new THREE.InstancedBufferAttribute(hoverMix, 1));
    geometry.setAttribute('aSelectionMix', new THREE.InstancedBufferAttribute(selectionMix, 1));
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

  private extractSubmeshes(scene: THREE.Group, maxSlots: number): ExtractedSubmesh[] {
    const submeshes: ExtractedSubmesh[] = [];
    scene.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      if (submeshes.length >= maxSlots) return;

      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);

      const mat = Array.isArray(child.material) ? child.material[0] : child.material;
      const color =
        mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial
          ? mat.color.clone()
          : new THREE.Color(0xffffff);

      submeshes.push({ geometry: geom, color });
    });
    return submeshes;
  }

  getBatchInfos(): readonly LandmarkBatchInfo[] {
    return this.batches.map(b => ({ mesh: b.mesh, modelId: b.modelId, submeshIndex: b.submeshIndex }));
  }

  setInstanceAttribute(batchKey: string, instanceIndex: number, attrName: string, value: number): void {
    for (const batch of this.batches) {
      if (batch.modelId !== batchKey) continue;
      const attr = batch.geometry.getAttribute(attrName) as THREE.InstancedBufferAttribute | undefined;
      if (!attr) continue;
      attr.setX(instanceIndex, value);
      attr.updateRange = { offset: instanceIndex, count: 1 };
      attr.needsUpdate = true;
    }
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
    this._batchCount = 0;
  }

  dispose(): void {
    this.clearBatches();
    this.scene.remove(this.boundsGroup);
    this.gltfCache.clear();
  }
}
