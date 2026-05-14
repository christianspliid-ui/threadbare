import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// Minimal mock of ChunkedLandmarkLayer exposing only what pickLandmark needs.
function makeMockLayer(batches: Array<{ mesh: THREE.InstancedMesh; modelId: string; submeshIndex: number }>) {
  return {
    getBatchInfos: () => batches,
  };
}

function makeMockRegistry(entries: Array<{ batchKey: string; instanceIndex: number; id: string; hexId: string; label: string; slot: string; position: { x: number; y: number }; radiusPx: number; modelId: string }>) {
  return {
    list: () => entries,
  };
}

// Stub THREE.Raycaster so we can control what intersects it reports.
const mockIntersectObjects = vi.fn<[THREE.Object3D[], boolean], THREE.Intersection[]>();

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal() as typeof THREE;
  return {
    ...actual,
    Raycaster: class MockRaycaster {
      setFromCamera = vi.fn();
      intersectObjects = mockIntersectObjects;
    },
  };
});

import { pickLandmark } from '../LandmarkRaycaster';

describe('pickLandmark', () => {
  const camera = new THREE.PerspectiveCamera();
  const pointerNDC = new THREE.Vector2(0, 0);

  beforeEach(() => {
    mockIntersectObjects.mockReset();
  });

  it('returns null when no meshes in layer', () => {
    const layer = makeMockLayer([]);
    const registry = makeMockRegistry([]);
    const result = pickLandmark(pointerNDC, camera, layer as never, registry as never);
    expect(result).toBeNull();
  });

  it('returns null on raycaster miss (empty intersects)', () => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 1);
    const layer = makeMockLayer([{ mesh, modelId: 'village', submeshIndex: 0 }]);
    const registry = makeMockRegistry([{ batchKey: 'village', instanceIndex: 0, id: 'target-1', hexId: 'forest-a', label: 'Village', slot: 'CENTER', position: { x: 0, y: 0 }, radiusPx: 28, modelId: 'village' }]);
    mockIntersectObjects.mockReturnValue([]);
    const result = pickLandmark(pointerNDC, camera, layer as never, registry as never);
    expect(result).toBeNull();
  });

  it('returns the matched registry entry on hit', () => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 2);
    const layer = makeMockLayer([{ mesh, modelId: 'village', submeshIndex: 0 }]);
    const entries = [
      { batchKey: 'village', instanceIndex: 0, id: 'target-0', hexId: 'forest-a', label: 'Village', slot: 'CENTER', position: { x: 0, y: 0 }, radiusPx: 28, modelId: 'village' },
      { batchKey: 'village', instanceIndex: 1, id: 'target-1', hexId: 'forest-b', label: 'Village B', slot: 'CENTER', position: { x: 10, y: 0 }, radiusPx: 28, modelId: 'village' },
    ];
    const registry = makeMockRegistry(entries);
    mockIntersectObjects.mockReturnValue([{ object: mesh, instanceId: 1, distance: 5 } as THREE.Intersection]);
    const result = pickLandmark(pointerNDC, camera, layer as never, registry as never);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('target-1');
    expect(result!.hexId).toBe('forest-b');
  });

  it('returns null when registry has no matching entry (stale registry)', () => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 1);
    const layer = makeMockLayer([{ mesh, modelId: 'village', submeshIndex: 0 }]);
    // Registry is empty (was rebuilt and cleared)
    const registry = makeMockRegistry([]);
    mockIntersectObjects.mockReturnValue([{ object: mesh, instanceId: 0, distance: 5 } as THREE.Intersection]);
    const result = pickLandmark(pointerNDC, camera, layer as never, registry as never);
    expect(result).toBeNull();
  });

  it('returns null when instanceId is -1', () => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 1);
    const layer = makeMockLayer([{ mesh, modelId: 'village', submeshIndex: 0 }]);
    const registry = makeMockRegistry([]);
    // instanceId missing (non-InstancedMesh hit)
    mockIntersectObjects.mockReturnValue([{ object: mesh, distance: 5 } as THREE.Intersection]);
    const result = pickLandmark(pointerNDC, camera, layer as never, registry as never);
    expect(result).toBeNull();
  });
});
