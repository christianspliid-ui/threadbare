/**
 * RivalInfluenceMesh (THR-66, THR-829) — one sphere-tinted outline per marker.
 *
 * The load-bearing assertion is `depthTest: false`: scheme targets are
 * settlements whose models stand far above this layer's Z, so a depth-tested
 * outline was hidden under the city on exactly the hexes it marks (measured in
 * the THR-829 browser capture — zero marker pixels until depth testing was off).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createRivalInfluenceLayer } from '../RivalInfluenceMesh';
import type { RivalInfluenceMarker } from '../../../../engine/rivalInfluenceMarkers';

const MARKERS: RivalInfluenceMarker[] = [
  { col: 6, row: 7, color: '#33ff77', rivalId: 'actor_rival_1', targetId: 'loc_0', reason: 'scheme' },
  { col: 15, row: 3, color: '#ffe44d', rivalId: 'actor_rival_3', targetId: 'loc_x', reason: 'source_contested' },
];

describe('createRivalInfluenceLayer', () => {
  it('builds one tinted LineLoop per marker, drawn over settlement models', () => {
    const layer = createRivalInfluenceLayer(MARKERS);
    expect(layer.group.children).toHaveLength(2);
    for (const [i, child] of layer.group.children.entries()) {
      expect(child).toBeInstanceOf(THREE.LineLoop);
      const mat = (child as THREE.LineLoop).material as THREE.LineBasicMaterial;
      expect('#' + mat.color.getHexString()).toBe(MARKERS[i].color);
      expect(mat.depthTest).toBe(false);
    }
    layer.dispose();
    expect(layer.group.children).toHaveLength(0);
  });

  it('is empty for no markers (fail-soft)', () => {
    expect(createRivalInfluenceLayer([]).group.children).toHaveLength(0);
  });
});
