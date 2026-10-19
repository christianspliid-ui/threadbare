/**
 * ArmedTargetsLayer (THR-1914, Inspector plan § D9 way 3).
 *
 * - Built on the lens plate builder: a castable hex has no plate, a locked-only hex a
 *   lighter one (`ARMED_LOCKED_LIT`), every other land hex the lens dim; water never.
 * - Not pickable: a raycast through the group hits nothing, so a map click reaches the hex.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createArmedTargetsLayer, armedLockedAlpha, ARMED_TARGETS_LAYER_NAME } from '../ArmedTargetsLayer';
import { LENS_DIM_ALPHA } from '../HexLensLayer';
import { ARMED_LOCKED_LIT } from '../../../../engine/views/viewConstants';

const tiles = [
  { col: 0, row: 0, isWater: false },
  { col: 1, row: 0, isWater: false },
  { col: 2, row: 0, isWater: false },
  { col: 3, row: 0, isWater: true },
];

describe('ArmedTargetsLayer', () => {
  it('lights castable hexes, dim-lights locked ones and dims the rest of the land', () => {
    const layer = createArmedTargetsLayer({ lit: ['0,0'], litLocked: ['1,0'], hover: {} }, tiles);
    expect(layer.group.name).toBe(ARMED_TARGETS_LAYER_NAME);
    expect(layer.counts).toEqual({ lit: 1, litLocked: 1, dimmed: 1 });
    const meshes = layer.group.children as THREE.InstancedMesh[];
    expect(meshes).toHaveLength(2);
    const opacities = meshes.map(m => (m.material as THREE.MeshBasicMaterial).opacity).sort();
    expect(opacities).toEqual([armedLockedAlpha(), LENS_DIM_ALPHA].sort());
    expect(armedLockedAlpha()).toBeCloseTo(LENS_DIM_ALPHA * (1 - ARMED_LOCKED_LIT));
    layer.dispose();
    expect(layer.group.children).toHaveLength(0);
  });

  it('nothing lit dims every land hex', () => {
    const layer = createArmedTargetsLayer({ lit: [], litLocked: [], hover: {} }, tiles);
    expect(layer.counts.dimmed).toBe(3);
    expect(layer.group.children).toHaveLength(1);
  });

  it('is not a pick target', () => {
    const layer = createArmedTargetsLayer({ lit: [], litLocked: ['1,0'], hover: {} }, tiles);
    const raycaster = new THREE.Raycaster(new THREE.Vector3(0, 0, 100), new THREE.Vector3(0, 0, -1));
    expect(raycaster.intersectObject(layer.group, true)).toHaveLength(0);
  });
});
