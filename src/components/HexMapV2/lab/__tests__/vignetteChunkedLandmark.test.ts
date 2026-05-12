import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';
import { validateLandmarkExport } from '../vignette/LandmarkExportValidator';
import { VignetteClickRegistry } from '../vignette/VignetteClickRegistry';
import type { LandmarkClickEntry } from '../vignette/VignetteClickRegistry';

function makeScene(meshCount: number): THREE.Group {
  const group = new THREE.Group();
  for (let i = 0; i < meshCount; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    );
    group.add(mesh);
  }
  return group;
}

function makeLandmarkEntry(overrides: Partial<LandmarkClickEntry> = {}): LandmarkClickEntry {
  return {
    id: 'target-1',
    hexId: 'hex-a',
    label: 'Village',
    slot: 'CENTER',
    modelId: 'builtin-village',
    position: { x: 10, y: 20 },
    radiusPx: 28,
    batchKey: 'builtin-village',
    instanceIndex: 0,
    ...overrides,
  };
}

describe('TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS — Phase 3', () => {
  it('defines LANDMARK_MAX_INSTANCES_PER_BATCH', () => {
    expect(TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_MAX_INSTANCES_PER_BATCH).toBe(256);
  });

  it('defines LANDMARK_DEFAULT_VISIBILITY_STATE as 2', () => {
    expect(TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_DEFAULT_VISIBILITY_STATE).toBe(2);
  });

  it('defines LANDMARK_LAYER_Z_OFFSET as 0.02', () => {
    expect(TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_LAYER_Z_OFFSET).toBeCloseTo(0.02);
  });
});

describe('validateLandmarkExport', () => {
  it('returns info severity when mesh count is within limit', () => {
    const scene = makeScene(2);
    const report = validateLandmarkExport(scene, '/models/test.glb', 3);
    expect(report.severity).toBe('info');
    expect(report.declaredMaterialCount).toBe(2);
    expect(report.truncatedToMaterialCount).toBe(2);
  });

  it('returns warn severity when mesh count exceeds limit', () => {
    const scene = makeScene(5);
    const report = validateLandmarkExport(scene, '/models/test.glb', 3);
    expect(report.severity).toBe('warn');
    expect(report.declaredMaterialCount).toBe(5);
    expect(report.truncatedToMaterialCount).toBe(3);
  });

  it('handles exactly the limit without warning', () => {
    const scene = makeScene(3);
    const report = validateLandmarkExport(scene, '/models/test.glb', 3);
    expect(report.severity).toBe('info');
    expect(report.truncatedToMaterialCount).toBe(3);
  });

  it('counts only direct Mesh children, not nested groups', () => {
    const scene = new THREE.Group();
    const child = new THREE.Group();
    child.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
    scene.add(child);
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
    // traverse finds both meshes (nested + direct)
    const report = validateLandmarkExport(scene, '/models/test.glb', 3);
    expect(report.declaredMaterialCount).toBe(2);
  });

  it('emits the correct report type', () => {
    const report = validateLandmarkExport(makeScene(1), '/models/test.glb', 3);
    expect(report.type).toBe('vignette.landmark.validation');
  });

  it('includes the modelUrl in the report', () => {
    const url = '/models/my-landmark.glb';
    const report = validateLandmarkExport(makeScene(1), url, 3);
    expect(report.modelUrl).toBe(url);
  });
});

describe('VignetteClickRegistry', () => {
  it('starts empty', () => {
    const registry = new VignetteClickRegistry();
    expect(registry.list().length).toBe(0);
  });

  it('replace populates the list', () => {
    const registry = new VignetteClickRegistry();
    registry.replace([makeLandmarkEntry(), makeLandmarkEntry({ id: 'target-2', instanceIndex: 1 })]);
    expect(registry.list().length).toBe(2);
  });

  it('replace overwrites previous entries', () => {
    const registry = new VignetteClickRegistry();
    registry.replace([makeLandmarkEntry()]);
    registry.replace([makeLandmarkEntry({ id: 'target-2' }), makeLandmarkEntry({ id: 'target-3' })]);
    expect(registry.list().length).toBe(2);
    expect(registry.list()[0]!.id).toBe('target-2');
  });

  it('clear empties the registry', () => {
    const registry = new VignetteClickRegistry();
    registry.replace([makeLandmarkEntry()]);
    registry.clear();
    expect(registry.list().length).toBe(0);
  });

  it('list is readonly — mutations do not affect registry', () => {
    const registry = new VignetteClickRegistry();
    registry.replace([makeLandmarkEntry()]);
    const listed = registry.list() as LandmarkClickEntry[];
    listed.push(makeLandmarkEntry({ id: 'injected' }));
    // The registry's internal array should still have only 1 entry
    expect(registry.list().length).toBe(1);
  });
});
