/**
 * THR-1892 — the map under the Stage (plan THR-1877 § D5): every hex but the lit one is
 * dimmed, at STAGE_MAP_DIM, above labels and below fog; the ring is above fog and never gold.
 * THR-1897 adds a premonition's option rings, shown one at a time on hover.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createStageFocusLayer, dashSpans, STAGE_FOCUS_LAYER_NAME } from '../StageFocusLayer';
import { RENDER_ORDER, LAYER_Z } from '../RenderLayers';
import { STAGE_MAP_DIM, STAGE_DIM_COLOR } from '../../../../data/stage-content';
import { DOMINION_DIM_COLOR } from '../../../../data/dominion-ui-content';

const tiles = [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 1 }];

describe('StageFocusLayer', () => {
  it('dims every tile but the lit one and names itself for snapshotScene', () => {
    const layer = createStageFocusLayer({ lit: ['1,0'], options: [], strength: STAGE_MAP_DIM }, tiles);
    expect(layer.group.name).toBe(STAGE_FOCUS_LAYER_NAME);
    expect(layer.counts).toEqual({ lit: 1, dimmed: 3, options: 0 });
    expect(layer.strength).toBe(0.7);
    layer.dispose();
  });

  it('nothing lit dims the whole map', () => {
    const layer = createStageFocusLayer({ lit: [], options: [], strength: STAGE_MAP_DIM }, tiles);
    expect(layer.counts).toEqual({ lit: 0, dimmed: 4, options: 0 });
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

  // THR-1897 (S4) — a premonition's option places.
  it('rings an option place only while it is hovered, dashed, above the fog', () => {
    const layer = createStageFocusLayer({
      lit: ['1,0'],
      options: [
        { hexKey: '2,0', tone: 'compulsion', ringOnly: false, hovered: false },
        { hexKey: '1,1', tone: 'compulsion', ringOnly: true, hovered: false },
      ],
      strength: STAGE_MAP_DIM,
    }, tiles);
    expect(layer.counts).toEqual({ lit: 1, dimmed: 3, options: 2 });
    const ringOf = (key: string) => layer.group.children.find(c => c.name === `stage_option_ring:${key}`) as THREE.Mesh;
    expect(ringOf('2,0').visible).toBe(false);
    expect(ringOf('1,1').visible).toBe(false);
    expect(ringOf('2,0').renderOrder).toBe(RENDER_ORDER.STAGE_RING);
    layer.setProgress(1);
    layer.setHoveredOption('2,0');
    expect(layer.getHoveredOption()).toBe('2,0');
    expect(ringOf('2,0').visible).toBe(true);
    expect(ringOf('1,1').visible).toBe(false);
    expect((ringOf('2,0').material as THREE.MeshBasicMaterial).opacity).toBe(1);
    layer.setHoveredOption(null);
    expect(ringOf('2,0').visible).toBe(false);
    layer.dispose();
  });

  it('lifts the dim from a hovered option outside fog, never from one in fog', () => {
    const layer = createStageFocusLayer({
      lit: ['1,0'],
      options: [
        { hexKey: '2,0', tone: 'whisper', ringOnly: false, hovered: false },
        { hexKey: '1,1', tone: 'whisper', ringOnly: true, hovered: false },
      ],
      strength: STAGE_MAP_DIM,
    }, tiles);
    const dims = layer.group.children.filter(c => c instanceof THREE.InstancedMesh && c.renderOrder === RENDER_ORDER.STAGE_DIM) as THREE.InstancedMesh[];
    // The main dim (0,0 and 2,0's neighbour 1,1 in fog) and the one option plate (2,0).
    const plate = dims.find(d => d.count === 1)!;
    const scaleOf = () => {
      const m = new THREE.Matrix4();
      plate.getMatrixAt(0, m);
      return new THREE.Vector3().setFromMatrixScale(m).x;
    };
    expect(scaleOf()).toBe(1);
    layer.setHoveredOption('2,0');
    expect(scaleOf()).toBe(0);
    layer.setHoveredOption('1,1');
    expect(scaleOf()).toBe(1);
    // The fogged option stays under the main dim: its hex is one of the dimmed tiles.
    expect(dims.reduce((n, d) => n + d.count, 0)).toBe(3);
    layer.dispose();
  });

  it('a hover on a hex with no option ring hides them all', () => {
    const layer = createStageFocusLayer({ lit: ['1,0'], options: [{ hexKey: '2,0', tone: 'compulsion', ringOnly: false, hovered: false }], strength: STAGE_MAP_DIM }, tiles);
    layer.setHoveredOption('0,0');
    expect(layer.getHoveredOption()).toBeNull();
    layer.dispose();
  });

  it('the dashes split each edge by STAGE_OPTION_RING_DASH', () => {
    const spans = dashSpans();
    expect(spans[0]).toEqual([0, 0.18]);
    expect(spans.length).toBe(4);
    for (const [a, b] of spans) expect(b).toBeGreaterThan(a);
  });

  it('the ring is parchment, not the frontier gold', () => {
    const layer = createStageFocusLayer({ lit: ['1,0'], options: [], strength: STAGE_MAP_DIM }, tiles);
    const ring = layer.group.children.find(c => c instanceof THREE.Mesh && !(c instanceof THREE.InstancedMesh)) as THREE.Mesh;
    const color = (ring.material as THREE.MeshBasicMaterial).color.getHexString();
    expect(color).not.toBe('d4a040');
    layer.dispose();
  });
});
