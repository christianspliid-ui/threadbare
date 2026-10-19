/**
 * THR-1892 — the map under the Stage (plan THR-1877 § D5): every hex but the lit one is
 * dimmed, at STAGE_MAP_DIM, above labels and below fog; the ring is above fog and never gold.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStageFocusLayer, STAGE_FOCUS_LAYER_NAME } from '../StageFocusLayer';
import { RENDER_ORDER, LAYER_Z } from '../RenderLayers';
import { STAGE_MAP_DIM, STAGE_DIM_COLOR } from '../../../../data/stage-content';
import { DOMINION_DIM_COLOR } from '../../../../data/dominion-ui-content';

const tiles = [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 1 }];

describe('StageFocusLayer', () => {
  it('dims every tile but the lit one and names itself for snapshotScene', () => {
    const layer = createStageFocusLayer({ lit: ['1,0'], options: [], strength: STAGE_MAP_DIM }, tiles);
    expect(layer.group.name).toBe(STAGE_FOCUS_LAYER_NAME);
    expect(layer.counts).toEqual({ lit: 1, dimmed: 3 });
    expect(layer.strength).toBe(0.7);
    layer.dispose();
  });

  it('nothing lit dims the whole map', () => {
    const layer = createStageFocusLayer({ lit: [], options: [], strength: STAGE_MAP_DIM }, tiles);
    expect(layer.counts).toEqual({ lit: 0, dimmed: 4 });
    layer.dispose();
  });

  it('fades from nothing to the full dim', () => {
    const layer = createStageFocusLayer({ lit: ['1,0'], options: [], strength: STAGE_MAP_DIM }, tiles);
    const dim = layer.group.children.find(c => c instanceof THREE.InstancedMesh && c.renderOrder === RENDER_ORDER.STAGE_DIM) as THREE.InstancedMesh;
    const mat = dim.material as THREE.MeshBasicMaterial;
    expect(mat.opacity).toBe(0);
    layer.setProgress(0.5);
    expect(mat.opacity).toBeCloseTo(0.35);
    layer.setProgress(2);
    expect(mat.opacity).toBeCloseTo(0.7);
    layer.dispose();
  });

  it('the dim is the lens grammar’s near-black, never a hue', () => {
    expect(STAGE_DIM_COLOR).toBe(DOMINION_DIM_COLOR);
  });

  it('the dim sits above labels and below fog; the ring above fog', () => {
    expect(RENDER_ORDER.STAGE_DIM).toBeGreaterThan(RENDER_ORDER.LABELS);
    expect(RENDER_ORDER.STAGE_DIM).toBeLessThan(RENDER_ORDER.FOG);
    expect(RENDER_ORDER.STAGE_RING).toBeGreaterThan(RENDER_ORDER.FOG);
    expect(LAYER_Z.STAGE_DIM).toBeGreaterThan(LAYER_Z.EVENTS);
    expect(LAYER_Z.STAGE_DIM).toBeLessThan(LAYER_Z.FOG_OVERLAY);
    expect(LAYER_Z.STAGE_RING).toBeGreaterThan(LAYER_Z.FOG_OVERLAY);
  });

  it('the ring is parchment, not the frontier gold', () => {
    const layer = createStageFocusLayer({ lit: ['1,0'], options: [], strength: STAGE_MAP_DIM }, tiles);
    const ring = layer.group.children.find(c => c instanceof THREE.Mesh && !(c instanceof THREE.InstancedMesh)) as THREE.Mesh;
    const color = (ring.material as THREE.MeshBasicMaterial).color.getHexString();
    expect(color).not.toBe('d4a040');
    layer.dispose();
  });
});
