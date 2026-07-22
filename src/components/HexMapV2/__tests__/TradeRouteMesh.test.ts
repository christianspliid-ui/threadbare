/**
 * Tests: TradeRouteMesh (THR-670) — bucket split, geometry, dispose.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createTradeRouteLayer, TRADE_ROUTE_OPACITY } from '../scene/TradeRouteMesh';
import type { TradeRouteLine } from '../../../engine/tradeRouteMarkers';

const line = (id: string, threatened: boolean, volume = 1): TradeRouteLine => ({
  id, from: { col: 0, row: 0 }, to: { col: 3, row: 1 },
  volume, threatened, goods: ['grain'], carriesStaple: true,
});

describe('TradeRouteMesh (THR-670)', () => {
  it('splits healthy and threatened routes into separate meshes', () => {
    const layer = createTradeRouteLayer([line('a', false), line('b', true), line('c', false)]);
    expect(layer.group.children).toHaveLength(2);
    const meshes = layer.group.children as THREE.Mesh[];
    // 2 healthy quads (12 verts) vs 1 threatened quad (6 verts)
    const counts = meshes.map((m) => m.geometry.getAttribute('position').count).sort((a, b) => a - b);
    expect(counts).toEqual([6, 12]);
    for (const m of meshes) {
      expect((m.material as THREE.MeshBasicMaterial).opacity).toBe(TRADE_ROUTE_OPACITY);
      expect((m.material as THREE.MeshBasicMaterial).transparent).toBe(true);
    }
    layer.dispose();
    expect(layer.group.children).toHaveLength(0);
  });

  it('renders nothing for an empty route set', () => {
    const layer = createTradeRouteLayer([]);
    expect(layer.group.children).toHaveLength(0);
    layer.dispose();
  });
});
